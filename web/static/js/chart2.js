var chart;
var dataseries = {};
var apiURL = "/api/v0/";
var commentBox;
var comments = {};

var lastIndex = -1;
var maxDP = 30;
var batchDP = 10;
var updateInterval = 3000;
var granularity = 1;
var fetchInterval = updateInterval*batchDP;
var data = [];
var schema = {};


$(document).ready(function() {
    chart = new Highcharts.Chart({
        chart: {
            renderTo: 'chartContainer',
            defaultSeriesType: 'spline',
            events: {
                load: function(){updateChart(true)}
            },
            height: "400"
        },
        title: {
            text: 'What is happening in Knoydart?'
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
        plotOptions: {
            series: {
                cursor: 'pointer',
                point: {
                    events: {
                        click: function(){commentsHTML(this)}
                    }
                },
                marker: {
                    lineWidth: 1
                }
            }
        },
        series: [{
//            name: 'Dam Level',
//            type: 'spline',
////            color: '#0000AA',
//            marker: {
//                enabled: false
//            },
//            yAxis: 0,
//            data: []
//        }, {
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

//    dataseries["dam_lvl"] = chart.series[0];
    dataseries["pow_prod"] = chart.series[0];
    dataseries["pow_cons"] = chart.series[1];

//    dataseries["dam_lvl"].hide();
//    dataseries["pow_prod"].hide();
});

var parseFetch = function (result, init) {
    result = JSON.parse(result);
    data = data.concat(result["data"]);
    if (data.length <= 0) {
        return;
    }

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

    var shift = dataseries[Object.keys(dataseries)[0]].data.length >= maxDP;

    var row = data.shift();
    if (row === undefined) {
        chart.redraw();
        return;
    } else  {
        comments[row[schema['id']]] = {
            id: row[schema['id']],
            datetime_start: 1000 * row[schema['datetime_start']],
            datetime_end: 1000 * row[schema['datetime_end']],
            comments: row[schema['comments']],
            show: row[schema['comments']].length>0
        };
    }

    if (shift) {
        delete comments[Object.keys(comments)[0]];
    }

    var label;
    for (label in dataseries) {
        var point = row2point(row, label);
        dataseries[label].addPoint(point, !force, shift, !force);
    }

    printComments();

    if (force) {
        pushValues(force);
    } else {
        chart.redraw();
    }

};

var updateChart = function (init) {
    var cnt = (init ? maxDP : batchDP);

    if (init) {
        data = [];
        for (label in dataseries){
            dataseries[label].setData([]);
        }
    }

    $.get(apiURL+"readings/chart/", {count:cnt, start:lastIndex, granularity:granularity}, function(d){parseFetch(d, init)});
};

var row2point = function (row, label) {
    var point = {
        x: 1000 * row[schema['datetime_start']],
        y: row[schema[label]],
        id: row[schema['id']]
    };

    if (row[schema['comments']].length > 0) {
        point.marker = {
            enabled: true,
            radius: 6
        };
    }

    return point;
};

var commentsHTML = function(point) {
    var commentData = comments[point['id']];
    var from = new Date(commentData['datetime_start']).toDateString();
    var to = new Date(commentData['datetime_end']).toDateString();

    var title = "Comments for period " + from + " to " +  to;
    var contents = "";

    if (commentData.comments.length > 0) {
        for (var i = 0; i < commentData.comments.length; i++) {
            contents +=  '<div width="100%">' + commentData.comments[i]["text"] + '</div>';
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
            '   <input name="comment"/>' +
            '   <input type="hidden" name="datapoint_id" value="' + point.id + '"/>' +
            '   <input type="hidden" name="facebook_id" value="' + me.fb.id + '"/>' +
            '   <button  onClick="return saveComment(this)">Submit</button>' +
            '</form>' +
        '</div>';

    commentBox = $.fancybox({
        title: title,
        helpers:  {
            title : {
                type : 'float',
                position: 'top'
            }
        },
       content: contents
    });
};

var saveComment = function(button){
    var dataString = $('#commentForm').serialize();
    console.log(dataString);
    $.ajax({
        url: apiURL + 'comments/',
        type: 'PUT',
        data: dataString,
        success: function(result) {
            $.fancybox.close();
        }
    });

    return false;
};

var filterComments = function(){
    var filteredComments = {};

    for (i in comments) {
        if (comments[i].show) {
            filteredComments[i]=comments[i];
        }
    }

    return filteredComments;
};

var printComments = function(){
    var contents = "";
    var filteredComments = filterComments();

    for (dataPoint in filteredComments){
        var dp = filteredComments[dataPoint];
        var from = new Date(dp['datetime_start']).toDateString();
        var to = new Date(dp['datetime_end']).toDateString();

        var title = "Comments for period " + from + " to " +  to;
        var dpContents = '<div width="100%">' + title + '</div>';
        for (line in dp["comments"]) {
            if (dp["comments"][line]["fb_id"] == ''){
                dpContents += '<div width="100%"><b>' + dp["comments"][line]["text"] + '</b><br/>By:<i>' + dp["comments"][line]["author"] + '</i></div>'
            } else {
                dpContents += '<div width="100%"><b>' + dp["comments"][line]["text"] + '</b><br/>By:<img src="https://graph.facebook.com/'+dp["comments"][line]["fb_id"]+'/picture" /> <a href="https://facebook.com/'+dp["comments"][line]["fb_id"]+'">' + dp["comments"][line]["author"] + '</a></div>'
            }
        }
        contents += '<div width="100%" style="border: solid">' + dpContents + '</div>';

    }


    document.getElementById("commentContainer").innerHTML = contents;
};

var redrawChart = function(gran){
    lastIndex = 0;
    data = [];
    comments = [];
    granularity = gran;

    updateChart(true);
};