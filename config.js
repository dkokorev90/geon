var path = require('path');
var paths = {
    rawData: path.join(process.cwd(), 'raw_data'),
    data: path.join(process.cwd(), 'data'),
    fixes: path.join(process.cwd(), 'fixes')
};

module.exports = {
    paths: paths,

    src: {
        countries: path.join(paths.rawData, 'countries'),
        countriesInfo: path.join(paths.rawData, 'countryInfo.txt'),
        alterNames: path.join(paths.rawData, 'alternateNames', 'alternateNames.txt'),
        cities: path.join(paths.rawData, 'cities1000', 'cities1000.txt'),
        regions: path.join(paths.rawData, 'admin1CodesASCII.txt')
    },

    dist: {
        countries: path.join(paths.data, 'countries'),
        alterNames: path.join(paths.data, 'alterNames'),
        countriesList: path.join(paths.data, 'countries.json')
    },

    // which full countries to build
    countries: ['RU', 'UA'],

    // translations for countries and cities
    langs: ['ru', 'en'],

    // custom options
    options: {
        countries: {
            UA: {
                langs: ['uk']
            }
        },
        fixes: {
            crimea: true
        }
    },

    // check if text is cyrillic
    isCyrillic: function(text) {
        return /[а-я]/.test(text.toLowerCase());
    }
};
