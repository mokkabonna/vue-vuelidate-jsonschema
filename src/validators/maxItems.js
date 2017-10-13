var vuelidate = require('vuelidate')

module.exports = function maxItemsValidator(propertySchema, max) {
  return vuelidate.withParams({
    type: 'schemaMaxItems',
    schema: propertySchema,
    max: max
  }, function(val) {
    if (!Array.isArray(val)) return true
    return val.length <= max
  })
}
