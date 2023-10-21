"use strict";

var randomChartData = function randomChartData(n) {
    var data = [];

    for (var i = 0; i < n; i++) {
        data.push(Math.round(Math.random() * 100));
    }

    return data;
};

var chartColors = {
    "default": {
        primary: '#00D1B2',
        info: '#209CEE',
        danger: '#FF3860',
        light: '#FFEE35'
    }
};

var ctx = document.getElementById('big-line-chart').getContext('2d');

let chart = new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [{
            fill: false,
            borderColor: chartColors["default"].primary,
            borderWidth: 2,
            borderDash: [],
            borderDashOffset: 0.0,
            pointBackgroundColor: chartColors["default"].primary,
            pointBorderColor: 'rgba(255,255,255,0)',
            pointHoverBackgroundColor: chartColors["default"].primary,
            pointBorderWidth: 20,
            pointHoverRadius: 4,
            pointHoverBorderWidth: 15,
            pointRadius: 4,
            data: []
        }, {
            fill: false,
            borderColor: chartColors["default"].info,
            borderWidth: 2,
            borderDash: [],
            borderDashOffset: 0.0,
            pointBackgroundColor: chartColors["default"].info,
            pointBorderColor: 'rgba(255,255,255,0)',
            pointHoverBackgroundColor: chartColors["default"].info,
            pointBorderWidth: 20,
            pointHoverRadius: 4,
            pointHoverBorderWidth: 15,
            pointRadius: 4,
            data: []
        }],
        labels: []
    },
    options: {
        maintainAspectRatio: false,
        legend: {
            display: false
        },
        responsive: true,
        tooltips: {
            backgroundColor: '#f5f5f5',
            titleFontColor: '#333',
            bodyFontColor: '#666',
            bodySpacing: 4,
            xPadding: 12,
            mode: 'nearest',
            intersect: 0,
            position: 'nearest'
        },
        scales: {
            yAxes: [{
                barPercentage: 1.6,
                gridLines: {
                    drawBorder: false,
                    color: 'rgba(29,140,248,0.0)',
                    zeroLineColor: 'transparent'
                },
                ticks: {
                    padding: 20,
                    fontColor: '#9a9a9a'
                }
            }],
            xAxes: [{
                barPercentage: 1.6,
                gridLines: {
                    drawBorder: false,
                    color: 'rgba(225,78,202,0.1)',
                    zeroLineColor: 'transparent'
                },
                ticks: {
                    padding: 20,
                    fontColor: '#9a9a9a'
                }
            }]
        }
    }
});


var ctxLight = document.getElementById('light-line-chart').getContext('2d');
let chartLight = new Chart(ctxLight, {
    type: 'line',
    data: {
        datasets: [{
            fill: false,
            borderColor: chartColors["default"].light,
            borderWidth: 2,
            borderDash: [],
            borderDashOffset: 0.0,
            pointBackgroundColor: chartColors["default"].light,
            pointBorderColor: 'rgba(255,255,255,0)',
            pointHoverBackgroundColor: chartColors["default"].light,
            pointBorderWidth: 20,
            pointHoverRadius: 4,
            pointHoverBorderWidth: 15,
            pointRadius: 4,
            data: []
        }],
        labels: []
    },
    options: {
        maintainAspectRatio: false,
        legend: {
            display: false
        },
        responsive: true,
        tooltips: {
            backgroundColor: '#f5f5f5',
            titleFontColor: '#333',
            bodyFontColor: '#666',
            bodySpacing: 4,
            xPadding: 12,
            mode: 'nearest',
            intersect: 0,
            position: 'nearest'
        },
        scales: {
            yAxes: [{
                barPercentage: 1.6,
                gridLines: {
                    drawBorder: false,
                    color: 'rgba(29,140,248,0.0)',
                    zeroLineColor: 'transparent'
                },
                ticks: {
                    padding: 20,
                    fontColor: '#9a9a9a'
                }
            }],
            xAxes: [{
                barPercentage: 1.6,
                gridLines: {
                    drawBorder: false,
                    color: 'rgba(225,78,202,0.1)',
                    zeroLineColor: 'transparent'
                },
                ticks: {
                    padding: 20,
                    fontColor: '#9a9a9a'
                }
            }]
        }
    }
});