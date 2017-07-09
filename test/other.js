var models = require('../lib');
var Person = models.require('Person')();

// create model instance bob

// TODO: use async/Promise API
let bob = Person.findByName('bob', function (err, bob) {
  console.log('bob', bob)
});

module.exports = bob