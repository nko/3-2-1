(function () {
      var dataSet1 = new TimeSeries(), dataSet2 = new TimeSeries(), dataSet3 = new TimeSeries();

      setInterval(function() {
        var now = new Date().getTime();
        dataSet1.append(now, Math.random());
        dataSet2.append(now, Math.random());
        dataSet3.append(now, Math.random());
      }, 200);

      // Build the timeline
      var smoothie = new SmoothieChart({ millisPerPixel: 20, grid: { fillStyle: "#ffffff", strokeStyle: '#feb288', lineWidth: 1, millisPerLine: 200, verticalSections: 4 }});
      smoothie.addTimeSeries(dataSet1, { strokeStyle: 'rgba(255, 0, 0, 1)', fillStyle: 'rgba(255, 0, 0, 0.2)', lineWidth: 3 });
      smoothie.addTimeSeries(dataSet2, { strokeStyle: 'rgba(0, 255, 0, 1)', fillStyle: 'rgba(0, 255, 0, 0.2)', lineWidth: 3 });
      smoothie.addTimeSeries(dataSet3, { strokeStyle: 'rgba(0, 0, 255, 1)', fillStyle: 'rgba(0, 0, 255, 0.2)', lineWidth: 3 });
      smoothie.streamTo(document.getElementById('realtime'), 200);

})();
