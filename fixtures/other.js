var models = require('mongoose-models');

var Person = models.require('Person')();

Person.findByName('bob', function (err, bob) {

});