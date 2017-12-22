import * as Babel from 'babel-core';

import {runScripts} from './transformScriptTags';

const isArray = Array.isArray || (arg => Object.prototype.toString.call(arg) === '[object Array]');

/**
 * Loads the given name (or [name, options] pair) from the given table object
 * holding the available presets or plugins.
 *
 * Returns undefined if the preset or plugin is not available; passes through
 * name unmodified if it (or the first element of the pair) is not a string.
 */
function loadBuiltin(builtinTable, name) {
  if (isArray(name) && typeof name[0] === 'string') {
    if (builtinTable.hasOwnProperty(name[0])) {
      return [builtinTable[name[0]]].concat(name.slice(1));
    }
    return;
  } else if (typeof name === 'string') {
    return builtinTable[name];
  }
  // Could be an actual preset/plugin module
  return name;
}

/**
 * Parses plugin names and presets from the specified options.
 */
function processOptions(options) {
  // Parse preset names
  const presets = (options.presets || []).map(presetName => {
    const preset = loadBuiltin(availablePresets, presetName);

    if (preset) {
      // workaround for babel issue
      // at some point, babel copies the preset, losing the non-enumerable
      // buildPreset key; convert it into an enumerable key.
      if (isArray(preset) && typeof preset[0] === 'object' && preset[0].hasOwnProperty('buildPreset')) {
        preset[0] = { ...preset[0], buildPreset: preset[0].buildPreset }
      }
    } else {
      throw new Error(`Invalid preset specified in Babel options: "${presetName}"`);
    }
    return preset;
  });

  // Parse plugin names
  const plugins = (options.plugins || []).map(pluginName => {
    const plugin = loadBuiltin(availablePlugins, pluginName);

    if (!plugin) {
      throw new Error(`Invalid plugin specified in Babel options: "${pluginName}"`);
    }
    return plugin;
  });

  return {
    babelrc: false,
    ...options,
    presets,
    plugins,
  }
}

export function transform(code, options) {
  return Babel.transform(code, processOptions(options));
}

export function transformFromAst(ast, code, options) {
  return Babel.transformFromAst(ast, code, processOptions(options));
}
export const availablePlugins = {};
export const availablePresets = {};
export const buildExternalHelpers = Babel.buildExternalHelpers;
/**
 * Registers a named plugin for use with Babel.
 */
export function registerPlugin(name, plugin) {
  if (availablePlugins.hasOwnProperty(name)) {
    console.warn(`A plugin named "${name}" is already registered, it will be overridden`);
  }
  availablePlugins[name] = plugin;
}
/**
 * Registers multiple plugins for use with Babel. `newPlugins` should be an object where the key
 * is the name of the plugin, and the value is the plugin itself.
 */
export function registerPlugins(newPlugins) {
  Object.keys(newPlugins).forEach(name => registerPlugin(name, newPlugins[name]));
}

/**
 * Registers a named preset for use with Babel.
 */
export function registerPreset(name, preset) {
  if (availablePresets.hasOwnProperty(name)) {
    console.warn(`A preset named "${name}" is already registered, it will be overridden`);
  }
  availablePresets[name] = preset;
}
/**
 * Registers multiple presets for use with Babel. `newPresets` should be an object where the key
 * is the name of the preset, and the value is the preset itself.
 */
export function registerPresets(newPresets) {
  Object.keys(newPresets).forEach(name => registerPreset(name, newPresets[name]));
}


