var vuelidate = require('vuelidate')
var noParamsRequired = require('./noParamsRequired')

module.exports = function oneOfValidator(propertySchema, choices) {
  return vuelidate.withParams({
    type: 'schemaEnum',
    choices: choices,
    schema: propertySchema
  }, function(val) {
    return !noParamsRequired(val) || choices.indexOf(val) !== -1
  })
}
