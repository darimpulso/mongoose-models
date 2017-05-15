import test from 'ava'
import models from '../lib'
import path from 'path'

models.init({
  url: 'mongodb://localhost/dbname',
  types: ['email', 'url', 'uuid'],
  modelPath: path.resolve(__dirname, '../fixtures'),
  debug: true
});

var Person = models.require('Person')()
test('Person', t => {
  console.log('Person', Person)
  t.truthy(Person, 'Person schema is defined')
  t.notThrows(() => Person({
    firstName: 'mike'
  }), 'creates Person instance')
})

var Foo = models.require('Foo')()
test('Foo', t => {
  t.truthy(Foo, 'Foo schema is defined')
})

var Bar = models.require('Bar')()
test('Bar', t => {
  t.truthy(Bar, 'Bar schema is defined')
})

var Baz = models.require('Baz')()
test('Baz', t => {
  t.truthy(Baz, 'Baz schema is defined')
})


var bob = require('./other')
test.skip('find bob', t => {
  t.pass()
})