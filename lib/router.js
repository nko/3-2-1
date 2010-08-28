var http = require('http'),
    sys = require('sys'),
    EventEmitter = require('events').EventEmitter;

//should not start with http
var UPSTREAM_HOST = 'search.yahoo.com';
var UPSTREAM_PORT = 80;

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
    this.ee = new EventEmitter();

    this.server = http.createServer(function(req,res) {
        that.ee.emit('clientReq', 'clientReq', this, req, res);

        var upstream = that.findUpstream(req.host, req.port);
        var client = http.createClient(upstream.port, upstream.host);
        //assuming GET for basic case
        var clientReq = client.request('GET', req.url, req.headers);

        clientReq.on('response', function(response) {
            that.ee.emit('upstreamResponse', 'upstreamResponse', this, req, res, response);
             
            //write any chunks of data back to the client
            response.on('data', function(chunk) {
                that.ee.emit('beforeWriteChunk', 'beforeWriteChunk', this, req, res, response, chunk);
                that.ee.emit('afterWriteChunk', 'afterWriteChunk', this, req, res, response, chunk);
            });

            //when the upstream response closes close the downstream response
            response.on('end', function() {
                that.ee.emit('upstreamEnd', 'upstreamEnd', this, req, res, response);
            });
        });
        that.ee.emit('upstreamReq', 'upstreamReq', this, req, res, clientReq);
    });

    for (event in this.callbacks) {
        this._on(event, this.callEventStack);
    }

};

//upstream host and port for this host/port combination
Router.prototype.findUpstream = function(host, port) {
    return {host: UPSTREAM_HOST, port: UPSTREAM_PORT};
};

Router.prototype._on = function(event,callback) {
    that.ee.on(event, callback);   
};

Router.prototype.listen = function(port) {
    this.server.listen(port);
};

Router.prototype.preventDefault = function(event) {
    that.callbacks[event].preventDefault = false;
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
    var thar = args.shift();

    for (var i=0;i<that.callbacks[event].length;i++) {
        if (that.callbacks[event].Propegation === false) {
           that.callbacks[event].Propegation = true; 
           console.log('bar');
           break;
        }
        var callback = that.callbacks[event][i]; 
        callback.apply(thar, args);
    }

    if (that.callbacks[event].preventDefault === true) {
        that.callbacks[event].preventDefault = false;
    } else {
        that._defaultCallback[event].apply(thar, args);
    }
    
};

Router.prototype._defaultCallback = function() {};
Router.prototype._defaultCallback.clientReq = function(req, res) {
                
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

exports.createRouter = function() {
    return new Router(); 
}; 
