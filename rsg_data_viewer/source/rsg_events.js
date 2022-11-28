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

function open_events(){
	if (document.getElementById('events-manager').classList.contains("off")){
		rsg_ui.open(['events-manager']);
	}
	else{
		rsg_ui.close(['events-manager']);
	}
}

function check_date_for_events(date){
	// Extract properties from date string
	var year = parseInt(date.substring(0, date.indexOf("/")));
	var month = parseInt(date.substring(date.indexOf("/")+1, date.lastIndexOf("/")));
	var day = parseInt(date.substring(date.lastIndexOf("/")+1));
	
	for (i=0; i<events_table.length; i++){
		// For each event in generic table
		var event = events_table[i];
		
		// Obtain components of date from event entry in file
		var strstart = event[1].split("/");
		var start = [parseInt(strstart[0]), parseInt(strstart[1]), parseInt(strstart[2])];
		var strend = event[2].split("/");
		var end = [parseInt(strend[0]), parseInt(strend[1]), parseInt(strend[2])];
		
		// From specific event file
		var event_detail = event_details[i];
		
		// Compare date components		
		var start_condition = ((year > start[0]) || (year == start[0] && month > start[1]) || (year == start[0] && month == start[1] && day >= start[2]))
		var end_condition = ((year < end[0]) || (year == end[0] && month < end[1]) || (year == end[0] && month == end[1] && day <= end[2]))
		
		if (start_condition && end_condition){window.alert('Popup to give event link')}
		
	}
	
}

function ready_events() {
	
	// Setup new table with headings
	old_table = document.getElementById("events-table");
	old_table.remove();

	new_table = document.createElement('table');
	new_table.setAttribute('id', 'events-table');
	document.getElementById("events-dropdown").appendChild(new_table);
	var header_row = document.createElement('tr');
	var event_titles = document.createElement('th');
	event_titles.innerHTML = "Events";
	var event_descs = document.createElement('th');
	event_descs.innerHTML = "Description";
	var event_button = document.createElement('th');
	event_button.innerHTML = "Links";
	
	// Append elements
	header_row.appendChild(event_titles);
	header_row.appendChild(event_descs);
	header_row.appendChild(event_button);
	new_table.appendChild(header_row);
	// from load_config.js
	for (i=0; i<events_table.length; i++){
		// Event entries as rows of table
		var event = events_table[i];
		// Create new elements
		var new_row = document.createElement('tr');
		
		var event_title = document.createElement('th');
		event_title.innerHTML = event[0];
		
		var event_desc = document.createElement('th');
		event_desc.innerHTML = event_details[i][1];
		
		var event_button = document.createElement('th');
		var event = document.createElement("input");
		event.type = "button";
		event.id = i;
		event.value = events_table[i][0];
		event.addEventListener('click', function(e){return open_event(e)});
		event.classList.add("add_layer_style");
		event.classList.add("ui-button");
		event.classList.add("ui-corner-all"); 
		event.classList.add("ui-widget");
		event_button.appendChild(event);
		
		new_row.appendChild(event_title);
		new_row.appendChild(event_desc);
		new_row.appendChild(event_button);
		
		new_table.appendChild(new_row);
	}
	// Event title
	// North, east, south, west settings
	rsg_ui.close(["events-dropdown"]);
}

function open_event(e){
	var event_id = e.target.id;
	window.location = event_details[event_id][2];
}


//the classic process a tsv table into an array. Watch out that this assumes the table has a header row.
function processData(allText, delim) {
    var allTextLines = allText.split(/\r\n|\n/);
    var headers = allTextLines[0].split(delim);
    var lines = [];
    for (var i = 1; i < allTextLines.length; i++) {
        var data = allTextLines[i].split(delim);
        if (data.length == headers.length) {
            var tarr = [];
            for (var j = 0; j < headers.length; j++) {
                tarr.push(data[j]);
            }
            lines.push(tarr);
        }
    }
    return lines;
};
	
