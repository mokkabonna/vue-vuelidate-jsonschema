var vuelidate = require('vuelidate')
var noParamsRequired = require('./noParamsRequired')

module.exports = function minLengthValidator(propertySchema, min) {
  return vuelidate.withParams({
    type: 'schemaMinLength',
    schema: propertySchema,
    min: min
  }, function(val) {
    return !noParamsRequired(val) || (val && val.hasOwnProperty('length') && val.length >= min)
  })
}
