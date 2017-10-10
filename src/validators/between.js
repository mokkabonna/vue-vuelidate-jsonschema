var vuelidate = require('vuelidate')
var isFinite = require('lodash/isFinite')

module.exports = function betweenValidator(propertySchema, min, max) {
  return vuelidate.withParams({
    type: 'schemaBetween',
    min: min,
    max: max,
    schema: propertySchema
  }, function(val) {
    if (!isFinite(val)) return true
    return val >= min && val <= max
  })
}
