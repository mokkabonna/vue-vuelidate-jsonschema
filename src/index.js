'use strict'
var mergeStrategy = require('./merge-validation-options')
var reduce = require('lodash/reduce')
var every = require('lodash/every')
var merge = require('lodash/merge')
var set = require('lodash/set')
var get = require('lodash/get')
var isEqual = require('lodash/isEqual')
var isString = require('lodash/isString')
var isPlainObject = require('lodash/isPlainObject')
var uniqBy = require('lodash/uniqBy')
var isBoolean = require('lodash/isBoolean')
var isFinite = require('lodash/isFinite')
var isNull = require('lodash/isNull')
var isInteger = require('lodash/isInteger')
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

function noParamsRequired(val) {
  return val !== undefined
}

function requiredValidator(propertySchema) {
  return vuelidate.withParams({
    type: 'schemaRequired',
    schema: propertySchema
  }, noParamsRequired)
}

function minLengthValidator(propertySchema, min) {
  return vuelidate.withParams({
    type: 'schemaMinLength',
    schema: propertySchema,
    min: min
  }, function(val) {
    return !noParamsRequired(val) || (val && val.hasOwnProperty('length') && val.length >= min)
  })
}

function maxLengthValidator(propertySchema, max) {
  return vuelidate.withParams({
    type: 'schemaMaxLength',
    schema: propertySchema,
    max: max
  }, function(val) {
    return !noParamsRequired(val) || (val && val.hasOwnProperty('length') && val.length <= max)
  })
}

function typeValidator(propertySchema, type) {
  return vuelidate.withParams({
    type: 'schemaType',
    jsonType: type,
    schema: propertySchema
  }, function(val) {
    return !noParamsRequired(val) || jsonTypes[type](val)
  })
}

function minValidator(propertySchema, min) {
  return vuelidate.withParams({
    type: 'schemaMinimum',
    min: min,
    schema: propertySchema
  }, function(val) {
    return !noParamsRequired(val) || val >= min
  })
}

function betweenValidator(propertySchema, min, max) {
  return vuelidate.withParams({
    type: 'schemaBetween',
    min: min,
    max: max,
    schema: propertySchema
  }, function(val) {
    return !noParamsRequired(val) || (val >= min && val <= max)
  })
}

function maxValidator(propertySchema, max) {
  return vuelidate.withParams({
    type: 'schemaMaximum',
    max: max,
    schema: propertySchema
  }, function(val) {
    return !noParamsRequired(val) || val <= max
  })
}

function patternValidator(propertySchema, pattern) {
  return vuelidate.withParams({
    type: 'schemaPattern',
    pattern: pattern,
    schema: propertySchema
  }, function(val) {
    return isString(val) && pattern.test(val)
  })
}

function oneOfValidator(propertySchema, choices) {
  return vuelidate.withParams({
    type: 'schemaOneOf',
    choices: choices,
    schema: propertySchema
  }, function(val) {
    return !noParamsRequired(val) || choices.indexOf(val) !== -1
  })
}

function equalValidator(propertySchema, equal) {
  return vuelidate.withParams({
    type: 'schemaEqual',
    equal: equal,
    schema: propertySchema
  }, function(val) {
    return !noParamsRequired(val) || isEqual(equal, val)
  })
}

function getUniqueness(item) {
  if (isPlainObject(item) || Array.isArray(item)) {
    return JSON.stringify(item)
  } else {
    return item
  }
}

function uniqueValidator(propertySchema) {
  return vuelidate.withParams({
    type: 'schemaUnique',
    schema: propertySchema
  }, function(val) {
    // TODO is array check here ok?
    if (!Array.isArray(val)) return true
    if (val.length < 2) return true
    return val.length === uniqBy(val, getUniqueness).length
  })
}

