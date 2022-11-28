////DATA VIEWER DATA SELECTION UI MODULE

/* 
 * data_selection.js has no namespaces
 * in this file, the collection of functions take care of:
 * - setting up data selection menu 
 * - getting requested png images
 * 
 * the following namespaces are used:
 * - 'rsg_timepicker'  namespace from 'rsg_timepicker.js',
 * - 'rsg_layers'      namespace from 'rsg_layer_functions.js',
 * 
 * - 'helper', 
 *   'rsghelper_layers' 
 *                     namespaces from 'rsg_helper_functions.js',
 * 
 * as well as some functions from 'data_selection.js', which are ...
 * ... currently also not under any namespace.
 */

// GLOBAL PNG METADATA VARIABLE (because async functions)
global_png_metadata = ""

////GLOBAL HELPER FUNCTIONS
//These prototype additions add helper functions to the standard arrays and strings.
Array.prototype.contains = function (elem) {
	for (var i in this) {
		if (this[i] == elem) return true;
	}
	return false;
}

//Returns an array of unique values from an array
Array.prototype.unique = function () {
	var arr = [];
	for (var i = 0; i < this.length; i++) {
		if (!arr.contains(this[i])) {
			arr.push(this[i]);
		}
	}
	return arr;
}

// START OF EXIF-READING FUNCTIONS

async function parse(file) {
  // Always return a Promise
  return new Promise((resolve, reject) => {
    let content = '';
    const reader = new FileReader();
    // Wait till complete
    reader.onloadend = function(e) {
      content = e.target.result;
      //~ const result = content.split(/\r\n|\n/);
      //~ resolve(result);
      resolve(content);
    };
    // Make sure to handle error states
    reader.onerror = function(e) {
      reject(e);
    };
    reader.readAsText(file);
  });
}

async function recursive_blob_reader2(blob, chunk, found_begin, found_end, tag_finished, begin_index, end_index, blob_chunk_timeout_limit)
{
	var output = "placeholder"
	// exiting condition nr. 1:
	// ... if exceeded the blob chunk searching limit, returns undefined
	if (chunk > blob_chunk_timeout_limit)
	{
		// BLOB CHUNK TIMEOUT LIMIT EXCEEDED
		//return undefined
		return new Promise((resolve, reject) => {
			// RETURN REJECT promise ...
			global_png_metadata = false;
			reject("no XML tags")
		});
	}
	
	// exiting condition nr. 2
	if (tag_finished) // upon exit, read in the blob as text from sliced begin and end positions:
	{
		/** Tag found. The critical positions:");
		* @begin:  begin_index
		* @end:    end_index
		* @length: end_index - begin_index
		*/
		// get the xml tag slice in file:
		var slicing = blob.slice(begin_index+1, end_index+1);
		
		// will wait for final text:
		text = await parse(slicing);
		return new Promise((resolve, reject) => {
			// RETURNING VALID RESOLVED PROMISE
			global_png_metadata = text;
			resolve(text);
		});
		
		// reference is lost to the reader, JS GC shou1d free up that memory
		reader = null
	}
	
	// recursive part:
	else // if tag is not finished:
	{
		// get next chunk (1000 bytes = 1KB):
		var slicing = blob.slice(chunk*1000, chunk*1000+1000);
		
		// set up an async listener (so that when sync calling next line ...
		// ... 'readAsText' when done loading, processes the text (interprets bytes as text)
		let text = "placeholder"
		text = await parse(slicing);
		
		// regular expressions for finding the start and end of the xmp tag:
		var xpacket_begin = /<\?xpacket.\s*begin/i; // regular expression. 'i' - case insensitive
		var xpacket_end   = /(<\?xpacket(?!.begin).[\s\S]*end.[\S]*)(>)/i; // regular expression. 'i' - case insensitive
		
		// if we have not yet found the beginning tag:
		if (!found_begin)
		{// execute a matching operation:
			search_of_begin = xpacket_begin.exec(text)
			if ( search_of_begin )
			{ // if now found the beginning tag:
				found_begin = true
				begin_index = chunk*1000+search_of_begin.index 
			}
		}
		
		if ( (found_begin) && (!found_end) )
		{ // if found beginning tag, but not the end tag, look for the end tag:
			search_of_end = xpacket_end.exec(text)
			if (search_of_end)
			{
				found_end = true
				var ix = search_of_end.index;
				ix += search_of_end[0].length;
				
				end_index = chunk*1000+ix
			}
			
		}
		
		// if found beginning and end of XML tag, then mark as tag finished:
		if ( (found_begin) && (found_end) ) tag_finished = true
		
		if (!tag_finished)
		{ // if the ENTIRE tag has not been found yet, do another recursive call:
			const recursive_async_call_tag_not_found = async function()
			{
				try
				{
					let xml_as_text = await recursive_blob_reader2(blob, chunk+1, found_begin, found_end,   false,    begin_index, end_index, blob_chunk_timeout_limit);
					return new Promise((resolve, reject) => 
					{
						resolve(global_png_metadata);
					});
				}
				catch(error)
				{
					// Rejected with message: 'error'
					return new Promise((resolve, reject) => 
					{
						reject(error);
					});
				}
			}
			
			promise = await recursive_async_call_tag_not_found();
			
			return new Promise((resolve, reject) => {
				// SUCCESSFULLY returning promise of suceeded chunk
				resolve(promise);
			});
		}
	
		else //  if finished (found the whole XML tag - beginning and end)
		{ // ... do another recursive call to return a valid xmp tag:
			const recursive_async_call_tag_found = async function()
			{
				try
				{
					let xml_as_text = await recursive_blob_reader2(blob, chunk, found_begin, found_end, true, begin_index, end_index, blob_chunk_timeout_limit);
					return new Promise((resolve, reject) => 
					{
						resolve(xml_as_text);
					});
				}
				catch(error)
				{
					// Rejected with message: 'error':
					return new Promise((resolve, reject) => 
					{
						reject(error);
					});
				}
			}
			
			promise = await recursive_async_call_tag_found();
			
			return new Promise((resolve, reject) => {
				// SUCCESSFULLY returning promise of suceeded chunk:
				resolve(promise);
			});
		}
	}
}

