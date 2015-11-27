var path = require('path');
var fs = require('fs-extra');
var _ = require('lodash');

module.exports = function(config) {
    var crimea = {};
    var patchRegions = {
        '11': {
            name_ru: 'Республика Крым',
            regionid: '94'
        },
        '20': {
            name_en: 'Sevastopol',
            regionid: '95'
        }
    };

    removeCrimeaFromUA();
    addCrimeaToRU();

    function removeCrimeaFromUA() {
        var uaRegionsPath = path.join(config.dist.countries, 'UA', 'regions.json');
        var uaCitiesPath = path.join(config.dist.countries, 'UA', 'cities.json');
        var uaRegions = require(uaRegionsPath);
        var uaCities = require(uaCitiesPath);

        crimea.regions = _.remove(uaRegions, function(region) {
            return region.geonameid == 694422 || region.geonameid == 703883;
        });

        crimea.cities = _.remove(uaCities, function(city) {
            return city.regionid == '11' || city.regionid == '20';
        });

        fs.outputJsonSync(uaRegionsPath, uaRegions);
        fs.outputJsonSync(uaCitiesPath, uaCities);

        console.log('Crimea has removed from UA');
    }

    function addCrimeaToRU() {
        var ruRegionsPath = path.join(config.dist.countries, 'RU', 'regions.json');
        var ruCitiesPath = path.join(config.dist.countries, 'RU', 'cities.json');
        var ruRegions = require(ruRegionsPath);
        var ruCities = require(ruCitiesPath);

        crimea.regions.forEach(function(region) {
            region.cc = 'RU';
            _.merge(region, patchRegions[region.regionid]);
        });

        crimea.cities.forEach(function(city) {
            city.cc = 'RU';
            city.regionid = patchRegions[city.regionid].regionid;
        });

        ruRegions = ruRegions.concat(crimea.regions);
        ruCities = ruCities.concat(crimea.cities);

        fs.outputJsonSync(ruRegionsPath, ruRegions);
        fs.outputJsonSync(ruCitiesPath, ruCities);

        console.log('Crimea has added to RU');
    }
}
