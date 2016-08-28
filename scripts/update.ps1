# Checks for updates to Babel. If a new version is available, upgrades the Babel references in 
# package.json to the new version, commits the new package.json, and pushes it to Github.

Set-StrictMode -Version Latest 

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
 
.\node_modules\.bin\npm-check-updates -a; Assert-LastExitCode

$package_json = Get-Content -Path package.json | ConvertFrom-Json
$babel_version = Get-LatestDependencyVersion -Package $package_json -Filter 'babel\-'
if (([Version]$package_json.version) -ge $babel_version) {
  Write-Output ('Current version ({0}) is the latest' -f $package_json.version)
  Exit
}

Write-Output ('Current version is {0}, latest Babel version is {1}' -f $package_json.version, $babel_version)

npm install; Assert-LastExitCode
 
Write-Output 'Building and running tests'
npm run build; Assert-LastExitCode
npm run test; Assert-LastExitCode

Write-Output 'Build looks okay, committing and pushing changes'
Set-PackageVersion -Package $package_json -Version $babel_version
git commit -m ('Upgrade to Babel {0}' -f $babel_version) --author='DanBuild <build@dan.cx>' package.json; Assert-LastExitCode
git tag -a ('release-TES2T-' + $babel_version) -m ('Automated upgrade to Babel {0}' -f $babel_version); Assert-LastExitCode
git push origin master --follow-tags; Assert-LastExitCode

Write-Output 'DONE!'