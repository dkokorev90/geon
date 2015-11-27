var program = require('commander');
var path = require('path');
var fs = require('fs-extra');
var config = require('../config');
var info = require('../package.json');

if (!config.options) config.options = {};

var COMMANDS_DIR = path.resolve(__dirname, 'commands');
var commands = fs.readdirSync(COMMANDS_DIR);

commands.forEach(function(command) {
    if (!command.match(/\.js$/)) return;

    require(path.join(COMMANDS_DIR, command))(program, config);
});

program
    .version(info.version)
    .on('--help', function() {});

program.parse(process.argv);
