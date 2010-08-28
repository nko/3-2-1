var sys = require("sys");
function d (v) {
    sys.debug(sys.inspect(v));
}

function noop (){}

var EventEmitter = require("events").EventEmitter;

d(new EventEmitter);

function Foo () {
    this.ev = new EventEmitter();
    this.ev.on("foo", noop);
    this.ev.emit("foo");
}

Foo.prototype.getEmitter = function () {
    return this.ev;
}

var yay = new Foo();
d(yay.getEmitter());

d("LAST");

d(new Foo);
