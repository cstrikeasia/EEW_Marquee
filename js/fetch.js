const wsURL = "wss://bcl666.live:5278/eew";
let ws;

function connectWebSocket() {
    ws = new WebSocket(wsURL);
	const token = 'xxx';
    ws.addEventListener("open", function (event) {
        console.log("WebSocket connected");
        sendWebSocketMessage({ type: 'region', token: token });
        sendWebSocketMessage({ type: 'eew', token: token });
        sendWebSocketMessage({ type: 'rts', token: token });
        sendWebSocketMessage({ type: 'report', token: token });
        sendWebSocketMessage({ type: 'station', token: token });
    });

    ws.addEventListener("error", function (event) {
        console.error("WebSocket error:", event);
    });

    ws.addEventListener("message", function (event) {
        const e = event.data;
        const data = JSON.parse(e);
		
		switch(data.t){
			case 'region':
				region = data;
				break;
			case 'rts':
				RTSRequest(data);
				break;
			case 'report':
				news(reportFormat(data));
				break;
			case 'station':
				$('.station_1_shindo').text(`，實測震度：0，距離震央：-km`);
				$('.station_2_shindo').text(`，實測震度：0，距離震央：-km`);
				station = station_exec(data);
				SelectStation(station);
				break;
			case 'forbidden':
				alert('錯誤的金鑰');
				break;
			default:
				EEWRequest(data);
				break;
		}
    });

    ws.addEventListener("close", function(event) {
        console.log("WebSocket connection closed. Reconnecting...");
        setTimeout(connectWebSocket, 2000);
    });
}

connectWebSocket();

function sendWebSocketMessage(t) {
    const json = JSON.stringify(t);
    const encodedData = btoa(unescape(encodeURIComponent(json)));
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(encodedData);
    } else {
        console.error("WebSocket is not connection yet.");
    }
}

let Report_Info_Msg = '';
function reportFormat(data){
    const loc = data.loc;
    const dep = data.depth;
    const lat = data.lat;
    const lon = data.lon;
    const mag = data.mag;
    const time = formatTimestamp(data.time);
    const list = data.list;


    for (const city in list) {
        if (list.hasOwnProperty(city)) {
            Report_Info_Msg += `${city}：`;
            const townObject = list[city].town;
            for (const town in townObject) {
                if (townObject.hasOwnProperty(town)) {
                    const townDetails = townObject[town];
                    Report_Info_Msg += `${town}${townDetails.int}級、`;
                }
            }
            Report_Info_Msg = Report_Info_Msg.slice(0, -1);
            Report_Info_Msg += '。';
        }
    }

    let msg = `臺灣時間${time}左右發生規模${mag}地震，震央位於${loc}，深度${dep}公里，各地震度『${Report_Info_Msg}』，更多詳細的地震資訊請參閱中央氣象署網站。`;
	return msg;
}

function addStyle(endPosition) {
    $('#eew_style').remove();
    const style = $('<style>')
        .attr('id', 'eew_style')
        .html(`
            @keyframes scroll {
                from {
                    transform: translateX(100%);
                }
                to {
                    transform: translateX(${endPosition}px);
                }
            }
        `);
    $('head').append(style);
}

function EEWRequest(data) {
    const _now = new Date().getTime();
    for (const key in data) {
        if (Object.hasOwnProperty.call(data, key)) {
            const eew = data[key];
            console.log(eew);
            eew.time = _now;
            eew.type = "eew-cwb";
            get_data(eew, "http");
            console.log('eew', eew);
        }
    }
}

function RTSRequest(data) {
    on_rts_data(data);
}