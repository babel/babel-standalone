import * as Babel from 'babel-core';

/**
 * Parses plugin names and presets from the specified options.
 */
function processOptions(options) {
  // Parse preset names
  const presets = (options.presets || []).map(presetName => {
    if (typeof presetName === 'string') {
      var preset = availablePresets[presetName];
      if (!preset) {
        throw new Error(`Invalid preset specified in Babel options: "${presetName}"`);
      }
      return preset;
    } else {
      // Could be an actual preset module
      return presetName;
    }
  });

  // Parse plugin names
  const plugins = (options.plugins || []).map(pluginName => {
    if (typeof pluginName === 'string') {
      var plugin = availablePlugins[pluginName];
      if (!plugin) {
        throw new Error(`Invalid plugin specified in Babel options: "${pluginName}"`);
      }
      return plugin;
    } else {
      // Could be an actual plugin module
      return pluginName;
    }
  });

  return {
    ...options,
    presets,
    plugins,
  }
}

export function transform(code, options) {
  return Babel.transform(code, processOptions(options));
}

export function transformFromAst(ast, code, options) {
  return Babel.transformFromAst(code, processOptions(options));
}

// All the plugins we should bundle
export const availablePlugins = {
  'check-es2015-constants': require('babel-plugin-check-es2015-constants'),
  'external-helpers-2': require('babel-plugin-external-helpers-2'),
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
  'transform-flow-strip-types': require('babel-plugin-transform-flow-strip-types'),
  'transform-function-bind': require('babel-plugin-transform-function-bind'),
  'transform-inline-environment-variables': require('babel-plugin-transform-inline-environment-variables'),
  'transform-jscript': require('babel-plugin-transform-jscript'),
  'transform-member-expression-literals': require('babel-plugin-transform-member-expression-literals'),
  'transform-merge-sibling-variables': require('babel-plugin-transform-merge-sibling-variables'),
  'transform-minify-booleans': require('babel-plugin-transform-minify-booleans'),
  'transform-node-env-inline': require('babel-plugin-transform-node-env-inline'),
  'transform-object-assign': require('babel-plugin-transform-object-assign'),
  'transform-object-rest-spread': require('babel-plugin-transform-object-rest-spread'),
  'transform-object-set-prototype-of-to-assign': require('babel-plugin-transform-object-set-prototype-of-to-assign'),
  'transform-property-literals': require('babel-plugin-transform-property-literals'),
  'transform-proto-to-assign': require('babel-plugin-transform-proto-to-assign'),
  'transform-react-constant-elements': require('babel-plugin-transform-react-constant-elements'),
  'transform-react-display-name': require('babel-plugin-transform-react-display-name'),
  'transform-react-inline-elements': require('babel-plugin-transform-react-inline-elements'),
  'transform-react-jsx': require('babel-plugin-transform-react-jsx'),
  'transform-react-jsx-compat': require('babel-plugin-transform-react-jsx-compat'),
  'transform-react-jsx-source': require('babel-plugin-transform-react-jsx-source'),
  'transform-regenerator': require('babel-plugin-transform-regenerator'),
  'transform-remove-console': require('babel-plugin-transform-remove-console'),
  'transform-remove-debugger': require('babel-plugin-transform-remove-debugger'),
  'transform-runtime': require('babel-plugin-transform-runtime'),
  'transform-simplify-comparison-operators': require('babel-plugin-transform-simplify-comparison-operators'),
  'transform-strict-mode': require('babel-plugin-transform-strict-mode'),
  'transform-undefined-to-void': require('babel-plugin-transform-undefined-to-void'),
  'undeclared-variables-check': require('babel-plugin-undeclared-variables-check'),
};

// All the presets we should bundle
export const availablePresets = {
  es2015: require('babel-preset-es2015'),
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

  // ES2015 preset with plugins set to loose mode and es2015-modules-commonjs
  // removed.
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
      [require("babel-plugin-transform-regenerator"), { async: false, asyncGenerators: false }],
    ]
  },
};

export const version = Babel.version;
