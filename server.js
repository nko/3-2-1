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

//bandwidth throttling
router.on('beforeWriteChunk', function(req, res, response, chunk) {
    //kilobytes/second average
    maxBandwidth = 50*1024;

    if (that.lastChunkTime === undefined) {
        that.lastChunkTime = Math.floor(((new Date).getTime())/1000);
        that.lastChunkSize = chunk.length;
    } else {
        var timeGap = (((new Date).getTime())/1000) - that.lastChunkTime;
        var totalSize = that.lastChunkSize + chunk.length;

        if ((totalSize/timeGap) > maxBandwidth) {
            response.pause();
            var timeout = Math.floor((totalSize - (maxBandwidth * timeGap)) / maxBandwidth)*1000;
            setTimeout(function() { 
                response.resume(); }, timeout);
            that.lastChunkTime = (new Date).getTime();
            that.lastChunkSize = chunk.size;
        } else {
            that.lastChunkSize = that.lastChunkSize + chunk.size;
        }
    }
});
