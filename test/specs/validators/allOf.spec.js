var chai = require('chai')
var requireUncached = require('require-uncached')
var allOfValidator = requireUncached('../../../src/validators/allOf')
var propertyRules = require('../../../src/property-rules')
var expect = chai.expect

var validator
describe('allOfValidator', function() {
  describe('when string', function() {
    var schema = {
      type: 'string',
      allOf: [
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
      validator = allOfValidator(schema, schema.allOf, propertyRules.getPropertyValidationRules)
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

    it('is not valid if to short', function() {
      expect(validator('')).to.eql(false)
      expect(validator('12ab')).to.eql(false)
      expect(validator('12aba')).to.eql(true)
    })

    it('is not valid if missing 2 digits', function() {
      expect(validator('1adab')).to.eql(false)
      expect(validator('11aba')).to.eql(true)
    })

    it('is not valid if missing 2 letters', function() {
      expect(validator('1234a')).to.eql(false)
      expect(validator('123ab')).to.eql(true)
    })
  })

  describe('when object', function() {
    var schema = {
      type: 'object',
      allOf: [
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
              type: 'string'
            },
            sub: {
              type: 'object',
              properties: {
                subsub: {
                  type: 'object',
                  properties: {
                    subsub: {
                      type: 'object',
                      properties: {
                        name: {
                          type: 'string',
                          minLength: 3
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          required: ['name']
        }
      ]
    }
    beforeEach(function() {
      validator = allOfValidator(schema, schema.allOf, propertyRules.getPropertyValidationRules)
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

    it('is invalid if name is missing', function() {
      expect(validator({})).to.eql(false)
    })

    it('is invalid if name is too long', function() {
      expect(validator({name: 'abcd'})).to.eql(false)
    })

    it('is valid if name is not too long', function() {
      expect(validator({name: 'abc'})).to.eql(true)
    })

    it('is invalid if deep property is too short', function() {
      expect(validator({
        name: 'abc',
        sub: {
          subsub: {
            subsub: {
              name: '12'
            }
          }
        }
      })).to.eql(false)
    })

    it('is valid if deep property is missing', function() {
      expect(validator({
        name: 'abc',
        sub: {
          subsub: {
            subsub: {}
          }
        }
      })).to.eql(true)
    })

    it('is valid if deep property is long enough', function() {
      expect(validator({
        name: 'abc',
        sub: {
          subsub: {
            subsub: {
              name: '123'
            }
          }
        }
      })).to.eql(true)
    })
  })
})
