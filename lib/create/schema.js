const mongoose = require('mongoose')
const resolveCircularRefs = require('./circular')
const virtualsFactory = require('./virtuals')
var oid = mongoose.SchemaTypes.ObjectId;

module.exports = function createSchema(props, config = {}) {
  const {
    ctx
  } = config
  const {
    log
  } = ctx

  log('resolve schema')

  const virtuals = virtualsFactory(props, ctx)

  // Look for circular references
  Object.keys(props.schema).forEach(function (key) {
    var def = props.schema[key];
    log('resolve schema key', key)

    if (typeof def === 'object' && def.type === oid) {
      resolveCircularRefs(def, props, ctx)
    }
    virtuals.createVirtuals()
  });
  // Create the schema
  log('create mongoose schema')
  props.schema = new mongoose.Schema(props.schema);
  // Bind automatic virtuals
  log('bind any virtuals')
  virtuals.bindVirtuals()
}