// asynchronous function that gets an xmp tag from a given blob (blob = Binary Large OBject)
async function get_xml_tags_from_blob(blob)
{
	var xmp_extracted = false;
	var chunk = 0;
									//recursive_blob_reader(blob, chunk, found_begin, found_end, tag_finished, begin_index, end_index)
	var blob_chunk_timeout_limit = 5; // how many chunks of 1KB it goes through before giving up on search for xml tags
	
	var result = "undef";
	
	try
	{
		var res = await (async function() 
		{
			try
			{
				result = await recursive_blob_reader2(blob, 0,     false,       false,     false,        -1,          -1, blob_chunk_timeout_limit)
				return new Promise((resolve, reject) => {
					// SUCCESSFULLY returning promise of suceeded chunk
					resolve(result);
				});
			}
			catch (error)
			{
				result = error;
				return new Promise((resolve, reject) => {
					// UNSUCCESSFULLY returning promise of suceeded chunk
					resolve(error);
				});
			}
			
		})();
		return new Promise((resolve, reject) => {
				parser = new DOMParser();
				xmlDoc = parser.parseFromString(res,"text/xml");
				resolve(xmlDoc);
			});
	}
	catch(error)
	{
		return new Promise((resolve, reject) => 
		{
			reject(error);
		});
	}
}

// -------------------- END OF EXIF-parsing functions -------------------- //

//hide an html element
function hide_item(item_id) {
	$(function () {
		$(item_id).hide();
	});
};


//show an html element
function show_item(item_id) {
	$(function () {
		$(item_id).show();
	});
};


//check if two arrays are equal
function arraysEqual(arr1, arr2) {
	if (arr1.length !== arr2.length)
		return false;
	for (var i = arr1.length; i--;) {
		if (arr1[i] !== arr2[i])
			return false;
	}
	return true;
}


//return a column of a 2d matrix
function getCol(matrix, col) {
	var column = [];
	for (var i = 0; i < matrix.length; i++) {
		column.push(matrix[i][col]);
	}
	return column;
}


////GLOBAL VARIABLES

//array containing the highest level configuration
var config_table = []

//contains the products in the selection menu
var product_arr = []

//array containing the data tables for each product in the selection menu
var header_dict = {}
var headers = []
var data_tables = []

//height and width of the device screen viewing the page.
var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
var height = (window.innerHeight > 0) ? window.innerHeight : screen.height;

var selection_data_in_layer_index = {
	0 : [],
	1 : [],
	2 : [],
	3 : [] 
}


////SETUP FUNCTIONS

//setup accordion ui dependant on device height and width
//if on a small screen, content is scrollable
if (width < 700) {
	$(function () {
		$("#accordion").accordion({
			heightStyle: "fill",
			collapsible: true
		});
	});
} else {
	//if on large screen, set size based on content
	$(function () {
		$("#accordion").accordion({
			heightStyle: "content",
			collapsible: true
		});
	});
}

//initialse jquery ui menu elements
//data selection drop down menus
$(function () {
	$("#data_set").selectmenu();
});

//add layer button
$(function () {
	$("#add_layer").button();
});

//given the project index, variable index, and layer, 
// ... load the project table and add the image to the layer.
// NOTE: url_turnedON is only used when loading data from true URL, 
// ... to figure out whether to turn the layer on or leave off
// ... if url_turnedON is set to 0, then it is referring to the default layer loaded when no special url is given

