YUI.add("threel-gfx", function (Y) {

    var txns = Y.ThreeL.txns;

    // Smoothie

    function randomRGB () {
        var rnd = Math.round(Math.random() * 0xffffff);
        return [
            rnd >> 16,
            rnd >> 8 &  255,
            rnd & 255
        ];
    }

    var seriesStyle = (function () {
        function rgba (parts, opacity) {
            parts.push(opacity);
            return "rgba(" + parts.join(",") + ")";
        }

        return function (color) {
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
            millisPerLine : 500,
            verticalSections : 4
        }
    });

    function appendToSmoothie (d) {
        d = d.req || d.res;
        d = d.pop();

        console.log(d);

        if (!(d.id in txns)) {
            var newSeries = new TimeSeries();
            var color = randomRGB();
            Y.ThreeL.fire("txn:color", d.id, color);
            txns[d.id] = {
                rgb : color,
                series : newSeries
            };
            chart.addTimeSeries(newSeries, seriesStyle(color));
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

    chart.streamTo(document.getElementById("realtime"), 1000);

}, "0.0.1", { requires : [
    "threel-base"
]});
