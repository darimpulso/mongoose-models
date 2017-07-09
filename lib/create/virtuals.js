module.exports = function virtualsFactory(props, config = {}) {
  let {
    virtuals,
    log
  } = config

  var _virtuals = {};

  return {
    createVirtuals: function (def) {
      // Handle automatic virtuals for custom types
      log('handle any automatic virtuals')
      var type = def;
      if (typeof def === 'object') {
        type = def.type;
      }
      if (typeof type === 'function' && type._mmId) {
        var virtualFunctions = virtuals[type._mmId](key);
        const functionNames = Object.keys(virtualFunctions)

        functionNames.map(virtual => {
          if (virtual[0] === '.') {
            virtual = key + virtual;
          }
          _virtuals[virtual] = funcs[virtual];
        });
      }
    },
    bindVirtuals: function () {
      Object.keys(_virtuals).forEach(function (virtual) {
        var funcs = _virtuals[virtual];
        props.schema.virtual(virtual)
          .get(funcs.get || function () {})
          .set(funcs.set || function () {});
      })
    }
  }
}
