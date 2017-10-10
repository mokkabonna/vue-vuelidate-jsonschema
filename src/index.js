'use strict'
var mergeStrategy = require('./merge-validation-options')
var reduce = require('lodash/reduce')
var merge = require('lodash/merge')
var set = require('lodash/set')
var get = require('lodash/get')
var difference = require('lodash/difference')
var omit = require('lodash/omit')
var isPlainObject = require('lodash/isPlainObject')
var cloneDeep = require('lodash/cloneDeep')
var isFunction = require('lodash/isFunction')
var propertyRules = require('./property-rules')

var cachedVue

function getVue(rootVm) {
  if (cachedVue) return cachedVue
  var InnerVue = rootVm.constructor
  /* istanbul ignore next */
  while (InnerVue.super) InnerVue = InnerVue.super
  cachedVue = InnerVue
  return InnerVue
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
      merge(all, propertyRules.getValidationRules(schemaConfig.schema))
      return all
    }, root)
  }

  var rest = difference(schemas, roots)

  return reduce(rest, function(all, schemaConfig) {
    set(all, schemaConfig.mountPoint, propertyRules.getValidationRules(schemaConfig.schema))
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
