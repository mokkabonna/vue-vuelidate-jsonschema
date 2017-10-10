var vuelidate = require('vuelidate')
var isFinite = require('lodash/isFinite')

module.exports = function maxValidator(propertySchema, max) {
  return vuelidate.withParams({
    type: 'schemaMaximum',
    max: max,
    schema: propertySchema
  }, function(val) {
    if (!isFinite(val)) return true
    return val <= max
  })
}
