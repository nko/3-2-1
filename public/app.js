YUI().use("json", function (Y) {

    var seriesStyle = (function () {
        function rgba (parts, opacity) {
            parts.push(opacity);
            return "rgba(" + parts.join(",") + ")";
        }

        return function () {
            var rnd = Math.round(Math.random() * 0xffffff);
            var color = [
                rnd >> 16,
                rnd >> 8 &  255,
                rnd & 255
            ];
            return {
                strokeStyle : rgba(color, "1"),
                // fillStyle : rgba(color, "0.2"),
                lineWidth : 1
            };
        }
    })();

    var chart = new SmoothieChart({
        millisPerPixel : 20,
        grid : {
            fillStyle : "#ffffff",
            strokeStyle : "#feb288",
            lineWidth : 1,
            millisPerLine : 200,
            verticalSections : 4
        }
    });

    var socket = new WebSocket("ws://" + window.location.hostname + ":8081");

    // transaction store
    var txns = {};

    socket.onmessage = function (ev) {
        var d = ev.data;

        d = Y.JSON.parse(d);
        d = d.req || d.res;
        d = d.pop();

        console.log(d);

        if (!(d.id in txns)) {
            var newSeries = new TimeSeries();
            txns[d.id] = {
                series : newSeries
            };
            chart.addTimeSeries(newSeries, seriesStyle());
        }

        var series = txns[d.id].series;
        var now = new Date().getTime();

        console.log(d.size);

        var size = d.size;
        if ("undefined" === typeof size) size = 0;
        size++;
        console.log(size);

        series.append(now, size);
    };

    chart.streamTo(document.getElementById("realtime"), 200);

});
