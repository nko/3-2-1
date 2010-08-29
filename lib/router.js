var http = require('http'),
    sys = require('sys'),
    EventEmitter = require('events').EventEmitter,
    url = require('url');

//stealing Tim's neat conventions from connect
var Router = exports.Router = function() {
    that = this;

    this.callbacks = {};
    this.callbacks['clientReq'] = [];
    this.callbacks['upstreamResponse'] = [];
    this.callbacks['beforeWriteChunk'] = [];
    this.callbacks['afterWriteChunk'] = [];
    this.callbacks['upstreamEnd'] = [];
    this.callbacks['upstreamReq'] = [];
    this.callbacks['origin'] = [];
    this.ee = new EventEmitter();
    this.cfg = undefined;

    this.server = http.createServer(function(req,res) {
        // =clientReq= is emitted when a client requested is recieved by
        // the router 
        that.ee.emit('clientReq', 'clientReq', that, this, req, res);

            });

    for (event in this.callbacks) {
        this._on(event, this.callEventStack);
    }

};

//upstream host and port for this host/port combination
Router.prototype.findUpstream = function(host, port) {
    if (host.match(/\.ko-3-2-1\.no\.de$/)) {
        host = host.substring(0, host.length - '.ko-3-2-1.no.de'.length);
    }

    var ips = this.cfg.getOriginsForProxy(host);
    if (ips.length == 0) {
        return undefined;
    }

    return {
        host : ips[(Math.random() * ips.length) | 0],
        port : port
    };
};

Router.prototype._on = function(event,callback) {
    that.ee.on(event, callback);   
};

Router.prototype.listen = function(port) {
    this.server.listen(port);
};

Router.prototype.preventDefault = function(event) {
    that.callbacks[event].preventDefault = true;
};

Router.prototype.stopPropegation = function(event) {
    that.callbacks[event].Propegation = false;
};

Router.prototype.on = function(event, callback, pos) {
    var insertAt = function(arr, pos, o) {
        var tail = arr.slice(pos);
        return arr.concat(o, tail);
    }; 

    var stack = that.callbacks[event]; 

    if (pos !== undefined) {
       stack = insertAt(stack, pos, callback);
    } else {
       stack.push(callback);
    }
};

Router.prototype.callEventStack = function() {
    var args = Array.prototype.slice.call(arguments);
    var event = args.shift();
    var that = args.shift();
    var thar = args.shift();

    // console.log(event);

    for (var i=0;i<that.callbacks[event].length;i++) {
        if (that.callbacks[event].Propegation === false) {
           that.callbacks[event].Propegation = true; 
           break;
        }
        var callback = that.callbacks[event][i]; 
        callback.apply(thar, args);
    }
    that.callbacks[event].Propegation = true;

    if (that.callbacks[event].preventDefault !== true) {
        that._defaultCallback[event].apply(thar, args);
    }
    that.callbacks[event].preventDefault = false;
    
};

Router.prototype._defaultCallback = function() {};
Router.prototype._defaultCallback.clientReq = function(req, res) {
    var u = url.parse(req.url);

    var upstream = that.findUpstream(
        req.headers.host || u.hostname,
        u.port || 80
    );
    if (!upstream) {
        /* XXX: Use this rather than defaulting to Y
        res.writeHead(503);
        res.end();
        return;
        */

        upstream = {
            host : 'nodejs.org',
            port : 80
        };
    }

    that.ee.emit('origin', 'origin', that, this, req, upstream);
   
    var client = http.createClient(upstream.port, upstream.host);
    //assuming GET for basic case
    var clientReq = client.request('GET', req.url, req.headers);

    clientReq.on('response', function(response) {
        // =upstreamResponse= is emitted when a response is recieved from 
        // the upstream server. default action is to write the headers back
        // to the router's original client
        that.ee.emit('upstreamResponse', 'upstreamResponse', that, this, req, res, response);
         
        //write any chunks of data back to the client
        response.on('data', function(chunk) {
            //beforeWriteChunk is emitted when a chunk is received from the upstream 
            // server. the default action is to write the chunk back to the router's
            // original client
            that.ee.emit('beforeWriteChunk', 'beforeWriteChunk', that, this, req, res, response, chunk);
            // =afterWriteChunk= is emitted after the before write Chunk
            that.ee.emit('afterWriteChunk', 'afterWriteChunk', that, this, req, res, response, chunk);
        });

        //when the upstream response closes close the downstream response
        response.on('end', function() {
            // =upstreamEnd= is emitted when the upstream server closes the connection
            // the default action is to close the router's original response
            that.ee.emit('upstreamEnd', 'upstreamEnd', that, this, req, res, response);
        });
    });
    // =upstreamReq= is emitted after the clientReq objects has been initialised
    // and had listeners attached. the default action is to end the request
    // to the upstream server
    that.ee.emit('upstreamReq', 'upstreamReq', that, this, req, res, clientReq);
};
Router.prototype._defaultCallback.upstreamResponse = function(req, res, response) {
    res.writeHead(response.statusCode, response.headers);
};
Router.prototype._defaultCallback.beforeWriteChunk = function(req, res, response, chunk) {
   res.write(chunk); 
};
Router.prototype._defaultCallback.afterWriteChunk = function(req, res, response, chunk) {
    
};
Router.prototype._defaultCallback.upstreamEnd = function(req, res, response) {
   res.end(); 
};
Router.prototype._defaultCallback.upstreamReq = function(req, res, clientReq) {
   clientReq.end(); 
};
Router.prototype._defaultCallback.origin = function() { };
Router.prototype.setConfig = function(cfg) {
    this.cfg = cfg;
};

exports.createRouter = function() {
    return new Router(); 
}; 
