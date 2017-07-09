var path = require('path');
var events = require('events');
var readDir = require('fs-readdir-recursive')
var classify = require('underscore.string/classify')
var logger = require('./logger')
var mongooseTypes = require('mongoose-types');
var mongoose = require('mongoose');

module.exports = function (conf, opts = {}) {
  // Handles circular references
  var circles = new events.EventEmitter();

  var dashBar = '-----------------------------------------------------------------'

  var {
    log,
    error
  } = logger(conf, opts)
  var connection = mongoose.createConnection(conf.url);
  log('Created Mongoose connection', {
    url: conf.url,
    port: connection.port,
    name: connection.name
  })

  var virtuals = {};
  exports.installVirtuals = function (type, builder) {
    virtuals[type._mmId] = builder;
  };

  function loadType(typePath) {
    try {
      require(typePath).load(mongoose, exports);
    } catch (err) {
      error('unable to load', typePath, err)
    }
  }

  // Load extra types
  if (conf.types && conf.types.length > 0) {
    log('loading extra types')
    conf.types.forEach(function (type) {
      log('load type', type)
      // These comes with mongoose-types
      if (type === 'url' || type === 'email') {
        mongooseTypes.loadTypes(mongoose, type);
      }
      // If it starts with a dot or slash, assume its a file path
      else if (type[0] === '.' || type[1] === '/') {
        loadType(type)
      }
      // Anything else is assumed to be from us
      else {
        loadType('./types/' + type)
      }
    });
  }

  if (conf.model) {
    conf.ignore = conf.ignore || conf.model.ignore
    conf.include = conf.include || conf.model.include
    conf.modelPath = conf.modelPath || conf.model.filePath
    conf.resolveModelName = conf.resolveModelName || conf.model.resolveName
  }

  log(dashBar)

  var resolveName = conf.resolveModelName || function (name) {
    return classify(name)
  }

  // ignore none by default
  var modelIgnore = function () {
    return false
  }

  var modelInclude = function () {
    return true
  }

  var ignorePattern = function (file) {
    return conf.ignore.test(file)
  }

  var includePattern = function (file) {
    return conf.include.test(file)
  }

  modelIgnore = (conf.ignore && typeof conf.ignore !== 'function') ? ignorePattern : conf.ignore || modelIgnore

  modelInclude = (conf.include && typeof conf.include !== 'function') ? includePattern : conf.include || modelInclude

  // Find all of the models (This does not load models,
  // simply creates a registry with all of the file paths)
  var models = {};
  log('create model registry')
  log('from file path:', conf.modelPath)
  if (modelIgnore && conf.ignore) {
    log('ignore files matching:', conf.ignore)
  } else {
    log('loading all files')
  }
  readDir(conf.modelPath).forEach(function (file) {
    log('model file', file)
    // if (file[0] === '.') {
    // 	error('unable to load from relative path:', file)
    // 	return;
    // }

    if (modelIgnore(file)) {
      log('-- ignored', file)
      return
    }
    if (!modelInclude(file)) {
      log('-- not included', file)
      return
    }

    function lastDir(file) {
      let dir = path.dirname(file)
      return dir.split('/').reverse()[0]
    }

    file = file.split('.');
    if (file.length > 1 && file.pop() === 'js') {
      file = file.join('.');
      file = path.join(conf.modelPath, file);

      var model = path.basename(file)
      // if index, use nearest dir as name
      if (model === 'index') {
        model = lastDir(file)
      }

      log('resolve name', model)
      model = resolveName(model)

      models[model] = function () {
        return models[model].model;
      };
      models[model].path = file;
      models[model].model = null;
      models[model].schema = new mongoose.Schema();
      models[model].resolve = function (func) {
        circles.once(model, func);
        return models[model].getter;
      };
    } else {
      error('unable to build registry for', file)
    }
  }) // readdir

  var ctx = {
    log,
    error,
    models,
    connection,
    circles,
    virtuals,
    mongooseTypes
  }

  const _require = require('./require')(ctx)
  const create = require('./create')(ctx)
  const factory = require('./factory')(ctx)
  const types = mongoose.SchemaTypes

  const mongooseModels = {
    ctx,
    models,
    mongoose,
    types,
    require: _require,
    create,
    factory,
    connection
  }

  return mongooseModels
}
