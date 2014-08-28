var chart;
var gauge, gaugePoint;
var dataseries = {};
var apiURL = "/api/v0/";
var commentBoxPoint;
var comments = {};

var maxDP = 144;
var batchDP = 10;

var lastIndex = -1;
var granularity = 600;
var history_offset = 24*60*60;

var updateInterval = 1*1000;
var fetchInterval = 6*1000;
var fetching;
var updating;
//var fetchInterval = updateInterval*batchDP;

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
            text: 'Knoydart Community Hydro Electric System:',
            style: {
                fontFamily: "'Open Sans', sans-serif",
                fontWeight: 600,
                fontSize: "25px",
                color: '#000'
            }
        },
        subtitle: {
            text: 'Live Data Feed',
            style: {
                fontWeight: 600,
                fontSize: "20px",
                color: '#000'
            }
        },
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
            },
            {
//            minPadding: 0.2,
//            maxPadding: 0.2,
                title: {
                    text: 'Rain Level (mm)'
                },
                labels: {
                    formatter: function () {
                        return this.value + ' mm';
                    }
                },
                opposite: true,
                min: 0,
                max: 5
            },
            {
//            minPadding: 0.2,
//            maxPadding: 0.2,
                title: {
                    text: 'Dam Flow (m3)'
                },
                labels: {
                    formatter: function () {
                        return this.value + ' m3';
                    }
                },
                opposite: true,
                min: 0,
                max: 50
            }
        ],
        plotOptions: {
            series: {
                cursor: 'pointer',
                marker: {
                    lineWidth: 1
                },
                point: {
                    events: {
                        click: function () {
                            commentsHTML(this)
                        }
                    }
                }
            }
        },
        series: [
            {
                name: 'Historical Power Consumption',
                type: 'spline',
                color: '#00AA00',
                marker: {
                    enabled: false
                },
                yAxis: 0,
                data: []
            },
            {
                name: 'Power Consumption',
                type: 'areaspline',
                color: '#AA0000',
                marker: {
                    enabled: false
                },
                yAxis: 0,
                data: []
            },
            {
                name: 'Dam Level',
                type: 'spline',
//            color: '#0000AA',
                marker: {
                    enabled: false
                },
                yAxis: 1,
                data: []
            },
            {
                name: 'Power - Active+Reactive',
                type: 'spline',
//            color: '#0000AA',
                marker: {
                    enabled: false
                },
                yAxis: 0,
                data: []
            },
            {
                name: 'Power - Apparent',
                type: 'spline',
//            color: '#0000AA',
                marker: {
                    enabled: false
                },
                yAxis: 0,
                data: []
            },
            {
                name: 'Power - Average',
                type: 'spline',
//            color: '#0000AA',
                marker: {
                    enabled: false
                },
                yAxis: 0,
                data: []
            },
            {
                name: 'Power - Active',
                type: 'spline',
//            color: '#0000AA',
                marker: {
                    enabled: false
                },
                yAxis: 0,
                data: []
            },
            {
                name: 'Rain',
                type: 'spline',
//            color: '#0000AA',
                marker: {
                    enabled: false
                },
                yAxis: 2,
                data: []
            },
            {
                name: 'Flow',
                type: 'spline',
//            color: '#0000AA',
                marker: {
                    enabled: false
                },
                yAxis: 3,
                data: []
            }
        ],
        options: {updateSet: false}
    });

    dataseries["pow_cons_hist"] = chart.series[0];
    dataseries["pow_cons"] = chart.series[1];
    dataseries["dam_lvl"] = chart.series[2];
    dataseries["pow_prod"] = chart.series[3];
    dataseries["pow_prod_app"] = chart.series[4];
    dataseries["pow_prod_avg"] = chart.series[5];
    dataseries["pow_prod_act"] = chart.series[6];
    dataseries["rain"] = chart.series[7];
    dataseries["flow"] = chart.series[8];

    dataseries["dam_lvl"].hide();
    dataseries["pow_prod"].hide();
    dataseries["pow_prod_app"].hide();
    dataseries["pow_prod_avg"].hide();
    dataseries["pow_prod_act"].hide();
    dataseries["rain"].hide();
    dataseries["flow"].hide();
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
//            fetching = setInterval(function(){updateChart(false)}, granularity*1000);
                updating = setInterval(function () {
                    pushValues(false)
                }, updateInterval);
                fetching = setInterval(function () {
                    redrawChart({})
                }, granularity * 1000);
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
        console.log(row);
        if (row === undefined) {
            chart.redraw();
//        updateChart();
            return;
        } else {
            comments[row[schema['id']]] = {
                id: row[schema['id']],
                datetime_start: 1000 * row[schema['datetime_start']],
                datetime_end: 1000 * row[schema['datetime_end']],
                comments: row[schema['comments']],
                show: row[schema['comments']].length > 0
            };
        }

        if (shift) {
            delete comments[Object.keys(comments)[0]];
        }

        for (var label in dataseries) {
            var point = row2point(row, label);
            dataseries[label].addPoint(point, !force, shift, !force);
        }

