import pluginList from "babel-preset-env/data/plugins.json";
import builtInsList from "babel-preset-env/data/built-ins.json";
import MODULE_TRANSFORMATIONS from "babel-preset-env/lib/module-transformations";
import { logPlugin } from "babel-preset-env/lib/debug";
import { defaultWebIncludes } from "babel-preset-env/lib/default-includes";
import normalizeOptions from "babel-preset-env/lib/normalize-options";
import getTargets from "babel-preset-env/lib/targets-parser";
import useBuiltInsEntryPlugin from "babel-preset-env/lib/use-built-ins-entry-plugin";
import addUsedBuiltInsPlugin from "babel-preset-env/lib/use-built-ins-plugin";
import { isPluginRequired, transformIncludesAndExcludes } from "babel-preset-env";
import {
  registerPlugins,
  registerPreset,
  availablePlugins,
  transform as babelTransform,
} from 'babel-standalone';

// availablePlugins
// export const availablePlugins = {
//   "babel-plugin-check-es2015-constants": require("babel-plugin-check-es2015-constants"),
//   "babel-plugin-syntax-trailing-function-commas": require("babel-plugin-syntax-trailing-function-commas"),
//   "babel-plugin-transform-async-to-generator": require("babel-plugin-transform-async-to-generator"),
//   "babel-plugin-transform-es2015-arrow-functions": require("babel-plugin-transform-es2015-arrow-functions"),
//   "babel-plugin-transform-es2015-block-scoped-functions": require("babel-plugin-transform-es2015-block-scoped-functions"),
//   "babel-plugin-transform-es2015-block-scoping": require("babel-plugin-transform-es2015-block-scoping"),
//   "babel-plugin-transform-es2015-classes": require("babel-plugin-transform-es2015-classes"),
//   "babel-plugin-transform-es2015-computed-properties": require("babel-plugin-transform-es2015-computed-properties"),
//   "babel-plugin-transform-es2015-destructuring": require("babel-plugin-transform-es2015-destructuring"),
//   "babel-plugin-transform-es2015-duplicate-keys": require("babel-plugin-transform-es2015-duplicate-keys"),
//   "babel-plugin-transform-es2015-for-of": require("babel-plugin-transform-es2015-for-of"),
//   "babel-plugin-transform-es2015-function-name": require("babel-plugin-transform-es2015-function-name"),
//   "babel-plugin-transform-es2015-literals": require("babel-plugin-transform-es2015-literals"),
//   "babel-plugin-transform-es2015-modules-commonjs": require("babel-plugin-transform-es2015-modules-commonjs"),
//   "babel-plugin-transform-es2015-object-super": require("babel-plugin-transform-es2015-object-super"),
//   "babel-plugin-transform-es2015-parameters": require("babel-plugin-transform-es2015-parameters"),
//   "babel-plugin-transform-es2015-shorthand-properties": require("babel-plugin-transform-es2015-shorthand-properties"),
//   "babel-plugin-transform-es2015-spread": require("babel-plugin-transform-es2015-spread"),
//   "babel-plugin-transform-es2015-sticky-regex": require("babel-plugin-transform-es2015-sticky-regex"),
//   "babel-plugin-transform-es2015-template-literals": require("babel-plugin-transform-es2015-template-literals"),
//   "babel-plugin-transform-es2015-typeof-symbol": require("babel-plugin-transform-es2015-typeof-symbol"),
//   "babel-plugin-transform-es2015-unicode-regex": require("babel-plugin-transform-es2015-unicode-regex"),
//   "babel-plugin-transform-exponentiation-operator": require("babel-plugin-transform-exponentiation-operator"),
//   "babel-plugin-transform-regenerator": require("babel-plugin-transform-regenerator")
// };

const filterItems = (list, includes, excludes, targets, defaultItems) => {
  const result = new Set();

  for (const item in list) {
    const excluded = excludes.has(item);

    if (!excluded && isPluginRequired(targets, list[item])) {
      result.add(item);
    }
  }

  if (defaultItems) {
    defaultItems.forEach(item => !excludes.has(item) && result.add(item));
  }

  includes.forEach(item => result.add(item));

  return result;
};


let hasBeenLogged = false;

const getPluginTargets = (plugin, targets, list) => {
  const envList = list[plugin] || {};
  const filteredList = Object.keys(targets)
  .reduce((a, b) => {
    if (!envList[b] || targets[b] < envList[b]) {
      a[b] = targets[b];
    }
    return a;
  }, {});
  return filteredList;
};

const getBuiltInTargets = targets => {
  const builtInTargets = Object.assign({}, targets);
  if (builtInTargets.uglify != null) {
    delete builtInTargets.uglify;
  }
  return builtInTargets;
};

