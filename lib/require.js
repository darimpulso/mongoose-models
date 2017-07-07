// Load a model
module.exports = function (ctx = {}) {
  let {
    log,
    error,
    models
  } = ctx

  return function (name) {
    log('require', name)
    let schema = models[name]
    if (!schema) {
      error('unable to find or load model', {
        name,
        models,
        schema
      })
    }
    if (!schema.model) {
      require(schema.path);
    }
    return schema;
  };
}
