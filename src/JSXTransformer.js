import * as Babel from 'babel-core'
import Rx from 'rx-dom'

Rx.DOM.ready().subscribe(run)

function run() {
  const scriptTags = document.querySelectorAll('script[type="text/babel"]')
  return Rx.Observable
  .from(scriptTags)
  .map(handleInlineScripts)
  .map(handleExternalScripts)
  .flatMap(script => script)
  .map(transform)
  .subscribe(execute)
}

function handleInlineScripts(scriptTag) {
  return {
    path: scriptTag.src,
    source: scriptTag.innerHTML
  }
}

function handleExternalScripts(script) {
  if (!script.source && script.path) {
    return Rx.DOM.get(script.path).map(data => ({
      path: script.src,
      source: data.response
    }))
  } else {
    return [script]
  }
}

function transform(script) {
  var options = {
    presets: [
      require('babel-preset-react'),
      require('babel-preset-es2015'),
    ],
    plugins: [
      require('babel-plugin-transform-class-properties'),
      require('babel-plugin-transform-object-rest-spread'),
      require('babel-plugin-transform-flow-strip-types'),
    ],
    sourceMaps: 'inline',
  }
  options.filename = script.name

  return Babel.transform(script.source, options).code
}

function execute(code) {
  var newScript = document.createElement('script');
  newScript.text = code
  document.head.appendChild(newScript);
}
