
      google.charts.load('current', {'packages':['corechart']});
      google.charts.setOnLoadCallback(drawChart);
      function drawChart() {
        var data = google.visualization.arrayToDataTable
            ([['X', 'Y', {'type': 'string', 'role': 'style'}],
              [1, 3, null],
              [2, 2.5, null],
              [3, 3, null],
              [4, 4, null],
              [5, 4, null],
              [6, 3, 'point { size: 18; shape-type: star; fill-color: #a52714; }'],
              [7, 2.5, null],
              [8, 3, null]
        ]);

        var options = {
          legend: 'none',
          hAxis: { minValue: 0, maxValue: 9 },
          curveType: 'function',
          pointSize: 7,
          dataOpacity: 0.3
        };

        var chart = new google.visualization.LineChart(document.getElementById('chart_div'));
        chart.draw(data, options);
    }
