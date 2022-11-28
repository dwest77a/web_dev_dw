/* 
 * rsg_layer_functions.js has the namespace 'rsg_layers'
 * in this file, the collection of functions take care of loading, ...
 * adding, editing, updating names and etc ... the website data layers
 * 
 * the following namespaces are used:
 * - 'rsg_timepicker'  namespace from 'rsg_timepicker.js',
 * 
 * - 'helper', 
 *   'rsghelper_layers' 
 *                     namespaces from 'rsg_helper_functions.js',
 * - 'rsg_ui'          namespace from 'user_interface.js'
 * 
 * - 'rsg_colour'      namespace from 'rsg_colour_picker.js'
 * 
 * as well as some functions from 'data_selection.js', which are ...
 * ... currently also not under any namespace.
 */
// global variables to save the previous layer of the animation
// (needed to keep one previous layer loaded and then remove it
//  ... for layers 1, 2 and 3 - layer 0 works as a special case)
var previous_layer1 = [];
var previous_layer2 = [];
var previous_layer3 = [];
var rsg_layers = {
	set_layer_property: function(layer_id, key, value)
	{
		switch (layer_id) {
			case 0:
				layer0[key] = value;
				break;
			case 1:
				layer1[key] = value;
				break;
			case 2:
				layer2[key] = value;
				break;
			case 3:
				layer3[key] = value;
				break;
		};
	},

	find_first_not_hidden_layer: function ()
	{ for (i = 0; i < 4; i++)
		{
			if (rsghelper_layers.get_layer_copy_by_id(i).hidden == "true"){
				return i;
			}
		}
	},
	
	//add layer button in menu. Adds a new layer option and displays data selction menu.
	add_layer: function() 
	{ // when a NEW layer is added, set the global flag to false so that the new layer will be active (highlighted)
		date_or_time_changed = false;
		// if there is a sandwiched empty layer between
		// ... two layers that are both on - load the new layer there:
		var layer_id_to_add =  rsg_layers.find_first_not_hidden_layer()
		rsg_layers.set_layer_property(layer_id_to_add, "data_long", "New Layer");
		//~ rsghelper_layers.get_layer_copy_by_id(layer_id_to_add).data_long = "New Layer"
		rsg_layers.update_names()
		rsg_ui.toggle_add_layer(layer_id_to_add)
	},
	
	
	//Needed to run after the layers are updated. Layer 0 is on the top.
	reshuffle_layers: function() 
	{
		for (a = 3; a >= 0; a--) 
		{
			layers.raiseToTop(rsghelper_layers.get_layer_copy_by_id(a));
			//~ layers.raiseToTop(png_country_borders);
		};
		
		// get the overlay layer identifiers from the website_state.overlay_layers dictionary:
		all_overlay_layers = Object.keys( website_state.overlay_layers );
		// iterate through all the name identifiers raising them on top of data layers:
		for (iterator = 0; iterator < all_overlay_layers.length; iterator++)
		{
			// and then raise the overlay layers to top, so that they do not get obstructed by data layers:
			viewer.imageryLayers.raiseToTop( website_state.overlay_layers[ all_overlay_layers[iterator] ] );
		}
	},
	
	ifErroneousLayer: function(layer)
	{
		if (layer.data_short == "Configuration tables have been modified")
		{
			return true
		}
		else{
			return false
		}
	},
	//Update function that updates the text values in the overlays menu when a change is made.
	update_names: function() 
	{ for (k = 0; k < 4; k++) {
			//update the dta long name
			current_layer = rsghelper_layers.get_layer_copy_by_id(k);
			layer_data = rsghelper_layers.get_layer_copy_by_id(k).data_long;
			x = document.getElementById(rsghelper_layers.get_layer_name_by_id(k) + "_data");
			info = document.getElementById(rsghelper_layers.get_layer_name_by_id(k) + "_info");
			
			x.textContent = layer_data;
			if(layer_data == "empty layer"){
				info.textContent = "";		
			}
			else{
				info.textContent = layer_data;		
			}
			
			//update the data source
			layer_source = rsghelper_layers.get_layer_copy_by_id(k).source;
			y = document.getElementById(rsghelper_layers.get_layer_name_by_id(k) + "_source");
			if(rsg_layers.ifErroneousLayer(current_layer))
				{ y.textContent = current_layer.data_short; }
			else y.textContent = layer_source;
			//hide layer in menu if empty
			if (layer_data == "empty layer") {
				hide_item("#" + rsghelper_layers.get_layer_name_by_id(k) + '_r1')
				hide_item("#" + rsghelper_layers.get_layer_name_by_id(k) + '_r2')
			} else {
				show_item("#" + rsghelper_layers.get_layer_name_by_id(k) + '_r1')
				show_item("#" + rsghelper_layers.get_layer_name_by_id(k) + '_r2')
			}
			//hide add layer button if 4 layers are active
			if (rsghelper_layers.getNr_not_hidden_layers() == 4) {
				//~ hide_item("#add_layer_row") previous solution, commented out on 2020-01-13
				button = document.getElementById("add_layer");
				button.innerText = "Maximum Reached";
				button.disabled = true;
				button.classList.add("buttonDisabled");
			}
		};
	},
	
	/*
	 * given a layer (object), a link to the image and coordinates (optional) ...
	 * replaces old imagery provider source with the specified one
	 * (can be used to delete the image source if empty.png is specified as image)
	 */
	edit_layer_png: function(layer, png_url, latlon, layer_id, tiled_image) 
	{ //change the imagery provider of a layer object.
		
		// at this point, the layer png has been downloaded online ...
		// ... so the global website state of layers downloading is updated:
		website_state.layers_currently_downloading--; // decrease currently downloading layers by 1
		var download_test_widget = document.getElementById("download-test");
		download_test_widget.innerHTML = "Downloading nr. of images: " + website_state.layers_currently_downloading;
		
		
		var loading_test = document.getElementById("loading-test");
		// update the status from 'Downloading' to 'Loading':
		loading_test.innerHTML = "Loading ..."; 
		
		var loading_layer_status = document.getElementById("layer"+layer_id+"_loading_status");
		loading_layer_status.innerHTML = "Loading ... ";

		// #AllowDayPicking		
		// If wanted to allow changing days, can do here when downloading is 0 ...
		// ... when all DOWNLOADED, allow changing days:
		if (website_state.layers_currently_downloading == 0)
		{
			var time_selector = document.getElementById("time_control_ui");
			time_selector.classList.remove("disabledTag");
		}
		
		// first, deal with optional variables:
		if(tiled_image === undefined) tiled_image = false
		
		//default latlon is entire globe coverage:
		if (latlon == "empty" || latlon == undefined) 
		{
			var west = -180
			var south = -90
			var east = 180
			var north = 90
		}
		else // if not default case:
		{ //get latlon coordinates
			var coords = latlon.substring(1, latlon.length - 1);
			coords = coords.split(",")
			var west = coords[0]
			var south = coords[1]
			var east = coords[2]
			var north = coords[3]
		}
		if(!website_state.currently_in_animation){
			//remove previous layer. Resets the object hence redefinition of data paramters.
			layers.remove(layer, false);
			// if the layer source has changed after just playing the animation,
			// ... remove the leftover animation images too:
			remove_nr_of_layers = remove_previous_layers[layer_id].length
			for(i = 0; i < remove_nr_of_layers; i++){
				layers.remove(remove_previous_layers[layer_id][i], false);
			}
		}
		
		var found_tiles = false;
		
		if (tiled_image)
		{ // since at this point we trust that tiles exist (checked in 'loadImgResource') ...
			tiles_url = png_url.split('.').slice(0, -1).join('.') + '/';
			found_tiles = data_exists_in_url( tiles_url );
		}
		
		if (found_tiles)
		{
			// ... proceed to load in the tiles:
			tiles_url = png_url.split('.').slice(0, -1).join('.') + '/'
			console.log("tiles exist, loading tiles at url" + tiles_url)
				
			UTIP = new Cesium.UrlTemplateImageryProvider({
				url : Cesium.buildModuleUrl(tiles_url+'/{z}/{x}/{reverseY}.png'),
				// using the WebMercatorTilingScheme:
				/* A tiling scheme for geometry referenced to a WebMercatorProjection, EPSG:3857. 
				 * This is the tiling scheme used by Google Maps, Microsoft Bing Maps, and most of ESRI ArcGIS Online. */
				tilingScheme : new Cesium.WebMercatorTilingScheme(),
				// @TODO fix the pole holes (asked Cesium forum for help on 2020-07-06)
				//~ tilingScheme :  new Cesium.GeographicTilingScheme(),
				//~ tilingScheme : new Cesium.TilingScheme(),
				//~ northPoleColor : new Cesium.Cartesian3(1.0, 1.0, 1.0),
				maximumLevel : 5 // set maximum tiling detail level     
			});
			
			new_png_layer = layers.addImageryProvider(UTIP);
			
			// fire an event when Cesium loads the image layer
			UTIP.readyPromise
			.then(function() {
					//~ alert("@TILES_READY");
					loading_layer_status.classList.add("off");
			});
		}
		
		/*
		if (tiled_image == true)
		{ // 2020-04-29
			// remove .ext extension and add '/' at the end
			tiles_url = png_url.split('.').slice(0, -1).join('.') + '/'
			
			var request;
			if(window.XMLHttpRequest)
			    request = new XMLHttpRequest();
			else
			    request = new ActiveXObject("Microsoft.XMLHTTP");
			    
			request.open('GET', tiles_url, false);
			request.send(); // there will be a 'pause' here until the response to come.
			// the object request will be actually modified
			if (request.status === 404)
			{
				// if the tiles do not exist, fall back on loading entire png:
				loading_layer_status.innerHTML = "Downloading ... ";
				console.log("tiles DO NOT exist, loading png at url" + png_url);
				
				var imgObj = new Image();
				imgObj.onload = function () 
				{ 
					loading_layer_status.innerHTML = "Loading ... ";
					var STIP = new Cesium.SingleTileImageryProvider({
						url: png_url,
						rectangle: Cesium.Rectangle.fromDegrees(west, south, east, north),
						alpha: 1,
						minificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
						magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
					});
				  
					new_png_layer = layers.addImageryProvider(STIP);
					
					// fire an event when Cesium loads the image layer
					STIP.readyPromise
	        .then(function() {
	            //~ alert("@READY");
	            loading_layer_status.classList.add("off");
	        });
				};
				
				imgObj.onerror = function () {
					download_test_widget.innerHTML = "error"
					rsg_layers.noData(layer_id, true)
				};
				
				imgObj.src = png_url;
			}
			else // if tiles exist:
			{
				console.log("tiles exist, loading tiles at url" + tiles_url)
				
				UTIP = new Cesium.UrlTemplateImageryProvider({
					url : Cesium.buildModuleUrl(tiles_url+'/{z}/{x}/{reverseY}.png'),
					// using the WebMercatorTilingScheme:
					/* A tiling scheme for geometry referenced to a WebMercatorProjection, EPSG:3857. 
					 * This is the tiling scheme used by Google Maps, Microsoft Bing Maps, and most of ESRI ArcGIS Online.
					tilingScheme : new Cesium.WebMercatorTilingScheme(),
					maximumLevel : 5 // set maximum tiling detail level     
				});
				
				new_png_layer = layers.addImageryProvider(UTIP);
				
				// fire an event when Cesium loads the image layer
				UTIP.readyPromise
        .then(function() {
            //~ alert("@TILES_READY");
            loading_layer_status.classList.add("off");
        });
				
			}
		}
			*/
			
		// ---------------------------------------------------------------- TESTING AVHRR TILES ---------------------------------------------------------------- // 

		else
		{
			var STIP = new Cesium.SingleTileImageryProvider({
				url: png_url,
				rectangle: Cesium.Rectangle.fromDegrees(west, south, east, north),
				alpha: 1,
				minificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
				magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST
			});
			
			new_png_layer = layers.addImageryProvider(STIP);
			
			STIP.readyPromise
			.then(function () {
				loading_layer_status.classList.add("off");
			});
		}
		current_num_of_layers = layers._layers.length;
		last_loaded_layer = layers._layers[current_num_of_layers-2];
		
		// get colourbar url from variable index and project table 
		colourbar_url = get_colourbar_url(rsghelper_layers.get_layer_copy_by_id(layer_id).variable_index, 
		                                  rsghelper_layers.get_layer_copy_by_id(layer_id).project_table);
		
		// ---------- HANDLING DYNAMICALLY COLOURED IMAGES (B&W) ----------- //
		
		if ( (colourbar_url == "dynamic") && (png_url.substring(0, 4) != "data") )
		{ // if png_url was passed as base 64 data, no need to fetch it ...
			// ... to extract xml tags
			fetch(png_url)
			.then(res => res.blob()) // Gets the response and returns it as a blob
			.then(blob => {
				// Here's where you get access to the blob
				// And you can use it for whatever you want
				// Like calling ref().put(blob)
				
				// saving the memory locations where the xmp XML tags begin:
				var xpackage_begin = 0; // xmp begin index
				var xpackage_end = 0; // xmp end index
				
				var terminator = "TBD"; // if there are no xmp tags, stop searching upon finding this ASCII byte array 
				var xml_start = "<?xpacket begin"; // the start tag to match against
				var xml_end = "<?xpacket end";     // the end tag to match against
				
				// when a byte matches a character from the xml start and end tags, 
				// ... increment and keep on investigating further
				var matching_char_index = 0; 
				
				(async function() 
				{ // run asynchronously, because we will be waiting for the xml tags:
					try
					{
						var xml_xmp_info = await get_xml_tags_from_blob(blob);
						/** access the custom 'rsg' tags like this:
						 - rsg_dynamic_colour = xmlDoc.getElementsByTagName("xmp:rsg_dynamic_colour")[0]
						 - colour             = xmlDoc.getElementsByTagName("xmp:rsg_dynamic_colour")[0].childNodes[0].data
						 - units              = xmlDoc.getElementsByTagName("xmp:rsg_units")[0].childNodes[0].data
						 - colour table       = xmlDoc.getElementsByTagName("xmp:rsg_colour_table")[0].childNodes[0].data
						*/
						
						// if the colour table is specified (colour-table holds colour mappings)
						colour_table_name = xmlDoc.getElementsByTagName("xmp:rsg_colour_table")[0].childNodes[0].data
						
						var units = xmlDoc.getElementsByTagName("xmp:rsg_units")[0].childNodes[0].data;
						var short_id = xmlDoc.getElementsByTagName("xmp:rsg_short_name")[0].childNodes[0].data;
						// hardcoded values here, but should be later stored with other xml data:
						var max_value = 0.20;
						var min_value = 0.05;
						
						// the colour table will take the following format:
						// ... representatio in JavaScript dictionary as 'greyscale value' : 'RGBA' 
						var colour_table = get_dynamic_colour_table(colour_table_name);
						
						// create an img object with the source being the greyscale image url:
						var layer_img_obj = new Image;
						layer_img_obj.src = png_url;
						layer_img_obj.onload = function()
						{ // wait for the image to fully load before recolouring
							
							// colour the grayscale image with the given colour table mappings:
							recoloured_png_url = rsg_colour.dynamically_color_image(layer_img_obj, layer_id, colour_table);
							
							// load that new image (as JavaScript canvas outputs a base64 image, that then needs to be loaded)
							rsg_layers.edit_recoloured_layer_data(layer_id, recoloured_png_url, false);
							
							// dynamically make the colourbar from the tags given (makes the base colourbar image from the ...
							// ... 256 passed in colour values of the colour table
							colourbar_base_img_url = rsg_colour.dynamically_make_colourbar(colour_table, units, short_id, max_value, min_value);
							
							requested_layer = rsghelper_layers.get_layer_copy_by_id(layer_id);
							requested_layer.colourbar_base_img_url = colourbar_base_img_url;
							
							// since the colourbar uses units and short id to display those values on the colourbar div, ...
							// ... write those here for later access when switching back and forth
							// (note, the first colourbar is loaded with us manualy specifying the necessary elements)
							requested_layer.units      = units;
							requested_layer.data_short = short_id;
							
							requested_layer.max_label  = xmlDoc.getElementsByTagName("xmp:rsg_max")[0].childNodes[0].data;
							requested_layer.min_label  = xmlDoc.getElementsByTagName("xmp:rsg_min")[0].childNodes[0].data;
							
							information_package = {"max_label" : xmlDoc.getElementsByTagName("xmp:rsg_max")[0].childNodes[0].data,
							                       "min_label" : xmlDoc.getElementsByTagName("xmp:rsg_min")[0].childNodes[0].data}
							
							loadcbarResource(colourbar_base_img_url, short_id, units, "dynamic", information_package);
							
						};
						
					}
					catch (error)
					{
						result = error;
						console.log("ERROR: loading the dynamic image exited with error: " + result);
					}
					
				})();
			
			});
			
			
		}
		
		var tile_test_widget = document.getElementById("tiles-test");
		var percentage_loaded = 0;
		
		
		var helper = new Cesium.EventHelper();
		helper.add(viewer.scene.globe.tileLoadProgressEvent, function (event)
		{
			tile_test_widget.innerHTML = "Tiles to load: " + event;
			
			if ( (!website_state.loading_layer) || (website_state.tiles_to_load < event) )
			{
				website_state.tiles_to_load = event;
				website_state.loading_layer = true;
			} 
			
			percentage_loaded = 100 - (event / website_state.tiles_to_load) * 100;
			loading_test.innerHTML = "Loading Tiles " + Math.round(percentage_loaded) + "% ..."; 
			
			if (event == 0) 
			{
				if(website_state.layers_currently_downloading == 0)
				{
					loading_test.innerHTML = "Turn off";
					website_state.loading_layer = false;
					
					// hide the button to toggle the loading status when data has finished loading:
					var show_loading_status_button = document.getElementById("show_loading_status_button");
					show_loading_status_button.classList.add("off");
					
					// #AllowDayPicking
					// allow changing days when all layers have loaded:
					// (this allows only after loading, significant time)
					//~ var time_selector = document.getElementById("time_control_ui");
					//~ time_selector.classList.remove("disabledTag");
					
					if (website_state.show_loading_status)
					{
						// @inter_bug (intermittent bug)
						document.getElementById("status-monitoring").classList.add("off");
						console.log("debugging layers that sometimes get rendered on top:");
						for (var it = 1; it < layers._layers.length; it++)
							console.log(it + ")" + layers._layers[it].data_short);
					}
						
						
				}
				else loading_test.innerHTML = "Waiting for images to download ...";
				
			}
		});
		
		
		return new_png_layer
	},
	
	
	toggle_layer_visibility: function(layer_id)
	{ checkbox_id = rsghelper_layers.get_layer_name_by_id((layer_id)) + "_vis";
		if(document.getElementById(checkbox_id).checked){
			rsghelper_layers.get_layer_copy_by_id(layer_id).alpha = 1;
			rsg_ui.remove_all_highlights();
			rsg_ui.highlight_layer(layer_id);
		}
		else{
			rsghelper_layers.get_layer_copy_by_id(layer_id).alpha = 0;
			if(rsghelper_layers.layer_is_highlighted(layer_id)){
				rsg_ui.remove_highlight(layer_id);
				rsg_ui.hide_colourbar();
				rsg_layers.make_topmost_checked_on_layer_active();
			}
		}
		viewer.scene.requestRender();
	},
	
	//Updates the transparency of a layer given the index. 
	//If the layer is active (checkbox checked) ... 
	// ...and the settings menu is open for it (active data layer), ...
	// the slider will control that transparency.
	//set so the top visible layer is highlighted and has the colourbar shown.
	update_transparency: function(layer, data_changed)
	{ // if the date or time were changed, no need to change which layer is active (highlighted)	
		nr_of_total_layers = rsghelper_layers.getNr_not_hidden_layers()
		
		//~ if ( ((nr_of_total_layers == 1) || (data_changed)) && (date_or_time_changed === false) ){
			//~ rsg_layers.make_topmost_checked_on_layer_active()
		//~ }
		
		vis = rsghelper_layers.get_layer_name_by_id((layer)) + "_vis";
		// if the layer is visible, and it is the active data layer (settings menu open) control the opacity with the slider.
		if (document.getElementById(vis).checked && layer == active_data_layer) {
			opacity_val = $("#opacity_slider").slider("option", "value");
			//~ rsg_ui.highlight_layer(layer);
			//~ load_and_show_colour_bar(layer);
			rsghelper_layers.get_layer_copy_by_id(layer).alpha = opacity_val;
		}
		//Otherwise, if the checkbox is checked, show the layer.
		else if (document.getElementById(vis).checked) {
			//~ rsg_ui.remove_all_highlights();
			//~ rsg_ui.highlight_layer(layer);
			rsghelper_layers.get_layer_copy_by_id(layer).alpha = 1;
			if(rsghelper_layers.layer_is_highlighted(layer))
				{load_and_show_colour_bar(layer);}
			//~ rsg_ui.show_colourbar();
		}
		else {
			rsghelper_layers.get_layer_copy_by_id(layer).alpha = 0;
			//~ if(rsghelper_layers.layer_is_highlighted(layer)){
				//~ rsg_ui.hide_colourbar();
			//~ }
			rsg_ui.remove_highlight(layer);
			//~ rsg_layers.make_topmost_checked_on_layer_active()
		};
		viewer.scene.requestRender();
	},
	
	is_layer_tiled: function(layer_id)
	{
		if( layer_state.project_table_column_indices[layer_id]["tiled"] != -1 )
		{ // if the column 'tiled' is defined in the project table...
			current_layer = rsghelper_layers.get_layer_copy_by_id(layer_id);
			
			// ... then set the tiled_option whatever is set in the project table row of that variable
			tiling_options = ["true"] // possible extending different tiling modes in the future...
			
			// if the row matches one of the tiling options, set tiled_option as positive, and pass it to function editing layer png
			tiled_option = (tiling_options.indexOf(current_layer.tiled) > -1)
			
			return tiled_option;
		}
		else return false;
	},
	
	assign_new_image_to_layer: function(layer_id, png_url, latlong)
	{
		tiled_option = rsg_layers.is_layer_tiled(layer_id); // do not tile as default, but next check if needs tiling:
		/*
		if( layer_state.project_table_column_indices[layer_id]["tiled"] != -1 )
		{ // if the column 'tiled' is defined in the project table...
			
			current_layer = rsghelper_layers.get_layer_copy_by_id(layer_id);
			
			// ... then set the tiled_option whatever is set in the project table row of that variable
			tiling_options = ["true"] // possible extending different tiling modes in the future...
			// if the row matches one of the tiling options, set tiled_option as positive, and pass it to function editing layer png
			if (tiling_options.indexOf(current_layer.tiled) > -1) tiled_option = true
			//~ tiled_option = current_layer.tiled 
		}
		* 
		*/
		
		// 2020-04-29
		switch (layer_id) {
			case 0:
				source = rsg_layers.edit_layer_png(layer0, png_url, latlong, 0, tiled_image = tiled_option);
				return source;
			case 1:
				source = rsg_layers.edit_layer_png(layer1, png_url, latlong, 1, tiled_image = tiled_option);
				return source;
			case 2:
				source = rsg_layers.edit_layer_png(layer2, png_url, latlong, 2, tiled_image = tiled_option);
				return source;
			case 3:
				source = rsg_layers.edit_layer_png(layer3, png_url, latlong, 3, tiled_image = tiled_option);
				return source;
		};
	},
	
	clear_layer_loaded_animation_image: function(layer_id)
	{ remove_nr_of_layers = remove_previous_layers[layer_id].length
		for (i = 0; i < remove_nr_of_layers; i++)
		{ // remove all layers that were once loaded for the smooth animation
			remove_previous_layers[layer_id].reverse();
			layer_to_be_removed = remove_previous_layers[layer_id].pop();
			remove_previous_layers[layer_id].reverse();
			//~ layer_to_be_removed.destroy();
			layers.remove(layer_to_be_removed);
		}
	},
	
	clear_all_loaded_animation_images: function()
	{ for(layer_id = 0; layer_id < 4; layer_id++)
		{
			rsg_layers.clear_layer_loaded_animation_image(layer_id);
		}
		viewer.scene.requestRender();
	},
	
	
	
	make_topmost_checked_on_layer_active: function()
	{ date_or_time_changed = false; // reset the flag to default
		var top_layer = rsghelper_layers.get_top_layer();
		if (top_layer != 4) {
			rsg_ui.remove_all_highlights()
			rsg_ui.highlight_layer(top_layer);
			load_and_show_colour_bar(top_layer);	
		} 
		else if (top_layer == 4) {
			rsg_ui.remove_all_highlights();
			rsg_ui.hide_colourbar();
			rsg_timepicker.turn_off_timepicker()
		}
	},
	
	remove_layer: function(layer_id)
	{	
		if( document.getElementById("layer" + layer_id + "_data").classList.contains("txt_highlight") )
		{ // if we are removing the layer which is currently the top layer 
			// ... (the name text is highlighted), then we hide the no longer
			// ... needed colourbar of the removed layer:
			rsg_ui.hide_colourbar();
		}
		// if displaying Layer Settings of the layer about to be removed...
		// ... hide the 'Layer Settings' bar (bottom left corner)
		if(document.getElementById("layer_data").innerText == document.getElementById("layer" + layer_id + "_data").innerText)
		{
			rsg_ui.hide_settings();
		}
		
		layer_to_remove = rsghelper_layers.get_layer_copy_by_id(layer_id);
		hide_item("#" + "layer" + layer_id + '_r1')
		hide_item("#" + "layer" + layer_id + '_r2')
		
		layer_to_remove.hidden = "true";	
		layer_to_remove.source = "-";	
		//~ rsghelper_layers.get_layer_copy_by_id(layer_id).alpha  = 0;
		layer_to_remove.data_long = "empty layer";
		
		// set the checkbox to indicate 'not checked' anymore, since about to be removed
		try {
			vis = rsghelper_layers.get_layer_name_by_id((layer_id)) + "_vis";
			document.getElementById(vis).checked = false;
		}
		catch(err) {
		  // button already removed
		}
		
		// set the layer to be removed to have an empty transparent image:
		rsg_layers.edit_layer_png(rsghelper_layers.get_layer_copy_by_id(layer_id), '../Assets/Data/empty.png', "empty", layer_id) // 12:38
		// unlink the layer's project table, which, when set to 'null', will not
		// ... trigger the colourbar to be shown
		rsghelper_layers.get_layer_copy_by_id(layer_id).project_table = "null";
		var layer_data = {
			"time" : -1, 
			"step" : -1,
			"time_unit": -1,
			"locked_date" : -1,
			"locked_time" : -1
		};
		timepicker_state["layer"+layer_id] = layer_data;
	
		remove_nr_of_layers = remove_previous_layers[layer_id].length
		for (i = 0; i < remove_nr_of_layers; i++)
		{ // remove all layers that were once loaded for the smooth animation
			remove_previous_layers[layer_id].reverse();
			layer_to_be_removed = remove_previous_layers[layer_id].pop();
			layer_to_be_removed.alpha = 0;
			remove_previous_layers[layer_id].reverse();
			
			layers.remove(layer_to_be_removed);
		}
		
		// check if four layers loaded:
		if (rsghelper_layers.getNr_not_hidden_layers() < 4)
		{ // if after removal there are less than 4 layers, change button back
			// ... from 'Maximum Reached' to 'Add Layer +'
			button = document.getElementById("add_layer");
			button.innerText = "Add Layer + ";
			button.disabled = false;
			button.classList.remove("buttonDisabled");
		}
		// to make sure that we do not wind up with none active (highlighted) ...
		// ... layers after removing a layer 
		rsg_layers.make_topmost_checked_on_layer_active();
		//~ if(website_state.currently_in_animation)
			//~ alert("pause")
	},
	
	load_image_to_layer: function(layer_id, png_url, latlong)
	{
		var old_layer = rsghelper_layers.get_layer_copy_by_id(layer_id)
		var new_layer = rsg_layers.assign_new_image_to_layer(layer_id, png_url, latlong)
		
		// new_layer does not have extra properties given globally in visualisation.js
		// Add properties here
		//new_layer.data_long = "empty layer";
		//new_layer.units = "null";
		//new_layer.source = "-";
		//new_layer.data = "";
		//new_layer.hidden = "false";
		new_layer.assigned_subproperties = rsghelper_layers.get_layer_copy_by_id(layer_id).assigned_subproperties;
		new_layer.delta_t = rsghelper_layers.get_layer_copy_by_id(layer_id).delta_t;
		new_layer.header = rsghelper_layers.get_layer_copy_by_id(layer_id).header;
		new_layer.index = rsghelper_layers.get_layer_copy_by_id(layer_id).index;
		new_layer.legend_subtext = rsghelper_layers.get_layer_copy_by_id(layer_id).legend_subtext;
		new_layer.logos = rsghelper_layers.get_layer_copy_by_id(layer_id).logos;
		new_layer.source = rsghelper_layers.get_layer_copy_by_id(layer_id).source; // Possible Issue
		new_layer.tiled = rsghelper_layers.get_layer_copy_by_id(layer_id).tiled;
		new_layer.units= rsghelper_layers.get_layer_copy_by_id(layer_id).units;
		new_layer.urll= rsghelper_layers.get_layer_copy_by_id(layer_id).urll;
		new_layer.variable= rsghelper_layers.get_layer_copy_by_id(layer_id).variable;
		
		
		// End add properties
		
		// since the layers are loaded/removed NOT synchronously,
		// ... some might remain straight after the animation has finished.
		// ... here the excess layers loaded to smooth out the animation are removed
		// ... and memory is freed.
		if(!website_state.currently_in_animation)
		{ // NOT in animation:
			remove_nr_of_layers = remove_previous_layers[layer_id].length
			for (i = 0; i < remove_nr_of_layers; i++)
			{ // remove all layers that were once loaded for the smooth animation
				remove_previous_layers[layer_id].reverse();
				layer_to_be_removed = remove_previous_layers[layer_id].pop();
				remove_previous_layers[layer_id].reverse();
	
				layers.remove(layer_to_be_removed);
			}
		}
		else{
			// if in animation, remember the new image added 
			// ...(and it will be kept loaded for 2 iterations and gets removed)
			remove_previous_layers[layer_id].push(new_layer)
		}
		
		// if the website is currently in animation mode, to keep it smoother, ...
		// ... then we want to mark the layer that is two layers back for removal:
		if(website_state.currently_in_animation)
		{
			// if there are 3 layers currently loaded:
			if(remove_previous_layers[layer_id].length > 3){
				// remove the layer third in the back
				remove_previous_layers[layer_id].reverse();
				layer_to_be_removed = remove_previous_layers[layer_id].pop();
				remove_previous_layers[layer_id].reverse();
				
				layers.remove(layer_to_be_removed);
			}
		}
	
		viewer.scene.requestRender();
		return new_layer;
	},
	
	swap_layer_data_with_another_layer_data: function(swap_layer, with_layer)
	{ // used to assign the already existing and loaded from one layer to another (when dragged)
		switch (swap_layer, with_layer) 
		{
			case 0:
				layer0 = value;
				break;
			case 1:
				layer1 = value;
				break;
			case 2:
				layer2 = value;
				break;
			case 3:
				layer3 = value;
				break;
		};
	},
	
	edit_layer_data: function(index, png_url, drag) 
	{ //Change the url of a data layer and update given the index and url.
		requested_layer = rsghelper_layers.get_layer_copy_by_id(index);
		current_header = requested_layer.header;
		
		rsghelper_layers.match_project_table_indices(index, current_header);
		
		// since currently (2020-05-04) locking for a layer resets whenever ... 
		// ... the layer was locked and then the layer's data is changed, when ...
		// 'edit_layer_data' is called just unlock the layer visually (User Experience)
		rsg_ui.unlock_layer(index); // if the layer was locked, unlocks it
		
		if (!drag) 
		{
			//get required parameters from layer object
			proj_index = requested_layer.project_index;
			var_index = requested_layer.variable_index;
			proj_tab = requested_layer.project_table;
			
			var latlong = requested_layer.latlon;
			project_row = config_table[proj_index];
			var_row = proj_tab[var_index];
		}
		
		// if there are some layers with a user customised colour:
		var checker = website_state.list_of_customised_products.indexOf(requested_layer.data_short);
		if(checker >= 0)
		{//changeColoursByLayerId&Product
			//~ png_url = website_state.map_product_to_custom_url[requested_layer.data_short];
			var layer_img_obj = new Image;
			layer_img_obj.src = png_url;
			layer_img_obj.onload = function()
			{ // wait for the image to fully load before recolouring
				recoloured_png_url = rsg_colour.getRecolouredImage(layer_img_obj, index);
				rsg_layers.edit_recoloured_layer_data(index, recoloured_png_url, drag)
			};
		}
		else // if no layers with customised colours, continue as default
		{
			//change imagery provider of corresponding layer object
			switch (index) {
				case 0:
					layer0 = rsg_layers.load_image_to_layer(0, png_url, latlong);
					
					break;
				case 1:
					if(previous_layer1.length != 0){
						// if there is a loaded layer underneath (for smoothing out the animation) ...
						// ... then first make it transparent (instant result) ...
						// ... and then mark for removal (asynchronous)
						excess_layer = previous_layer1.pop()
						excess_layer.alpha = 0;
						layers.remove(excess_layer);
					}
					// load the current layer image
					previous_layer1.push(layer1)
					layer1 = rsg_layers.load_image_to_layer(1, png_url, latlong);
					break;
				case 2:
					if(previous_layer2.length != 0){
						// if there is a loaded layer underneath (for smoothing out the animation) ...
						// ... then first make it transparent (instant result) ...
						// ... and then mark for removal (asynchronous)
						excess_layer = previous_layer2.pop()
						excess_layer.alpha = 0;
						layers.remove(excess_layer);
					}
					// load the current layer image
					previous_layer2.push(layer2);
					layer2 = rsg_layers.load_image_to_layer(2, png_url, latlong);
					break;
				case 3:
					if(previous_layer3.length != 0){
						// if there is a loaded layer underneath (for smoothing out the animation) ...
						// ... then first make it transparent (instant result) ...
						// ... and then mark for removal (asynchronous)
						excess_layer = previous_layer3.pop()
						excess_layer.alpha = 0;
						layers.remove(excess_layer);
					}
					// load the current layer image
					previous_layer3.push(layer3);
					layer3 = rsg_layers.load_image_to_layer(3, png_url, latlong);
					break;
			};
		
			
			//setting up a new layer sets up a new object which redefines the properties so they have to be reassigned.
			if (!drag) 
			{
				// assign the requested layer to the new returned Cesium layer with the new image loaded:
				requested_layer = rsghelper_layers.get_layer_copy_by_id(index);
				// reassign the previous additional features to the new Cesium returned layer object:
				var additional_keys = Object.keys(layer_all_aditional_properties[index]);
				for( key_id = 0; key_id < additional_keys.length; key_id++)
				{ // 2020-06-19 FIREFOX BUG
					var key_name = additional_keys[key_id]
					requested_layer[key_name] = layer_all_aditional_properties[index][key_name];
				}
				
				//~ rsg_layers.assign_layer_properties(requested_layer, index, var_row, proj_index)
				//~ rsg_layers.assign_layer_subproperties(requested_layer, project_row, proj_index, var_index, 
				                           //~ proj_tab, header=header, hidden="false", url=png_url)
				/*
				requested_layer.data_long = var_row[8];
				requested_layer.data_short = var_row[9];
				requested_layer.units = var_row[10];
				requested_layer.latlon = var_row[14];
				requested_layer.source = project_row[0] + "/" + project_row[2];
				requested_layer.project_index = proj_index;
				requested_layer.variable_index = var_index;
				requested_layer.project_table = proj_tab;
				
				requested_layer.hidden = "false";
				requested_layer.urll = png_url;
				requested_layer.magnificationFilter = Cesium.TextureMagnificationFilter.NEAREST;
				requested_layer.minificationFilter = Cesium.TextureMinificationFilter.NEAREST;
				*/
				if (png_url != "..Assets/Data/empty.png") { // 12:38
					rsg_layers.noData(index, false);
				}
				//update menu with parameters
				rsg_layers.update_names();
			}
			//ensure proper ordering
			rsg_layers.reshuffle_layers();
			//set layer to be visible
			rsg_layers.update_transparency(index, true);
		}
		
	},
	
	
	// saves the unique additional layer properties.
	// (used before loading a new layer, since when Cesium returned layer object ...
	//  ... is assigned back to the layer object, additional features do not carry over)
	//~ save_layer_properties: function(given_layer)
	//~ {
		//~ 
	//~ }
	
	assign_layer_properties: function(given_layer, layer_index, var_row, project_index)
	{
		layer_all_aditional_properties[layer_index] = {}
		/*
		 layer_state.project_table_column_indices[i] = {
			data_long      : 8,
			data_short     : 9,
			units          : 10,
			latlon         : 14,
			legend_subtext : -1, // regular expression. 'i' - case insensitive
			logos          : -1, // regular expression. 'i' - case insensitive
			delta_t        : -1
		} 
		*/ 
		//~ helper.get_layer_proj_table_index_of(given_layer.index, "data_long")
		x = layer_state.project_table_column_indices
		// get all needed project table column names:
		pt_column_names = Object.keys(layer_state.project_table_column_indices[layer_index]);
		given_layer.index = layer_index;
		layer_all_aditional_properties[layer_index]["index"] = layer_index;
		
		// NOTE moved line below to 'rsghelper_layers.match_project_table_indices''' ...
		// ... to be executed atomically whenever mapping index atomically
		//~ reset_layer_project_table_index_mappings(layer_index)
				
		// match new layer cell values from project table:
		var current_header = get_header_by_project_index(project_index);
		rsghelper_layers.match_project_table_indices(layer_index, header);
		
		// fill in the project table additional data (defined by regexes, such as delta_t, logos etc...)
		for ( idx = 0; idx < pt_column_names.length; idx++ )
		{
			column_name = pt_column_names[idx]
			//~ layer_state.project_table_column_indices[given_layer.index][column_name] = -1
			given_layer[column_name] = var_row[layer_state.project_table_column_indices[given_layer.index][column_name]];
			
			layer_all_aditional_properties[layer_index][column_name] = given_layer[column_name];
			
		}
		/*
		 * The above replicates the following behaviour:
			requested_layer.data_long = var_row[8];
			requested_layer.data_short = var_row[9];
			requested_layer.units = var_row[10];
			requested_layer.latlon = var_row[14];
			requested_layer.source = project_row[0] + "/" + project_row[2];
			requested_layer.project_index = proj_index;
			requested_layer.variable_index = var_index;
			requested_layer.project_table = proj_tab;
			
			requested_layer.hidden = "false";
			requested_layer.urll = png_url;
			requested_layer.magnificationFilter = Cesium.TextureMagnificationFilter.NEAREST;
			requested_layer.minificationFilter = Cesium.TextureMinificationFilter.NEAREST;
		*/ 
		
	},
	
	assign_layer_subproperties: function(given_layer, layer_index, project_row, proj_index, var_index, 
						                           proj_tab, header, hidden, url)
	{
		given_layer.source = project_row[0] + "/" + project_row[2];
		given_layer.project_index = proj_index;
		given_layer.variable_index = var_index;
		given_layer.project_table = proj_tab;
		given_layer.header = header;
		given_layer.assigned_subproperties = true;

		given_layer.hidden = "false";
		given_layer.urll = url;
		given_layer.magnificationFilter = Cesium.TextureMagnificationFilter.NEAREST;
		given_layer.minificationFilter = Cesium.TextureMinificationFilter.NEAREST;
		
		
		layer_all_aditional_properties[layer_index]["source"]                 = given_layer.source;
		layer_all_aditional_properties[layer_index]["project_index"]          = given_layer.project_index;
		layer_all_aditional_properties[layer_index]["variable_index"]         = given_layer.variable_index;
		layer_all_aditional_properties[layer_index]["project_table"]          = given_layer.project_table;
		layer_all_aditional_properties[layer_index]["header"]                 = given_layer.header;
		layer_all_aditional_properties[layer_index]["assigned_subproperties"] = given_layer.assigned_subproperties;
		
		layer_all_aditional_properties[layer_index]["hidden"]                 = given_layer.hidden;
		layer_all_aditional_properties[layer_index]["urll"]                   = given_layer.urll;
		layer_all_aditional_properties[layer_index]["magnificationFilter"]    = given_layer.magnificationFilter;
		layer_all_aditional_properties[layer_index]["minificationFilter"]     = given_layer.minificationFilter;
		
	},
	
	edit_recoloured_layer_data: function(index, png_url, drag)
	{
		if (!drag) {
			//get required parameters from layer object
			proj_index = requested_layer.project_index;
			var_index = requested_layer.variable_index;
			proj_tab = requested_layer.project_table;
			var latlong = requested_layer.latlon;
			project_row = config_table[proj_index];
			var_row = proj_tab[var_index];
		}
			//change imagery provider of corresponding layer object
			switch (index) {
				case 0:
					layer0 = rsg_layers.load_image_to_layer(0, png_url, latlong);
					
					break;
				case 1:
					if(previous_layer1.length != 0){
						// if there is a loaded layer underneath (for smoothing out the animation) ...
						// ... then first make it transparent (instant result) ...
						// ... and then mark for removal (asynchronous)
						excess_layer = previous_layer1.pop()
						excess_layer.alpha = 0;
						layers.remove(excess_layer);
					}
					// load the current layer image
					previous_layer1.push(layer1)
					layer1 = rsg_layers.load_image_to_layer(1, png_url, latlong);
					break;
				case 2:
					if(previous_layer2.length != 0){
						// if there is a loaded layer underneath (for smoothing out the animation) ...
						// ... then first make it transparent (instant result) ...
						// ... and then mark for removal (asynchronous)
						excess_layer = previous_layer2.pop()
						excess_layer.alpha = 0;
						layers.remove(excess_layer);
					}
					// load the current layer image
					previous_layer2.push(layer2);
					layer2 = rsg_layers.load_image_to_layer(2, png_url, latlong);
					break;
				case 3:
					if(previous_layer3.length != 0){
						// if there is a loaded layer underneath (for smoothing out the animation) ...
						// ... then first make it transparent (instant result) ...
						// ... and then mark for removal (asynchronous)
						excess_layer = previous_layer3.pop()
						excess_layer.alpha = 0;
						layers.remove(excess_layer);
					}
					// load the current layer image
					previous_layer3.push(layer3);
					layer3 = rsg_layers.load_image_to_layer(3, png_url, latlong);
					break;
			};
		
			
			//setting up a new layer sets up a new object which redefines the prfoperties so they have to be reassigned.
			if (!drag) {
				// UPDAYE rsg_layers
				requested_layer = rsghelper_layers.get_layer_copy_by_id(index);
				
				requested_layer.data_long = var_row[8];
				requested_layer.data_short = var_row[9];
				requested_layer.units = var_row[10];
				requested_layer.latlon = var_row[14];
				requested_layer.source = project_row[0] + "/" + project_row[2];
				requested_layer.project_index = proj_index;
				requested_layer.variable_index = var_index;
				requested_layer.project_table = proj_tab;
				
				requested_layer.hidden = "false";
				requested_layer.urll = png_url;
				requested_layer.magnificationFilter = Cesium.TextureMagnificationFilter.NEAREST;
				requested_layer.minificationFilter = Cesium.TextureMinificationFilter.NEAREST;
				
				if (png_url != "../Assets/Data/empty.png") { // 12:38
					rsg_layers.noData(index, false);
				}
				//update menu with parameters
				rsg_layers.update_names();
			}
			//ensure proper ordering
			rsg_layers.reshuffle_layers();
			//set layer to be visible
			rsg_layers.update_transparency(index, true);
	},
	
	add_data_to_layer: function(variable_index, project_index, project_table, layer, header) 
	{	//Add data to layer function. Takes paramters corresponding to configuration tables.
		var len = header.length;
		var time_resolution = /delta_t/i; // regular expression. 'i' - case insensitive
		var time_resolution_index = -1; // if there is no delta_t column in the header, default index is -1
		
		// get the layer object that we are trying to load the data to:
		processed_layer = rsghelper_layers.get_layer_copy_by_id(layer);
		
		// added new regex table matching 2020-04-15 \/ \/
		// ... takes 'layer number' and the 'header'
		rsghelper_layers.match_project_table_indices(layer, header)
		
		for (i = 0; i < len; i++) {
			// look for delta_t in the header:
			if (header[i].match(time_resolution)) {
					time_resolution_index = i;
			}
		}
		// if the dataset has greater temporal resolution, then we also display a timepicker:
		if(time_resolution_index != -1) // if there is a delta_t column:
		{ 
			// index the column and row where delta_t value is (cell contains: mm_1)
			var delta_t = project_table[variable_index][time_resolution_index]; // mm_1 etc.
			var time_unit = delta_t.substring(0, 2); // mm
			try{
				var time_frequency = parseInt(delta_t.substring(3)); // 1
				// if cannot parse int from given delta_t value, returns NaN
			}
			catch(err){
				alert(err)
				time_frequency = null;
			}
			// when to turn on timepicker
			
			// timepicker only shown for hours, minutes, seconds (as timepicker purpose to select time of DAY)
			var time_units_that_require_timepicker_to_be_shown = ["mn", "hh", "ss"]
			// year, month, week, day, hour, minute, second (would be fun to have second time resolution!)
			var legal_time_units = ["yy", "mm", "ww", "dd", "hh", "mn", "ss"]
			
			// time unit is one of the above (checks if time unit is a legal entry)
			//~ time_unit_defined = legal_time_units.includes(time_unit); 
			// 'includes' not supported in all browsers, so:
			// time unit is one of the above (checks if time unit is a legal entry)
			if (legal_time_units.indexOf(time_unit) > -1 ) time_unit_defined = true; // time unit is one of the above (checks if time unit is a legal entry)
			else time_unit_defined = false;
			if( time_units_that_require_timepicker_to_be_shown.indexOf(time_unit) > -1 ) requires_timepicker = true;
			else requires_timepicker = false;
			//~ requires_timepicker = time_units_that_require_timepicker_to_be_shown.includes(time_unit);
			time_frequency_defined = !(isNaN(time_frequency)) // time frequency is not nan (checks if time frequency is a number)
			
			var show_timepicker = ( time_unit_defined && requires_timepicker && time_frequency_defined )
			
			if( show_timepicker )		{
				// if there is a 'delta_t' column in the header, and has valid data ...
				// ... then display the timepicker as well as the calendar picker
				rsg_timepicker.update_timepicker_state("value", project_table[variable_index][0], "update" );
				
				var minutes = 0;
				rsg_timepicker.update_timepicker_state("time_unit", time_unit, "update");
				if(time_unit == "mn") { // if the measurement is given in minutes, do not convert
					minutes = time_frequency;
				}
							
				var layer_data = {
					"time" : project_table[variable_index][0], 
					"step" : time_frequency,
					"time_unit": time_unit,
					"locked_date" : -1,
					"locked_time" : -1
					};
				rsg_timepicker.update_timepicker_state("layer"+layer, layer_data, "update");
				rsg_timepicker.update_timepicker_state("step", time_frequency , "update" );
				rsg_timepicker.turn_on_timepicker();
	// 			$('#timepicker').timepicker({ 'step': minutes });
				
				// update timepicker (set on=true, add step, value, time_unit, keep track of number of totals and so on ...)
				
			}
			else {
				rsg_timepicker.update_timepicker_state("time_unit", "-", "update");
				rsg_timepicker.update_timepicker_state("step", "1440", "update");
				var layer_data = {
					"time" : "NA",
					"step" : "NA",
					"time_unit": "NA",
					"locked_date" : -1,
					"locked_time" : -1
					};
				rsg_timepicker.update_timepicker_state("layer"+layer, layer_data, "update");
				rsg_timepicker.turn_off_timepicker();
			}
			
		}
		else {
			// if no higher temporal resolution, set the layer data to NA and turn off the timepicker
			rsg_timepicker.update_timepicker_state("time_unit", "-", "update");
			rsg_timepicker.update_timepicker_state("step", "1440", "update");
			var layer_data = {
				"time" : "NA", 
				"step" : "NA",
				"time_unit": time_unit,
				"locked_date" : -1,
				"locked_time" : -1
				};
			rsg_timepicker.update_timepicker_state("layer"+layer, layer_data, "update");
			rsg_timepicker.turn_off_timepicker();	
		}
		
		if (variable_index != -1)
		{ // if the project table was loaded successfully:
			if (time_unit == "mm")
				var png_url = generate_png_url(variable_index, project_index, project_table, layer, average = "mm"); 
			else
				var png_url = generate_png_url(variable_index, project_index, project_table, layer ); 
		}
		else{
			var png_url = "../Assets/Data/empty.png"; // 12:38
		}
		variable_row = project_table[variable_index];
		project_row = config_table[project_index];
	
		//edit the object properties to the new values. View the config table to see exactly what goes where.
		//If a new property is added to the table, add an update line here.
		//new layer properties
		if (variable_index != -1){
			// saving key layer properties to the layer variable:
			
			//~ processed_layer = rsghelper_layers.get_layer_copy_by_id(layer)
			
			rsg_layers.assign_layer_properties(processed_layer, layer, variable_row, project_index)
			rsg_layers.assign_layer_subproperties(processed_layer, layer, project_row, project_index, variable_index, 
				                           project_table, header=header, hidden="false", url=png_url)
			/*
			rsghelper_layers.get_layer_copy_by_id(layer).data_long = variable_row[8];
			rsghelper_layers.get_layer_copy_by_id(layer).data_short = variable_row[9];
			rsghelper_layers.get_layer_copy_by_id(layer).units = variable_row[10];
			rsghelper_layers.get_layer_copy_by_id(layer).latlon = variable_row[14];
			rsghelper_layers.get_layer_copy_by_id(layer).source = project_row[0] + "/" + project_row[2];
			rsghelper_layers.get_layer_copy_by_id(layer).project_index = project_index;
			rsghelper_layers.get_layer_copy_by_id(layer).variable_index = variable_index;
			rsghelper_layers.get_layer_copy_by_id(layer).project_table = project_table;
			rsghelper_layers.get_layer_copy_by_id(layer).header = header;
			
			
			rsghelper_layers.get_layer_copy_by_id(layer).hidden = "false";
			//~ rsghelper_layers.get_layer_copy_by_id(layer).delta_t_unit = time_unit;
			//~ rsghelper_layers.get_layer_copy_by_id(layer).delta_t_frequency = time_frequency;
			rsghelper_layers.get_layer_copy_by_id(layer).urll = png_url;
			rsghelper_layers.get_layer_copy_by_id(layer).magnificationFilter = Cesium.TextureMagnificationFilter.NEAREST;
			rsghelper_layers.get_layer_copy_by_id(layer).minificationFilter = Cesium.TextureMinificationFilter.NEAREST;
		
			*/
		
			//Update the settings menu values to reflect the new layer
			document.getElementById("layer_data").textContent = rsghelper_layers.get_layer_copy_by_id(layer).data_long;
			document.getElementById("layer_source").textContent = rsghelper_layers.get_layer_copy_by_id(layer).source;
		}
		else{
			rsghelper_layers.get_layer_copy_by_id(layer).data_long = "Could not load outdated link";
			rsghelper_layers.get_layer_copy_by_id(layer).data_short = "Configuration tables have been modified";
		}
		
		//Hide data select menu and toolbar (if on mobile), and show settings
		rsg_ui.hide_data_select();
		//rsg_ui.hide_toolbar();
		if(!small_screen) rsg_ui.show_settings();
	
		//Update the colour bar
		load_and_show_colour_bar(layer);
	
		//load the new image resource
		rsg_layers.loadImgResource(layer, png_url);
	
		//Set the visibility checkbox to be true and update the transprency, making it visible.
		vis = rsghelper_layers.get_layer_name_by_id((layer)) + "_vis";
		
		if (website_state["layer"+layer+"_loaded_from_url"])
		{
			// get the url:
			url = window.location.href;
			// get which layers are turned on from URL:
			try{
				var url_layers_on = getParameterByName("lch", url)
				url_layers_on = url_layers_on.split("C")
			}
			catch(error){
				url_layers_on = [1,1,1,1]
			}
			var is_layer_on = parseInt(url_layers_on[layer])
			if (is_layer_on == 1) {
				checkbox = document.getElementById(vis);
				document.getElementById(vis).checked = true;
			}
			else document.getElementById(vis).checked = false;
		}
		else{
			checkbox = document.getElementById(vis);
			document.getElementById(vis).checked = true;
		}
		//~ rsghelper_layers.hide_above_layers(layer);
		rsg_ui.remove_all_highlights();
		rsg_ui.highlight_layer(layer);
		rsg_layers.update_transparency(layer);
	},
	
	loadImgResource: function(layer, url) 
	{ //function to preload an image resource and change the layer to a "no data" style if it cannot be found.
		//~ img_array[layer].src = url; as read online: http://stackoverflow.com/questions/3971931/does-new-image-allow-for-use-of-cache-javascript
		// ... defining src before onload can not trigger onload when cached?
		/*img_array[layer].onerror = function () {
			rsg_layers.noData(layer, true)
		};
		img_array[layer].onload = function () {
			rsg_layers.edit_layer_data(layer, url)
		};
		img_array[layer].src = url; */
		
		var imgObj = new Image();
		
		// function 'imgObj.src' (called in the 'else' statement of this function) ...
		/// ... triggers an image in the given 'url' to be downloaded, therefore ...
		//  ... the global image download count is increased:
		website_state.layers_currently_downloading += 1;
		
		// when the data starts loading, show the toggle button to show download status:
		var show_loading_status_button = document.getElementById("show_loading_status_button");
		show_loading_status_button.classList.remove("off");
		
		var download_test_widget = document.getElementById("download-test");
		if (website_state.show_loading_status)
		{
			download_test_widget.innerHTML = "Downloading nr. of images" + website_state.layers_currently_downloading;
			document.getElementById("status-monitoring").classList.remove("off");
		}
		
		var loading_layer_status = document.getElementById("layer"+layer+"_loading_status");
		loading_layer_status.innerHTML = "Downloading ... ";
		loading_layer_status.classList.remove("off");
		
		var time_selector = document.getElementById("time_control_ui");
		time_selector.classList.add("disabledTag");
		
		imgObj.onload = function () { 
			download_test_widget.innerHTML = "onload";
			rsg_layers.edit_layer_data(layer, url);
		};
		
		imgObj.onerror = function () {
			download_test_widget.innerHTML = "error";
			rsg_layers.noData(layer, true);
		};
		
		var found_tiles = false;
		var current_layer_tiled = rsg_layers.is_layer_tiled(layer);
		// if layer is tiled, call 'edit_layer_data' without the 'onload image' event:
		if(rsg_layers.is_layer_tiled(layer))
		{
			tiles_url = url.split('.').slice(0, -1).join('.') + '/';
			found_tiles = data_exists_in_url( tiles_url );
		}
		
		if ( found_tiles ) // if tiles found, skip the waiting for image part:
		{
			rsg_layers.edit_layer_data(layer, url);
		}
		
		else // if layer is not tiled, load the image to cache first before asking Cesium to load it.
		{
			imgObj.src = url; // triggers layer to be loaded async (and then calls .onload)
			if ( (current_layer_tiled) && ( ! found_tiles) )
			{ // if layer is tiled, but tiles are not found, inform  user in the UI;
				loading_layer_status.innerHTML = "Tiles not found: Downloading Image ... ";
			}
		}
	},
	
	noData: function(layer, nd) 
	{ //function to change the style if no data has been found for an image
		//add no data class if no data exists
		if (nd) {
			$id(rsghelper_layers.get_layer_name_by_id(layer) + "_data").classList.add("txt_noData");
			$id(rsghelper_layers.get_layer_name_by_id(layer) + "_source").classList.add("txt_noData");
			rsg_layers.edit_layer_data(layer, "../Assets/Data/empty.png"); // 12:38
			rsghelper_layers.get_layer_copy_by_id(layer).data_long += " (no data)";
		}
		//remove the class if the data exists
		if (!nd) {
			$id(rsghelper_layers.get_layer_name_by_id(layer) + "_data").classList.remove("txt_noData");
			$id(rsghelper_layers.get_layer_name_by_id(layer) + "_source").classList.remove("txt_noData");
		}
		//update the toolbar to reflect the changes
		rsg_layers.update_names();
	},
	
	
	// utility function to check whether the layer data needs updating
	is_locked: function(layer_id)
	{ // (when a layer is locked, its data needs to stay the same)
		locked_date = timepicker_state["layer"+layer_id]["locked_date"]
		locked_time = timepicker_state["layer"+layer_id]["locked_time"]
		
		// if the layer is high temporal resolution (has hours as well as days)
		// ... check both date and time locking:
		if( rsghelper_layers.is_htr(layer_id) )
		{
			if( (locked_date != -1) && (locked_time != -1) )
			{
				return true;
			}
			else return false;
		}
		else
		{ // else just check for the date:
			if( (locked_date != -1) )
			{
				return true;
			}
			else return false;
		}
	},

	swap_layer_state: function(layer_id, map_to_id, previous_layer_state)
	{
		layer_state.project_table_column_indices[layer_id] =  previous_layer_state.project_table_column_indices[map_to_id];
		//~ layer_state.project_table_column_indices[map_to_id] =  previous_layer_state.project_table_column_indices[layer_id];
	},

	// data structure to store additional & custom properties for Cesium Imagery Provider Layer:
	swap_layer_all_aditional_properties: function(layer_id, map_to_id, previous_layer_all_aditional_properties)
	{
		layer_all_aditional_properties[layer_id] = previous_layer_all_aditional_properties[map_to_id];
		//~ layer_all_aditional_properties[map_to_id] = previous_layer_all_aditional_properties[layer_id];
	}
	

	 
}
