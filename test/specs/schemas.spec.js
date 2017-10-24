var chai = require('chai')
var requireUncached = require('require-uncached')
var plugin = requireUncached('../../src')
var Vue = requireUncached('vue')
var fs = require('fs')
var _ = require('lodash')
var path = require('path')
var Vuelidate = requireUncached('vuelidate')
var glob = require('glob')
var $RefParser = require('json-schema-ref-parser')
var stringify = require('json-stringify-safe')
var expect = chai.expect

// TODO: when this list is almost empty I think we are pretty much feature complete
// some of these we have to remove though, as they are invalid, and testing meta functionality
var todoList = [
  // does not support internal refs yet
  'ref.json',
  // will not support this testcase, as it has dependencies on a localhost etc.
  'refRemote.json'
]

// set this to some part of filename to only run one file
var onlyRun = ''

var schemas = glob.sync(path.join(__dirname, '../fixtures/schemas/**.json')).filter(function(file) {
  if (onlyRun.length) {
    return file.indexOf(onlyRun) !== -1
  } else {
    return todoList.every(function(exclude) {
      return file.indexOf(exclude) === -1
    })
  }
}).map(function(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'))
})

describe('schema fixtures validation', function() {
  before(function() {
    return Promise.all(schemas.map(function(innerSchema) {
      return Promise.all(innerSchema.map(function(config) {
        if (_.isPlainObject(config.schema)) {
          return $RefParser.dereference(config.schema).then(function(dereferenced) {
            config.schema = dereferenced
            return config
          })
        } else {
          innerSchema.schema = config.schema
          return innerSchema
        }
      }))
    })).then(function(all) {
      var hasRefStill = stringify(all.map(function(obj) {
        return obj
      })).indexOf('{$ref') !== -1 // $ref is part of the meta schema, but not with { in front

      if (hasRefStill) {
        throw new Error('Error in test precondition, some refs are not resolved')
      }

      schemas = all
    })
  })

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

        innerSchema.tests.forEach(function(test) {
          describe(test.description, function() {
            it('is valid according to fixture data', function() {
              vm.mountPoint = test.data
              var isValid = !vm.$v.mountPoint.$invalid
              if (isValid !== test.valid && true) {
                console.log(JSON.stringify(vm.$v.mountPoint, null, 2))
              }
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
