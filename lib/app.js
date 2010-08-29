var d = require("./debug").log;
var sys = require('sys');

function boot (port) {

    var express = require("express");
    var connect = require("connect");
    var http = require('http');

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
        var client = http.createClient('8081', 'ko-3-2-1.no.de'); 
        var req = client.request('GET', '/', {host:'ko-3-2-1.no.de'});
        var data = "";
        var render = function() {
            res.render("admin", {
                locals: {'data': eval(data)} 
            });
        };
        req.on('response', function(response) {
           response.on('data', function(chunk) {
               data += chunk;
           });
           response.on('end', render); 
        });
        req.end();

    });

    app.get("/admin/:host", function(req, res) {
       var host = req.params.host;
       var client = http.createClient('8081', 'ko-3-2-1.no.de'); 
       var req = client.request('GET', '/'+host+'/hosts', {host:'ko-3-2-1.no.de'});
       var data = "";
       var render = function() {
           res.render("hostadmin", {
               locals: {'data': eval(data), 'host': host, scripts:["/public/admin.js"], rawData: data}
           }); 
       };
       req.on('response', function(response) {
           response.on('data', function(chunk) {
               data += chunk;
           });
           response.on('end', render); 
        });
        req.end();
    });

    //put hosts to the api
    app.post("/admin/:host/updatehosts", function(req, res) {
        var host = req.params.host;
        var client = http.createClient('8081', 'ko-3-2-1.no.de'); 
        var clientReq = client.request('PUT', '/'+host+'/hosts', {host:'ko-3-2-1.no.de', 'content-type': 'application/x-www-form-urlencoded'});
        var data = "";
        var render = function() {
            res.redirect("/admin/" + host, 302);
        }; 
        
        clientReq.on('response', function(response) {
            response.on('data', function(chunk) {
                data += chunk;
            });
            response.on('end', render); 
         });
         var body = 'hosts=' + req.body.hosts;
         clientReq.write(body); 
         clientReq.end();

    });

    //put rules to the api
    app.get("/admin/:host/updaterules", function(req, res) {

    });

    app.get("/favicon.ico", function (req, res) {
        res.redirect("/public/favicon.ico");
    });

    app.listen(port);

}

exports.boot = boot;
