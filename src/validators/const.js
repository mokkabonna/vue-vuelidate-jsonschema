var vuelidate = require('vuelidate')
var isEqual = require('lodash/isEqual')
var noParamsRequired = require('./noParamsRequired')

module.exports = function equalValidator(propertySchema, equal) {
  return vuelidate.withParams({
    type: 'schemaConst',
    equal: equal,
    schema: propertySchema
  }, function(val) {
    return !noParamsRequired(val) || isEqual(equal, val)
  })
}
