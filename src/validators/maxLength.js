var vuelidate = require('vuelidate')

module.exports = function maxLengthValidator(propertySchema, max) {
  return vuelidate.withParams({
    type: 'schemaMaxLength',
    schema: propertySchema,
    max: max
  }, function(val) {
    if (val === undefined) return true
    if (!val.hasOwnProperty('length')) return true
    return val.length <= max
  })
}
