var http = require('http'),
    sys = require('sys');


var PORT = 80;
//should not start with http
var UPSTREAM_HOST = 'www.cs.brown.edu'
var UPSTREAM_PORT = 80;

//upstream host and port for this host/port combination
var findUpstream = function(host, port) {
    return {host: UPSTREAM_HOST, port: UPSTREAM_PORT};
};

var server = http.createServer(function(req,res) {
    //log request
    //console.log(sys.inspect(req));
    console.log(req.headers.host + ' : ' + req.url);

    var upstream = findUpstream(req.host, req.port);
    var client = http.createClient(upstream.port, upstream.host);
    //assuming GET for basic case not passing headers yet
    var request = client.request('GET', req.url, req.headers);
    request.on('response', function(response) {
        res.writeHead(response.statusCode, response.headers);
         
        //write any chunks of data back to the client
        response.on('data', function(chunk) {
            res.write(chunk);
        });

        //when the upstream response closes close the downstream response
        response.on('end', function() {
            res.end();
        });
    });
    request.end();
});

server.listen(PORT);


