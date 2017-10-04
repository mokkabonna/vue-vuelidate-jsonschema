'use strict'
module.exports = {
  install: function(Vue, options) {
    options = options || {}

    Vue.mixin({
      created() {
        console.log(this.$options)
      }
    })

  }
}
