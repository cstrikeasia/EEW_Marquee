function SelectStation() {
  const Station1Select = $(".station_1");
  const Station2Select = $(".station_2");

  const sortedKeys = Object.keys(global.station).sort((a, b) => {
    const uuidA = global.station[a].uuid.split("-")[1];
    const uuidB = global.station[b].uuid.split("-")[1];
    return uuidA.localeCompare(uuidB);
  });

  sortedKeys.forEach((key) => {
    const stations = global.station[key];

    if (key == "13379360") {
      stations.Loc = "重慶市 北碚區";
    } else if (key == "7735548") {
      stations.Loc = "南楊州市 和道邑";
    }

    const lastThreeKeys = key.slice(-3);
    const option = $("<option>")
      .val(stations.uuid)
      .text(`${stations.Loc} (${lastThreeKeys})`);
    Station1Select.append(option.clone());
    Station2Select.append(option);
  });

  const rts1 = sessionStorage.getItem("rts1");
  if (rts1) {
    Station1Select.val(rts1);
    global.setting.rts1 = rts1;
  }

  const rts2 = sessionStorage.getItem("rts2");
  if (rts2) {
    Station2Select.val(rts2);
    global.setting.rts2 = rts2;
  }

  $(document).on("change", Station1Select, function () {
    const SelectedStation = Station1Select.val();
    global.setting.rts1 = SelectedStation;
    sessionStorage.setItem("rts1", SelectedStation);
  });

  $(document).on("change", Station2Select, function () {
    const SelectedStation = Station2Select.val();
    global.setting.rts2 = SelectedStation;
    sessionStorage.setItem("rts2", SelectedStation);
  });
}

function station_exec(station_data) {
  let stations = {};
  for (
    let k = 0, k_ks = Object.keys(station_data), n = k_ks.length;
    k < n;
    k++
  ) {
    const station_id = k_ks[k];
    const station_ = station_data[station_id];
    const station_net = station_.net == "MS-Net" ? "H" : "L";

    let station_new_id = "";
    let station_code = "000";
    let Loc = "";
    let area = "";
    let Lat = 0;
    let Long = 0;

    if (station_ !== "station") {
      let latest = station_.info[0];

      if (station_.info.length > 1)
        for (let i = 1; i < station_.info.length; i++) {
          const currentTime = new Date(station_.info[i].time);
          const latestTime = new Date(latest.time);

          if (currentTime > latestTime) latest = station_.info[i];
        }

      if (global.region) {
        for (
          let i = 0, ks = Object.keys(global.region), j = ks.length;
          i < j;
          i++
        ) {
          const reg_id = ks[i];
          const reg = global.region[reg_id];

          for (
            let r = 0, r_ks = Object.keys(reg), l = r_ks.length;
            r < l;
            r++
          ) {
            const ion_id = r_ks[r];
            const ion = reg[ion_id];

            if (ion.code == latest.code) {
              station_code = latest.code.toString();
              Loc = `${reg_id} ${ion_id}`;
              area = ion.area;
              Lat = latest.lat;
              Long = latest.lon;
            }
          }
        }
        station_new_id = `${station_net}-${station_code}-${station_id}`;
        stations[station_id] = { uuid: station_new_id, Lat, Long, Loc, area };
      }
    }
  }
  return stations;
}

