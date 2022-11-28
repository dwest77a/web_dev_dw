/*
 * the 'rsg_user_interface.js' file contains:
 * - jQuery functions for creating widgets and handle events
 * - UI visibility functions 
 * - toggle html elements functions
 * - hide/show html elements
 * 
 * rsg_user_interface.js has the namespaces 'rsg_animation'
 * - all functions from corresponding namespaces must be prepended with ...
 *   ... the namespace name to make 'namespace.function_name(...)'
 * 
 * the animation namespace functions use the following namespaces from files:
 * - 'rsg_ui'          namespace from 'rsg_user_interface.js'
 * - 'rsg_timepicker'  namespace from 'rsg_timepicker.js'
 * - 'rsg_layers'      namespace from 'rsg_layer_functions.js'
 * - 'helper', 
 *   'rsghelper_layers' 
 *                     namespaces from 'rsg_helper_functions.js'
 */
 
// namespace for jQuery functions for creating widgets and handle events //
var rsg_ui_widgets = {
	
	/*********** FUNCTIONS THAT DEAL WITH LAYER REORDEING/SWAPPING **************/
	
	// function that renames the html elements when the layers swap:
	revert_layer_name: function(new_name, old_index, delimiter)
	{
		// the name format is as follows:
		//     layer#_description
		// ... only the # needs to be replaced by the old_index.
		reverted_name = "layer" + old_index
			description = new_name.substring(new_name.indexOf(delimiter));
		reverted_name += description
		
		return reverted_name
		
	},
	
	revert_onclick_function: function(element_id, revert_to_id)
	{
		element = document.getElementById(element_id);
		current_cell = parseInt( element_id.substring(element_id.indexOf('_')-1, element_id.indexOf('_')) )
		
		try
		{
			if( element.onclick != null )
			{
				if(element_id == "layer0_remove_btn")
				{
					// if currently processing the layer0 remove button...
					// ... which should not exist...
					element.remove(); // remove it ...
					element_id = "layer1_vis"; // ... and process the next checkbox in the queue
					element = document.getElementById(element_id);
					revert_to_id = 1;
					current_cell = 1;
				}
				if (current_cell > 0)
				{ //
					remove_layer_button = document.getElementById("layer"+revert_to_id+"_remove_btn")
					if (typeof(remove_layer_button) == 'undefined' || remove_layer_button == null)
					{
						rsg_ui.add_layer_button(revert_to_id, "_remove_btn", revert_to_id)
					}
				}
				// rewire the function called onclick - get the function signature, ...
				// ... and edit the argument to be the new layer id 
				function_call = helper.get_onclick_func_signature(element.onclick)
				corrected_function_call = function_call[0]+"("+parseInt(revert_to_id)+")"
				let corrected_onclick = new Function(corrected_function_call);
				
				element.onclick = corrected_onclick; // for internet explorer
				element.setAttribute("onclick", corrected_function_call); // for other browsers
				
			}
		}
		catch(error){
			return;
		}
		
	},
	// function that marks the layer list as sortable/draggable:
	make_layer_selection_sortable: function()
	{
		$( function() {
	    $( "#sortable" ).sortable({
			  stop: function(event, ui) 
			  {
			     var $items = $(ui.item).parent().children()
			     var dragged_layer_id;
			     var swapped_layer_id;
			     var swaps = [];
			     var layer0_copy = layer0;
			     var layer1_copy = layer1;
			     var layer2_copy = layer2;
			     var layer3_copy = layer3;
			     $items.each(function(index)
			     {
			         $(this).find('[id]').add(this).attr('id', function()
			         {
									 current_new_id = this.id;
									 new_id = rsghelper_layers.get_index_from_id(current_new_id); 
									 if(new_id != index){
										dragged_layer_id = index;
										swapped_layer_id = new_id;
										
										operations = {"dragged_layer_id" : dragged_layer_id,
																	 "swapped_layer_id" : swapped_layer_id}
										if(!helper.contains_swap(swaps,operations))	swaps.push(operations);
									 }
									 //~ rsg_ui_widgets.revert_function_call(current_new_id, new_id, index, '_');
									 //~ rsg_ui_widgets.revert_function_call(new_id, current_new_id, index, '_');
									 return rsg_ui_widgets.revert_layer_name(current_new_id, index, '_')// = this.id.split('_')[0] +'_' + index
			         })
			     })
			     // just to display updated row id's
			     $items.find('.id').text(function(){return 'rowId=' +this.parentNode.id})
			     rsg_layers.reshuffle_layers();
			     console.log("dragged: " + dragged_layer_id + " swapped it with: " + swapped_layer_id );
			     
			     // setup the variables the current layer information will be copied to
			     var lookup_timepicker_state = {}
			     var lookup_selection_data_in_layer_index = {}
			     var lookup_website_state = {}
			     var lookup_layer_state = {}
			     var lookup_layer_all_aditional_properties = {}
			     
			     Object.assign(lookup_timepicker_state, timepicker_state);
			     Object.assign(lookup_selection_data_in_layer_index, selection_data_in_layer_index);
			     Object.assign(lookup_website_state, website_state);
			     
			     //~ lookup_timepicker_state              = _.cloneDeep(timepicker_state);
			     //~ lookup_selection_data_in_layer_index = _.cloneDeep(selection_data_in_layer_index);
			     //~ lookup_website_state                 = _.cloneDeep(website_state);
			     
			     // since javascript performs a shallow copy by using the assignment operator ...
			     // ... we set up variables above to now perform a deep copy by using _.cloneDeep
			     lookup_layer_state = _.cloneDeep(layer_state);
			     lookup_layer_all_aditional_properties = _.cloneDeep(layer_all_aditional_properties);
			     //~ Object.assign(lookup_layer_state, layer_state);
			     //~ Object.assign(lookup_layer_all_aditional_properties, layer_all_aditional_properties);
			     for(iterator = 0; iterator < swaps.length; iterator++)
			     {
						 
						 rsg_timepicker.reload_timepicker_layers(swaps[iterator].dragged_layer_id, 
						                                         swaps[iterator].swapped_layer_id,
						                                         lookup_timepicker_state);
						
						 rsg_layers.swap_layer_state(swaps[iterator].dragged_layer_id, 
						                                   swaps[iterator].swapped_layer_id,
						                                   lookup_layer_state);
						                                   
						 rsg_layers.swap_layer_all_aditional_properties(swaps[iterator].dragged_layer_id, 
						                                                      swaps[iterator].swapped_layer_id, 
						                                                      lookup_layer_all_aditional_properties);
						 
						 selection_data_in_layer_index[swaps[iterator].dragged_layer_id] = lookup_selection_data_in_layer_index[swaps[iterator].swapped_layer_id];
						 reload_website_state(swaps[iterator].dragged_layer_id, 
							                    swaps[iterator].swapped_layer_id,
							                    lookup_website_state);
							
						 if(active_data_layer == swaps[iterator].dragged_layer_id) active_data_layer = swaps[iterator].swapped_layer_id;
						 //~ rsg_ui.update_button_functions(swaps[iterator].swapped_layer_id, swaps[iterator].dragged_layer_id);
						 console.log("swapping: " + swaps[iterator].dragged_layer_id + " with: " + swaps[iterator].swapped_layer_id);
						 		switch (swaps[iterator].dragged_layer_id) {
									case 0:
										switch (swaps[iterator].swapped_layer_id) {
											case 0:
												layer0 = layer0_copy;
												break;
											case 1:
												layer0 = layer1_copy;
												//~ rsg_ui.add_layer_button(0, "_remove_btn", 1);
												//~ rsg_ui.remove_layer_button_by_id("layer1_remove_btn");
												break;
											case 2:
												layer0 = layer2_copy;
												//~ rsg_ui.add_layer_button(0, "_remove_btn", 2);
												//~ rsg_ui.remove_layer_button_by_id("layer2_remove_btn");f
												break;
											case 3:
												layer0 = layer3_copy;
												//~ rsg_ui.add_layer_button(0, "_remove_btn", 3);
												//~ rsg_ui.remove_layer_button_by_id("layer3_remove_btn");
												break;
										}
										break;
									case 1:
										switch (swaps[iterator].swapped_layer_id) {
											case 0:
												console.log("1 to 0");
												layer1 = layer0_copy;
												//~ rsg_ui.add_layer_button(1, "_remove_btn", 0);
												//~ rsg_ui.remove_layer_button_by_id("layer0_remove_btn");
												break;
											case 1:
												layer1 = layer1_copy;
												break;
											case 2:
												layer1 = layer2_copy;
												break;
											case 3:
												layer1 = layer3_copy;
												break;
										}
										break;
									case 2:
										switch (swaps[iterator].swapped_layer_id) {
											case 0:
												layer2 = layer0_copy;
												//~ rsg_ui.add_layer_button(2, "_remove_btn", 0);
												//~ rsg_ui.remove_layer_button_by_id("layer0_remove_btn");
												break;
											case 1:
												layer2 = layer1_copy;
												break;
											case 2:
												layer2 = layer2_copy;
												break;
											case 3:
												layer2 = layer3_copy;
												break;
										}
										break;
									case 3:
										switch (swaps[iterator].swapped_layer_id) {
											case 0:
												layer3 = layer0_copy;
												//~ rsg_ui.add_layer_button(3, "_remove_btn", 0);
												//~ rsg_ui.remove_layer_button_by_id("layer0_remove_btn");
												break;
											case 1:
												layer3 = layer1_copy;
												break;
											case 2:
												layer3 = layer2_copy;
												break;
											case 3:
												layer3 = layer3_copy;
												break;
										}
										break;

								};
					 }
					 
					 // update HTML names of buttons:
					 rsg_ui.update_button_functions();
					 // reorder layers so that ones that should be on top, actually are:
					 rsg_layers.reshuffle_layers();
			  }
			});
	    $( "#sortable" ).disableSelection();
	  } );
	},
	
	add_datepicker: function()
	{
		$(function () {
			$("#datepicker-13").datepicker({
				//~ dateFormat: "yy/mm/dd",
				dateFormat: "yy/mm/dd",
				//set the miniumum or maximum available date.
				maxDate: (new Date()),
				onSelect: function (event, ui) 
				{ // datepicker-13.onChange
					reload_layer_images_on_new_datetime()
				}
			}).trigger('reload_layer_images_on_new_datetime');
			async: false
		});
	},
	
	add_time_slider: function(initial_date, end_date)
	{
		initial_date_toUnixTs = helper.date_to_unix_timestamp(initial_date);
		end_date_toUnixTs = helper.date_to_unix_timestamp(end_date);
		
		//Add the ui slider to the settings div.
		$("#time_slider").slider({
			orientation: "horizontal",
			type: "range",
			// Date(month) counts from 0 ...
			// time_slider start and end animation dates
			min: initial_date_toUnixTs,
			max: end_date_toUnixTs,
			//~ min: initial_date.getTime() / 1000,
			//~ max: end_date.getTime() / 1000,
			//~ min: last_month.getTime() / 1000,
			//~ max: today.getTime() / 1000,
			
			step: 1,
			// initial (default) value:
			value: end_date_toUnixTs,
		
			// 'rsg_ui_widgets.slide_time' function called whenever the slider is changed.
			// 'rsg_ui_widgets.slide_time' changes the input field text and loads a corresponding image for each layer:
			// onslide, onchange events:
			slide: function (event, ui) {
				rsg_ui_widgets.slide_time(ui.value)
			},
			change: function (event, ui) {
				rsg_ui_widgets.slide_time(ui.value)
			}
		});
	},
	
	// utility function to change the date of the time slider 
	slide_time: function(day_value)
	{
		/* paramter 'day_value' is given in SECONDS since 1970-01-01 */
	
		// since 'day_value' is passed in SECONDS, and javascript utc uses MILISECONDS, multiply by 1000
		date = new Date(day_value*1000);
		// put the generated date in the datepicker field:
		$("#datepicker-13").val(date.toISOString().slice(0,10).replace(/-/g, '/'));
		
		// if website is not in the process of loading initial datasets from URL ...
		// (since this function gets triggered upon setting the initial timepicker value)
		if (!website_state.webpage_init_loading)
		{
			// load the new images for the chosen day:
			reload_layer_images_on_new_datetime();
		}
	},
	
	add_opacity_slider: function()
	{
		$("#opacity_slider").slider({
			orientation: "horizontal",
			range: "min",
			max: 1,
			step: 0.05,
			value: 1,
			//Update transparency function called whenever the slider is changed.
			slide: function (event, ui) {
				rsg_layers.update_transparency(active_data_layer)
			},
			change: function (event, ui) {
				rsg_layers.update_transparency(active_data_layer)
			}
		});
	},
	
	set_up_extra_layers: function()
	{
		/// do not show the layer selections by default:
		var nr_of_layer_types = 2;
		for (let i = 1; i <= nr_of_layer_types; i++)
		{
			document.getElementById('layer_option_list'+i).classList.remove("dropdown-menu-active");
		}
		
		for (let iterator = 0; iterator < website_state.overlay_layer_titles.length; iterator++)
		{
			add_WMTS_overlay_tiled_layer('https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi', 
		                               website_state.overlay_layer_titles[iterator] );
		  // check if layer should be left on by default:
			if(website_state.selected_overlay_layers.indexOf(website_state.overlay_layer_titles[iterator]) == -1)
				remove_overlay_layer_by_name(website_state.overlay_layer_titles[iterator]);
		}
		
		// set up the additional layers:
		for (let iterator = 0; iterator < website_state.additional_layer_titles.length; iterator++)
		{
			path_to_datasource = get_datasource_path(website_state.additional_layer_titles[iterator]);
			add_additional_datasource_layer( path_to_datasource, website_state.additional_layer_titles[iterator] );
			
		  // check if layer should be left on by default:
			//~ if(website_state.selected_additional_layers.indexOf(website_state.additional_layer_titles[iterator]) == -1)
			//~ remove_overlay_layer_by_name(website_state.additional_layer_titles[iterator]);
		}
		
		var all_shown_layer_names = "";
		
		// check the default ... 
		// set the shown layer names from the actives ones on default:
			/// if there are 0 default overlay layers, then set the UI div to off (as the following loop does not execute)
		document.getElementById("overlay-layers-active-div").classList.add("off");
		
		for (let i = 0; i < website_state.selected_overlay_layers.length; i++)
		{
			/// since the loop is executed, there are more overlays added by default and show the div:
			document.getElementById("overlay-layers-active-div").classList.remove("off");
			all_shown_layer_names += ", ".repeat(i>0) + website_state.selected_overlay_layers[i];
		}
		// since there might be layers that are on by default, update the name ...
		/// ... of the overlay layers area where the active ones are listed
		$('#overlay-layers-active-listnames').html(all_shown_layer_names);
		
		all_shown_layer_names = "";
		/// if there are 0 default additional layers, then set the UI div to off (as the following loop does not execute)
		document.getElementById("additional-layers-active-div").classList.add("off");
		
		for (let i = 0; i < website_state.selected_additional_layers.length; i++)
		{
			document.getElementById("additional-layers-active-div").classList.remove("off");
			// set the choice button to display the name of the default layers
			all_shown_layer_names += ", ".repeat(i>0) + website_state.selected_additional_layers[i];
		}
		// since there might be layers that are on by default, update the name ...
		/// ... of the additional layers area where the active ones are listed
		$('#additional-layers-active-listnames').html(all_shown_layer_names);
		
	},
	
	// when any of the dropdown inputs are clicked: 
	//~ $('.dropdown-menu input').on('click', function( event ) {
	set_additional_layer_wrapper_onclick_event: function(button_id, shown_layers_div_id, selection_dropdown_id)
	{
		// function that gets executed whenever the button to drop down the layer choice is clicked:
		$( '#' + button_id).on('click', function( event ) {
			// since there are more than 1 layer button, we toggle them
			// (when one is turned on, the other is turned off:
			dropdown_area_basename = selection_dropdown_id.replace(/[0-9]/g, '');
			current_nr = Number( selection_dropdown_id.replace(/\D/g,'') );
			turn_off_nr = 1 * 2*(current_nr == 1) + 1 * 1*(current_nr == 2);
			
			// drop-down the actual desired menu:
			//$('#' + selection_dropdown_id).toggleClass("dropdown-menu-active");
			// turn off the other:
			//document.getElementById('layer_option_list'+turn_off_nr).classList.remove("dropdown-menu-active");
			handle_all_windows(button_id);
			
		});
		
		// function that executes when any of the checkbox options is clicked on:
		$('#' + selection_dropdown_id).on('click', 'input', function( event )
		{ // get the element that was clicked:
			// by accessing 'event.currentTarget'
			
			var overlay_regexp = /overlay.*/gm;
			var additional_regexp = /additional.*/gm;
			 
			// check if overlay or additional layer was just added:
			if(overlay_regexp.test(button_id))
			{
				var selected_layer_options = website_state.selected_overlay_layers;
				var name_label_area = "overlay-layers-active-listnames";
				var shown_layer_area = "overlay-layers-active-div";
			}
			else
			{
				var selected_layer_options = website_state.selected_additional_layers;
				var name_label_area = "additional-layers-active-listnames";
				var shown_layer_area = "additional-layers-active-div";
			}
			
		   var $target = $( event.currentTarget ),
		       val = toTitleCase( $target.attr( 'name' ).replace(/_/g, ' ') ),
		       $inp = $target.find( 'input' ),
		       idx;
			 var id = val.replace(/\s+/g, '_').toLowerCase();
			 
		   var checkbox = event.currentTarget.id; 
		   
		   var val = checkbox.replace(/\s+/g, '_').toLowerCase()
		   try{
			   var cs = document.getElementById(val).checked;
		   }
		   catch{
			   var cs = document.getElementById(checkbox).checked;
		   }
		   var check_state = cs;
		   if (check_state){checkbox_state = -1}
		   else if (!check_state) {checkbox_state = 1}
		   
		   var website_layer_state = selected_layer_options.indexOf( val ); // -1 if not present
		   
		   var do_add_layer = ( checkbox_state == -1 && website_layer_state == -1);
		   var do_remove_layer = (checkbox_state != -1 && website_layer_state != -1);
		   
		   
			 // managing the option choice in the 'selected_layer_options' array:
		   if (do_add_layer)
		   {
		      selected_layer_options.push( val );
			    setTimeout( function() { $inp.prop( 'checked', true ) }, 0);
		   }
		   else if (do_remove_layer)
		   { 
		      selected_layer_options.splice( idx, 1 );
		      setTimeout( function() { $inp.prop( 'checked', false ) }, 0);
		   } 
			
			 // actual part that turns the layers on or off:
			 if (button_id == "overlay-layers-b")  
			 {
				 if ( checkbox_state > -1 )
					 remove_overlay_layer_by_name($target.attr( 'name' ));
				 else
					 show_overlay_layer_by_name($target.attr( 'name' ));
			 }
			 
			 else toggle_additional_layer(id, do_add_layer, do_remove_layer); // this actually frees up the memory and REMOVES the additional layer 
			 //show_hideJsonLayer(id); // this just hides or shows the layer, but is faster to load/unload if toggled a lot
			
			 var button_name = "";
			 
			 // set the button text to prompt the user to choose a layer, ...
			 // ... if there are currently 0 selected_layer_options chosen.
			 if (selected_layer_options.length == 0)
			 {
					document.getElementById(shown_layer_area).classList.add("off");
				 //~ button_name = "Choose additional Layers";
			 }
			 
			 // else make the button state which layers have been selected:
			 else 
			 {
				 document.getElementById(shown_layer_area).classList.remove("off");
				 $.each( selected_layer_options, function(value, key) {
					 if (value == selected_layer_options.length-1)
						 button_name += key;
					 else
						 button_name += key + ", ";
				 });
			 }
			 // sets the button text here:
		   //~ $('#'+shown_layers_div_id).html(button_name);
		   $('#'+name_label_area).html(button_name);
		});
	}
}

