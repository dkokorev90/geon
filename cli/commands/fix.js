var reader = require('geonames-reader');
var path = require('path');
var fs = require('fs-extra');
var _ = require('lodash');

module.exports = function(program, config) {
    program
        .command('fix [countries...]')
        .description('Add some fixes for data')
        .action(function(countries) {
            var countriesFixesPath = path.join(config.paths.fixes, 'countries');
            var countriesToFix = fs.readdirSync(countriesFixesPath);

            if (countries.length) {
                countriesToFix = countries;
            } else {
                // Crimea fix (remove Crimea from UA and add to RU)
                config.options.fixes.crimea && require(path.join(config.paths.fixes, 'crimea.js'))(config);
            }

            countriesToFix.forEach(function(cc) {
                cc.toUpperCase();
                require(path.join(countriesFixesPath, cc, 'fix.js'))(config);
            });
        });
};