//~ PREVIOUSLY KNOWN AS: function add_url_data_to_layer(project_index, variable_index, layer_id, url_turnedON) {
function add_url_data_to_layer(project_index, variable_index, layer_id, url_turnedON) {
	
	// from the main config table (/config/config_table.txt), ...
	// ... get a project specific table (/config/project_tables/...)
	var project_table_url = config_table[project_index][7]
	
	// download the indexed project table (using jQuery AJAX get)
	// GET is basically used for just getting (retrieving) some data from the server. 
	// NOTE: The GET method may return cached data.
	$.ajax({
		type: "GET",
		url: project_table_url,
		dataType: "text",
		// whenever data is received, execute the following:
		success: function (data) 
		{
			data = removeComments(data);
			
			//once loaded table, setup the layer
			var header = getHeader(data, "	");
			var data = processData(data, "	");

			var sel = new Array();
			try{
				sel[0] = data[variable_index][0];
				sel[1] = data[variable_index][1];
				sel[2] = data[variable_index][2];
				sel[3] = data[variable_index][3];
			}
			catch(e){
				sel=[-1,-1,-1,-1]
				variable_index = -1;
			}
			selection_data_in_layer_index[layer_id] = sel;
			
			// save the project table and the project index to the current layer object:
			currently_processing_layer = rsghelper_layers.get_layer_copy_by_id(layer_id);
			currently_processing_layer.data_table = config_table[project_index];
			currently_processing_layer.project_index = project_index;
			
			// make note that the layer was loaded from url:
			//~ alert(typeof(url_turnedON))
			//~ if (typeof(url_turnedON) != "undefined") 
			// since this function only deals with data that has been specified via URL (or default) ...
			// ... mark that layer as loaded from url:
			website_state["layer"+layer_id+"_loaded_from_url"] = true;
			
			// once we have the necessary properties extracted from the url, ...
			// ... we can add the data to the layer: 
			rsg_layers.add_data_to_layer(variable_index, project_index, data, layer_id, header);
			
			// show only the layer that has been loaded (instead of previously showing all)
			if (url_turnedON != 0)
			{// turned on status from 'lch':
				 rsghelper_layers.show_layer_by_id(layer_id);
			}
			
		},
		async: false
	});
}

////PROCESS DATA FUNCTIONS

// takes the data file and removes comments (lines starting with '#'):
function removeComments(data){
	var data_without_comments = "";
	var allTextLines = data.split(/\r\n|\n/);
	for (var i = 0; i < allTextLines.length; i++) {
		if(allTextLines[i].charAt(0) != "#"){
			data_without_comments = data_without_comments + allTextLines[i] +"\n";
		}
	}
	return data_without_comments;
}

function getHeader(allText, delim) {
	var allTextLines = allText.split(/\r\n|\n/);
	var header = allTextLines[0].split(delim);

	return header;
}

//take the .txt comma separated file and put it into an array
function processData(allText, delim, project_table_name, flag) {
	if(project_table_name === undefined) {project_table_name = "";}
	if(flag === undefined) {flag = false;}
	var allTextLines = allText.split(/\r\n|\n/);
	//can change the string in the .split function if a different delimeter is used.
	var headers = allTextLines[0].split(delim);
	
	if(project_table_name != "")
		header_dict[project_table_name] = headers
	
	var lines = [];
	for (var i = 1; i < allTextLines.length; i++) {
		//also change this delimeter if you want to use a different one.
		var data = allTextLines[i].split(delim);
		if (data.length == headers.length) {
			var tarr = [];
			for (var j = 0; j < headers.length; j++) {
				if (flag == "as_float") 
				{
					tarr.push( parseFloat(data[j]) );
				}
				else tarr.push(data[j]);
			}
			lines.push(tarr);
		}
	}
	return lines;
}


//given a test value, and the column, return the corresponding value for a different column in the row
function get_items(test_value, column_given, column_required, data_table) {
	var x = []
	for (var j = 0; j < data_table.length; j++) {
		if (data_table[j][column_given] == test_value) {
			x.push(data_table[j][column_required])
		}
	}
	return x;
}


//get unique items from a column of a table.
function get_unique_items(table, column) {
	var x = []
	for (i = 0; i < table.length; i++) {
		x.push(table[i][column]);
	};
	return x.unique();
};


//given the product and project selection, get the row from the configuration table.
function get_table_row_index(s, p, data_table) {
	for (i = 0; i <= data_table.length; i++) {
		if (data_table[i][0] == s && data_table[i][2] == p) {
			return i
		};
	};
};


