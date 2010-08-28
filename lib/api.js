var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var http = require('http');
var netBinding = process.binding('net');
var sys = require('sys');

var getpeername = netBinding.getpeername;

// Listens for events from router.js and stores them for later
// access. An instance of Server is most likely to care about
// accessing this data, of course.
var RouterObserver = function() {
    EventEmitter.call(this);

    var self = this;

    // Our in-memory store
    //
    // XXX: Replace me wth something like MongoDB
    var store = {
        MAX_RECORDS : 16,
        req : [],
        res : []
    };

    // Append some data to our store of the given type
    var add = function(type, data) {
        assert.ok(store[type].length <= store.MAX_RECORDS);

        if (store[type].length == store.MAX_RECORDS) {
            store[type].shift();
        }

        store[type].push(data);

        self.emit(type, data);
    };

    // Generate a request ID
    var genReqID = function() {
        var ALPHABET = 'abcdefghijklmnopqrstuvwxyz1234567890';

        var id = '';
        for (var i = 0; i < 10; i++) {
            id += ALPHABET[(Math.random() * ALPHABET.length) | 0];
        }

        return id;
    };

    // Get an array of events that are newer than the given
    // timestamp. Returns an empty array if there are no such
    // events.
    self.getNewEvents = function(type, time) {
        for (var i = 0;
             i < store[type].length &&
                store[type][i].time <= time;
             i++) {
        }

        return (i >= store[type].length) ?
            [] :
            store[type].slice(i, store[type].length);
    };

    // Set the router to listen to and configure events on the
    // router; this is the meat of our object.
    self.setRouter = function(r) {
        r.on('clientReq', function(req, res) {
            var peer = getpeername(req.connection.fd);
            var reqId = genReqID();
            var chunkSeq = 0;
            var resStatus;
            var resHeaders;

            add('req', {
                'id' : reqId,
                'time' : Date.now(),
                'method' : req.method,
                'url' : req.url,
                'srcIP' : peer.address,
                'srcPort' : peer.port,
                'headers' : req.headers
            });

            // XXX: Not handling status message as optional
            //      second argument. Maybe some day.
            var oldWriteHead = res.writeHead;
            res.writeHead = function(status, hdrs) {
                oldWriteHead.apply(
                    this,
                    Array.prototype.slice.call(arguments)
                );

                resStatus = status;
                resHeaders = hdrs || {};
            };

            var oldWrite = res.write;
            res.write = function(data) {
                oldWrite.apply(
                    this,
                    Array.prototype.slice.call(arguments)
                );

                add('res', {
                    id : reqId,
                    status : resStatus,
                    headers : resHeaders,
                    seq : chunkSeq++,
                    time : Date.now(),
                    size : data.length
                });
            };

            var oldEnd = res.end;
            res.end = function() {
                var dataLen = (arguments[0]) ?
                    arguments[0].length :
                    0;

                oldEnd.apply(
                    this,
                    Array.prototype.slice.call(arguments)
                );

                add('res', {
                    id : reqId,
                    status : resStatus,
                    headers : resHeaders,
                    seq : 0xffffffff,
                    time : Date.now(),
                    size : dataLen
                });
            };
        });
    };
};
sys.inherits(RouterObserver, EventEmitter);

// Our API server
//
// This object implements the HTTP and WebSocket APIs. It gets
// its data from theRou
var Server = function() {
    var self = this;

    // Create and configure our HTTP server
    var httpSrv = require('express').createServer();

    httpSrv.get('/api/data(/\\d+)?/?', function(req, res) {
        var since = (req.params[0]) ?
            parseInt(req.params[0].substring(1, req.params[0].length)) :
            0;
        var o = {
            'req' : [],
            'res' : []
        };

        ro.getNewEvents('req', since).forEach(function(r) {
            o.req.push(r);
        });
        ro.getNewEvents('res', since).forEach(function(r) {
            o.res.push(r);
        });

        req.on('end', function() {
            res.writeHead(200, {'Content-Type' : 'application/json'});
            res.write(JSON.stringify(o));
            res.end();
        });
    });

    // Create and configure our WebSocket server
    var wsSrv = require('websocket-server').createServer({
        datastore : false,
        server : httpSrv
    });

    // Active WS connections/clients
    var wsConns = [];

    wsSrv.on('connection', function(c) {
        wsConns.push(c);

        c.on('close', function() {
            for (var i = 0;
                 i < wsConns.length && wsConns[i] !== c;
                 i++) {
            }

            assert.ok(i < wsConns.length);
            wsConns.slice(i, 1);
        });
    });

    var ro = new RouterObserver();
   
    var roListener = function(r) {
        wsConns.forEach(function(wc) {
            var o = {}
            o[('srcIP' in r) ? 'req' : 'res'] = [r];
            wc.write(JSON.stringify(o));
        });
    };
    ro.on('req', roListener);
    ro.on('res', roListener);

    // External API

    self.setRouter = function(r) {
        ro.setRouter(r);
    };

    self.listen = function(port) {
        return httpSrv.listen(port);
    };
};

exports.createServer = function() {
    return new Server();
};
