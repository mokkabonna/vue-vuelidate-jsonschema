var vuelidate = require('vuelidate')
var uniqBy = require('lodash/uniqBy')
var isPlainObject = require('lodash/isPlainObject')

function getUniqueness(item) {
  if (isPlainObject(item) || Array.isArray(item)) {
    return JSON.stringify(item)
  } else {
    return item
  }
}

module.exports = function uniqueValidator(propertySchema) {
  return vuelidate.withParams({
    type: 'schemaUniqueItems',
    schema: propertySchema
  }, function(val) {
    if (!Array.isArray(val)) {
      return true
    }
    if (val.length < 2) {
      return true
    }
    return val.length === uniqBy(val, getUniqueness).length
  })
}
