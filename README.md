### Collect and filter data from [geonames.org](http://geonames.org/) and store it in JSON

```sh
$ git clone git://github.com/molforp/geon
$ cd geon
$ npm install
```

#### Commands
* `geon fetch [countries...]` – download files from geonames.org

    param `countries`: optional (list of country codes: `RU UA US`, if not exists - from `config.js`)

    options: `--alt` - download `alternateNames.zip`, `--ci` - download `countryInfo.txt`, `--c1` - download `cities1000.zip`, `--c5` - download `cities5000.zip`, `--c15` - download `cities15000.zip`

* `geon alter [langs...]` – filter alternateNames by language

    param `langs`: optional (list of languages: `ru en`, if not exists - from `config.js`)

* `geon build [countries...]` – build cities and regions for full countries

    param `countries`: optional (list of country codes: `RU UA US`, if not exists - from `config.js`, or `all` - build all countries)

    options: `--co` - build countries from `countriesInfo.txt`, `--ci` - build cities for countries from config

* `geon cities [countries...]` – build cities from the file cities1000.txt or cities5000.txt or cities15000.txt

    param `countries`: optional (list of country codes: `RU UA US`, if not exists - build for all countries)

* `geon regions [countries...]` – build regions from the file cities1000.txt or cities5000.txt or cities15000.txt

    param `countries`: optional (list of country codes: `RU UA US`, if not exists - build for all countries)

* `geon fix [countries...]` – add some fixes for data

    param `countries`: optional (list of country codes: `RU UA US`, if not exists - add fixes for countries from directory `fixes/countries`)

* `geon -h` – show help for geon

All raw data stores in `raw_data` folder and destination data stores in `data` folder. You can change it in `config.js`.

`geon -h` for more info.

#### Steps
1. `geon fetch --alt --ci --c1` - download `alternateNames.zip`, `countriesInfo.txt`, `cities1000.zip`
2. `geon alter` - filter alternate names
3. `geon cities` and then `geon regions`, or just `geon build` - build cities and regions with translations from `alternateNames`
4. `geon fix` - add some fixes
