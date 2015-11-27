var path = require('path');
var fs = require('fs-extra');
var reader = require('geonames-reader');
var _ = require('lodash');

module.exports = function(program, config) {
    var alterNames = {};

    program
        .command('build [countries...]')
        .description('Build cities and regions for full countries')
        .option('--co', 'Build countries from countriesInfo.txt')
        .option('--ci', 'Build cities for countries from config')
        .action(function(countries, options) {
            var langs = config.langs;

            if (options.ci) {
                countries = config.countries || [];
            }

            config.options.countries && _.each(config.options.countries, function(params, opt) {
                if (params.langs && _.includes(countries, opt)) {
                    langs = langs.concat(params.langs);
                }
            });

            langs.forEach(function(lang) {
                alterNames[lang] = fs.readJsonSync(path.join(config.dist.alterNames, lang + '.json'));
            });

            if (countries.length) {
                countries.forEach(function(country) {
                    country = country.toUpperCase();
                    buildCities(country);
                });
            } else if (options.co) {
                buildCountries();
            }

            function buildCountries() {
                var countriesArr = [];

                reader.read(config.src.countriesInfo, function(country, cb) {
                    var res = {
                        geonameid: country.geoname_id,
                        cc: country.iso,
                        currency: country.currency_code,
                    };

                    config.langs.forEach(function(lang) {
                        var name = alterNames[lang][country.geoname_id] ?
                            alterNames[lang][country.geoname_id].name :
                            country.name;

                        res['name_' + lang] = name;
                    });

                    countriesArr.push(res);

                    cb();
                }, function(err) {
                    fs.outputJsonSync(config.dist.countriesList, countriesArr);
                    console.log('countries.json done!');
                });
            }

            function buildCities(country) {
                var countries = {};

                reader.read(path.join(config.src.countries, country, country + '.txt'), function(city, cb) {
                    var res = {
                        geonameid: city.id,
                        regionid: city.admin1_code,
                        lat: city.latitude,
                        lng: city.longitude,
                        cc: city.country_code
                    };

                    if (!countries[res.cc]) {
                        countries[res.cc] = {
                            regions: [],
                            cities: []
                        };
                    }

                    if (city.feature_class === 'P' || city.feature_code === 'ADM1') {
                        config.langs.forEach(function(lang) {
                            var name = alterNames[lang][city.id] && alterNames[lang][city.id].name;

                            // Only for Ukraine
                            if (country === 'UA' && lang === 'ru' && !name) {
                                name = alterNames.uk[city.id] && alterNames.uk[city.id].name;
                            }

                            if (!name) {
                                name = city.name;
                            }

                            res['name_' + lang] = name;
                        });
                    }

                    if (city.feature_class === 'P') {
                        var isExists = _.find(countries[res.cc].cities, function(some) {
                            return some.regionid == res.regionid &&
                                (some.name_ru.toLowerCase() == res.name_ru.toLowerCase() ||
                                some.name_en.toLowerCase() == res.name_en.toLowerCase());
                        });

                        if (isExists) {
                            if (!config.isCyrillic(isExists.name_ru) && config.isCyrillic(res.name_ru)) {
                                countries[res.cc].cities.splice(countries[res.cc].cities.indexOf(isExists), 1);
                                countries[res.cc].cities.push(res);
                            }
                        } else {
                            countries[res.cc].cities.push(res);
                        }

                        console.log('Cities in ' + res.cc + ': ' + countries[res.cc].cities.length);
                    } else if (city.feature_code === 'ADM1') {
                        countries[res.cc].regions.push(res);
                        console.log('Regions in ' + countries[res.cc].regions.length);
                    }

                    cb();
                }, function(err) {
                    _.each(countries, function(params, cc) {
                        fs.outputJsonSync(path.join(config.dist.countries, cc, 'cities.json'), params.cities);
                        fs.outputJsonSync(path.join(config.dist.countries, cc, 'regions.json'), params.regions);
                        console.log(cc + ': ' + params.cities.length);
                    });

                    console.log('Cities and regions done!');
                });
            }

        });
};
