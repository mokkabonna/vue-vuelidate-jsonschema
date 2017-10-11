var vuelidate = require('vuelidate')
var isFinite = require('lodash/isFinite')
var isInteger = require('lodash/isInteger')

module.exports = function multipleOfValidator(propertySchema, divider) {
  return vuelidate.withParams({
    type: 'schemaMultipleOf',
    divider: divider,
    schema: propertySchema
  }, function(val) {
    if (!isFinite(val)) return true
    return isInteger(val / divider)
  })
}
