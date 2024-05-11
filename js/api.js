let last_get_data_time = Date.now();
let last_package_lost_time = 0;
let time_ntp = 0;
let time_local = 0;
let rts_replay_timestamp = 0;
let rts_replay_time = 0;
let palert_time = 0;
let _id = "";

let level_list = {};
const station_icon = {};
let detection_list = {};
let tw_lang_data = {};
let station = {};
let lang_data = {};
let eew_cache = [];
let data_cache = [];
let region;

let type_list = {
	time      : 0,
	http      : 0,
	websocket : 0,
};

const intensity_text = ["1級", "2級", "3級", "4級", "5弱", "5強", "6弱", "6強", "7級"];
const intensity_list = ["0", "1", "2", "3", "4", "5⁻", "5⁺", "6⁻", "6⁺", "7"];

let MAXPGA = { pga: 0, station: "NA", level: 0 };

let TREM = {
	Maps: {
		main: null,
	},
	EQ_list : {},
	Timers  : {},
	setting : {
		rts_station1: "",
		rts_station2: "",
	},
	audio     : [],
	rts_audio : {
		intensity : -1,
		pga       : 0,
	},
	alert          : false,
	eew            : false,
	arrive         : false,
	user_alert     : false,
	eew_info_clear : false,
	dist           : 0,
	Report         : {
		_markers      : [],
		_markersGroup : null,
	},
	user: {
		icon : null,
		station_1 : {
			Lat  : 0,
			Lon  : 0,
		},
		station_2 : {
			Lat  : 0,
			Lon  : 0,
		}
	},
	report_icon_list : {},
	size             : 0,
};

if (sessionStorage.getItem('rts_station1')) {
    TREM.setting.rts_station1 = sessionStorage.getItem('rts_station1');
} else {
	TREM.setting.rts_station1 = "L-235-13204180";
}

if (sessionStorage.getItem('rts_station2')) {
    TREM.setting.rts_station2 = sessionStorage.getItem('rts_station2');
} else {
	TREM.setting.rts_station2 = "L-235-13204180";
}

const storage = {
	init: () => {
		try {
			let json = JSON.parse(localStorage.Config);
			if (json.ver != ver) {
				json = { ver };
			}
			localStorage.Config = JSON.stringify(json);
			return json;
		} catch (err) {
			localStorage.Config = JSON.stringify({});
			return false;
		}
	},
	getItem: (key) => {
		try {
			const json = JSON.parse(localStorage.Config);
			return json[key];
		} catch (err) {
			return false;
		}
	},
	setItem: (key, value) => {
		try {
			const json = JSON.parse(localStorage.Config);
			json[key] = value;
			localStorage.Config = JSON.stringify(json);
			return true;
		} catch (err) {
			return false;
		}
	},
	getAll: () => {
		try {
			const json = JSON.parse(localStorage.Config);
			return json;
		} catch (err) {
			return false;
		}
	},
	removeItem: (key) => {
		try {
			const json = JSON.parse(localStorage.Config);
			delete json[key];
			localStorage.Config = JSON.stringify(json);
			return true;
		} catch (err) {
			return false;
		}
	},
	clear: () => {
		try {
			localStorage.Config = JSON.stringify({});
			return true;
		} catch (err) {
			return false;
		}
	},
};

function pga_to_float(pga) {
	return 2 * Math.log10(pga) + 0.7;
}

function now_time() {
	const utc = new Date();
	const now = new Date(utc.getTime() + utc.getTimezoneOffset() * 60000 + 28800000);
	return now.getTime();
}

