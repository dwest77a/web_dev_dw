/*
 * the 'rsg_toolbar_functions.js' file contains:
 * - setup for adding share buttons to webpage
 * - individual functions for sharing APIs (twitter, facebook etc.)
 * - cookie setting for saving the url
 * 
 * further inclusions:
 * - other toolbar functions where appropriate
 * 
 */
 
 //// GENERATE A SHAREABLE URL
// BL:2019-09-12 Generate URL to replicate current selection of prodcuts to send others
//from the arrays of products and dates, get the new uri.
// Show 2 paramerers, something like: {BASE_URL}/?cal=2019C09C01&proj=1C4&vars=1C5
function get_link_uri() {
	//var current_uri = [location.protocol, '//', location.host, location.pathname].join('');
	var current_uri = "";
	var dates_uri = "";
	var proj_uri = "";
	var vars_uri = "";
	var layers_checked = "";
	var loc_uri = "";

	//get the date from the calendar picker
	ymd = document.getElementById("datepicker-13").value;
	var year = ymd.substring(0, ymd.indexOf("/"));
	var month = ymd.substring(ymd.indexOf("/") + 1, ymd.lastIndexOf("/"));
	var day = ymd.substr(ymd.lastIndexOf("/") + 1);

		// Record product index (index in config.txt) and variable index in project table
  var layers_active = rsghelper_layers.getNr_not_hidden_layers()
  for (var l = 0; l < layers_active; l++) {
//			layer=rsghelper_layers.get_layer_copy_by_id(l).project_index
				current_layer = rsghelper_layers.get_layer_copy_by_id(l);
				proj_uri += current_layer.project_index + "C";
				vars_uri += current_layer.variable_index + "C";
				layers_checked += current_layer.alpha + "C";
		};

// date field common currently, possibly make per layer eventually (unlikely)
		dates_uri = year + "C" + month + "C" + day + "C";
//		dates.forEach(function (e) {
//						if (e != "") {
//								dates_uri += e.replaceAll("/", "C") + "J";
//						};
//				});

// Current view region co-ordinates [west,south,east,north]
//	 	loc_uri=getCameraViewCoord();
// Current view location [lat,lon,height,range]
		rloc_uri=cameraLookingAt();
// Report info for comparison
//		alert("Lat/Lon: [" + loc_uri + "]\nLat/Lon/hgt/rng=[" + rloc_uri + "]");

		// Build URL options
		dates_uri = dates_uri.substring(0, dates_uri.length - 1);
		proj_uri = proj_uri.substring(0, proj_uri.length - 1);
		vars_uri = vars_uri.substring(0, vars_uri.length - 1);
//		var new_uri = "cal=2019C09C03&proj=1C3&vars=1C4";
		var new_uri = "cal=" + dates_uri + "&proj=" + proj_uri + "&vars=" + vars_uri + "&" + rloc_uri + "&lch=" + layers_checked
		return new_uri;
}

// Combine current base URL with selection options
/*
function get_link() {
	var proc_uri = get_link_uri();
	var base_uri = window.location.href ;
	base_uri = base_uri.substring(0, base_uri.lastIndexOf("/")) ;
// Update with currently selected layers
	window.location = base_uri + "/?" + proc_uri;
}
*/

function get_full_url() {
	var proc_uri = get_link_uri();
	// var base_uri = window.location.href ;
	var base_uri = 'http://www.rsg.rl.ac.uk/vistool/';
	var base_uri_second = 'http://ralspace.stfc.ac.uk/remotesensing/vistool/';
	base_uri = base_uri.substring(0, base_uri.lastIndexOf("/")) ;
// Update with currently selected layers
	return base_uri + "/?" + proc_uri;
}

function reload_page() {
	full_url = get_full_url();
	window.location = full_url;
}

