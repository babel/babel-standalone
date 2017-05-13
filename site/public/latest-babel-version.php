<?php
// Determines the latest stable version of Babel.

require(__DIR__.'/../vendor/autoload.php');
set_time_limit(120); // Just in case

use GuzzleHttp\Client;
use GuzzleHttp\Promise;

const CACHE_KEY = 'babel_version';

function get_latest_version() {
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
    if (preg_match('/^babel\-(plugin|preset|core)/', $name)) {
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
    if (version_compare($version, $latest_version, '>')) {
      $latest_version = $version;
    }
  }
  return $latest_version;
}

// Check if a value was already cached to throttle the number of times we send
// network requests.
$latest_version = apcu_fetch(CACHE_KEY);
if (!$latest_version) {
  $latest_version = get_latest_version();
  apcu_store(CACHE_KEY, $latest_version, 60);
}

echo $latest_version;
