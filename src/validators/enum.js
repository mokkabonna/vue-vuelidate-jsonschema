var vuelidate = require('vuelidate')
var noParamsRequired = require('./noParamsRequired')
var isEqual = require('lodash/isEqual')

module.exports = function oneOfValidator(propertySchema, choices) {
  return vuelidate.withParams({
    type: 'schemaEnum',
    choices: choices,
    schema: propertySchema
  }, function(val) {
    if (!noParamsRequired(val)) return true
    return choices.some(function(choice) {
      return isEqual(val, choice)
    })
  })
}
