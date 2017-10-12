var chai = require('chai')
var requireUncached = require('require-uncached')
var plugin = requireUncached('../../src')
var Vue = requireUncached('vue')
var Vuelidate = requireUncached('vuelidate')
var basic = require('../fixtures/schemas/basic.json')
var medium = require('../fixtures/schemas/medium.json')
var schemas = [basic, medium]

var expect = chai.expect

describe('schema fixtures valiation', function() {
  beforeEach(function() {
    Vue.use(plugin)
    Vue.use(Vuelidate.Vuelidate)
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

        innerSchema.tests.slice().forEach(function(test) {
          describe(test.description, function() {
            it('populates data', function() {
              vm.mountPoint = test.data
              expect(vm.$v.mountPoint.$invalid).to.eql(!test.valid)
            })
          })
        })
      })
    })
  })
})
