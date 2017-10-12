var vuelidate = require('vuelidate')
var isPlainObject = require('lodash/isPlainObject')

module.exports = function minPropertiesValidator(propertySchema, min) {
  return vuelidate.withParams({
    type: 'schemaMinProperties',
    min: min,
    schema: propertySchema
  }, function(object) {
    if (!isPlainObject(object)) return true
    return Object.keys(object).length >= min
  })
}
