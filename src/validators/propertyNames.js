var vuelidate = require('vuelidate')
var isPlainObject = require('lodash/isPlainObject')
var every = require('lodash/every')

function validateGroup(item, validator, key) {
  if (isPlainObject(validator)) {
    return every(validator, function(innerValidator, innerKey) {
      if (item === undefined) {
        return true
      }
      return validateGroup(item[key], innerValidator, innerKey)
    })
  } else {
    return validator(item)
  }
}

module.exports = function propertyNamesValidator(propertySchema, propertyNames, getPropertyValidationRules) {
  return vuelidate.withParams({
    type: 'schemaPropertyNames',
    propertyNames: propertyNames,
    schema: propertySchema
  }, function(obj) {
    if (!isPlainObject(obj)) return true
    var properties = Object.keys(obj)
    var validatorGroup = getPropertyValidationRules(propertyNames)

    return properties.every(function(property) {
      return every(validatorGroup, function(validator, validatorKey) {
        return validateGroup(property, validator, validatorKey)
      })
    })
  })
}
