var assert = require('assert');
var http = require('http');
var netBinding = process.binding('net');

var getpeername = netBinding.getpeername;

var MAX_DATA_RECORDS = 16;

// Generate a request ID
var generateRequestID = function() {
    var ALPHABET = 'abcdefghijklmnopqrstuvwxyz1234567890';

    var id = '';
    for (var i = 0; i < 10; i++) {
        id += ALPHABET[(Math.random() * ALPHABET.length) | 0];
    }

    return id;
};

// Push an element into an array, maintaining its maximum size
//
// XXX: This is going to perform like dogshit if
//      MAX_DATA_RECORDS gets too large. Don't care, as we'll
//      be using a DB at some point.
var pushBounded = function(arr, e, max) {
    arr.push(e);
    if (arr.length > max) {
        arr.shift();
    }
};

// In the given (sorted) array, look for the object, o, whose
// o[key] is the smallest value greater than val. Returns
// array.length if we couldn't find any matching values.
//
// XXX: Perform a lame linear search here. We'll be using a 
//      real DB later anyway. Fuck it.
var findDataObj = function(arr, key, val) {
    for (var i = 0;
         i < arr.length && arr[i][key] <= val;
         i++) {
    }

    return i;
};

var Server = function() {
    var self = this;

    var httpSrv = require('express').createServer();
    var wsSrv = require('websocket-server').createServer({
        datastore : false,
        server : httpSrv
    });

    // Gather objects for each request / response event in
    // preparation for sending them out over the /api/data
    // API. These arrays get trimmed on every API call.
    var reqs = [];
    var resps = [];

    // Active WS connections/clients
    var conns = [];

    httpSrv.get('/api/fake-data', function(req, res) {
        req.on('end', function() {
            res.writeHead(200, {'Content-Type' : 'application/json'});
            res.write(JSON.stringify(generateRandomModelJSON()));
            res.end('\n');
        });
    });

    httpSrv.get('/api/data(/\\d+)?/?', function(req, res) {
        var since = (req.params[0]) ?
            parseInt(req.params[0].substring(1, req.params[0].length)) :
            0;

        var o = {
            'req' : [],
            'res' : []
        };
        for (var i = findDataObj(reqs, 'time', since);
             i < reqs.length;
             i++) {
            o.req.push(reqs[i])
        }
        for (var i = findDataObj(resps, 'time', since);
             i < resps.length;
             i++) {
            o.res.push(resps[i])
        }

        req.on('end', function() {
            res.writeHead(200, {'Content-Type' : 'application/json'});
            res.write(JSON.stringify(o));
            res.end();
        });
    });

    wsSrv.on('connection', function(c) {
        conns.push(c);

        c.on('close', function() {
            for (var i = 0;
                 i < conns.length && conns[i] !== c;
                 i++) {
            }

            assert.ok(i < conns.length);
            conns.slice(i, 1);
        });
    });
    wsSrv.on('error', function(e) {
        console.log(e);
    });

    self.listen = function(port) {
        return httpSrv.listen(port);
    };

    self.addEventSource = function(e) {
        e.on('clientReq', function(req, res) {
            var peer = getpeername(req.connection.fd);

            var reqData = {
                'id' : generateRequestID(),
                'time' : Date.now(),
                'method' : req.method,
                'url' : req.url,
                'srcIP' : peer.address,
                'srcPort' : peer.port,
                'headers' : req.headers
            };

            var resData = {
                'id' : reqData.id
            };

            pushBounded(reqs, reqData, MAX_DATA_RECORDS);
            conns.forEach(function(c) {
                c.write(JSON.stringify({'req' : [reqData]}));
            });
           
            // XXX: Not handling status message as optional
            //      second argument. Maybe some day.
            var oldWriteHead = res.writeHead;
            res.writeHead = function(status, hdrs) {
                hdrs = hdrs || {};

                oldWriteHead.apply(this, Array.prototype.slice.call(arguments));

                resData.status = status;
                resData.headers = hdrs;
            };

            var oldEnd = res.end;
            res.end = function() {
                oldEnd.apply(this, Array.prototype.slice.call(arguments));

                resData.seq = -1;
                resData.time = Date.now(),
                resData.size = 0;

                pushBounded(resps, resData, MAX_DATA_RECORDS);
                conns.forEach(function(c) {
                    c.write(JSON.stringify({'res' : [resData]}));
                });
            };
        });
    };
};

exports.createServer = function() {
    return new Server();
};
