var chai = require('chai')
var requireUncached = require('require-uncached')
var anyOfValidator = requireUncached('../../../src/validators/anyOf')
var propertyRules = require('../../../src/property-rules')
var expect = chai.expect

var validator
describe('anyOfValidator', function() {
  describe('when string', function() {
    var schema = {
      type: 'string',
      anyOf: [
        {
          type: 'string',
          minLength: 5
        }, {
          type: 'string',
          pattern: '\\d{2,}'
        }, {
          type: 'string',
          pattern: '[a-z]{2,}'
        }
      ]
    }
    beforeEach(function() {
      validator = anyOfValidator(schema, schema.anyOf, propertyRules.getPropertyValidationRules)
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

    it('is invalid if none matches', function() {
      expect(validator('--a1')).to.eql(false)
    })

    it('is valid if minLength matches', function() {
      expect(validator('---------')).to.eql(true)
    })

    it('is valid if digits', function() {
      expect(validator('12')).to.eql(true)
    })

    it('is valid if letters', function() {
      expect(validator('ab')).to.eql(true)
    })

    it('is valid if 2 match', function() {
      expect(validator('ab12')).to.eql(true)
    })
  })

  describe('when object', function() {
    var schema = {
      type: 'object',
      anyOf: [
        {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              maxLength: 3
            }
          }
        }, {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 5
            },
            sub: {
              type: 'object'
            }
          },
          required: ['name', 'sub']
        }
      ]
    }
    beforeEach(function() {
      validator = anyOfValidator(schema, schema.anyOf, propertyRules.getPropertyValidationRules)
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

    it('is invalid if name is 4', function() {
      expect(validator({name: 'abcd'})).to.eql(false)
    })

    it('is valid if name is not too long or too short', function() {
      expect(validator({name: 'abc'})).to.eql(true)
      expect(validator({name: 'abcdd', sub: {}})).to.eql(true)
    })

    it('is valid if sub property is missing, since other definition don\'t require the sub object', function() {
      expect(validator({
        name: 'abc'
      })).to.eql(true)
    })
  })
})
