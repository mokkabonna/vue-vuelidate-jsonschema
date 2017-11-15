var vuelidate = require('vuelidate')

module.exports = function maxLengthValidator(propertySchema, max) {
  return vuelidate.withParams({
    type: 'schemaMaxLength',
    schema: propertySchema,
    max: max
  }, function(val) {
    if (!isString(val)) return true
    return val.length <= max
  })
}
