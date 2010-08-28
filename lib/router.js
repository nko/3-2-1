var http = require('http'),
    sys = require('sys'),
    EventEmitter = require('events').EventEmitter;

var PORT = 80;
//should not start with http
var UPSTREAM_HOST = 'localhost'
var UPSTREAM_PORT = 8080;

//stealing Tim's neat conventions from connect
var Router = exports.Router = function() {
    that = this;
    this.ee = new EventEmitter();
    this.server = http.createServer(function(req,res) {
        that.ee.emit('clientReq', req, res);

        var upstream = that.findUpstream(req.host, req.port);
        var client = http.createClient(upstream.port, upstream.host);
        //assuming GET for basic case
        var request = client.request('GET', req.url, req.headers);

        request.on('response', function(response) {
            res.writeHead(response.statusCode, response.headers);
            that.ee.emit('upsteamResponse', response);
             
            //write any chunks of data back to the client
            response.on('data', function(chunk) {
                res.write(chunk);
                that.ee.emit('upstreamData', chunk);
            });

            //when the upstream response closes close the downstream response
            response.on('end', function() {
                res.end();
                that.ee.emit('upstreamEnd');
            });
        });
        request.end();
        that.ee.emit('upstreamReq');
    });
};

//upstream host and port for this host/port combination
Router.prototype.findUpstream = function(host, port) {
    return {host: UPSTREAM_HOST, port: UPSTREAM_PORT};
};

Router.prototype.on = function(event,callback) {
    that.ee.on(event, callback);   
}

Router.prototype.listen = function(port) {
    this.server.listen(port);
};

exports.createRouter = function() {
    return new Router(); 
}; 
