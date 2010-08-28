function boot (port) {

    var app = require("express").createServer();

    app.get("/", function (req, res) {
        res.send("Yay frontend!");
    });

    app.listen(port);

}

exports.boot = boot;
