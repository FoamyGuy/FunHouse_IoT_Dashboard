"use strict";

/* Aside: submenus toggle */
Array.from(document.getElementsByClassName('menu is-menu-main')).forEach(function (el) {
    Array.from(el.getElementsByClassName('has-dropdown-icon')).forEach(function (elA) {
        elA.addEventListener('click', function (e) {
            var dropdownIcon = e.currentTarget.getElementsByClassName('dropdown-icon')[0].getElementsByClassName('mdi')[0];
            e.currentTarget.parentNode.classList.toggle('is-active');
            dropdownIcon.classList.toggle('mdi-plus');
            dropdownIcon.classList.toggle('mdi-minus');
        });
    });
});
/* Aside Mobile toggle */

Array.from(document.getElementsByClassName('jb-aside-mobile-toggle')).forEach(function (el) {
    el.addEventListener('click', function (e) {
        var dropdownIcon = e.currentTarget.getElementsByClassName('icon')[0].getElementsByClassName('mdi')[0];
        document.documentElement.classList.toggle('has-aside-mobile-expanded');
        dropdownIcon.classList.toggle('mdi-forwardburger');
        dropdownIcon.classList.toggle('mdi-backburger');
    });
});
/* NavBar menu mobile toggle */

Array.from(document.getElementsByClassName('jb-navbar-menu-toggle')).forEach(function (el) {
    el.addEventListener('click', function (e) {
        var dropdownIcon = e.currentTarget.getElementsByClassName('icon')[0].getElementsByClassName('mdi')[0];
        document.getElementById(e.currentTarget.getAttribute('data-target')).classList.toggle('is-active');
        dropdownIcon.classList.toggle('mdi-dots-vertical');
        dropdownIcon.classList.toggle('mdi-close');
    });
});
/* Modal: open */

Array.from(document.getElementsByClassName('jb-modal')).forEach(function (el) {
    el.addEventListener('click', function (e) {
        var modalTarget = e.currentTarget.getAttribute('data-target');
        document.getElementById(modalTarget).classList.add('is-active');
        document.documentElement.classList.add('is-clipped');
    });
});
/* Modal: close */

Array.from(document.getElementsByClassName('jb-modal-close')).forEach(function (el) {
    el.addEventListener('click', function (e) {
        e.currentTarget.closest('.modal').classList.remove('is-active');
        document.documentElement.classList.remove('is-clipped');
    });
});
/* Notification dismiss */

Array.from(document.getElementsByClassName('jb-notification-dismiss')).forEach(function (el) {
    el.addEventListener('click', function (e) {
        e.currentTarget.closest('.notification').classList.add('is-hidden');
    });
});

let $tempTxt = document.querySelector("#temperature_value");
let $pressureTxt = document.querySelector("#pressure_value");
let $humidTxt = document.querySelector("#humidity_value");
let $lightTxt = document.querySelector("#light_value");

function incoming_ws_msg(event) {
    //console.log(event);
    let eventObj = JSON.parse(event.data);
    if (eventObj.hasOwnProperty("type")) {
        //console.log("has type");
        if (eventObj["type"] === "sensor_reading") {
            //console.log("is sensor_reading");

            if (eventObj["data"].hasOwnProperty("temperature")) {
                $tempTxt.innerText = eventObj["data"]["temperature"];
                chart.data.datasets[0].data.push(Number(eventObj["data"]["temperature"].split(" ")[0]));
            }

            if (eventObj["data"].hasOwnProperty("humidity")) {
                $humidTxt.innerText = eventObj["data"]["humidity"];
                chart.data.datasets[1].data.push(Number(eventObj["data"]["humidity"].split(" ")[0]));
            }

            if (eventObj["data"].hasOwnProperty("pressure")) {
                $pressureTxt.innerText = eventObj["data"]["pressure"];
                //chart.data.datasets[2].data.push(Number(eventObj["data"]["pressure"].split(" ")[0]))
            }


            if (eventObj["data"].hasOwnProperty("light")) {
                $lightTxt.innerText = eventObj["data"]["light"];
                //chart.data.datasets[3].data.push(Number(eventObj["data"]["light"].split(" ")[0]))
                chartLight.data.datasets[0].data.push(Number(eventObj["data"]["light"].split(" ")[0]));
                chartLight.data.labels.push("");

                if (chartLight.data.labels.length > 30) {
                    chartLight.data.labels.shift();
                    chartLight.data.datasets[0].data.shift();

                }

                chartLight.update();


            }

            chart.data.labels.push("");

            if (chart.data.labels.length > 30) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
                chart.data.datasets[1].data.shift();
            }


            chart.update()
        } else if (eventObj["type"] === "event") {
            //document.getElementById("event_table_body").append(eventObj["data"]["event_row_html"]);
            //document.getElementById("event_table_body").insertAdjacentHTML('afterbegin', eventObj["data"]["event_row_html"]);
            table.row.add($(eventObj["data"]["event_row_html"])).draw();
            applyDeleteClickListner();

        }
    }
}

function incoming_ws_error(event) {
    console.log(event);
}

function ws_closed(event) {
    console.log('WebSocket connection closed');
    //setTimeout(connect, 5000);
}

function connect() {
    var ws = new WebSocket('ws://' + location.host + '/connect-websocket');

    ws.onopen = () => console.log('WebSocket connection opened');
    ws.onclose = ws_closed;
    ws.onmessage = incoming_ws_msg;
    ws.onerror = incoming_ws_error;
}

// Hello
connect();


let table = $('#event_table').DataTable({
        "order": [[1, "desc"]]
    }
);

function applyDeleteClickListner() {
    $(".delete_btn").click(function () {
        console.log("clicked delete")
        table.row($(this).parents("tr")).remove().draw()
    });
}
