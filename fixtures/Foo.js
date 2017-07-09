var models = require('../lib');

var Bar = models.require('Bar')();

models.create('Foo', {
  schema: {
    bar: {
      type: models.types.ObjectId,
      ref: {
        $circular: 'Bar'
      }
    }
  }
});