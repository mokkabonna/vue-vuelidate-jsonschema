var vuelidate = require('vuelidate')
var validate = require('../validate')

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

    var rules = getPropertyValidationRules(additionalItems)

    return extraItems.every(function(value) {
      return validate(rules, value)
    })
  })
}
