var vuelidate = require('vuelidate')
var isPlainObject = require('lodash/isPlainObject')

module.exports = function maxPropertiesValidator(propertySchema, max) {
  return vuelidate.withParams({
    type: 'schemaMaxProperties',
    max: max,
    schema: propertySchema
  }, function(object) {
    if (!isPlainObject(object)) return true
    return Object.keys(object).length <= max
  })
}
