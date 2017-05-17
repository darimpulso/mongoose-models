var path = require('path');
var events = require('events');
var mongoose = require('mongoose');
var readDir = require('fs-readdir-recursive')
var classify = require('underscore.string/classify')

mongoose.Promise = require('q').Promise;

// Patch mongoose-types bug (#17 and #21)
// @link {https://github.com/bnoguchi/mongoose-types/}
var bson = require('bson');
mongoose.mongo.BinaryParser = bson.BinaryParser;

var mongooseTypes = require('mongoose-types');

function logger(conf) {
	function log(...msgs) {
		var io = conf.info || console.log
		if (conf.debug) {
			io('mongoose-models', ...msgs)
		}
	}

	function error(...msgs) {
		var io = conf.error || console.log
		if (conf.debug) {
			io('mongoose-models', ...msgs)
			throw Error('mongoose-models')
		}
	}
	return { log, error }
}

var dashBar = '-----------------------------------------------------------------'


exports.init = function (conf) {
	var { log, error } = logger(conf)
	var connection = mongoose.createConnection(conf.url);
	log('Created Mongoose connection', {url: conf.url, port: connection.port, name: connection.name})

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
		conf.modelPath = conf.modelPath || conf.model.filePath
		conf.resolveModelName = conf.resolveModelName || conf.model.resolveName
	}

	log(dashBar)

	var resolveName = conf.resolveModelName || function (name) {
    return classify(name)
  }

  // ignore none by default
	var modelIgnore = function() { return false }
	var ignorePattern = function(file) {
		return conf.ignore.test(file)
	}

  modelIgnore = (conf.ignore && typeof conf.ignore !== 'function') ? ignorePattern : conf.ignore || modelIgnore

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

		file = file.split('.');
		if (file.length > 1 && file.pop() === 'js') {
			file = file.join('.');
			file = path.join(conf.modelPath, file);
			var model = path.basename(file);
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
	});

	// Load a model
	exports.require = function (model) {
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

	var oid = mongoose.SchemaTypes.ObjectId;

	// Handles circular references
	var circles = new events.EventEmitter();

	// Creates a new model
	exports.create = function (name, props) {
		props = props || {};

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

			if (plugins.length && plugins.length > 0) {
				props.plugins.forEach(function(plug) {
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
					props.schema.plugin(val)
				})
			}
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
	};

	exports.connection = connection
	// Expose mongoose and mongoose's types
	exports.mongoose = mongoose;
	exports.types = mongoose.SchemaTypes;

	// Don't allow re-init
	exports.init = undefined;
};