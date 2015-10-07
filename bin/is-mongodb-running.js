#!/usr/bin/env node

/* eslint no-sync:0 */
var path = require('path');
var fs = require('fs');
var chalk = require('chalk');
var figures = require('figures');
var format = require('util').format;

var usage = fs.readFileSync(path.resolve(__dirname, '../usage.txt')).toString();
var args = require('minimist')(process.argv.slice(2), {
  boolean: ['debug', 'json']
});

if (args.debug) {
  process.env.DEBUG = 'is-mongodb-running';
}
var lookup = require('../');
var pkg = require('../package.json');

if (args.help || args.h) {
  console.error(usage);
  process.exit(1);
}
if (args.version) {
  console.error(pkg.version);
  process.exit(1);
}

lookup(args, function(err, res) {
  if (err) {
    if (args.json) {
      err = JSON.stringify(err, null, 2);
    }
    console.error(chalk.red(figures.cross), err.message);
    console.error(chalk.gray(err.stack));
    process.exit(1);
    return;
  }
  if (args.json) {
    console.log(JSON.stringify(res, null, 2));
  } else {
    if (res.length === 0) {
      console.log('☹ No MongoDB instances running');
      return;
    }
    console.log(chalk.green(figures.tick),
      ' Yep!', res.length, 'MongoDB instance(s) running:');
    res.map(function(d, i) {
      console.log('  ', i + 1 + '.',
        'port',
        chalk.bold(d.port),
        'with pid',
        chalk.bold(d.pid));
    });
  }
});
