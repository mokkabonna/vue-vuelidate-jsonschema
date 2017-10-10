var chai = require('chai')
var requireUncached = require('require-uncached')
var plugin = requireUncached('../../src')
var Vue = requireUncached('vue')
var Vuelidate = requireUncached('vuelidate')
var validators = requireUncached('vuelidate/lib/validators')

var expect = chai.expect

describe('plugin', function() {
  it('installs globally', function() {
    Vue.use(plugin)
    Vue.use(Vuelidate.Vuelidate)

    var propSchema = {
      type: 'integer',
      title: 'Age',
      description: 'The age of the student',
      minimum: 3
    }

    var vm = new Vue({
      schema: {
        type: 'object',
        properties: {
          age: propSchema
        }
      }
    })

    expect(vm.$v.age.$params.schemaMinimum.schema).to.eql(propSchema)
    expect(vm._vuelidate).not.to.eql(undefined)
  })

  it('does not create vuelidate instance if no schema', function() {
    Vue.use(plugin)
    Vue.use(Vuelidate)

    var vm = new Vue({
      data() {
        return {}
      }
    })

    expect(vm.$v).to.eql(undefined)
    expect(vm._vuelidate).to.eql(undefined)
  })

  describe('mixin', function() {
    it('exposes mixin', function() {
      expect(plugin.mixin).to.have.keys(['beforeCreate'])
    })

    it('works as a local mixin', function() {
      var propSchema = {
        type: 'integer',
        title: 'Age',
        description: 'The age of the student',
        minimum: 3
      }

      var vm = new Vue({
        mixins: [Vuelidate.validationMixin, plugin.mixin],
        schema: {
          type: 'object',
          properties: {
            age: propSchema
          }
        }
      })

      expect(vm.$v.age.$params.schemaMinimum.schema).to.eql(propSchema)
    })
  })

  describe('when installed', function() {
    beforeEach(function() {
      Vue.use(plugin)
      Vue.use(Vuelidate) // TODO seemingly does nothing is testing context, using mixin instead
    })

    it('supports awaiting promises', function() {
      var schemaPromise = new Promise(function(resolve) {
        resolve({
          type: 'object',
          properties: {
            prop1: {
              type: 'string',
              minLength: 3,
              default: '123'
            }
          }
        })
      })

      var vm = new Vue({
        mixins: [Vuelidate.validationMixin],
        schema: schemaPromise
      })

      return vm.$schema.then(function() {
        expect(vm.prop1).to.eql('123')
      })
    })

    it('supports awaiting awaiting multiple promises', function() {
      var schemaPromise = new Promise(function(resolve) {
        resolve({
          type: 'object',
          properties: {
            prop1: {
              type: 'string',
              minLength: 3,
              default: '123'
            }
          }
        })
      })

      var promise2 = new Promise(function(resolve) {
        resolve({
          type: 'object',
          properties: {
            prop2: {
              type: 'string',
              minLength: 7,
              default: 'abc'
            }
          }
        })
      })

      var vm = new Vue({
        mixins: [Vuelidate.validationMixin],
        schema: [schemaPromise, promise2]
      })

      return vm.$schema.then(function() {
        expect(vm.prop1).to.eql('123')
        expect(vm.$v.prop1.$invalid).to.eql(false)
        vm.prop1 = '12'
        expect(vm.$v.prop1.$invalid).to.eql(true)
        expect(vm.prop2).to.eql('abc')
        expect(vm.$v.prop2.$invalid).to.eql(true)
        vm.prop2 = '1234567'
        expect(vm.$v.prop2.$invalid).to.eql(false)
      })
    })

    it('support calling functions', function() {
      Vue.use(Vuelidate.Vuelidate)
      var callCount = 0

      function fetchSchema() {
        callCount = callCount + 1
        return new Promise(function(resolve) {
          resolve({
            type: 'object',
            properties: {
              prop1: {
                type: 'string',
                minLength: 3,
                default: '123'
              }
            }
          })
        })
      }

      var vm = new Vue({
        schema: fetchSchema
      })

      return vm.$schema.then(function() {
        expect(vm.prop1).to.eql('123')
        expect(callCount).to.eql(1)
      })
    })

    it('support calling multiple functions', function() {
      function fetchSchema() {
        return new Promise(function(resolve) {
          resolve({
            type: 'object',
            properties: {
              prop1: {
                type: 'string',
                minLength: 3,
                default: '123'
              }
            }
          })
        })
      }

      var vm = new Vue({
        mixins: [Vuelidate.validationMixin],
        schema: [fetchSchema, fetchSchema]
      })

      return vm.$schema.then(function() {
        expect(vm.prop1).to.eql('123')
      })
    })

    it('exposes json property schema as params', function() {
      var propSchema = {
        type: 'integer',
        title: 'Age',
        description: 'The age of the student',
        minimum: 3
      }
      var vm = new Vue({
        mixins: [Vuelidate.validationMixin],
        schema: {
          type: 'object',
          properties: {
            age: propSchema
          }
        }
      })

      expect(vm.$v.age.$params.schemaMinimum.schema).to.eql(propSchema)
    })

    it('adds properties to data object', function() {
      var vm = new Vue({
        mixins: [Vuelidate.validationMixin],
        schema: {
          type: 'object',
          properties: {
            prop1: {
              type: 'string'
            },
            prop2: {
              type: 'number'
            },
            prop3: {
              type: 'object'
            },
            prop4: {
              type: 'array'
            },
            prop5: {
              type: 'boolean'
            },
            prop6: {
              type: 'integer'
            },
            prop7: {
              type: 'null'
            }
          },
          required: ['prop1', 'prop2', 'prop3', 'prop4', 'prop5', 'prop6', 'prop7']
        }
      })

      expect(vm.prop1).to.eql('')
      expect(vm.prop2).to.eql(0)
      expect(vm.prop3).to.eql({})
      expect(vm.prop4).to.eql([])
      expect(vm.prop5).to.eql(false)
      expect(vm.prop6).to.eql(0)
      expect(vm.prop7).to.eql(null)
    })

    it('takes required property into consideration when creating default values', function() {
      var vm = new Vue({
        mixins: [Vuelidate.validationMixin],
        schema: {
          type: 'object',
          properties: {
            prop1: {
              type: 'string'
            },
            prop2: {
              type: 'number'
            },
            prop3: {
              type: 'object'
            },
            prop4: {
              type: 'array'
            },
            prop5: {
              type: 'boolean'
            },
            prop6: {
              type: 'integer'
            },
            prop7: {
              type: 'null'
            }
          }
        }
      })

      expect(vm.prop1).to.eql(undefined)
      expect(vm.prop2).to.eql(undefined)
      expect(vm.prop3).to.eql(undefined)
      expect(vm.prop4).to.eql(undefined)
      expect(vm.prop5).to.eql(undefined)
      expect(vm.prop6).to.eql(undefined)
      expect(vm.prop7).to.eql(undefined)
    })

    it('supports default value from schema', function() {
      var vm = new Vue({
        mixins: [Vuelidate.validationMixin],
        schema: {
          type: 'object',
          properties: {
            prop1: {
              type: 'string',
              default: '123'
            }
          }
        }
      })

      expect(vm.prop1).to.eql('123')
    })

    it('supports nesting', function() {
      var vm = new Vue({
        mixins: [Vuelidate.validationMixin],
        schema: {
          type: 'object',
          properties: {
            obj1: {
              type: 'object',
              properties: {
                prop1: {
                  type: 'string'
                }
              }
            }
          },
          required: ['obj1']
        }
      })

      expect(vm.obj1).to.eql({
        prop1: undefined
      })
    })

    it('supports schema directly', function() {
      var vm = new Vue({
        mixins: [Vuelidate.validationMixin],
        schema: {
          type: 'object',
          properties: {
            str: {
              type: 'string'
            }
          }
        }
      })

      expect(vm.hasOwnProperty('str')).to.eql(true)
    })

    it('supports multiple schemas on root without defining mountPoint', function() {
      var vm = new Vue({
        mixins: [Vuelidate.validationMixin],
        schema: [{
          type: 'object',
          properties: {
            str: {
              type: 'string'
            },
            conflict: {
              type: 'string',
              minLength: 3,
              maxLength: 5
            }
          }
        }, {
          type: 'object',
          properties: {
            str2: {
              type: 'string'
            },
            conflict: {
              type: 'string',
              maxLength: 10
            }
          }
        }]
      })

      expect(vm.hasOwnProperty('str')).to.eql(true)
      expect(vm.hasOwnProperty('str2')).to.eql(true)
      expect(vm.hasOwnProperty('conflict')).to.eql(true)
      expect(vm.$v.str.$params.schemaType.type).to.eql('schemaType')
      expect(vm.$v.str2.$params.schemaType.type).to.eql('schemaType')
      // should merge the rules
      expect(vm.$v.conflict.$params.schemaType.jsonType).to.eql('string')
      expect(vm.$v.conflict.$params.schemaMinLength.min).to.eql(3)
      expect(vm.$v.conflict.$params.schemaMaxLength.max).to.eql(10)
    })

    it('supports deep mounted schema', function() {
      var vm = new Vue({
        mixins: [Vuelidate.validationMixin],
        schema: [{
          mountPoint: 'foo.bar.baz',
          schema: {
            type: 'object',
            properties: {
              str: {
                type: 'string',
                default: 'abc'
              }
            }
          }
        }]
      })

      expect(vm.foo.bar.baz.str).to.eql('abc')
      expect(vm.$v.foo.bar.baz.str.$params.schemaType.type).to.eql('schemaType')
    })

    it('supports multiple schemas', function() {
      var vm = new Vue({
        mixins: [Vuelidate.validationMixin],
        schema: [{
          mountPoint: 'foo.bar.baz',
          schema: {
            type: 'object',
            properties: {
              str: {
                type: 'string',
                default: 'abc'
              }
            }
          }
        }, {
          mountPoint: 'a.b.c',
          schema: {
            type: 'object',
            properties: {
              str: {
                type: 'string',
                default: 'abc'
              }
            }
          }
        }]
      })

      expect(vm.foo.bar.baz.str).to.eql('abc')
      expect(vm.$v.foo.bar.baz.str.$params.schemaType.type).to.eql('schemaType')
      expect(vm.a.b.c.str).to.eql('abc')
      expect(vm.$v.a.b.c.str.$params.schemaType.type).to.eql('schemaType')
    })

    describe('options merging', function() {
      it('allows replacing a validation rule', function() {
        var vm = new Vue({
          mixins: [Vuelidate.validationMixin],
          schema: {
            type: 'object',
            properties: {
              str: {
                type: 'string',
                minLength: 7
              }
            }
          },
          validations: {
            str: {
              schemaMinLength: validators.minLength(5)
            }
          }
        })

        vm.str = 'abc'
        expect(vm.$v.str.$invalid).to.eql(true)
        vm.str = 'abcab'
        expect(vm.$v.str.$invalid).to.eql(false)
      })

      it('allows adding a validation rule', function() {
        var vm = new Vue({
          mixins: [Vuelidate.validationMixin],
          schema: {
            type: 'object',
            properties: {
              str: {
                type: 'string',
                minLength: 20
              }
            }
          },
          validations: {
            str: {
              email: validators.email
            }
          }
        })

        vm.str = 'abc'
        expect(vm.$v.str.$invalid).to.eql(true)
        vm.str = 'abc@test.com'
        expect(vm.$v.str.$invalid).to.eql(true)
        vm.str = 'abc@testfdsfdsfsadf.com'
        expect(vm.$v.str.$invalid).to.eql(false)
      })

      it('allows deleting a validation rule', function() {
        var vm = new Vue({
          mixins: [Vuelidate.validationMixin],
          schema: {
            type: 'object',
            properties: {
              str: {
                type: 'string',
                minLength: 20
              }
            }
          },
          validations: {
            str: {
              email: validators.email,
              schemaMinLength: undefined, // deleting
              schemaRequired: undefined
            }
          }
        })

        vm.str = 'abc'
        expect(vm.$v.str.$invalid).to.eql(true)
        vm.str = 'abc@test.com'
        expect(vm.$v.str.$invalid).to.eql(false)
        expect(vm.$v.str).to.contain.keys(['schemaType', 'email'])
        expect(vm.$v.str).not.to.contain.keys(['schemaMinLength', 'schemaRequired'])
      })
    })

    describe('validation', function() {
      it('validates type string', function() {
        var vm = new Vue({
          mixins: [Vuelidate.validationMixin],
          schema: {
            type: 'object',
            properties: {
              str: {
                type: 'string'
              }
            }
          }
        })

        expect(vm.$v.str.$params.schemaType.type).to.eql('schemaType')
      })

      it('validates type array', function() {
        var vm = new Vue({
          mixins: [Vuelidate.validationMixin],
          schema: {
            type: 'object',
            properties: {
              str: {
                type: ['string', 'null', 'integer']
              }
            }
          }
        })

        expect(vm.$v.str.$params.schemaTypes.type).to.eql('schemaTypes')

        vm.str = ''
        expect(vm.$v.str.$invalid).to.eql(false)
        vm.str = null
        expect(vm.$v.str.$invalid).to.eql(false)
        vm.str = 1
        expect(vm.$v.str.$invalid).to.eql(false)
        vm.str = {}
        expect(vm.$v.str.$invalid).to.eql(true)
        vm.str = []
        expect(vm.$v.str.$invalid).to.eql(true)
        vm.str = 1.1
        expect(vm.$v.str.$invalid).to.eql(true)
        vm.str = true
        expect(vm.$v.str.$invalid).to.eql(true)
      })

      describe('schemaRequired', function() {
        // required should not be added based on json schema required, it has not the same meaning
        it('adds required validator to model, not allowing undefined', function() {
          var vm = new Vue({
            mixins: [Vuelidate.validationMixin],
            schema: {
              type: 'object',
              properties: {
                str: {
                  type: 'string'
                }
              },
              required: ['str']
            }
          })

          expect(vm.$v.str.$params.schemaRequired.type).to.eql('schemaRequired')
          vm.str = ''
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = undefined
          expect(vm.$v.str.$invalid).to.eql(true)
        })
      })

      describe('minLength', function() {
        it('adds minLength validator', function() {
          var vm = new Vue({
            mixins: [Vuelidate.validationMixin],
            schema: {
              type: 'object',
              properties: {
                str: {
                  type: 'string',
                  minLength: 3
                }
              }
            }
          })

          expect(vm.$v.str.$params.schemaMinLength.type).to.eql('schemaMinLength')
          vm.str = undefined
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = null
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = ''
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = '12'
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = '123'
          expect(vm.$v.str.$invalid).to.eql(false)
        })
      })

      describe('maxLength', function() {
        it('adds maxLength validator', function() {
          var vm = new Vue({
            mixins: [Vuelidate.validationMixin],
            schema: {
              type: 'object',
              properties: {
                str: {
                  type: 'string',
                  maxLength: 3
                }
              }
            }
          })

          expect(vm.$v.str.$params.schemaMaxLength.type).to.eql('schemaMaxLength')
          vm.str = ''
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = undefined
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = null
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = '123'
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = '1234'
          expect(vm.$v.str.$invalid).to.eql(true)
        })
      })

      describe('minimum and maximum', function() {
        it('adds between validator', function() {
          var vm = new Vue({
            mixins: [Vuelidate.validationMixin],
            schema: {
              type: 'object',
              properties: {
                str: {
                  type: 'integer',
                  minimum: 5,
                  maximum: 10
                }
              }
            }
          })

          expect(vm.$v.str.$params.schemaBetween.type).to.eql('schemaBetween')
          vm.str = null
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = undefined
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = 4
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = 5
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = 10
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = 11
          expect(vm.$v.str.$invalid).to.eql(true)
        })
      })

      describe('minimum', function() {
        it('adds minimum validator', function() {
          var vm = new Vue({
            mixins: [Vuelidate.validationMixin],
            schema: {
              type: 'object',
              properties: {
                str: {
                  type: 'number',
                  minimum: 3
                }
              }
            }
          })

          expect(vm.$v.str.$params.schemaMinimum.type).to.eql('schemaMinimum')
          vm.str = undefined
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = null
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = 0
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = 2
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = 3
          expect(vm.$v.str.$invalid).to.eql(false)
        })
      })

      describe('exclusiveMinimum', function() {
        it('should be tested')
      })

      describe('maximum', function() {
        it('adds maximum validator', function() {
          var vm = new Vue({
            mixins: [Vuelidate.validationMixin],
            schema: {
              type: 'object',
              properties: {
                str: {
                  type: 'number',
                  maximum: 3
                }
              }
            }
          })

          expect(vm.$v.str.$params.schemaMaximum.type).to.eql('schemaMaximum')
          vm.str = null
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = undefined
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = 0
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = 3
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = 4
          expect(vm.$v.str.$invalid).to.eql(true)
        })
      })

      describe('exclusiveMaximum', function() {
        it('should be tested')
      })

      describe('minItems', function() {
        it('adds the minLength validator', function() {
          var vm = new Vue({
            mixins: [Vuelidate.validationMixin],
            schema: {
              type: 'object',
              properties: {
                str: {
                  type: 'array',
                  minItems: 2
                }
              }
            }
          })

          expect(vm.$v.str.$params.schemaMinItems.type).to.eql('schemaMinLength')

          vm.str = null
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = undefined
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = []
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = [1]
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = [1, 2]
          expect(vm.$v.str.$invalid).to.eql(false)
        })
      })

      describe('maxItems', function() {
        it('adds the maxLength validator', function() {
          var vm = new Vue({
            mixins: [Vuelidate.validationMixin],
            schema: {
              type: 'object',
              properties: {
                str: {
                  type: 'array',
                  maxItems: 3
                }
              }
            }
          })

          expect(vm.$v.str.$params.schemaMaxItems.type).to.eql('schemaMaxLength')

          vm.str = null
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = undefined
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = [1, 2, 3]
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = [1, 2, 3, 4]
          expect(vm.$v.str.$invalid).to.eql(true)
        })
      })

      describe('pattern', function() {
        it('adds pattern validator', function() {
          var vm = new Vue({
            mixins: [Vuelidate.validationMixin],
            schema: {
              type: 'object',
              properties: {
                str: {
                  type: 'string',
                  pattern: '\\d+abc'
                }
              }
            }
          })

          expect(vm.$v.str.$params.schemaPattern.type).to.eql('schemaPattern')
          vm.str = ''
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = undefined
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = null
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = '3abc'
          expect(vm.$v.str.$invalid).to.eql(false)
        })
      })

      describe('enum', function() {
        it('adds enum validator', function() {
          var vm = new Vue({
            mixins: [Vuelidate.validationMixin],
            schema: {
              type: 'object',
              properties: {
                str: {
                  type: 'string',
                  enum: ['valid1', 'valid2']
                }
              }
            }
          })

          expect(vm.$v.str.$params.schemaEnum.type).to.eql('schemaEnum')
          vm.str = ''
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = undefined
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = null
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = 'dfs'
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = 'valid1'
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = 'valid2'
          expect(vm.$v.str.$invalid).to.eql(false)
        })
      })

      describe('const', function() {
        it('adds const validator', function() {
          var vm = new Vue({
            mixins: [Vuelidate.validationMixin],
            schema: {
              type: 'object',
              properties: {
                str: {
                  type: 'string',
                  const: 'mustmatch'
                }
              }
            }
          })

          expect(vm.$v.str.$params.schemaConst.type).to.eql('schemaConst')
          vm.str = ''
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = undefined
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = null
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = ''
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = 'mustmatch'
          expect(vm.$v.str.$invalid).to.eql(false)
        })
      })

      describe('uniqueItems', function() {
        it('adds unique validator', function() {
          var vm = new Vue({
            mixins: [Vuelidate.validationMixin],
            schema: {
              type: 'object',
              properties: {
                str: {
                  type: 'array',
                  uniqueItems: true
                }
              }
            }
          })

          expect(vm.$v.str.$params.schemaUniqueItems.type).to.eql('schemaUniqueItems')
          vm.str = []
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = undefined
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = null
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = [1, 1]
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = ['fds', 'fds']
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = [true, true]
          expect(vm.$v.str.$invalid).to.eql(true)
          // in json schema context the value is considered equal if seemingly same, not strict same
          vm.str = [{}, {}]
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = [
            [],
            []
          ]
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = [null, null]
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = ['1', 1]
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = [
            1,
            2,
            true,
            false,
            {},
            [],
            'str'
          ]
          expect(vm.$v.str.$invalid).to.eql(false)
        })
      })

      describe('arrays', function() {
        it('validates items correctly', function() {
          var vm = new Vue({
            mixins: [Vuelidate.validationMixin],
            schema: {
              type: 'object',
              properties: {
                str: {
                  type: 'array',
                  minItems: 2,
                  items: {
                    type: 'number',
                    minimum: 3
                  }
                }
              }
            }
          })

          expect(vm.$v.str.$params.schemaItems.type).to.eql('schemaItems')
          vm.str = undefined
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = ['string', 1]
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = []
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = [3]
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = [3, 2]
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = [3, 3]
          expect(vm.$v.str.$invalid).to.eql(false)
        })

        it('validates items correctly when array of schemas', function() {
          var vm = new Vue({
            mixins: [Vuelidate.validationMixin],
            schema: {
              type: 'object',
              properties: {
                str: {
                  type: 'array',
                  minItems: 2,
                  items: [{
                    type: 'number',
                    minimum: 3
                  }, {
                    type: 'string',
                    minLength: 3
                  }, {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        minLength: 3
                      }
                    }
                  }]
                }
              }
            }
          })

          expect(vm.$v.str.$params.schemaItems.type).to.eql('schemaItems')
          vm.str = undefined
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = ['string', 1]
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = []
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = [3]
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = [3, 2]
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = [3, 3]
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = [3, '123']
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = [
            3, {
              name: 'fo'
            }
          ]
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = [
            3, {
              name: 'foo'
            }
          ]
          expect(vm.$v.str.$invalid).to.eql(false)
        })

        it('validates items correctly when array of schemas', function() {
          var vm = new Vue({
            mixins: [Vuelidate.validationMixin],
            schema: {
              type: 'object',
              properties: {
                str: {
                  type: 'array',
                  minItems: 1,
                  items: [{
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        minLength: 3
                      },
                      deep: {
                        type: 'object',
                        properties: {
                          deepName: {
                            type: 'string',
                            maxLength: 10
                          }
                        }
                      }
                    }
                  }]
                }
              }
            }
          })

          expect(vm.$v.str.$params.schemaItems.type).to.eql('schemaItems')
          vm.str = undefined
          expect(vm.$v.str.$invalid).to.eql(false)
          vm.str = [{
            name: 'foo'
            // deep is not required
          }]
          expect(vm.$v.str.$invalid).to.eql(false)

          vm.str = [{
            name: 'foo',
            deep: [] // deep must be object
          }]
          expect(vm.$v.str.$invalid).to.eql(true)

          vm.str = [{
            name: 'foo',
            deep: {
              // deepName is not required
            }
          }]
          expect(vm.$v.str.$invalid).to.eql(false)

          vm.str = [{
            name: 'foo',
            deep: {
              deepName: '123456789011'
            }
          }]
          expect(vm.$v.str.$invalid).to.eql(true)

          vm.str = [{
            name: 'foo',
            deep: {
              deepName: '12345678'
            }
          }]
          expect(vm.$v.str.$invalid).to.eql(false)
        })

        it('validates items correctly when single schema and type object', function() {
          var vm = new Vue({
            mixins: [Vuelidate.validationMixin],
            schema: {
              type: 'object',
              properties: {
                str: {
                  type: 'array',
                  minItems: 1,
                  items: {
                    type: 'object',
                    properties: {
                      name: {
                        type: 'string',
                        minLength: 3
                      }
                    }
                  }
                }
              }
            }
          })

          // TODO: fix this assertion
          // vm.str = undefined
          // expect(vm.$v.str.$invalid).to.eql(false)

          vm.str = ['string', 1]
          // adds $each special rule
          expect(vm.$v.str.$each[0].name.$params.schemaMinLength.type).to.eql('schemaMinLength')
          expect(vm.$v.str.$each[1].name.$params.schemaMinLength.type).to.eql('schemaMinLength')
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = [{
            name: 'fo'
          }]
          expect(vm.$v.str.$invalid).to.eql(true)
          vm.str = [{
            name: 'foo'
          }]
          expect(vm.$v.str.$invalid).to.eql(false)
        })
      })
    })
  })
})
