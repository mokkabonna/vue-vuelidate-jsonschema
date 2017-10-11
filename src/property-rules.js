var allOfValidator = require('./validators/allOf')
var betweenValidator = require('./validators/between')
var equalValidator = require('./validators/const')
var oneOfValidator = require('./validators/enum')
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
var reduce = require('lodash/reduce')

function getValidationRulesForObject(objectSchema) {
  var validationObj = {}

  validationObj.schemaType = typeValidator(objectSchema, objectSchema.type)
  if (objectSchema.hasOwnProperty('allOf')) {
    validationObj.schemaAllOf = allOfValidator(objectSchema, objectSchema.allOf, getPropertyValidationRules)
  }

  return reduce(objectSchema.properties, function(all, propertySchema, propKey) {
    var validationObj = getPropertyValidationRules(objectSchema, propertySchema, propKey)
    all[propKey] = validationObj
    return all
  }, validationObj)
}

function getPropertyValidationRules(schema, propertySchema, propKey) {
  var validationObj = {}

  function has(name) {
    return propertySchema.hasOwnProperty(name)
  }

  function is(type) {
    return propertySchema.type === type
  }

  if (is('object')) {
    validationObj = getValidationRulesForObject(propertySchema)
    return validationObj
  }

  if (Array.isArray(propertySchema.type)) {
    validationObj.schemaTypes = typeArrayValidator(propertySchema, propertySchema.type.map(function(type) {
      return typeValidator(propertySchema, type)
    }))
  } else {
    validationObj.schemaType = typeValidator(propertySchema, propertySchema.type)
  }

  if (Array.isArray(schema.required) && schema.required.indexOf(propKey) !== -1) {
    validationObj.schemaRequired = requiredValidator(propertySchema)
  }

  if (has('allOf')) {
    validationObj.schemaAllOf = allOfValidator(propertySchema, propertySchema.allOf)
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
    validationObj.schemaEnum = oneOfValidator(propertySchema, propertySchema.enum)
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

  return validationObj
}

module.exports = {
  getPropertyValidationRules: getPropertyValidationRules,
  getValidationRulesForObject: getValidationRulesForObject
}
