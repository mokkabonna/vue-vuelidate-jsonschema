var chai = require('chai')
var requireUncached = require('require-uncached')
var itemsValdiator = requireUncached('../../../src/validators/items')
var propertyRules = require('../../../src/property-rules')
var expect = chai.expect

describe('itemsValidator', function() {
  describe('when items is an array', function() {
    var schema = {
      type: 'array',
      items: [{
        type: 'string',
        minLength: 7
      }, {
        type: 'integer'
      }, {
        type: 'object',
        properties: {
          name: {
            type: 'string'
          }
        },
        required: ['name']
      }]
    }

    it('is valid if each item is valid against the schema at the given position', function() {
      var validator = itemsValdiator(schema, propertyRules.getPropertyValidationRules)
      // wrong position of number and string
      expect(validator([1, 'fdsafdsfdsf', {
        name: undefined
      }])).to.eql(false)
    })
  })
})
