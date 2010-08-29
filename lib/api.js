var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var formidable = require('formidable');
var http = require('http');
var netBinding = process.binding('net');
var sys = require('sys');

var getpeername = netBinding.getpeername;

// Track events
var MemoryEventStore = function(maxEntries) {
    EventEmitter.call(this);

    var self = this;

    var store = {
        req : [],
        res : []
    };

    // Append some data to our store of the given type
    self.add = function(type, data) {
        assert.ok(store[type].length <= maxEntries);

        if (store[type].length == maxEntries) {
            store[type].shift();
        }

        store[type].push(data);

        self.emit(type, data);
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
};
sys.inherits(MemoryEventStore, EventEmitter);

// Listens for events from router.js and stores them for later
// access. An instance of Server is most likely to care about
// accessing this data, of course.
var RouterObserver = function() {
    EventEmitter.call(this);

    var self = this;
    var store;

    // Generate a request ID
    var genReqID = function() {
        var ALPHABET = 'abcdefghijklmnopqrstuvwxyz1234567890';

        var id = '';
        for (var i = 0; i < 10; i++) {
            id += ALPHABET[(Math.random() * ALPHABET.length) | 0];
        }

        return id;
    };

    self.setStore = function(s) {
        store = s;
    };

    self.setRouter = function(r) {
        r.on('clientReq', function(req, res) {
            var peer = getpeername(req.connection.fd);
            var reqId = genReqID();
            var chunkSeq = 0;
            var resStatus;
            var resHeaders;

            store.add('req', {
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

                store.add('res', {
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

                store.add('res', {
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

    httpSrv.get(/\/([\w\.]+)\/data(\/\d+)?\/?/, function(req, res) {
        var name = req.params[0];
        var since = (req.params[1]) ?
            parseInt(req.params[1].substring(1, req.params[1].length)) :
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

    httpSrv.get(/^\/([\w\.]+)\/?$/, function(req, res) {
        var name = req.params[0];

        if (!cfg.proxyExists(name)) {
            res.writeHead(404);
            res.end();
            return;
        }

        res.writeHead(200, {'Content-Type' : 'application/json'});
        res.end(JSON.stringify(cfg.getOriginsForProxy(name)));
    });

    httpSrv.put(/^\/([\w\.]+)\/?$/, function(req, res) {
        var name = req.params[0];

        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            if (err) {
                res.writeHead(400);
                res.end();
                return;
            }

            if (!('hosts' in fields)) {
                res.writeHead(400);
                res.end();
                return;
            }

            var hosts = [];
            fields.hosts.split(',').forEach(function(v) {
                if (v.length > 0) {
                    hosts.push(v);
                }
            });

            cfg.setOriginsForProxy(name, hosts);

            res.writeHead(200);
            res.end();
        });
    });

    httpSrv.del(/^\/([\w\.]+)\/?$/, function(req, res) {
        var name = req.params[0];

        res.writeHead((cfg.proxyExists(name)) ? 200 : 204);
        cfg.removeProxy(name);
        res.end();
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

    var store = new MemoryEventStore(1024);
    var storeListener = function(r) {
        wsConns.forEach(function(wc) {
            var o = {}
            o[('srcIP' in r) ? 'req' : 'res'] = [r];
            wc.write(JSON.stringify(o));
        });
    };
    store.on('req', storeListener);
    store.on('res', storeListener);

    var ro = new RouterObserver();
    ro.setStore(store);

    var cfg;

    // External API

    self.setRouter = function(r) {
        ro.setRouter(r);
    };

    self.setConfig = function(c) {
        cfg = c;
    };

    self.listen = function(port) {
        return httpSrv.listen(port);
    };
};

exports.createServer = function() {
    return new Server();
};
