const Babel = require('../babel');
require('../packages/babel-env-standalone/babel-preset-env');

// Basic smoke tests for babel-env-standalone
describe('babel-env-standalone with options', () => {
  it('correctly handles `targets` option', () => {
    const output = Babel.transform('const a = 1;', {
      presets: [
        [
          'env',
          {
            targets: { chrome: 58 },
          },
        ],
      ],
    }).code;
    expect(output).toBe(
      `"use strict";

const a = 1;`,
    );
  });

  it('correctly handles `targets.browsers` option', () => {
    const output = Babel.transform('const a = 1;', {
      presets: [
        [
          'env',
          {
            targets: { browsers: 'ie 10' },
          },
        ],
      ],
    }).code;
    expect(output).toBe(
      `"use strict";

var a = 1;`,
    );
  });

  it('correctly handles `useBuiltIns: usage`', () => {
    const output = Babel.transform('Promise.all;', {
      presets: [
        [
          'env',
          {
            targets: { browsers: 'ie 10, safari 10' },
            useBuiltIns: 'usage',
          },
        ],
      ],
    }).code;
    expect(output).toBe(
      `"use strict";

require("babel-polyfill/lib/core-js/modules/es6.promise");

Promise.all;`,
    );
  });
});
