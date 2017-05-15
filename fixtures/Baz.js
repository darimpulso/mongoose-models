var models = require('mongoose-models');

models.create('Baz', {
  schema: {
    child: {
      type: models.types.ObjectId,
      ref: '$circular'
    }
  }
});