////HTML ELEMENTS MANIPULATION FUNCTIONS
//given an html dropdown menu, and an array of value, add the options to the menu
function add_options_to_dropdown(dropdownElement, values) {
	$('#' + dropdownElement).empty();
	for (var i = 0; i < values.length; i++) {
		var option = document.createElement("option")
		option.text = values[i]
		option.value = values[i]
		$(option).appendTo('#' + dropdownElement)
	}
	//select the first item by default
	$("#" + dropdownElement + "option:first-child").attr("selected", "selected");
}


//remove all options from a dropdown menu
function removeOptions(selectbox) {
	for (var p = selectbox.options.length - 1; p >= 0; p--) {
		selectbox.remove(p);
	};
};


//remove radio buttons from an html div
function remove_radio(id) {
	var $select = $('#' + id);
	$select.children().remove();
}


//select the first element of a fieldset
function select0(select_id) {
	var rad = document.getElementById(select_id)
	rad.click()
}


//update the titles of the fieldsets. hide the fieldset if the heading is empty
function update_headings(product, headings) {
	for (var k = 0; k < 4; k++) {
		document.getElementById(product + "_select" + String(k) + "_legend").innerText = headings[k]
		if (headings[k] == "empty") {
			hide_item("#" + product + "_select" + String(k) + "_fieldset")
		}
	}
}


////SETUP DATA SELECTION MENU

//setup function that loads the table and populates the dropdowns
function setupAccordion(table) {
	//delimiter is a tab
	config_table = processData(table, "\t");
	var products = get_unique_items(config_table, 2)
	populate_accordion('accordion', products)
}


//add the project selections to the dropdown menus
function setup_options(product, project) {
	//add headings
	var proj_line = get_table_row_index(project, product, config_table)
	var headings = config_table[proj_line].slice(8, 12)
	update_headings(product, headings)
	var table_url = config_table[proj_line][7]
	//load project table and populate
	$.ajax({
		type: "GET",
		url: table_url,
		dataType: "text",
		success: function (data) {
			setup_fields(data, product)
		}
	});
}


//setup the radio button fieldsets of the menu
function setup_fields(table, product) {
	//replace the project data table in the array. save for later.
	// remove comments from the table which is about to be added to all data_tables list:
	table = removeComments(table);
	
	var header = getHeader(table, "	")
	var data_table = processData(table, "	")
	if (product_arr.indexOf(product) == -1) {
		product_arr.push(product)
		data_tables.push(data_table)
		headers.push(header)
	} else {
		data_tables[product_arr.indexOf(product)] = data_table
		headers[product_arr.indexOf(product)] = header
	}

	//add items to first field
	var A = get_unique_items(data_table, 0);
	add_options_to_fieldset(A, product + "_select0_data_fields");

	//if all products have loaded, select the first item in each
	if (get_unique_items(config_table, 2).length == product_arr.length) {
		for (var p = 0; p < product_arr.length; p++) {
			select0(product_arr[p] + "_select0_data_fields_rad0")
		}
	}

}