//    gaugePoint.update(Math.round(row[schema['pow_prod']]));

//    printComments();

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
            x: 1000 * (row[schema['datetime_start']] + 3 * 60 * 60),
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

    var commentsHTML = function (point) {
        var commentData = comments[point['id']];
        var from = new Date(commentData['datetime_start']).toDateString();
        var to = new Date(commentData['datetime_end']).toDateString();

        var title = "Comments for period " + from + " to " + to;
        var contents = "";

        if (commentData.comments.length > 0) {
            for (var i = 0; i < commentData.comments.length; i++) {
                contents += '<div width="100%">' + commentData.comments[i]["text"] + '<i> - ' + commentData.comments[i]["author"] + '</i></div>';
            }
        } else {
            contents = "No comments about this time available yet"
        }

        contents +=
            '<div width="100%">' +
            '<br/>' +
            '<form method="post" id="commentForm" action="">' +
            '   <label for="author">Your name</label>' +
            '   <input name="author" value="' + me.fb.name + '"/>' +
            '   <br/>' +
            '   <label for="comment">Enter a new comment</label>' +
            '   <br/>' +
            '   <input name="comment" maxlength="500" />' +
            '   <input type="hidden" name="datapoint_id" value="' + point.id + '"/>' +
            '   <input type="hidden" name="id" value="' + point.x + '"/>' +
            '   <input type="hidden" name="facebook_id" value="' + me.fb.id + '"/>' +
            '   <button  onClick="return saveComment(this)">Submit</button>' +
            '</form>' +
            '</div>';

        commentBoxPoint = point;
        $.fancybox({
            title: title,
            helpers: {
                title: {
                    type: 'float',
                    position: 'top'
                }
            },
            content: contents
        });
    };

    var saveComment = function (button) {
        var form = $('#commentForm');
        var dataString = form.serialize();
        var values = {};
        $.each($('#commentForm').serializeArray(), function (i, field) {
            values[field.name] = field.value;
        });
        var obj = {
            author: values.author,
            text: values.comment,
            fb_id: values.facebook_id
        };

        $.ajax({
            url: apiURL + 'comments/',
            type: 'PUT',
            data: dataString,
            success: function (result) {
                if (comments[values["datapoint_id"]] != undefined) {
                    comments[values["datapoint_id"]].comments.push(obj);
                }
                commentBoxPoint.update({marker: {
                    enabled: true,
                    radius: 6
                }});
                printComments();
                $.fancybox.close();
            }
        });

        return false;
    };

    var filterComments = function () {
        var filteredComments = {};
        var keys = Object.keys(comments).reverse();

        for (i in keys) {
            j = keys[i];
            if (comments[j].comments.length > 0) {
                filteredComments[j] = comments[j];
            }
        }

        return filteredComments;
    };

    var printComments = function () {
        var contents = "";
        var filteredComments = filterComments();

        for (dataPoint in filteredComments) {
            var dp = filteredComments[dataPoint];
            var dpContents = '';
            for (line in dp["comments"]) {
                dpContents += comment2div(dp["comments"][line], dp['datetime_start'], dp['datetime_end']);
            }
            contents += dpContents;

        }


        document.getElementById("commentContainer").innerHTML = contents;
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

//    oldestIndex -= maxDP*granularity;
        if (options.lastIndex != undefined) {
            lastIndex = options.lastIndex;
        }

        updateChart(true);
    };

    var comment2div = function (comment, dp_start, dp_end) {

        var from_d = new Date(dp_start).toDateString();
        var from_t = new Date(dp_start).toLocaleTimeString();
        var to = new Date(dp_end).toDateString();

        var html;
        var nameSpan;
        var nameDiv;
        var imgUrl;
        var imgDiv;
        var authorDiv;

        var textSpan = "<span style='width: 100%'>" + comment.text + "</span>";
        var timeSpan = "<span style='width: 100%'>" + from_t + "<br/>" + from_d + "</span>";

        if (comment["fb_id"] == '') {
            imgUrl = 'images/default-avatar.jpg';
            nameSpan = comment["author"];
        } else {
            imgUrl = '"https://graph.facebook.com/' + comment["fb_id"] + '/picture"';
            nameSpan = '<a href="https://facebook.com/' + comment["fb_id"] + '">' + comment["author"] + '</a>';
        }
        nameSpan = "<span style='font-weight: bold'>" + nameSpan + "</span>";
        nameDiv = "<div style='height:60px;display: block;float: left; margin-left: 5px'>" + nameSpan + '<br/>' + timeSpan + "</div>";
        imgDiv = '<div style="height:60px;width:60px; float: left"><img src=' + imgUrl + ' style="height:60px;width:60px;" /> </div>';

        authorDiv = "<div style='height:60px;float: left; background-color: #FAFBFC; margin: 0px 5px 5px 0px;'>" + imgDiv + nameDiv + "</div>";

        html = '<div style="width:100%;display: block; float: left;border-top-style: solid;border-color: lightgray;background-color: #F6F7F8">' + authorDiv + textSpan + '</div>';

        return html;
    };

