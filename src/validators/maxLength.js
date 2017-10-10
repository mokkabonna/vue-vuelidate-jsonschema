var vuelidate = require('vuelidate')
var noParamsRequired = require('./noParamsRequired')

module.exports = function maxLengthValidator(propertySchema, max) {
  return vuelidate.withParams({
    type: 'schemaMaxLength',
    schema: propertySchema,
    max: max
  }, function(val) {
    return !noParamsRequired(val) || (val && val.hasOwnProperty('length') && val.length <= max)
  })
}
