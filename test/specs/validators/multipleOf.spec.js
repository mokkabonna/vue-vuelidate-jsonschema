var chai = require('chai')
var requireUncached = require('require-uncached')
var multipleOfValidator = requireUncached('../../../src/validators/multipleOf')
var expect = chai.expect

var validator
describe('multipleOfValidator', function() {
  var schema = {
    type: 'number',
    multipleOf: 10
  }

  it('is valid if multiple of 10', function() {
    validator = multipleOfValidator(schema, 10)
    expect(validator(0)).to.eql(true)
    expect(validator(10)).to.eql(true)
    expect(validator(11)).to.eql(false)
  })

  it('is valid if multiple of 0.5', function() {
    validator = multipleOfValidator(schema, 0.5)
    expect(validator(1)).to.eql(true)
    expect(validator(0.9)).to.eql(false)
    expect(validator(0.5)).to.eql(true)
    expect(validator(0)).to.eql(true)
    expect(validator(2)).to.eql(true)
  })
})
