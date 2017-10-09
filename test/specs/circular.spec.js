var chai = require('chai')
var requireUncached = require('require-uncached')
var plugin = requireUncached('../../src')
var Vue = requireUncached('vue')
var Vuelidate = requireUncached('vuelidate')
var $RefParser = require('json-schema-ref-parser')

var expect = chai.expect

describe.only('circular refs', function() {
  beforeEach(function() {
    Vue.use(plugin)
    Vue.use(Vuelidate.Vuelidate)
  })

  it('supports simple circular ref', function() {
    var schema = {
      type: 'object',
      // $ref: '#/definitions/person',
      definitions: {
        person: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 3,
              default: 'jack'
            },
            bestFriend: {
              $ref: '#/definitions/person'
            }
          }
        }
      }
    }

    $RefParser.dereference(schema).then(function(dereferenced) {
      console.log(dereferenced)
      var vm = new Vue({
        schema: [dereferenced]
      })

      console.log(vm.name)
      console.log(vm.bestFriend)
      vm.bestFriend = {
        name: 'Peter'
      }
      console.log(vm.bestFriend.name)
      console.log(vm.$v.bestFriend)

    })
  })
})
