/**測試EEW**/
function eew_test() {
  const eew_data = {
    author: "cwa",
    id: "1130703",
    serial: 4,
    status: 1,
    final: 0,
    eq: {
      time: 1715327118000,
      lon: 121.8,
      lat: 24.24,
      depth: 10,
      mag: 8,
      loc: "花蓮縣北部外海",
      max: 5,
    },
    time: 1715441622570,
    type: "eew-cwb",
    replay_timestamp: 1715327118000,
    replay_time: 1715327140000,
    timestamp: null,
  };
  on_eew(eew_data, "websocket");
}
