var vuelidate = require('vuelidate')

module.exports = function minItemsValidator(propertySchema, min) {
  return vuelidate.withParams({
    type: 'schemaMinItems',
    schema: propertySchema,
    min: min
  }, function(val) {
    if (!Array.isArray(val)) return true
    return val.length >= min
  })
}