//setup the data selection menu. adding the html elements
function populate_accordion(acc_id, prods) {
	var $acc = $('#' + acc_id);

	for (var i = 0; i < prods.length; i++) {
		//add the titles
		var html_string = '<h3>' + prods[i] + '</h3>'
		html_string += '<div id=product' + String(i) + '_' + prods[i] + '></div>'
		$acc.append(html_string);

		//add dropdown +  get options
		var select_string = '<fieldset><legend for=' + prods[i] + '_select_proj>Select Dataset and Add Chosen Data to Map</legend>'
		var button_html = "<button class='ui-button add-data-btn' id=product" + String(i) + '_' + prods[i] + '_addData value=' + prods[i] + '>Add Data</button></fieldset>'
		select_string += '<select id=' + prods[i] + '_select_proj name=' + prods[i] + '_select select></select>' + button_html
		$('#product' + String(i) + '_' + prods[i]).append(select_string);
		var proj = [];
		proj = get_items(prods[i], 2, 0, config_table);

		add_options_to_dropdown(prods[i] + '_select_proj', proj)
		$('#' + prods[i] + '_select_proj').selectmenu();

		//add event handling
		$('#' + prods[i] + '_select_proj').on('selectmenuchange', function () {
			var product = this.id
			product = product.slice(0, product.indexOf("_"))
			var project = this.value
			setup_options(product, project)
		});

		//add fieldset holders
		for (var k = 0; k < 4; k++) {
			var fieldstring = '<div class="widget"><fieldset id="' + prods[i] + '_select' + String(k) + '_fieldset" data-role="controlgroup">\
			<legend id="' + prods[i] + '_select' + String(k) + '_legend"></legend>\
			<div id="' + prods[i] + '_select' + String(k) + '_data_fields"></div>\
			</fieldset>\
			</div>'
			$('#product' + String(i) + '_' + prods[i]).append(fieldstring);
		}

		//setup up the options in the fieldsets from project selection
		setup_options(prods[i], $('#' + prods[i] + '_select_proj').val())

		//add data button (PREVIOUS ADD BUTTON LOCATION HERE:)
		//~ var button_html = "<div class='widget'><button class='ui-button' id=product" + String(i) + '_' + prods[i] + '_addData value=' + prods[i] + '>Add Data</button></div>'
		//~ $('#product' + String(i) + '_' + prods[i]).append(button_html)

		//initialise jquery button element
		$(function () {
			$("#product" + String(i) + '_' + prods[i] + '_addData').button();
		});

		//add event handling for the add data buttons
		// EXECUTES ONCLICK of Add Data button ('..._addData.onclick')
		$("#product" + String(i) + '_' + prods[i] + '_addData').click(function (event) {
			event.preventDefault();

			//get fieldset selections
			var sel = []
			for (var l = 0; l < 4; l++) {
				sel.push($("#" + this.value + "_select" + String(l) + "_fieldset :radio:checked").val())
			}
		
			//get the project and product selections
			var proj = document.getElementById(this.value + '_select_proj').value
			var prod = this.id.slice(this.id.indexOf("_") + 1, this.id.lastIndexOf("_"))
			
			var project_index = get_table_row_index(proj, prod, config_table)
			var variable_index = 0

			//get line in data table (variable index)
			// (the variable_index is the matched row - having matching Headings A B C )
			
			var data = data_tables[product_arr.indexOf(this.value)]
			var header = headers[product_arr.indexOf(this.value)]
			for (var d = 0; d < data.length; d++) {
				if (sel[0] == data[d][0] && sel[1] == data[d][1] && sel[2] == data[d][2] && sel[3] == data[d][3]) {
					variable_index = d
				}
			}
			
			//add data based on selections
			rsg_timepicker.update_timepicker_state("product_nr", product_arr.indexOf(this.value), "update");
			rsg_timepicker.update_timepicker_state("accordion_menu_selection", sel, "update");
			selection_data_in_layer_index[active_data_layer] = sel;
			//~ window["layer"+active_data_layer].product_nr = product_arr.indexOf(this.value);
			//~ window["layer"+active_data_layer].project_nr = product_arr.indexOf(this.value);
			layer = rsghelper_layers.get_layer_copy_by_id(active_data_layer)
			layer.product_nr = product_arr.indexOf(this.value);
			layer.project_index = project_index;
			layer.project_table = data;
			website_state["layer"+active_data_layer+"_product_nr"] = product_arr.indexOf(this.value);
			
			
			rsg_timepicker.update_timepicker_state("current_variable_index", variable_index, "update");
			rsg_timepicker.update_timepicker_state("current_project_index", project_index, "update");
			rsg_layers.add_data_to_layer(variable_index, project_index, data, active_data_layer, header)

			//close the data selection menu accordion
			$acc.accordion("option", "active", false);
		});
	}

	//refresh menu styling and close accordion slides
	$acc.accordion("refresh");
	$acc.accordion("option", "active", false);
	showPage()
}


//given the fieldset id, populate the radio buttons
function add_options_to_fieldset(arr, ids) {
	remove_radio(ids)

	//get the fieldset id
	var fieldset_id = ids.slice(0, ids.indexOf("data"))
	fieldset_id += "fieldset"

	//if no options exist, hide the fieldset
	if (arr.unique() == "empty") {
		hide_item('#' + fieldset_id)
	} else {
		show_item('#' + fieldset_id)
	}

	//add the radio options and labels
	var field = $('#' + ids);
	for (var j = 0; j < arr.length; j++) {
		var label = arr[j];
		$radio = $('<input />', {
			id: ids + '_rad' + j,
			name: ids + "_radio",
			type: "radio",
			value: arr[j],
			class: 'myradio'
		});
		var $label = $('<label />', {
			for: ids + '_rad' + j,
			text: label
		});
		field.append($label).append($radio);

		//add event handling
		$('#' + ids + '_rad' + j).click(function () {
			//get the id of the product and fieldset from the id and name
			var product = (this.id).slice(0, (this.id).indexOf("_"))
			var select_id = (this.name).slice(this.name.indexOf("select") + 6, this.name.indexOf("select") + 7)

			//get the project data table from the saved list
			var dt = data_tables[product_arr.indexOf(product)]

			//get which items have been selected
			var selections = []
			for (var z = parseInt(select_id); z >= 0; z--) {
				var x = $("#" + product + "_select" + String(z) + "_fieldset :radio:checked").val();
				selections.push(x)
			}

			//update next fieldset
			update_next(select_id, selections, product, dt)
		})

		//initialise the radio button
		$(function () {
			$("#" + ids + '_rad' + String(j)).checkboxradio();
		});

		//refresh the styling
		$(function () {
			$("#" + ids + '_rad' + String(j)).checkboxradio("refresh");
		});
	}
	//select the first item in the fieldset (triggers filling the next set etc.)
	select0(ids + "_rad0")
}


