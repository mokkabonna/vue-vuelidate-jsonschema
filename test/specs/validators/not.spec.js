var chai = require('chai')
var requireUncached = require('require-uncached')
var notValidator = requireUncached('../../../src/validators/not')
var propertyRules = require('../../../src/property-rules')
var expect = chai.expect

var validator
describe('notValidator', function() {
  describe('when string', function() {
    var schema = {
      type: 'string',
      not: {
        type: 'string',
        minLength: 5
      }
    }
    beforeEach(function() {
      validator = notValidator(schema, schema.not, propertyRules.getPropertyValidationRules)
    })

    it('is valid if undefined, required validator handles that', function() {
      expect(validator(undefined)).to.eql(true)
    })

    it('is valid if not of type string, type validator handles that', function() {
      expect(validator(null)).to.eql(true)
      expect(validator(1)).to.eql(true)
      expect(validator(1.5)).to.eql(true)
      expect(validator(false)).to.eql(true)
      expect(validator({})).to.eql(true)
      expect(validator([])).to.eql(true)
    })

    it('is valid if not schema does not match', function() {
      expect(validator('1234')).to.eql(true)
    })

    it('is valid if not schema does match', function() {
      expect(validator('12345')).to.eql(false)
    })
  })

  describe('when object', function() {
    var schema = {
      type: 'object',
      not: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            maxLength: 3
          }
        }
      }
    }
    beforeEach(function() {
      validator = notValidator(schema, schema.not, propertyRules.getPropertyValidationRules)
    })

    it('is valid when undefined or not object, other validators handle that', function() {
      expect(validator(undefined)).to.eql(true)
      expect(validator(null)).to.eql(true)
      expect(validator(1)).to.eql(true)
      expect(validator(1.5)).to.eql(true)
      expect(validator(false)).to.eql(true)
      expect(validator('')).to.eql(true)
      expect(validator([])).to.eql(true)
    })

    it('is valid if name is 4', function() {
      expect(validator({name: 'abcd'})).to.eql(true)
    })

    it('is invalid if name is 3', function() {
      expect(validator({name: 'abc'})).to.eql(false)
    })
  })
})
