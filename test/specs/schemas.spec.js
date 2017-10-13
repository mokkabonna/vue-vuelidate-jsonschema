var chai = require('chai')
var requireUncached = require('require-uncached')
var plugin = requireUncached('../../src')
var Vue = requireUncached('vue')
var Vuelidate = requireUncached('vuelidate')
var basic = require('../fixtures/schemas/basic.json')
var additional = require('../fixtures/schemas/additional.json')
var additionalWithPattern = require('../fixtures/schemas/additionalWithPattern.json')
var medium = require('../fixtures/schemas/medium.json')
var complex = require('../fixtures/schemas/complex.json')
var complex2 = require('../fixtures/schemas/complex2.json')
var complex3 = require('../fixtures/schemas/complex3.json')
var advanced = require('../fixtures/schemas/advanced.json')
var cosmicrealms = require('../fixtures/schemas/cosmicrealms.json')
var $RefParser = require('json-schema-ref-parser')

var schemas = [
  additional,
  additionalWithPattern,
  basic,
  medium,
  complex,
  complex2,
  complex3,
  advanced,
  cosmicrealms
]
var expect = chai.expect

describe.skip('schema fixtures validation', function() {
  beforeEach(function() {
    Vue.use(plugin)
    Vue.use(Vuelidate.Vuelidate)
    return Promise.all(schemas.map(function(innerSchema) {
      return Promise.all(innerSchema.map(function(config) {
        return $RefParser.dereference(config.schema).then(function(dereferenced) {
          innerSchema.schema = dereferenced
          return innerSchema
        })
      }))
    })).then(function(all) {
      var hasRefStill = JSON.stringify(all.map(function(obj) {
        return obj.schema
      })).indexOf('$ref') !== -1

      if (hasRefStill) {
        throw new Error('Error in test precondition, some refs are not resolved')
      }

      schemas = all
    })
  })

  schemas.forEach(function(schema) {
    schema.forEach(function(innerSchema) {
      describe(innerSchema.description, function() {
        var vm
        beforeEach(function() {
          vm = new Vue({
            schema: {
              mountPoint: 'mountPoint',
              schema: innerSchema.schema
            }
          })
        })

        innerSchema.tests.forEach(function(test) {
          describe(test.description, function() {
            it('is valid according to fixture data', function() {
              vm.mountPoint = test.data
              var isValid = !vm.$v.mountPoint.$invalid
              expect(isValid).to.eql(test.valid)
            })

            it('gets data', function() {
              vm.mountPoint = test.data
              // only test data export if the object is expected to be valid
              // TODO: I think this is correct, but need to look into it
              if (test.valid === true && vm.$v.mountPoint.$invalid === !test.valid) {
                expect(removeUndefined(vm.getSchemaData(vm.$schema[0]))).to.eql(test.data)
              }
            })
          })
        })
      })
    })
  })
})

function removeUndefined(obj) {
  return JSON.parse(JSON.stringify(obj))
}
