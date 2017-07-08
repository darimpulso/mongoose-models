// Load a model
module.exports = function (ctx = {}) {
  let {
    log,
    error,
    models
  } = ctx

  return function (name) {
    log('require', {
      name
    })
    // console.log('model name', name)
    let schema = models[name]
    if (!schema) {
      error(`unable to find or load model: ${name}`, {
        name,
        models,
        schema
      })
    }
    if (!schema.model) {
      let modelPath = schema.path
      modelPath = modelPath.replace(/index$/, '')

      log('require path', {
        path: modelPath
      })
      const model = require(modelPath)
      return model.default ? model.default : model
    }
    return schema
  }
}
