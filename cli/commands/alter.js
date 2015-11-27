var reader = require('geonames-reader');
var _ = require('lodash');
var path = require('path');
var fs = require('fs-extra');

module.exports = function(program, config) {
    program
        .command('alter [langs...]')
        .description('Filter alternateNames by language')
        .action(function(langs, options) {
            var alterLangs = {};

            // What languages will be used for alternate names
            if (!langs.length) {
                langs = config.langs;

                config.options.countries && _.each(config.options.countries, function(country) {
                    langs = langs.concat(country.langs);
                });
            }

            langs.forEach(function(lang) {
                alterLangs[lang] = {};
            });

            fs.ensureDir(config.paths.data, function(err) {
                console.log('Filtering alternateNames for langs: %s', langs.join(', '));

                reader.read(config.src.alterNames, function(alter, cb) {
                    langs.forEach(function(lang) {
                        if (alter.isolanguage == lang && !alter.is_historic) {
                            var res = {
                                name: alter.alternate_name
                            };

                            if (lang === 'ru' && !config.isCyrillic(res.name)) return;

                            if (alter.is_short) {
                                res.is_short = true;
                            } else if (alter.is_preferred) {
                                res.is_pref = true;
                            }

                            var existed = alterLangs[lang][alter.geoname_id];

                            // If name elready exists, check for priority
                            if (existed) {
                                if (existed.is_pref || (existed.is_short && !alter.is_preferred)) return;
                                if (lang === 'ru' && config.isCyrillic(existed.name) && !alter.is_preferred && !alter.is_short) return;
                            }

                            alterLangs[lang][alter.geoname_id] = res;
                        }
                    });

                    cb();
                }, function(err) {
                    if (err) {
                        console.log('alternateNames filter error: %s', err);
                        return;
                    }

                    langs.forEach(function(lang) {
                        fs.outputJsonSync(path.join(config.dist.alterNames, lang + '.json'), alterLangs[lang]);
                        console.log(lang + ': ' + Object.keys(alterLangs[lang]).length);
                    });

                    console.log('alternateNames filtering done!');
                });
            });
        });
};
