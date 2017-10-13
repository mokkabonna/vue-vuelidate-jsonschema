var chai = require('chai')
var requireUncached = require('require-uncached')
var scaffold = requireUncached('../../src/scaffold')

var expect = chai.expect

describe('scaffold', function() {
  it('does not deep scaffold anyOf keyword or use default value', function() {
    var result = scaffold([{
      mountPoint: '.',
      schema: {
        anyOf: [{
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
        }]
      }
    }])

    expect(result).to.eql({
      name: undefined,
      sub: undefined
    })
  })

  it('does not deep scaffold not keyword or use default value', function() {
    var result = scaffold([{
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
    }])

    expect(result).to.eql({
      name: undefined,
      sub: undefined
    })
  })

  it('does not deep scaffold oneOf keyword or use default value', function() {
    var result = scaffold([{
      mountPoint: '.',
      schema: {
        oneOf: [{
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
        }]
      }
    }])

    expect(result).to.eql({
      name: undefined,
      sub: undefined
    })
  })
})
