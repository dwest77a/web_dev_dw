/* 
 * rsg_helper_functions.js has 2 namespaces:
 * - 'helper'
 * - 'rsghelper_layers' 
 * 
 * these are intended to be the functions that are used as 'black boxes' 
 * 
 * the following namespaces are used:
 * - 'rsg_layers'      namespace from 'rsg_layer_functions.js',
 * 
 * - 'helper', 
 *   'rsghelper_layers' 
 *                     namespaces from 'rsg_helper_functions.js'
 */
var helper = {
	
	foo: function() {
		alert("foo");
	},

	bar: function() {
		alert("bar");
	},

	
	string_to_date: function(date,format,delimiter)
	{
		var formatLowerCase = format.toLowerCase();
		var formatItems = formatLowerCase.split(delimiter);
		var dateItems = date.split(delimiter);
		
		var monthIndex=formatItems.indexOf("mm");
		var dayIndex=formatItems.indexOf("dd");
		var yearIndex=formatItems.indexOf("yyyy");
		
		var month=parseInt(dateItems[monthIndex]);
		month-=1;
		
		var formatedDate = new Date(dateItems[yearIndex],month,dateItems[dayIndex]);
		return formatedDate;
	},
	
	//give a date object and it will return the YYYY/MM/DD format
	formatDate: function(date, separator) 
	{
		if (separator === undefined) separator = '/'
		var d = new Date(date),
			month = '' + (d.getMonth() + 1),
			day = '' + d.getDate(),
			year = d.getFullYear();
	
		if (month.length < 2) month = '0' + month;
		if (day.length < 2) day = '0' + day;
	
		return [year, month, day].join(separator);
	},
	
	//compares two dates. returns tru if time1 is later
	compareTime: function(time1, time2)
	{
		return new Date(time1) > new Date(time2);
	},
	
	create_dictionary: function(array_of_keys_mapping_values) {
    var obj = {};
    var mod = obj;
    for (var i = 0, j = array_of_keys_mapping_values.length; i < j; i++) {
        if (i === (j - 1)) {
            mod.value = array_of_keys_mapping_values[i];
        } else {
            mod[array_of_keys_mapping_values[i]] = {};
            mod = mod[array_of_keys_mapping_values[i]];
        }
    }
    return obj;
	},
	
	get_copy_of_date: function(date)
	{
		date_as_string = helper.formatDate(date)
		date_obj = helper.string_to_date(date_as_string, "yyyy/mm/dd", "/")
		
		return date_obj
	},
	
	get_timeslider_dates: function(string_end_time)
	{
		// JavaScript creates an explicit pointer to the 
		// website_state.url_date, hence we must extract it as a string first
		date_obj = helper.string_to_date(string_end_time, 
		                                 "yyyy/mm/dd", "/")
		end_date = date_obj;
		// get a copy of end date (custom function, since if ...
		// ... we said start_date = date_obj, it implicitly declares it as a pointer ...
		// ... so, when date_obj is changed, the both end_date and start_date change)
		start_date = helper.get_copy_of_date(end_date);
		start_date.setMonth(end_date.getMonth() - 1);
		
		return [start_date, end_date]
	},
	
	date_to_unix_timestamp: function(date)
	{ // getTime gives time in MILISECONDS, whereas ...
		// ... Unix Timestamp uses seconds, hence divide by 1000
		date_toUnixTs = date.getTime() / 1000;
		// Return minute time difference between UTC and Local Time ...
		// ... in case the url date is from daylight saving time ... 
		// ... and now in winter time etc.
		timezone_offset = date.getTimezoneOffset();
		if(timezone_offset != 0){
			date_toUnixTs = date_toUnixTs + timezone_offset * (-1) * 60
		}
		return date_toUnixTs
	},
	
	contains_swap: function(list, swap_dict)
	{
		var i;
		for (i = 0; i < list.length; i++) {
			list_dict = list[i]
			try{
				if((list_dict.dragged_layer_id == swap_dict.dragged_layer_id) &&
					 (list_dict.swapped_layer_id == swap_dict.swapped_layer_id))
					{
						return true;
					}
			}
			catch(e){
				return false;
			}
		}
		return false;
	},
	
	get_typename_of_additional_layer: function(layer_fullname)
	{
		layer_tokens = layer_fullname.split('%');
		type = layer_tokens[0];
		name = layer_tokens[1];
		
		return [type, name];
	},
	
	Capitalise_Each_Word : function(string)
	{
		// convert strings such as "Lorem iPSUM dolor sit amet" to "Lorem Ipsum Solor Sit Amet" ...
		// ... making sure the rest (after first character) is lowercase
		return string.replace( /(^\w|\s\w)(\S*)/g, (_,m1,m2) => m1.toUpperCase()+m2.toLowerCase() );
	},
	
	underscores_to_spaces : function(string)
	{
		return string.replace(/_|\(|\)/g,' ');
	},
	
	//~ format_additional_layer_id: function(string)
	//~ {
		//~ return string.replace(/\s+/g, '_').toLowerCase();
	//~ },
	
	remove_parenthesis : function(string)
	{
		return string.replace(/\(|\)/g,'');
	},
	
	remove_file_extension : function(filename)
	{
		return filename.replace(/\.[^/.]+$/, ""); 
	},
	
	get_filename_from_path : function (path) 
	{
		return path.split('\\').pop().split('/').pop();
	},
	 
	
	get_func_signature: function(func) {
		var f = func.toString();
		var t = '';
		
		var a = f.match(/[ ](.+)[(](.+)[)]/i);
		
		t = 'function-name: ' + a[1];
		t+= '\nparameters: '  + a[2];
		
		return t;
	},
	
	get_onclick_func_signature: function(func) {
		var f = func.toString().replace(/(\r\n|\n|\r)/gm, "");
		var t = '';
		var function_call = f.substring(f.lastIndexOf("{") + 1, 
																    f.lastIndexOf("}"));
		var function_arguments = function_call.substring(function_call.lastIndexOf("(") + 1, 
																										 function_call.lastIndexOf(")"));
		var function_name = function_call.substring(0,function_call.lastIndexOf('('))
		
		return [function_name, function_arguments];
	},
	
	capitaliseWord: function(word)
	{
		return word.charAt(0).toUpperCase() + word.substring(1);
	},
	
};

