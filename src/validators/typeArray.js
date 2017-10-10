var vuelidate = require('vuelidate')
var validators = require('vuelidate/lib/validators')

module.exports = function typeArrayValidator(propertySchema, validationCollection) {
  return vuelidate.withParams({
    type: 'schemaTypes',
    schema: propertySchema
  }, function(val) {
    return validators.or.apply(validators, validationCollection)(val)
  })
}
