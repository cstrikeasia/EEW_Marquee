function report_off() {
	if (TREM.report_epicenterIcon) {
		TREM.report_epicenterIcon.remove();
	}
	if (TREM.report_epicenterIcon_trem) {
		TREM.report_epicenterIcon_trem.remove();
	}
	if (TREM.report_circle_trem) {
		TREM.report_circle_trem.remove();
	}
	if (TREM.report_circle_cwb) {
		TREM.report_circle_cwb.remove();
	}
	delete TREM.report_epicenterIcon;
	delete TREM.report_epicenterIcon_trem;
	for (const key of Object.keys(TREM.report_icon_list)) {
		TREM.report_icon_list[key].remove();
	}
	TREM.report_icon_list = {};
	TREM.report_bounds = L.latLngBounds();
	for (const item of document.getElementsByClassName("report_box")) {
		item.style.display = "none";
	}
	for (const item of document.getElementsByClassName("eew_box")) {
		item.style.display = "inline";
	}
	show_icon(false);
	TREM.Maps.main.setView([23.6, 120.4], 7.8);
	TREM.report_time = 0;
}