var rsghelper_layers = {
	
		 /* function used to get a COPY of a layer by its given ID.
	 * (since JavaScript does not have pointers)
	 * NOTE: if used like this:
	 *       var x = get_layer_by_id(2)
	 *       - then var x will have the most up to date copy of layer2,
	 *         but if we then proceed to set x.source = '...' -
	 *         then only the x will be updated and not actually the layer2.
	 * 
	 *       SOLUTION:
	 *       to update the actual layer2 (or any layer), use the following:
	 *       - rsg_layers.set_layer_property(layer_id, key, value)
	 *       so, x.source = 'abc', if source was assigned a copy of layer2,
	 *       should be written as:
	 *       - rsg_layers.set_layer_property(2, "source", 'abc')
	 * 
	 * WARNING - the following can be misleading in JavaScript:
	 *    var x = get_layer_copy_by_id(2);
	 *    rsg_layers.set_layer_property(2, "source", 'abc');
	 *              . . . 
	 *    if(x.source == 'abc') -> results in false, since it has an old copy
	 */
	get_layer_copy_by_id: function (layer_id){
		//~ layer=this["layer"+layer_id]
		//~ return layer
		
		switch (layer_id) {
		case 0:
			return layer0;
		case 1:
			return layer1;
		case 2:
			return layer2;
		case 3:
			return layer3;
		};
		
	},
	
	get_layer_proj_table_index_of: function(layer_id, identifier)
	{
		return layer_state.project_table_column_indices[layer_id][identifier]
	},
	
	match_project_table_indices: function(layer_number, header)
	{
		column_names = Object.keys(project_table_regexes);
		
		var column_index_map = {}
		for (i = 0; i < header.length; i++) {
			// look for delta_t in the header:
			for (j = 0; j < column_names.length; j++)
			{
				if (header[i].match(project_table_regexes[column_names[j]])) 
				{
					column_index_map[column_names[j]] = i
				}
			}
		}
		//~ layer_column_index_map = helper.create_dictionary([index, column_index_map])
		keys_to_change_indices_of = Object.keys(column_index_map);
		
		// to make sure the new index mappings do not contain old ones, map to default before remapping:
		reset_layer_project_table_index_mappings(layer_number);
		
		for (i = 0; i < keys_to_change_indices_of.length; i++)
		{ // assign layer_state project table indices:
			layer_state.project_table_column_indices[layer_number][keys_to_change_indices_of[i]] = column_index_map[keys_to_change_indices_of[i]]
		}
	},
	
	// helper function to get the 'layerN' string when we pass N
	get_layer_name_by_id: function (layer_id){
		return "layer" + String(layer_id)
	},
	
	get_index_from_id: function(id)
	{
		return parseInt(id.substring(id.indexOf('_')-1, id.indexOf('_')) );
	},
	
		// utility function to check whether the layer has higher temporal resolution (HTR/htr)
	is_htr: function(layer_id){
		layer_info = timepicker_state["layer"+layer_id]
		not_htr_values = [-1, "NA"]
		// determining whether the layer has HRT, we check if the layer information has htr information, 
		// ... if index -1 - didn't match with -1 or NA, that means it actually contains htr related values  
		if ( (not_htr_values.indexOf(layer_info.time) == -1) && (not_htr_values.indexOf(layer_info.time) == -1) ){
			return true;
		}
		else return false;
	},
	
	//function to get which is the highest visible layer.
	get_top_layer: function()
	{
		for (i = 0; i < 4; i++) {
			vis = rsghelper_layers.get_layer_name_by_id((i)) + "_vis";
			checkbox_element = document.getElementById(vis);
			if (checkbox_element.checked) {
				return i
			}
		}
		return 4;
	},
	
	get_innermost_node_value: function(node)
	{
		
		if (node.childNodes.length == 0)
		{
			if ( (node.nodeName == "#text" ) && (node.parentNode.nodeName == "rdf:li") && (node.data != "↵   ") )
			{
				return node.nodeValue;
			}
			else return -1;
		}
		
		for (i = 0; i < node.childNodes.length; i++)
		{
			var node_value = rsghelper_layers.get_innermost_node_value( node.childNodes[i] );
			if (node_value != -1)
			{
				return node_value;
			}
		}
	},
	
	//get number of layers that are not empty
	//~ get_layers: function() {
	getNr_not_hidden_layers: function() {
		var n = 0
		for (var l = 0; l < 4; l++) {
			// redefining what we mean by 'active'
			// (previously checked if source is '-', now checking if hidden)
					//~ if (rsghelper_layers.get_layer_copy_by_id(l).source != "-") {
			// changed 2020-01-13 
			if (rsghelper_layers.get_layer_copy_by_id(l).hidden == "false") {
				n += 1
			}
		}
		return n
	},
	
	//hide layers above a given index
	hide_above_layers: function(layer) 
	{
		for (m = 0; m < layer; m++) {
			vis = rsghelper_layers.get_layer_name_by_id((m)) + "_vis";
			document.getElementById(vis).checked = false;
			rsg_layers.update_transparency(m);
			if (m == 4) {
				break;
			}
		}
	},
	
	//hide all layers
	hide_all_layers: function() 
	{
		for (var t = 0; t < 4; t++) {
			//set the checkboxes to be checked
			vis = rsghelper_layers.get_layer_name_by_id((t)) + "_vis";
			document.getElementById(vis).checked = false;
			//update the transparency
			rsg_layers.update_transparency(t)
		}
	},
	
	show_layer_by_id: function(layer_id)
	{
		vis = rsghelper_layers.get_layer_name_by_id(layer_id) + "_vis";
		document.getElementById(vis).checked = true;
		//update the transparency
		rsg_layers.update_transparency(layer_id)
	},
	
	//show all layers
	show_all_layers: function() 
	{
		for (var t = 0; t < 4; t++) {
			//set the checkboxes to be checked
			vis = rsghelper_layers.get_layer_name_by_id(t) + "_vis";
			document.getElementById(vis).checked = true;
			//update the transparency
			rsg_layers.update_transparency(t)
		}
	},
	
	layer_is_highlighted: function(layer_num)
	{
		return document.getElementById("layer"+layer_num+"_data").classList.contains("txt_highlight");
	},
	
	getHighlightedLayerId: function()
	{
		for(layer_id = 0; layer_id<4; layer_id++)
		{
			if(rsghelper_layers.layer_is_highlighted(layer_id))
				return layer_id
		}
		return -1;
	},
	
	layer_is_checked: function(layer_num)
	{
		return document.getElementById("layer"+layer_num+"_vis").checked;
	}

}
