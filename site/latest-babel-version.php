<?php
// Determines the latest stable version of Babel.

require(__DIR__.'/vendor/autoload.php');
set_time_limit(120); // Just in case

use GuzzleHttp\Client;
use GuzzleHttp\Promise;

// Prefix for dependencies to look at in package.json
const PREFIX = 'babel-';
// Packages to exclude when determining the latest Babel version
$blacklist = [
  'babel-loader' => true,
];

// Get babel-standalone package.json
$client = new Client();
$response = $client->get('https://raw.githubusercontent.com/babel/babel-standalone/master/package.json', [
  'headers' => [
    'User-Agent' => 'Babel-Standalone-Update-Checker/1.0',
  ],
]);
$manifest = json_decode((string)$response->getBody());

// Load all the package metadata for all the dependencies, in parallel
$promises = [];
foreach ($manifest->devDependencies as $name => $version) {
  if (substr($name, 0, strlen(PREFIX)) === PREFIX) {
    $promises[$name] = $client->getAsync('https://registry.npmjs.com/'.$name, [
      'headers' => [
        'Accept' => 'application/vnd.npm.install-v1+json',
        'User-Agent' => 'Babel-Standalone-Update-Checker/1.0',
      ],
    ]);
  }
}
$responses = Promise\unwrap($promises);

// Find the latest version number
$latest_version = '';
foreach ($responses as $name => $response) {
  $result = json_decode((string)$response->getBody());
  $version = $result->{'dist-tags'}->latest;
  if (
    !array_key_exists($name, $blacklist) &&
    version_compare($version, $latest_version, '>')
  ) {
    $latest_version = $version;
  }
}

// Boom
echo $latest_version;
