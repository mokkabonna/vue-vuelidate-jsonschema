var allOfValidator = require('./validators/allOf')
var betweenValidator = require('./validators/between')
var equalValidator = require('./validators/const')
var oneOfValidator = require('./validators/oneOf')
var anyOfValidator = require('./validators/anyOf')
var notValidator = require('./validators/not')
var enumValidator = require('./validators/enum')
var itemsValidator = require('./validators/items')
var maxValidator = require('./validators/maximum')
var maxPropertiesValidator = require('./validators/maxProperties')
var minPropertiesValidator = require('./validators/minProperties')
var maxLengthValidator = require('./validators/maxLength')
var minValidator = require('./validators/minimum')
var minLengthValidator = require('./validators/minLength')
var multipleOfValidator = require('./validators/multipleOf')
var patternValidator = require('./validators/pattern')
var patternPropertiesValidator = require('./validators/patternProperties')
var requiredValidator = require('./validators/required')
var typeValidator = require('./validators/type')
var typeArrayValidator = require('./validators/typeArray')
var uniqueValidator = require('./validators/uniqueItems')
var reduce = require('lodash/reduce')

function getPropertyValidationRules(propertySchema, isRequired, isAttached, propKey) {
  var validationObj = {}

  function has(name) {
    return propertySchema.hasOwnProperty(name)
  }

  if (Array.isArray(propertySchema.type)) {
    validationObj.schemaTypes = typeArrayValidator(propertySchema, propertySchema.type.map(function(type) {
      return typeValidator(propertySchema, type)
    }))
  } else if (has('type')) {
    validationObj.schemaType = typeValidator(propertySchema, propertySchema.type)
  }

  if (has('allOf')) {
    validationObj.schemaAllOf = allOfValidator(propertySchema, propertySchema.allOf, getPropertyValidationRules)
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

  // add child properties
  if (has('properties')) {
    var req = propertySchema.required || []
    validationObj = reduce(propertySchema.properties, function(all, propertySchema, propKey) {
      all[propKey] = getPropertyValidationRules(propertySchema, req.indexOf(propKey) !== -1, isAttached, propKey)
      return all
    }, validationObj)
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

  if (has('maxProperties')) {
    validationObj.schemaMaxProperties = maxPropertiesValidator(propertySchema, propertySchema.maxProperties)
  }

  if (has('minProperties')) {
    validationObj.schemaMinProperties = minPropertiesValidator(propertySchema, propertySchema.minProperties)
  }

  if (has('multipleOf')) {
    validationObj.schemaMultipleOf = multipleOfValidator(propertySchema, propertySchema.multipleOf)
  }

  if (has('pattern')) {
    validationObj.schemaPattern = patternValidator(propertySchema, new RegExp(propertySchema.pattern))
  }

  if (has('patternProperties')) {
    validationObj.schemaPatternProperties = patternPropertiesValidator(propertySchema, propertySchema.patternProperties, getPropertyValidationRules)
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

  if (has('items') && propertySchema.items.type === 'object') {
    validationObj.$each = getPropertyValidationRules(propertySchema.items, true, isAttached)
  } else if (has('items')) {
    validationObj.schemaItems = itemsValidator(propertySchema, getPropertyValidationRules)
  }

  if (isRequired) {
    validationObj.schemaRequired = requiredValidator(propertySchema, isAttached)
  }

  return validationObj
}

module.exports = {
  getPropertyValidationRules: getPropertyValidationRules
}
