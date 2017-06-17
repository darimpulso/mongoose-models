var mongoose = require('mongoose');
mongoose.Promise = require('q').Promise;

// Patch mongoose-types bug (#17 and #21)
// @link {https://github.com/bnoguchi/mongoose-types/}
var bson = require('bson');
mongoose.mongo.BinaryParser = bson.BinaryParser;

exports.init = require('./init')
