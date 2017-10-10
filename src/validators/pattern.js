var vuelidate = require('vuelidate')
var isString = require('lodash/isString')

module.exports = function patternValidator(propertySchema, pattern) {
  return vuelidate.withParams({
    type: 'schemaPattern',
    pattern: pattern,
    schema: propertySchema
  }, function(val) {
    if (!isString(val)) return true
    return pattern.test(val)
  })
}
