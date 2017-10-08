var isFunction = (val) => typeof val === 'function'
var mergeWith = require('lodash/mergeWith')
var forEach = require('lodash/forEach')
var isPlainObject = require('lodash/isPlainObject')

function noopValidator() {
  return true
}

function customizer(objValue, srcValue, key, object, source, stack) {
  if (srcValue === undefined) {
    delete object[key]
    delete source[key]
    return noopValidator
  }
}

function deleteNoopValidators(obj) {
  forEach(obj, function(val, key) {
    if (val === noopValidator) {
      delete obj[key]
    } else if (isPlainObject(val)) {
      deleteNoopValidators(val)
    }
  })
}

module.exports = function(toVal, fromVal) {
  if (!toVal) return fromVal
  if (!fromVal) return toVal
  var retVal
  if (isFunction(toVal) || isFunction(fromVal)) {
    retVal = function() {
      var args = [].slice.call(arguments)
      var toResult = isFunction(toVal) ? toVal.apply(this, args) : toVal
      var fromResult = isFunction(fromVal) ? fromVal.apply(this, args) : fromVal
      var merged = mergeWith(toResult, fromResult, customizer)

      deleteNoopValidators(merged)
      return merged
    }
  } else {
    retVal = mergeWith(toVal, fromVal, customizer)
    deleteNoopValidators(retVal)
  }

  return retVal
}