function time_to_string(date) {
	const utc = new Date(date ?? now_time());
	const now = new Date(utc.getTime() + utc.getTimezoneOffset() * 60000 + 28800000);
	let _Now = now.getFullYear();
	_Now += "/";
	if ((now.getMonth() + 1) < 10) {
		_Now += "0" + (now.getMonth() + 1);
	} else {
		_Now += (now.getMonth() + 1);
	}
	_Now += "/";
	if (now.getDate() < 10) {
		_Now += "0" + now.getDate();
	} else {
		_Now += now.getDate();
	}
	_Now += " ";
	if (now.getHours() < 10) {
		_Now += "0" + now.getHours();
	} else {
		_Now += now.getHours();
	}
	_Now += ":";
	if (now.getMinutes() < 10) {
		_Now += "0" + now.getMinutes();
	} else {
		_Now += now.getMinutes();
	}
	_Now += ":";
	if (now.getSeconds() < 10) {
		_Now += "0" + now.getSeconds();
	} else {
		_Now += now.getSeconds();
	}
	return _Now;
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function Now() {
	return new Date(time_ntp + (Date.now() - time_local));
}

function get_lang_string(id) {
	return lang_data[id] ?? tw_lang_data[id] ?? "";
}

function int_to_intensity(int) {
	// 將地震強度的整數值轉換為對應的地震震度等級
	return intensity_list[int];
}

function intensity_float_to_int(float) {
	// 將地震強度的浮點值轉換為對應的地震強度整數值
	return (float < 0) ? 0 : (float < 4.5) ? Math.round(float) : (float < 5) ? 5 : (float < 5.5) ? 6 : (float < 6) ? 7 : (float < 6.5) ? 8 : 9;
}

let locinfo;
let dist;
let i;
function eew_location_info(data,t) {
	if(t === 'station_1'){
		locinfo = TREM.user.station_1;
	} else if(t === 'station_2'){
		locinfo = TREM.user.station_2;
	}

	const dist_surface = dis(data.eq.lat, data.eq.lon, locinfo.Lat, locinfo.Lon);
	const dist = Math.sqrt(pow(dist_surface) + pow(data.eq.depth));
	const pga = 1.657 * Math.pow(Math.E, (1.533 * data.eq.mag)) * Math.pow(dist, -1.607) * (storage.getItem("site") ?? 1.751);
	let i = pga_to_float(pga);
	if (i > 3) {
		i = eew_i([data.eq.lat, data.eq.lon], [locinfo.Lat, locinfo.Lon], data.eq.depth, data.eq.mag);
	}
	return {
		dist,
		i,
	};
}

function pow(int) {
	// 計算 int 的平方
	return Math.pow(int, 2);
}

function eew_i(epicenterLocaltion, pointLocaltion, depth, magW) {
	const long = 10 ** (0.5 * magW - 1.85) / 2;
	const epicenterDistance = dis(epicenterLocaltion[0], epicenterLocaltion[1], pointLocaltion[0], pointLocaltion[1]);
	const hypocenterDistance = (depth ** 2 + epicenterDistance ** 2) ** 0.5 - long;
	const x = Math.max(hypocenterDistance, 3);
	const gpv600 = 10 ** (
		0.58 * magW +
      0.0038 * depth - 1.29 -
      Math.log10(x + 0.0028 * (10 ** (0.5 * magW))) -
      0.002 * x
	);
	const arv = 1.0;
	const pgv400 = gpv600 * 1.31;
	const pgv = pgv400 * arv;
	return 2.68 + 1.72 * Math.log10(pgv);
}

function dis(latA, lngA, latB, lngB) {
	latA = latA * Math.PI / 180;
	lngA = lngA * Math.PI / 180;
	latB = latB * Math.PI / 180;
	lngB = lngB * Math.PI / 180;
	const sin_latA = Math.sin(Math.atan(Math.tan(latA)));
	const sin_latB = Math.sin(Math.atan(Math.tan(latB)));
	const cos_latA = Math.cos(Math.atan(Math.tan(latA)));
	const cos_latB = Math.cos(Math.atan(Math.tan(latB)));
	return Math.acos(sin_latA * sin_latB + cos_latA * cos_latB * Math.cos(lngA - lngB)) * 6371.008;
}