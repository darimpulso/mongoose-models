module.exports = function logger(conf, opts) {
  opts = opts || conf
  const io = opts.io || console.log

  function _print(msg, data) {
    data ? io('mongoose-models', msg, data) : io('mongoose-models', msg)
  }

  function log(msg, data) {
    if (opts.logging) {
      _print(msg, data)
    }
  }

  function error(msg, data) {
    if (opts.logging) {
      _print(msg, data)
      throw new Error(`mongoose-models: ${msg}`)
    }
  }
  return {
    log,
    error
  }
}