var rsg_ui = {
////UI VISIBILITY FUNCTIONS
//gets the screen size and adjusts the UI elements depending on the device.
	adjust_to_screen_size: function() 
	{
		var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
		var height = (window.innerHeight > 0) ? window.innerHeight : screen.height;
		//approx width of menu plus top ui elements
		if (height < 700 || width < 600) {
			//remove get started screen
			get_started();
		}
		//increased to 800px for newer phones and tablets.
		if (width < 800) {
			//global variable used by other ui functions.
			small_screen = true;
			
			//setup the small screen view
			show_item("#ralsp_small");
			show_item("#logos_small");
	
			rsg_ui.hide_settings();
			//~ rsg_ui.hide_colourbar();
			rsg_ui.show_colourbar();
			get_started();
			// start hidden on mobile to first load a pretty earth without clutter:
			rsg_ui.hide_toolbar();  
			rsg_ui.hide_settings();
			//~ hide_item("#toolbar");
			//~ rsg_ui.show_data_select(); do not show on mobile it just clutters the screen on load ...
	
			//hide data source selection, logos and rotation buttons.
			hide_item("#data_sources");
			hide_item("#logos");
			hide_item("#rotation");
	
			//change styling of data select menu
			data_select_menu = document.getElementById("data_select_menu")
			data_select_menu.style.padding = "0px";
			data_select_menu.style.margin = "0 0 0 0";
			data_select_menu.style.height = String(height - 30) + "px";
			data_select_menu.style.maxheight = "100%";
			data_select_menu.style.top = "0";
			data_select_menu.style.left = "0";
	
			//change accordion to only fill the screen and allow scrolling
			$(function () {
				$("#accordion").accordion({
					heightStyle: "fill",
					collapsible: true
				});
			});
			
		} 
		else {
			//normal view
			small_screen = false;
			show_item("#data_sources");
			show_item("#logos");
			hide_item("#logos_small");
			show_item("#ralsp_small");
	// 		show_item("#toolbar");
	// 		hide_item("#toolbar"); // start hidden to ensure displays correct on clicking RAL Space logo
			show_item("#rotation");
	
			//hide the mobile logo
	// 		hide_item("#ralsp_small");
	
			//set the accordion size to be based off content size
			$(function () {
				$("#accordion").accordion({
					heightStyle: "content",
					collapsible: true
				});
			});
		}; // bigger screens
	
	//	rsg_ui.show_toolbar()
	},
	
	setup_additional_layer_selection: function (filename, layer_option_list_element_id, is_checkbox_checked )
	{
		// set the layer_id to be the file name but without the extension, ...
		/// ... and also stripping the '+' if the filename inside .zip was given to prioritise the layer. 
		var layer_id = helper.remove_file_extension( filename.substring(filename.charAt(0) == '+') );
		var list_of_layer_options = document.getElementById(layer_option_list_element_id);
		var layer = document.createElement("LI");
		var layer_input = document.createElement("input");
		var layer_name = document.createElement("p");
		layer_input.id = layer_id;
		layer_input.type = "checkbox";
		layer_input.name = layer_id;
				
		layer_input.checked = is_checkbox_checked;
				
		layer_input.href = "#";
		layer_input.tabIndex="-1";
		layer_input.classList.add("additional_layer_input");
		
		layer_name.classList.add("additional_layer_input");
		layer_name.innerText=toTitleCase(layer_id.replace(/_/g, ' '));
		
		layer.appendChild(layer_input);
		layer.appendChild(layer_name);
		
		list_of_layer_options.appendChild(layer);
				
	},
	
	add_checkboxes_in_list_element: function(row_id,
	                                         layer_option_list_element_id)
	{
		//~ var layer_id = row_id.replace(/\.[^/.]+$/, "");
		var layer_id = row_id;
		var list_of_layer_options = document.getElementById(layer_option_list_element_id);
		var layer = document.createElement("LI");
		var layer_input = document.createElement("input");
		var layer_name = document.createElement("p");
		layer_input.id = layer_id;
		layer_input.type = "checkbox";
		layer_input.name = layer_id;
				
		// have the checkbox checked if it is in the default overlay layers:
		if (website_state.selected_overlay_layers.indexOf(layer_id) != -1)
		{
			layer_input.checked = true;
		}
		else
			layer_input.checked = false;
		
		layer_input.href = "#";
		//~ layer.data-value="Country Borders";
		layer_input.tabIndex="-1";
		layer_input.classList.add("additional_layer_input");
		
		layer_name.classList.add("additional_layer_input");
		layer_name.innerText=toTitleCase(layer_id.replace(/_/g, ' '));
		
		layer.appendChild(layer_input);
		layer.appendChild(layer_name);
		
		list_of_layer_options.appendChild(layer);
	},
	
	generateButtonTitle: function(id)
	{
		id_part = id.split('_');
		layer_metadata = id_part[0]
		layer_nr = parseInt(layer_metadata.substring(layer_metadata.indexOf(layer_metadata.match(/\d/))))+1
		if(id_part[1] == "settings")
		{
			button_title = "Layer "// + layer_nr;
			button_title += " " + helper.capitaliseWord(id_part[1]);
		}
		
		else if (id_part[1] == "vis")	button_title = "Toggle Layer "// + layer_nr;
		
		else
		{
			button_title = helper.capitaliseWord(id_part[1]) + " "
			button_title += "Layer "// + layer_nr;
		}
		
		if(id_part[1] == "lock")
		{
			button_title += "in time";
		}
		
		return button_title;
	},
	
	addMouseoversToButtons: function()
	{
		all_action_buttons = document.getElementsByClassName("has_onclick_function");
		for(iterator = 0; iterator < all_action_buttons.length; iterator++)
		{
			current_button = all_action_buttons[iterator]
			
			title = rsg_ui.generateButtonTitle(current_button.getAttribute("id"));
			
			current_button.setAttribute('title',title);
		}
	},
	
	
	getLayerButtonNamesById: function(id)
	{
		button_names = []
		if(id == 0){
			button_names.push("layer0_edit_btn");
			button_names.push("layer0_settings_btn");
			button_names.push("layer0_lock_btn");
		}
		else{
			button_names.push("layer" + id +"_edit_btn");
			button_names.push("layer" + id +"_settings_btn");
			button_names.push("layer" + id +"_lock_btn");
			button_names.push("layer" + id +"_remove_btn");
		}
		return button_names;
	},
	add_layer_button: function(td_element_id, functionality, button_id)
	{
		layer_buttons_td = document.getElementById("layer"+td_element_id+"_buttons" );
		// <button id="layer3_remove_btn"   class="layer_settings" onclick="rsg_layers.remove_layer(3)"><span class="ui-icon ui-icon-close"></span></button>
		document.getElementById("layer"+button_id+"_buttons");
		button = document.createElement("BUTTON");
		button.setAttribute("id", "layer"+td_element_id+functionality);
		button.setAttribute("class", "has_onclick_function layer_settings" );
		
		
		icon = document.createElement("span");
		if(functionality == "_remove_btn")
		{
			button.onclick = function(){ rsg_layers.remove_layer(button_id); }; // for internet explorer
			button.setAttribute("onclick", "rsg_layers.remove_layer("+td_element_id+")" ); // for other browsers
			icon.setAttribute("class","ui-icon ui-icon-close");
		}
		
		button.appendChild(icon);
		layer_buttons_td.appendChild(button);
	},
	
	remove_layer_button_by_id: function(button_id)
	{
		// <button id="layer3_remove_btn"   class="layer_settings" onclick="rsg_layers.remove_layer(3)"><span class="ui-icon ui-icon-close"></span></button>
		button = document.getElementById(button_id);
		button.remove();
	},
	
	update_button_functions: function()
	{
		// add 'has_onclick_function' so that a tooltip is displayed on hover:
		elements_with_onclick = document.getElementsByClassName("has_onclick_function");
		for (iterator = 0; iterator < elements_with_onclick.length; iterator++)
		{
			current_id = elements_with_onclick[iterator].id
			revert_to_id = current_id.substring(current_id.indexOf('_')-1, current_id.indexOf('_'))
			rsg_ui_widgets.revert_onclick_function(elements_with_onclick[iterator].id, revert_to_id);
		}
		try{
			// if no layer 
			document.getElementById("layer0_remove_btn").remove();
		}
		catch(error){
			//already removed
		}
	},
	
	//When the settings button for a layer is clicked, set that to be the active data leyer and the settings menu makes changes to that layer. 
	//If it is shown, it will hide the menu.
	toggle_toolbar: function(new_active_layer) {
		remove_initial_glow();
		if (toolbar_visible) {
			//If the toolbar menu is visible, and the active layer toolbar menu button is clicked, hide the menu.
			rsg_ui.hide_toolbar();
		} else {
			//otherwise show the menu
			rsg_ui.show_toolbar();
			if(small_screen) rsg_ui.hide_settings();
		};
	},
	
	toggle_loading_status: function() {
		website_state.show_loading_status = !website_state.show_loading_status;
		var status_monitoring_div = document.getElementById("status-monitoring");
		var show_loading_status_button_label = document.getElementById("show_loading_status_button_label");
		var show_loading_status_button_icon = document.getElementById("show_loading_status_button_icon");
		
		if (website_state.show_loading_status)
		{
			status_monitoring_div.classList.remove("off");
			show_loading_status_button_label.innerHTML = "hide loading status";
			show_loading_status_button_icon.classList.remove("ui-icon-circle-b-triangle-s");
			show_loading_status_button_icon.classList.add("ui-icon-circle-b-triangle-n");
			
		}
		else
		{
			status_monitoring_div.classList.add("off");
			show_loading_status_button_label.innerHTML = "show loading status";
			show_loading_status_button_icon.classList.remove("ui-icon-circle-b-triangle-n");
			show_loading_status_button_icon.classList.add("ui-icon-circle-b-triangle-s");

		}
		
		
		
	},
	
	//When the settings button for a layer is clicked, set that to be the active data leyer and the settings menu makes changes to that layer. 
	//If it is shown, it will hide the menu.
	toggle_settings: function(new_active_layer) 
	{
		if (settings_visible && new_active_layer == active_data_layer) {
			//If the settings menu is visible, and the active layer settings menu button is clicked, hide the menu.
			rsg_ui.hide_settings();
		} else {
			//otherwise show the menu
			rsg_ui.show_settings();
			//set the active data layer to be the new layer picked.
			active_data_layer = new_active_layer;
			//Update the text content in the menu
			data_name = rsghelper_layers.get_layer_copy_by_id(active_data_layer).data_long;
			layer_sensor = rsghelper_layers.get_layer_copy_by_id(active_data_layer).source;
			document.getElementById("layer_data").textContent = data_name;
			document.getElementById("layer_source").textContent = layer_sensor;
		};
	},
	
	
	//Similar function to the toggle settings but for the add data menu. Show/hide the settings menu and data menu.
	//The add data menu is not shown without the settings menu.
	toggle_add_layer: function(new_active_layer)
	{
		if (!settings_visible && !data_select_menu_visible) {
			rsg_ui.toggle_settings(new_active_layer);
			rsg_ui.show_data_select();
		} else if (!data_select_menu_visible) {
			active_data_layer = new_active_layer;
			data_name = rsghelper_layers.get_layer_copy_by_id(active_data_layer).data_long;
			document.getElementById("layer_data").textContent = data_name;
			document.getElementById("layer_source").textContent = rsghelper_layers.get_layer_copy_by_id(active_data_layer).source;
			rsg_ui.show_data_select();
		} else if (active_data_layer == new_active_layer) {
			rsg_ui.hide_data_select();
		} else {
			rsg_ui.show_data_select();
			rsg_ui.toggle_settings(new_active_layer);
		};
	},
	
	toggle_layer_date_locking: function(layer_id)
	{
		date_time_string = ""
		requested_layer = rsghelper_layers.get_layer_copy_by_id(layer_id);
		requested_layer_element = document.getElementById("layer"+layer_id+"_locked_date");
		requested_button_element = document.getElementById("layer"+layer_id+"_lock_button_icon");
		
		// 'off' is the class containing "display : none" style, so ...
		// ... if it is off, that indicates that it is currently unlocked (no date displayed)
		if( requested_layer_element.classList.contains("off") ) {
			rsg_ui.lock_layer(layer_id)
		}
		else {
			// reload set to true means if the layer was locked at 2020-05-05,
			// ... but now the timepicker is set to 2020-02-02,
			// ... then reload = true loads that previously
			// ... locked layer at 2020-05-05 to date 2020-02-02
			rsg_ui.unlock_layer(layer_id, reload=true)
		}
		
	},
	
	lock_layer: function (layer_id)
	{	
		requested_layer = rsghelper_layers.get_layer_copy_by_id(layer_id);
		requested_layer_element = document.getElementById("layer"+layer_id+"_locked_date");
		requested_button_element = document.getElementById("layer"+layer_id+"_lock_button_icon");
		
		requested_layer_element.classList.remove("off");
		requested_button_element.classList.remove("ui-icon-unlocked");
		requested_button_element.classList.add("ui-icon-locked");
		
		timepicker_state["layer"+layer_id]["locked_date"] = $("#datepicker-13").val();
		date_time_string += timepicker_state["layer"+layer_id]["locked_date"];
		if(timepicker_state.on) {
			timepicker_state["layer"+layer_id]["locked_time"] = timepicker_state.value;
			date_time_string += " " +  $('#timepicker').val()
		}		
		// (locked time might need resetting if some other layer with higher temporal resolution was loaded before)
		else timepicker_state["layer"+layer_id]["locked_time"] = -1 
		requested_layer_element.innerText = "Locked at: " + date_time_string;
	},
	
	unlock_layer: function (layer_id, reload)
	{
		// 'reload' is optional, default - false
		if (reload === undefined) reload = false
		
		requested_layer = rsghelper_layers.get_layer_copy_by_id(layer_id);
		requested_layer_element = document.getElementById("layer"+layer_id+"_locked_date");
		requested_button_element = document.getElementById("layer"+layer_id+"_lock_button_icon");
		
		requested_layer_element.innerText = "test";
		requested_layer_element.classList.add("off");
		requested_button_element.classList.remove("ui-icon-locked");
		requested_button_element.classList.add("ui-icon-unlocked");
		timepicker_state["layer"+layer_id]["locked_date"] = -1;
		timepicker_state["layer"+layer_id]["locked_time"] = -1;
		
		// if reload flag is explicitly set to true, then make the layer 
		// ... match the date in timepicker.
		if (reload) update_single_layer_data_time(layer_id)
	},
	
	toggle_animation_buttons: function (turn_on)
	{ /* in HTML, the three buttons should look like this:
		<td><button class="layer_settings" onclick="rsg_animation.pause_animation()"><span class="ui-icon ui-icon-pause"></span></button></td>
		<td><button class="layer_settings" onclick="rsg_animation.stop_animation()"><span class="ui-icon ui-icon-stop"></span></button></td>
		<td><button class="layer_settings" onclick="rsg_animation.go_back_to_paused_animation()"><span class="ui-icon ui-icon-seek-first"></span></button></td>
		*/
		if(turn_on){
			// the 'off' class is set to display : none, so, removing that:
			document.getElementById("animation_stop_button").classList.remove("off");
			document.getElementById("animation_rewind_button").classList.remove("off");
			
			// turn off the animation UI 
			document.getElementById("animation_ui").classList.remove("ui_on");
			document.getElementById("animation_ui").classList.add("ui_off");
			
			// change icon from 'play' to 'pause'
			document.getElementById("animation_icon").classList.remove("ui-icon-play");
			document.getElementById("animation_icon").classList.add("ui-icon-pause");
			
			// change the onclick function to now pause the animation
			document.getElementById("animation_button").onclick = function (){rsg_animation.pause_animation();}	
		}
		else{
			// adding class 'off', which has 'display : none'
			document.getElementById("animation_stop_button").classList.add("off");
			document.getElementById("animation_rewind_button").classList.add("off");
			
			// change icon from 'pause' to 'play'
			document.getElementById("animation_icon").classList.remove("ui-icon-pause");
			document.getElementById("animation_icon").classList.add("ui-icon-play");
			
			// change the onclick function to now pause the animation
			document.getElementById("animation_button").onclick = function (){rsg_animation.play();}	
		}
	},
	
		// highlight elements in the toolbar. 
	// change the txt_highlight in the css file to change the colour etc.
	toggle_layer_active: function (layer) 
	{
		if( (!rsghelper_layers.layer_is_highlighted(layer)) && (rsghelper_layers.layer_is_checked(layer)) ) {
			//~ alert("timepicker state");
			if(!isNaN(timepicker_state["layer"+layer]["time"])) {
				rsg_timepicker.update_timepicker_state("nr_current_active_layer", layer, "change active layer")
				//~ rsg_timepicker.update_timepicker_state("value", timepicker_state["layer"+layer]["time"], "update");
				//~ rsg_timepicker.update_timepicker_state("step", timepicker_state["layer"+layer]["step"], "update");
				//~ rsg_timepicker.turn_on_timepicker();
			}
			else rsg_timepicker.turn_off_timepicker();
			
			rsg_ui.remove_all_highlights();
			rsg_ui.highlight_layer(layer);
		}
	},
	
	toggleColourbar: function()
	{
		if(document.getElementById("colourbar").classList.contains("colourbar_off")){
			document.getElementById("colourbar").classList.remove("colourbar_off");
			document.getElementById("colourbar").classList.add("colourbar_on");
			
			document.getElementById("colourbar_toggle_button").classList.remove("toggle_off");
			document.getElementById("colourbar_toggle_button").classList.add("toggle_on");
		}
		else{
			document.getElementById("colourbar").classList.remove("colourbar_on");
			document.getElementById("colourbar").classList.add("colourbar_off");
			
			document.getElementById("colourbar_toggle_button").classList.remove("toggle_on");
			document.getElementById("colourbar_toggle_button").classList.add("toggle_off");
		}
	},
	toggle_time_ui: function()
	{
		if(document.getElementById("time-selection-ui").classList.contains("time-selection-ui_off")){
			document.getElementById("time-selection-ui").classList.remove("time-selection-ui_off");
			document.getElementById("time-selection-ui").classList.add("time-selection-ui_on");
			
			document.getElementById("time-toggle-button").classList.remove("toggle_off");
			document.getElementById("time-toggle-button").classList.add("toggle_on");
		}
		else{
			document.getElementById("time-selection-ui").classList.remove("time-selection-ui_on");
			document.getElementById("time-selection-ui").classList.add("time-selection-ui_off");
			
			document.getElementById("time-toggle-button").classList.remove("toggle_on");
			document.getElementById("time-toggle-button").classList.add("toggle_off");
		}
		/*
		time_ui = document.getElementById("time-selection-ui");
		if(document.getElementById("time-selection-ui").classList.contains("left")){
			time_ui.style = "left: 200px;"
			time_ui.classList.remove("left");
			time_ui.classList.add("right");
		}
		else{
			time_ui.style = "left: -600px;"
			time_ui.classList.remove("right");
			time_ui.classList.add("left");
		}
		*/
	},
	
	doubleClickToggleColourbar: function(){
		rsg_ui.hide_colourbar();
	},

	
	highlight_layer: function(layer)
	{
		active_data_layer = layer;
		rsg_timepicker.update_timepicker_state("nr_current_active_layer", layer, "change active layer");
		document.getElementById(rsghelper_layers.get_layer_name_by_id(layer) + "_data").classList.add("txt_highlight");
		document.getElementById(rsghelper_layers.get_layer_name_by_id(layer) + "_source").classList.add("txt_highlight");
		load_and_show_colour_bar(layer);
	},
	
	remove_highlight: function(layer)
	{
		document.getElementById(rsghelper_layers.get_layer_name_by_id(layer) + "_data").classList.remove("txt_highlight");
		document.getElementById(rsghelper_layers.get_layer_name_by_id(layer) + "_source").classList.remove("txt_highlight");
	},
	
	remove_all_highlights: function()
	{
		for (l = 0; l < 4; l++) {
			rsg_ui.remove_highlight(l);
		}
	},
	
	// The #settings_menu indicates that the div element is being addressed.
	hide_settings: function() {
		$(function () {
			$("#settings_menu").hide();
		});
		if (data_select_menu_visible) {
			rsg_ui.hide_data_select();
		};
		settings_visible = false;
	},
	show_settings: function() {
		if (!small_screen) {
			$(function () {
				$("#settings_menu").show();
			});
			settings_visible = true;
		}
		else{
			rsg_ui.hide_toolbar();
			$("#settings_menu").show();
			settings_visible = true;
		}
	},
	
	hide_data_select: function() {
		$(function () {
			$("#data_select_menu").hide();
		});
		data_select_menu_visible = false;
	},
	
	show_data_select: function() {
		$(function () {
			$("#data_select_menu").show();
		});
		data_select_menu_visible = true;
	},
	
	hide_toolbar: function() {
			hide_item("#toolbar");
			show_item("#layer_data_shown");
			toolbar_visible = false;
	},
	hide_events: function(){
			hide_item("#events_dropdown");
	},
			
	
	show_toolbar: function() {
	// Display toolbar for adding layers below RAL Space logo and date DIV
	// (note: show before adjusting position or values not set)
		show_item("#toolbar");
		hide_item("#layer_data_shown");
		toolbar_visible = true;
		toolbar = document.getElementById("toolbar");
		toolbar.setAttribute('style','top:165px; right: 5px; z-index:9;');
	},
	
	update_toolbar_position_relative_to: function(element)
	{
		$("#toolbar").position({
			my:        "left top",
			at:        "left bottom",
			of:        element,
			collision: "fit"
		});
	},
	
	show_colourbar: function() 
	{
		if (!small_screen) {
			$(function () {
				$("#colourbar").show();
			});
			colourbar_vis = true;
		}
		else{
			units = document.getElementById("colourbar_units").innerText;
			$("#colourbar_units").remove();
			mobile_phone_unit_row=document.createElement("TR");
			mobile_phone_unit_row.id = "colourbar_units";
			mobile_phone_unit_row.innerText = units;
			document.getElementById("image_and_units").appendChild(mobile_phone_unit_row); 
			$("#colourbar").show();   
		}
	},
	
	hide_colourbar: function() 
	{
		$(function () {
			$("#colourbar").hide();
		});
		colourbar_vis = false;
	},
	
	close: function(elements)
	{
		for(iterator = 0; iterator < elements.length; iterator++)
		{
			element=document.getElementById(elements[iterator])
			element.classList.remove("on");
			element.classList.add("off");
		}
	},
	
	check_close: function(elements)
	{
		for(iterator = 0; iterator < elements.length; iterator++)
		{
			element=document.getElementById(elements[iterator])
			if (element.classList.contains("on")){
				element.classList.remove("on");
				element.classList.add("off");
			}
		}
	},
	
	open: function(elements)
	{
		for(iterator = 0; iterator < elements.length; iterator++)
		{
			element=document.getElementById(elements[iterator])
			element.classList.add("on");
			element.classList.remove("off");
		}
	},
	
	toggle_overlay_window: function()
	{
		if(document.getElementById("overlays-options").classList.contains("off")){
			document.getElementById("overlays-options").classList.remove("off");
			document.getElementById("overlays-options").classList.add("on");
		}
		else {
			document.getElementById("overlays-options").classList.remove("on");
			document.getElementById("overlays-options").classList.add("off");
		}
	},
	
	// ----------- program buttons to navigate through time ----------- //
	
	//function called on click of next day button. 
	next_day: function() 
	{
		
		for (id = 0; id < 4; id++)
		{
			var firefox_debug = document.getElementById("layer"+id+"_");
			firefox_debug.innerHTML = rsghelper_layers.get_layer_copy_by_id(id).assigned_subproperties;
		}
		
		//get the current date (today)
		var cd = helper.formatDate(new Date());
		//get the date from the calendar picker
		ymd = document.getElementById("datepicker-13").value;
		var year = ymd.substring(0, ymd.indexOf("/"));
		var month = ymd.substring(ymd.indexOf("/") + 1, ymd.lastIndexOf("/"));
		var day = ymd.substr(ymd.lastIndexOf("/") + 1);
	
		//get the new date (1 day forward from calendar)
		//js month index starts at 0
		var nd = new Date(+new Date(year, month - 1, day) + 1000 * 60 * 60 * 24);
		nd = helper.formatDate(nd);
	    check_date_for_events(nd);
		//if the new date is before today, or is today, update the calendar and layers.
		//this stops user from being able to navigate to date in the future.
		if (helper.compareTime(cd, nd) || cd == nd) {
			$(function () {
				// update datepicker displayed date
				$("#datepicker-13").val(nd);
			})
			reload_layer_images_on_new_datetime()
		}
	},
	
	//function called on click of next month button.
	next_month: function()
	{
		//get the current date
		var cd = helper.formatDate(new Date());
		//get the date from the calendar picker
		ymd = document.getElementById("datepicker-13").value;
		var year = ymd.substring(0, ymd.indexOf("/"));
		var month = ymd.substring(ymd.indexOf("/") + 1, ymd.lastIndexOf("/"));
		var day = ymd.substr(ymd.lastIndexOf("/") + 1);
	
		//get the new date (1 month forward from calendar)
		//js month index starts at 0
		var nd = new Date(+new Date(year, month, day));
		nd = helper.formatDate(nd);
	
	    check_date_for_events(nd);
		//if the new date is before today, or is today, update the calendar and layers.
		//this stops user from being able to navigate to date in the future.
		if (helper.compareTime(cd, nd) || cd == nd) {
			$(function () {
				$("#datepicker-13").val(nd);
			})
		} else {
			$(function () {
				$("#datepicker-13").val(cd);
			})
		}
		reload_layer_images_on_new_datetime();
	},
	
	//function called on click of previous day button.
	prev_day: function()
	{
		for (id = 0; id < 4; id++)
		{
			var firefox_debug = document.getElementById("layer"+id+"_");
			firefox_debug.innerHTML = rsghelper_layers.get_layer_copy_by_id(id).assigned_subproperties;
		}
		//get the date from the calendar
		ymd = document.getElementById("datepicker-13").value;
		var year = ymd.substring(0, ymd.indexOf("/"));
		var month = ymd.substring(ymd.indexOf("/") + 1, ymd.lastIndexOf("/"));
		var day = ymd.substr(ymd.lastIndexOf("/") + 1);
	
		//get the new date (1 day backward from calendar)
		//js month index starts at 0
		var nd = new Date(+new Date(year, month - 1, day) - 1000 * 60 * 60 * 24);
		nd = helper.formatDate(nd);
	
	    check_date_for_events(nd);
		//update the calendar and layers.
		$(function () {
			$("#datepicker-13").val(nd);
		})
		
		reload_layer_images_on_new_datetime()
	},
	
	//function called on click of previous day button
	prev_month: function()
	{
		//get the date from the calendar
		ymd = document.getElementById("datepicker-13").value;
		var year = ymd.substring(0, ymd.indexOf("/"));
		var month = ymd.substring(ymd.indexOf("/") + 1, ymd.lastIndexOf("/"));
		var day = ymd.substr(ymd.lastIndexOf("/") + 1);
	
		//get the new date (1 month backward from calendar)
		//js month index starts at 0
		var nd = new Date(+new Date(year, month - 2, day));
		nd = helper.formatDate(nd);
	
	    check_date_for_events(nd);
		//update the calendar and layers
		$(function () {
			$("#datepicker-13").val(nd);
		})
		reload_layer_images_on_new_datetime()
	},

	set_draggable: function(element_id)
	{
		$(function () {
			$(element_id).draggable({
				scroll: false,
				containment: "document"
			});
		});
	}
	
}
