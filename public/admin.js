YUI().use('node-base', function(Y) {
 
    Y.on("click", function(e) {
        var host = Y.one('#host').get('value');
        if (host.indexOf('http://') === 0) {
            host = host.substring(7);
        }
        if (host.indexOf('/') !== -1) {
            host = host.substring(0,host.length-1);
        }
        hosts.push(host);
        Y.one('#host').set('value', ''); 
        Y.one('#hostnames').append('<li>' + host + '*</li>');

        Y.one("#save").append("<form action='" + roothost + "/updatehosts' method='POST'><input type='submit' id='savebtn' value='Save changes'><input type='hidden' value='" + hosts + "' name='hosts'></form>");

    }, '#addhost');


});




