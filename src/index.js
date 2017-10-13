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
var flattenObject = require('flat')
var propertyRules = require('./property-rules')
var createDataProperties = require('./scaffold')

var cachedVue

function getVue(rootVm) {
  if (cachedVue) {
    return cachedVue
  }
  var InnerVue = rootVm.constructor
  /* istanbul ignore next */
  while (InnerVue.super) {
    InnerVue = InnerVue.super
  }
  cachedVue = InnerVue
  return InnerVue
}

function normalizeSchemas(schemaConfig) {
  if (Array.isArray(schemaConfig)) {
    return schemaConfig.map(function(config) {
      if (config.mountPoint) {
        return config
      } else {
        return {mountPoint: 'schema', schema: config}
      }
    })
  } else {
    if (schemaConfig.mountPoint) {
      return [schemaConfig]
    } else {
      return [
        {
          mountPoint: 'schema',
          schema: schemaConfig
        }
      ]
    }
  }
}

function generateValidationSchema(schemas) {
  var root = {}

  var roots = schemas.filter(function(schemaConfig) {
    return schemaConfig.mountPoint === '.'
  })

  roots.forEach(function(schemaConfig) {
    if (schemaConfig.schema.type !== 'object') {
      throw new Error('Schema with id ' + schemaConfig.schema.id + ' has mount point at the root and is not a schema of type object. This is not supported. For non object schmeas you must define a mount point.')
    }

    if (schemaConfig.schema.hasOwnProperty('patternProperties')) {
      throw new Error('Schema with id ' + schemaConfig.schema.id + ' has sibling validator patternProperties. This is not supported when mounting on root. Use a mount point.')
    }

    if (!(schemaConfig.schema.additionalProperties === true || schemaConfig.schema.additionalProperties === undefined)) {
      throw new Error('Schema with id ' + schemaConfig.schema.id + ' has sibling validators additionalProperties not equal to true or undefined. This is not supported when mounting on root. Since there are lots of extra properties on a vue instance.')
    }
  })

  if (roots.length) {
    root = roots.reduce(function(all, schemaConfig) {
      merge(all, propertyRules.getPropertyValidationRules(schemaConfig.schema, true, true))
      return all
    }, root)
  }

  var rest = difference(schemas, roots)

  return reduce(rest, function(all, schemaConfig) {
    var existing = get(all, schemaConfig.mountPoint)
    set(all, schemaConfig.mountPoint, merge(existing, propertyRules.getPropertyValidationRules(schemaConfig.schema, true, true)))
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

    this.$options.methods = Vue.config.optionMergeStrategies.methods({
      getSchemaData: function(schemaConfig) {
        var originallyArray = Array.isArray(schemaConfig)
        var normalizedSchemas = Array.isArray(schemaConfig)
          ? schemaConfig
          : [schemaConfig]
        var self = this
        return reduce(normalizedSchemas, function(all, schema) {
          var root = self
          var flatStructure = flattenObject(createDataProperties(normalizedSchemas))
          if (schemaConfig.mountPoint !== '.' && !originallyArray) {
            flatStructure = flattenObject(get(self, schemaConfig.mountPoint))
            root = get(self, schemaConfig.mountPoint)

            if (isPlainObject(root)) {
              flatStructure = reduce(flatStructure, function(all, val, key) {
                all[key.replace(schemaConfig.mountPoint, '').replace(/^\./, '')] = val
                return all
              }, {})
            } else {
              return root
            }
          }

          return reduce(flatStructure, function(all, val, path) {
            return set(all, path, get(root, path))
          }, all)
        }, {})
      }
    }, this.$options.methods)

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
      calledSchemas.forEach(function(config, i) {
        if (config.mountPoint === '.' && isFunction(config.schema.then)) {
          throw new Error('Schema with index ' + i + ' has mount point at the root and is a promise. This is not supported. You can\'t mount to root async. Due to vue limitation. Use a mount point.')
        }
      })

      var allSchemaPromise = Promise.all(calledSchemas.map(function(schemaConfig) {
        return schemaConfig.schema.then(function(schema) {
          var newConfig = omit(schemaConfig, 'schema')
          newConfig.schema = schema
          return newConfig
        })
      })).then(function(schemaConfigs) {
        // reactivity is already set up, we can just replace properties
        self.$schema = schemaConfigs
        Object.assign(self, createDataProperties(schemaConfigs))
      })

      Vue.util.defineReactive(this, '$schema', allSchemaPromise)
      this.$options.data = Vue.config.optionMergeStrategies.data(function() {
        return createDataProperties(calledSchemas, true)
      }, this.$options.data)
    } else {
      // rewrite schemas normalized
      Vue.util.defineReactive(this, '$schema', calledSchemas)
      this.$options.data = Vue.config.optionMergeStrategies.data(function() {
        return createDataProperties(calledSchemas)
      }, this.$options.data)
    }
  }
}

module.exports = {
  mixin: mixin,
  install: function(Vue, options) {
    Vue.mixin(mixin)
  }
}
