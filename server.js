require.paths.unshift("./vendor");

var router = require('./lib/router').createRouter();
var api = require('./lib/api').createServer();
var app = require('./lib/app');

api.addEventSource(router);

router.listen(80);
api.listen(8081);
app.boot(8080);
