require.paths.unshift("./vendor");
require("./app");
var router = require('./lib/router');
var api = require('./lib/api');

r = router.createRouter();