function getPlatformSpecificDefaultFor(targets) {
  const targetNames = Object.keys(targets);
  const isAnyTarget = !targetNames.length;
  const isWebTarget = targetNames.some((name) => name !== "node");

  return (isAnyTarget || isWebTarget) ? defaultWebIncludes : [];
}

const filterItem = (targets, exclusions, list, item) => {
  const isDefault = defaultWebIncludes.indexOf(item) >= 0;
  const notExcluded = exclusions.indexOf(item) === -1;

  if (isDefault) return notExcluded;
  const isRequired = isPluginRequired(targets, list[item]);
  return isRequired && notExcluded;
};

function buildPreset(
  context,
  opts,
) {
  const {
    debug,
    exclude: optionsExclude,
    forceAllTransforms,
    include: optionsInclude,
    loose,
    modules,
    spec,
    targets: optionsTargets,
    useBuiltIns,
  } = normalizeOptions(opts);

  // TODO: remove this in next major
  let hasUglifyTarget = false;

  if (optionsTargets && optionsTargets.uglify) {
    hasUglifyTarget = true;
    delete optionsTargets.uglify;

    console.log("");
    console.log("The uglify target has been deprecated. Set the top level");
    console.log("option `forceAllTransforms: true` instead.");
    console.log("");
  }

  const targets = getTargets(optionsTargets);
  const include = transformIncludesAndExcludes(optionsInclude);
  const exclude = transformIncludesAndExcludes(optionsExclude);

  const transformTargets = forceAllTransforms || hasUglifyTarget ? {} : targets;

  const transformations = filterItems(
    pluginList,
    include.plugins,
    exclude.plugins,
    transformTargets,
  );

  let polyfills;
  let polyfillTargets;

  if (useBuiltIns) {
    polyfillTargets = getBuiltInTargets(targets);

    polyfills = filterItems(
      builtInsList,
      include.builtIns,
      exclude.builtIns,
      polyfillTargets,
      getPlatformSpecificDefaultFor(polyfillTargets),
    );
  }

  const plugins = [];
  const modulePlugin = modules !== false && MODULE_TRANSFORMATIONS[modules];

  if (modulePlugin) {
    plugins.push([availablePlugins[modulePlugin], { loose }]);
  }

  // NOTE: not giving spec here yet to avoid compatibility issues when
  // babel-plugin-transform-es2015-modules-commonjs gets its spec mode
  transformations.forEach(pluginName =>
    plugins.push([availablePlugins[pluginName], { loose, spec }]),
  );

  const regenerator = transformations.has("transform-regenerator");

  if (debug && !hasBeenLogged) {
    hasBeenLogged = true;
    console.log("babel-preset-env: `DEBUG` option");
    console.log("\nUsing targets:");
    console.log(JSON.stringify(prettifyTargets(targets), null, 2));
    console.log(`\nUsing modules transform: ${modules.toString()}`);
    console.log("\nUsing plugins:");
    transformations.forEach(transform => {
      logPlugin(transform, targets, pluginList);
    });

    if (!useBuiltIns) {
      console.log(
        "\nUsing polyfills: No polyfills were added, since the `useBuiltIns` option was not set.",
      );
    } else {
      console.log(
        `
Using polyfills with \`${useBuiltIns}\` option:`,
      );
    }
  }

  if (useBuiltIns === "usage" || useBuiltIns === "entry") {
    const pluginOptions = {
      debug,
      polyfills,
      regenerator,
      onDebug: (polyfills, context) => {
        polyfills.forEach(polyfill =>
          logPlugin(polyfill, polyfillTargets, builtInsList, context),
        );
      },
    };

    plugins.push([
      useBuiltIns === "usage" ? addUsedBuiltInsPlugin : useBuiltInsEntryPlugin,
      pluginOptions,
    ]);
  }

  if (opts.onPresetBuild) {
    const transformationsWithTargets = [];
    transformations.forEach((transform) => (
      transformationsWithTargets.push({
        name: transform,
        targets: getPluginTargets(transform, targets, pluginList)
      })
    ));
    const polyfillsWithTargets = [];
    if (useBuiltIns) {
      polyfills.forEach((polyfill) => (
        polyfillsWithTargets.push({
          name: polyfill,
          targets: getPluginTargets(polyfill, targets, builtInsList)
        })
      ));
    }

    opts.onPresetBuild({
      targets,
      transformations,
      transformationsWithTargets,
      polyfillsWithTargets,
      modulePlugin
    });
  }

  return {
    plugins,
  };
}

registerPreset('env', buildPreset);

export function transform(code, options = {}) {
  return babelTransform(code, {
    ...options,
    presets: [
      ...(options.presets || []),
      [buildPreset, options]
    ]
  });
}

export const version = VERSION;