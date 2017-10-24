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
  } else if (schema.hasOwnProperty('const')) {
    return schema.const
  } else if (!isRequired) {
    return undefined
  } else {
    var defaultValue = defaultValues[schema.type]
    return isFunction(defaultValue)
      ? defaultValue()
      : defaultValue
  }
}

function setProperties(base, schema, ignoreDefaultProp, shallow, schemas) {
  if (schema.default !== undefined) {
    return Object.assign(base, schema.default)
  }
  if (!base) return
  schemas = schemas || []
  var additionalScaffoldingSchemas = ['allOf']
  var additionalShallow = ['anyOf', 'oneOf', 'not']
  // set all properties based on default values etc in allOf
  additionalScaffoldingSchemas.forEach(function(prop) {
    if (Array.isArray(schema[prop])) {
      schema[prop].forEach(function(subSchema) {
        setProperties(base, subSchema, false, false, schemas.concat(schema, subSchema))
      })
    }
  })

  additionalShallow.forEach(function(prop) {
    if (Array.isArray(schema[prop])) {
      schema[prop].forEach(function(subSchema) {
        setProperties(base, subSchema, true, true, schemas.concat(schema, subSchema))
      })
    } else if (isPlainObject(schema[prop])) {
      setProperties(base, schema[prop], true, true, schemas.concat(schema))
    }
  })

  // then add properties from base object, taking precedence
  if (isPlainObject(schema.properties)) {
    schemas.push(schema)
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
        if (schemas.indexOf(innerSchema) !== -1) return
        setProperties(base[key], innerSchema, ignoreDefaultProp, false, schemas.concat(schema))
      }
    })
  }
}

function createDataProperties(schemas, shallow) {
  var allAreArray = schemas.every(function (schema) {
    return schema.type === 'array'
  })

  return reduce(schemas, function(all, schemaConfig) {
    if (shallow) {
      set(all, schemaConfig.mountPoint, undefined)
      return all
    }

    if (schemaConfig.mountPoint !== '.') {
      // scaffold structure

      var mountPoint = get(all, schemaConfig.mountPoint)
      var defValue = schemaConfig.schema.hasOwnProperty('type') ? getDefaultValue(schemaConfig.schema, true) : {}

      if (isPlainObject(mountPoint)) {
        mountPoint = merge(mountPoint, defValue)
      } else {
        mountPoint = defValue
      }

      set(all, schemaConfig.mountPoint, mountPoint)
      if (isPlainObject(mountPoint)) {
        setProperties(get(all, schemaConfig.mountPoint), schemaConfig.schema)
      }
    } else {
      setProperties(all, schemaConfig.schema)
    }

    return all
  }, allAreArray ? [] : {})
}

module.exports = createDataProperties
