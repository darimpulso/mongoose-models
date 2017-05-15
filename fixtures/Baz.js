var models = require('../lib');
models.create('Baz', {
  schema: {
    child: {
      type: models.types.ObjectId,
      ref: '$circular'
    }
  }
});