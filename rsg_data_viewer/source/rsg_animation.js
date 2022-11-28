/* 
 * rsg_animation.js has the namespace 'rsg_animation'
 * - all functions from the rsg_animation namespace must be prepended with ...
 *   ... rsg_animation to make 'rsg_animation.function_name(...)'
 * 
 * the animation namespace functions use the following namespaces from files:
 * - 'rsg_ui'          namespace from 'user_interface.js'
 * - 'rsg_timepicker'  namespace from 'rsg_timepicker.js'
 * - 'rsg_layers'      namespace from 'rsg_layer_functions.js'
 * - 'helper', 
 *   'rsghelper_layers' 
 *                     namespaces from 'rsg_helper_functions.js'
 */
var rsg_animation = {
	play: function() {
		// main function for animating, it reacts to the flags set by UI buttons (stop, pause, play, rewind)
		// ... updates the time picker, time slider, and time slider (on slide/update) loads the new images to layers
		// for layer updates, look inside the time_slider onslide functions, and then it calls to edit_layer_data etc.
		var val = $('#time_slider').slider("option", "value");
		// get animation start and end times specified by the user in the selection menu:
		animation_start_date = helper.string_to_date($("#animation_start").val(), 
		                                               "yyyy/mm/dd", "/").getTime() / 1000
		animation_end_date = helper.string_to_date($("#animation_end").val(), 
		                                             "yyyy/mm/dd", "/").getTime() / 1000
		
		$('#time_slider').slider({ min : animation_start_date });
		$('#time_slider').slider({ max : animation_end_date });
			
		// if the flag is set to play_animation, then the ui start and end time selection menu is not displayed:
		if(website_state.play_animation)
		{
			// since there might be data loaded in a layer already, 
			// ... we need to remove those images so that after the animation 
			// ... has finished, those images do not get stuck loaded.
			rsg_animation.remove_all_loaded_layer_images();
			
			// resetting play animation to false means next time the play button is clicked,
			// ... it will open the start and end date selection menu
			website_state.play_animation = false;
			website_state.currently_in_animation = true;
			
			var slider_initial_min = $('#time_slider').slider("option", "min");
			var minval = slider_initial_min;
			var maxval = $('#time_slider').slider("option", "max");
			
			// if there does not exist a saved paused time, then start the animation from slider's initial value
			if(website_state.paused_time == -1){ website_state.paused_time = minval; } 
			// initially, if the |<- button is pressed, as it was not paused before,
			// ... just go to the start
			
			// turn on the 'rewind' and 'stop' buttons:
			rsg_ui.toggle_animation_buttons(true);
			
			// if the animation is paused at some time later in the animation:
			if(website_state.paused_time != minval){
				// start the animation from the time it was paused
				minval = website_state.paused_time;
			}
			// if there exists a time saved to which we rewind back the animation ... 
			else if(website_state.rewind_time != -1){
				// ... start the animation from that time
				minval = website_state.rewind_time;
			}
			
			// step is the value the slider changes with each iteration, in UTC seconds
			step = rsg_timepicker.get_timepicker_step_time_in_seconds();
			
			if(rsg_animation.in_higher_temporal_resolution(step)){
				// if the current dataset is of higher temporal resolution, 
				// ...set the timepicker to match the paused time:
				if((website_state.paused_hhmm != -1) || (website_state.rewind_hhmm != -1)){
						document.getElementById("timepicker").value = website_state.paused_hhmm;
						
					}
				// if no saved pause data - set the timer to midnight 
				else document.getElementById("timepicker").value = "00:00";
			}
			
			// start running the recursive animation (from 'minval' - lowest value from the slider)
			run(minval);
			
			function run(current_time) {
				// the function is wrapped withing 'setTimeout'
				// ... this means that the function runs every <500> seconds (set below)
				 // The 0 there is the key, which sets the date to the epoch
				var d = new Date(0);
				d.setUTCSeconds(current_time);
				
				// pause the function every 0.5 second for the animation (if no Timeout, would just load the very last timestep)
				setTimeout(function() {
					// recursion base case defined below 
					// (executed when current_time reaches the maximum time slider value):
					if(current_time <= maxval) {
						// if the variable has greater temporal resolution than just daily ...
						// ... then need to loop over the time values of the day itself
						if(rsg_animation.in_higher_temporal_resolution(step)){
							// if the timepicker was previously paused, set the time to at which it was paused at
							if(current_time == minval){
								// slide the time slider to the start of the animation time
								// (minval can be NOT the starting date selected, if the animation was paused later on)
								$("#time_slider").slider('value',current_time);
							}
							else {
								// if time is greater than at the very start of the animation, then just increment it by the step
								rsg_timepicker.increment_decrement_timepicker("increment");
							}
						}
						// move the slider: (calls rsg_ui.slide_time and updates the pngs)
						$("#time_slider").slider('value',current_time);
						// update the displayed date and load the corresponding ...
						// ... images for all layers for the selected date:
						
						// increase the current time:
						current_time = current_time + step;
						
						// ------------------ handling UI flags ------------------- //
						// if the rewind button has been pressed ("|<-")
						if(website_state.go_back_to_paused_animation_flag) {
							website_state.stop_flag = false;
							website_state.go_back_to_paused_animation_flag = false;
							
							// set the time picker to show the value that it was last paused at:
							if(rsg_animation.in_higher_temporal_resolution(step)){
								if(website_state.paused_hhmm == -1){
									document.getElementById("timepicker").value = "00:00";
								}
								else document.getElementById("timepicker").value = website_state.paused_hhmm;
							}
							// run the animation once again from the point at which it was last paused at:
							run(website_state.paused_time);
							//~ exit:
							return;
						}
						
						// if the stop button was pressed - reset all of the animation data 
						if(website_state.stop_flag) {
							// clear the flags for the next iteration of animation (since this 'if' stops it)
							website_state.stop_flag = false; 
							website_state.pause_flag = false; 
							website_state.currently_in_animation = false;
							website_state.go_back_to_paused_animation_flag = false;
							website_state.paused_time = slider_initial_min; // clear the paused time
							website_state.paused_hhmm = -1; // and clear the paused hour and minutes
							
							website_state.rewind_time = -1;
							website_state.rewind_hhmm = -1;
							$("#time_slider").slider('value',slider_initial_min); // move slider back to start
							if (rsg_animation.in_higher_temporal_resolution(step)) document.getElementById("timepicker").value = "00:00";						
							//~ exit:
							return;
						}
						// if the flag command has been issued (button '||' pressed)
						if(website_state.pause_flag) {
							website_state.pause_flag = false;
							website_state.currently_in_animation = false;
							website_state.paused_time = current_time-step; // keep track of the time the animation was paused at
							if(rsg_animation.in_higher_temporal_resolution(step)) website_state.paused_hhmm = document.getElementById("timepicker").value;
							//~ exit:
							return;
						}
						
						else run(current_time);
					}
					
					// base case - animation stops and the state is reset:
					else 
					{
						// when the animation is finished, we do some bookkeeping:
						website_state.currently_in_animation = false;
						// since animation has finished, change button functionality to 'play' again:
						document.getElementById("animation_icon").classList.remove("ui-icon-pause");
						document.getElementById("animation_icon").classList.add("ui-icon-play");
						document.getElementById("animation_button").onclick = function (){rsg_animation.play();}
						
						// delete the 'paused time' checkpoint
						if(minval = website_state.paused_time != -1){	
							// if the animation has finished, and there was some saved paused time,
							// ... then save that paused time to 'rewind time' variable,
							// ... so when |<- is pressed, it comes back to it even after animation has finished. 
							website_state.rewind_time = website_state.paused_time;
							if(rsg_animation.in_higher_temporal_resolution(step)) website_state.rewind_hhmm = website_state.paused_hhmm;
						}
						else{
							website_state.paused_time = -1;
							if(rsg_animation.in_higher_temporal_resolution(step)) website_state.paused_hhmm = -1;
						}
						
						// reset the time slider to be iterating over the last month:
						animation_start_date = helper.string_to_date($("#animation_start").val(), 
						                                               "yyyy/mm/dd", "/").getTime() / 1000
						animation_end_date = helper.string_to_date($("#animation_end").val(), 
						                                             "yyyy/mm/dd", "/").getTime() / 1000
						
						// lastly, delete the extra layers underneath that were not 
						// ... deleted to keep the animation smooth:
						for(i = 0; i < 4; i++){
							// remove ALL BUT LAST layers:
							for(j = 0; j < remove_previous_layers[i].length-1; j++){
								layers.remove(remove_previous_layers[i][j], false);
							}	
						}
						
					} // end of base case
					
				}, 500);	// 500 - value this function will wait between iterations
			
			}
		}
		
		else{
			website_state.play_animation = true; // next iteration of 'play_animation' will no longer turn on the selection menu
			 // reset the memorized pause and rewind times:
			website_state.paused_time = -1;
			website_state.rewind_time = -1;
			// turn on the animation start and end time selection menu
			document.getElementById("animation_ui").classList.remove("ui_off");
			document.getElementById("animation_ui").classList.add("ui_on");		
		}
		
	},
	
	// function called when the pause button (||) is clicked:
	pause_animation: function()
	{
		website_state.pause_flag = true;
		// change the button icon from 'pause' to 'play' (or in this case 'resume')
		document.getElementById("animation_icon").classList.remove("ui-icon-pause");
		document.getElementById("animation_icon").classList.add("ui-icon-play");
		website_state.play_animation = true; // setting this flag to true skips turning on the start-end selection
		
		// rewiring the onclick function to play animation instead of pause:
		document.getElementById("animation_button").onclick = function (){rsg_animation.play();}
		rsg_layers.clear_all_loaded_animation_images();
		rsg_animation.toggle_replay_button(false);
	},
	
	// function called when the stop button (|*|) is clicked:
	stop_animation: function()
	{
		if(website_state.currently_in_animation){
			// if the stop button is clicked while the animation is running:
			
			// we reset the animation state:
			website_state.play_animation = false; // triggers the start and end time selection menu to be opened when clicked 'play'
			website_state.stop_flag = true; // since in animation, the 'stop' flag will be read and the animation will be stopped
			website_state.paused_time = -1; // delete the remembered time it was paused at 
			
			// turn off the date selection menu:
			document.getElementById("animation_ui").classList.remove("ui_on");
			document.getElementById("animation_ui").classList.add("ui_off");	
			
			// change button icon from 'pause' to 'play'
			document.getElementById("animation_icon").classList.remove("ui-icon-pause");
			document.getElementById("animation_icon").classList.add("ui-icon-play");
			// set the 'play' button to call 'play_animation' when clicked
			document.getElementById("animation_button").onclick = function (){rsg_animation.play();}
			
			// turn off the animation buttons (stop and rewind buttons)
			rsg_ui.toggle_animation_buttons(false);
			
			// if the start and end times of the animation slider were changed, reset to default values
			rsg_animation.reset_animation_time_slider();	
		}
		else{
			// if the animation is stopped while it is paused:
			website_state.play_animation = false; // triggers the start and end time selection menu to be opened when clicked 'play'
			website_state.stop_flag = false; // since the animation is stopped now anyway, no need to trigger an additional stop flag
			website_state.pause_flag = false; // since the animation is paused now anyway, no need to trigger an additional pause flag
			website_state.paused_time = -1;   // clear the paused time
			
			// change button from 'pause' to 'play' icon
			document.getElementById("animation_icon").classList.remove("ui-icon-pause");
			document.getElementById("animation_icon").classList.add("ui-icon-play");
			// setup the play button to call 'play_animation' onclick
			document.getElementById("animation_button").onclick = function (){rsg_animation.play();}
			// turn off the animation buttons (stop and rewind buttons)
			rsg_ui.toggle_animation_buttons(false);
			// if the start and end times of the animation slider were changed, reset to default values
			rsg_animation.reset_animation_time_slider();	
		}
		
		rsg_layers.clear_all_loaded_animation_images();
		
	},
	
	// function called when the rewind button (|<-) is clicked:
	go_back_to_paused_animation: function()
	{
		if(website_state.currently_in_animation){
			website_state.go_back_to_paused_animation_flag = true;
		}
		else{
			website_state.play_animation = true;
			rsg_animation.play();
		}
	},
	
	
	toggle_replay_button: function(turn_on)
	{
		if (turn_on){
			document.getElementById("animation_rewind_button").classList.remove("off");
		}
		else{
			document.getElementById("animation_rewind_button").classList.add("off");
		}
	},
	
	in_higher_temporal_resolution: function(step)
	{
		return step < 86400 // 86400 is the seconds in 24 hours
	},
	
	// utility function to reset the animation timepicker to its default max and min values
	reset_animation_time_slider: function()
	{
		// get the boundary values for the time_slider (start, end)
		time_slider_dates = helper.get_timeslider_dates(helper.formatDate(website_state.url_date));
		// pass the start, end values to time_slider creating function:
		rsg_ui_widgets.add_time_slider(time_slider_dates[0], time_slider_dates[1]);
	},
	
	// utility function (used before playing the animation) to unload all loaded images for all layers
	remove_all_loaded_layer_images: function()
	{
		for(i = 0; i < 4; i++)
		{
			layers.remove(rsghelper_layers.get_layer_copy_by_id(i));
		}
	}

}
