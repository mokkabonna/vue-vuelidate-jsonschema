var vuelidate = require('vuelidate')
var isString = require('lodash/isString')

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
