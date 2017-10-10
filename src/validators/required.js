var vuelidate = require('vuelidate')
var noParamsRequired = require('./noParamsRequired')

module.exports = function requiredValidator(propertySchema) {
  return vuelidate.withParams({
    type: 'schemaRequired',
    schema: propertySchema
  }, noParamsRequired)
}
