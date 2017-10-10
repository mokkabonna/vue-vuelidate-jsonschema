var chai = require('chai')
var requireUncached = require('require-uncached')
var itemsValidator = requireUncached('../../../src/validators/items')
var propertyRules = require('../../../src/property-rules')
var expect = chai.expect

var validator
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
          },
          childItems: {
            type: 'array',
            items: [{
              type: 'number',
              minimum: 100
            }, {
              type: 'string'
            }]
          }
        },
        required: ['name']
      }]
    }

    beforeEach(function() {
      validator = itemsValidator(schema, propertyRules.getPropertyValidationRules)
    })

    it('is valid if each item is valid against the schema at the given position', function() {
      // wrong position of number and string
      expect(validator([1, 'fdsafdsfdsf', {
        name: 'fdsafds'
      }])).to.eql(false)

      // correct positions but string is invalid
      expect(validator(['fdsa', 3, {
        name: 'fdsafds'
      }])).to.eql(false)

      // correct positions but object is missing name
      expect(validator(['fdsafdsafsd', 3, {
        name: undefined
      }])).to.eql(false)

      // all ok
      expect(validator(['fdsafdsafsd', 3, {
        name: 'fdasfds'
      }])).to.eql(true)
    })

    it('is invalid if childItems is not correct', function() {
      expect(validator(['fdsafdsfdsf', 1, {
        name: 'fdsafds',
        childItems: []
      }])).to.eql(true)

      expect(validator(['fdsafdsfdsf', 1, {
        name: 'fdsafds',
        childItems: ['fds', 111]
      }])).to.eql(false)

      expect(validator(['fdsafdsfdsf', 1, {
        name: 'fdsafds',
        childItems: [99, 'fds']
      }])).to.eql(false)

      expect(validator(['fdsafdsfdsf', 1, {
        name: 'fdsafds',
        childItems: [100, 'fds']
      }])).to.eql(true)
    })
  })
})
