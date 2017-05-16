import test from 'ava'

var mongoose = require('mongoose'),
  Schema = mongoose.Schema

mongoose.connect('localhost', 'test');

mongoose.Promise = global.Promise;
// Based on: http://mongoosejs.com/docs/2.7.x/docs/populate.html

var PersonSchema = new Schema({
  name: String,
  age: Number,
  stories: [{
    type: Schema.ObjectId,
    ref: 'Story'
  }]
});

var StorySchema = new Schema({
  _creator: {
    type: Schema.ObjectId,
    ref: 'Person'
  },
  title: String,
  fans: [{
    type: Schema.ObjectId,
    ref: 'Person'
  }]
});

test.before(() => {
  // Person.collection.drop()
  // Story.collection.drop()

})

var story1, aaron

var Story = mongoose.model('Story', StorySchema);
var Person = mongoose.model('Person', PersonSchema);

test.cb('create person', t => {
  aaron = new Person({
    name: 'Aaron',
    age: 100
  });
  console.log('created person', aaron)

  try {
    aaron.save(function (err) {
      console.log('-- saved aaron')
      t.pass('saved aaron')

      if (err) t.fail()

      story1 = new Story({
        title: "A man who cooked Nintendo",
        _creator: aaron._id
      });
      console.log('-- story1', story1)
      try {
        story1.save(function (err) {
          console.log('-- saved story1', err)
          if (err) t.fail('fail story1')
          t.pass('saved story1')
          t.end()
        });
      } catch (err) {
        t.fail('fucked up story1!')
        t.end()
      }
    })
  } catch (err) {
    t.fail('fucked up!')
    t.end()
  }
})

test.cb('find story creator', t => {
  Story
    .findOne({
      title: /Nintendo/i
    })
    .populate('_creator') // <--
    .exec(function (err, story) {
      if (err) t.fail('no such creator')
      console.log('found story', story)
      console.log('The creator is %s', story._creator.name);
      t.pass('found story creator')
      t.end()
    })
})

test.cb('find name of creator', t => {
  Story
    .findOne({
      title: /Nintendo/i
    })
    .populate('_creator', ['name']) // <-- only return the Persons name
    .exec(function (err, story) {
      if (err) t.fail()

      console.log('The creator is %s', story._creator.name);
      // prints "The creator is Aaron"

      console.log('The creators age is %s', story._creator.age)
      // prints "The creators age is null'
      t.pass('found creator name but not age')
      t.end()
    })
})

test.cb('add fans', t => {
  story1 = new Story({
    title: "A man who cooked Nintendo",
    _creator: aaron._id
  });

  console.log('Add fans to', story1)

  story1.fans.push(aaron);

  Story
    .find({
      title: /Nintendo/i
    })
    .populate('fans', null, {
      age: {
        $gte: 21
      }
    }, {
      limit: 5
    }).exec(function (err, fans) {
      if (err) t.fail('no fans')

      console.log('The adult fans are', fans);
      t.end()
    })
})

test.cb('push story', t => {
  aaron = new Person({
    name: 'Aaron',
    age: 100
  });
  console.log('created person', aaron)

  aaron.stories.push(story1);
  aaron.save(function (err) {
    if (err) t.fail('push story')
    t.end()
  });
})

// test.skip('push stories on aaron', t => {
//   Person
//     .findOne({
//       name: 'Aaron'
//     })
//     .populate('stories') // <-- only works if you pushed refs to children
//     .exec(function (err, person) {
//       if (err) t.fail()

//       console.log('JSON for person is: ', person);
//     })
// })

// test.skip('get stories of aaron', t => {
//   Story
//     .find({
//       _creator: aaron._id
//     })
//     .populate('_creator') // <-- not really necessary
//     .exec(function (err, stories) {
//       if (err) t.fail()

//       console.log('The stories JSON is an array: ', stories);
//     })
// })

// test.skip('creator Guillermo: full', t => {
//   var guille = new Person({
//     name: 'Guillermo'
//   });
//   guille.save(function (err) {
//     if (err) t.fail()

//     story._creator = guille; // or guille._id

//     story.save(function (err) {
//       if (err) t.fail()

//       Story
//         .findOne({
//           title: /Nintendo/i
//         })
//         .populate('_creator', ['name'])
//         .exec(function (err, story) {
//           if (err) t.fail()

//           console.log('The creator is %s', story._creator.name)
//           // prints "The creator is Guillermo"
//           t.pass('creator is Guillermo')
//         })

//     })
//   })
// })