//function triggered when radio button is selected. update the next fieldset
function update_next(selection_id, selections_array, product, data) {

	var cols = []
	var new_items = []
	var selections = selections_array.reverse()

	if (selections_array.length < 4) {
		for (var j = 0; j < selections.length; j++) {
			//get the first j columns in the data table
			cols.push(getCol(data, j))
		}

		//create a test array for each row of the columns
		//if it is equal to the selection made, return the new items
		for (var x = 0; x < cols[0].length; x++) {
			var test_arr = []
			for (var i = 0; i < selections.length; i++) {
				test_arr[i] = cols[i][x]

				if (arraysEqual(selections, test_arr)) {
					new_items.push(data[x][selections.length])
				}
			}
		}

		//add to next fieldset
		var fieldset = product + '_select' + String(parseInt(selection_id) + 1) + "_data_fields"
		add_options_to_fieldset(new_items.unique(), fieldset)
	}
}


//// GENERATE PNG URL FROM SELECTION

//Generates the png url form the selection in the table and the date.
function generate_png_url(variable_index, project_index, proj_table, layer_id, average) 
{
	if(average === undefined) {average = "none";}
	
	var current_header = get_header_by_project_index(project_index);
	var time_resolution = /delta_t/i; // regular expression. 'i' - case insensitive
	
	var base_url = config_table[project_index][5];
	var base_file_pref = config_table[project_index][6];
	var pre_ymd = config_table[project_index][12];
	
	
	// if the website is just being loaded, the data from the URL (or default layer) ...
	// ... gets loaded before the datepicker is set up. Hence get year/month/date from website url date
	if (website_state.webpage_init_loading) 
		ymd = helper.formatDate(website_state.url_date);
	
	// if layer function is called after the website has loaded, get yyyy-mm-dd from timepicker
	else ymd = document.getElementById("datepicker-13").value;
	
	//~ get_data_dable_by_project_index(project_index)
	
	for (i = 0; i < current_header.length; i++) {
		// look for delta_t in the header:
		if (current_header[i].match(time_resolution)) {
				time_resolution_index = i;
		}
	}
	
	try{
		
		// generating url for averages
		
		//change the ymd component depending on the config of the variable
		ymd_delta = proj_table[variable_index][time_resolution_index].substring(0, 2);
		// if want monthly/yearly mean addressed like yyyy/mm/image, or yyyy/image:
		switch (ymd_delta) {
			case "dd":
				ymd = ymd;
				break;
			case "mm":
				ymd = ymd.slice(0, -3);
				break;
			case "yy":
				ymd = ymd.slice(0, -6);
				break;
		};

		// if want monthly/yearly mean addressed like yyyy/mm/MM/image, or yyyy/YY/image:
		/*switch (ymd_delta) {
			case "dd":
				ymd = ymd;
				break;
			case "mm":
				ymd = ymd.slice(0, -3)+"/mm";
				break;
			case "yy":
				ymd = ymd.slice(0, -6)+"/yy";
				break;
		};*/
		
	}
	catch(e){
		console.log("WARNING: delta_t column")
	}

	ymd_1 = ymd.replaceAll("/", "");
	var png_url = base_url + ymd + "/"
	if (pre_ymd == "empty" || pre_ymd == undefined) {
		png_url += ymd_1;
	} else {
		png_url += pre_ymd + ymd_1
	}

	if (base_file_pref != "empty") {
		png_url += base_file_pref;
	}

	for (let g = 4; g < 8; g++) {
		if (proj_table[variable_index][g] != "empty") {
			png_url += proj_table[variable_index][g];
		}
	}
	return png_url + ".png"
}

