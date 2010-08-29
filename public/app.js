YUI().use("json", function (Y) {

    var series = new TimeSeries();

    var socket = new WebSocket("ws://localhost:8081");

    socket.onmessage = function (ev) {
        var d = ev.data;
        console.log(d);
        d = Y.JSON.parse(d);
        console.log(d);
        d = d.req || d.res;
        d = d.pop();
        series.append(d.time, d.size);
    };

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

    chart.addTimeSeries(series, {
        strokeStyle : "rgba(255, 0, 0, 1)",
        fillStyle : "rgba(255, 0, 0, 0.2)",
        lineWidth: 3
    });

    chart.streamTo(document.getElementById("realtime"), 200);

});
