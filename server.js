require.paths.unshift("./vendor");

var router = require('./lib/router').createRouter();
var api = require('./lib/api').createServer();
var app = require('./lib/app');
var config = require('./lib/config').createConfig();

api.setRouter(router);
api.setConfig(config);
router.setConfig(config);

router.listen(80);
api.listen(8081);
app.boot(8080);
