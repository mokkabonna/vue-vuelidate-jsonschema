var vuelidate = require('vuelidate')
var isPlainObject = require('lodash/isPlainObject')
var validate = require('../validate')

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
      return validate(validatorGroup, property)
    })
  })
}
