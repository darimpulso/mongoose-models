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

test.skip('Foo', t => {
  t.is(Foo, true, 'Foo schema is defined')
})

test.skip('Bar', t => {
  t.is(Bar, true, 'Bar schema is defined')
})