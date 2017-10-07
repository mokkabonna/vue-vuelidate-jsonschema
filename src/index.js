'use strict'

var reduce = require('lodash/reduce')
var set = require('lodash/set')
var isString = require('lodash/isString')
var omit = require('lodash/omit')
var validators = require('vuelidate/lib/validators')
var vuelidate = require('vuelidate')

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

function getValidationRules(schema) {
  return reduce(schema.properties, function(all, propertySchema, propKey) {

    var validationObj = {}

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

    if (propertySchema.hasOwnProperty('minimum')) {
      validationObj.required = validators.required
      validationObj.minimum = minValidator(propertySchema.minimum)
    }

    if (propertySchema.hasOwnProperty('maximum')) {
      validationObj.maximum = maxValidator(propertySchema.maximum)
    }

    if (propertySchema.hasOwnProperty('pattern')) {
      validationObj.pattern = patternValidator(new RegExp(propertySchema.pattern))
    }

    if (propertySchema.hasOwnProperty('enum')) {
      validationObj.required = validators.required
      validationObj.oneOf = oneOfValidator(propertySchema.enum)
    }

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
