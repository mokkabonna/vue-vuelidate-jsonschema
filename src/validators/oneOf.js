var vuelidate = require('vuelidate')
var noParamsRequired = require('./noParamsRequired')
var typeValidator = require('./type')
var validate = require('../validate')

module.exports = function oneOfValidator(propertySchema, schemas, getPropertyValidationRules) {
  return vuelidate.withParams({
    type: 'schemaOneOf',
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

    return schemas.reduce(function(matching, schema) {
      if (matching > 1) return 2
      if (validate(getPropertyValidationRules(schema), val)) return matching + 1
      else return matching
    }, 0) === 1
  })
}
