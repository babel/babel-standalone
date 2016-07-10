#!/usr/bin/env node

/**
 * Updates the Babel version in package.json to the latest available version.
 */

const Promise = require("bluebird");

const childProcess = require('child-process-promise');
const fs = require('fs');
const git = require('simple-git');
const npmCheckUpdates = require('npm-check-updates');
const path = require('path');
const semverCompare = require('semver-compare');

const npmi = Promise.promisify(require('npmi'));
const writeFile = Promise.promisify(fs.writeFile);

const rootPath = path.join(__dirname, '..');
const packagePath = path.join(rootPath, 'package.json');

function checkPackageVersion() {
  const package = require(packagePath);
  const currentVersion = package.version;
  const latestBabelVersion = Object.keys(package.devDependencies)
    .filter(name => name.indexOf('babel') === 0)
    .map(name => package.devDependencies[name].replace('^', ''))
    .reduce((a, b) => semverCompare(a, b) > 0 ? a : b);

  if (semverCompare(currentVersion, latestBabelVersion) >= 0) {
    console.log('Current version (%s) is the latest', currentVersion);
    return [false, latestBabelVersion];
  }

  console.log(
    'Current version is %s, latest Babel version is %s',
    currentVersion,
    latestBabelVersion
  );
  return [true, latestBabelVersion];
}

function updatePackageVersion(newVersion) {
  console.log('Installing packages...');
  return npmi({
    path: rootPath,
  }).then(() => {
    console.log('Updating version in package.json');
    var package = require(packagePath);
    package.version = newVersion;
    return writeFile(
      packagePath,
      JSON.stringify(package, null, 2) + '\n'
    );
  });
}

function spawnNode(command, args = []) {
  return childProcess.spawn(
    path.join('node_modules', '.bin', command),
    args,
    {
      cwd: rootPath,
      // Ensure gulp.cmd runs properly on Windows
      shell: true,
      stdio: 'inherit',
    }
  );
}

function build() {
  console.log('Building');
  return spawnNode('gulp')
}

function test() {
  console.log('Running tests');
  return spawnNode('mocha');
}

function commitAndPushChanges() {
  console.log('Committing and pushing changes');
  const version = require(packagePath).version;
  return git(rootPath)
    .commit('Upgrade to Babel ' + version, packagePath, {
      '--author': 'DanBuild <build@dan.cx>'
    })
    .push('origin', 'master');
}

console.log('Checking for updates...');
var version;
npmCheckUpdates.run({
  packageFile: packagePath,
  upgrade: true,
  upgradeAll: true,
})
  .then(() => {
    const [needsUpdate, latestBabelVersion] = checkPackageVersion();
    if (!needsUpdate) {
      process.exit(1);
    }
    version = latestBabelVersion;
    return updatePackageVersion(latestBabelVersion);
  })
  .then(build)
  .then(test)
  .then(commitAndPushChanges);
