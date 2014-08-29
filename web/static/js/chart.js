var chart;
var dataseries = {};
var apiURL = "/api/v0/";

var maxDP = 144;
var batchDP = 10;

var lastIndex = -1;
var granularity = 600;
var history_offset = 24*60*60;

var fetching;
var updating;

var data = [];
var schema = {};


$(document).ready(function() {
    Highcharts.setOptions({
        global: {
            useUTC: true,
            style: {
                fontFamily: "Open Sans",
                fontWeight: 600,
                color: '#000'
            }
        },
        chart: {
            style: {
                fontFamily: "Open Sans",
                fontWeight: 600,
                color: '#000'
            }
        },
        xAxis: {
            style: {
                fontFamily: "Open Sans",
                fontWeight: 600,
                color: '#000'
            }
        },
        yAxis: {
            style: {
                fontFamily: "Open Sans",
                fontWeight: 600,
                color: '#000'
            }
        },
        series: {
            style: {
                fontFamily: "Open Sans",
                fontWeight: 600,
                color: '#000'
            }
        },
        legend: {
            style: {
                fontFamily: "Open Sans",
                fontWeight: 600,
                color: '#000'
            }
        }
    });
    chart = new Highcharts.Chart({
        chart: {
            renderTo: 'chartContainer',
            defaultSeriesType: 'spline',
            events: {
                load: function () {
                    updateChart(true)
                }
            },
            height: "400"
        },
        title: {
            text: 'The Power of Knoydart',
            style: {
                fontFamily: "'Open Sans', sans-serif",
                fontWeight: 600,
                fontSize: "25px",
                color: '#000'
            }
        },
//        subtitle: {
//            text: 'Community Energy Live Data Feed',
//            style: {
//                fontWeight: 600,
//                fontSize: "20px",
//                color: '#000'
//            }
//        },
        xAxis: {
            type: 'datetime'
//            tickPixelInterval: 150,
//            maxZoom: 20 * 1000
        },
        yAxis: [
            {
//            minPadding: 0.2,
//            maxPadding: 0.2,
                title: {
                    text: 'Power (KW)'
                },
                labels: {
                    formatter: function () {
                        return this.value + ' KW';
                    }
                },
                min: 0,
                max: 250
            },
            {
//            minPadding: 0.2,
//            maxPadding: 0.2,
                title: {
                    text: 'Dam Level (mm)'
                },
                labels: {
                    formatter: function () {
                        return this.value + ' mm';
                    }
                },
                opposite: true,
                min: 0,
                max: 2500
            }
        ],
        plotOptions: {
            series: {
                cursor: 'pointer',
                marker: {
                    lineWidth: 1
                }
            }
        },
        series: [
            {
                name: 'Dam Level',
                type: 'spline',
                color: '#0A599F',
                marker: {
                    enabled: false
                },
                yAxis: 1,
                data: []
            },
            {
                name: 'Power demand',
                type: 'areaspline',
                color: '#0C8E08',
                marker: {
                    enabled: false
                },
                yAxis: 0,
                data: []
            }
        ],
        options: {updateSet: false}
    });

    dataseries["dam_lvl"] = chart.series[0];
    dataseries["pow_prod_app"] = chart.series[1];
    });

    var parseFetch = function (result, init) {
        result = JSON.parse(result);
        data = data.concat(result["data"].reverse());
        if (data.length <= 0) {
            return;
        }

        if (init) {
            schema = result["schema"];
        }
        lastIndex = data[data.length - 1][schema["datetime_end"]];

        if (init) {
            pushValues(true);
            console.log('init parse');
            if (!chart.options.updateSet) {
                console.log('setting');
                fetching = setInterval(function(){updateChart(false)}, granularity*1000);
                updating = setInterval(function () {
                    pushValues(false)
                }, granularity*1000);
//                fetching = setInterval(function () {
//                    redrawChart({})
//                }, granularity * 1000);
                chart.options.updateSet = true;
                updateChart(false);
            }
        }
    };

    var pushValues = function (force) {
        force = (force === true);

        var shift = false;
        for (var label in dataseries) {
            shift = shift || dataseries[label].data.length >= maxDP;
        }

        var row = data.shift();
        if (row === undefined) {
            chart.redraw();
            return;
        }

        for (var label in dataseries) {
            var point = row2point(row, label);
            dataseries[label].addPoint(point, !force, shift, !force);
        }

        if (force) {
            pushValues(force);
        } else {
            chart.redraw();
        }

    };

    var updateChart = function (init) {
        $("#compression_val").val(granularity);
        $("#dps_val").val(maxDP);
        $("#hist_offset_val").val(history_offset);

        var cnt = (init ? maxDP : batchDP);

        if (init) {
//        lastIndex = oldestIndex;
            lastIndex = -1;
            data = [];
            for (label in dataseries) {
                dataseries[label].setData([]);
            }
        }

        $.get(apiURL + "readings/chart/", {count: cnt, start: lastIndex, granularity: granularity, history_offset: history_offset}, function (d) {
            parseFetch(d, init)
        });
    };

    var row2point = function (row, label) {
        var point = {
            x: 1000 * (row[schema['datetime_start']] + 4 * 60 * 60),
            y: Math.round(row[schema[label]]),
            id: row[schema['id']]
        };

        if (row[schema['comments']].length > 0 && label == "pow_cons") {
            point.marker = {
                enabled: true,
                radius: 6
            };
        }

        return point;
    };

    var redrawChart = function (options) {
        clearInterval(fetching);
        clearInterval(updating);
        chart.options.updateSet = false;

        data = [];
        comments = [];

        if (options.compression != undefined) {
            granularity = options.compression;
        }
        if (options.points != undefined) {
            maxDP = options.points;
        }
        if (options.history_offset != undefined) {
            history_offset = options.history_offset;
        }

        if (options.lastIndex != undefined) {
            lastIndex = options.lastIndex;
        }

        updateChart(true);
    };