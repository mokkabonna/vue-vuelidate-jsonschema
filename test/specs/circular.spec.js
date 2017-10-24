var chai = require('chai')
var requireUncached = require('require-uncached')
var plugin = requireUncached('../../src')
var Vue = requireUncached('vue')
var Vuelidate = requireUncached('vuelidate')
var $RefParser = require('json-schema-ref-parser')

var expect = chai.expect
var schema
describe('circular references', function() {
  beforeEach(function() {
    Vue.use(plugin)
    Vue.use(Vuelidate.Vuelidate)
    return $RefParser.dereference({
      allOf: [
        { $ref: '#/definitions/object' }
      ],
      definitions: {
        object: {
          $id: '#/definitions/object',
          type: 'object',
          properties: {
            child: {
              $ref: '#/definitions/object'
            }
          }
        }
      }

    }).then(function(dereferenced) {
      schema = {
        title: 'Person',
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 2
          }
        },
        required: ['name']
      }

      schema.properties.child = schema
    })
  })

  beforeEach(function() {
    expect(function() {
      JSON.stringify(schema)
    }).to.throw(/circular structure/)
  })

  it('creates validation structure only as far as the data are present', function() {
    var vm = new Vue({
      schema: schema
    })

    expect(vm.schema).not.to.eql(undefined)
    expect(vm.$v.schema.hasOwnProperty('child')).to.eql(true)
    expect(vm.$v.schema.$invalid).to.eql(true)
    vm.schema.name = 'Peter'
    expect(vm.$v.schema.$invalid).to.eql(false)

    // one level deep
    expect(vm.schema.hasOwnProperty('child')).to.eql(true)
    expect(vm.schema.child).to.eql(undefined)
    expect(vm.$v.schema.hasOwnProperty('child')).to.eql(true)
    // not created further
    expect(vm.$v.schema.child.hasOwnProperty('child')).to.eql(false)
    expect(vm.$v.schema.$invalid).to.eql(false)

    // two level deep
    vm.schema.child = {
      // we need to have the prop present or reactivity won't work,
      // if we don't do this we need to use Vue.set later when setting new child
      child: undefined,
      name: undefined
    }
    expect(vm.schema.child.hasOwnProperty('child')).to.eql(true)
    // we don't rescaffold
    expect(vm.schema.child.child).to.eql(undefined)
    // but validations do
    expect(vm.$v.schema.child.hasOwnProperty('child')).to.eql(true)
    // not created further than one level
    expect(vm.$v.schema.child.child.hasOwnProperty('child')).to.eql(false)
    expect(vm.$v.schema.$invalid).to.eql(true)
    vm.schema.child.name = 'Peter'
    expect(vm.$v.schema.$invalid).to.eql(false)

    function createFreshObj() {
      return {
        child: undefined,
        name: undefined
      }
    }

    function getValidationBase() {
      var base = vm.$v.schema

      for (var i = 0; i < childs; i++) {
        base = base['child']
      }
      return base
    }

    var levels = 10
    var dataBase = vm.schema.child

    var childs = 1
    var validationsBase = getValidationBase()
    for (var i = 0; i < levels; i++) {
      // we don't rescaffold
      expect(dataBase.hasOwnProperty('child')).to.eql(true)
      // but validations do
      expect(validationsBase.hasOwnProperty('child')).to.eql(true)
      // not created further
      expect(validationsBase.child.hasOwnProperty('child')).to.eql(false)

      dataBase.child = createFreshObj()
      childs = childs + 1
      dataBase = dataBase.child
      expect(vm.$v.schema.$invalid).to.eql(true)
      expect(validationsBase.child.name.$invalid).to.eql(true)
      expect(validationsBase.child.$invalid).to.eql(true)
      expect(validationsBase.child.child.$invalid).to.eql(false)
      dataBase.name = 'Peter'
      expect(vm.$v.schema.$invalid).to.eql(false)
      expect(validationsBase.child.$invalid).to.eql(false)
      expect(validationsBase.child.name.$invalid).to.eql(false)
      validationsBase = getValidationBase()
    }
  })

  it('creates validation structure if data are added in bulk', function() {
    var vm = new Vue({
      schema: schema
    })

    vm.schema.name = 'Ana'

    vm.schema.child = {
      name: 'Trevor',
      child: {
        name: 'Trevor',
        child: {
          name: 'Trevor',
          child: {
            name: 'Trevor',
            child: {
              name: 'Trevor',
              child: {
                name: undefined,
                child: undefined
              }
            }
          }
        }
      }
    }

    expect(vm.$v.schema.child.child.child.child.child.child.name.$invalid).to.eql(true)
    expect(vm.$v.$invalid).to.eql(true)
    vm.schema.child.child.child.child.child.child.name = 'Trevor'
    expect(vm.$v.$invalid).to.eql(false)
  })
})
