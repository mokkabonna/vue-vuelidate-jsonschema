var reduce = require('lodash/reduce')
var merge = require('lodash/merge')
var set = require('lodash/set')
var get = require('lodash/get')
var isPlainObject = require('lodash/isPlainObject')
var isFunction = require('lodash/isFunction')

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

function setProperties(base, schema, ignoreDefaultProp, shallow) {
  var additionalScaffoldingSchemas = ['allOf']
  var additionalShallow = ['anyOf', 'oneOf', 'not']
  // set all properties based on default values etc in allOf

  additionalScaffoldingSchemas.forEach(function(prop) {
    if (Array.isArray(schema[prop])) {
      schema[prop].forEach(function(subSchema) {
        setProperties(base, subSchema)
      })
    }
  })

  additionalShallow.forEach(function(prop) {
    if (Array.isArray(schema[prop])) {
      schema[prop].forEach(function(subSchema) {
        setProperties(base, subSchema, true, true)
      })
    } else if (isPlainObject(schema[prop])) {
      setProperties(base, schema[prop], true, true)
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
      if (!shallow && innerSchema.type === 'object' && innerSchema.properties) {
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

module.exports = createDataProperties
