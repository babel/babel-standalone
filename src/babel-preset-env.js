import {
  registerPreset,
  transform as babelTransform,
} from 'babel-standalone';

registerPreset('env', require('./build-babel-preset-env.js'));

export function transform (code, options = {}) {
  return babelTransform(code, {
    ...options,
    presets: [
      ...(options.presets || []),
      ['env', (options.envOptions || {})]
    ]
  });
}

export const version = VERSION;