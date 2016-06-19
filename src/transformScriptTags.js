/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of the React source tree. An additional
 * grant of patent rights can be found in the PATENTS file in the same directory.
 */

// The options we'll pass will be pretty inline with what we're expecting people
// to write. It won't cover every use case but will set ES2015 as the baseline
// and transform JSX. We'll also support 2 in-process syntaxes since they are
// commonly used with React: class properties, Flow types, & object rest spread.
const babelOpts = {
  presets: [
    'react',
    'es2015',
  ],
  plugins: [
    'transform-class-properties',
    'transform-object-rest-spread',
    'transform-flow-strip-types',
  ],
  sourceMaps: 'inline',
};

const scriptTypes = [
  'text/jsx',
  'text/babel',
];

let headEl;
let inlineScriptCount = 0;

/**
 * Actually transform the code.
 */
function transformCode(transformFn, code, url) {
  let source;
  if (url != null) {
    source = url;
  } else {
    source = 'Inline Babel script';
    inlineScriptCount++;
    if (inlineScriptCount > 1) {
      source += ' (' + inlineScriptCount + ')';
    }
  }

  return transformFn(
    code,
    {
      filename: source,
      ...babelOpts
    }
  ).code;
}


/**
 * Appends a script element at the end of the <head> with the content of code,
 * after transforming it.
 */
function run(transformFn, code, url, options) {
  const scriptEl = document.createElement('script');
  scriptEl.text = transformCode(transformFn, code, url, options);
  headEl.appendChild(scriptEl);
}

/**
 * Load script from the provided url and pass the content to the callback.
 */
function load(url, successCallback, errorCallback) {
  const xhr = new XMLHttpRequest();

  // async, however scripts will be executed in the order they are in the
  // DOM to mirror normal script loading.
  xhr.open('GET', url, true);
  if ('overrideMimeType' in xhr) {
    xhr.overrideMimeType('text/plain');
  }
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 0 || xhr.status === 200) {
        successCallback(xhr.responseText);
      } else {
        errorCallback();
        throw new Error('Could not load ' + url);
      }
    }
  };
  return xhr.send(null);
}

/**
 * Loop over provided script tags and get the content, via innerHTML if an
 * inline script, or by using XHR. Transforms are applied if needed. The scripts
 * are executed in the order they are found on the page.
 */
function loadScripts(transformFn, scripts) {
  const result = [];
  const count = scripts.length;

  function check() {
    var script, i;

    for (i = 0; i < count; i++) {
      script = result[i];

      if (script.loaded && !script.executed) {
        script.executed = true;
        run(transformFn, script.content, script.url);
      } else if (!script.loaded && !script.error && !script.async) {
        break;
      }
    }
  }

  scripts.forEach((script, i) => {
    // script.async is always true for non-JavaScript script tags
    var async = script.hasAttribute('async');

    if (script.src) {
      result[i] = {
        async: async,
        error: false,
        executed: false,
        content: null,
        loaded: false,
        url: script.src,
      };

      load(
        script.src,
        content => {
          result[i].loaded = true;
          result[i].content = content;
          check();
        },
        () => {
          result[i].error = true;
          check();
        }
      );
    } else {
      result[i] = {
        async: async,
        error: false,
        executed: false,
        content: script.innerHTML,
        loaded: true,
        url: null,
      };
    }
  });

  check();
}

/**
 * Find and run all script tags with type="text/jsx".
 */
export function runScripts(transformFn) {
  headEl = document.getElementsByTagName('head')[0];
  const scripts = document.getElementsByTagName('script');

  // Array.prototype.slice cannot be used on NodeList on IE8
  const jsxScripts = [];
  for (let i = 0; i < scripts.length; i++) {
    const script = scripts.item(i);
    // Support the old type="text/jsx;harmony=true"
    const type = script.type.split(';')[0];
    if (scriptTypes.indexOf(type) !== -1) {
      jsxScripts.push(script);
    }
  }

  if (jsxScripts.length === 0) {
    return;
  }

  console.warn(
    'You are using the in-browser Babel transformer. Be sure to precompile ' +
    'your scrips for production - https://babeljs.io/docs/setup/'
  );

  loadScripts(transformFn, jsxScripts);
}
