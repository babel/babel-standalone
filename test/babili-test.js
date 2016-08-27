const expect = require('expect.js');
const proxyquire = require('proxyquire');

const Babel = require('../babel');
Babel['@noCallThru'] = true;
const Babili = proxyquire('../packages/babili-standalone/babili', {Babel});

// Basic smoke tests for babili-standalone
describe('babili-standalone', () => {
  it('works', () => {
    const output = Babili.transform(
`
class Mangler {
  constructor(program) {
    this.program = program;
  }
}
new Mangler();`).code;
    expect(output).to.be('class a{constructor(b){this.program=b}}new a;');
  });
});
