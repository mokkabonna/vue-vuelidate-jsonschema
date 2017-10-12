var vuelidate = require('vuelidate')
var noParamsRequired = require('./noParamsRequired')
var typeValidator = require('./type')
var isPlainObject = require('lodash/isPlainObject')
var every = require('lodash/every')

module.exports = function allOfValidator(propertySchema, schemas, getPropertyValidationRules, parentKey) {
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

    var validatorGroups = schemas.map(function(itemSchema) {
      return getPropertyValidationRules(propertySchema, itemSchema, parentKey)
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

    return validationForGroups.every(function(validatorGroup) {
      return validatorGroup(val)
    })
  })
}
