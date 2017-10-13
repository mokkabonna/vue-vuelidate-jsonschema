var vuelidate = require('vuelidate')

module.exports = function minLengthValidator(propertySchema, min) {
  return vuelidate.withParams({
    type: 'schemaMinLength',
    schema: propertySchema,
    min: min
  }, function(val) {
    if (val === undefined) return true
    if (!val.hasOwnProperty('length')) return true
    return val.length >= min
  })
}
