const Babili = require('../packages/babili-standalone/babili');

// Basic smoke tests for babili-standalone
// TODO: Fix this:  TypeError: unknown: traverse.clearCache is not a function
xdescribe('babili-standalone', () => {
  it('works', () => {
    const output = Babili.transform(
`
class Mangler {
  constructor(program) {
    this.program = program;
  }
}
new Mangler();`).code;
    expect(output).toBe('class Mangler{constructor(a){this.program=a}}new Mangler;');
  });
});
