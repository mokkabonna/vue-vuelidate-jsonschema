var vuelidate = require('vuelidate')
var isString = require('lodash/isString')

module.exports = function minLengthValidator(propertySchema, min) {
  return vuelidate.withParams({
    type: 'schemaMinLength',
    schema: propertySchema,
    min: min
  }, function(val) {
    if (!isString(val)) return true
    return val.length >= min
  })
}
