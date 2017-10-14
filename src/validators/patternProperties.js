var vuelidate = require('vuelidate')
var isPlainObject = require('lodash/isPlainObject')
var every = require('lodash/every')
var reduce = require('lodash/reduce')
var filter = require('lodash/filter')
var validate = require('../validate')

module.exports = function patternPropertiesValidator(propertySchema, patternProperties, getPropertyValidationRules) {
  return vuelidate.withParams({
    type: 'schemaPatternProperties',
    patternProperties: patternProperties,
    schema: propertySchema
  }, function(object) {
    if (!isPlainObject(object)) return true

    if (propertySchema.additionalProperties !== undefined &&
      !isPlainObject(propertySchema.additionalProperties) &&
      propertySchema.additionalProperties !== true
    ) {
      var allowedKeys = Object.keys(patternProperties).map(function(key) {
        return new RegExp(key)
      })

      var allKeysAreValid = Object.keys(object).every(function(key) {
        // we have key, therefore it is valid
        if (propertySchema.properties && propertySchema.properties[key]) return true

        return allowedKeys.some(function(regexp) {
          return regexp.test(key)
        })
      })

      // fail early if some keys are not present
      if (!allKeysAreValid) {
        return false
      }
    }

    var schemasForKeys = reduce(object, function(all, value, key) {
      all[key] = filter(patternProperties, function(schema, pattern) {
        return new RegExp(pattern).test(key)
      })
      return all
    }, {})

    return every(schemasForKeys, function(schemas, key) {
      return schemas.every(function(itemSchema) {
        return validate(getPropertyValidationRules(itemSchema), object[key])
      })
    })
  })
}
