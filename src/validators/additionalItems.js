var vuelidate = require('vuelidate')
var isPlainObject = require('lodash/isPlainObject')
var every = require('lodash/every')

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

module.exports = function additionalItemsValidator(arraySchema, additionalItems, getPropertyValidationRules) {
  return vuelidate.withParams({
    type: 'schemaAdditionalItems',
    schema: arraySchema
  }, function(values) {
    if (!Array.isArray(values) || values.length === 0 || !Array.isArray(arraySchema.items)) {
      return true
    }

    var extraItems = values.slice(arraySchema.items.length)

    if (!extraItems.length) return true
    if (additionalItems === false) return false

    var validatorGroup = getPropertyValidationRules(additionalItems)

    return extraItems.every(function(value) {
      return every(validatorGroup, function(validator, key) {
        return validateGroup(value, validator, key)
      })
    })
  })
}
