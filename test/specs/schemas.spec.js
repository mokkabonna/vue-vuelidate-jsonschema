var chai = require('chai')
var requireUncached = require('require-uncached')
var plugin = requireUncached('../../src')
var Vue = requireUncached('vue')
var Vuelidate = requireUncached('vuelidate')
var basic = require('../fixtures/schemas/basic.json')
var medium = require('../fixtures/schemas/medium.json')
var complex = require('../fixtures/schemas/complex.json')
var $RefParser = require('json-schema-ref-parser')

var schemas = [basic, medium, complex]
var expect = chai.expect

describe('schema fixtures valiation', function() {
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
            it('is valid accoring to fixture data', function() {
              vm.mountPoint = test.data
              expect(vm.$v.mountPoint.$invalid).to.eql(!test.valid)
            })

            it('gets data', function() {
              vm.mountPoint = test.data
              expect(vm.getSchemaData(vm.$schema[0])).to.eql(test.data)
            })
          })
        })
      })
    })
  })
})
