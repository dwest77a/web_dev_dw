/* 
 * rsg_timepicker.js has the namespace 'rsg_timepicker'
 * - all functions from the rsg_timepicker namespace must be prepended with ...
 *   ... rsg_timepicker to make 'rsg_timepicker.function_name(...)'
 * 
 * the timepicker_state namespace functions use the following namespaces from files:
 * - 'rsg_ui'           namespace from 'user_interface.js'
 * - 'rsg_layers'       namespace from 'rsg_layer_functions.js'
 * - 'rsghelper_layers' namespace from 'rsg_helper_functions.js'
 */
 
// the global variable is not in the namespace
var timepicker_state = {
  on: false,
  flag_changed_timepicker_field : false,
  nr_layers_with_htr: 0, // htr = higher temporal resolution (higher than 24 hours, which is the default)
  nr_current_active_layer : 0, // to keep track which time frequency (timestep) to display
  // parameters to call 'rsg_layers.add_data_to_layer'
  // rsg_layers.add_data_to_layer(variable_index, project_index, *data*, active_data_layer, *header*)
  current_project_index : 0,
  product_nr : -1, // needed to get the correct data from data table updating to new time value
  accordion_menu_selection : [], // needed to get the same previously selected data from the menu
  time_unit : "-", // can be mn, hr (minutes, hours etc...) of the currently active layer
  step : 60,
  value : 0000, // currently selected value of the time picker
  layer0: {"time" : -1, "step" : -1, "locked_date" : -1, "locked_time" : -1},
  layer1: {"time" : -1, "step" : -1, "locked_date" : -1, "locked_time" : -1},
  layer2: {"time" : -1, "step" : -1, "locked_date" : -1, "locked_time" : -1},
  layer3: {"time" : -1, "step" : -1, "locked_date" : -1, "locked_time" : -1}
};