// All the plugins we should bundle
registerPlugins({
  'check-es2015-constants': require('babel-plugin-check-es2015-constants'),
  'external-helpers': require('babel-plugin-external-helpers'),
  'inline-replace-variables': require('babel-plugin-inline-replace-variables'),
  'syntax-async-functions': require('babel-plugin-syntax-async-functions'),
  'syntax-async-generators': require('babel-plugin-syntax-async-generators'),
  'syntax-class-constructor-call': require('babel-plugin-syntax-class-constructor-call'),
  'syntax-class-properties': require('babel-plugin-syntax-class-properties'),
  'syntax-decorators': require('babel-plugin-syntax-decorators'),
  'syntax-do-expressions': require('babel-plugin-syntax-do-expressions'),
  'syntax-exponentiation-operator': require('babel-plugin-syntax-exponentiation-operator'),
  'syntax-export-extensions': require('babel-plugin-syntax-export-extensions'),
  'syntax-flow': require('babel-plugin-syntax-flow'),
  'syntax-function-bind': require('babel-plugin-syntax-function-bind'),
  'syntax-function-sent': require('babel-plugin-syntax-function-sent'),
  'syntax-jsx': require('babel-plugin-syntax-jsx'),
  'syntax-object-rest-spread': require('babel-plugin-syntax-object-rest-spread'),
  'syntax-trailing-function-commas': require('babel-plugin-syntax-trailing-function-commas'),
  'transform-async-functions': require('babel-plugin-transform-async-functions'),
  'transform-async-to-generator': require('babel-plugin-transform-async-to-generator'),
  'transform-async-to-module-method': require('babel-plugin-transform-async-to-module-method'),
  'transform-class-constructor-call': require('babel-plugin-transform-class-constructor-call'),
  'transform-class-properties': require('babel-plugin-transform-class-properties'),
  'transform-decorators': require('babel-plugin-transform-decorators'),
  'transform-decorators-legacy': require('babel-plugin-transform-decorators-legacy').default, // <- No clue. Nope.
  'transform-do-expressions': require('babel-plugin-transform-do-expressions'),
  'transform-es2015-arrow-functions': require('babel-plugin-transform-es2015-arrow-functions'),
  'transform-es2015-block-scoped-functions': require('babel-plugin-transform-es2015-block-scoped-functions'),
  'transform-es2015-block-scoping': require('babel-plugin-transform-es2015-block-scoping'),
  'transform-es2015-classes': require('babel-plugin-transform-es2015-classes'),
  'transform-es2015-computed-properties': require('babel-plugin-transform-es2015-computed-properties'),
  'transform-es2015-destructuring': require('babel-plugin-transform-es2015-destructuring'),
  'transform-es2015-duplicate-keys': require('babel-plugin-transform-es2015-duplicate-keys'),
  'transform-es2015-for-of': require('babel-plugin-transform-es2015-for-of'),
  'transform-es2015-function-name': require('babel-plugin-transform-es2015-function-name'),
  'transform-es2015-instanceof': require('babel-plugin-transform-es2015-instanceof'),
  'transform-es2015-literals': require('babel-plugin-transform-es2015-literals'),
  'transform-es2015-modules-amd': require('babel-plugin-transform-es2015-modules-amd'),
  'transform-es2015-modules-commonjs': require('babel-plugin-transform-es2015-modules-commonjs'),
  'transform-es2015-modules-systemjs': require('babel-plugin-transform-es2015-modules-systemjs'),
  'transform-es2015-modules-umd': require('babel-plugin-transform-es2015-modules-umd'),
  'transform-es2015-object-super': require('babel-plugin-transform-es2015-object-super'),
  'transform-es2015-parameters': require('babel-plugin-transform-es2015-parameters'),
  'transform-es2015-shorthand-properties': require('babel-plugin-transform-es2015-shorthand-properties'),
  'transform-es2015-spread': require('babel-plugin-transform-es2015-spread'),
  'transform-es2015-sticky-regex': require('babel-plugin-transform-es2015-sticky-regex'),
  'transform-es2015-template-literals': require('babel-plugin-transform-es2015-template-literals'),
  'transform-es2015-typeof-symbol': require('babel-plugin-transform-es2015-typeof-symbol'),
  'transform-es2015-unicode-regex': require('babel-plugin-transform-es2015-unicode-regex'),
  'transform-es3-member-expression-literals': require('babel-plugin-transform-es3-member-expression-literals'),
  'transform-es3-property-literals': require('babel-plugin-transform-es3-property-literals'),
  'transform-es5-property-mutators': require('babel-plugin-transform-es5-property-mutators'),
  'transform-eval': require('babel-plugin-transform-eval'),
  'transform-exponentiation-operator': require('babel-plugin-transform-exponentiation-operator'),
  'transform-export-extensions': require('babel-plugin-transform-export-extensions'),
  'transform-flow-comments': require('babel-plugin-transform-flow-comments'),
  'transform-flow-strip-types': require('babel-plugin-transform-flow-strip-types'),
  'transform-function-bind': require('babel-plugin-transform-function-bind'),
  'transform-jscript': require('babel-plugin-transform-jscript'),
  'transform-object-assign': require('babel-plugin-transform-object-assign'),
  'transform-object-rest-spread': require('babel-plugin-transform-object-rest-spread'),
  'transform-object-set-prototype-of-to-assign': require('babel-plugin-transform-object-set-prototype-of-to-assign'),
  'transform-proto-to-assign': require('babel-plugin-transform-proto-to-assign'),
  'transform-react-constant-elements': require('babel-plugin-transform-react-constant-elements'),
  'transform-react-display-name': require('babel-plugin-transform-react-display-name'),
  'transform-react-inline-elements': require('babel-plugin-transform-react-inline-elements'),
  'transform-react-jsx': require('babel-plugin-transform-react-jsx'),
  'transform-react-jsx-compat': require('babel-plugin-transform-react-jsx-compat'),
  'transform-react-jsx-self': require('babel-plugin-transform-react-jsx-self'),
  'transform-react-jsx-source': require('babel-plugin-transform-react-jsx-source'),
  'transform-regenerator': require('babel-plugin-transform-regenerator'),
  'transform-runtime': require('babel-plugin-transform-runtime'),
  'transform-strict-mode': require('babel-plugin-transform-strict-mode'),
  'undeclared-variables-check': require('babel-plugin-undeclared-variables-check'),
});

