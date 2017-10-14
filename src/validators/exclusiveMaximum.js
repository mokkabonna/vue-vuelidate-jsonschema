var vuelidate = require('vuelidate')
var isFinite = require('lodash/isFinite')

module.exports = function exclusiveMaxValidator(propertySchema, max) {
  return vuelidate.withParams({
    type: 'schemaExclusiveMaximum',
    max: max,
    schema: propertySchema
  }, function(val) {
    if (!isFinite(val)) return true
    return val < max
  })
}
