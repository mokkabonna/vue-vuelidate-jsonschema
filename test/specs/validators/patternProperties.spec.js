var chai = require('chai')
var requireUncached = require('require-uncached')
var patternPropertiesValidator = requireUncached('../../../src/validators/patternProperties')
var propertyRules = require('../../../src/property-rules')
var Ajv = require('ajv')

var ajv = new Ajv()
var expect = chai.expect

var validator
describe('patternPropertiesValidator', function() {
  describe('with additionalProperties', function() {
    var schema = {
      type: 'object',
      properties: {
        ab12: {
          type: 'string'
        }
      },
      patternProperties: {
        '^abc.+$': {
          type: 'object',
          properties: {
            name: {
              type: 'string'
            }
          },
          required: ['name']
        },
        '^.+123$': {
          type: 'number',
          minimum: 3
        }
      },
      additionalProperties: {
        type: ['string', 'number']
      }
    }
    beforeEach(function() {
      validator = patternPropertiesValidator(schema, schema.patternProperties, propertyRules.getPropertyValidationRules)
    })

    it('is valid if present in properties', function() {
      assert(schema, {
        ab12: 'fdsf'
      }, true)
    })

    it('is valid if no keys are valid and present additionalProperties', function() {
      assert(schema, {
        'ab-12': 'fdsf'
      }, true)
    })

    it('is invalid if matching first and not object', function() {
      assert(schema, {
        'abcd': 1
      }, false)
    })

    it('is invalid if matching second and not minimum 3', function() {
      assert(schema, {
        'ab123': 1
      }, false)
    })

    it('is valid if matching second and minimum 3', function() {
      assert(schema, {
        'ab123': 3
      }, true)
    })

    it('is invalid if matching first and object missing name', function() {
      assert(schema, {
        'abc1': {}
      }, false)
    })

    it('is valid if matching first and object is also valid', function() {
      assert(schema, {
        'abc1': {
          name: 'john'
        }
      }, true)
    })
  })

  describe('with additionalProperties undefined', function() {
    var schema = {
      type: 'object',
      properties: {
        ab12: {
          type: 'string'
        }
      },
      patternProperties: {
        '^abc.+$': {
          type: 'object',
          properties: {
            name: {
              type: 'string'
            }
          },
          required: ['name']
        },
        '^.+123$': {
          type: 'number',
          minimum: 3
        }
      }
    }
    beforeEach(function() {
      validator = patternPropertiesValidator(schema, schema.patternProperties, propertyRules.getPropertyValidationRules)
    })

    it('is valid if present in properties', function() {
      assert(schema, {
        ab12: 'fdsf'
      }, true)
    })

    it('is valid if no keys are matching, since additionalProperties undefined (same as true) catches that', function() {
      assert(schema, {
        'ab-12': 'fdsf'
      }, true)
    })

    it('is invalid if matching first and not object', function() {
      assert(schema, {
        'abcd': 1
      }, false)
    })

    it('is invalid if matching second and not minimum 3', function() {
      assert(schema, {
        'ab123': 1
      }, false)
    })

    it('is valid if matching second and minimum 3', function() {
      assert(schema, {
        'ab123': 3
      }, true)
    })

    it('is invalid if matching first and object missing name', function() {
      assert(schema, {
        'abc1': {}
      }, false)
    })

    it('is valid if matching first and object is also valid', function() {
      assert(schema, {
        'abc1': {
          name: 'john'
        }
      }, true)
    })
  })

  describe('with additionalProperties = true', function() {
    var schema = {
      type: 'object',
      properties: {
        ab12: {
          type: 'string'
        }
      },
      patternProperties: {
        '^abc.+$': {
          type: 'object',
          properties: {
            name: {
              type: 'string'
            }
          },
          required: ['name']
        },
        '^.+123$': {
          type: 'number',
          minimum: 3
        }
      },
      additionalProperties: true
    }
    beforeEach(function() {
      validator = patternPropertiesValidator(schema, schema.patternProperties, propertyRules.getPropertyValidationRules)
    })

    it('is valid if present in properties', function() {
      assert(schema, {
        ab12: 'fdsf'
      }, true)
    })

    it('is valid if no keys are matching, since additionalProperties catches that', function() {
      assert(schema, {
        'ab-12': 'fdsf'
      }, true)
    })

    it('is invalid if matching first and not object', function() {
      assert(schema, {
        'abcd': 1
      }, false)
    })

    it('is invalid if matching second and not minimum 3', function() {
      assert(schema, {
        'ab123': 1
      }, false)
    })

    it('is valid if matching second and minimum 3', function() {
      assert(schema, {
        'ab123': 3
      }, true)
    })

    it('is invalid if matching first and object missing name', function() {
      assert(schema, {
        'abc1': {}
      }, false)
    })

    it('is valid if matching first and object is also valid', function() {
      assert(schema, {
        'abc1': {
          name: 'john'
        }
      }, true)
    })
  })

  describe('with additionalProperties = false', function() {
    var schema = {
      type: 'object',
      properties: {
        ab12: {
          type: 'string'
        }
      },
      patternProperties: {
        '^abc.+$': {
          type: 'object',
          properties: {
            name: {
              type: 'string'
            }
          },
          required: ['name']
        },
        '^.+123$': {
          type: 'number',
          minimum: 3
        }
      },
      additionalProperties: false
    }
    beforeEach(function() {
      validator = patternPropertiesValidator(schema, schema.patternProperties, propertyRules.getPropertyValidationRules)
    })

    it('is valid if present in properties', function() {
      assert(schema, {
        ab12: 'fdsf'
      }, true)
    })

    it('is invalid if no keys are matching since additionalProperties is false', function() {
      assert(schema, {
        'ab-12': 'fdsf'
      }, false)
    })

    it('is invalid if matching first and not object', function() {
      assert(schema, {
        'abcd': 1
      }, false)
    })

    it('is invalid if matching second and not minimum 3', function() {
      assert(schema, {
        'ab123': 1
      }, false)
    })

    it('is valid if matching second and minimum 3', function() {
      assert(schema, {
        'ab123': 3
      }, true)
    })

    it('is invalid if matching first and object missing name', function() {
      assert(schema, {
        'abc1': {}
      }, false)
    })

    it('is valid if matching first and object is also valid', function() {
      assert(schema, {
        'abc1': {
          name: 'john'
        }
      }, true)
    })
  })
})

function assert(schema, obj, expected) {
  if (ajv.validate(schema, obj) !== expected) {
    throw new Error('Test precondition failed, ajv and validator assertion are not equal.')
  }
  expect(validator(obj)).to.eql(expected)
}
