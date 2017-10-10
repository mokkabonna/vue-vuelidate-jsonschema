'use strict'
var mergeStrategy = require('./merge-validation-options')
var reduce = require('lodash/reduce')
var every = require('lodash/every')
var merge = require('lodash/merge')
var set = require('lodash/set')
var get = require('lodash/get')
var difference = require('lodash/difference')
var isEqual = require('lodash/isEqual')
var omit = require('lodash/omit')
var isString = require('lodash/isString')
var isPlainObject = require('lodash/isPlainObject')
var cloneDeep = require('lodash/cloneDeep')
var isFunction = require('lodash/isFunction')
var uniqBy = require('lodash/uniqBy')
var isBoolean = require('lodash/isBoolean')
var isFinite = require('lodash/isFinite')
var isNull = require('lodash/isNull')
var isInteger = require('lodash/isInteger')
var validators = require('vuelidate/lib/validators')
var vuelidate = require('vuelidate')

var Vue
var jsonTypes = {
  string: isString,
  object: isPlainObject,
  boolean: isBoolean,
  array: Array.isArray,
  'null': isNull,
  number: isFinite,
  integer: isInteger
}

function getVue(rootVm) {
  if (Vue) return Vue
  var InnerVue = rootVm.constructor
  /* istanbul ignore next */
  while (InnerVue.super) InnerVue = InnerVue.super
  Vue = InnerVue
  return InnerVue
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

function typeArrayValidator(propertySchema, validationCollection) {
  return vuelidate.withParams({
    type: 'schemaTypes',
    schema: propertySchema
  }, function(val) {
    return validators.or.apply(validators, validationCollection)(val)
  })
}

function minValidator(propertySchema, min) {
  return vuelidate.withParams({
    type: 'schemaMinimum',
    min: min,
    schema: propertySchema
  }, function(val) {
    if (!isFinite(val)) return true
    return val >= min
  })
}

function betweenValidator(propertySchema, min, max) {
  return vuelidate.withParams({
    type: 'schemaBetween',
    min: min,
    max: max,
    schema: propertySchema
  }, function(val) {
    if (!isFinite(val)) return true
    return val >= min && val <= max
  })
}

function maxValidator(propertySchema, max) {
  return vuelidate.withParams({
    type: 'schemaMaximum',
    max: max,
    schema: propertySchema
  }, function(val) {
    if (!isFinite(val)) return true
    return val <= max
  })
}

function patternValidator(propertySchema, pattern) {
  return vuelidate.withParams({
    type: 'schemaPattern',
    pattern: pattern,
    schema: propertySchema
  }, function(val) {
    if (!isString(val)) return true
    return pattern.test(val)
  })
}

function oneOfValidator(propertySchema, choices) {
  return vuelidate.withParams({
    type: 'schemaEnum',
    choices: choices,
    schema: propertySchema
  }, function(val) {
    return !noParamsRequired(val) || choices.indexOf(val) !== -1
  })
}

function equalValidator(propertySchema, equal) {
  return vuelidate.withParams({
    type: 'schemaConst',
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
    type: 'schemaUniqueItems',
    schema: propertySchema
  }, function(val) {
    if (!Array.isArray(val)) {
      return true
    }
    if (val.length < 2) {
      return true
    }
    return val.length === uniqBy(val, getUniqueness).length
  })
}

function itemsValidator(arraySchema) {
  var normalizedSchemas = Array.isArray(arraySchema.items) ? arraySchema.items : [arraySchema.items]

  return vuelidate.withParams({
    type: 'schemaItems',
    schema: arraySchema
  }, function(val) {
    if (!Array.isArray(val) || val.length === 0) {
      return true
    }

    var validatorGroups = normalizedSchemas.map(function(itemSchema) {
      return getPropertyValidationRules(arraySchema, itemSchema)
    })

    function validateGroup(item, validator, key) {
      if (isPlainObject(validator)) {
        return every(validator, function(innerValidator, innerKey) {
          if (item[key] === undefined) {
            return true
          }
          return validateGroup(item[key], innerValidator, innerKey)
        })
      } else {
        return validator(item)
      }
    }

    var validationForGroups = validatorGroups.map(function(validatorSet) {
      return function(item) {
        return every(validatorSet, function(validator, key) {
          return validateGroup(item, validator, key)
        })
      }
    })

    return val.every(function(item) {
      // Only one of the supplied schemas has to match
      return validationForGroups.some(function(validationGroup) {
        return validationGroup(item)
      })
    })
  })
}

function getDefaultValue(schema, isRequired) {
  if (schema.hasOwnProperty('default')) {
    return schema.default
  } else if (schema.type === 'integer' || schema.type === 'number') {
    return isRequired ? 0 : undefined
  } else if (schema.type === 'string') {
    return isRequired ? '' : undefined
  } else if (schema.type === 'boolean') {
    return isRequired ? false : undefined
  } else if (schema.type === 'object') {
    return isRequired ? {} : undefined
  } else if (schema.type === 'array') {
    return isRequired ? [] : undefined
  } else if (schema.type === 'null') {
    return isRequired ? null : undefined
  } else {
    return undefined
  }
}

function setProperties(base, schema) {
  Object.keys(schema.properties).forEach(function(key) {
    var innerSchema = schema.properties[key]
    var isRequired = Array.isArray(schema.required) && schema.required.indexOf(key) !== -1
    base[key] = getDefaultValue(innerSchema, isRequired)
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
    validationObj = getValidationRules(propertySchema)
    validationObj.schemaType = typeValidator(propertySchema, propertySchema.type)
    return validationObj
  }

  if (Array.isArray(propertySchema.type)) {
    validationObj.schemaTypes = typeArrayValidator(propertySchema, propertySchema.type.map(function(type) {
      return typeValidator(propertySchema, type)
    }))
  } else {
    validationObj.schemaType = typeValidator(propertySchema, propertySchema.type)
  }

  if (schema.required && schema.required.indexOf(propKey) !== -1) {
    validationObj.schemaRequired = requiredValidator(propertySchema)
  }

  if (propertySchema.hasOwnProperty('minLength')) {
    validationObj.schemaMinLength = minLengthValidator(propertySchema, propertySchema.minLength)
  }

  if (propertySchema.hasOwnProperty('maxLength')) {
    validationObj.schemaMaxLength = maxLengthValidator(propertySchema, propertySchema.maxLength)
  }

  if (propertySchema.hasOwnProperty('minItems')) {
    validationObj.schemaMinItems = minLengthValidator(propertySchema, propertySchema.minItems)
  }

  if (propertySchema.hasOwnProperty('maxItems')) {
    validationObj.schemaMaxItems = maxLengthValidator(propertySchema, propertySchema.maxItems)
  }

  if (propertySchema.hasOwnProperty('minimum') && propertySchema.hasOwnProperty('maximum')) {
    validationObj.schemaBetween = betweenValidator(propertySchema, propertySchema.minimum, propertySchema.maximum)
  } else if (propertySchema.hasOwnProperty('minimum')) {
    validationObj.schemaMinimum = minValidator(propertySchema, propertySchema.minimum)
  } else if (propertySchema.hasOwnProperty('maximum')) {
    validationObj.schemaMaximum = maxValidator(propertySchema, propertySchema.maximum)
  }

  if (propertySchema.hasOwnProperty('pattern')) {
    validationObj.schemaPattern = patternValidator(propertySchema, new RegExp(propertySchema.pattern))
  }

  if (propertySchema.hasOwnProperty('enum')) {
    validationObj.schemaEnum = oneOfValidator(propertySchema, propertySchema.enum)
  }

  if (propertySchema.hasOwnProperty('const')) {
    validationObj.schemaConst = equalValidator(propertySchema, propertySchema.const)
  }

  if (propertySchema.hasOwnProperty('uniqueItems')) {
    validationObj.schemaUniqueItems = uniqueValidator(propertySchema)
  }

  if (propertySchema.hasOwnProperty('items') && propertySchema.type === 'array' && propertySchema.items.type === 'object') {
    validationObj.$each = getValidationRules(propertySchema.items)
    validationObj.schemaItems = itemsValidator(propertySchema)
  } else if (propertySchema.hasOwnProperty('items') && propertySchema.type === 'array') {
    validationObj.schemaItems = itemsValidator(propertySchema)
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

  schemas.forEach(function(schemaConfig) {
    if (schemaConfig.schema.type !== 'object') {
      throw new Error('Schema with id ' + schemaConfig.schema.id + ' is not a schema of type object. This is currently not supported.')
    }
    if (!isPlainObject(schemaConfig.schema.properties)) {
      throw new Error('Schema with id ' + schemaConfig.schema.id + ' does not have a properties object.')
    }
  })

  var roots = schemas.filter(function(schemaConfig) {
    return schemaConfig.mountPoint === '.'
  })

  if (roots.length) {
    root = roots.reduce(function(all, schemaConfig) {
      merge(all, getValidationRules(schemaConfig.schema))
      return all
    }, root)
  }

  var rest = difference(schemas, roots)

  return reduce(rest, function(all, schemaConfig) {
    set(all, schemaConfig.mountPoint, getValidationRules(schemaConfig.schema))
    return all
  }, root)
}

var mixin = {
  beforeCreate: function() {
    var self = this
    if (!this.$options.schema) {
      return
    }

    var Vue = getVue(this)

    this.$options.validations = mergeStrategy(function() {
      if (this.$schema && !isFunction(this.$schema.then)) {
        return generateValidationSchema(this.$schema)
      } else {
        return {}
      }
    }, this.$options.validations)

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

    function generateDataStructure(self) {
      var dataStructure = createDataProperties(self.$schema)
      defineReactives(self, dataStructure)
    }

    var normalized = normalizeSchemas(this.$options.schema)

    var calledSchemas = normalized.map(function(schemaConfig) {
      if (isFunction(schemaConfig.schema)) {
        var config = cloneDeep(schemaConfig)
        config.schema = schemaConfig.schema()
        return config
      }

      return schemaConfig
    })

    var hasPromise = calledSchemas.some(function(schemaConfig) {
      return isFunction(schemaConfig.schema.then)
    })

    if (hasPromise) {
      var allSchemaPromise = Promise.all(calledSchemas.map(function(schemaConfig) {
        return schemaConfig.schema.then(function(schema) {
          var newConfig = omit(schemaConfig, 'schema')
          newConfig.schema = schema
          return newConfig
        })
      })).then(function(schemaConfigs) {
        self.$schema = schemaConfigs
        generateDataStructure(self)
      })

      Vue.util.defineReactive(this, '$schema', allSchemaPromise)
    } else {
      // rewrite schemas normalized
      Vue.util.defineReactive(this, '$schema', normalized)
      generateDataStructure(this)
    }
  }
}

module.exports = {
  mixin: mixin,
  install: function(Vue, options) {
    Vue.mixin(mixin)
  }
}
