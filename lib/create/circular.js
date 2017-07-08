module.exports = function createCircular(def, props, config = {}) {
  let {
    circles,
    log
  } = config

  // Shortcut simple circular reference to self
  log('circular ref')

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
