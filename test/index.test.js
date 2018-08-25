var isMongodbRunning = require('../');
var isMongodbRunningPromises = require('../promise');
var assert = require('assert');

describe('is-mongodb-running', function() {
  it('should work', function() {
    assert(isMongodbRunning);
  });
});

describe('is-mongodb-running-with-promises', function() {
  it('should work', function() {
    assert(isMongodbRunningPromises);
  });
});
