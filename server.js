require.paths.unshift("./vendor");

var router = require('./lib/router').createRouter();
var api = require('./lib/api').createServer();
var app = require('./lib/app');
var routerConfig = require('./lib/config').createRouterConfig();

api.setRouter(router);
api.setConfig(routerConfig);
router.setConfig(routerConfig);

router.listen(80);
api.listen(8081);
app.boot(8080);


hardBlockedIps = []; 
//blockedIps.push({ip: '127.0.0.1', expires: undefined});
//hardBlockedIps.push({ip: '127.0.0.1', expires: 1283108585814});


softBlockedIps = []; 
//softBlockedIps.push({ip: '127.0.0.1', expires: undefined});
//softBlockedIps.push({ip: '127.0.0.1', expires: 1283108585814});


//Hard block list
router.on('clientReq', function(req, res) {

    for (var i=0;i<hardBlockedIps.length;i++){
        if (req.connection.remoteAddress === hardBlockedIps[i].ip) {
            if (hardBlockedIps[i].expires !== undefined && (new Date).getTime() > hardBlockedIps[i].expires) {
                console.log("Hard Block on IP " + hardBlockedIps[i].ip + " expired");
                break;
            } else {
                req.connection.end();
                res.end();
                console.log("Hard Blocked IP " + hardBlockedIps[i].ip); 
                router.stopPropegation('clientReq');
                router.preventDefault('clientReq');
                break;
            }
        }
    }

});

//Soft block list
router.on('clientReq', function(req, res) {
    for (var i=0;i<softBlockedIps.length;i++){
        if (req.connection.remoteAddress === softBlockedIps[i].ip) {
           if (softBlockedIps[i].expires !== undefined && (new Date).getTime() > softBlockedIps[i].expires) {
                console.log("Soft Block on IP " + softBlockedIps[i].ip + " expired");
                break;
            } else {
                var body = 'Denied'
                res.writeHead(500, {'Content-Type': 'text/plain', 'Content-Length': body.length });
                res.end(body);
                req.connection.end();
                console.log("Soft Blocked IP " + softBlockedIps[i].ip); 
                router.stopPropegation('clientReq');
                router.preventDefault('clientReq');
                break;
            }
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
