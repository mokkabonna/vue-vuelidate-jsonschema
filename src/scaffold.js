var reduce = require('lodash/reduce')
var merge = require('lodash/merge')
var set = require('lodash/set')
var get = require('lodash/get')
var forEach = require('lodash/forEach')
var upperFirst = require('lodash/upperFirst')
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
    return schema['const']
  } else if (!isRequired) {
    return undefined
  } else {
    var defaultValue = defaultValues[schema.type]
    return isFunction(defaultValue)
      ? defaultValue()
      : defaultValue
  }
}

var additionalScaffoldingSchemas = ['allOf']
var additionalShallow = ['anyOf', 'oneOf', 'not']

function setProperties(base, schema, ignoreDefaultProp, shallow) {
  if (schema.default !== undefined) {
    return Object.assign(base, schema.default)
  }

  if (!base) {
    return
  }
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

function fillArray(base, schema) {
  if (schema.default !== undefined) {
    base.splice.apply(base, [0, base.length].concat(schema.default))
    return
  }
  if (Array.isArray(base) && schema.items && schema.minItems > 0) {
    var template
    if (isPlainObject(schema.items)) {
      template = schema.items
    }

    for (var i = 0; i < schema.minItems; i++) {
      if (Array.isArray(schema.items)) {
        template = findCurrentItemsTemplate(i, schema)
      }
      if (template.type === 'object' || template.type === 'array' || template.default !== undefined) {
        base.push(getDefaultValue(template, true))
        if (isPlainObject(base[i])) {
          setProperties(base[i], template)
        }
      }
    }
  }
}

function createHelper(base, prefix, prop, schema) {
  base[prefix + upperFirst(prop)] = function(values) {
    var created = createDataProperties([
      {
        mountPoint: 'mount',
        schema: schema
      }
    ], false, true)

    Object.assign(created.mount, values)
    base[prop] = created.mount
    return created.mount
  }
}

function findCurrentItemsTemplate(index, schema) {
  var possibleSchema = schema.items[index]
  if (possibleSchema) {
    return possibleSchema
  } else if (isPlainObject(schema.additionalItems)) {
    return schema.additionalItems
  } else {
    return {}
  }
}

function createArrayHelper(base, prefix, schema) {
  base[prefix + 'Item'] = function(values) {
    var schemaToTemplate
    if (Array.isArray(schema.items)) {
      schemaToTemplate = findCurrentItemsTemplate(base.length, schema)
    } else {
      schemaToTemplate = schema.items
    }
    var created = createDataProperties([
      {
        mountPoint: 'mount',
        schema: schemaToTemplate
      }
    ], false, true)

    Object.assign(created.mount, values)
    base.push(created.mount)
    return created.mount
  }
}

function addObjectHelpers(base, schema) {
  forEach(schema.properties, function(innerSchema, prop) {
    if (innerSchema.type === 'object' && isPlainObject(innerSchema.properties)) {
      createHelper(base, 'create', prop, innerSchema)
    } else if (innerSchema.type === 'array' && innerSchema.items) {
      addArrayHelpers(base, innerSchema)
    }
  })
}

function addArrayHelpers(base, schema) {
  createArrayHelper(base, 'push', schema)
}

function createDataProperties(schemas, shallow, createHelpers) {
  var allAreArray = schemas.every(function(schema) {
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
      var defValue = schemaConfig.schema.hasOwnProperty('type')
        ? getDefaultValue(schemaConfig.schema, true)
        : {}

      if (isPlainObject(mountPoint)) {
        mountPoint = merge(mountPoint, defValue)
      } else {
        mountPoint = defValue
      }

      set(all, schemaConfig.mountPoint, mountPoint)

      if (isPlainObject(mountPoint)) {
        setProperties(mountPoint, schemaConfig.schema)
      } else if (Array.isArray(mountPoint)) {
        fillArray(mountPoint, schemaConfig.schema)
      }

      if (createHelpers) {
        if (isPlainObject(mountPoint)) {
          addObjectHelpers(mountPoint, schemaConfig.schema)
        } else if (Array.isArray(mountPoint)) {
          addArrayHelpers(mountPoint, schemaConfig.schema)
        }
      }
    } else {
      setProperties(all, schemaConfig.schema)
      if (createHelpers && isPlainObject(all)) {
        addObjectHelpers(all, schemaConfig.schema)
      }
    }

    return all
  }, allAreArray
    ? []
    : {})
}

module.exports = createDataProperties
