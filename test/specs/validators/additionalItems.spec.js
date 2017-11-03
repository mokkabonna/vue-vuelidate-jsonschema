var chai = require('chai')
var requireUncached = require('require-uncached')
var additionalItemsValidator = requireUncached('../../../src/validators/additionalItems')
var propertyRules = require('../../../src/property-rules')
var expect = chai.expect

var validator
describe('additionalItemsValidator', function() {
  describe('when simple', function() {
    var schema = {
      type: 'array',
      items: [true],
      additionalItems: {
        anyOf: [
          {
            type: 'number'
          }, {
            type: 'boolean'
          }
        ]
      }
    }
    beforeEach(function() {
      validator = additionalItemsValidator(schema, schema.additionalItems, propertyRules.getPropertyValidationRules)
    })

    it('only validates additional items', function() {
      expect(validator([1])).to.eql(true)
    })

    it('validates additional items', function() {
      expect(validator([1, 'test'])).to.eql(false)
      expect(validator([1, {}])).to.eql(false)
      expect(validator([1, 1])).to.eql(true)
      expect(validator([1, false])).to.eql(true)
    })
  })

  describe('when nested', function() {
    var schema = {
      type: 'array',
      items: [true],
      additionalItems: {
        anyOf: [
          {
            type: 'object',
            properties: {
              children: {
                type: 'array',
                items: {
                  type: 'number',
                  minimum: 5
                }
              }
            }
          }
        ]
      }
    }
    beforeEach(function() {
      validator = additionalItemsValidator(schema, schema.additionalItems, propertyRules.getPropertyValidationRules)
    })

    it('validates nested schemas', function() {
      expect(validator([1, {}])).to.eql(true)

      expect(validator([1, {
        children: null
      }])).to.eql(false)

      expect(validator([1, {
        children: []
      }])).to.eql(true)

      expect(validator([1, {
        children: [4]
      }])).to.eql(false)

       expect(validator([1, {
        children: [5]
      }])).to.eql(true)
    })
  })
})
