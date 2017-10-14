var vuelidate = require('vuelidate')
var isPlainObject = require('lodash/isPlainObject')
var every = require('lodash/every')

function validateGroup(item, validator, key) {
  if (isPlainObject(validator)) {
    return every(validator, function(innerValidator, innerKey) {
      if (item === undefined) {
        return true
      }
      return validateGroup(item[key], innerValidator, innerKey)
    })
  } else {
    return validator(item)
  }
}

module.exports = function dependenciesValidator(propertySchema, dependencies, getPropertyValidationRules) {
  return vuelidate.withParams({
    type: 'schemaDependencies',
    dependencies: dependencies,
    schema: propertySchema
  }, function(obj) {
    if (!isPlainObject(obj)) { return true }

    var properties = Object.keys(obj)

    var propertiesCausingDependencyCheck = properties.filter(function(key) {
      return dependencies.hasOwnProperty(key)
    })

    return propertiesCausingDependencyCheck.reduce(function(valid, key) {
      if (!valid) { return valid }

      var dependencyForProp = dependencies[key]
      if (Array.isArray(dependencyForProp)) {
        return dependencyForProp.every(function(dep) {
          return properties.indexOf(dep) !== -1
        })
      } else {
        var validatorGroup = getPropertyValidationRules(dependencyForProp)

        return every(validatorGroup, function(validator, key) {
          return validateGroup(obj, validator, key)
        })
      }
    }, true)
  })
}