function itemsValidator(arraySchema) {
  var normalizedSchemas = Array.isArray(arraySchema.items) ? arraySchema.items : [arraySchema.items]
  return vuelidate.withParams({
    type: 'schemaItems',
    schema: arraySchema
  }, function(val) {
    var validatorGroups = normalizedSchemas.map(function(itemSchema) {
      return getPropertyValidationRules(arraySchema, itemSchema)
    })

    var validationForGroups = validatorGroups.map(function(validatorSet) {
      return function(item) {
        return every(validatorSet, function(validator, key) {
          if (isPlainObject(validator)) {
            return every(validator, function(innerValidator) {
              return innerValidator(item[key])
            })
          } else {
            return validator(item)
          }
        })
      }
    })

    return Array.isArray(val) && val.every(function(item) {
      // Only one of the supplied schemas has to match
      return validationForGroups.some(function(validationGroup) {
        return validationGroup(item)
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
  return reduce(schemas, function(all, schemaConfig) {
    if (schemaConfig.mountPoint !== '.') {
      // scaffold structure
      set(all, schemaConfig.mountPoint, {}) // TODO support non object schemas
      setProperties(get(all, schemaConfig.mountPoint), schemaConfig.schema)
    } else {
      setProperties(all, schemaConfig.schema)
    }
    return all
  }, {})
}

function normalizeSchemas(schemaConfig) {
  if (Array.isArray(schemaConfig)) {
    return schemaConfig.map(function(config) {
      if (config.mountPoint) {
        return config
      } else {
        return {
          mountPoint: '.',
          schema: config
        }
      }
    })
  } else {
    return [{
      mountPoint: '.',
      schema: schemaConfig
    }]
  }
}

function getPropertyValidationRules(schema, propertySchema, propKey) {
  var validationObj = {}

  if (propertySchema.type === 'object') {
    return getValidationRules(propertySchema)
  }

  if (Array.isArray(propertySchema.type)) {
    validationObj.or = validators.or.apply(validators, propertySchema.type.map(function(type) {
      return typeValidator(propertySchema, type)
    }))
  } else {
    validationObj.schemaType = typeValidator(propertySchema, propertySchema.type)
  }

  if (schema.required && schema.required.indexOf(propKey) !== -1) {
    validationObj.required = requiredValidator(propertySchema)
  }

  if (propertySchema.hasOwnProperty('minLength')) {
    validationObj.required = requiredValidator(propertySchema)
    validationObj.minLength = minLengthValidator(propertySchema, propertySchema.minLength)
  }

  if (propertySchema.hasOwnProperty('maxLength')) {
    validationObj.maxLength = maxLengthValidator(propertySchema, propertySchema.maxLength)
  }

  if (propertySchema.hasOwnProperty('minItems')) {
    validationObj.required = requiredValidator(propertySchema)
    validationObj.minItems = minLengthValidator(propertySchema, propertySchema.minItems)
  }

  if (propertySchema.hasOwnProperty('maxItems')) {
    validationObj.maxItems = maxLengthValidator(propertySchema, propertySchema.maxItems)
  }

  if (propertySchema.hasOwnProperty('minimum') && propertySchema.hasOwnProperty('maximum')) {
    validationObj.between = betweenValidator(propertySchema, propertySchema.minimum, propertySchema.maximum)
  } else if (propertySchema.hasOwnProperty('minimum')) {
    validationObj.required = requiredValidator(propertySchema) // TODO is this correct?
    validationObj.minimum = minValidator(propertySchema, propertySchema.minimum)
  } else if (propertySchema.hasOwnProperty('maximum')) {
    validationObj.maximum = maxValidator(propertySchema, propertySchema.maximum)
  }

  if (propertySchema.hasOwnProperty('pattern')) {
    validationObj.pattern = patternValidator(propertySchema, new RegExp(propertySchema.pattern))
  }

  if (propertySchema.hasOwnProperty('enum')) {
    validationObj.required = requiredValidator(propertySchema)
    validationObj.oneOf = oneOfValidator(propertySchema, propertySchema.enum)
  }

  if (propertySchema.hasOwnProperty('const')) {
    validationObj.required = requiredValidator(propertySchema)
    validationObj.equal = equalValidator(propertySchema, propertySchema.const)
  }

  if (propertySchema.hasOwnProperty('uniqueItems')) {
    validationObj.unique = uniqueValidator(propertySchema)
  }

  if (propertySchema.hasOwnProperty('items') && propertySchema.type === 'array' && propertySchema.items.type === 'object') {
    validationObj.$each = getValidationRules(propertySchema.items)
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
  var root = {}

  var roots = schemas.filter(function(schemaConfig) {
    return schemaConfig.mountPoint === '.'
  })

  if (roots.length) {
    root = roots.reduce(function(all, schemaConfig) {
      merge(all, getValidationRules(schemaConfig.schema))
      return all
    }, root)
  }

  return reduce(schemas, function(all, schemaConfig) {
    set(all, schemaConfig.mountPoint, getValidationRules(schemaConfig.schema))
    return all
  }, root)
}

module.exports = {
  install: function(Vue, options) {
    options = options || {}

    function defineReactives(parent, obj) {
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          Vue.util.defineReactive(parent, prop, obj[prop])
          if (isPlainObject(obj[prop])) {
            defineReactives(parent[prop], obj[prop])
          }
        }
      }
    }

    Vue.config.optionMergeStrategies.validations = mergeStrategy

    Vue.mixin({
      validations() {
        if (this.schema) {
          return generateValidationSchema(this.schema)
        } else {
          return {}
        }
      },
      beforeCreate() {
        if (!this.$options.schema) return
        var normalized = normalizeSchemas(this.$options.schema)
        var dataStructure = createDataProperties(normalized)

        // rewrite schemas normalized
        this.schema = normalized
        defineReactives(this, dataStructure)
      }
    })
  }
}
