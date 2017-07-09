const mongoose = require('mongoose')
const resolveCircularRefs = require('./circular')
const virtualsFactory = require('./virtuals')
var oid = mongoose.SchemaTypes.ObjectId;

function buildSchema(schema) {
  return new mongoose.Schema(schema)
}


module.exports = function createSchema(props, config = {}) {
  const {
    log
  } = config

  log('resolve schema')

  const virtuals = virtualsFactory(props, config)
  const schemaKeys = Object.keys(props.schema)

  // Look for circular references
  schemaKeys.map(key => {
    var def = props.schema[key]
    log('resolve schema key', key)

    if (typeof def === 'object' && def.type === oid) {
      resolveCircularRefs(def, props, config)
    }
    virtuals.createVirtuals(def)
  })
  // Create the schema
  log('create mongoose schema')
  props.schema = buildSchema(props.schema);
  // Bind automatic virtuals
  log('bind any virtuals')
  virtuals.bindVirtuals()
}
