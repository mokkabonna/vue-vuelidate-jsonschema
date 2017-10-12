var vuelidate = require('vuelidate')
var noParamsRequired = require('./noParamsRequired')

module.exports = function requiredValidator(propertySchema, isAttached) {
  return vuelidate.withParams({
    type: 'schemaRequired',
    schema: propertySchema
  }, function(val, parent) {
    if (!parent && isAttached) {
      return true
    } else {
      return noParamsRequired(val)
    }
  })
}
