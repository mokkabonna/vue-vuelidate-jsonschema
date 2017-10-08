'use strict'
var mergeStrategy = require('./merge-validation-options')
var reduce = require('lodash/reduce')
var every = require('lodash/every')
var set = require('lodash/set')
var isEqual = require('lodash/isEqual')
var isString = require('lodash/isString')
var isPlainObject = require('lodash/isPlainObject')
var isBoolean = require('lodash/isBoolean')
var isFinite = require('lodash/isFinite')
var isNull = require('lodash/isNull')
var isInteger = require('lodash/isInteger')
var omit = require('lodash/omit')
var validators = require('vuelidate/lib/validators')
var vuelidate = require('vuelidate')

var jsonTypes = {
  string: isString,
  object: isPlainObject,
  boolean: isBoolean,
  array: Array.isArray,
  'null': isNull,
  number: isFinite,
  integer: isInteger
}

function typeValidator(type) {
  return vuelidate.withParams({
    type: 'jsonType',
    jsonType: type
  }, function(val) {
    return val === undefined || jsonTypes[type](val)
  })
}

function minValidator(min) {
  return vuelidate.withParams({
    type: 'minimum',
    min: min
  }, function(val) {
    return !validators.required(val) || val >= min
  })
}

function maxValidator(max) {
  return vuelidate.withParams({
    type: 'maximum',
    max: max
  }, function(val) {
    return !validators.required(val) || val <= max
  })
}

function patternValidator(pattern) {
  return vuelidate.withParams({
    type: 'pattern',
    pattern: pattern
  }, function(val) {
    return isString(val) && pattern.test(val)
  })
}

function oneOfValidator(choices) {
  return vuelidate.withParams({
    type: 'oneOf',
    choices: choices
  }, function(val) {
    return !validators.required(val) || choices.indexOf(val) !== -1
  })
}

function equalValidator(equal) {
  return vuelidate.withParams({
    type: 'equal',
    equal: equal
  }, function(val) {
    return !validators.required(val) || isEqual(equal, val)
  })
}

function itemsValidator(arraySchema) {
  return vuelidate.withParams({
    type: 'items',
    schema: arraySchema
  }, function(val) {
    return Array.isArray(val) && val.every(function(item) {
      var validators = getPropertyValidationRules(arraySchema, arraySchema.items)
      return every(validators, function(validator) {
        return validator(item)
      })
    })
  })
}

function getDefaultValue(schema) {
  if (schema.hasOwnProperty('default')) {
    return schema.default
  } else if (schema.type === 'string') {
    return ''
  } else if (schema.type === 'object') {
    return {}
  } else if (schema.type === 'array') {
    return []
  } else {
    return null
  }
}

function setProperties(base, schema) {
  Object.keys(schema.properties).forEach(function(key) {
    var innerSchema = schema.properties[key]
    base[key] = getDefaultValue(innerSchema)
    if (innerSchema.type === 'object' && innerSchema.properties) {
      setProperties(base[key], innerSchema)
    }
  })
}

function createDataProperties(schemas) {
  return reduce(schemas, function(all, schema, mountPoint) {
    setProperties(all, schema)
    return all
  }, {})
}

function isRootSchema(schema) {
  return schema.hasOwnProperty('type') && schema.type === 'object'
}

function normalizeDirectSchema(schema) {
  return {
    '.': schema
  }
}

function getPropertyValidationRules(schema, propertySchema, propKey) {
  var validationObj = {}

  if (Array.isArray(propertySchema.type)) {
    validationObj.or = validators.or.apply(validators, propertySchema.type.map(function(type) {
      return typeValidator(type)
    }))
  } else {
    validationObj.jsonType = typeValidator(propertySchema.type)
  }

  if (schema.required && schema.required.indexOf(propKey) !== -1) {
    validationObj.required = validators.requiredIf(function(val) {
      return this[propKey] === undefined
    })
  }

  if (propertySchema.hasOwnProperty('minLength')) {
    validationObj.required = validators.required
    validationObj.minLength = validators.minLength(propertySchema.minLength)
  }

  if (propertySchema.hasOwnProperty('maxLength')) {
    validationObj.maxLength = validators.maxLength(propertySchema.maxLength)
  }

  if (propertySchema.hasOwnProperty('minItems')) {
    validationObj.required = validators.required
    validationObj.minItems = validators.minLength(propertySchema.minItems)
  }

  if (propertySchema.hasOwnProperty('maxItems')) {
    validationObj.maxItems = validators.maxLength(propertySchema.maxItems)
  }

  if (propertySchema.hasOwnProperty('minimum') && propertySchema.hasOwnProperty('maximum')) {
    validationObj.between = validators.between(propertySchema.minimum, propertySchema.maximum)
  } else if (propertySchema.hasOwnProperty('minimum')) {
    validationObj.required = validators.required // TODO is this correct?
    validationObj.minimum = minValidator(propertySchema.minimum)
  } else if (propertySchema.hasOwnProperty('maximum')) {
    validationObj.maximum = maxValidator(propertySchema.maximum)
  }

  if (propertySchema.hasOwnProperty('pattern')) {
    validationObj.pattern = patternValidator(new RegExp(propertySchema.pattern))
  }

  if (propertySchema.hasOwnProperty('enum')) {
    validationObj.required = validators.required
    validationObj.oneOf = oneOfValidator(propertySchema.enum)
  }

  if (propertySchema.hasOwnProperty('const')) {
    validationObj.required = validators.required
    validationObj.equal = equalValidator(propertySchema.const)
  }

  if (propertySchema.hasOwnProperty('items') && propertySchema.type === 'array' && propertySchema.items.type === 'object') {
    validationObj.$each = getPropertyValidationRules(propertySchema, propertySchema.items)
  } else if (propertySchema.hasOwnProperty('items') && propertySchema.type === 'array') {
    validationObj.items = itemsValidator(propertySchema)
  }

  return validationObj
}

function getValidationRules(schema) {
  return reduce(schema.properties, function(all, propertySchema, propKey) {
    var validationObj = getPropertyValidationRules(schema, propertySchema, propKey)

    all[propKey] = validationObj

    return all
  }, {})
}

function generateValidationSchema(schemas) {
  var root = getValidationRules(schemas['.']) || {}

  return reduce(omit(schemas, '.'), function(all, schema, mountPoint) {
    set(all, mountPoint, getValidationRules(schema))
    return all
  }, root)
}

module.exports = {
  install: function(Vue, options) {
    options = options || {}

    Vue.config.optionMergeStrategies.validations = mergeStrategy

    Vue.mixin({
      validations() {
        if (this.schemas) {
          return generateValidationSchema(this.schemas)
        } else {
          return {}
        }
      },
      beforeCreate() {
        if (!this.$options.schema) return
        var normalized = isRootSchema(this.$options.schema) ? normalizeDirectSchema(this.$options.schema) : this.$options.schema
        var data = createDataProperties(normalized)

        // expose schemas normalized
        Vue.util.defineReactive(this, 'schemas', normalized)

        for (var prop in data) {
          if (data.hasOwnProperty(prop)) {
            Vue.util.defineReactive(this, prop, data[prop])
          }
        }
      }
    })
  }
}
