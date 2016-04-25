<h2>How to use with jsx files:</h2>
1. Include `updater.js` in your jsx file at header:
 -`#include updater.js`
2. Before or after main tread execution insert `updater.chech(obj)` call with obj containts this fields:
    - version: current version of your script
    - url: url to make a request and receive all information about current version and news
example: `updater.check({version: '1.2', name:'your_script_name',  builder: 'true',  url: 'https://aeupdates.com/status/origami'});`
3. PROFIT

<h2>How to use with CEP panels</h2>
1.You don't need to use it with CEP panels, because there is ability to make requests to url by default, so all is needed
is to register at aeupdates.com and make request to proper endpoint

Extras:
    Keep in mind that `updater` call is blocking so if server is freezed, AE will freeze.
    But, good news is that we expected that kind of problems and:
    1) All requests are limiter by time (4 sec)
    2) Requests are made only once 6 hours (by default)
    If server is not available or responce isn't valid, there will be no errors and users will not notice any kind of
    unexpected behavior during usage of your script

tips:

vbs files are inlined, if needed to generate 1 line from file use: `cat curl.vbs | sed 's/$/\\n/' | tr -d '\n' > file_new.vbs`
