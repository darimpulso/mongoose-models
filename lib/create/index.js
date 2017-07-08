const mongoose = require('mongoose')
const createSchema = require('./schema')

// Creates a new model
module.exports = function (ctx = {}) {
  let {
    log,
    error,
    connection,
    models,
    circles,
    virtuals
  } = ctx

  return function (name, props) {
    props = props || {};

    log('create', {
      name,
      props
    })

    // Check for a scheme definition
    if (props.schema) {
      createSchema(props, {
        ctx
      })
    }

    // Check if we are loading the timestamps plugin
    if (props.useTimestamps) {
      log('use timestamps')
      props.schema.plugin(mongooseTypes.useTimestamps);
    }

    // Bind any instance methods to the schema.methods object
    if (props.methods) {
      log('add methods')
      Object.keys(props.methods).forEach(function (i) {
        props.schema.methods[i] = props.methods[i];
      });
    }

    props.schema.meta = {
      name
    }

    if (props.meta) {
      log('add meta data')
      props.schema.meta = props.meta
    }

    if (props.plugins) {
      log('add plugins')
      var plugins = props.plugins
      var schemaName = props.schema.meta.name

      if (Array.isArray(plugins)) {
        props.plugins.forEach(function (plug) {
          log('register plugin', plug.name, 'on', schemaName, 'schema')
          if (schemaName === 'unnamed') {
            log('suggestion: add meta object with name')
          }
          props.schema.plugin(plug)
        })
      } else {
        Object.keys(plugins).forEach(function (key) {
          var val = plugins[key]
          log('register plugin', key, 'on', schemaName, 'schema')
          if (schemaName === 'unnamed') {
            log('suggestion: add meta object with name')
          }
          if (Array.isArray(val)) {
            // apply multiple args on plugin, such as the plugin with options
            let args = val
            props.schema.plugin.apply(undefined, args)
          } else {
            props.schema.plugin(val)
          }
        })
      }

      // Create the mongoose model
      log('create model on connection')
      var model = connection.model(name, props.schema);

      // Copy over all other properties as static model properties
      log('copy static props')
      Object.keys(props).forEach(function (i) {
        if (i !== 'schema' && i !== 'useTimestamps' && i !== 'methods') {
          model[i] = props[i];
        }
      });

      let keys = Object.keys(models)
      // Store the model
      log('store model', {
        model,
        keys
      })
      models[name].model = model;

      // The model is done being built, allow circular reference to resolve
      circles.emit(name, model);

      return model;
    }
  }
}
