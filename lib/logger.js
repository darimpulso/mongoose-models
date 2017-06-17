module.exports = function logger(conf) {
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
  return {
    log,
    error
  }
}
