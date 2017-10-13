var vuelidate = require('vuelidate')
var noParamsRequired = require('./noParamsRequired')
var isPlainObject = require('lodash/isPlainObject')

module.exports = function requiredValidator(propertySchema, isAttached) {
  return vuelidate.withParams({
    type: 'schemaRequired',
    schema: propertySchema
  }, function(val, parent) {
    if (!isPlainObject(parent) && isAttached) {
      return true
    } else if (!parent && isAttached) {
      return true
    } else {
      return noParamsRequired(val)
    }
  })
}
