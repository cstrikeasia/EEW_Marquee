const map_style_v = storage.getItem("map_style") ?? "1";
const item_eew_level = storage.getItem("eew-level") ?? -1;
const speecd_use = storage.getItem("speecd_use") ?? false;
const item_audio_eew = storage.getItem("audio.EEW") ?? true;
const item_audio_update = storage.getItem("audio.update") ?? true;
const item_rts_level = storage.getItem("rts-level") ?? -1;
const item_audio_palert = storage.getItem("audio.palert") ?? true;
const item_audio_pga2 = storage.getItem("audio.PGA2") ?? true;
const item_audio_pga1 = storage.getItem("audio.PGA1") ?? true;

let eew_speech = {
	loc    : "",
	max    : -1,
	text   : "",
	module : "",
};
	

function SelectStation(station) {
    const Station1Select = $('.station_1');
    const Station2Select = $('.station_2');
    const sortedKeys = Object.keys(station).sort((a, b) => {
        const uuidA = station[a].uuid;
        const uuidB = station[b].uuid;
        return uuidA.localeCompare(uuidB);
    });
    
    sortedKeys.forEach(key => {
        const stations = station[key];

        if (key === '13379360') {
            stations.Loc = '重慶市 北碚區';
        } else if (key === '7735548') {
            stations.Loc = '南楊州市 和道邑';
        }
        
        const lastThreeKeys = key.slice(-3);
        const option = $('<option>').val(stations.uuid).text(`${stations.Loc} (${lastThreeKeys})`);
        Station1Select.append(option.clone());
        Station2Select.append(option);
    });

    const rts_station1 = sessionStorage.getItem('rts_station1');
    if (rts_station1) {
        Station1Select.val(rts_station1);
        TREM.setting.rts_station1 = rts_station1;
    }

    const rts_station2 = sessionStorage.getItem('rts_station2');
    if (rts_station2) {
        Station2Select.val(rts_station2);
        TREM.setting.rts_station2 = rts_station2;
    }

    $(document).on('change', Station1Select, function() {
        const SelectedStation = Station1Select.val();
        TREM.setting.rts_station1 = SelectedStation;
        sessionStorage.setItem('rts_station1', SelectedStation);
    });

    $(document).on('change', Station2Select, function() {
        const SelectedStation = Station2Select.val();
        TREM.setting.rts_station2 = SelectedStation;
        sessionStorage.setItem('rts_station2', SelectedStation);
    });
}

function GetLocationStation(uuid){
	const id = uuid.split('-')[2];
    const me = station[id];
    if (me) {
        const { Lat, Long } = me;
        return { Lat, Long };
    }
}

