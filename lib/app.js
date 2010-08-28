function boot () {

    var connect = require("connect");

    var public = __dirname + "../public";

    var app = require("express").createServer(
        connect.staticProvider(public),
        connect.compiler({
            src : public,
            enable : [ "sass" ]
        })
    );

    app.set("views", __dirname + "/views");
    app.set("view engine", "jade");

    app.get("/", function (req, res) {
        res.render("index");
    });

    app.listen(8080);

}

exports.boot = boot;
