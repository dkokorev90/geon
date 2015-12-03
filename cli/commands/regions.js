var path = require('path');
var fs = require('fs-extra');
var reader = require('geonames-reader');
var _ = require('lodash');

module.exports = function(program, config) {
    var alterNames = {};

    program
        .command('regions [countries...]')
        .description('Build regions from the file cities1000.txt or cities5000.txt or cities15000.txt')
        .action(function(countries, options) {
            var alterLangs = config.langs;
            var regions = {};

            // Use these countries only
            if (countries.length) {
                countries = countries.map(function(cc) {
                    return cc.toUpperCase();
                });
            }

            // Use custom langs for some countries
            config.options.countries && _.each(config.options.countries, function(params, opt) {
                if (params.langs) {
                    alterLangs = alterLangs.concat(params.langs);
                }
            });

            alterLangs.forEach(function(lang) {
                alterNames[lang] = fs.readJsonSync(path.join(config.dist.alterNames, lang + '.json'));
            });

            reader.read(config.src.regions, function(region, cb) {
                var reg = region.path.split('.');
                var res = {
                    geonameid: region.geoname_id,
                    regionid: reg[1],
                    cc: reg[0]
                };

                if (countries.length && !_.includes(countries, res.cc)) {
                    cb();
                    return;
                }

                if (!regions[res.cc]) {
                    regions[res.cc] = [];
                }

                // Set translated names to a region
                config.langs.forEach(function(lang) {
                    var name = alterNames[lang][res.geonameid] && alterNames[lang][res.geonameid].name;

                    if (res.cc === 'UA' && lang === 'ru' && !name) {
                        name = alterNames.uk[res.geonameid] && alterNames.uk[res.geonameid].name;
                    }

                    if (!name) {
                        name = region.name;
                    }

                    res['name_' + lang] = name;
                });

                // Filter for dublicates
                var isExists = _.find(regions[res.cc], function(some) {
                    return some.regionid == res.regionid &&
                        (some.name_ru.toLowerCase() == res.name_ru.toLowerCase() ||
                        some.name_en.toLowerCase() == res.name_en.toLowerCase());
                });

                // Try to keep a region with cyrillic name_ru param
                if (isExists) {
                    if (!config.isCyrillic(isExists.name_ru) && config.isCyrillic(res.name_ru)) {
                        regions[res.cc].splice(regions[res.cc].indexOf(isExists), 1);
                        regions[res.cc].push(res);
                    }
                } else {
                    regions[res.cc].push(res);
                }

                console.log('Regions in ' + res.cc + ': ' + regions[res.cc].length);

                cb();
            }, function(err) {
                if (err) {
                    console.log('Regions error: %s', err);
                    return;
                }

                _.each(regions, function(regions, cc) {
                    fs.outputJsonSync(path.join(config.dist.countries, cc, 'regions.json'), regions);
                    console.log(cc + ': ' + regions.length);
                });

                console.log('Regions done!');
            });
        });
};
