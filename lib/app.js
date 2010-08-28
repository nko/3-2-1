function boot () {

    var app = require("express").createServer();

    app.get("/", function (req, res) {
        res.send("Yay frontend!");
    });

    app.listen(8080);

}

exports.boot = boot;
