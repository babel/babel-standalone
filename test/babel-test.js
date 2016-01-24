const expect = require('expect.js');

const Babel = require('../babel');

// Basic smoke tests for babel-standalone
describe('babel-standalone', () => {
  it('handles the es2015-no-commonjs preset', () => {
    const output = Babel.transform(
      'const getMessage = () => "Hello World"',
      {presets: ['es2015-no-commonjs']}
    ).code;
    expect(output).to.be(
      'var getMessage = function getMessage() {\n' +
      '  return "Hello World";\n' +
      '};'
    );
  });

  it('handles the react preset', () => {
    const output = Babel.transform(
      'const someDiv = <div>{getMessage()}</div>',
      {presets: ['react']}
    ).code;
    expect(output).to.be(
      'const someDiv = React.createElement(\n' +
      '  "div",\n' +
      '  null,\n' +
      '  getMessage()\n' +
      ');'
    );
  });

  it('handles specifying a plugin by name', () => {
    const output = Babel.transform(
      'const getMessage = () => "Hello World"',
      {plugins: ['transform-es2015-arrow-functions']}
    ).code;
    // Transforms arrow syntax but NOT "const".
    expect(output).to.be(
      'const getMessage = function () {\n' +
      '  return "Hello World";\n' +
      '};'
    );
  });

  it('throws on invalid preset name', () => {
    expect(
      () => Babel.transform('var foo', {presets: ['lolfail']})
    ).to.throwException(/Invalid preset specified in Babel options: "lolfail"/);
  });

  it('throws on invalid plugin name', () => {
    expect(
      () => Babel.transform('var foo', {plugins: ['lolfail']})
    ).to.throwException(/Invalid plugin specified in Babel options: "lolfail"/);
  });
});