//add layers based on url query
function setup_layers_from_url(url) {
	//get date
	var url_date = getParameterByName("cal", url)
	//if no date defined, default to today
	if (url_date != null) 
	{
		// convert url date string to actual date object:
		date_obj = helper.string_to_date(url_date.replaceAll("C", "/"), 
		                                 "yyyy/mm/dd", "/")
		// update the website state variable to hold the loaded URL date for reference:
		website_state.url_date = date_obj
		
		// if the url date is not null, then
		// ...  replace datepicker value with the url date
		$(function () {
			$("#datepicker-13").val(date_obj);
		})
	}
	
	else {website_state.url_date = new Date();} // by default, new Date returns today
	
	//set region focus [west,south,east,north] from url corner coordinates:
	set_region_view_from_url(url);

	//get project indices:
 	var url_projects = getParameterByName("proj", url)
	//get the variables:
	var url_vars = getParameterByName("vars", url)
	// extract information which layers to turn off or on:
	var url_layers_on = getParameterByName("lch", url)

	//error handling
	if (url_projects == null) 
	{ // if url is empty ...
		// ... setup the default image (0, 2, 0 = IASI Methane xCH4 7 Day)
		/* 'default_line_of_row_zero' is global and defined in 'visualisation.js'
		 * ... it is 0 by default, but if config_table.txt contains the following:
		 * ^default_ prod_line^=<number>, then default_line_of_row_zero is assigned that <number>
		 */
		// url_turnedON flag set to 1 means layer should be visible (ticked)
		add_url_data_to_layer(0, default_line_of_row_zero, 0, url_turnedON = 1)
		return null
	} 
	else if ((url_projects.split("C")).length > 4) 
	{
		//~ rsg_ui_widgets.add_datepicker();
		//~ d = website_state.url_date
		//~ $("#datepicker-13").val(helper.formatDate(d));
		//setup the default image (0, 2, 0 = IASI Methane xCH4 7 Day) METOP-B
		/* 'default_line_of_row_zero' is global and defined in 'visualisation.js'
		 * ... it is 0 by default, but if config_table.txt contains the following:
		 * ^default_ prod_line^=<number>, then default_line_of_row_zero is assigned that <number>
		 */
		add_url_data_to_layer(0, default_line_of_row_zero, 0, url_turnedON = 1)
		return null
	}
	else 
	{ 
		//~ rsg_ui_widgets.add_datepicker();
		//~ d = website_state.url_date
		//~ $("#datepicker-13").val(helper.formatDate(d));
		// if given full defined URL:
		// project and variable indices split by a C
		url_projects = url_projects.split("C")
		url_vars = url_vars.split("C")
		try{
			url_layers_on = url_layers_on.split("C")
		}
		catch(e){
			url_layers_on = [1,1,1,1]
		}
		
		//error handling if an erroneus URL was given
		if (url_projects.length != url_vars.length) {
			return null
		}

		//load the tables to layers starting from the top layer 0:
		for (var s = 0; s < url_projects.length; s++) 
		{ //get the parameters
			var pi = parseInt(url_projects[s]) // project index
			var vi = parseInt(url_vars[s]) // variable index
			var is_layer_on = parseInt(url_layers_on[s])
			add_url_data_to_layer(pi, vi, s, url_turnedON = is_layer_on)
			rsg_layers.make_topmost_checked_on_layer_active();
		}
	}
}

function get_logo_url_by_id(identifier)
{
	
}

function get_dynamic_colour_table(colour_table_name)
{
	full_relative_path = "config/colour_tables/"+colour_table_name;
	// get the dynamic colour table (dct) file:
	processed_dct = get_tsv_textfile_from_url(full_relative_path);
	
	// default to UNIFORM colouring (that means colours change suddenly)
	// colour table object:
	
	// array of 256 entries, where its index indexes an RGB colour it should map to
	// [i] - > [RRR, GGG, BBB]
	
	// the colour table can be given in two ways:
	// ... if it is continiuous, and values provided for EVERY 255 greyscale value, ...
	// ... then we do not need to have a greyscale column (can check nr of columns)
	//     -> then R G B 
	//           1 x y z
	//           2 i j k 
	// or else, if preferred, can have less than 256 values mapping to given greyscale ...
	// ... but then necessarry to provide which greyscale value to map to
	//     -> then GS R G B 
	//           1 00 x y z
	//           2 99 i j k 
	
	// in that case, if no flag is specified, the default is assumed UNIFORM colour grading
	// ... that means copy the same colour as before until new colour specified for GS
	// ... (in this example greyscale values 00-98 would map to x y z and 99+ - to i j k
	
	var line_greyscale_indicator = false;
	var gs_column_greyscale_indicator = false;
	
	// if there are 4 columns, then columns given should be R, G, B, A ...
	// ... this means that greyscale value should be indexed by the line number
	if (processed_dct[0].length == 4) line_greyscale_indicator = true;
	else if (processed_dct[0].length == 4) gs_column_greyscale_indicator = true;
	
	// if only 4 columns - R G B A, then it is expected, that the file has 256 lines to index all greyscale values
	// ... then in that case, can just return, as all values will be mapped.
	if (line_greyscale_indicator) return processed_dct;
	
	
	var greyscale_value;
	var colour_table = []
	var previous_rgba = [];
	var colour_row_index = 0;
	
	for (greyscale_value = 0; greyscale_value < 256; greyscale_value++)
	{
		if ( processed_dct[colour_row_index][0] == greyscale_value )
		{
			colour_table[greyscale_value] = [ processed_dct[colour_row_index][1], processed_dct[colour_row_index][2], processed_dct[colour_row_index][3], processed_dct[colour_row_index][4] ];
			previous_rgba = [ processed_dct[colour_row_index][1], processed_dct[colour_row_index][2], processed_dct[colour_row_index][3], processed_dct[colour_row_index][4] ];
			colour_row_index += 1; // ready to move on onto new line of passed colour table
		}
		else
		{
			colour_table[greyscale_value] = [ previous_rgba[0],previous_rgba[1],previous_rgba[2], previous_rgba[3] ];
		}
		
	}
	
	return colour_table;
	
}