var rsg_timepicker = {
	update_timepicker_state: function(key, value, flag)
	{
		if (flag == "update") {
			timepicker_state[key] = value;
			return;
		}
	
		else if (flag == "change active layer") {
			rsg_timepicker.update_timepicker_state("nr_current_active_layer", value, "update");
			rsg_timepicker.update_timepicker_state("value", timepicker_state["layer"+value]["time"], "update");
			rsg_timepicker.update_timepicker_state("step", timepicker_state["layer"+value]["step"], "update");
			rsg_timepicker.update_timepicker_state("time_unit", timepicker_state["layer"+value]["time_unit"], "update");
			
			timepicker_off_values = ["NA", -1]
			if( timepicker_off_values.indexOf( timepicker_off_values.indexOf(timepicker_state["layer"+value]["time"]) ) > -1 )
				timepicker_has_defined_time = true
			else timepicker_has_defined_time = false
			
			if ( (timepicker_has_defined_time == false) && (timepicker_state.on) ) {
				// if the new layer has no 'high temporal resolution' and the timepicker is on, turn it off:
				rsg_timepicker.turn_off_timepicker();
			}
			else if ( (timepicker_has_defined_time) && (!timepicker_state.on) ) {
				// if the previous layer had no high temporal resolution but the new one does:
				rsg_timepicker.turn_on_timepicker();
			}
			
			else if ( timepicker_state.on ) {
				if ( timepicker_state.value == -1 ) {
					// if timepicker is on, but its value does not belong to a layer with
					// ... a higher temporal resolution, turn it off 
					// (triggered when all layers are off etc)
					rsg_timepicker.turn_off_timepicker();
				}
				else{
					rsg_timepicker.change_timepicker_values();
				}
			}
			else {
				if ( timepicker_state.on ) {
					rsg_timepicker.change_timepicker_values();
				}
			}
		}
	},
	
	change_timepicker_values: function()
	{
		if (!timepicker_state.flag_changed_timepicker_field) {
			if ( timepicker_state.on ) {
				document.getElementById("timepicker").value = timepicker_state.value;
				$('#timepicker').timepicker({ 'step': timepicker_state.step, 'timeFormat': 'H:i' });
			}	
		}
	},
	
	get_timepicker_step_time_in_seconds: function()
	{ // return either a finer time step (if step defined and unit is set) or 24 hours
		if( (timepicker_state.time_unit == "mn") && (timepicker_state.step != "NA") ){
			return timepicker_state.step * 60;
		}
		else{
			return 86400;
		}
	},
	
	reload_timepicker_layers: function(layer_id, map_to_id, previous_timepicker_state)
	{
		timepicker_state["layer"+layer_id] = previous_timepicker_state["layer"+map_to_id];
		
		if(layer_id == previous_timepicker_state["nr_current_active_layer"]){
			timepicker_state["nr_current_active_layer"] = map_to_id;
		}
		
	},
	
	// function that creates the timepicker elements and sets the status as 'on'
	turn_on_timepicker: function() 
	{
		if(timepicker_state.on == false) {
			timepicker_state.on = true;
		
			var td = document.createElement('td');
			var time_input = document.createElement('input');
			td.id = "timepicker_td"
			time_input.id = "timepicker";
	
			time_input.value = timepicker_state.value;
		// 	time_input.setAttribute("id", "timepicker_element");
			time_input.setAttribute("type", "text");
			time_input.setAttribute("class", "time ui-timepicker-input")
			td.appendChild(time_input);
			
	// 		document.getElementById("datetime_picking_ui").appendChild(td);
			document.getElementById("timepicker_input").appendChild(time_input);
			$('#timepicker').timepicker({ 'step': timepicker_state.step, 'timeFormat': 'H:i' });
			
			var timepicker_controllers = document.getElementsByClassName("time_controller");
			//~ for(let item of timepicker_controllers){
				//~ item.classList.remove("off");
				//~ item.classList.add("on");
			//~ };
			for(iterator = 0; iterator < timepicker_controllers.length; iterator++){
				timepicker_controller = timepicker_controllers[iterator]
				timepicker_controller.classList.remove("off");
				timepicker_controller.classList.add("on");
			}
			
			//~ for(iterator = 0; iterator < timepicker_controllers.length; iterator++){
				//~ timepicker_controllers[iterator].classList.remove("off");
				//~ timepicker_controllers[iterator].classList.add("on");
			//~ }
			
			// timepicker.onchange (executes every time when timepicker is changed ... ) 
			$('#timepicker').on('changeTime', function () {
					timepicker_state.flag_changed_timepicker_field = true;
					// get timepicker value with: $(this).val());
					// update the flag so that it does not try to highlight the topmost active layer 
					// ... (same layer that is currently on will stay highlighted)
					date_or_time_changed = true; 
					currently_highlighted_layer = rsghelper_layers.getHighlightedLayerId() // bookmark
					// loop over all layers and check if their data needs to be reloaded:
					// (going from BOTTOM layer (3) to top layer (0) so that we load the bottom first,
					//  ... and that means that further layers loaded will be on top)
					for(layer_id = 3; layer_id > -1; layer_id--)
					{ if(currently_highlighted_layer == -1) break; // if no currently 
						 // if the timepicker changed, only update the images of these layers that are:
						//    NOT locked AND have Higher Temporal Resolution (HTR/htr)
						if ( (!rsg_layers.is_locked(layer_id)) && (rsghelper_layers.is_htr(layer_id)) )
						{ // get layer by its id:
							currently_active_layer = rsghelper_layers.get_layer_copy_by_id(layer_id);
							
							var project_index = currently_active_layer.project_index;
							var project_table = currently_active_layer.project_table;
							
							// get the data in different ways depending on whether loaded from url...
							// ... or loaded via the selection menu (accordion menu):
							if(website_state["layer"+layer_id+"_loaded_from_url"]){
								var data = get_data_dable_by_project_index(currently_active_layer.project_index, layer_id);
							}
							else{
								//~ var data = data_tables[website_state["layer"+active_data_layer+"_product_nr"]];
								var data = data_tables[website_state["layer"+layer_id+"_product_nr"]];
							}
							// get the header of the data (the very first row, explaining the columns)
							//~ var header = headers[window["layer"+layer_id].product_nr];
							var current_layer_header = get_header_by_project_index(project_index);
							// if only desired to change THE ACTIVE (hightlighted) layer ONLY, then set ...
							// ... index to be layer_id= [timepicker_state.nr_current_active_layer]
							var sel = selection_data_in_layer_index[layer_id];
							
							// searching for rows of data that match the time specified in the timepicker:
	
							// time picker output now matches the format of the heading in the product table:
							// ... might have HeadingA -> 00:00 etc 
							time = $(this).val()
							
							// selection[...] is where the user would specify the time, (from the config table)
							// ... so it is just updated here manually:
							// (get the headings - meaning get the extra info to help build the URL - HeadingA, ...B, C, D
							headings = config_table[project_index].slice(8, 12);
							// find the column in headings (Time	Variable	empty	empty ... ) by name "Time"
							time_index = headings.indexOf("Time");
							sel[time_index] = time; // if time = 09:30, sel[0] == 930, 00:00 == 0, 10:30 == 1030 etc.
							
			 				for (var d = 0; d < data.length; d++)
							{ // iterate the config table rows and look for one that is matching the selection
			 					if (sel[0] == data[d][0] && sel[1] == data[d][1] && sel[2] == data[d][2] && sel[3] == data[d][3]) 
			 					{
									// get the matching row index so that we can refer to it later when editing the layer data (loading a new png image)
			 						variable_index = d;
			 						break;
			 					}
			 				}
			 				currently_active_layer.variable_index = variable_index
			 				
			 				// update the variable reference index in the currently active layer
			 				rsghelper_layers.get_layer_copy_by_id(layer_id).variable_index = variable_index;
			 				
							var new_image = generate_png_url(variable_index, project_index, project_table, layer_id);
							
							// since the layer properties have changed, (the source, name etc) ... 
							/// ... they must be reassigned before calling the functions to update the displayed information
							var project_row = config_table[project_index];
							var variable_row = project_table[variable_index];
							
							rsg_layers.assign_layer_properties(currently_active_layer, layer_id, variable_row, project_index)
							rsg_layers.assign_layer_subproperties(currently_active_layer, layer_id, project_row, project_index, variable_index, 
							                                      project_table, current_layer_header, "false", new_image)
							
							// load the new image (incremented hour) to the layer  
							rsg_layers.loadImgResource(layer_id, new_image);
							
							var layer_data = {
								"time" : time, 
								"step" : timepicker_state["layer"+layer_id]["step"],
								"time_unit" : timepicker_state["layer"+layer_id]["time_unit"],
								"locked_date" : -1,
								"locked_time" : -1
								};
							rsg_timepicker.update_timepicker_state("layer"+layer_id, layer_data, "update");
							rsg_timepicker.update_timepicker_state("value", time, "update");
							rsg_timepicker.change_timepicker_values();
							
							timepicker_state.flag_changed_timepicker_field = false;
						}
					}
				});
				// move toolbar down
				rsg_ui.update_toolbar_position_relative_to($("#ralsp_small"));
		}
		else rsg_timepicker.change_timepicker_values();
		
	},
	timestep_forwards: function(){
		rsg_timepicker.increment_decrement_timepicker("increment");
	},
	
	timestep_backwards: function(){
		rsg_timepicker.increment_decrement_timepicker("decrement");
	},

	increment_decrement_timepicker: function(action)
	{ // get timepicker step: timepicker_state.step
		var time = $('#timepicker').val();
		var getTime = time.split(":"); 
		
		if(timepicker_state.time_unit == "mn"){
				minutes_to_add = timepicker_state.step;
			
			if(timepicker_state.step >= 60){
				hours_to_add = parseInt(timepicker_state.step / 60)
				minutes_to_add = timepicker_state.step % 60;
			}
		}
		if(action == "increment"){
			var hours = parseInt(getTime[0])+hours_to_add;
			var minutes = parseInt(getTime[1])+minutes_to_add; //add 'step' minutes	
			
			if(hours > 23){
				hours = hours % 24
			}
			if(minutes > 59){
				minutes = minutes % 60
			}
			
		}
		if(action == "decrement"){
			var hours = parseInt(getTime[0])-hours_to_add;
			var minutes = parseInt(getTime[1])-minutes_to_add; //add 'step' minutes	
			
			if(hours < 0){
				hours = 24 + hours;
			}
			
			if(minutes < 0){
				minutes = 60 + minutes;
			}
			
		}
		// in case when we add/subtract less than 10 minutes (hh:mm, so if hh:m -> [hh:0m])
		if(minutes.toString().length == 1) minutes = "0"+minutes;
			
		//set new time
		var incremented_time = hours+":"+minutes;
		$("#timepicker").timepicker('setTime', incremented_time);	
	},
	
	turn_off_timepicker: function() 
	{
		// update its state:
		rsg_timepicker.update_timepicker_state("on", false, "update");
	
		var timepicker = document.getElementById("timepicker");
		var timepicker_input = document.getElementById("timepicker_input");
		var timepicker_controllers = document.getElementsByClassName("time_controller");
		
		if ( timepicker != null ) {
			timepicker_input.removeChild(document.getElementById("timepicker"));
		}
		//~ for (let item of timepicker_controllers ){
			//~ item.classList.remove("on");
			//~ item.classList.add("off");
		//~ }
		for(iterator = 0; iterator < timepicker_controllers.length; iterator++){
				timepicker_controller = timepicker_controllers[iterator]
				timepicker_controller.classList.remove("on");
				timepicker_controller.classList.add("off");
		}
		
		rsg_ui.update_toolbar_position_relative_to($("#ralsp_small"));
	}
	
}
