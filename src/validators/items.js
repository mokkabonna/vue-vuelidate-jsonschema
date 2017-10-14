var vuelidate = require('vuelidate')
var typeValidator = require('./type')
var validate = require('../validate')

module.exports = function itemsValidator(arraySchema, getPropertyValidationRules) {
  return vuelidate.withParams({
    type: 'schemaItems',
    schema: arraySchema
  }, function(values) {
    if (!Array.isArray(values) || values.length === 0) {
      return true
    }

    // ignore type errors, the type validator handles that
    if (arraySchema.items.type === 'object') {
      var hasTypeError = values.some(function(val) {
        return !typeValidator(arraySchema, arraySchema.type)(val)
      })

      if (hasTypeError) {
        return true
      }
    }

    var validators
    if (!Array.isArray(arraySchema.items)) {
      // use first schema always if originally one schema object
      // must do it this way because of normalization to an array
      validators = getPropertyValidationRules(arraySchema.items)
      return values.every(function(value) {
        return validate(validators, value)
      })
    } else {
      validators = arraySchema.items.map(function(itemSchema) {
        return getPropertyValidationRules(itemSchema)
      })

      return values.every(function(value, i) {
        return validate(validators[i], value)
      })
    }
  })
}
