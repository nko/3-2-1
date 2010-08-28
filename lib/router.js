var http = require('http'),
    sys = require('sys');


var PORT = 80;

var server = http.createServer(function(req,res) {
    console.log(sys.inspect(req));
});

server.listen(PORT);


