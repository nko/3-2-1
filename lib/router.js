var http = require('http'),
    sys = require('sys');


var PORT = 80;
var UPSTREAM_HOST = 'localhost'
var UPSTREAM_PORT = 8080;

var server = http.createServer(function(req,res) {
    //log request
    //console.log(sys.inspect(req));
    console.log(req.headers.host + ' : ' + req.url);

    var client = http.createClient(UPSTREAM_PORT, UPSTREAM_HOST);
    //assuming GET for basic case not passing headers yet
    var request = client.request('GET', req.url, { host: req.headers.host });
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


