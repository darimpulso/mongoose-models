var models = require('../lib');

var Person = models.create('Person', {

  // If this is given and truthy, the mongoose-types timestamps
  // plugin will be loaded for this model creating automatically
  // updating 'createdAt' and 'updatedAt' properties
  useTimestamps: true,

  // Define your mongoose schema here
  schema: {
    firstName: String,
    lastName: String,

    // Special types like Email, Url, and ObjectId can be accessed
    // through the models.types object
    email: models.types.Email,
    website: models.types.Url
  },

  // Instance methods can be defined here, eg.
  //
  //  Person.findOne({ firstName: 'bob' }, function(err, bob) {
  //    bob.sendEmail(...);
  //  });
  //
  methods: {

    sendEmail: function (subject, msg) {
      someMailingLib.sendEmail(this.email, subject, msg);
    }

  },

  // Anything other than the above properties is considered a static
  // properties and stored directly on the model, eg.
  //
  //  Person.findByName('bob', function(err, bob) {
  //    ...
  //  });
  //
  findByName: function (name, callback) {
    name = name.split(' ');
    var lookup = {
      firstName: name[0]
    };
    if (name.length > 1) {
      lookup.lastName = name.pop();
    }
    Person.findOne(lookup, callback);
  }

});