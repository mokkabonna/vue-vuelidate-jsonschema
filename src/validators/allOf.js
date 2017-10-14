var vuelidate = require('vuelidate')
var noParamsRequired = require('./noParamsRequired')
var typeValidator = require('./type')
var validate = require('../validate')
// this validator is currently not in use
module.exports = function allOfValidator(propertySchema, schemas, getPropertyValidationRules) {
  return vuelidate.withParams({
    type: 'schemaAllOf',
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

    return schemas.every(function(itemSchema) {
      return validate(getPropertyValidationRules(itemSchema), val)
    })
  })
}