// All the presets we should bundle
registerPresets({
  es2015: require('babel-preset-es2015'),
  es2016: require('babel-preset-es2016'),
  es2017: require('babel-preset-es2017'),
  latest: require('babel-preset-latest'),
  react: require('babel-preset-react'),
  'stage-0': require('babel-preset-stage-0'),
  'stage-1': require('babel-preset-stage-1'),
  'stage-2': require('babel-preset-stage-2'),
  'stage-3': require('babel-preset-stage-3'),

  // ES2015 preset with es2015-modules-commonjs removed
  // Plugin list copied from babel-preset-es2015/index.js
  'es2015-no-commonjs': {
    plugins: [
      require("babel-plugin-transform-es2015-template-literals"),
      require("babel-plugin-transform-es2015-literals"),
      require("babel-plugin-transform-es2015-function-name"),
      require("babel-plugin-transform-es2015-arrow-functions"),
      require("babel-plugin-transform-es2015-block-scoped-functions"),
      require("babel-plugin-transform-es2015-classes"),
      require("babel-plugin-transform-es2015-object-super"),
      require("babel-plugin-transform-es2015-shorthand-properties"),
      require("babel-plugin-transform-es2015-computed-properties"),
      require("babel-plugin-transform-es2015-for-of"),
      require("babel-plugin-transform-es2015-sticky-regex"),
      require("babel-plugin-transform-es2015-unicode-regex"),
      require("babel-plugin-check-es2015-constants"),
      require("babel-plugin-transform-es2015-spread"),
      require("babel-plugin-transform-es2015-parameters"),
      require("babel-plugin-transform-es2015-destructuring"),
      require("babel-plugin-transform-es2015-block-scoping"),
      require("babel-plugin-transform-es2015-typeof-symbol"),
      [require("babel-plugin-transform-regenerator"), { async: false, asyncGenerators: false }],
    ]
  },

  // ES2015 preset with plugins set to loose mode.
  // Based off https://github.com/bkonkle/babel-preset-es2015-loose/blob/master/index.js
  'es2015-loose': {
    plugins: [
      [require("babel-plugin-transform-es2015-template-literals"), { loose: true }],
      require("babel-plugin-transform-es2015-literals"),
      require("babel-plugin-transform-es2015-function-name"),
      require("babel-plugin-transform-es2015-arrow-functions"),
      require("babel-plugin-transform-es2015-block-scoped-functions"),
      [require("babel-plugin-transform-es2015-classes"), { loose: true }],
      require("babel-plugin-transform-es2015-object-super"),
      require("babel-plugin-transform-es2015-shorthand-properties"),
      require("babel-plugin-transform-es2015-duplicate-keys"),
      [require("babel-plugin-transform-es2015-computed-properties"), { loose: true }],
      [require("babel-plugin-transform-es2015-for-of"), { loose: true }],
      require("babel-plugin-transform-es2015-sticky-regex"),
      require("babel-plugin-transform-es2015-unicode-regex"),
      require("babel-plugin-check-es2015-constants"),
      [require("babel-plugin-transform-es2015-spread"), { loose: true }],
      require("babel-plugin-transform-es2015-parameters"),
      [require("babel-plugin-transform-es2015-destructuring"), { loose: true }],
      require("babel-plugin-transform-es2015-block-scoping"),
      require("babel-plugin-transform-es2015-typeof-symbol"),
      [require("babel-plugin-transform-es2015-modules-commonjs"), { loose: true }],
      [require("babel-plugin-transform-regenerator"), { async: false, asyncGenerators: false }],
    ]
  },
});

export const version = VERSION;

// Listen for load event if we're in a browser and then kick off finding and
// running of scripts with "text/babel" type.
if (typeof window !== 'undefined' && window && window.addEventListener) {
  window.addEventListener('DOMContentLoaded', transformScriptTags, false);
}

/**
 * Transform <script> tags with "text/babel" type.
 * @param {Array} scriptTags specify script tags to transform, transform all in the <head> if not given
 */
export function transformScriptTags(scriptTags) {
  runScripts(transform, scriptTags);
}

/**
 * Disables automatic transformation of <script> tags with "text/babel" type.
 */
export function disableScriptTags() {
  window.removeEventListener('DOMContentLoaded', transformScriptTags);
}
