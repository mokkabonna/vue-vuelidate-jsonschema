var isPlainObject = require('lodash/isPlainObject')
var every = require('lodash/every')

function validateGroup(item, validator, key) {
  if (isPlainObject(validator)) {
    return every(validator, function(innerValidator, innerKey) {
      if (item === undefined || item === null) {
        return true
      }
      return validateGroup(item[key], innerValidator, innerKey)
    })
  } else {
    return validator(item)
  }
}

module.exports = function(validators, value) {
  return every(validators, function(validator, key) {
    return validateGroup(value, validator, key)
  })
}