function on_rts_data(data) {
  data.Alert = Object.keys(global.detection_list).length !== 0;
  const detection_location = data.area ?? [];

  global.rts_station_init.rts1.loc = " - - -  - - ";
  global.rts_station_init.rts1.intensity = "--";
  global.rts_station_init.rts1.pga = "--";

  global.rts_station_init.rts2.loc = " - - -  - - ";
  global.rts_station_init.rts2.intensity = "--";
  global.rts_station_init.rts2.pga = "--";

  global.max_pga = 0;
  global.max_intensity = 0;
  global.rts_intensity_number = 0;

  global.detection_list = data.box ?? {};

  for (const key of Object.keys(global.detection_list)) {
    if (global.max_intensity < global.detection_list[key]) {
      global.max_intensity = global.detection_list[key];
    }
  }

  if (data.station) {
    for (const station_id of Object.keys(data.station)) {
      if (!global.station[station_id]) {
        continue;
      }

      const info = global.station[station_id];
      const station_data = data.station[station_id];
      const intensity = intensity_float_to_int(station_data.i);
      if (data.Alert) {
        if (station_data.alert && station_data.pga > global.max_pga) {
          global.max_pga = station_data.pga;
        }
      } else if (station_data.pga > global.max_pga) {
        global.max_pga = station_data.pga;
      }

      //測站1
      if (global.setting.rts1.includes(info.uuid)) {
        global.rts_station_init.rts1.loc = info.Loc;
        global.station_1.Lat = info.Lat;
        global.station_1.Lon = info.Long;
        global.rts_station_init.rts1.intensity = station_data.i;
        global.rts_intensity_number = intensity;
        global.rts_station_init.rts1.pga = station_data.pga;
      }

      //測站2
      if (global.setting.rts2.includes(info.uuid)) {
        global.rts_station_init.rts2.loc = info.Loc;
        global.station_2.Lat = info.Lat;
        global.station_2.Lon = info.Long;
        global.rts_station_init.rts2.intensity = station_data.i;
        global.rts_intensity_number = intensity;
        global.rts_station_init.rts2.pga = station_data.pga;
      }
    }
  }

  $(".location_intensity_1").text(
    `${global.rts_station_init.rts1.loc}，PGA：${global.rts_station_init.rts1.pga}gal`
  );

  $(".location_intensity_2").text(
    `${global.rts_station_init.rts2.loc}，PGA：${global.rts_station_init.rts2.pga}gal`
  );

  $(".max_gal").text(`最大加速度：${global.max_pga}gal`);
  $(".time").text(`${formatTimestamp(data.time)}`);
  $(".epic_intensity").text(
    `觀測最大震度：${int_to_intensity(global.max_intensity)}`
  );

  if (
    data.Alert &&
    global.max_intensity > global.rts.intensity &&
    global.rts.intensity != 10
  ) {
    const loc = detection_location[0] ?? "未知區域";
    if (global.max_intensity > 3) {
      global.rts.intensity = 10;
      notification = "🟥 強震檢測";
    } else if (global.max_intensity > 1) {
      global.rts.intensity = 3;
      notification = "🟨 震動檢測";
    } else {
      global.rts.intensity = 1;
      notification = "🟩 弱反應";
    }
    $(".notification").text(
      `[檢測]${notification} location:${loc}\n 最大加速度:${global.max_pga}\n 最大震度:${global.max_intensity}`
    );
  }
}
function on_eew(data) {
  if (data.type !== "eew-cwb") return;
  location_station_1_dist = `，距離震央：${
    Math.round(eew_location_info(data, "station_1").dist)
      ? Math.round(eew_location_info(data, "station_1").dist)
      : "-"
  }`;
  location_station_2_dist = `，距離震央：${
    Math.round(eew_location_info(data, "station_2").dist)
      ? Math.round(eew_location_info(data, "station_2").dist)
      : "-"
  }`;

  global.loc_shindo.s1 = `，實測震度：${
    global.intensity_list[
      Math.round(intensity_float_to_int(eew_location_info(data, "station_1").i))
    ] || 0
  }`;
  global.loc_shindo.s2 = `，實測震度：${
    global.intensity_list[
      Math.round(intensity_float_to_int(eew_location_info(data, "station_2").i))
    ] || 0
  }`;

  $(".station_1_shindo").text(
    `${global.loc_shindo.s1}${location_station_1_dist}km`
  );
  $(".station_2_shindo").text(
    `${global.loc_shindo.s2}${location_station_2_dist}km`
  );
  setTimeout(() => {
    $(".station_1_shindo").text(`，實測震度：0，距離震央：-km`);
    $(".station_2_shindo").text(`，實測震度：0，距離震央：-km`);
  }, 40000);
  eew(eew_msg);
}