function match_datasource_layer_to_path(lines, match_id)
{
	for(let i = 1; i < lines.length; i++)
	{
		var tokens = lines[i].split('\t');
		var name_part = tokens[0].split('%')[2]
		if (name_part == match_id[1])
		{
			path = tokens[1];
			return path;
		}
	}
	return "no_path";
}

function get_datasource_path(match_id)
{
	var path;
	$.ajax({
		type: "GET",
		url: "Assets/Data/static_data_sources/config/data_sources.txt",
		dataType: "text",
		async: false,
		success: function (data) {
			// tab separated
			data = removeComments(data);
			lines = data.split('\n');
			
			path = match_datasource_layer_to_path(lines, match_id);

			//~ path = "test";
		}
	});
	return path;
}

function is_additional_layer_dynamic(path)
{
	date_regex = /%(.+?)%/gm
	
	if(path.match(date_regex))
	{
		filename = helper.get_filename_from_path(path);
		return true
	}
	else return false;
}

function add_yyyy_mm_dd_to_path_from_datepicker(path, datepicker_value)
{
	yyyymmdd = datepicker_value.split('/');
	
	path = path.replace(/%yyyy%/gm, yyyymmdd[0]);
	path = path.replace(/%mm%/gm, yyyymmdd[1]);
	path = path.replace(/%dd%/gm, yyyymmdd[2]);
	
	return path;
}

// helper function to get tab separated text files:
function get_tsv_textfile_from_url(given_url)
{
	var processed_data;
	$.ajax({
		type: "GET",
		url: given_url,
		dataType: "text",
		async: false,
		success: function (data) {
			// tab separated
			data = removeComments(data);
			processed_data = processData(data, "	", undefined, "as_float");
		}
	});
	return processed_data;
}

//given the project index, variable index, and layer, load the project table and add the image to the layer.
function get_data_dable_by_project_index(project_index, layer) {
	if(layer === undefined) {layer = 0;}
	var data_table_url = config_table[project_index][7]
	var processed_data;
	$.ajax({
		type: "GET",
		url: data_table_url,
		dataType: "text",
		async: false,
		success: function (data) {
			processed_data = processData(data, "	", config_table[project_index][1]);
		}
	});
	return processed_data;
}

//given the project index, variable index, and layer, load the project table and add the image to the layer.
function load_logo_config_table() {
	//~ var processed_data;
	var logo_config_table;
	$.ajax({
		type: "GET",
		url: "config/logo_lookup.txt",
		dataType: "text",
		async: false,
		success: function (data) {
			data = removeComments(data);
			processed_data = processData(data, "	");
		}
	});
	return processed_data;
}

/** function to check whether data (image/file/...) is present given url) */
function data_exists_in_url( url )
{
	var request;
	if(window.XMLHttpRequest)
	    request = new XMLHttpRequest();
	else
	    request = new ActiveXObject("Microsoft.XMLHTTP");
	    
	request.open('GET', url, false);
	request.send();
	
	if(request.status === 404) 
	{
		console.log("GET: Tiles not found, loading entire image instead ... ");
		return false;
	}
	else return true;
}

//given the project index, variable index, and layer, load the project table and add the image to the layer.
function get_header_by_project_index(project_index) {
	
	for (id = 0; id < 4; id++)
	{
		var current_layer = rsghelper_layers.get_layer_copy_by_id(id);
		
		var firefox_debug = document.getElementById("layer"+id+"_");
		firefox_debug.innerHTML = current_layer.assigned_subproperties;
		iteration_layer = rsghelper_layers.get_layer_copy_by_id(id);
		
		//~ if (iteration_layer.assigned_subproperties === undefined)
		if (iteration_layer.assigned_subproperties === undefined)
		{
			alert("Firefox Issue");
		}
		
	}
	
	try
	{
		var data_table_url = config_table[project_index][7]
	}
	catch(e)
	{
		console.log(e);
		console.log(config_table);
		console.log(project_index);
		console.log(config_table[project_index]);
		alert("Firefox Issue")
	}
	
	var processed_data;
	$.ajax({
		type: "GET",
		url: data_table_url,
		dataType: "text",
		async: false,
		success: function (data) {
			header = getHeader(data, "	");
		}
	});
	return header;
}

