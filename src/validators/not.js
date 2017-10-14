var vuelidate = require('vuelidate')
var noParamsRequired = require('./noParamsRequired')
var typeValidator = require('./type')
var validate = require('../validate')

module.exports = function notValidator(propertySchema, notSchema, getPropertyValidationRules) {
  return vuelidate.withParams({
    type: 'schemaNot',
    not: notSchema,
    schema: propertySchema
  }, function(val) {
    if (!noParamsRequired(val)) {
      return true
    }

    // ignore type errors, the type validator handles that
    if (!typeValidator(propertySchema, propertySchema.type)(val)) {
      return true
    }

    return !validate(getPropertyValidationRules(notSchema), val)
  })
}
