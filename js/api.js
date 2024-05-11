let last_get_data_time = Date.now();
let last_package_lost_time = 0;
let time_ntp = 0;
let time_local = 0;
let rts_replay_timestamp = 0;
let rts_replay_time = 0;
let palert_time = 0;

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
		lat  : 0,
		lon  : 0,
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
function eew_location_info(data) {
	// 計算震央與使用者位置之間的地表距離
	const dist_surface = dis(data.eq.lat, data.eq.lon, TREM.user.lat, TREM.user.lon);
	// 計算震央與使用者位置之間的三維距離
	const dist = Math.sqrt(pow(dist_surface) + pow(data.eq.depth));
	// 計算地震加速度
	const pga = 1.657 * Math.pow(Math.E, (1.533 * data.eq.mag)) * Math.pow(dist, -1.607) * (storage.getItem("site") ?? 1.751);
	// 轉換地震加速度為地震強度
	let i = pga_to_float(pga);
	// 如果地震強度大於3，則使用 eew_i 函數重新計算
	if (i > 3) {
		i = eew_i([data.eq.lat, data.eq.lon], [TREM.user.lat, TREM.user.lon], data.eq.depth, data.eq.mag);
	}
	// 返回計算結果
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
	// 計算震央距離
	const long = 10 ** (0.5 * magW - 1.85) / 2;
	const epicenterDistance = dis(epicenterLocaltion[0], epicenterLocaltion[1], pointLocaltion[0], pointLocaltion[1]);
	// 計算震源距離
	const hypocenterDistance = (depth ** 2 + epicenterDistance ** 2) ** 0.5 - long;
	const x = Math.max(hypocenterDistance, 3);
	// 計算 gpv600，即地震的 ground peak velocity (GPV) 在 600 公里處的預測值
	// 根據地震的震級 (magW)、深度 (depth) 和距離 (x) 等參數計算
	const gpv600 = 10 ** (
		// 地震震級 (magW) 對 GPV 的貢獻
		0.58 * magW +
		// 地震深度 (depth) 對 GPV 的貢獻
		0.0038 * depth - 1.29 -
		// 考慮震央距離 (x) 對 GPV 的調節
		Math.log10(x + 0.0028 * (10 ** (0.5 * magW))) -
		// 考慮震源距離 (x) 對 GPV 的調節
		0.002 * x
	);
	const arv = 1.0;
	// 計算 pgv400
	const pgv400 = gpv600 * 1.31;
	// 計算 pgv
	const pgv = pgv400 * arv;
	// 返回 Intensity
	return 2.68 + 1.72 * Math.log10(pgv);
}

function dis(latA, lngA, latB, lngB) {
	// 將經緯度轉換為弧度
	latA = latA * Math.PI / 180;
	lngA = lngA * Math.PI / 180;
	latB = latB * Math.PI / 180;
	lngB = lngB * Math.PI / 180;
	// 計算相應的 sin 和 cos 值
	const sin_latA = Math.sin(Math.atan(Math.tan(latA)));
	const sin_latB = Math.sin(Math.atan(Math.tan(latB)));
	const cos_latA = Math.cos(Math.atan(Math.tan(latA)));
	const cos_latB = Math.cos(Math.atan(Math.tan(latB)));
	// 計算兩點間距離
	return Math.acos(sin_latA * sin_latB + cos_latA * cos_latB * Math.cos(lngA - lngB)) * 6371.008;
}