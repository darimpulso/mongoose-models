var models = require('mongoose-models');

var Foo = models.require('Foo')();

models.create('Bar', {
  schema: {
    foo: {
      type: models.types.ObjectId,
      ref: {
        $circular: 'Foo'
      }
    }
  }
});