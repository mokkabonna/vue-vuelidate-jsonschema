var vuelidate = require('vuelidate')
var isPlainObject = require('lodash/isPlainObject')
var every = require('lodash/every')
var isFunction = require('lodash/isFunction')

module.exports = function itemsValidator(arraySchema, getPropertyValidationRules) {
  var normalizedSchemas
  var originallySingleSchema

  if (Array.isArray(arraySchema.items)) {
    originallySingleSchema = false
    normalizedSchemas = arraySchema.items
  } else {
    originallySingleSchema = true
    normalizedSchemas = [arraySchema.items]
  }

  return vuelidate.withParams({
    type: 'schemaItems',
    schema: arraySchema
  }, function(values) {
    if (!Array.isArray(values) || values.length === 0) {
      return true
    }

    var validatorGroups = normalizedSchemas.map(function(itemSchema) {
      return getPropertyValidationRules(itemSchema)
    })

    function validateGroup(item, validator, key) {
      if (isPlainObject(validator)) {
        return every(validator, function(innerValidator, innerKey) {
          if (item === undefined) return true
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

    return values.every(function(value, i) {
      var validationGroup
      if (originallySingleSchema) {
        // use first schema always if originally one schema object
        // must do it this way because of normalization to an array
        validationGroup = validationForGroups[0]
      } else {
        validationGroup = validationForGroups[i]
      }

      if (isFunction(validationGroup)) {
        return validationGroup(value)
      } else {
        return true
      }
    })
  })
}
