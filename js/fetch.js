const wsURL = "wss://bcl666.live:5278/eew";
let ws;

const API_KEY = "";

function connectWebSocket() {
  ws = new WebSocket(wsURL);
  ws.addEventListener("open", function (event) {
    console.log("WebSocket connected");
    sendWebSocketMessage({ type: "region", token: API_KEY });
    sendWebSocketMessage({ type: "eew", token: API_KEY });
    sendWebSocketMessage({ type: "rts", token: API_KEY });
    sendWebSocketMessage({ type: "report", token: API_KEY });
    sendWebSocketMessage({ type: "station", token: API_KEY });
  });

  ws.addEventListener("error", function (event) {
    console.error("WebSocket error:", event);
  });

  ws.addEventListener("message", function (event) {
    const e = event.data;
    const data = JSON.parse(e);
    switch (data.t) {
      case "region":
        global.region = data;
        break;
      case "rts":
        RTSRequest(data);
        break;
      case "report":
        news(reportFormat(data));
        break;
      case "station":
        $(".station_1_shindo").text(`，實測震度：0，距離震央：-km`);
        $(".station_2_shindo").text(`，實測震度：0，距離震央：-km`);
        global.station = station_exec(data);
        SelectStation();
        break;
      case "forbidden":
        alert("錯誤的金鑰");
        break;
      default:
        EEWRequest(data);
        break;
    }
  });

  ws.addEventListener("close", function (event) {
    console.log("WebSocket connection closed. Reconnecting...");
    setTimeout(connectWebSocket, 2000);
  });
}
connectWebSocket();

function sendWebSocketMessage(t) {
  const json = JSON.stringify(t);
  const encodedData = btoa(unescape(encodeURIComponent(json)));
  if (ws.readyState == WebSocket.OPEN) {
    ws.send(encodedData);
  } else {
    console.error("WebSocket is not connection yet.");
  }
}

function reportFormat(data) {
  global.report.message = "";
  const loc = data.loc;
  const dep = data.depth;
  const mag = data.mag;
  const time = formatTimestamp(data.time);
  const list = data.list;

  for (const city in list) {
    if (list.hasOwnProperty(city)) {
      global.report.message += `${city}：`;
      const townObject = list[city].town;
      for (const town in townObject) {
        if (townObject.hasOwnProperty(town)) {
          const townDetails = townObject[town];
          global.report.message += `${town}${townDetails.int}級、`;
        }
      }
      global.report.message = global.report.message.slice(0, -1);
      global.report.message += "。";
    }
  }

  return `臺灣時間${time}左右發生規模${mag}地震，震央位於${loc}，深度${dep}公里，各地震度『${global.report.message}』，更多詳細的地震資訊請參閱中央氣象署網站。`;
}

function addStyle(endPosition) {
  $("#eew_style").remove();
  const style = $("<style>").attr("id", "eew_style").html(`
            @keyframes scroll {
                from {
                    transform: translateX(100%);
                }
                to {
                    transform: translateX(${endPosition}px);
                }
            }
        `);
  $("head").append(style);
}

function EEWRequest(data) {
  on_eew(data);
}

function RTSRequest(data) {
  on_rts_data(data);
}
