var chai = require('chai')
var requireUncached = require('require-uncached')
var scaffold = requireUncached('../../src/scaffold')
var vuelidateJsonSchema = requireUncached('../../src')
var _ = require('lodash')
var Vue = requireUncached('vue')
var Vuelidate = requireUncached('vuelidate')

var expect = chai.expect

describe.only('scaffold', function() {
  it('children does not override values from parent if default value present', function() {
    var result = scaffold([
      {
        mountPoint: 'schema',
        schema: {
          type: 'object',
          default: {
            name: 'Parent name'
          },
          properties: {
            name: {
              type: 'string',
              default: 'Tom'
            }
          },
          required: ['name']
        }
      }
    ])

    expect(result.schema).to.eql({name: 'Parent name'})
  })

  it('sets default value of array', function() {
    var result = scaffold([
      {
        mountPoint: 'schema',
        schema: {
          type: 'array',
          default: ['value']
        }
      }
    ])

    expect(result.schema).to.eql(['value'])
  })

  it('does not override default value when default in items', function() {
    var result = scaffold([
      {
        mountPoint: 'schema',
        schema: {
          type: 'array',
          default: ['value'],
          items: {
            type: 'string',
            default: 'child'
          }
        }
      }
    ])

    expect(result.schema).to.eql(['value'])
  })

  it('does scaffold when minItems', function() {
    var result = scaffold([
      {
        mountPoint: 'schema',
        schema: {
          type: 'array',
          minItems: 3,
          items: {
            type: 'string',
            default: 'child'
          }
        }
      }
    ])

    expect(result.schema).to.eql(['child', 'child', 'child'])
  })

  it('does scaffold when minItems and object', function() {
    var result = scaffold([
      {
        mountPoint: 'schema',
        schema: {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            properties: {
              name: {
                default: 'Susy'
              }
            },
            required: ['name']
          }
        }
      }
    ])

    expect(result.schema).to.eql([{
      name: 'Susy'
    }, {
      name: 'Susy'
    }])
  })

  it('does scaffold when items is array and minItems', function() {
    var result = scaffold([
      {
        mountPoint: 'schema',
        schema: {
          type: 'array',
          minItems: 4,
          items: [{
            type: 'object',
            properties: {
              name: {
                default: 'Susy'
              }
            },
            required: ['name']
          }, {
            type: 'number',
            default: 1
          }],
          additionalItems: {
            type: 'string',
            default: 'string'
          }
        }
      }
    ])

    expect(result.schema).to.eql([{
      name: 'Susy'
    }, 1, 'string', 'string'])
  })

  it('does not scaffold when no default value for simple types when items is array and minItems', function() {
    var result = scaffold([
      {
        mountPoint: 'schema',
        schema: {
          type: 'array',
          minItems: 4,
          items: [{
            type: 'object',
            properties: {
              name: {
                default: 'Susy'
              }
            },
            required: ['name']
          }, {
            type: 'number'
          }],
          additionalItems: {
            type: 'string'
          }
        }
      }
    ])

    expect(result.schema).to.eql([{
      name: 'Susy'
    }])
  })

  it('uses default value no matter what', function() {
    var result = scaffold([
      {
        mountPoint: 'schema',
        schema: {
          type: 'array',
          default: [],
          minItems: 4,
          items: [{
            type: 'object',
            properties: {
              name: {
                default: 'Susy'
              }
            },
            required: ['name']
          }, {
            type: 'number'
          }],
          additionalItems: {
            type: 'string'
          }
        }
      }
    ])

    expect(result.schema).to.eql([])
  })

  it.skip('still adds undefined values for all other properties, due to vue limitation', function() {
    var result = scaffold([
      {
        mountPoint: 'schema',
        schema: {
          type: 'object',
          default: {
            name: 'Parent name'
          },
          properties: {
            name: {
              type: 'string',
              default: 'Tom'
            },
            extra: {
              type: 'string',
              default: 'extra'
            }
          },
          required: ['name']
        }
      }
    ])

    expect(result.schema).to.eql({name: 'Parent name', extra: undefined})
  })

  it('does not deep scaffold anyOf keyword or use default value', function() {
    var result = scaffold([
      {
        mountPoint: '.',
        schema: {
          anyOf: [
            {
              type: 'object',
              properties: {
                name: {
                  type: 'string'
                },
                sub: {
                  type: 'object',
                  properties: {
                    deep: {
                      type: 'string'
                    }
                  }
                }
              },
              required: ['name']
            }
          ]
        }
      }
    ])

    expect(result).to.eql({name: undefined, sub: undefined})
  })

  it('does not deep scaffold not keyword or use default value', function() {
    var result = scaffold([
      {
        mountPoint: '.',
        schema: {
          not: {
            type: 'object',
            properties: {
              name: {
                type: 'string'
              },
              sub: {
                type: 'object',
                properties: {
                  deep: {
                    type: 'string'
                  }
                }
              }
            },
            required: ['name']
          }
        }
      }
    ])

    expect(result).to.eql({name: undefined, sub: undefined})
  })

  it('does not deep scaffold oneOf keyword or use default value', function() {
    var result = scaffold([
      {
        mountPoint: '.',
        schema: {
          oneOf: [
            {
              type: 'object',
              properties: {
                name: {
                  type: 'string'
                },
                sub: {
                  type: 'object',
                  properties: {
                    deep: {
                      type: 'string'
                    }
                  }
                }
              },
              required: ['name']
            }
          ]
        }
      }
    ])

    expect(result).to.eql({name: undefined, sub: undefined})
  })

  describe('in place data generation', function() {
    describe('if option turned on', function() {
      beforeEach(function() {
        Vue.use(vuelidateJsonSchema, {generateScaffoldHelpers: true})
        Vue.use(Vuelidate)
      })

      it('exposes in vm functions for generating new objects from schema', function() {
        var schema = {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: 'Peter'
            },
            child: {
              type: 'object',
              required: ['name']
            }
          }
        }

        schema.properties.child = schema

        var vm = new Vue({schema: schema})

        expect(vm.schema.createChild).to.be.a('function')
        expect(vm.schema.child).to.eql(undefined)
        vm.schema.createChild()
        compareNoFunctions(vm.schema.child, {
          child: undefined,
          name: 'Peter'
        })
        vm.schema.child.createChild({name: 'John'})
        compareNoFunctions(vm.schema.child.child, {
          child: undefined,
          name: 'John'
        })
        vm.schema.child.child.createChild()
        compareNoFunctions(vm.schema.child.child.child, {
          child: undefined,
          name: 'Peter'
        })
      })

      it('exposes in vm functions for generating new objects in array from schema', function() {
        var schema = {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                default: 'Susan'
              },
              child: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string'
                  }
                },
                required: ['name']
              }
            },
            required: ['name']
          }
        }

        var vm = new Vue({schema: schema})

        expect(vm.schema.pushItem).to.be.a('function')
        expect(vm.schema[0]).to.eql(undefined)
        vm.schema.pushItem()
        compareNoFunctions(vm.schema[0], {
          child: undefined,
          name: 'Susan'
        })
        vm.schema.pushItem({child: undefined, name: 'Ana'})
        compareNoFunctions(vm.schema[1], {
          child: undefined,
          name: 'Ana'
        })
        vm.schema[1].createChild()
        compareNoFunctions(vm.schema[1].child, {name: ''})
      })

      it('works automatically when items is array', function() {
        var schema = {
          type: 'array',
          items: [
            {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  default: 'Susan'
                }
              },
              required: ['name']
            }
          ]
        }

        var vm = new Vue({schema: schema})

        expect(vm.schema.pushItem).to.be.a('function')
        expect(vm.schema[0]).to.eql(undefined)
        vm.schema.pushItem()
        compareNoFunctions(vm.schema[0], {name: 'Susan'})

        // if no additionalItems, at least creates a empty object
        vm.schema.pushItem()
        compareNoFunctions(vm.schema[1], {})
      })

      it('works automatically when additionalitems is present and when items is array', function() {
        var schema = {
          type: 'array',
          items: [
            {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  default: 'Susan'
                }
              },
              required: ['name']
            }
          ],
          additionalItems: {
            type: 'object',
            properties: {
              age: {
                type: 'integer',
                default: 18
              }
            }
          }
        }

        var vm = new Vue({schema: schema})

        expect(vm.schema.pushItem).to.be.a('function')
        expect(vm.schema[0]).to.eql(undefined)
        vm.schema.pushItem()
        compareNoFunctions(vm.schema[0], {name: 'Susan'})

        // if no additionalitems, at least creates a empty object
        vm.schema.pushItem()
        compareNoFunctions(vm.schema[1], {age: 18})
        vm.schema.pushItem({
          age: 19,
          extra: '567'
        })
        compareNoFunctions(vm.schema[2], {age: 19, extra: '567'})
      })
    })
  })
})

function compareNoFunctions(result, expected) {
  expect(_.pickBy(result, function(val) {
    return !_.isFunction(val)
  })).to.eql(expected)
}
