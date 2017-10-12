var vuelidate = require('vuelidate')
var noParamsRequired = require('./noParamsRequired')
var typeValidator = require('./type')
var isPlainObject = require('lodash/isPlainObject')
var every = require('lodash/every')

module.exports = function notValidator(propertySchema, notSchema, getPropertyValidationRules, parentKey) {
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

    var validatorGroup = getPropertyValidationRules(propertySchema, notSchema)

    function validateGroup(item, validator, key) {
      if (isPlainObject(validator)) {
        return every(validator, function(innerValidator, innerKey) {
          if (item === undefined) {
            return true
          }
          return validateGroup(item[key], innerValidator, innerKey)
        })
      } else {
        return validator(item)
      }
    }

    var validationForGroup = function(item) {
      return every(validatorGroup, function(validator, key) {
        return validateGroup(item, validator, key)
      })
    }

    var isValid = validationForGroup(val)

    return !isValid
  })
}
