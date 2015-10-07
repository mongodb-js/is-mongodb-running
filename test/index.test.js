var isMongodbRunning = require('../');
var assert = require('assert');

describe('is-mongodb-running', function() {
  it('should work', function() {
    assert(isMongodbRunning);
  });
});
