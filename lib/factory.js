const create = require('./create')

module.exports = function (ctx = {}) {
  let creator = create(ctx)
  return function (name, props) {
    return function () {
      return creator(name, props)
    }
  }
}
