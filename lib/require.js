// Load a model
module.exports = function ({
  log,
  models
}) {
  return function (model) {
    log('require', model)
    let schema = models[model]
    if (!schema) {
      error('unable to find or load model', model)
    }
    if (!schema.model) {
      require(schema.path);
    }
    return schema;
  };
}
