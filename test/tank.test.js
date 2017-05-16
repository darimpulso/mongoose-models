import test from 'ava'

var mongoose = require('mongoose'),
  Schema = mongoose.Schema

mongoose.connect('localhost', 'test');

mongoose.Promise = global.Promise;

// Tank example
// http://mongoosejs.com/docs/models.html

var tankSchema = new mongoose.Schema({
  name: 'string',
  size: 'string'
});

var Tank = mongoose.model('Tank', tankSchema);

var small = new Tank({
  size: 'small'
});

test.before(() => {
  Tank.collection.drop()
})

test.cb('save small tank', t => {
  small.save(function (err) {
    if (err) t.fail('save small tank')
    t.pass('saved small tank')
    t.end()
  })
})


test.cb('create small tank', t => {
  Tank.create({
    size: 'small'
  }, function (err, small) {
    if (err) t.fail('create small tank')
    t.pass('saved small tank')
    t.end()
  })
})