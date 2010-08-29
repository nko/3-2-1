// Configuration management

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var sys = require('sys');

// Base object for all configuration crap
//
// Implementations deal with serializing / de-serializing the
// map itself.
var Config = function(hostMap) {
    var self = this;

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

        self.writeConfig();
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
        delete hostMap[host];

        self.writeConfig();
    };
};

// Config object that keeps its data in-memory only
var MemoryConfig = function() {
    var self = this;
    var hostMap = {};

    Config.call(this, hostMap);

    self.readConfig = function() {
    };

    self.writeConfig = function() {
    };

    self.reloadConfig = function() {
        for (hostName in hostMap) {
            delete hostMap[hostName];
        }
    };
};
sys.inherits(MemoryConfig, Config);

// Config object that keeps its data on-disk
var DiskConfig = function(dirPath) {
    var self = this;
    var hostMap = {};

    Config.call(this, hostMap);

    // Synchronously read the configuration from disk
    self.readConfig = function() {
        var cfg = {};

        fs.readdirSync(dirPath).forEach(function(fn) {
            if (!fn.match(/\.json$/)) {
                return;
            }

            var hn = fn.substring(0, fn.length - 5);
            cfg[hn] = JSON.parse(
                fs.readFileSync(path.join(dirPath, fn))
            );
        });

        return cfg;
    };

    // Synchronously write the configuration data to disk
    self.writeConfig = function(cfg) {
        for (hostName in hostMap) {
            fs.writeFileSync(
                path.join(dirPath, hostName) + '.json',
                JSON.stringify(hostMap[hostName]) + '\n'
            );
        }
    };

    // Synchronously reload the configuration from disk
    //
    // This method exists to overwrite the existing hostMap
    // in-place, as we can't change its instance without
    // breaking the methods in our superclass.
    self.reloadConfig = function() {
        var cfg = self.readConfig();
        for (hostName in hostMap) {
            delete hostMap[hostName];
        }

        for (hostName in cfg) {
            hostMap[hostName] = cfg[hostName];
        }
    };

    self.reloadConfig();
};
sys.inherits(DiskConfig, Config);

// Create a new Config object
var createConfig = function() {
    return new DiskConfig(
        path.join(__dirname, '..', 'db')
    );
};
exports.createConfig = createConfig;
