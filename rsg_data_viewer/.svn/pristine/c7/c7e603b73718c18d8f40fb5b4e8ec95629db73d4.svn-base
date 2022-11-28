var rsg_colour = {
	
	colourChanged: function(colour1, colour2)
	{
		return colour1 != colour2;
	},
	
	changeColoursOfHighlightedLayer: function()
	{
		// recolour the colourbar:
		recoloured_image = rsg_colour.getRecolouredImage(colourbar_image, highlighted_layer_id);
		colourbar_image.src = recoloured_image;
		
		// recolour the loaded data layer:
		highlighted_layer = rsghelper_layers.get_layer_copy_by_id(highlighted_layer_id);
		
		var layer_img_obj = new Image;
		layer_img_obj.src = highlighted_layer.urll;
		layer_img_obj.onload = function()
		{ // wait for the image to fully load before recolouring
			recoloured_layer_url = rsg_colour.getRecolouredImage(layer_img_obj, highlighted_layer_id);
			website_state.map_product_to_custom_url[highlighted_layer.data_short] = recoloured_layer_url;
			rsg_layers.edit_layer_data(highlighted_layer_id,
			                           recoloured_layer_url,
			                           drag=false);
		};
	},
	
	changeColoursByLayerIdProduct: function(layer_id, product)
	{
		// recolour the colourbar:
		recoloured_image = rsg_colour.getRecolouredImage(colourbar_image, layer_id);
		colourbar_image.src = recoloured_image;
		
		// recolour the loaded data layer:
		given_layer = rsghelper_layers.get_layer_copy_by_id(layer_id);
		
		var layer_img_obj = new Image;
		layer_img_obj.src = given_layer.urll;
		layer_img_obj.onload = function()
		{ // wait for the image to fully load before recolouring
			recoloured_layer_url = rsg_colour.getRecolouredImage(layer_img_obj, layer_id);
			rsg_layers.edit_layer_data(layer_id,
			                           recoloured_layer_url,
			                           drag=false);
		};
	},
	
	populateColourSelection: function()
	{ 
		highlighted_layer_id = rsghelper_layers.getHighlightedLayerId();
		highlighted_layer = rsghelper_layers.get_layer_copy_by_id(highlighted_layer_id); 
		all_colour_cells = document.getElementsByClassName("colour-cell");
		all_colour_choices = document.getElementsByClassName("jscolor");
		all_transparency_choices = document.getElementsByClassName("transparency-checkbox");
		for(iterator=0; iterator < all_colour_cells.length; iterator++)
		{
			if((rsg_colour.colourChanged(all_colour_cells[iterator].innerHTML.toUpperCase(), all_colour_choices[iterator+1].value))
			||(all_transparency_choices[iterator].checked))
			{
				oldRGBA = rsg_colour.hex2rgba(all_colour_cells[iterator].innerHTML.toUpperCase());
				newRGBA = rsg_colour.hex2rgba(all_colour_choices[iterator+1].value, all_transparency_choices[iterator].checked);
				if(website_state["layer"+highlighted_layer_id+"_custom_colours"] == false)
				{
					colour_mapping = 
					{
						"oldRed"   : oldRGBA[0],
						"oldGreen" : oldRGBA[1],
						"oldBlue"  : oldRGBA[2],
						"oldAlpha" : oldRGBA[3],
						
						"newRed"   : newRGBA[0],
						"newGreen" : newRGBA[1],
						"newBlue"  : newRGBA[2],
						"newAlpha" : newRGBA[3]
					};
					website_state["layer"+highlighted_layer_id+"_custom_colours"] =
					[ // change yellow to purple
						colour_mapping
					];
					website_state.list_of_customised_products.push(highlighted_layer.data_short);
					try{
						website_state.customised_product_colours[highlighted_layer.data_short].push(colour_mapping);
					}
					catch(arrayNotCreated){
						website_state.customised_product_colours[highlighted_layer.data_short]=[colour_mapping];
					}
				}
				else{
					website_state["layer"+highlighted_layer_id+"_custom_colours"].push({
						"oldRed"   : oldRGBA[0],
						"oldGreen" : oldRGBA[1],
						"oldBlue"  : oldRGBA[2],
						"oldAlpha" : oldRGBA[3],
						
						"newRed"   : newRGBA[0],
						"newGreen" : newRGBA[1],
						"newBlue"  : newRGBA[2],
						"newAlpha" : newRGBA[3]
					})
				}
			}
		}
		rsg_ui.close(["colour_picker"]);
		rsg_colour.changeColoursOfHighlightedLayer();
		
	},
	
	toggle_colour_picker: function()
	{
		// since the colourbar is displayed for an active (highlighted) layer, ...
		// ... get its id for reference:
		highlighted_layer_id = rsghelper_layers.getHighlightedLayerId();
		
		rsg_ui.open(["colour_picker"]);
		
		//~ website_state["layer"+highlighted_layer_id+"_custom_colours"] =
		//~ [ // change yellow to purple
			//~ {
				//~ "oldRed"   : 247,
				//~ "oldGreen" : 255,
				//~ "oldBlue"  : 6,
				//~ "oldAlpha" : 255,
				//~ 
				//~ "newRed"   : 121,
				//~ "newGreen" : 4,
				//~ "newBlue"  : 125,
				//~ "newAlpha" : 255
			//~ }
		//~ ];
		
		var colourbar_image=document.getElementById("colourbar_image");
		// pull the entire image into an array of pixel data
		
		// get all available colours to be changed:
		colourbar_colour_list = rsg_colour.getColoursInImage(colourbar_image);
		old_colour_list = document.getElementById("colour-list-container");
		old_colour_list.remove();
		
		colour_list_obj = document.createElement('div');
		colour_list_obj.setAttribute('id', 'colour-list-container');
		document.getElementById("colour_picker").appendChild(colour_list_obj);
		colour_list_obj = document.getElementById("colour-list-container");
		for (iterator = 0; iterator < colourbar_colour_list.length; iterator++)
		{
			if((colourbar_colour_list[iterator] != "#000000") && (colourbar_colour_list[iterator] != "#ffffff"))
			{
				var colour_cell = document.createElement('div');
				colour_cell.textContent = colourbar_colour_list[iterator].replace('#','');
				colour_cell.setAttribute('class', 'colour-cell');
				colour_cell.setAttribute('id', 'colour-display'+iterator);
				colour_cell.setAttribute("style", "background-color: " + colourbar_colour_list[iterator] + ";" + "color: " + colourbar_colour_list[iterator] + ";");
				//~ colour_cell.setAttribute("style", "color: " + colourbar_colour_list[iterator] + ";");
				
				colour_input = document.createElement('input');
				colour_input.setAttribute('class', 'jscolor');
				colour_input.setAttribute("style", "color: " + colourbar_colour_list[iterator] + ";");
				//~ colour_input.setAttribute('class', 'spectrum');
				colour_input.setAttribute('id', 'colour-selection'+iterator);
				colour_input.setAttribute('value', colourbar_colour_list[iterator].replace('#',''));
				//~ new jscolor($('.jscolor').last()[0]);
				//~ colour_input.value = colourbar_colour_list[iterator].replace('#','').toUpperCase();
				
				var transparent_checkbox = document.createElement('input');
        transparent_checkbox.type = "checkbox";
        transparent_checkbox.setAttribute('class', 'transparency-checkbox');
        transparent_checkbox.setAttribute('id', 'transparency-selection'+iterator);
        transparent_checkbox.value = 1;
        transparent_checkbox.name = "todo[]";
				
				line_break = document.createElement('div');
				line_break.setAttribute('class', 'flex-break');
				
				colour_list_obj.appendChild(colour_cell);
				colour_list_obj.appendChild(colour_input);
				colour_list_obj.appendChild(transparent_checkbox);
				colour_list_obj.appendChild(line_break);

				//~ colour_list_obj.
			}
			new jscolor($('.jscolor').last()[0]);
		}
		//~ let onclick_function = new Function(rsg_colour.populateColourSelection());
		submit_button = document.createElement('button')
		//~ submit_button.onclick = rsg_colour.populateColourSelection(); // for internet explorer
		submit_button.setAttribute("onclick", "rsg_colour.populateColourSelection()");
		submit_button.innerHTML = "Submit Colour Choices";
		colour_list_obj.appendChild(submit_button);
		
		
		/*
		// recolour the colourbar:
		recoloured_image = rsg_colour.getRecolouredImage(colourbar_image, highlighted_layer_id);
		colourbar_image.src = recoloured_image;
		
		// recolour the loaded data layer:
		highlighted_layer = rsghelper_layers.get_layer_copy_by_id(highlighted_layer_id);
		
		var layer_img_obj = new Image;
		layer_img_obj.src = highlighted_layer.urll;
		layer_img_obj.onload = function()
		{ // wait for the image to fully load before recolouring
			recoloured_layer_url = rsg_colour.getRecolouredImage(layer_img_obj, highlighted_layer_id);
			rsg_layers.edit_layer_data(highlighted_layer_id,
			                           recoloured_layer_url,
			                           drag=false);
		};
		*/
	},
	
	getImageData: function(img)
	{
		// Create an empty canvas element
		var canvas = document.createElement("canvas");
		canvas.width = img.width;
		canvas.height = img.height;
		
		// Copy the image contents to the canvas
		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0);
		
		var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		
		return imageData.data;
	},
	
	getBase64Image: function(img)
	{
		var canvas = document.createElement("canvas");
		canvas.width =img.width;
		canvas.height =img.height;

		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0);

		var dataURL = canvas.toDataURL("image/png");
		return dataURL.replace(/^data:image\/(png|jpg);base64,/, "")
		//~ alert(dataURL.replace(/^data:image\/(png|jpg);base64,/, ""));
	},
	
	getRecolouredImage: function(img, layer_id)
	{
		var canvas = document.createElement("canvas");
		// GET the ACTUAL resolutions, not the ones confined to the DIV,
		// ... because in that case, it will cut off the image...
		//~ canvas.width =img.width;
		//~ canvas.height =img.height;
		canvas.width =img.naturalWidth;
		canvas.height =img.naturalHeight;
		
		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0);
		
		var image_context = ctx.getImageData(0, 0, canvas.width, canvas.height);
		//~ var imageData = rsg_colour.getImageData(img);
		
		for(iterator = 0; iterator < website_state["layer"+layer_id+"_custom_colours"].length; iterator++)
		{
			oldRed   = website_state["layer"+layer_id+"_custom_colours"][iterator]["oldRed"]
			oldGreen = website_state["layer"+layer_id+"_custom_colours"][iterator]["oldGreen"]
			oldBlue  = website_state["layer"+layer_id+"_custom_colours"][iterator]["oldBlue"]
			oldAlpha = website_state["layer"+layer_id+"_custom_colours"][iterator]["oldAlpha"]
			                                                             
			newRed   = website_state["layer"+layer_id+"_custom_colours"][iterator]["newRed"]
			newGreen = website_state["layer"+layer_id+"_custom_colours"][iterator]["newGreen"]
			newBlue  = website_state["layer"+layer_id+"_custom_colours"][iterator]["newBlue"]
			newAlpha = website_state["layer"+layer_id+"_custom_colours"][iterator]["newAlpha"]
			
			//~ oldRed = 247; newRed = 121;
			//~ oldGreen = 255; newGreen = 4;
			//~ oldBlue = 6;  newBlue = 125;
			//~ oldAlpha = 1;  newAlpha = 0;
			
			// examine every pixel, 
			// change any old rgb to the new-rgb
			for (var i=0;i<image_context.data.length;i+=4)
			{
				// is this pixel the old rgb?
				if(image_context.data[i]==oldRed &&
					 image_context.data[i+1]==oldGreen &&
					 image_context.data[i+2]==oldBlue)
				{
					// change to your new rgb
					image_context.data[i]=newRed;
					image_context.data[i+1]=newGreen;
					image_context.data[i+2]=newBlue;
					image_context.data[i+3]=newAlpha;
				}
			}
		}
		// put the altered data back on the canvas  
		ctx.putImageData(image_context,0,0);
		
		var imageURL = canvas.toDataURL("image/png");
		//~ return dataURL.replace(/^data:image\/(png|jpg);base64,/, "")
		return imageURL
	},
	
	// function that automatically makes the colour bar from the passed in tags 
	// ... main function is to make the basecoloubar image from the colourbar scale...
	// ... and then add auxhilary data around it from the other tags:
	dynamically_make_colourbar: function (colour_table, units, short_id, max_value, min_value)
	{
		// since to keep the consistenci across all variables, ...
		// the width and height will be defined here and used the same for all colourbars:
		// ( the dimensions are defined per colour box ):
		var single_colour_width = 1;
		var single_colour_height = 1;
		
		// pixel = 77, Math.ceil( (77) / (50 * 1) ) - 1 ; -> index [1] in colour table; 
		
		var nr_colour_cells = 256; // this should always stay like this, ...
		                           // ( unless using more than 8-bit greyscale in the future
		                           // ... to have more than 256 unique colours )
		
		// 1. make the main part of the colourbar:
		//   a) base part of the colourbar - the colour image
		//      ... loop through the colour table colours and make each cell:
		
		var canvas = document.createElement("canvas");
		canvas.width = single_colour_width;
		canvas.height = single_colour_height * nr_colour_cells;
		
		var ctx = canvas.getContext("2d");
		var image_context = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var colour_cell_nr = 0; // keep track of which cell of colour currently writing to
		var pixel_nr = 0;
		
		
		
		//~ for (var i=0;i<image_context.data.length;i+=4)
		for (var i=image_context.data.length;i>0;i-=4)
		{
			// get colour cell index:
			pixel_nr++;
			var colour_index = Math.ceil( (pixel_nr) / (single_colour_width * single_colour_height) ) - 1;
			
			//~ image_context.data[i]   = colour_table[colour_index][0];
			//~ image_context.data[i+1] = colour_table[colour_index][1];
			//~ image_context.data[i+2] = colour_table[colour_index][2];
			//~ image_context.data[i+3] = colour_table[colour_index][3];
			
			// if colour bar specified from darkest greyscale values - 0 to brightest - 255, ...
			// ... then fill in the table backwards (info for the previous pixel)
			image_context.data[i-1] = colour_table[colour_index][3];
			image_context.data[i-2] = colour_table[colour_index][2];
			image_context.data[i-3] = colour_table[colour_index][1];
			image_context.data[i-4] = colour_table[colour_index][0];
		}
		
		// put the altered data back on the canvas  
		ctx.putImageData(image_context,0,0);
		
		var imageURL = canvas.toDataURL("image/png");
		//~ return dataURL.replace(/^data:image\/(png|jpg);base64,/, "")
		return imageURL
		
	},
	
	dynamically_color_image: function(img, layer_id, colour_table)
	{
		// recolour the loaded data layer:
		var layer_object = rsghelper_layers.get_layer_copy_by_id(layer_id);
		var greyscale_url = layer_object.urll;
		
		var canvas = document.createElement("canvas");
		// GET the ACTUAL resolutions, not the ones confined to the DIV,
		// ... because in that case, it will cut off the image...
		//~ canvas.width =img.width;
		//~ canvas.height =img.height;
		canvas.width =img.naturalWidth;
		canvas.height =img.naturalHeight;
		
		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0);
		
		var image_context = ctx.getImageData(0, 0, canvas.width, canvas.height);
		//~ var imageData = rsg_colour.getImageData(img);
		
		
		// we have the colour table array where:
		// ... its index is the supposed RGBA value.
		
		// so, for each pixel, get its Greyscale RGB and index the colour table array
		for (var i=0;i<image_context.data.length;i+=4)
		{
			if (i + 4 > image_context.data.length) console.log("final 4 values at (" + i + ")");
			// is this pixel grayscale?
			R_channel = image_context.data[i];
			G_channel = image_context.data[i+1];
			B_channel = image_context.data[i+2];
			A_channel = image_context.data[i+3];
			
			if ( (R_channel == G_channel) && (G_channel == B_channel) )
				greyscale_value = G_channel;
			
			//~ // change to your new rgb, if the pixel is no transparent:
			if (A_channel)
			{
				image_context.data[i]=colour_table[greyscale_value][0];
				image_context.data[i+1]=colour_table[greyscale_value][1];
				image_context.data[i+2]=colour_table[greyscale_value][2];
				image_context.data[i+3]=colour_table[greyscale_value][3];
			}
		}
		
		// put the altered data back on the canvas  
		ctx.putImageData(image_context,0,0);
		
		var imageURL = canvas.toDataURL("image/png");
		//~ return dataURL.replace(/^data:image\/(png|jpg);base64,/, "")
		return imageURL
	},

	getColoursInImage: function(img)
	{
		var colours_in_image = [];  
		
		var canvas = document.createElement("canvas");
		// GET the ACTUAL resolutions, not the ones confined to the DIV,
		// ... because in that case, it will cut off the image...
		//~ canvas.width =img.width;
		//~ canvas.height =img.height;
		canvas.width =img.naturalWidth;
		canvas.height =img.naturalHeight;
		
		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0);
		
		var image_context = ctx.getImageData(0, 0, canvas.width, canvas.height);
		
		//~ var canvas = document.createElement("canvas");
		//~ var imageWidth = img.width;
		//~ var imageHeight = img.height;
		//~ var context = canvas.getContext('2d')
		//~ context.drawImage(img, 0, 0);
		//~ var imageData = context.getImageData(0, 0, imageWidth, imageHeight);
		var data = image_context.data;

		// quickly iterate over all pixels
		for(var i = 0, n = data.length; i < n; i += 4)
		{
			var r  = data[i];
			var g  = data[i + 1];
			var b  = data[i + 2];
			var hex = rsg_colour.rgb2hex("rgb("+r+","+g+","+b+")");
			if ($.inArray(hex, colours_in_image) == -1)
			{
					//~ $('#list').append("<li>"+hex+"</li>");
					//~ colours_in_image.push("rgb("+r+","+g+","+b+")");
					colours_in_image.push(hex);
			}
		}
		return colours_in_image;
	},

	//rgb to hex function
	rgb2hex: function(rgb)
	{
		rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		function hex(x) {
				return ("0" + parseInt(x).toString(16)).slice(-2);
		}
		return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
	},
	
	hex2rgba: function(hexVal, transparent)
	{
		if ( hexVal.length === 3 ) {
			hexVal = hexVal[0] + hexVal[0] + hexVal[1] + hexVal[1] + hexVal[2] + hexVal[2];
		} 
		     
		// extracting the hex values for RGB
		var red = hexVal.substr(0,2),
				green = hexVal.substr(2,2),
				blue = hexVal.substr(4,2);
		
		// converting in decimal values
		var red10 = parseInt(red,16),
				green10 = parseInt(green,16),
				blue10 = parseInt(blue,16);
			
		// stitching it together
		var rgb = red10+','+green10+','+blue10;
		
		// the final rgba CSS ouptut
		if(transparent == "undefined"){
			//~ rgba = 'rsgba('+rgb+',255)';
			rgba = [red10, green10, blue10, 255]
		}
		else{
			//~ rgba = 'rsgba('+rgb+',0)';
			if(transparent) rgba = [red10, green10, blue10, 1]
			else rgba = [red10, green10, blue10, 255]
		}
		
		return rgba;
	}
	
	
} 
