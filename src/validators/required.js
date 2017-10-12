var vuelidate = require('vuelidate')
var noParamsRequired = require('./noParamsRequired')

module.exports = function requiredValidator(propertySchema, parentKey) {
  return vuelidate.withParams({
    type: 'schemaRequired',
    schema: propertySchema
  }, function(val, parent) {
    if (!parent && parentKey === '') {
      return true
    } else {
      return noParamsRequired(val)
    }
  })
}
