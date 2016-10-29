const Babili = require('../packages/babili-standalone/babili');

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
    expect(output).toBe('class Mangler{constructor(a){this.program=a}}new Mangler;');
  });
});
