var allOfValidator = require('./validators/allOf')
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
var reduce = require('lodash/reduce')

function getValidationRulesForObject(objectSchema, objectKey) {
  return reduce(objectSchema.properties, function(all, propertySchema, propKey) {
    var validationObj = getPropertyValidationRules(objectSchema, propertySchema, objectKey, propKey)
    all[propKey] = validationObj
    return all
  }, {})
}

function getPropertyValidationRules(parentSchema, propertySchema, parentKey, propKey) {
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
  } else if (has('type')) {
    validationObj.schemaType = typeValidator(propertySchema, propertySchema.type)
  }

  if (has('allOf')) {
    validationObj.schemaAllOf = allOfValidator(propertySchema, propertySchema.allOf, getPropertyValidationRules, parentKey)
  }

  if (has('oneOf')) {
    validationObj.schemaOneOf = oneOfValidator(propertySchema, propertySchema.oneOf, getPropertyValidationRules, parentKey)
  }

  if (has('anyOf')) {
    validationObj.schemaAnyOf = anyOfValidator(propertySchema, propertySchema.anyOf, getPropertyValidationRules, parentKey)
  }

  if (has('not')) {
    validationObj.schemaNot = notValidator(propertySchema, propertySchema.not, getPropertyValidationRules, parentKey)
  }

  // add child properties
  if (is('object') && has('properties')) {
    validationObj = Object.assign(validationObj, getValidationRulesForObject(propertySchema, parentKey))
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
    validationObj.$each = getPropertyValidationRules(propertySchema, propertySchema.items, parentKey || '')
    validationObj.schemaItems = itemsValidator(propertySchema, getPropertyValidationRules, parentKey)
  } else if (has('items') && is('array')) {
    validationObj.schemaItems = itemsValidator(propertySchema, getPropertyValidationRules, parentKey)
  }

  if (Array.isArray(parentSchema.required) && parentSchema.required.indexOf(propKey) !== -1) {
    validationObj.schemaRequired = requiredValidator(propertySchema, parentKey)
  }

  return validationObj
}

module.exports = {
  getPropertyValidationRules: getPropertyValidationRules
}