// function that marks an html element to be ignored (not rendered) in the screenshot:
function setup_ignore_in_screenshot()
{
	var cesium_buttons = document.getElementsByClassName("cesium-button");
	var i;
	for (i = 0; i < cesium_buttons.length; i++)
	{
		cesium_buttons[i].setAttribute("data-html2canvas-ignore", "true");
	}
	
	var ral_buttons = document.getElementsByClassName("ral_button");
	for (i = 0; i < ral_buttons.length; i++)
	{
		ral_buttons[i].setAttribute("data-html2canvas-ignore", "true");
	}
	
	var layer_settings_buttons = document.getElementsByClassName("layer_settings");
	for (i = 0; i < layer_settings_buttons.length; i++)
	{
		layer_settings_buttons[i].setAttribute("data-html2canvas-ignore", "true");
	}
	
	var uibuttons = document.getElementsByClassName("ui-button");
	for (i = 0; i < uibuttons.length; i++)
	{
		uibuttons[i].setAttribute("data-html2canvas-ignore", "true");
	}
	
	var cesium_help_dropdown = document.getElementsByClassName("cesium-navigation-help");
	for (i = 0; i < cesium_help_dropdown.length; i++)
	{
		cesium_help_dropdown[i].setAttribute("data-html2canvas-ignore", "true");
	}
	
	//var colourbar = document.getElementById("colourbar");
	//colourbar.setAttribute("data-html2canvas-ignore", "true");
	
	//var share_buttons = document.getElementById("share-buttons");
	//share_buttons.setAttribute("data-html2canvas-ignore", "true");
}

function download_screenshot(){
	html2canvas(document.querySelector('body'),{allowTaint : true, useCORS: true}).then(function(canvas) 
	{
		var filename = 'RSG_Webtool_screenshot.png';
		
		
		saveAs(canvas.toDataURL(), filename);
	});
}

function open_twitter(){
	var location_window = get_full_url();
	$.get("http://tinyurl.com/api-create.php?url=" + location_window,
	function(shorturl){
		var checkout = "Check%20out%20this%20link!!!%20"
		window.open("https://twitter.com/intent/tweet?text="+checkout+shorturl);
	});
}

function open_reddit(){
	var location_window = get_full_url();
	window.open("http://www.reddit.com/submit?url=" + location_window);
}

function open_facebook(){
	var location_window = get_full_url();
	window.open("https://www.facebook.com/sharer/sharer.php?kid_directed_site=0&sdk=joey&u="+location_window);
	/*
	$.get("http://tinyurl.com/api-create.php?url=" + location_window,
	function(shorturl){
		var checkout = "Check%20out%20this%20link!!!%20"
		window.open("https://www.facebook.com/sharer/sharer.php?kid_directed_site=0&sdk=joey&u="+location_window);
	});
	*/
}
 
function set_url_cookie(){
	set_cookie('saved_url', get_full_url());
	window.alert("URL Saved as cookie!");
}

function copy_url(){
	var copyurl= get_full_url();
	document.execCommand("copy");
	window.alert("Copied: "+copyurl);
	// window.location = copyurl;
	// For reloading window on this command
}

function redirect_to_faqs(){
	window.location = "http://gws-access.jasmin.ac.uk/public/rsg_share/";
}

function send_mail(){
	var location_window = get_full_url();
	window.open('mailto:?subject=Web Visualisation Tool&body='+location_window);
}

function get_cookie(cname){
	var name = cname+'=';
	var cookies = document.cookie.split(';');
	for(var i=0; i < cookies.length; i++){
		var cookie = cookies[i];
		
		// Remove blank spaces at start of cookie
		while (cookie.charAt(0) == ' '){
			cookie = cookie.substring(1);
		}
		if (cookie.indexOf(name) == 0){
			return cookie.substring(name.length, cookie.length);
		}
	}
	return "";
}


function set_cookie(cname, cvalue){
	var date = new Date();
	date.setTime(date.getTime()+ 86400); // 1 year later for expiry date
	var expires = "expires="+date.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ":path=/";
	//window.alert('cookie saved ' + cvalue);
}

