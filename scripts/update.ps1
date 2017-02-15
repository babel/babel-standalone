# Checks for updates to Babel. If a new version is available, upgrades the Babel references in
# package.json to the new version, commits the new package.json, and pushes it to Github.

param(
  [switch] $Clean = $false
)

$ErrorActionPreference = "Stop";
Set-StrictMode -Version Latest

. ./scripts/config.ps1

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
    -Uri ('https://api.github.com/repos/{0}/{1}/releases?access_token={2}' -f $global:config.github_user, $global:config.github_repo, $global:config.github_token) `
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
    -Uri ('{0}?name={1}&access_token={2}' -f $upload_url, $filename, $global:config.github_token) `
    -Method Post `
    -ContentType 'text/javascript' `
    -Body (Get-Content -Path $Path -Raw -Encoding UTF8) | Out-Null

    Write-Output ('Uploaded ' + $filename)
}

############################

if ($Clean) {
  Write-Output "Cleaning working directory"
  git reset --hard HEAD
  git clean -fd
  git pull
}

.\node_modules\.bin\npm-check-updates -a /^babel/; Assert-LastExitCode

$package_json = Get-Content -Path package.json | ConvertFrom-Json
$babel_version = Get-LatestDependencyVersion -Package $package_json -Filter 'babel\-'
if (([Version]$package_json.version) -ge $babel_version) {
  Write-Output ('Current version ({0}) is the latest' -f $package_json.version)
  Exit
}

Write-Output ('Current version is {0}, latest Babel version is {1}' -f $package_json.version, $babel_version)

Set-PackageVersion -Package $package_json -Version $babel_version
npm install; Assert-LastExitCode

Write-Output 'Building and running tests'
npm run build; Assert-LastExitCode
npm run test; Assert-LastExitCode

Write-Output 'Build looks okay, committing and pushing changes'
git commit -m ('Upgrade to Babel {0}' -f $babel_version) --author='DanBuild <build@dan.cx>' package.json; Assert-LastExitCode
git tag -a ('release-' + $babel_version) -m ('Automated upgrade to Babel {0}' -f $babel_version); Assert-LastExitCode

# Push to Github
git push origin master --follow-tags; Assert-LastExitCode

# Push to npm
npm publish

# Push to GitHub releases
Write-Output "Creating GitHub release..."
$release = New-GitHubRelease -Version $babel_version
Add-GitHubReleaseAsset -Release $release -Path ./babel.js
Add-GitHubReleaseAsset -Release $release -Path ./babel.min.js
Add-GitHubReleaseAsset -Release $release -Path ./packages/babili-standalone/babili.js
Add-GitHubReleaseAsset -Release $release -Path ./packages/babili-standalone/babili.min.js

Write-Output 'DONE!'
