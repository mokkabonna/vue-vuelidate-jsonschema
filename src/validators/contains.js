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

module.exports = function containsValidator(propertySchema, contains, getPropertyValidationRules) {
  return vuelidate.withParams({
    type: 'schemaContains',
    contains: contains,
    schema: propertySchema
  }, function(values) {
    if (!Array.isArray(values)) return true

    var validatorGroup = getPropertyValidationRules(contains)

    return values.some(function(value) {
      return every(validatorGroup, function(validator, key) {
        return validateGroup(value, validator, key)
      })
    })
  })
}
