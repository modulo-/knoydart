var chart;
var dataseries = {};

$(document).ready(function() {
    chart = new Highcharts.Chart({
        chart: {
            renderTo: 'chartContainer',
            defaultSeriesType: 'spline',
            events: {
                load: function(){updateChart(true)}
            }
        },
        title: {
            text: 'What happens in Knoydart...'
        },
        xAxis: {
            type: 'datetime'
//            tickPixelInterval: 150,
//            maxZoom: 20 * 1000
        },
        yAxis: [{
//            minPadding: 0.2,
//            maxPadding: 0.2,
            title: {
                text: 'Dam Level (mm)'
            },
            labels: {
                formatter: function() {
                    return this.value +' mm';
                }
            },
            opposite: true,
            min: 0,
            max: 2500
        }, {
//            minPadding: 0.2,
//            maxPadding: 0.2,
            title: {
                text: 'Power (KW)'
            },
            labels: {
                formatter: function() {
                    return this.value +' KW';
                }
            },
            min: 0,
            max: 250
        }],
        series: [{
            name: 'Dam Level',
            type: 'spline',
//            color: '#0000AA',
            marker: {
                enabled: false
            },
            yAxis: 0,
            data: []
        }, {
            name: 'Power Production',
            type: 'areaspline',
            color: '#00AA00',
            marker: {
                enabled: false
            },
            yAxis: 1,
            data: []
        }, {
            name: 'Power Consumption',
            type: 'areaspline',
            color: '#AA0000',
            marker: {
                enabled: false
            },
            yAxis: 1,
            data: []
        }],
        options: {updateSet: false}
    });

    dataseries["dam_lvl"] = chart.series[0];
    dataseries["pow_prod"] = chart.series[1];
    dataseries["pow_cons"] = chart.series[2];
});

var lastIndex = -1;
var maxDP = 50;
var batchDP = 10;
var updateInterval = 1000;
var fetchInterval = updateInterval*batchDP;
var data = [];
var schema = {};

var parseFetch = function (result) {
    result = JSON.parse(result);
    data = data.concat(result["data"]);
    var init = lastIndex == -1;

    if(init) {
        schema = result["schema"];
    }
    lastIndex = data[data.length-1][schema["id"]];

    if(init) {
        pushValues(true);
    }


    if (!chart.options.updateSet) {
        chart.options.updateSet = true;
        setInterval(function(){updateChart(false)}, fetchInterval);
        setInterval(function(){pushValues(false)}, updateInterval);
        updateChart(false);
    }
};

var pushValues = function (force) {
    force = (force === true);

    var row = data.shift();
    if (row === undefined) {
        chart.redraw();
        return;
    }

    var label;
    for (label in dataseries) {
        var shift = dataseries[label].data.length > maxDP;
        var point = {x: 1000*row[schema["datetime"]], y:row[schema[label]]};
        dataseries[label].addPoint(point, !force, shift, !force);
    }

    if (force) {
        pushValues(force);
    } else {
        chart.redraw();
    }

};

var updateChart = function (init) {
    var cnt = (init ? maxDP : batchDP);
    $.get("/api/v0/readings/chart/", {count:cnt, start:lastIndex}, parseFetch);
};

