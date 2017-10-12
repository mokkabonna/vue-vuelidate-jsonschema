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

var cachedVue
var defaultValues = {
  integer: 0,
  number: 0,
  string: '',
  boolean: false,
  object: function() {
    return {} // make sure we don't share object reference, create new copy each time
  },
  array: function() {
    return [] // make sure we don't share object reference, create new copy each time
  },
  'null': null
}

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

function getDefaultValue(schema, isRequired, ignoreDefaultProp) {
  if (ignoreDefaultProp) {
    return undefined
  } else if (schema.hasOwnProperty('default')) {
    return schema.default
  } else if (!isRequired) {
    return undefined
  } else {
    var defaultValue = defaultValues[schema.type]
    return isFunction(defaultValue) ? defaultValue() : defaultValue
  }
}

function setProperties(base, schema, ignoreDefaultProp) {
  var additionalScaffoldingSchemas = ['oneOf', 'anyOf', 'allOf']
  var additionalNonDefault = ['not']
  // set all properties based on default values etc in allOf

  additionalScaffoldingSchemas.forEach(function(prop) {
    if (Array.isArray(schema[prop])) {
      schema[prop].forEach(function(subSchema) {
        setProperties(base, subSchema)
      })
    }
  })

  additionalNonDefault.forEach(function(prop) {
    if (Array.isArray(schema[prop])) {
      schema[prop].forEach(function(subSchema) {
        setProperties(base, subSchema, true)
      })
    } else if (isPlainObject(schema[prop])) {
      setProperties(base, schema[prop], true)
    }
  })

  // then add properties from base object, taking precedence
  if (isPlainObject(schema.properties)) {
    Object.keys(schema.properties).forEach(function(key) {
      var innerSchema = schema.properties[key]
      var isRequired = Array.isArray(schema.required) && schema.required.indexOf(key) !== -1
      var existing = base[key]
      if (isPlainObject(existing)) {
        base[key] = merge(existing, getDefaultValue(innerSchema, isRequired, ignoreDefaultProp))
      } else {
        base[key] = getDefaultValue(innerSchema, isRequired, ignoreDefaultProp)
      }
      if (innerSchema.type === 'object' && innerSchema.properties) {
        setProperties(base[key], innerSchema, ignoreDefaultProp)
      }
    })
  }
}

function createDataProperties(schemas) {
  return reduce(schemas, function(all, schemaConfig) {
    if (schemaConfig.mountPoint !== '.') {
      // scaffold structure

      var mountPoint = get(all, schemaConfig.mountPoint)
      var defValue = getDefaultValue(schemaConfig.schema, true)

      if (isPlainObject(mountPoint)) {
        mountPoint = merge(mountPoint, defValue)
      } else {
        mountPoint = defValue
      }

      set(all, schemaConfig.mountPoint, mountPoint)
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
    if (schemaConfig.mountPoint) {
      return [schemaConfig]
    } else {
      return [{
        mountPoint: '.',
        schema: schemaConfig
      }]
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
      throw new Error('Schema with id ' + schemaConfig.schema.id + ' has sibling validators additionalProperties not equal to true. This is not supported when mounting on root. Since there are lots of extra properties on a vue instance.')
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
    set(all, schemaConfig.mountPoint, propertyRules.getPropertyValidationRules(schemaConfig.schema, true, true))
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
        var normalizedSchemas = Array.isArray(schemaConfig) ? schemaConfig : [schemaConfig]
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
      var allSchemaPromise = Promise.all(calledSchemas.map(function(schemaConfig) {
        return schemaConfig.schema.then(function(schema) {
          var newConfig = omit(schemaConfig, 'schema')
          newConfig.schema = schema
          return newConfig
        })
      })).then(function(schemaConfigs) {
        self.$schema = schemaConfigs
        defineReactives(self, createDataProperties(schemaConfigs))
      })

      Vue.util.defineReactive(this, '$schema', allSchemaPromise)
    } else {
      // rewrite schemas normalized
      Vue.util.defineReactive(this, '$schema', normalized)
      this.$options.data = Vue.config.optionMergeStrategies.data(function() {
        return createDataProperties(normalized)
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
