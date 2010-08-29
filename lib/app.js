var d = require("./debug").log;

function boot (port) {

    var express = require("express");
    var connect = require("connect");

    var app = express.createServer();

    app.configure(function () {
        var public = __dirname + "/../public/";
        public = require("path").normalize(public);

        app.use("/", connect.logger());
        app.use("/", connect.bodyDecoder());

        app.use("/public", connect.staticProvider(public));
        app.use("/public", connect.compiler({
            src : public,
            enable : [ "sass" ]
        }));

        app.set("views", __dirname + "/views");
        app.set("view engine", "jade");
    });

    app.configure("development", function () {
        app.use("/", connect.errorHandler({
            dumpExceptions : true,
            showStack : true
        }));
    });

    app.configure("production", function () {
        app.use("/", connect.errorHandler());
    });

    app.get("/", function (req, res) {
        res.render("index", {
            locals : {
                scripts : [
                    "/public/smoothie.js",
                    "/public/raphael.js",
                    "/public/base.js",
                    "/public/gfx.js",
                    "/public/explore.js",
                    "/public/app.js"
                ]
            }
        });
    });

    app.get("/admin", function(req, res) {
        res.render("admin");
    });

    app.get("/favicon.ico", function (req, res) {
        res.redirect("/public/favicon.ico");
    });

    app.listen(port);

}

exports.boot = boot;
