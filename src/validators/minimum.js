var vuelidate = require('vuelidate')
var isFinite = require('lodash/isFinite')

module.exports = function minValidator(propertySchema, min) {
  return vuelidate.withParams({
    type: 'schemaMinimum',
    min: min,
    schema: propertySchema
  }, function(val) {
    if (!isFinite(val)) return true
    return val >= min
  })
}
