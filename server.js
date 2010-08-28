require.paths.unshift("./vendor");

require('./lib/router').createRouter().listen(80);
require('./lib/api').createServer().listen(8081);
require('./lib/app').boot(8080);
