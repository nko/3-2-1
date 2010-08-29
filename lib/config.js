// Configuration management

var assert = require('assert');

var Config = function() {
    var self = this;

    // Map of hosts to sets of IPs
    var hostMap = {};

    // Get the set of IPs that a given host maps to, or an
    // empty array if we don't know about the host
    self.getIPsForHost = function(host) {
        return (host in hostMap) ?
            hostMap[host] :
            [];
    };

    // Modify the host:IPs mapping in-place
    self.setHostIPMapping = function(host, ips) {
        hostMap[host] = ips;
    };

    // Get a list of all hosts that we're managing
    self.getHosts = function() {
        return Object.keys(hostMap);
    };

    // Do we have any configuration information for the given host?
    self.hostExists = function(host) {
        return (host in hostMap);
    };

    // Remove the given host from our database
    self.removeHost = function(host) {
        return (delete hostMap[host]);
    };
};

// Create a new Config object
var createConfig = function() {
    return new Config();
};
exports.createConfig = createConfig;
