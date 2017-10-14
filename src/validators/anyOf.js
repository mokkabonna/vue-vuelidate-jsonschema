var vuelidate = require('vuelidate')
var noParamsRequired = require('./noParamsRequired')
var typeValidator = require('./type')
var validate = require('../validate')

module.exports = function anyOfValidator(propertySchema, schemas, getPropertyValidationRules) {
  return vuelidate.withParams({
    type: 'schemaAnyOf',
    schemas: schemas,
    schema: propertySchema
  }, function(val) {
    if (!noParamsRequired(val)) {
      return true
    }

    // ignore type errors, the type validator handles that
    if (!typeValidator(propertySchema, propertySchema.type)(val)) {
      return true
    }

    return schemas.some(function(itemSchema) {
      return validate(getPropertyValidationRules(itemSchema), val)
    })
  })
}