function station_exec(station_data) {
	let stations = {};
	for (let k = 0, k_ks = Object.keys(station_data), n = k_ks.length; k < n; k++) {
		const station_id = k_ks[k];
		const station_ = station_data[station_id];
		const station_net = station_.net === "MS-Net" ? "H" : "L";

		let station_new_id = "";
		let station_code = "000";
		let Loc = "";
		let area = "";
		let Lat = 0;
		let Long = 0;
		
		if(station_ !== 'station'){
			let latest = station_.info[0];

			if (station_.info.length > 1)
				for (let i = 1; i < station_.info.length; i++) {
					const currentTime = new Date(station_.info[i].time);
					const latestTime = new Date(latest.time);

					if (currentTime > latestTime)
						latest = station_.info[i];
				}

			if(region){
				for (let i = 0, ks = Object.keys(region), j = ks.length; i < j; i++) {
					const reg_id = ks[i];
					const reg = region[reg_id];

					for (let r = 0, r_ks = Object.keys(reg), l = r_ks.length; r < l; r++) {
						const ion_id = r_ks[r];
						const ion = reg[ion_id];

						if (ion.code === latest.code) {
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

let notification = '';
let location_station_1_shindo = '';
let location_station_2_shindo = '';
function on_rts_data(data) {
	data.Alert = (Object.keys(detection_list).length !== 0);
	MAXPGA = { pga: 0, station: "NA", level: 0 };
	
	const _now = Date.now();
	if (_now - last_get_data_time > 15000) {
		last_package_lost_time = _now;
	}
	last_get_data_time = _now;
	if (_now - last_package_lost_time > 30000) {
		last_package_lost_time = 0;
	}
	let target_count = 0;
	rts_lag = Math.abs(data.time - Now().getTime());
	let max_pga = 0;
	let max_intensity = 0;
	const detection_location = data.area ?? [];
	for (const key of Object.keys(station_icon)) {
		if (!data[key] || map_style_v == "3") {
			station_icon[key].remove();
			delete station_icon[key];
		}
	}
	let rts_sation_loc_1 = " - - -  - - ";
	let rts_sation_pga_1 = "--";
	let rts_sation_intensity_1 = "--";
	
	let rts_sation_loc_2 = " - - -  - - ";
	let rts_sation_pga_2 = "--";
	let rts_sation_intensity_2 = "--";
	
	let rts_sation_intensity_number = 0;
	
	detection_list = data.box ?? {};
	for (const key of Object.keys(detection_list)) {
		if (max_intensity < detection_list[key]) {
			max_intensity = detection_list[key];
		}
	}

	const list = Object.keys(TREM.EQ_list);
	
	if (data.station) {
		for (const station_id of Object.keys(data.station)) {
			if (station_icon[station_id]) {
				station_icon[uuid].setTooltipContent("");
			}
		}
		for (const station_id of Object.keys(data.station)) {
			if (!station[station_id]) {
				continue;
			}
			const info = station[station_id];
			const station_data = data.station[station_id];
			const intensity = intensity_float_to_int(station_data.i);
			if (data.Alert) {
				if (station_data.alert && station_data.pga > max_pga) {
					max_pga = station_data.pga;
				}
			} else if (station_data.pga > max_pga) {
				max_pga = station_data.pga;
			}
			let icon;
			if (data.Alert && station_data.alert) {
				if ((level_list[station_id] ?? 0) < station_data.pga) {
					level_list[station_id] = station_data.pga;
				}
				
				target_count++;
				if (map_style_v == "2" || map_style_v == "4") {
					let int = 2 * Math.log10(station_data.pga) + 0.7;
					int = Number((int).toFixed(1));
				} else
					if (intensity !== 0) {
						let _up = false;
						if (!pga_up_level[station_id] || pga_up_level[station_id] < station_data.pga) {
							pga_up_level[station_id] = station_data.pga;
							pga_up_timestamp[station_id] = now_time();
						}
						if (now_time() - (pga_up_timestamp[station_id] ?? 0) < 5000) {
							_up = true;
						}
					}
			}
			if (!station_data.alert) {
				delete level_list[station_id];
			}
			
			if (station_icon[station_id]) {
				if ((list.length && !station_data.alert && !(map_style_v == "2" || map_style_v == "4")) || TREM.report_time) {
					station_icon[station_id].getElement().style.visibility = "hidden";
				} else {
					station_icon[station_id].getElement().style.visibility = "";
				}
				station_icon[station_id].setZIndexOffset((intensity == 0) ? Math.round(station_data.pga + 5) : intensity * 10);
			}
			
			//測站1
			if (TREM.setting.rts_station1.includes(info.uuid)) {
				rts_sation_loc_1 = info.Loc;
				rts_sation_intensity_1 = station_data.i;
				rts_sation_intensity_number = intensity;
				rts_sation_pga_1 = station_data.pga;
			}
			
			//測站2
			if (TREM.setting.rts_station2.includes(info.uuid)) {
				rts_sation_loc_2 = info.Loc;
				rts_sation_intensity_2 = station_data.i;
				rts_sation_intensity_number = intensity;
				rts_sation_pga_2 = station_data.pga;
			}
		}
	}

	if (!data.Alert) {
		level_list = {};
	}
	
	TREM.user.station_1.Lat = GetLocationStation(TREM.setting.rts_station1).Lat;
	TREM.user.station_1.Lon = GetLocationStation(TREM.setting.rts_station1).Long;
	TREM.user.station_2.Lat = GetLocationStation(TREM.setting.rts_station2).Lat;
	TREM.user.station_2.Lon = GetLocationStation(TREM.setting.rts_station2).Long;
	
	location_station_1_shindo = `，實測震度：${Math.round(eew_location_info(data,'station_1').i) ? Math.round(eew_location_info(data,'station_1').i) : 0}`;
	location_station_2_shindo = `，實測震度：${Math.round(eew_location_info(data,'station_2').i) ? Math.round(eew_location_info(data,'station_2').i) : 0}`;
	
	$('.location_intensity_1').text(`測站1：${rts_sation_loc_1}，PGA：${get_lang_string("word.pga")} ${rts_sation_pga_1}，計測震度：${get_lang_string("word.intensity")}${rts_sation_intensity_1}${location_station_1_shindo}`);
	
	$('.location_intensity_2').text(`測站2：${rts_sation_loc_2}，PGA：${get_lang_string("word.pga")} ${rts_sation_pga_2}，計測震度：${get_lang_string("word.intensity")}${rts_sation_intensity_2}${location_station_2_shindo}`);
	
	$('.max_gal').text(`最大加速度：${max_pga} gal`);
	$('.time').text(`${formatTimestamp(data.time)}`);
	$('.epic_intensity').text(`觀測最大震度：${int_to_intensity(rts_sation_intensity_number)}`);


	let skip = false;
	if (max_intensity < item_rts_level) {
		skip = true;
	}
	
	if (data.eew) {
		if (!eew_alert_state) {
			eew_alert_state = true;
			TREM.audio.push("Warn");
			console.log("fa-solid fa-bell fa-2x info_icon", "#FF0080", "地震檢測", "#00EC00", "請留意 <b>中央氣象署</b><br>是否發布 <b>地震預警</b>");
			if (alert_timestamp && now_time() - alert_timestamp < 300_000) {
				console.log("fa-solid fa-triangle-exclamation fa-2x info_icon", "yellow", "不穩定", "#E800E8", "受到地震的影響<br>即時測站可能不穩定");
			}
			alert_timestamp = now_time();
		}
	} else {
		eew_alert_state = false;
	}
	
	if (data.Alert) {
		if (!skip && !rts_show) {
			rts_show = true;
		}
		if (max_intensity > TREM.rts_audio.intensity && TREM.rts_audio.intensity != 10) {
			const loc = detection_location[0] ?? "未知區域";
			if (max_intensity > 3) {
				TREM.rts_audio.intensity = 10;
				notification = '🟥 強震檢測';
			} else if (max_intensity > 1) {
				TREM.rts_audio.intensity = 3;
				notification = '🟨 震動檢測';
			} else {
				TREM.rts_audio.intensity = 1;
				notification = '🟩 弱反應';
			}
			$('.notification').text(`[檢測]${notification} location:${loc}\n 最大加速度:${max_pga}\n 最大震度:${max_intensity}`)
			if (!rts_tts) {
				rts_tts = true;
			}
		}
		if (max_pga > TREM.rts_audio.pga && TREM.rts_audio.pga <= 200) {
			if (max_pga > 200) {
				TREM.rts_audio.pga = 250;
				if (!skip && item_audio_pga2) {
					TREM.audio.push("PGA2");
				}
			} else if (max_pga > 8) {
				TREM.rts_audio.pga = 200;
				if (!skip && item_audio_pga1) {
					TREM.audio.push("PGA1");
				}
			}
		}
		if (!list.length) {
			let _text_1 = "";
			let _text_2 = "";
			let count = 0;
			for (let i = 0; i < detection_location.length; i++) {
				const loc = detection_location[i];
				if (count < 4) {
					_text_1 += `${loc}<br>`;
				} else {
					_text_2 += `${loc}<br>`;
				}
				count++;
			}
		}
	} else {
		$('.notification').text('');
		rts_tts = false;
		_max_intensity = 0;
		pga_up_level = {};
		pga_up_timestamp = {};
		rts_show = false;
		TREM.rts_audio.intensity = -1;
		TREM.rts_audio.pga = 0;
	}
	let level = 0;
	for (const station_id of Object.keys(level_list)) {
		level += level_list[station_id];
	}
	if (!rts_replay_timestamp) {
		if (data.investigate != undefined) {
			if (data.investigate > palert_level) {
				if (item_audio_palert) {
					TREM.audio.push("palert");
				}
				palert_level = data.investigate;
			}
			palert_time = _now;
		} else {
			palert_level = -1;
			if (palert_time && _now - palert_time > 600000) {
				palert_time = 0;
			}
		}
	}
}

function get_data(data, type = "websocket") {
	console.log('get_data',data);
	if (data.type != "trem-rts") {
		type_list.time = now_time();
		if (type == "websocket") {
			type_list.websocket = now_time();
		} else if (type == "http") {
			type_list.http = now_time();
		}
	}
	if (data.replay_timestamp) {
		if (data_cache.includes(data.replay_timestamp)) {
			return;
		} else {
			data_cache.push(data.replay_timestamp);
		}
	} else if (data.timestamp) {
		if (data_cache.includes(data.timestamp)) {
			return;
		} else {
			data_cache.push(data.timestamp);
		}
		if (Now().getTime() - data.timestamp > 10000) {
			return;
		}
	}
	if (data.id && data.number) {
		if (data_cache.includes(`${data.type}-${data.id}-${data.number}`)) {
			return;
		}
		data_cache.push(`${data.type}-${data.id}-${data.number}`);
	}
	if (data_cache.length > 15) {
		data_cache.splice(0, 1);
	}
	if (data.type == "trem-rts") {
		if (!rts_replay_time) {
			on_rts_data(data.raw);
		}
	} else if (data.type == "replay") {
		if (rts_replay_time) {
			rts_replay_time = data.replay_timestamp;
		}
	} else if (data.type == "report") {
		palert_time = 0;
		let report_scale = data.scale.toString();
		if (report_scale.length == 1) {
			report_scale = report_scale + ".0";
		}
		const loc = data.raw.location.substring(data.raw.location.indexOf("(") + 1, data.raw.location.indexOf(")")).replace("位於", "");
		if (data.location.startsWith("地震資訊")) {
			if (storage.getItem("show_reportInfo") ?? false) {
				let text = `地震資訊，${formatToChineseTime(data.time)}，發生地震，震央位於 ${loc} 附近，震央深度為 ${data.depth}公里，地震規模為 ${data.scale.toFixed(1)}`;
				console.log(text);
			} else {
				return;
			}
		} else {
			let max = data.raw.data[0]?.areaIntensity ?? 0;
			const _max_ = int_to_string(max);
			let text = `地震資訊，${formatToChineseTime(data.time)}，發生最大震度 ${_max_} 地震，震央位於 ${loc} 附近，震央深度為 ${data.depth}公里，地震規模為 ${data.scale.toFixed(1)}`;
			let eq_station_list = {
				9 : [], 8 : [],
				7 : [], 6 : [],
				5 : [], 4 : [],
				3 : [], 2 : [],
				1 : [],
			};
			for (let i = 0; i < data.raw.data.length; i++) {
				const city = data.raw.data[i];
				for (let I = 0; I < city.eqStation.length; I++) {
					const station = city.eqStation[I];
					eq_station_list[station.stationIntensity].push(`${city.areaName}${station.stationName}`);
				}
			}
			console.log(eq_station_list);
			let count = 0;
			for (let i = 9; i >= 1; i--) {
				if (!eq_station_list[i].length) {
					continue;
				}
				if (count == 0) {
					text += `，這次地震，最大震度 ${int_to_string(i)} 地區 ${eq_station_list[i].join("，")}`;
				} else if (count == 1) {
					text += `，此外，震度 ${int_to_string(i)} 地區 ${eq_station_list[i].join("，")}`;
				} else {
					text += `，震度 ${int_to_string(i)} 地區 ${eq_station_list[i].join("，")}`;
					break;
				}
				count++;
			}
		}
		if (rts_replay_timestamp) {
			return;
		}
		if (storage.getItem("audio.Report") ?? true) {
			TREM.audio.push("Report");
		}
		TREM.report_time = now_time();
	} else if (data.type == "eew-report" || data.type == "eew-cwb") {
		if (Now().getTime() - data.time > 240_000 && !data.replay_timestamp) {
			return;
		}
		if (rts_replay_timestamp && !data.replay_timestamp) {
			return;
		}
		on_eew(data, type);
	} else if (data.type == "tsunami") {
		on_tsunami(data, type);
	} else if (data.type == "trem-eew") {
		if (Now().getTime() - data.time > 240_000 && !data.replay_timestamp) {
			return;
		}
		if (rts_replay_timestamp && !data.replay_timestamp) {
			return;
		}
		on_trem(data, type);
		if (speecd_use) {
			eew_speech = {
				loc   : data.location,
				max   : data.max,
				model : data.model,
			};
			eew_speech_clock = true;
		}
	}
}



function on_eew(data, type) {
	console.log(data);
	eew(eew_msg);
	TREM.eew = true;
	let skip = false;
	if (item_eew_level != -1) {
		if (item_eew_level > intensity_float_to_int(eew_location_info(data).i)) {
			skip = true;
		}
	}
	data._time = data.time;
	const _eq_list = Object.keys(TREM.EQ_list);
	const unit = (data.type == "eew-jma") ? "気象庁(JMA)" : (data.type == "eew-nied") ? "防災科学技術研究所" : (data.type == "eew-kma") ? "기상청(KMA)" : (data.type == "eew-scdzj") ? "四川省地震局" : (data.type == "eew-cwb") ? "交通部中央氣象署" : "TREM";
	if (!TREM.EQ_list[data.id]) {
		TREM.EQ_list[data.id] = {
			data,
			eew   : 0,
			alert : false,
		};
		if (!eew_cache.includes(data.id + data.serial)) {
			eew_cache.push(data.id + data.serial);
			if (!skip && item_audio_eew) {
				TREM.audio.push("EEW");
			}
		}
		const eew = eew_location_intensity(data, data.depth);
		data.max = intensity_float_to_int(eew.max_i);
		TREM.EQ_list[data.id].loc = eew;
	} else {
		if (!data.eq.loc) {
			data.eq.loc = TREM.EQ_list[data.id].data.eq.loc;
		}
		if (!data.eq.lat) {
			data.eq.lat = TREM.EQ_list[data.id].data.eq.lat;
		}
		if (!data.eq.lon) {
			data.eq.lon = TREM.EQ_list[data.id].data.eq.lon;
		}
		TREM.EQ_list[data.id].data = data;
		if (data.cancel) {
			TREM.EQ_list[data.id].eew = 0;
			TREM.EQ_list[data.id].data._time = Now().getTime() - 225_000;
			if (TREM.EQ_list[data.id].p_wave) {
				TREM.EQ_list[data.id].p_wave.remove();
			}
			if (TREM.EQ_list[data.id].s_wave) {
				TREM.EQ_list[data.id].s_wave.remove();
			}
			if (TREM.EQ_list[data.id].progress) {
				TREM.EQ_list[data.id].progress.remove();
			}
		} else {
			if (TREM.EQ_list[data.id].p_wave) {
				TREM.EQ_list[data.id].p_wave.setLatLng([data.eq.lat, data.eq.lon]);
			}
			if (TREM.EQ_list[data.id].s_wave) {
				TREM.EQ_list[data.id].s_wave.setLatLng([data.eq.lat, data.eq.lon]);
			}
			if (TREM.EQ_list[data.id].s_wave_back) {
				TREM.EQ_list[data.id].s_wave_back.setLatLng([data.eq.lat, data.eq.lon]);
			}
		}
		if (item_audio_update) {
			TREM.audio.push("update");
		}
		const eew = eew_location_intensity(data, data.eq.depth);
		data.max = intensity_float_to_int(eew.max_i);
		TREM.EQ_list[data.id].loc = eew;
		TREM.EQ_list[data.id].eew = intensity_float_to_int(TREM.EQ_list[data.id].loc.max_i);
	}
	TREM.EQ_list[data.id].eew = data.max;
	if (data.type == "eew-trem" && TREM.EQ_list[data.id].trem) {
		if (!skip && item_audio_eew) {
			TREM.audio.push("EEW");
		}
		delete TREM.EQ_list[data.id].trem;
		TREM.EQ_list[data.id].epicenterIcon.remove();
		delete TREM.EQ_list[data.id].epicenterIcon;
	}
	if (data.type == "eew-cwb" && data.eq.loc.includes("海") && Number(data.eq.depth) <= 35) {
		if (Number(data.eq.mag) >= 7) {
			if (!TREM.EQ_list[data.id].alert_tsunami) {
				TREM.EQ_list[data.id].alert_tsunami = true;
				if (!skip && speecd_use) {
					setTimeout(() => console.log({ text: "震源位置及規模表明，可能發生海嘯，沿岸地區應慎防海水位突變，並留意中央氣象署是否發布，海嘯警報" }), 15000);
				}
			}
		} else if (Number(data.eq.mag) >= 6) {
			if (!TREM.EQ_list[data.id].alert_sea) {
				TREM.EQ_list[data.id].alert_sea = true;
				if (!skip && speecd_use) {
					setTimeout(() => console.log({ text: "震源位置及規模表明，海水位可能突變，沿岸地區應慎防海水位突變" }), 15000);
				}
			}
		}
	}
	if (!data.replay_timestamp) {
		console.log(`🚨 地震預警 第${data.serial}報 | ${unit}\n\n`,`${time_to_string((data.eq.time) ? data.eq.time : data.time)}\n${data.eq.loc} ${(data.status == 2) ? "取消" : `發生 M${data.eq.mag.toFixed(1)} 地震`}`)
		if (_id != data.id) {
			_id = data.id;
			_list = "";
			_max = -1;
			_location = "";
		}
	}
	if (data.status == 2) {
		if (!skip && speecd_use) {
			loc_speech_clock = false;
			eew_speech_clock = false;
			console.log({ text: `${data.eq.loc}，取消` });
		}
	} else if (!skip && speecd_use) {
		eew_speech = {
			loc : data.eq.loc,
			max : data.eq.max,
		};
		eew_speech_clock = true;
	}

	eew_timestamp = 0;

	let epicenterIcon;
	const eq_list = [];
	for (const key of _eq_list) {
		if (!TREM.EQ_list[key].trem) {
			eq_list.push(key);
		}
	}
	if (eq_list.length > 1) {
		for (let i = 0; i < eq_list.length; i++) {
			const num = i + 1;
			const _data = TREM.EQ_list[eq_list[i]].data;
			let offsetX = 0;
			let offsetY = 0;
			if (num == 1) {
				offsetY = 0.03;
			} else if (num == 2) {
				offsetX = 0.03;
			} else if (num == 3) {
				offsetY = -0.03;
			} else if (num == 4) {
				offsetX = -0.03;
			}
		}
	}
	const _loc_list = TREM.EQ_list[data.id].loc;
	let loc_list = "";
	for (const loc of Object.keys(_loc_list)) {
		if (loc == "max_i") {
			continue;
		}
		if (intensity_float_to_int(_loc_list[loc].i) >= 4) {
			const city = loc.split(" ")[0];
			if (!loc_list.includes(city)) {
				loc_list += `${city}，`;
			}
		}
	}
	if (!skip && speecd_use && loc_list != "") {
		eew_speech.text = `強震即時警報，${loc_list}慎防強烈搖晃`;
		loc_speech_clock = true;
	}
}

function eew_location_intensity(data, depth) {
	const json = {};
	let eew_max_i = 0;
	for (const city of Object.keys(region)) {
		for (const town of Object.keys(region[city])) {
			const info = region[city][town];
			const dist_surface = dis(data.eq.lat, data.eq.lon, info.lat, info.lon);
			const dist = Math.sqrt(pow(dist_surface) + pow(data.eq.depth));
			const pga = 1.657 * Math.pow(Math.E, (1.533 * data.eq.mag)) * Math.pow(dist, -1.607);
			let i = pga_to_float(pga);
			if (i > 3) {
				i = eew_i([data.eq.lat, data.eq.lon], [info.lat, info.lon], data.eq.depth, data.eq.mag);
			}
			if (i > eew_max_i) {
				eew_max_i = i;
			}
			json[`${city} ${town}`] = {
				dist,
				i,
			};
		}
	}
	json.max_i = eew_max_i;
	return json;
}