var vuelidate = require('vuelidate')
var isPlainObject = require('lodash/isPlainObject')
var every = require('lodash/every')
var reduce = require('lodash/reduce')
var filter = require('lodash/filter')

module.exports = function patternPropertiesValidator(propertySchema, patternProperties, getPropertyValidationRules) {
  return vuelidate.withParams({
    type: 'schemaPatternProperties',
    patternProperties: patternProperties,
    schema: propertySchema
  }, function(object) {
    if (propertySchema.additionalProperties !== undefined &&
      !isPlainObject(propertySchema.additionalProperties) &&
      propertySchema.additionalProperties !== true
    ) {
      var allowedKeys = Object.keys(patternProperties).map(function(key) {
        return new RegExp(key)
      })

      var allKeysAreValid = Object.keys(object).every(function(key) {
        // we have key, therefore it is valid
        if (propertySchema.properties && propertySchema.properties[key]) return true

        return allowedKeys.some(function(regexp) {
          return regexp.test(key)
        })
      })

      // fail early if some keys are not present
      if (!allKeysAreValid) {
        return false
      }
    }

    var schemasForKeys = reduce(object, function(all, value, key) {
      all[key] = filter(patternProperties, function(schema, pattern) {
        return new RegExp(pattern).test(key)
      })
      return all
    }, {})

    return every(schemasForKeys, function(schemas, key) {
      var validatorGroups = schemas.map(function(itemSchema) {
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

      return every(validationForGroups, function(validatorGroup) {
        return validatorGroup(object[key])
      })
    })
  })
}
