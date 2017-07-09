module.exports = function addPlugins(props, config = {}) {
  const {
    log,
    mongooseTypes
  } = config

  log('add plugins')
  var plugins = props.plugins
  var schemaName = props.schema.meta.name

  function addPluginObj(pluginObj) {
    const pluginNames = Object.keys(pluginObj)
    pluginNames.map(key => {
      var val = pluginObj[key]
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

  function addPluginList(plugins) {
    props.plugins.map(plug => {
      log('register plugin', plug.name, 'on', schemaName, 'schema')
      if (schemaName === 'unnamed') {
        log('suggestion: add meta object with name')
      }
      props.schema.plugin(plug)
    })
    return props
  }

  return Array.isArray(plugins) ? addPluginList(plugins) : addPluginObj(plugins)
}
