var isFunction = (val) => typeof val === 'function'

module.exports = function(toVal, fromVal) {
  if (!toVal) return fromVal
  if (!fromVal) return toVal
  var retVal
  if (isFunction(toVal) || isFunction(fromVal)) {
    retVal = function() {
      var args = [].slice.call(arguments)
      var toResult = isFunction(toVal) ? toVal.apply(this, arguments): toVal
      var fromResult = isFunction(fromVal) ? fromVal.apply(this, arguments): fromVal
      return Object.assign({}, toResult, fromResult)
    }
  } else {
    retVal = Object.assign({}, toVal, fromVal)
  }

  return retVal
}
