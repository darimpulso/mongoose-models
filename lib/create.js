var mongoose = require('mongoose');

// Creates a new model
module.exports = function (ctx = {}) {
  let {
    log,
    error,
    connection,
    models,
    circles
  } = ctx

  return function (name, props) {
    props = props || {};

    var oid = mongoose.SchemaTypes.ObjectId;

    var _virtuals = {};

    // Check for a scheme definition
    if (props.schema) {
      // Look for circular references
      Object.keys(props.schema).forEach(function (key) {
        var def = props.schema[key];
        if (typeof def === 'object' && def.type === oid) {
          // Shortcut simple circular reference to self
          if (def.ref === '$circular') {
            def.ref = {
              $circular: name
            };
          }
          // Handle circular references
          if (typeof def.ref === 'object' && def.ref && def.ref.$circular) {
            var model = def.ref.$circular;
            // First, check if the model is already loaded
            if (models[model] && typeof models[model] === 'object') {
              props.schema[key].ref = models[model].schema;
            }
            // Otherwise, wait and resolve it later
            else {
              circles.once(model, function (model) {
                def.ref = model.schema;
                var update = {};
                update[key] = def;
                props.schema.add(update);
              });
              delete props.schema[key];
            }
          }
        }
        // Handle automatic virtuals for custom types
        var type = def;
        if (typeof def === 'object') {
          type = def.type;
        }
        if (typeof type === 'function' && type._mmId) {
          var funcs = virtuals[type._mmId](key);
          Object.keys(funcs).forEach(function (virtual) {
            if (virtual[0] === '.') {
              virtual = key + virtual;
            }
            _virtuals[virtual] = funcs[virtual];
          });
        }
      });
      // Create the schema
      props.schema = new mongoose.Schema(props.schema);
      // Bind automatic virtuals
      Object.keys(_virtuals).forEach(function (virtual) {
        var funcs = _virtuals[virtual];
        props.schema.virtual(virtual)
          .get(funcs.get || function () {})
          .set(funcs.set || function () {});
      })
    }

    // Check if we are loading the timestamps plugin
    if (props.useTimestamps) {
      props.schema.plugin(mongooseTypes.useTimestamps);
    }

    // Bind any instance methods to the schema.methods object
    if (props.methods) {
      Object.keys(props.methods).forEach(function (i) {
        props.schema.methods[i] = props.methods[i];
      });
    }

    props.schema.meta = {
      name: 'unnamed'
    }

    if (props.meta) {
      props.schema.meta = props.meta
    }

    if (props.plugins) {
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
      var model = connection.model(name, props.schema);

      // Copy over all other properties as static model properties
      Object.keys(props).forEach(function (i) {
        if (i !== 'schema' && i !== 'useTimestamps' && i !== 'methods') {
          model[i] = props[i];
        }
      });

      // Store the model
      models[name].model = model;

      // The model is done being built, allow circular reference to resolve
      circles.emit(name, model);

      return model;
    }
  }
}
