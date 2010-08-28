require.paths.unshift("./vendor");
require("./app");
var router = require('./lib/router');

r = router.createRouter();
