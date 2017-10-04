var mergeStrategy = require('../../src/merge-validation-options')
var chai = require('chai')
var expect = chai.expect

describe('merge-validation-options', function() {

  it('merges extra properties', function() {
    var result = mergeStrategy({
      conflict: 1,
      orig: 5
    }, {
      conflict: 2,
      extra: 7
    })

    expect(result).to.eql({
      conflict: 2,
      orig: 5,
      extra: 7
    })
  })

  it('merges plain objects', function() {
    var result = mergeStrategy({
      foo: 1
    }, {
      foo: 2
    })

    expect(result).to.eql({
      foo: 2
    })
  })

  it('merges function and object', function() {
    var result = mergeStrategy(function() {
      return {
        foo: 1
      }
    }, {
      foo: 2
    })

    expect(result).to.be.a('function')
    expect(result()).to.eql({
      foo: 2
    })
  })


  it('merges object and function', function() {
    var result = mergeStrategy({
      foo: 2
    }, function() {
      return {
        foo: 1
      }
    })

    expect(result).to.be.a('function')
    expect(result()).to.eql({
      foo: 1
    })
  })

  it('merges function and function', function() {
    var result = mergeStrategy(function() {
      return {
        foo: 1
      }
    }, function() {
      return {
        foo: 3
      }
    })

    expect(result).to.be.a('function')
    expect(result()).to.eql({
      foo: 3
    })
  })

})
