var request = require('request');
var fs = require('fs-extra');
var path = require('path');
var unzip = require('unzip');
var reader = require('geonames-reader');

module.exports = function(program, config) {
    program
        .command('fetch [countries...]')
        .description('Download files from geonames.org')
        .option('--alt', 'Download alternateNames.zip', false)
        .option('--ci', 'Download countryInfo.txt', false)
        .option('--c1', 'Download cities1000.zip', false)
        .option('--c5', 'Download cities5000.zip', false)
        .option('--c15', 'Download cities15000.zip', false)
        .option('--re', 'Download admin1CodesASCII.txt', false)
        .action(function(countries, options) {
            fs.ensureDir(config.paths.rawData, function(err) {
                options.alt && geoRequestUnzip('alternateNames');
                options.ci && geoRequestTxt('countryInfo');
                options.re && geoRequestTxt('admin1CodesASCII');
                options.c1000 && geoRequestUnzip('cities1000');

                if (!countries.length) return;

                countries.length === 1 && countries[0].toLowerCase() === 'all' ?
                    getAllCountries() : getCountries(countries);
            });

            function getAllCountries() {
                var allCountries = [];

                fs.stat(config.src.countryInfo, function (err) {
                    if (err) {
                        console.log('countryInfo.txt is not exists, download countryInfo.txt first!');
                        return;
                    }

                    reader.read(config.src.countryInfo, function(data, cb) {
                        allCountries.push(data.iso);
                        cb();
                    }, function(err) {
                        getCountries(allCountries);
                    });
                })
            }

            function getCountries(countries) {
                console.log('%s countries will be downloaded', countries.length);

                countries.forEach(function(country) {
                    country = country.toUpperCase();
                    geoRequestUnzip(country, 'countries');
                });
            }

            function geoRequestUnzip(target, subDir) {
                if (!subDir) subDir = '';

                fs.removeSync(dist);

                request('http://download.geonames.org/export/dump/' + target + '.zip')
                    .on('response', function(res, err) {
                        console.log('%s downloaded!', target);
                    })
                    .on('error', function(err) {
                        console.log('%s download error!', target);
                    })
                    .pipe(unzip.Extract({
                        path: path.join(config.paths.rawData, subDir, target)
                    }));
            }

            function geoRequestTxt(target, subDir) {
                if (!subDir) subDir = '';

                request('http://download.geonames.org/export/dump/' + target + '.txt')
                    .on('response', function(res, err) {
                        console.log('%s downloaded!', target);
                    })
                    .on('error', function(err) {
                        console.log('%s download error!', target);
                    })
                    .pipe(fs.createWriteStream(path.join(config.paths.rawData, subDir, target + '.txt')));
            }
        })
};
