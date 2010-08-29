// Configuration management

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var sys = require('sys');

// Base object for all configuration crap
//
// Implementations deal with serializing / de-serializing the
// map itself.
var Config = function(proxyMap) {
    var self = this;

    // Get a list of all proxies that we're managing
    self.getProxyNames = function() {
        return Object.keys(proxyMap);
    };

    // Do we have any configuration information for the given host?
    self.proxyExists = function(proxy) {
        return (proxy in proxyMap);
    };

    // Remove the given host from our database
    self.removeProxy = function(proxy) {
        delete proxyMap[proxy];

        self.writeConfig();
    };

    // Modify the proxy:hosts mapping in-place
    self.setOriginsForProxy = function(proxy, hosts) {
        var po = proxyMap[proxy] || {
            'hosts' : [],
            'rules' : {}
        };
        po.hosts = hosts;
        proxyMap[proxy] = po;

        self.writeConfig();
    };

    // Get the set of hosts that a given proxy maps to, or an
    // empty array if we don't know about the proxy
    self.getOriginsForProxy = function(proxy) {
        return (proxy in proxyMap) ?
            proxyMap[proxy].hosts :
            [];
    };

    // Add a proxy rule of the given type
    self.addProxyRule = function(proxy, type, id, content) {
        var po = proxyMap[proxy];

        if (!(type in po.rules)) {
            po.rules[type] = [];
        }

        po.rules[type].push({
            id : id,
            content : content
        });

        self.writeConfig();
    };

    // Get a list of proxy rule IDs
    self.getProxyRuleIDs = function(proxy, type) {
        var po = proxyMap[proxy];

        if (!(type in po.rules)) {
            return [];
        }

        var ids = [];
        po.rules[type].forEach(function(r) {
            ids.push(r.id);
        });

        return ids;
    };

    // Remove a proxy rule of the given type and ID
    self.removeProxyRuleByID = function(proxy, type, id) {
        var po = proxyMap[proxy];
        if(!(type in po.rules)) {
            return;
        }

        for (var i = 0; i < po.rules[type].length; i++) {
            if (po.rules[type][i].id !== id) {
                continue;
            }

            po.rules[type].splice(i, 1);
            break;
        }

        self.writeConfig();
    };
};

// Config object that keeps its data in-memory only
var MemoryConfig = function() {
    var self = this;
    var proxyMap = {};

    Config.call(this, proxyMap);

    self.readConfig = function() {
    };

    self.writeConfig = function() {
    };

    self.reloadConfig = function() {
        for (proxyName in proxyMap) {
            delete proxyMap[proxyName];
        }
    };
};
sys.inherits(MemoryConfig, Config);

// Config object that keeps its data on-disk
var DiskConfig = function(dirPath) {
    var self = this;
    var proxyMap = {};

    Config.call(this, proxyMap);

    // Synchronously read the configuration from disk
    self.readConfig = function() {
        var cfg = {};

        fs.readdirSync(dirPath).forEach(function(fn) {
            if (!fn.match(/\.json$/)) {
                return;
            }

            var pn = fn.substring(0, fn.length - 5);
            cfg[pn] = JSON.parse(
                fs.readFileSync(path.join(dirPath, fn))
            );
        });

        return cfg;
    };

    // Synchronously write the configuration data to disk
    self.writeConfig = function(cfg) {
        fs.readdirSync(dirPath).forEach(function(fn) {
            if (!fn.match(/\.json$/)) {
                return;
            }

            fs.unlinkSync(path.join(dirPath, fn));
        });

        for (proxyName in proxyMap) {
            fs.writeFileSync(
                path.join(dirPath, proxyName) + '.json',
                JSON.stringify(proxyMap[proxyName]) + '\n'
            );
        }
    };

    // Synchronously reload the configuration from disk
    //
    // This method exists to overwrite the existing proxyMap
    // in-place, as we can't change its instance without
    // breaking the methods in our superclass.
    self.reloadConfig = function() {
        var cfg = self.readConfig();
        for (proxyName in proxyMap) {
            delete proxyMap[proxyName];
        }

        for (proxyName in cfg) {
            proxyMap[proxyName] = cfg[proxyName];
        }
    };

    self.reloadConfig();
};
sys.inherits(DiskConfig, Config);

// Create a new Config object
var createRouterConfig = function() {
    var dirPath = process.env['3L_DB_PATH'] ||
        path.join(__dirname, '..', 'db');

    return new DiskConfig(dirPath);
};
exports.createRouterConfig = createRouterConfig;

//hard IP blocking rules
var HardIpBlockConfig = function() {
    var that = this;

    this.ipList = {};
};

//soft IP blocking rules
var SoftIpBlockConfig = function() {
   var that = this;
   
   this.ipList = {};    
};

//throttle rules
var ThrottleConfig = function() {
   var that = this;

   this.ipList = {};
}
