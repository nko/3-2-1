var http = require('http');

var s = require('express').createServer();

var generateRequestID = function() {
    var ALPHABET = 'abcdefghijklmnopqrstuvwxyz1234567890';

    var id = '';
    for (var i = 0; i < 10; i++) {
        id += ALPHABET[(Math.random() * ALPHABET.length) | 0];
    }

    return id;
};

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

s.get('/api/data', function(req, res) {
    req.on('end', function() {
        res.writeHead(200, {'Content-Type' : 'application/json'});
        res.write(JSON.stringify(generateRandomModelJSON()));
        res.end('\n');
    });
});

s.listen(8080);
