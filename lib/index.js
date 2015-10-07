var lsof = require('lsof');
var ps = require('ps-node');
var _ = require('lodash');
var debug = require('debug')('is-mongodb-running');

function fromPID(pid, fn) {
  lsof.raw(pid, function(fds) {
    debug('lsof.raw says', fds);
    // fds = [
    //   {
    //     command: 'mongod',
    //     pid: '19989',
    //     user: 'lucas',
    //     fd: '5u',
    //     type: 'IPv4',
    //     device: '0x61872ae41ba04f21',
    //     'size/off': '0t0',
    //     node: 'TCP',
    //     name: '*:27017',
    //     undefined: '(LISTEN)'
    //   }
    // ];
    var res = _.chain(fds)
      .filter(function(d) {
        return _.get(d, 'node') === 'TCP';
      })
      .map(function(d) {
        return {
          port: parseInt(d.name.split(':')[1], 10),
          pid: parseInt(d.pid, 10)
        };
      })
      .value();

    debug('parsed result is', res);
    return fn(null, res);
  });
}

module.exports = function(opts, fn) {
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }

  if (process.platform === 'win32') {
    return process.nextTick(function() {
      fn(new Error('Sorry windows not supported yet :('));
    });
  }

  debug('looking for mongodb `%j`...', opts);
  if (opts.pid) {
    debug('is it on pid `%s`?', opts.pid);
    fromPID(opts.pid, fn);
    return;
  }
  if (opts.port) {
    debug('is it on port `%s`?', opts.port);
    lsof.rawTcpPort(opts.port, function(fds) {
      debug('lsof.rawTcpPort says `%j`', fds);
      // fds = [{
      //   state: 'listen',
      //   command: 'mongod',
      //   pid: '19989',
      //   user: 'lucas',
      //   fd: '5u',
      //   type: 'IPv4',
      //   device: '0x61872ae41ba04f21',
      //   'size/off': '0t0',
      //   node: 'TCP',
      //   name: '*:27017'
      // }];
      var res = _.chain(fds)
        .filter(function(d) {
          return _.get(d, 'state') === 'listen';
        })
        .map(function(d) {
          if (d.node !== 'TCP') {
            return;
          }
          return {
            port: parseInt(d.name.split(':')[1], 10),
            pid: parseInt(d.pid, 10)
          };
        })
        .filter(function(d) {
          return _.get(d, 'port');
        })
        .value();

      debug('parsed result is', res);
      return fn(null, res);
    });
  } else {
    debug('seeing if mongod is running...');
    ps.lookup({
      command: 'mongod',
      psargs: '-l'
    }, function(err, res) {
      debug('ps.lookup for mongod says `%j`', {
        err: err,
        res: res
      });
      if (err) {
        return fn(err);
      }

      if (res.length === 0) {
        return fn(null, []);
      }
      // res = [{
      //   pid: '19989',
      //   command: '/Users/lucas/.mongodb/versions/mongodb/current/bin/mongod',
      //   arguments: [
      //     '--dbpath',
      //     '/Users/lucas/.mongodb/data/yelp',
      //     '--storageEngine=wiredTiger'
      //   ]
      // }];

      fromPID(parseInt(res[0].pid, 10), fn);
    });
  }
};
