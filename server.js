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

//Hard block list
router.on('clientReq', function(req, res) {
    var blockedIps = []; 
    for (var i=0; i<blockedIps.length;i++) {
        if (req.connection.remoteAddress === blockedIps[i]) {
            req.connection.end();
            res.end();
            router.stopPropegation('clientReq');
            router.preventDefault('clientReq');
            break;
        }
    }

});

//Soft block list
router.on('clientReq', function(req, res) {
    var blockedIps = [];
    //var blockedIps = ['127.0.0.1'];
    for (var i=0; i<blockedIps.length;i++) {
        if (req.connection.remoteAddress === blockedIps[i]) {
            var body = 'Denied'
            res.writeHead(500, {'Content-Type': 'text/plain', 'Content-Length': body.length });
            res.end(body);
            req.connection.end();
            router.stopPropegation('clientReq');
            router.preventDefault('clientReq');
            break;
        }
    }
});

