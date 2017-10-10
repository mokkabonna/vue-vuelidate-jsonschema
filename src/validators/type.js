var vuelidate = require('vuelidate')
var noParamsRequired = require('./noParamsRequired')
var isNull = require('lodash/isNull')
var isInteger = require('lodash/isInteger')
var isFinite = require('lodash/isFinite')
var isBoolean = require('lodash/isBoolean')
var isString = require('lodash/isString')
var isPlainObject = require('lodash/isPlainObject')

var jsonTypes = {
  string: isString,
  object: isPlainObject,
  boolean: isBoolean,
  array: Array.isArray,
  'null': isNull,
  number: isFinite,
  integer: isInteger
}

module.exports = function typeValidator(propertySchema, type) {
  return vuelidate.withParams({
    type: 'schemaType',
    jsonType: type,
    schema: propertySchema
  }, function(val) {
    return !noParamsRequired(val) || jsonTypes[type](val)
  })
}
