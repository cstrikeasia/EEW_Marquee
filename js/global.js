const global = {
  report: {
    message: "",
  },
  detection_list: {},
  tw_lang_data: {},
  station: {},
  region: {},
  intensity_list: ["0", "1", "2", "3", "4", "5⁻", "5⁺", "6⁻", "6⁺", "7"],
  station_1: {
    Lat: 0,
    Lon: 0,
  },
  station_2: {
    Lat: 0,
    Lon: 0,
  },
  setting: {
    rts1: "L-235-13204180",
    rts2: "L-235-13204180",
  },
  rts: {
    intensity: -1,
    pga: 0,
  },
  rts_station_init: {
    rts1: {
      loc: " - - -  - - ",
      pga: "--",
      intensity: "--",
    },
    rts2: {
      loc: " - - -  - - ",
      pga: "--",
      intensity: "--",
    },
  },
  rts_intensity_number: 0,
  max_pga: 0,
  max_intensity: 0,
  notification: "",
  loc_shindo: {
    s1: "",
    s2: "",
  },
  news_msg: "",
  ANIMATION_DURATION: 200,
  check_eew: false,
};
