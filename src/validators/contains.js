var vuelidate = require('vuelidate')
var validate = require('../validate')

module.exports = function containsValidator(propertySchema, contains, getPropertyValidationRules) {
  return vuelidate.withParams({
    type: 'schemaContains',
    contains: contains,
    schema: propertySchema
  }, function(values) {
    if (!Array.isArray(values)) return true

    var validatorGroup = getPropertyValidationRules(contains)

    return values.some(function(value) {
      return validate(validatorGroup, value)
    })
  })
}