function open_share_toolbar(){
	if (!document.getElementById("shares-dropdown").classList.contains("on")){
		rsg_ui.open(["shares-dropdown"]);
	
		old_shares_list = document.getElementById("shares-container");
		old_shares_list.remove();
	
		shares_list = document.createElement('div');
		shares_list.setAttribute('id', 'shares-container');
		document.getElementById("shares-dropdown").appendChild(shares_list);
		shares_list = document.getElementById("shares-container");
	
		var shares_option_titles = ["Save URL for later", "Copy to clipboard", "Email", "Twitter", "Facebook"];
	
		// Custom share icons
		shares_list = add_share_button(shares_list, share_class='share-button-general',share_title='Make Default', share_onclick=set_url_cookie, 
									share_id='', share_src='',//https://www.clipartmax.com/png/small/86-866469_computer-icons-floppy-disk-clip-art-save-icon-line-art.png', 
									share_alt='Make Default', share_href = "", share_icon_class="ui-icon-folder-open");
									
		shares_list = add_share_button(shares_list, share_class='share-button-general',share_title='Show URL', share_onclick=copy_url, 
									share_id='', share_src='',//https://www.clipartmax.com/png/small/8-84311_arrow-copy-and-paste.png', 
									share_alt='Show URL', share_href = "", share_icon_class="ui-icon-clipboard");
									
		shares_list = add_share_button(shares_list, share_class='share-button-general',share_title='Email URL', share_onclick=send_mail, 
									share_id='', share_src='', // share_src='https://www.clipartmax.com/png/small/186-1861294_email-icon-square-png.png',
									share_alt='Email URL', share_href = "", share_icon_class="ui-icon-mail-closed");
									
		shares_list = add_share_button(shares_list, share_class='share-button-general',share_title='Twitter', share_onclick=open_twitter, 
									share_id='', share_src='https://cockburnjohncharles.org/wp-content/uploads/2019/03/twitter-300x300.png',
									share_alt='Tweet', share_href = "");
									
		shares_list = add_share_button(shares_list, share_class='share-button-general',share_title='Facebook', share_onclick=open_facebook, 
									share_id='', share_src='https://www.vandaalenwoninginrichting.nl/wordpress/wp-content/uploads/2018/03/facebook-icon_blue-300x300.png', 
									share_alt='Share', share_href = "");
									
		shares_list = add_share_button(shares_list, share_class='share-button-general',share_title='Reddit', share_onclick=open_reddit, 
									share_id='', share_src='https://vectorified.com/image/reddit-icon-vector-8.png', 
									share_alt='Reddit', share_href = "");
	}
	else {
		rsg_ui.close(["shares-dropdown"]);
	}
}

function add_share_button(shares_list, share_class, share_title, share_onclick, share_id, share_src, share_alt, share_href, share_icon_class){
	if(share_class == undefined) {share_class = "";}
	if(share_title == undefined) {share_title = "";}
	if(share_onclick == undefined) {share_onclick = "";}
	if(share_id == undefined) {share_id = "";}
	if(share_alt == undefined) {share_alt = "";}
	if(share_href == undefined) {share_href = "";}
	if(share_src != undefined && share_src != ""){
	    var share_button = document.createElement('div');

        var a = document.createElement('a');
        var img = document.createElement('img');

	    a.title = share_title;
	    a.href = share_href;

        img.src = share_src;
        img.alt = share_alt;
        img.style = "position: relative; top: 0%; left: 0%; height: 100%; width: 100%;"

        a.appendChild(img);
        share_button.appendChild(a);
    }
    else if(share_icon_class != undefined && share_icon_class != ""){
		
		var share_button = document.createElement('BUTTON');
		var share_icon = document.createElement('SPAN');
		
		share_icon.classList.add("ui-icon");
		share_icon.classList.add(share_icon_class);
		share_icon.classList.add("custom-toolbar-icon");
		share_button.title = share_title
		
		share_button.appendChild(share_icon);
		
	}
	share_button.classList.add("cesium-button");
	share_button.classList.add("cesium-toolbar-button");
		
	share_button.onclick = function(){return share_onclick()};
	share_button.style = "margin: 0px; margin-top: 5px; padding: 0px; border: 0px;";
	
	shares_list.appendChild(share_button);
	return shares_list;
	
}
	
