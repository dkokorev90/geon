var path = require('path');
var fs = require('fs-extra');
var reader = require('geonames-reader');
var _ = require('lodash');

module.exports = function(program, config) {
    var alterNames = {};

    program
        .command('cities [countries...]')
        .description('Build cities from the file cities1000.txt or cities5000.txt or cities15000.txt')
        .action(function(countries, options) {
            var alterLangs = config.langs;
            var countriesList = {};

            if (countries.length) {
                countries = countries.map(function(cc) {
                    return cc.toUpperCase();
                });
            }

            config.options.countries && _.each(config.options.countries, function(params, opt) {
                if (params.langs) {
                    alterLangs = alterLangs.concat(params.langs);
                }
            });

            alterLangs.forEach(function(lang) {
                alterNames[lang] = fs.readJsonSync(path.join(config.dist.alterNames, lang + '.json'));
            });

            reader.read(config.src.cities, function(city, cb) {
                if (countries.length && !_.includes(countries, city.country_code)) {
                    cb();
                    return;
                }

                var res = {
                    geonameid: city.id,
                    regionid: city.admin1_code,
                    lat: city.latitude,
                    lng: city.longitude,
                    cc: city.country_code
                };

                if (!countriesList[res.cc]) {
                    countriesList[res.cc] = [];
                }

                if (city.feature_class === 'P') {
                    config.langs.forEach(function(lang) {
                        var name = alterNames[lang][city.id] && alterNames[lang][city.id].name;

                        if (res.cc === 'UA' && lang === 'ru' && !name) {
                            name = alterNames.uk[city.id] && alterNames.uk[city.id].name;
                        }

                        if (!name) {
                            name = city.name;
                        }

                        res['name_' + lang] = name;
                    });

                    var isExists = _.find(countriesList[res.cc], function(some) {
                        return some.regionid == res.regionid &&
                            (some.name_ru.toLowerCase() == res.name_ru.toLowerCase() ||
                            some.name_en.toLowerCase() == res.name_en.toLowerCase());
                    });

                    if (isExists) {
                        if (!config.isCyrillic(isExists.name_ru) && config.isCyrillic(res.name_ru)) {
                            countriesList[res.cc].splice(countriesList[res.cc].indexOf(isExists), 1);
                            countriesList[res.cc].push(res);
                        }
                    } else {
                        countriesList[res.cc].push(res);
                    }

                    console.log('Cities in ' + res.cc + ': ' + countriesList[res.cc].length);
                }

                cb();
            }, function(err) {
                _.each(countriesList, function(cities, cc) {
                    fs.outputJsonSync(path.join(config.dist.countries, cc, 'cities.json'), cities);
                    console.log(cc + ': ' + cities.length);
                });

                console.log('Cities done!');
            });
        });
};
