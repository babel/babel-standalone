# Checks for updates to Babel. If a new version is available, upgrades the Babel references in
# package.json to the new version, commits the new package.json, and pushes it to Github.

param(
  [switch] $Clean = $false,
  [switch] $PublishNpm = $true
)

$ErrorActionPreference = "Stop";
Set-StrictMode -Version Latest

############################


# Formats JSON in a nicer format than the built-in ConvertTo-Json does.
function Format-Json([Parameter(Mandatory, ValueFromPipeline)][String] $json) {
  $indent = 0;
  ($json -Split '\n' |
    % {
      if ($_ -match '[\}\]]') {
        # This line contains  ] or }, decrement the indentation level
        $indent--
      }
      $line = (' ' * $indent * 2) + $_.TrimStart().Replace(':  ', ': ')
      if ($_ -match '[\{\[]') {
        # This line contains [ or {, increment the indentation level
        $indent++
      }
      $line
  }) -Join "`n"
}

# Gets the latest version of a dependency from package.json
function Get-LatestDependencyVersion(
  [Parameter(Mandatory)] [PSCustomObject] $package,
  [Parameter(Mandatory)] [String] $filter
) {
  $relevant_packages = $package.devDependencies.PSObject.Members |
    Where-Object { $_.MemberType -eq 'NoteProperty' -and $_.Name -match $filter}
  $latest_version = ([Version] $relevant_packages[0].Value)

  foreach ($package in $relevant_packages) {
    $version = ([Version] $package.Value)
    if ($version -gt $latest_version) {
      $latest_version = $version
    }
  }

  $latest_version
}

# Sets the version number in package.json
function Set-PackageVersion(
  [Parameter(Mandatory)] [PSCustomObject] $Package,
  [Parameter(Mandatory)] [String] $Version
) {
  Write-Output 'Updating version in package.json'
  $Package.version = $Version
  Set-Content -Path 'package.json' -Value (ConvertTo-Json $Package | Format-Json)
}

# Checks that the last ran command returned with an exit code of 0
function Assert-LastExitCode {
  if ($LASTEXITCODE -ne 0) {
    throw 'Non-zero exit code encountered'
  }
}

function New-GitHubRelease(
  [Parameter(Mandatory)] [String] $Version
) {
  Invoke-RestMethod `
    -Uri ('https://api.github.com/repos/{0}/{1}/releases?access_token={2}' -f $Env:GITHUB_USER, $Env:GITHUB_REPO, $Env:GITHUB_TOKEN) `
    -Method Post `
    -Body (@{
      body = 'Automated upgrade to Babel ' + $version
      draft = $false
      name = $version
      tag_name = 'release-' + $version
    } | ConvertTo-Json)
}

function Add-GitHubReleaseAsset(
  [Parameter(Mandatory)] [PSCustomObject] $Release,
  [Parameter(Mandatory)] [String] $Path
) {
  $filename = Split-Path -Path $Path -Leaf
  $upload_url = $release.upload_url -replace '{.+', ''
  Invoke-WebRequest `
    -Uri ('{0}?name={1}&access_token={2}' -f $upload_url, $filename, $Env:GITHUB_TOKEN) `
    -Method Post `
    -ContentType 'text/javascript; charset=utf-8' `
    -UseBasicParsing `
    -Body (Get-Content -Path $Path -Raw -Encoding UTF8) | Out-Null

  Write-Output ('Uploaded ' + $filename)
}

############################

# Ensure environment is good
if (!$Env:GITHUB_USER -or !$Env:GITHUB_REPO -or !$Env:GITHUB_TOKEN) {
  Write-Error 'GITHUB_USER, GITHUB_REPO and GITHUB_TOKEN must be set'
  Exit 1
}

if ($Clean) {
  Write-Output "Cleaning working directory"
  git reset --hard HEAD
  git clean -fd
  git pull
}

# We need to run npm install in order to be able to use npm-check-updates
npm install; Assert-LastExitCode
#.\node_modules\.bin\npm-check-updates -u -a --packageFile ./package.json /^babel\-(plugin|preset|core)/; Assert-LastExitCode
.\node_modules\.bin\npm-check-updates -u -a --packageFile ./package.json /^babel\-plugin/; Assert-LastExitCode
.\node_modules\.bin\npm-check-updates -u -a --packageFile ./package.json /^babel\-preset/; Assert-LastExitCode
.\node_modules\.bin\npm-check-updates -u -a --packageFile ./package.json /^babel\-core/; Assert-LastExitCode

$package_json = Get-Content -Path package.json | ConvertFrom-Json
$babel_version = Get-LatestDependencyVersion -Package $package_json -Filter 'babel\-(plugin|preset|core)'
if (([Version]$package_json.version) -ge $babel_version) {
  Write-Output ('Current version ({0}) is the latest' -f $package_json.version)
  Exit
}

Write-Output ('Current version is {0}, latest Babel version is {1}' -f $package_json.version, $babel_version)

Set-PackageVersion -Package $package_json -Version $babel_version
# Re-run npm install fresh in order to install any updated packages
# This clears out the node_modules directory so that it has the most efficient
# directory structure possible.
Remove-Item node_modules -Recurse
npm install; Assert-LastExitCode

Write-Output 'Building and running tests'
npm run build; Assert-LastExitCode
npm run test; Assert-LastExitCode

Write-Output 'Build looks okay, committing and pushing changes'
git commit -m ('Upgrade to Babel {0}' -f $babel_version) --author='DanBuild <build@dan.cx>' package.json; Assert-LastExitCode
git tag -a ('release-' + $babel_version) -m ('Automated upgrade to Babel {0}' -f $babel_version); Assert-LastExitCode

# Push to Github
git push origin master --follow-tags; Assert-LastExitCode

# Push to GitHub releases
Write-Output "Creating GitHub release..."
$release = New-GitHubRelease -Version $babel_version
Add-GitHubReleaseAsset -Release $release -Path ./babel.js
Add-GitHubReleaseAsset -Release $release -Path ./babel.min.js
Add-GitHubReleaseAsset -Release $release -Path ./packages/babili-standalone/babili.js
Add-GitHubReleaseAsset -Release $release -Path ./packages/babili-standalone/babili.min.js

# Push to npm
if ($PublishNpm) {
  npm publish
}

Write-Output 'DONE!'
