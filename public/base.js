YUI.add("threel-base", function (Y) {
    Y.namespace("ThreeL");
    Y.augment(Y.ThreeL, Y.EventTarget);

    var socket = new WebSocket("ws://" + window.location.hostname + ":8081");

    socket.onmessage = function (ev) {
        Y.ThreeL.fire("socket:json", Y.JSON.parse(ev.data));
    };

    // transaction store
    var txns = {};
    Y.ThreeL.txns = txns;

}, "0.0.1", { requires : [
    "json",
    "event-custom"
]});
