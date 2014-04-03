var chart = {};

window.onload = function () {
    chart = new CanvasJS.Chart("chartContainer",
        {
//            title : { text: "Fruits sold in First & Second Quarter" },
            axisX : {
                title: "Timeline",
                gridThickness: 1,
                interval:1,
                intervalType: "day",
        //        valueFormatString: "hh TT K",
                labelAngle: -30
             },
            axisY : {
                title: "Power",
                prefix: "",
                suffix: " kW",
                maximum: 200,
                minimum: 0
            },

            axisY2 : {
                title: "Dam Level",
                prefix: "",
                suffix: " mm",
                maximum: 2500,
                minimum: 500
            }
        }
    );

    chart.options.data = [];
    chart.options.data.push(dataseries["pow_prod"]);
    chart.options.data.push(dataseries["pow_cons"]);
    chart.options.data.push(dataseries["dam_lvl"]);

    chart.options.updateSet = false;

    updateChart(true);
};

var series1 = { //dataSeries - first quarter
    type: "splineArea",
    axisYType: "primary",
    xValueType: "dateTime",
    name: "Power production",
    showInLegend: true,
	color: "rgba(54,158,173,.7)",
	toolTipContent: "Production: {y} KW",
    markerType: "square",
    dataPoints: []
};

var series2 = { //dataSeries - second quarter
    type: "splineArea",
    axisYType: "primary",
    xValueType: "dateTime",
    name: "Power Consumption",
    showInLegend: true,
	color: "rgba(154,58,73,.7)",
	toolTipContent: "Consumption: {y} KW",
    markerType: "square",
    dataPoints: []
};

var series3 = { //dataSeries - second quarter
    type: "spline",
    axisYType: "secondary",
    xValueType: "dateTime",
    name: "Dam Level",
    showInLegend: true,
	color: "rgba(100,208,73,.7)",
	toolTipContent: "Water at {y} mm",
    markerType: "circle",
    dataPoints: []
};

var dataseries = {"pow_prod":series1, "pow_cons":series2, "dam_lvl":series3};

var lastIndex = -1;
var maxDP = 100;
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
    var row = data.shift();
    if (row === undefined) {
        chart.render();
        return;
    }

    for (var label in dataseries) {
        if (dataseries[label]["dataPoints"].length >= maxDP) {
            dataseries[label]["dataPoints"].shift();
        }
        dataseries[label]["dataPoints"].push({x: new Date(1000*row[schema["datetime"]]),y: row[schema[label]]});
    }

    if (force) {
        pushValues(force);
    } else {
        chart.render();
    }

};

var updateChart = function (init) {
    var cnt = (init ? maxDP : batchDP);

    $.get("/api/v0/readings/chart/", {count:cnt, start:lastIndex}, parseFetch);
};

