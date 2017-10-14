var vuelidate = require('vuelidate')
var isFinite = require('lodash/isFinite')

module.exports = function exclusiveMinimumValidator(propertySchema, min) {
  return vuelidate.withParams({
    type: 'schemaExclusiveMinimum',
    min: min,
    schema: propertySchema
  }, function(val) {
    if (!isFinite(val)) return true
    return val > min
  })
}
