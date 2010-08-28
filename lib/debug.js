exports.log = function (v) {
    var sys = require("sys");
    sys.debug(sys.inspect(v));
};
