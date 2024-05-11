setTimeout(() => {
	$('#eew_max_intensity').text(get_lang_string("eew.max.intensity"));
	$('#max_intensity_text').text(get_lang_string("rts.max.intensity"));
	$('#max_pga_text').text(get_lang_string("rts.max.pga"));
},500)

const ver_text = $('#version');
ver_text.textContent = 'beta';
ver_text.onclick = () => {
	shell.openExternal("https://github.com/ids93216/TREM-Lite");
};

if (!(storage.getItem("tos_1.0.0") ?? false)) {
	const tos = $('#tos');
	tos.show();
	$(document).on('click','#tos_button',function(){
		tos.hide();
		storage.setItem("tos_1.0.0", true);
	})
}