var http = require('http');
var netBinding = process.binding('net');

var getpeername = netBinding.getpeername;

// Generate a request ID
var generateRequestID = function() {
    var ALPHABET = 'abcdefghijklmnopqrstuvwxyz1234567890';

    var id = '';
    for (var i = 0; i < 10; i++) {
        id += ALPHABET[(Math.random() * ALPHABET.length) | 0];
    }

    return id;
};

// Create a fake /api/data JSON payload
var generateRandomModelJSON = function() {
    var genReq = function() {
        return {
            'id' : generateRequestID(),
            'time' : (Date.now() / 1000) | 0,
            'url' : ((Math.random() * 2) > 1) ?
                '/foo' : '/bar',
            'srcIP' : '192.168.1.' +
                (1 + (Math.random() * 255) | 0),
            'headers' : {
                'Accept' : 'application/json;q=0.5, text/plain;q=0.1'
            }
        };
    };

    var genRes = function(id) {
        return {
            'id' : id,
            'seq' : -1,
            'size' : (Math.random() * 1024) | 0,
            'status' : 200,
            'headers' : {
                'Content-Type' : 'application/json',
                'Cache-Control' : 'max-age=60'
            }
        };
    };

    var o = {
        'req' : [],
        'res' : []
    };
    for (var i = 0; i < Math.random() * 10; i++) {
        var req = genReq();
        var res = genRes(req.id);
        o.req.push(req);
        o.res.push(res);
    }
    
    return o;
};

var Server = function() {
    var self = this;

    var srv = require('express').createServer();

    // Gather objects for each request / response event in
    // preparation for sending them out over the /api/data
    // API. These arrays get trimmed on every API call.
    var reqs = [];
    var resps = [];

    srv.get('/api/fake-data', function(req, res) {
        req.on('end', function() {
            res.writeHead(200, {'Content-Type' : 'application/json'});
            res.write(JSON.stringify(generateRandomModelJSON()));
            res.end('\n');
        });
    });

    srv.get('/api/data', function(req, res) {
        req.on('end', function() {
            res.writeHead(200, {'Content-Type' : 'application/json'});
            res.write(JSON.stringify({
                'req' : reqs,
                'res' : resps
            }));
            res.end();

            reqs = [];
            resps = [];
        });
    });

    self.listen = function(port) {
        return srv.listen(port);
    };

    self.addEventSource = function(e) {
        e.on('clientReq', function(r) {
            var peer = getpeername(r.connection.fd);

            o = {
                'id' : generateRequestID(),
                'time' : (Date.now() / 1000) | 0,
                'method' : r.method,
                'url' : r.url,
                'srcIP' : peer.address,
                'srcPort' : peer.port,
                'headers' : r.headers
            };

            reqs.push(o);
        });
    };
};

exports.createServer = function() {
    return new Server();
};
