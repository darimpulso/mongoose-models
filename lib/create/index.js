const mongoose = require('mongoose')
const createSchema = require('./schema')
const addPlugins = require('./plugins')

// Creates a new model
module.exports = function (ctx = {}) {
  let {
    log,
    error,
    connection,
    models,
    circles,
    virtuals,
    mongooseTypes
  } = ctx

  function registerModel(name, model) {
    // TODO: warning if not defined?
    models = models || {}
    models[name] = models[name] || {}

    models[name].model = model
    return models
  }

  return function (name, props) {
    props = props || {};

    log('create', {
      name,
      props
    })

    // Check for a scheme definition
    if (props.schema) {
      createSchema(props, ctx)
    }

    // Bind any instance methods to the schema.methods object
    if (props.methods) {
      log('add methods')
      const methodNames = Object.keys(props.methods)
      methodNames.map(name => {
        props.schema.methods[name] = props.methods[name];
      })
    }

    props.schema.meta = {
      name
    }

    if (props.meta) {
      log('add meta data')
      props.schema.meta = props.meta
    }

    // Check if we are loading the timestamps plugin
    if (props.useTimestamps) {
      log('use timestamps')
      props.schema.plugin(mongooseTypes.useTimestamps)
    }

    if (props.plugins) {
      addPlugins(props, ctx)
    }

    // Create the mongoose model
    log('create model on connection')
    var model = connection.model(name, props.schema)

    function isProp(name) {
      return name !== 'schema' && name !== 'useTimestamps' && name !== 'methods'
    }

    // Copy over all other properties as static model properties
    log('copy static props')
    const propNames = Object.keys(props)
    propNames.map(name => {
      if (isProp(name)) {
        model[name] = props[name]
      }
    })

    let keys = Object.keys(models)
    // Store the model
    log('store model', {
      model,
      keys
    })
    registerModel(name, model)

    // The model is done being built, allow circular reference to resolve
    circles.emit(name, model);

    return model
  }
}
