var vuelidate = require('vuelidate')
var noParamsRequired = require('./noParamsRequired')
var typeValidator = require('./type')
var isPlainObject = require('lodash/isPlainObject')
var every = require('lodash/every')

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

    var matching = validationForGroups.filter(function(validatorGroup) {
      //TODO exit early if more than one
      return validatorGroup(val)
    })

    return matching.length === 1
  })
}
