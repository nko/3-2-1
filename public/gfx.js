YUI.add("threel-gfx", function (Y) {

    var txns = Y.ThreeL.txns;

    // Smoothie

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

    function appendToSmoothie (d) {
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
    }

    Y.ThreeL.on("socket:json", function (d) {
        appendToSmoothie(d);
    });

    chart.streamTo(document.getElementById("realtime"), 200);

    // Raphael

    var paper = Raphael("traffic", 700, 500);

    var server = paper.circle(600, 50, 30);  

    // demo?!
    server.animate({
        cx : 700,
        r: 50
    }, 10000);

/*
    Y.on("socket:message", function (ev) {
        // ev.data is socket data
    });
*/

}, "0.0.1", { requires : [
    "threel-base"
]});