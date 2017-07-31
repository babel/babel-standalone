import { registerPreset } from 'babel-standalone';

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
  availablePlugins,
} from 'babel-standalone';

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

export const version = VERSION;
