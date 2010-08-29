YUI.add("threel-base", function (Y) {
    Y.namespace("ThreeL");
    Y.augment(Y.ThreeL, Y.EventTarget);

    var socket = new WebSocket("ws://" + window.location.hostname + ":8081");

    socket.onmessage = function (ev) {
        Y.ThreeL.fire("socket:json", Y.JSON.parse(ev.data));
    };

    Y.ThreeL.on("hostname", function (host) {
        Y.one("#hostname").setContent(host);
    });

    Y.ThreeL.on("socket:json", function (d) {
        d = d.req || d.res;
        d = d.pop();
        if (d.origin) Y.ThreeL.fire("hostname", d.origin);
    });

    // transaction store
    var txns = {};
    Y.ThreeL.txns = txns;

}, "0.0.1", { requires : [
    "json",
    "node",
    "event-custom"
]});
