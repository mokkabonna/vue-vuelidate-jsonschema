var vuelidate = require('vuelidate')
var isPlainObject = require('lodash/isPlainObject')
var every = require('lodash/every')

module.exports = function itemsValidator(arraySchema, getPropertyValidationRules) {
  var normalizedSchemas = Array.isArray(arraySchema.items) ? arraySchema.items : [arraySchema.items]

  return vuelidate.withParams({
    type: 'schemaItems',
    schema: arraySchema
  }, function(val) {
    if (!Array.isArray(val) || val.length === 0) {
      return true
    }

    var validatorGroups = normalizedSchemas.map(function(itemSchema) {
      return getPropertyValidationRules(arraySchema, itemSchema)
    })

    function validateGroup(item, validator, key) {
      if (isPlainObject(validator)) {
        return every(validator, function(innerValidator, innerKey) {
          if (item[key] === undefined) {
            return true
          }
          return validateGroup(item[key], innerValidator, innerKey)
        })
      } else {
        return validator(item)
      }
    }

    var validationForGroups = validatorGroups.map(function(validatorSet) {
      return function(item) {
        return every(validatorSet, function(validator, key) {
          return validateGroup(item, validator, key)
        })
      }
    })

    return val.every(function(item) {
      // Only one of the supplied schemas has to match
      return validationForGroups.some(function(validationGroup) {
        return validationGroup(item)
      })
    })
  })
}
