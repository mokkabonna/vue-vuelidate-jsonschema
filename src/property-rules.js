var validators = require('vuelidate/lib/validators')
var betweenValidator = require('./validators/between')
var equalValidator = require('./validators/const')
var oneOfValidator = require('./validators/oneOf')
var anyOfValidator = require('./validators/anyOf')
var notValidator = require('./validators/not')
var enumValidator = require('./validators/enum')
var itemsValidator = require('./validators/items')
var maxValidator = require('./validators/maximum')
var maxLengthValidator = require('./validators/maxLength')
var minValidator = require('./validators/minimum')
var minLengthValidator = require('./validators/minLength')
var multipleOfValidator = require('./validators/multipleOf')
var patternValidator = require('./validators/pattern')
var requiredValidator = require('./validators/required')
var typeValidator = require('./validators/type')
var typeArrayValidator = require('./validators/typeArray')
var uniqueValidator = require('./validators/uniqueItems')
var uniq = require('lodash/uniq')
var reduce = require('lodash/reduce')
var isFunction = require('lodash/isFunction')
var isPlainObject = require('lodash/isPlainObject')

function getValidationRulesForObject(objectSchema) {
  return reduce(objectSchema.properties, function(all, propertySchema, propKey) {
    var validationObj = getPropertyValidationRules(objectSchema, propertySchema, propKey)
    all[propKey] = validationObj
    return all
  }, {})
}
  
function mergeIntoArray(to, from) {
  var allKeys = uniq(Object.keys(to).concat(Object.keys(from)))
  
  allKeys.forEach(function (key) {
    var toVal = to[key]
    var fromVal = from[key]

    if (to.hasOwnProperty(key) && from.hasOwnProperty(key) && isFunction(fromVal)) {
      to[key] = [].concat(toVal).concat(fromVal)
    } else if (isPlainObject(toVal) && isPlainObject(fromVal)) {
      mergeIntoArray(toVal, fromVal)
    } else if (fromVal) {
      to[key] = fromVal
    }
  })
}

function mergeValidators(to, schemas) {
  schemas.forEach(function (schema) {
    mergeIntoArray(to, getPropertyValidationRules({}, schema))
  })
}

function createAndValidator(obj) {
  Object.keys(obj).forEach(function (key) {
    // TODO: are array valid in a vuelidate validations config? if so we need a different approach
    var value = obj[key]
    if (Array.isArray(value)) {
      obj[key] = validators.and.apply(null, value)
    } else if (isPlainObject(value)) {
      createAndValidator(value)
    }
  })
}

function getPropertyValidationRules(schema, propertySchema, propKey) {
  var validationObj = {}

  function has(name) {
    return propertySchema.hasOwnProperty(name)
  }

  function is(type) {
    return propertySchema.type === type
  }

  if (Array.isArray(propertySchema.type)) {
    validationObj.schemaTypes = typeArrayValidator(propertySchema, propertySchema.type.map(function(type) {
      return typeValidator(propertySchema, type)
    }))
  } else if(has('type')){
    validationObj.schemaType = typeValidator(propertySchema, propertySchema.type)
  }

  if (has('oneOf')) {
    validationObj.schemaOneOf = oneOfValidator(propertySchema, propertySchema.oneOf, getPropertyValidationRules)
  }

  if (has('anyOf')) {
    validationObj.schemaAnyOf = anyOfValidator(propertySchema, propertySchema.anyOf, getPropertyValidationRules)
  }

  if (has('not')) {
    validationObj.schemaNot = notValidator(propertySchema, propertySchema.not, getPropertyValidationRules)
  }

  if (Array.isArray(schema.required) && schema.required.indexOf(propKey) !== -1) {
    validationObj.schemaRequired = requiredValidator(propertySchema)
  }

  // add child properties
  if (is('object') && has('properties')) {
    validationObj = Object.assign(validationObj, getValidationRulesForObject(propertySchema))
  }

  if (has('minLength')) {
    validationObj.schemaMinLength = minLengthValidator(propertySchema, propertySchema.minLength)
  }

  if (has('maxLength')) {
    validationObj.schemaMaxLength = maxLengthValidator(propertySchema, propertySchema.maxLength)
  }

  if (has('minItems')) {
    validationObj.schemaMinItems = minLengthValidator(propertySchema, propertySchema.minItems)
  }

  if (has('maxItems')) {
    validationObj.schemaMaxItems = maxLengthValidator(propertySchema, propertySchema.maxItems)
  }

  if (has('minimum') && has('maximum')) {
    validationObj.schemaBetween = betweenValidator(propertySchema, propertySchema.minimum, propertySchema.maximum)
  } else if (has('minimum')) {
    validationObj.schemaMinimum = minValidator(propertySchema, propertySchema.minimum)
  } else if (has('maximum')) {
    validationObj.schemaMaximum = maxValidator(propertySchema, propertySchema.maximum)
  }

  if (has('multipleOf')) {
    validationObj.schemaMultipleOf = multipleOfValidator(propertySchema, propertySchema.multipleOf)
  }

  if (has('pattern')) {
    validationObj.schemaPattern = patternValidator(propertySchema, new RegExp(propertySchema.pattern))
  }

  if (has('enum')) {
    validationObj.schemaEnum = enumValidator(propertySchema, propertySchema.enum)
  }

  if (has('const')) {
    validationObj.schemaConst = equalValidator(propertySchema, propertySchema.const)
  }

  if (has('uniqueItems')) {
    validationObj.schemaUniqueItems = uniqueValidator(propertySchema)
  }

  if (has('items') && is('array') && propertySchema.items.type === 'object') {
    validationObj.$each = getValidationRulesForObject(propertySchema.items)
    validationObj.schemaItems = itemsValidator(propertySchema, getPropertyValidationRules)
  } else if (has('items') && is('array')) {
    validationObj.schemaItems = itemsValidator(propertySchema, getPropertyValidationRules)
  }

  if (has('allOf')) {
    mergeValidators(validationObj, propertySchema.allOf)
    createAndValidator(validationObj)
  }

  return validationObj
}

module.exports = {
  getPropertyValidationRules: getPropertyValidationRules
}
