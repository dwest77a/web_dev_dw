////RSG NRT DATA VIEWER
// $Id: visualisation.js 7726 2020-09-29 12:48:41Z blatter $
// $Id: visualisation.js 7726 2020-10-06 16:32:41Z dwest77 $

/* 
 * visualisation.js has no namespaces
 * in this file, the collection of functions take care of loading and 
 * presenting the rsg_data_viewer website.
 * 
 * the following namespaces are used:
 * - 'rsg_animation'   namespace from 'rsg_animation.js',
 * - 'rsg_timepicker'  namespace from 'rsg_timepicker.js',
 * - 'rsg_layers'      namespace from 'rsg_layer_functions.js',
 * 
 * - 'helper', 
 *   'rsghelper_layers' 
 *                     namespaces from 'rsg_helper_functions.js',
 * - 'rsg_ui',
 *   'rsg_ui_widgets'  
 *                     namespace from 'user_interface.js'
 * 
 * as well as some functions from 'data_selection.js', which are ...
 * ... currently also not under any namespace.
 */

// --------------------- GLOBAL VARIABLE SETUP ---------------------- //
// website state structure to be able to get ... 
// ... current information of the website in all functions
var website_state = {
	// --------- LOADING DATA STATE  --------- //
	layer0_loaded_from_url : false,
	layer1_loaded_from_url : false,
	layer2_loaded_from_url : false,
	layer3_loaded_from_url : false,
	
	layer0_product_nr : -1,
	layer1_product_nr : -1,
	layer2_product_nr : -1,
	layer3_product_nr : -1,
	
	layer0_custom_colours : false,
	layer1_custom_colours : false,
	layer2_custom_colours : false,
	layer3_custom_colours : false,
	
	logo_table : {},
	webpage_init_loading : false,
	
	show_loading_status : false,
	downloading_layer : false,
	loading_layer : false,
	layers_currently_downloading : 0,
	tiles_to_load : 0,
	
	list_of_customised_products : [],
	map_product_to_custom_url : [],
	customised_product_colours : [],
	
	added_text_under_colourbar  : [],
	added_logos_under_colourbar : [],
	showing_bottom_logos : [],
	
	dynamic_additional_layer_ids : {},
	overlay_layer_titles : [],
	// store the overlay layers (coast, borders, labels ...) as dictionary Label-ImageryProvider pairs:
	overlay_layers : {},
	// store the  identifiers of the layers that are switched on:
	selected_overlay_layers : [],
	
	additional_layer_titles : [],
	selected_additional_layers : [],
	
	// store the additional layers (.json, .zip, .kmz ...) as dictionary label-
	
	// --------- ANIMATION STATE  --------- //
	currently_in_animation : false,
	play_animation_flag : false,
	stop_flag : false,
	pause_flag : false,
	// when the animation is paused, make note of the paused time to resume it
	paused_time : -1,
	rewind_time : -1,
	// if the variable is htr, then also make note of paused hours and minutes
	paused_hhmm : -1,
	rewind_hhmm : -1
}

var layer_state = {
	project_table_column_indices : {}
}

// data structure to store additional & custom properties for Cesium Imagery Provider Layer:
var layer_all_aditional_properties = {};

// define the regexes used in the project tables
// ... (so that can match the column names more flexibly)
var project_table_regexes = {
	latlon         : /lat.*lon/i,
	delta_t        : /delta_t/i,
	legend_subtext : /legend.*subtext/i, // regular expression. 'i' - case insensitive
	logos          : /logos/i, // regular expression. 'i' - case insensitive
	tiled          : /tiled/i
	
}
// overriding the Html Canvas 'getContext()' function ...
// ... so that we can get the snapshot containing the Cesium rendered view (otherwise Canvas is blank)
HTMLCanvasElement.prototype.getContext = function(origFn) {
  return function(type, attribs) {
    attribs = attribs || {}; // if 'attribs' defined, use it, else assign empty dict {}
    // set not to clear the contents of the drawing buffer
    // (else when website is rendered to image, Cesium WebGL Canvas is black)
    attribs.preserveDrawingBuffer = true; 
    return origFn.call(this, type, attribs);
  };
}(HTMLCanvasElement.prototype.getContext);

/*
 * NOTE: 'var_row' references the VARiable ROW in !PROJECT TABLE!
 * requested_layer.data_long = var_row[8];                // data_long default positional column is 8
   requested_layer.data_short = var_row[9];               // data_short default positional column is 9
   requested_layer.units = var_row[10];                   // data_long default positional column is 10
   requested_layer.latlon = var_row[14];                  // data_long default positional column is 14
   NOTE: 'project_row' references the PROJECT ROW in !CONFIG TABLE!
   requested_layer.source = project_row[0] + "/" + project_row[2];
 */

// set up the defaults of column indices, if the column is positional rather than found by its name:
// (-1 means no pre-defined default)
function initialise_layer_project_table_index_mappings(nr_of_layers)
{
	for (i = 0; i < nr_of_layers; i++)
	{
		layer_state.project_table_column_indices[i] = {
			data_long      : 8,
			data_short     : 9,
			units          : 10,
			latlon         : -1,
			legend_subtext : -1,
			logos          : -1,
			delta_t        : -1,
			tiled          : -1
		}
	} 
}

function reset_layer_project_table_index_mappings(index)
{
	layer_state.project_table_column_indices[index] = {
		data_long      : 8,
		data_short     : 9,
		units          : 10,
		latlon         : -1,
		legend_subtext : -1,
		logos          : -1,
		delta_t        : -1,
		tiled          : -1
	} 
}

// since now hardcoded to 4 layers...
for (i = 0; i < 4; i++)
{
	layer_state.project_table_column_indices[i] = {
		data_long      : 8,
		data_short     : 9,
		units          : 10,
		latlon         : -1,
		legend_subtext : -1,
		logos          : -1,
		delta_t        : -1,
		tiled          : -1
	}
} 

// Variable to hold which data layer is currently active and being changed by the settings menu.
var active_data_layer = 0;
// Handles the top layer in the menu
//~ var top_layer = 0;

// Visibility of the settings menu, data select menu, and colour bar. Used by the toggle functions.
var toolbar_visible = false;
var settings_visible = true;
var data_select_menu_visible = true;
var colourbar_vis = true;

// Are we running on a small screen or mobile device. Default false.
var small_screen = false;


////GLOBAL rsg_layers FUNCTIONS

//File reader functions that onload setup the layer and on error changes the style to nodata
//holder for the image objects when loading
var img_array = []
for (k = 0; k < 4; k++) {
	img_array.push(new Image());
}

//Replace all things in a string with a new thing. Usage: date.replaceAll("-", "/") changes 2016-08-01 to 2016/08/01
String.prototype.replaceAll = function (search, replacement) {
	var target = this;
	return target.replace(new RegExp(search, 'g'), replacement);
};

//quick get element by id
function $id(id) {
 	return document.getElementById(id);
};

////STARTUP FUNCTION
var default_line_of_row_zero = 0

function getDefaultLine(data)
{
	var default_regexp = /(\^default_prod_line\^)( *= *)(.*)/gm
	var match = default_regexp.exec(data);
	
	try{
		default_line_of_row_zero = match[3]
		return match[3]
	}
		
	catch(TypeError){
		return 0
	}
}

function getOverlayLayers(data)
{
	var default_regexp = /(\^overlay_layers\^)( *= *)(.*)/gm
	var match = default_regexp.exec(data);
	
	try
	{
		var identifier_tokens = match[3].split(',');
		var return_group = [];
		
		for (let i = 0; i < identifier_tokens.length; i++)
		{
			// handle the case where in the config table, ...
			// ... the layer identifier is prepended with '*', ...
			// ... to indicate that it should be shown by default:
			if (identifier_tokens[i].charAt(0) == '*')
			{
				removed_asterisk = identifier_tokens[i].substring(1) 
				return_group.push(removed_asterisk);
				website_state.selected_overlay_layers.push(removed_asterisk);
			}
			else return_group.push(identifier_tokens[i]);
		}
		
		return return_group;
		
	}
	catch(TypeError)
	{ // if the overlay layers are not specified, or problems parsing them, ...
		// ... return an empty list.
		return [];
	}
}

function getAdditionalLayers(data)
{
	var default_regexp = /(\^additional_layers\^)( *= *)(.*)/gm
	var match = default_regexp.exec(data);
	
	try
	{
		var identifier_tokens = match[3].split(',');
		var return_group = [];
		
		for (let i = 0; i < identifier_tokens.length; i++)
		{
			layer_typename_tuple = helper.get_typename_of_additional_layer( identifier_tokens[i].substring(1) );
			// handle the case where in the config table, ...
			// ... the layer identifier is prepended with '*', ...
			// ... to indicate that it should be shown by default:
			if (layer_typename_tuple[1].charAt(0) == '*')
			{
				// get the layer info needed for future parsing as a (type, name) tuple:
				removed_asterisk = layer_typename_tuple[1].substring(1) 
				return_group.push( [layer_typename_tuple[0], removed_asterisk ]);
				//~ website_state.selected_additional_layers.push( removed_asterisk );
				website_state.selected_additional_layers.push( helper.Capitalise_Each_Word(helper.underscores_to_spaces(helper.remove_parenthesis(removed_asterisk))) );
			}
			else
			{ 
				return_group.push( [layer_typename_tuple[0], layer_typename_tuple[1] ] );
			}
		}
		
		return return_group;
		
	}
	catch(TypeError)
	{ // if the overlay layers are not specified, or problems parsing them, ...
		// ... return an empty list.
		return [];
	}
}

//When the document is loaded, setup the calendar and page elements
$(document).ready(function () 
{
	//$('.ral-button').tooltip();
	// since while the website is being loaded for the first time it might trigger ....
	// ... certain onchange onload events (such as slide timer) and lead to redownloading ...
	// ... the images already loaded by the URL, we define 'webpage_initially_loading' state ...
	// ... which makes the page setup an atomic operation - this is ue_sed to lock certain redownloads
	
	rsg_animation.reset_animation_time_slider();
	website_state.webpage_init_loading = true;
	
	// initialise (default values) for layer index mappings from the project tables:
	initialise_layer_project_table_index_mappings(nr_of_layers=4)
	
	//~ setup_layers_from_url();
	//load the datepicker-ui widget:
	rsg_ui_widgets.add_datepicker();
	
	rsg_ui.addMouseoversToButtons();
	var der = $("#datepicker-13");
	// reinitialise jscolor library:
	jscolor.installByClassName("jscolor");
	
	//add layers from the url query
	// get the configuration table 
	// (TAGS: get config table, get_config_table getConfigTable)
		$.ajax({
		type: "GET",
		url: "../rsg_data_viewer_config/config_table.txt",
		dataType: "text",
		success: function (data)
		{
			default_line_of_row_zero = getDefaultLine(data);
			// get the overlay layer identifiers, that need to be loaded:
			website_state.overlay_layer_titles = getOverlayLayers(data);
			website_state.additional_layer_titles = getAdditionalLayers(data);
			
			data_without_comments = removeComments(data);
			//populate menu
			setupAccordion(data_without_comments);
			//add layers from the url query
			setup_layers_from_url(window.location.href);
		},
		async: false
	});
	
	//~ add_bottom_logo(href="https://www.esa.int/Applications/Observing_the_Earth/Copernicus", 
	                //~ src="../Assets/Images/Logos/Copernicus-logo-30T.png", height=50, alt="Copernicus",
	                //~ hspace=14, small_scr="copr")
	                //~ 
	//~ add_bottom_logo(href="https://www.ecmwf.int/", 
	                //~ src="../Assets/Images/Logos/ECMWF_logo.production.png", height=15, alt="ECMWF",
	                //~ hspace=14, small_scr="copr")
	
	setupDate(); // set up the date to default to (today's date)
	setupPage();
	setup_listeners();
	
	init_events_array();
	ready_events();
	// set up the overlays and the additional layers:
	rsg_ui_widgets.set_up_extra_layers();
	
	// after the page has been set up, unlock the website:
	website_state.webpage_init_loading = false;
	rsg_ui.hide_toolbar();
	
});

//When the document is loaded, setup the calendar and page elements
/*
$(document).ready(function () {

 	//load the datepicker-ui widget
 	$(function () {
 		$("#datepicker-13").datepicker({
 			dateFormat: "yy/mm/dd",
 			//set the miniumum or maximum available date.
 			maxDate: (new Date()),
 			onSelect: function (event, ui) {
 				reload_layer_images_on_new_datetime()
 			}
 		});
 	});

	//	setup_layers_from_url();

 	setupDate();

 	setupPage();
 });
*/
/* ----------------- INITIALISING THE CESIUM VIEWER ----------------- */

//setup the default view area for when the home button is pressed.
// Define before viewer initialisation to also set as initial view
// Default to view over UK/Europe
var west = -50.0;
var south = 10.0;
var east = 60.0;
var north = 89.0;
var rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);

Cesium.Camera.DEFAULT_VIEW_FACTOR = 0.3;
Cesium.Camera.DEFAULT_VIEW_RECTANGLE = rectangle;

// for the wind vectors to be loaded, there is a bug in the Third Party ...
// ... code that Cesium uses (zip.js) which assumes that the path is where ...
// ... the Cesium Base URL is, and hence if Cesium is imported as a script link, ...
// ... from the URL: https://cesium.com/downloads/cesiumjs/releases/1.65/Build/Cesium/ ...
// ... then it cannot construct a Worker for a different domain starting http://gws-access.jasmin.ac.uk.
// hence we change the Cesium Base URL manually here to overcome that problem.
//~ window['CESIUM_BASE_URL'] = "http://gws-access.jasmin.ac.uk/public/rsgnceo/web_dev_dd/rsg_data_viewer/Assets/Build/Cesium/";

var base_url_source = window.location.href
base_url_source = base_url_source.substring(0, base_url_source.lastIndexOf("/"))
// Get Base Url for user (public/internal)

// hardcoded Cesium Base URL 
// Cesium - Cesium Ion Logo Change attempt (unsuccessful 09/08/2021)
var e = base_url_source + '/Assets/Build/Cesium/Assets/Images/cesium_credit.png'
Cesium.defaultCredit = new Cesium.Credit('<a href="https://cesium.com" target="_blank"><img src="'+e+'" title="Cesium"/></a>',!0)

Cesium.buildModuleUrl.setBaseUrl(base_url_source+"/Assets/Build/Cesium/");
// NOTE: the Cesium base URL can be checked with this command:
//~ Cesium.buildModuleUrl()

// turn off usage of Cesium Ion (Not using Cesium Ion. Serving our own data/images):
Cesium.Ion.defaultAccessToken = null;

//set up the cesium container, turning off the animation and timeline parameters, and removing the base layer picker as well
var viewer = new Cesium.Viewer('cesiumContainer', {
	timeline: false,
	animation: false,
	//set infobox to true if you wish info boxes for data sources to be shown. Highlights the coastline as well.
	infoBox: false,
	//baseLayerPicker: true, // Map selection (Bing maps, open street map etc)
	selectionIndicator: false,
	// Performance improvements:
	requestRenderMode: true, // only render a new frame when generated
	targetFrameRate: 18, // drop the target frame rate to reduce CPU usage.
	
	geocoder: false,
	imageryProvider: false,
	baseLayerPicker: false
	
});

// offset of tiles loaded (higher number - better performance, ...
// ... but lower level tiles loaded depending on the zoom!)
viewer.scene.globe.maximumScreenSpaceError = 4;

/* LAYER LOADING FOR DEBUGGING / MONITORING PURPOSES (ADDED TO SOLVE FIREFOX UNDEFINED BUG)
viewer.clock.onTick.addEventListener(log_layer_status);

function log_layer_status()
{
	for (id = 0; id < 4; id++)
	{
		var firefox_debug = document.getElementById("layer"+id+"_");
		firefox_debug.innerHTML = rsghelper_layers.get_layer_copy_by_id(id).assigned_subproperties;
	}
}
*/

// Testing display KMZ based wind vectors (rather than image). This needs a few chagnes before deployment:
// - Get RS to generate the .kmz files in appropriate place (under nrt/...ecmwf_wind10m/YYYY/ maybe?)
// - Fix code to pickup currently selected date from date widget
var kmz_wind_vector = new Cesium.KmlDataSource();
function toggleWindVectors(checkbox)
{
	if(checkbox.checked)
	{
		alert("KMZ winds not implemented. Fix code.");
		kmz_wind_vector.load('http://gws-access.jasmin.ac.uk/public/rsg_share/nrt/dd_test/20190901_wind10m_day.kmz');
		
		viewer.dataSources.add(kmz_wind_vector);
//~ 'http://gws-access.jasmin.ac.uk/public/rsgnceo/web_dev_dd/rsg_data_viewer/Assets/Images/20190901_wind10m_day.kmz'
//~ viewer.dataSources.add(Cesium.KmlDataSource.load('http://gws-access.jasmin.ac.uk/public/rsgnceo/web_dev_dd/rsg_data_viewer/Assets/Images/20190901_wind10m_day.kmz',
		 //~ = Cesium.KmlDataSource.load('http://gws-access.jasmin.ac.uk/public/rsg_share/nrt/dd_test/20190901_wind10m_day.kmz',
			//~ {
				//~ camera: viewer.scene.camera,
				//~ canvas: viewer.scene.canvas
			//~ })
		//~ viewer.dataSources.add(kmz_wind_vector);
	}
	else 
	{ viewer.dataSources.remove(kmz_wind_vector);
		viewer.scene.requestRender();
	}
}

// --------------------------- functions relating to screenshot capturing  --------------------------- //

// configure settings
var targetResolutionScale = 1.0; // for screenshots with higher resolution set to 2.0 or even 3.0
var timeout = 1000; // in ms
  
var scene = viewer.scene;
if (!scene) {
    console.error("No scene");
    console.error("No scene");
}

function make_snapshot()
{
	// define callback functions
	var prepareScreenshot = function(){
	    var canvas = scene.canvas;    
	    viewer.resolutionScale = targetResolutionScale;
	    scene.preRender.removeEventListener(prepareScreenshot);
	    // take snapshot after defined timeout to allow scene update (ie. loading data)
	    setTimeout(function(){
	        scene.postRender.addEventListener(takeScreenshot);
	    }, timeout);
	}
	
	var takeScreenshot = function(){    
	    scene.postRender.removeEventListener(takeScreenshot);
	    var canvas = scene.canvas;
	    canvas.toBlob(function(blob){
	        var url = URL.createObjectURL(blob);
	        downloadURI(url, "snapshot-" + targetResolutionScale.toString() + "x.png");
	        // reset resolutionScale
	        viewer.resolutionScale = 1.0;
	    });
	}
	
	scene.preRender.addEventListener(prepareScreenshot);
	
}


function downloadURI(uri, name) {
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    // mimic click on "download button"
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
}
// ------------------------- END of functions relating to screenshot capturing  ------------------------- //



// performance improvements (turn off fog,atmosphere etc.)
viewer.scene.skyAtmosphere.show = false;
viewer.scene.fog.enabled = false;
viewer.scene.globe.showGroundAtmosphere = false;
// @TODO solve north pole not loading (asked Cesium forum for help 2020-07-06)
viewer.scene.globe.northPoleColor = Cesium.Color.WHITE;

// Turn off background maps (eg. Bing maps, open streetmap etc.)
viewer.scene.imageryLayers.removeAll();
viewer.scene.globe.baseColor = Cesium.Color.BLACK;

// setup the single tile custom base layer(s) - if add roads/borders in the future:
var custombasemap = viewer.scene.imageryLayers;
// Access Natural Earth II imagery, which uses a TMS tiling scheme and Geographic (EPSG:4326) project
custombasemap.addImageryProvider(new Cesium.UrlTemplateImageryProvider({

    //~ url : Cesium.buildModuleUrl('http://gws-access.jasmin.ac.uk/public/rsgnceo/web_dev_dd/Assets/Images/Basemaps/BlueMarble') + '/{z}/{x}/{reverseY}.png',
    // NOTE: BlueMarble linked here is relative to where Cesium sourcecode is:
    url : Cesium.buildModuleUrl('../../../../../web_internal/Assets/Images/Basemaps/BlueMarble' + '/{z}/{x}/{reverseY}.png'),
    // using the WebMercatorTilingScheme:
    /* A tiling scheme for geometry referenced to a WebMercatorProjection, EPSG:3857. 
     * This is the tiling scheme used by Google Maps, Microsoft Bing Maps, and most of ESRI ArcGIS Online. */
    tilingScheme : new Cesium.WebMercatorTilingScheme(),
    maximumLevel : 6 // set maximum tiling detail level     
    
    // maximumLevel:
    // 1 - 0/1.png max - 1
    // 2 - 3/4.png max - 4
    // 3 - 6/7.png max - 7
    // 4 - 12.png max - 12
    // 5 - 23.png max - 23
    // 6 - 42.png max 
    // 7 - 80's max - too far
    
    
		//~ credit : 'Base Map Used:<br>\nReto Stöckli, NASA Earth Observatory, NASA Visible Earth - August, Blue Marble Next Generation w/ Topography and Bathymetry, ',
}));



var gibs = {};

gibs.GeographicTilingScheme = function (options) {
  var self = new Cesium.GeographicTilingScheme(options);
  var Math = Cesium.Math;

  var tilePixels = 512;
  var rectangle = Cesium.Rectangle.MAX_VALUE;

  // Resolution: radians per pixel
  var levels = [
    { width: 2, height: 1, resolution: 0.009817477042468103},
    { width: 3, height: 2, resolution: 0.004908738521234052 },
    { width: 5, height: 3, resolution: 0.002454369260617026 },
    { width: 10, height: 5, resolution: 0.001227184630308513 },
    { width: 20, height: 10, resolution: 0.0006135923151542565 },
    { width: 40, height: 20, resolution: 0.00030679615757712823 },
    { width: 80, height: 40, resolution: 0.00015339807878856412 },
    { width: 160, height: 80, resolution: 0.00007669903939428206 },
    { width: 320, height: 160, resolution: 0.00003834951969714103 }
  ];

  self.getNumberOfXTilesAtLevel = function (level) {
    return levels[level].width;
  };

  self.getNumberOfYTilesAtLevel = function (level) {
    return levels[level].height;
  };

  self.tileXYToRectangle = function (x, y, level, result) {
    var resolution = levels[level].resolution;

    var xTileWidth = resolution * tilePixels;
    var west = x * xTileWidth + rectangle.west;
    var east = (x + 1) * xTileWidth + rectangle.west;

    var yTileHeight = resolution * tilePixels;
    var north = rectangle.north - y * yTileHeight;
    var south = rectangle.north - (y + 1) * yTileHeight;

    if (!result) {
      result = new Cesium.Rectangle(0, 0, 0, 0);
    }
    result.west = west;
    result.south = south;
    result.east = east;
    result.north = north;
    return result;
  };

  self.positionToTileXY = function (position, level, result) {
    if (!Cesium.Rectangle.contains(rectangle, position)) {
      return undefined;
    }

    var xTiles = levels[level].width;
    var yTiles = levels[level].height;
    var resolution = levels[level].resolution;

    var xTileWidth = resolution * tilePixels;
    var yTileHeight = resolution * tilePixels;

    var longitude = position.longitude;
    if (rectangle.east < rectangle.west) {
      longitude += Math.TWO_PI;
    }

    var xTileCoordinate = (longitude - rectangle.west) / xTileWidth | 0;
    if (xTileCoordinate >= xTiles) {
      xTileCoordinate = xTiles - 1;
    }

    var latitude = position.latitude;
    var yTileCoordinate = (rectangle.north - latitude) / yTileHeight | 0;
    if (yTileCoordinate > yTiles) {
      yTileCoordinate = yTiles - 1;
    }

    if (!result) {
      result = new Cesium.Cartesian2(0, 0);
    }
    result.x = xTileCoordinate;
    result.y = yTileCoordinate;
    return result;
  };

  return self;
};

var geotiling = gibs.GeographicTilingScheme();

/// ---------------------------------- OVERLAY LAYERS (COAST, CITIES, COUNTRIES) ---------------------------------- ///


function add_additional_datasource_layer(path_to_file, additional_layer_typename)
{
	// define the div name, where the new additional layer buttons will get added
	var layer_option_list_element_id = "layer_option_list1";
	
	switch (additional_layer_typename[0]) 
	{
		case "czml":
			var additional_layer_source = new Cesium.CzmlDataSource();
			add_datasource_layer(path_to_file, additional_layer_source, layer_option_list_element_id);
			break;
		case "zip":
			add_zip_additional_datasource_layer(path_to_file);
			break;
		
		case "json":
			var additional_layer_source = new Cesium.GeoJsonDataSource();
			add_datasource_layer(path_to_file, additional_layer_source, layer_option_list_element_id);
			break;
			
		case "kmz":
			var additional_layer_source = new Cesium.KmlDataSource();
			add_datasource_layer(path_to_file, additional_layer_source, layer_option_list_element_id);
			break;
			
	};
}

function add_WMTS_overlay_tiled_layer(base_url, layer_identifier, min_level, max_level )
{
	// if max and min levels are undefined, assign default levels:
	if (min_level === undefined) min_level = 0;
	if (max_level === undefined) max_level = 8;
	
	var WMTS_overlay = new Cesium.WebMapTileServiceImageryProvider({
		url : base_url,
		layer: layer_identifier,
		style: '',
		format: 'image/png',
		tileMatrixSetID: 'EPSG4326_250m',
		minimumLevel: min_level,
		maximumLevel: max_level,
		//~ tileWidth: 512,
		//~ tileHeight: 512,
		tilingScheme: geotiling,
		credit : new Cesium.Credit('U. S. Geological Survey')
	});
	
	// add the coastline tiles defined above:
	viewer.imageryLayers.addImageryProvider(WMTS_overlay);
	// get the overlay layer that was just added:
	// ( '.get()' gets the layer as ImageryProvider rather than WebMapppTile...Provider, ...
	//  ... which (the ImageryProvider) can then be used to raise the overlay layer on top )
	website_state.overlay_layers[layer_identifier] = viewer.imageryLayers.get(viewer.imageryLayers._layers.length - 1);
	
	rsg_ui.add_checkboxes_in_list_element(layer_identifier,
	                               "layer_option_list2");
	
}

function add_coastline_overlay()
{
	var coastline_webmap = new Cesium.WebMapTileServiceImageryProvider({
	    //~ url : 'http://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/WMTS',
	    url : 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi',
	    
			//~ url: '//gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi',
			//~ layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
			layer: 'Coastlines',
			style: '',
			format: 'image/png',
			tileMatrixSetID: 'EPSG4326_250m',
			minimumLevel: 0,
			maximumLevel: 8,
			//~ tileWidth: 512,
			//~ tileHeight: 512,
			tilingScheme: geotiling,
			credit : new Cesium.Credit('U. S. Geological Survey')
	});
	
	// add the coastline tiles defined above:
	viewer.imageryLayers.addImageryProvider(coastline_webmap);
	// get the overlay layer that was just added:
	// ( '.get()' gets the layer as ImageryProvider rather than WebMapppTile...Provider, ...
	//  ... which (the ImageryProvider) can then be used to raise the overlay layer on top )
	/// coastline_tile_layer = viewer.imageryLayers.get(viewer.imageryLayers._layers.length - 1);
	website_state.overlay_layers["coastline_tile_layer"] = viewer.imageryLayers.get(viewer.imageryLayers._layers.length - 1);
}

function add_labels_overlay()
{
	var labels_webmap = new Cesium.WebMapTileServiceImageryProvider({
		//~ url : 'http://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/WMTS',
		url : 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi',
		//~ url: '//gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi',
		//~ layer: 'MODIS_Terra_CorrectedReflectance_TrueColor',
		layer: 'Reference_Labels',
		style: '',
		format: 'image/png',
		tileMatrixSetID: 'EPSG4326_250m',
		minimumLevel: 0,
		maximumLevel: 8,
		//~ tileWidth: 512,
		//~ tileHeight: 512,
		tilingScheme: geotiling,
		credit : new Cesium.Credit('U. S. Geological Survey')
	});
	
	// add the coastline tiles defined above:
	viewer.imageryLayers.addImageryProvider(labels_webmap);
	// get the overlay layer that was just added:
	// ( '.get()' gets the layer as ImageryProvider rather than WebMapppTile...Provider, ...
	//  ... which (the ImageryProvider) can then be used to raise the overlay layer on top )
	/// labels_layer = viewer.imageryLayers.get(viewer.imageryLayers._layers.length - 1);
	website_state.overlay_layers["labels_layer"] = viewer.imageryLayers.get(viewer.imageryLayers._layers.length - 1);
}

function add_country_borders_overlay()
{
	var borders_webmap = new Cesium.WebMapTileServiceImageryProvider({
		url : 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi',  
		layer: 'Reference_Features',
		style: '',
		format: 'image/png',
		tileMatrixSetID: 'EPSG4326_250m',
		minimumLevel: 0,
		maximumLevel: 8,
		//~ tileWidth: 512,
		//~ tileHeight: 512,
		tilingScheme: geotiling,
		credit : new Cesium.Credit('U. S. Geological Survey')
	});

	// add the coastline tiles defined above:
	viewer.imageryLayers.addImageryProvider(borders_webmap);
	// get the overlay layer that was just added:
	// ( '.get()' gets the layer as ImageryProvider rather than WebMapppTile...Provider, ...
	//  ... which (the ImageryProvider) can then be used to raise the overlay layer on top )
	/// borders_layer = viewer.imageryLayers.get(viewer.imageryLayers._layers.length - 1);
	website_state.overlay_layers["borders_layer"] = viewer.imageryLayers.get(viewer.imageryLayers._layers.length - 1);
}

function remove_overlay_layer_by_name(overlay_name)
{
	// for instant result, make it transparent, ....
	website_state.overlay_layers[overlay_name].alpha = 0; 
	
	// ... and then mark it for deletion (deletes asynchronously)
	/// viewer.imageryLayers.remove( website_state.overlay_layers[overlay_name] );
}

function show_overlay_layer_by_name(overlay_name)
{
	// for instant result, make it transparent, ....
	website_state.overlay_layers[overlay_name].alpha = 1; 
	
	// ... and then mark it for deletion (deletes asynchronously)
	/// viewer.imageryLayers.remove( website_state.overlay_layers[overlay_name] );
}

function toggle_overlay(overlay_id)
{
	checkbox_clicked = document.getElementById(overlay_id);
	
	if (checkbox_clicked.checked)
	{
		show_overlay_layer_by_name(overlay_id);
	}
	
	else
	{
		remove_overlay_layer_by_name(overlay_id);
	}
	
}

// ---------------------------------------------------------------- TESTING AVHRR TILES ---------------------------------------------------------------- // 
//~ var avhrrtest = viewer.scene.imageryLayers;
//~ avhrrtest.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
    //~ url : Cesium.buildModuleUrl('http://gws-access.jasmin.ac.uk/public/rsgnceo/projects/avhrr3/avhrr3_metopb_imagery/quick_look_cesium/2020/04/24/20200424_dg0p05_day/'+'/{z}/{x}/{reverseY}.png'),
    //~ tilingScheme : new Cesium.WebMercatorTilingScheme(),
    //~ maximumLevel : 8 // set maximum tiling detail level     
//~ }));
// ---------------------------------------------------------------- TESTING AVHRR TILES ---------------------------------------------------------------- // 
//2020-04-29

// setup the imagery data layers
var layers = viewer.scene.imageryLayers

// adding support for N layers, not just hard-coded 4:
//~ function initialise_n_layers(n)
//~ {
	for (i = 0; i < 4; i++)
	{
		window["layer"+i] = layers.addImageryProvider(new Cesium.SingleTileImageryProvider({
			url: '../Assets/Data/empty.png',
			rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90),
			alpha: 1,
			minificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
			magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
			product_nr : -1,
			project_nr : -1
		}));
	}
	var iteration_index = 0

var layer0 = window['layer0'];
var layer1 = window['layer1'];
var layer2 = window['layer2'];
var layer3 = window['layer3'];
//Add each of the png's as a layer and render them on the map. The transparency is controlled by the alpha parameter.
//Maximum of four layers by design.
// for each layer we specify nearest neighbour interpolation to get sharp pixel edges 
/*
var layer0 = layers.addImageryProvider(new Cesium.SingleTileImageryProvider({
	url: '../Assets/Data/empty.png',
	rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90),
	alpha: 1,
	minificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
	magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
	product_nr : -1,
	project_nr : -1
}));


var layer1 = layers.addImageryProvider(new Cesium.SingleTileImageryProvider({
	url: '../Assets/Data/empty.png',
	rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90),
	minificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
	magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
	product_nr : -1,
	project_nr : -1
}));

var layer2 = layers.addImageryProvider(new Cesium.SingleTileImageryProvider({
	url: '../Assets/Data/empty.png',
	rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90),
	minificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
	magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
	product_nr : -1,
	project_nr : -1
}));

var layer3 = layers.addImageryProvider(new Cesium.SingleTileImageryProvider({
	url: '../Assets/Data/empty.png',
	rectangle: Cesium.Rectangle.fromDegrees(-180, -90, 180, 90),
	minificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
	magnificationFilter: Cesium.TextureMagnificationFilter.NEAREST,
	product_nr : -1,
	project_nr : -1
}));
*/

//Sets up initial properties of layers. Each layer is set up as an object so the properties can easily be read.
layer0.data_long = "empty layer";
layer0.units = "null";
layer0.source = "-";
layer0.data = "";
layer0.hidden = "false";
layer0.index = 0;
layer0.assigned_subproperties = false;

layer1.data_long = "empty layer";
layer1.units = "null";
layer1.source = "-";
layer1.hidden = "true";
layer1.index = 1;
layer1.assigned_subproperties = false;

layer2.data_long = "empty layer";
layer2.units = "null";
layer2.source = "-";
layer2.hidden = "true";
layer2.index = 2;
layer2.assigned_subproperties = false;

layer3.data_long = "empty layer";
layer3.units = "null";
layer3.source = "-";
layer3.hidden = "true";
layer3.index = 3;
layer3.assigned_subproperties = false;

// Add Cesium BingMaps registered license key for use in RSG webpages
//~ Cesium.BingMapsApi.defaultKey = 'AvKjQyge6ivR7r1AUkuV6wp5yljmfAJIadBzC7G4NL2VCzvC7KMBhkj-QnT7zidH';

// global variable to tell whether to switch to a new active layer (highlight another layer) or not
var date_or_time_changed = false;

var layers_to_remove = [] // removing layers that are no longer on top for the animation
var remove_previous_layers = {
	0 : [],
	1 : [],
	2 : [],
	3 : []
} // removing layers that are no longer on top for the animation (data structure used in animation smoothing)

// The following is the additional layers (country borders, coastline, etc) update
// Carried out on 2020-01-08 by dosmi
// To reduce the map .json files, the appropriate resolution borders can be zipped
// ... and the following code unzips it and loads the json layer.
// (The size reduction can reach 70%, now client has to load less data) 
//~ var myZip = new JSZip();
var map_jsonFilename_to_stringData = {};
var map_jsonFilename_to_GeoJsonDataSource = {}

var zipfile_name = "additional_layers.zip"
var default_layer = "Coastlines";
//~ var default_layer = "Country Borders";

// utility function to capitalize each word of a string
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

//Called on startup. Set the top layer to be visible and assign the transparencies to the other layers.
function setupPage() {
	//hide mobile logo
// 	hide_item("#ralsp_small");
	rsg_ui.hide_data_select();
	rsg_ui_widgets.make_layer_selection_sortable();

	//~ load_logo_config_table

	//reshuffle the layers so that 0 is on top.
	rsg_layers.reshuffle_layers();
	// #bugfix when layers loaded from the URL, it would re-initialise the layer properties that were loaded
	// # solution: move the following line before loading layers from URL:
	// initialise_layer_project_table_index_mappings(nr_of_layers=4)
	//~ initialise_n_layers(4)
	
	// only set the first layer to be visible
	//~ layer0.alpha = 1;
	//~ layer1.alpha = 0;
	//~ layer2.alpha = 0;
	//~ layer3.alpha = 0;

	//add the coastline
	//~ viewer.dataSources.add(coastline_outline); 2020-01-07

	//update the menu UI
	rsg_layers.update_names();
	rsg_ui.hide_settings();
	//rsg_animation.reset_animation_time_slider();
	//~ rsg_ui.hide_colourbar();
	
	// get the boundary values for the time_slider (start, end)
	time_slider_dates = helper.get_timeslider_dates(helper.formatDate(website_state.url_date));
	// pass the start, end values to time_slider creating function:
	rsg_ui_widgets.add_time_slider(time_slider_dates[0], time_slider_dates[1]);
	
	// setup the optional layer button events (additional & overlay layer buttons)
	rsg_ui_widgets.set_additional_layer_wrapper_onclick_event("selected-layers-b", "selected_layers", "layer_option_list1"); // "additional_layer_wrapper");
	rsg_ui_widgets.set_additional_layer_wrapper_onclick_event("overlay-layers-b", "overlay_layers", "layer_option_list2"); // "overlay_layer_wrapper");
	rsg_ui_widgets.set_additional_layer_wrapper_onclick_event("exit-window-0", "selected_layers", "layer_option_list1"); // "additional_layer_wrapper");
	rsg_ui_widgets.set_additional_layer_wrapper_onclick_event("exit-window-1", "overlay_layers", "layer_option_list2"); // "overlay_layer_wrapper");

	// depending on the screen size, turn on or of UI elements
	// NOTE: this also updates the global variable 'screen_size')
	rsg_ui.adjust_to_screen_size();
	// show toolbar also sets up the position of the toolbar for future references
	rsg_ui.show_toolbar(); // after above as need logo size/location
	
	add_button_to_top_toolbar(button_id="", button_title="Download Screenshot", button_class="", 
	                          button_classes=[], button_onclick=download_screenshot, icon_class="ui-icon-camera");
	
	add_button_to_top_toolbar(button_id="events-dropdown-b", button_title="Events", button_class="",
	                          button_classes=[],button_onclick=open_events, icon_class="ui-icon-calendar");
	
	//add_button_to_top_toolbar(button_id="", button_title="FAQs", button_class="cesium_navigation_help_button",
	//                          button_classes=[], button_onclick=redirect_to_faqs, icon_class="ui-icon-help");
	
	add_button_to_top_toolbar(button_id="", button_title="Share", button_class="", 
	                          button_classes=[], button_onclick=open_share_toolbar, icon_class="ui-icon-action");
	                          
	                          
	//~ <button title="Make a snapshot" class="ral_button" onclick="make_snapshot()"><span class="ui-icon ui-icon-image">   
	/*                       
	add_button_to_top_toolbar(button_id="", button_title="Download Pretty Snapshot", button_class="", 
	                          button_classes=[], button_onclick=make_snapshot, icon_class="ui-icon-image");
	//~ ><button id="download" title="Make a snapshot" class="ral_button"><span class="ui-icon ui-icon-camera"><
	add_button_to_top_toolbar(button_id="", button_title="Download Screenshot", button_class="", 
	                          button_classes=[], button_onclick=download_screenshot, icon_class="ui-icon-camera");
	*/
	// Alter cesium footer with new logos - small logo for cesium missing
	alter_default_cesium_logo();
	add_bottom_logo(href="http://www.nceo.ac.uk/", 
	                src="../Assets/Images/Logos/nceo_logo.png", height=50, alt="NCEO",
	                hspace=14, small_scr="../Assets/Images/Logos/nceo_logo_small.png")
	add_bottom_logo(href="http://www.stfc.ac.uk/", 
	                src="../Assets/Images/Logos/UKRI_STF_Council-Logo_Horiz-RGB_white.png", height=50, alt="UKRI-STFC",
	                hspace=14, small_scr="../Assets/Images/Logos/UKRI_STF_Council-Logo_Square-RGB_W.png")
	add_credit_data_attribution();
	add_credit_link_to_footer("Policy & Cookies", "https://stfc.ukri.org/about-us/privacy-statement/");
	add_credit_link_to_footer("Terms of use", "https://stfc.ukri.org/about-us/terms-of-website-use-disclaimer/");
	add_credit_popup_to_footer("Acknowledgements",rsg_ui.open,['popup_box', 'footer_lightbox']);
//	redirect_toolbar("cesium-navigation-help-button", "http://gws-access.jasmin.ac.uk/public/rsg_share/webpages/landing/faqs.html");
	redirect_toolbar("cesium-navigation-help-button", "http://gws-access.jasmin.ac.uk/public/rsg_share/","FAQs"); // changed url 04/08/2021
    redirect_toolbar("cesium-home-button", "http://gws-access.jasmin.ac.uk/public/rsg_share/landing/"); // changed url 04/08/2021
// Once alias/redirect setup, the above line should be updated to:
//	redirect_toolbar("cesium-navigation-help-button", "http://rsg.rl.ac.uk/landing/");

	
	// turn off some elements to be visible in the screenshots:
	setup_ignore_in_screenshot();
	
 	//~ turn_off_button("cesium-baseLayerPicker-selected", "parent");

	//hide get started page if person has selected this to be off
	var welcome_cookie = get_cookie("welcome_info");
	if(welcome_cookie == "off"){
		get_started()
	}
	
	var url_cookie = get_cookie('saved_url');
	var comp = (url_cookie == window.location.href);
	if(url_cookie != "" && url_cookie != window.location.href){
		window.location.href = url_cookie;
	}
	//uncomment to show data select on startup
	//rsg_ui.toggle_add_layer(0);
};

// ------------------------------------------ additional layers adding ---------------------------------------- //

function add_datasource_layer(path_to_file, additional_layer_source, layer_option_list_element_id)
{
	filename = helper.get_filename_from_path(path_to_file);
	pure_filename = helper.remove_file_extension(filename)
	formatted_filename = helper.Capitalise_Each_Word( pure_filename );
	
	// do a quick test to see if the layer is a dynamic (changing with time) additional layer:
	if ( is_additional_layer_dynamic(path_to_file) )
	{
		if ( ! (pure_filename in website_state.dynamic_additional_layer_ids) )
		{ // keep track of dynamic layer if not already there:
			website_state.dynamic_additional_layer_ids[pure_filename] = path_to_file;
		}
		path_to_file = add_yyyy_mm_dd_to_path_from_datepicker(path_to_file, document.getElementById("datepicker-13").value);
	}
	
	var is_layer_on = website_state.selected_additional_layers.indexOf(helper.Capitalise_Each_Word(helper.underscores_to_spaces(formatted_filename) )) != -1
	
	rsg_ui.setup_additional_layer_selection(filename, layer_option_list_element_id, is_layer_on );
	
	if ( is_layer_on )
	{ // if processing the 'on by default' extra layer, we show it (load it)
		additional_layer_source.load(path_to_file, 
		{
			stroke: Cesium.Color.SILVER,
			// display only the borders (Alpha(0) -> transparent), ...
			fill: Cesium.Color.RED.withAlpha(0), 
			// ... otherwise the borders are filled in with default Yellow
			strokeWidth: 1.5,
			allowPicking: true
		}); 
		
		// ... make 'formatted_filename' point to its GeoJsonDataSource
		map_jsonFilename_to_GeoJsonDataSource[helper.remove_file_extension(filename)] = additional_layer_source;
	}
	
	// make 'formatted_filename' point to its data:
	map_jsonFilename_to_stringData[helper.remove_file_extension(filename)] = path_to_file;
	viewer.dataSources.add(additional_layer_source);
}

// ------------------------------------------ additional layers adding ---------------------------------------- //

function add_zip_additional_datasource_layer(zipfile_name)
{
	// The following is the additional layers (country borders, coastline, etc) update
	// Carried out on 2020-01-08 by dosmi
	// To reduce the map .json files, the appropriate resolution borders can be zipped
	// ... and the following code unzips it and loads the json layer.
	// (The size reduction can reach 70%, now client has to load less data) 
	var myZip = new JSZip(); // create a new object for every zip file to remove old files

	//~ JSZipUtils.getBinaryContent('../Assets/Data/'+zipfile_name, function(err, data) 
	JSZipUtils.getBinaryContent(zipfile_name, function(err, data) 
	{
		if(err){
				throw err; // handle error
		}
			
		myZip.loadAsync(data).then(function () 
		{ // define the name of the 'ul' element where the layer names will be populated:
			layer_option_list_element_id = "layer_option_list1" 
			
			// .files gets a file inside the zip, we iterate each zipped file:
			Object.keys(myZip.files).forEach(function (filename) 
			{ // filename - iterative name (of each zipped file)
				// leave only the default layer checkbox set to true by default (turn off others):
				
				rsg_ui.setup_additional_layer_selection(filename, layer_option_list_element_id, (filename.charAt(0) == '+') );
				
				// set the layer_id to be the file name but without the extension, ...
				/// ... and also stripping the '+' if the filename inside .zip was given to prioritise the layer. 
				
				var layer_id = helper.remove_file_extension( filename.substring(filename.charAt(0) == '+') );
				
				/*
				var layer_id = helper.remove_file_extension( filename.substring(filename.charAt(0) == '+') );
				var list_of_layer_options = document.getElementById(layer_option_list_element_id);
				var layer = document.createElement("LI");
				var layer_input = document.createElement("input");
				var layer_name = document.createElement("p");
				layer_input.id = layer_id;part
				layer_input.type = "checkbox";
				layer_input.name = layer_id;
				*/
				
				// if file inside that .zip file starts with '+' symbol, then turn it on: 
				if (filename.charAt(0) == '+')
				{
					// get the layer info needed for future parsing as a (type, name) tuple:
					// Capitalise Each Word:
					var formatted_text = helper.Capitalise_Each_Word(layer_id);
					//~ website_state.selected_additional_layers.push( layer_id.replace(/\s+/g, '_').toLowerCase() );
					website_state.selected_additional_layers.push( helper.Capitalise_Each_Word(helper.underscores_to_spaces(formatted_text)) );
					all_shown_layer_names = "";
					for (let i = 0; i < website_state.selected_additional_layers.length; i++)
					{
						// set the choice button to display the name of the default layers
						// make the name for the are which shows which layers are turned on
						/// ... ('repeat' means - if the layer is not the first one, then add a comma)
						all_shown_layer_names += ", ".repeat(i>0) + website_state.selected_additional_layers[i];
					}
					$('#additional-layers-active-listnames').html(all_shown_layer_names);
				}
				/*
				else
				{
					layer_input.checked = false;
				}
				
				// back to main branch
				layer_input.href = "#";
				layer_input.tabIndex="-1";
				layer_input.classList.add("additional_layer_input");
				
				layer_name.classList.add("additional_layer_input");
				layer_name.innerText=toTitleCase(layer_id.replace(/_/g, ' '));
				
				layer.appendChild(layer_input);
				layer.appendChild(layer_name);
				
				list_of_layer_options.appendChild(layer);
				*/ 
				
			});
				
			Object.keys(myZip.files).forEach(function (filename) 
			{ 
				var additional_layer_switches = document.getElementById(layer_option_list_element_id).getElementsByTagName("li");
				for(var i = 0; i < additional_layer_switches.length; i++)
				{
					formatted_layer_name = helper.Capitalise_Each_Word(helper.underscores_to_spaces( additional_layer_switches[i].children[0].id) );
					// set the checkbox checked or not, depending on if thlayer is in the list ...
					/// ... of selected additional layers: 
					additional_layer_switches[i].children[0].checked = (website_state.selected_additional_layers.indexOf(formatted_layer_name) != -1);
				}
				
				// access a file inside the zip file 
				myZip.files[filename].async('string').then(function (fileData) 
				{ // fileData contains the actual contents of the .json file (string)
					// parse the string to a json object:
					const layerJsonObject = JSON.parse(fileData); 
					
					var outline_layer = new Cesium.GeoJsonDataSource();
					formatted_filename = filename.substring(filename.charAt(0) == '+').replace(/\.[^/.]+$/, "");
					
					//~ if (default_layer.replace(/\s+/g, '_').toLowerCase() == filename) OLD WAY
					// 2020-07-15 .replace 
					if ( website_state.selected_additional_layers.indexOf(helper.Capitalise_Each_Word(formatted_filename)) != -1 )
					{ // if processing the 'on by default' extra layer, we show it (load it)
						outline_layer.load(layerJsonObject, 
						//~ outline_layer.load('../Assets/Data/coastlines', 
						{
							stroke: Cesium.Color.SILVER,
							// display only the borders (Alpha(0) -> transparent), ...
							fill: Cesium.Color.RED.withAlpha(0), 
							// ... otherwise the borders are filled in with default Yellow
							strokeWidth: 1.5,
							allowPicking: true
						}); 
						
						// ... make 'formatted_filename' point to its GeoJsonDataSource
						map_jsonFilename_to_GeoJsonDataSource[formatted_filename] = outline_layer;
					}
					
					// make 'formatted_filename' point to its data:
					map_jsonFilename_to_stringData[formatted_filename] = fileData;
					viewer.dataSources.add(outline_layer );
				});
			});
		});
	});
	// END of code unzipping the archived data 
}


function toggle_additional_layer(layer_id, REQUIRED_request_turn_on, REQUIRED_request_turn_off)
{	
	// 'layer_id' must be the same as the file name in the .zip file, ...
	// ... and the same as the <li> element in the html.
	try{
		var turn_on = document.getElementById(layer_id).checked;
	}
	catch{
		var turn_on = false;
	}
	// if requested turn off, then override if button checkbox is clicked as 'on'
	if (REQUIRED_request_turn_off === true) turn_on = false
	
	/* EXAMPLE:
	 * in 'index.html', there is a <ul id="layer_option_list"> ...
	 * and the <li> <input> elements are the options of layers we can choose, ...
	 * ... which have 'name=...' assigned 
	 * (<li><input id="country_borders" name="country_borders" ... </li>) 
	 */
	//Add the coastline as a data source. It is a geojson polyline but saved as a .txt file for convenience.
	// No longer optional request turn on - this is mandatory indicator
	if ( (REQUIRED_request_turn_on) )
	{
		// load the saved data (mapping layer_id to the string layer map data):
		// parse string to Json object:
		try{
			try
			{
				var layerJsonObject = JSON.parse(map_jsonFilename_to_stringData[layer_id]); 
				var outline_layer = new Cesium.GeoJsonDataSource();
			}
			catch(SyntaxError)
			{ // if a JSON parser is not able to parse the data, ...
				/// ... that means it's not a JSON file, and such are stored by paths.
				// Since it is a path, we can get its extension and decide from extension ...
				/// ... which DataSource to load.
				var layerJsonObject = map_jsonFilename_to_stringData[layer_id];
				var extension = layerJsonObject.substr(layerJsonObject.lastIndexOf('.') + 1);
				
				switch (extension) 
				{
					case "czml":
						var outline_layer = new Cesium.CzmlDataSource();
						break;
					case "json":
						var outline_layer = new Cesium.GeoJsonDataSource();
						break;
					case "kmz":
						var outline_layer = new Cesium.KmlDataSource();
						break;
					case "kml":
						var outline_layer = new Cesium.KmlDataSource();
						break;
				};
			}
			
			outline_layer.load(layerJsonObject, 
			{
				stroke: Cesium.Color.SILVER,
				// display only the borders (Alpha(0) -> transparent), ...
				fill: Cesium.Color.RED.withAlpha(0), 
				// ... otherwise the borders are filled in with default Yellow
				strokeWidth: 1.5,
				allowPicking: true
			});  
			// add the layer to the viewer's data sources (this makes it visible)
			viewer.dataSources.add(outline_layer);
			
			// save the 'GeoJsonDataSource' object: map the layer identifier to the layer
			/// ... (or updates it if existed before)
			map_jsonFilename_to_GeoJsonDataSource[layer_id] = outline_layer;
			
			// rerender so that you don't have to zoom in for the changes to take place
			viewer.scene.requestRender();
			
			// update checkbox status 'checked' to FALSE (to signal to turn OFF borders on next click)
			return false;
		}
		catch{
			viewer.scene.requestRender();
			
			// update checkbox status 'checked' to FALSE (to signal to turn OFF borders on next click)
			return false;
		}
	}
	else if ( (REQUIRED_request_turn_off) )
	{
		if (viewer.dataSources.contains(map_jsonFilename_to_GeoJsonDataSource[layer_id]))
		{
			viewer.dataSources.remove(map_jsonFilename_to_GeoJsonDataSource[layer_id] );
			// request render - rerenders the scene. Without it, the json layer only ...
			// ... disappears when the globe is moved (now it updates itself by rerendering)
			viewer.scene.requestRender();
		}
		else
		{
			// already removed
			viewer.scene.requestRender();
		}
		// update checkbox status 'checked' to TRUE (to signal to turn ON borders on next click)
		return true;
	}
}
// END of 2020-01-08 dosmi, revision 7062 (1/2 main changes)

/*
 * If the user will toggle a source off and back on, ...
 * ... might not want to unload and reload it from scratch. 
 * You can just set show to false while it's toggled off, ...
 * and it will come back on much more quickly. 
 * 
 * It will continue to consume memory of course, ...
 * ... but this isn't a big deal unless it's half a gigabyte ...
 * ... of data or more. 
 * It won't tax the CPU or GPU needlessly when show is false.
 * 
 * this way the first time the user loads the layer, next time it toggles quickly
 */ 
function show_hideJsonLayer(layer_id)
{	
	// 'layer_id' must be the same as the file name in the .zip file, ...
	// ... and the same as the <li> element in the html.
	
	/* EXAMPLE:
	 * in 'index.html', there is a <ul id="layer_option_list"> ...
	 * and the <li> <input> elements are the options of layers we can choose, ...
	 * ... which have 'name=...' assigned 
	 * (<li><input id="country_borders" name="country_borders" ... </li>) 
	 */
	//Add the coastline as a data source. It is a geojson polyline but saved as a .txt file for convenience.
	if (document.getElementById(layer_id).checked)
	{
		if (viewer.dataSources.contains(map_jsonFilename_to_GeoJsonDataSource[layer_id])){
			map_jsonFilename_to_GeoJsonDataSource[layer_id].show = true;
			viewer.scene.requestRender();
		}
		else{
			// load the saved data (mapping layer_id to the string layer map data):
			// parse string to Json object:
			const layerJsonObject = JSON.parse(map_jsonFilename_to_stringData[layer_id]); 
			var outline_layer = new Cesium.GeoJsonDataSource();
			
			outline_layer.load(layerJsonObject, 
			{
				stroke: Cesium.Color.SILVER,
				// display only the borders (Alpha(0) -> transparent), ...
				fill: Cesium.Color.RED.withAlpha(0), 
				// ... otherwise the borders are filled in with default Yellow
				strokeWidth: 1.5,
				allowPicking: true
			});  
			// add the layer to the viewer's data sources (this makes it visible)
			viewer.dataSources.add(outline_layer);
			
			// save the 'GeoJsonDataSource' object: map the layer identifier to the layer
			map_jsonFilename_to_GeoJsonDataSource[layer_id] = outline_layer;
		}
		
		// update checkbox status 'checked' to FALSE (to signal to turn OFF borders on next click)
		return false;
	}
	else
	{
		if (viewer.dataSources.contains(map_jsonFilename_to_GeoJsonDataSource[layer_id])) {
			map_jsonFilename_to_GeoJsonDataSource[layer_id].show = false;
			viewer.scene.requestRender();
		}
		// update checkbox status 'checked' to TRUE (to signal to turn ON borders on next click)
		return true;
	}
}



//// ------------------------------- rsg_layers SETUP AND FUNCTIONS -------------------------------- ////
// 2020-01-10 dosmi revision 7069 (part 2/2)
function reload_website_state(layer_id, map_to_id, previous_website_state)
{
	website_state["layer"+layer_id+"_loaded_from_url"] = previous_website_state["layer"+map_to_id+"_loaded_from_url"];
	website_state["layer"+layer_id+"_product_nr"] = previous_website_state["layer"+map_to_id+"_product_nr"];
	website_state["layer"+layer_id+"_custom_colours"] = previous_website_state["layer"+map_to_id+"_custom_colours"];
}


/* PERFECT TO HAVE HERE */
//custom fetch function that returns an error if an image cannot be found. Currently unused
function myFetch(url, options) {
	if (options == null) options = {}
	if (options.credentials == null) options.credentials = 'same-origin'
	return fetch(url, options).then(function (response) {
		if (response.status >= 200 && response.status < 300) {
			return Promise.resolve(response)
		} else {
			var error = new Error(response.statusText || response.status)
			error.response = response
			return Promise.reject(error)
		}
	})
}


//// DATE HANDLING FUNCTIONS
/* PERFECT TO HAVE HERE */
//Setup the inital value of the datepicker.
function setupDate() {
	//this is where we set up the date to default to (today's date)
	//~ var d = new Date();
	d = website_state.url_date

	$(function () {
		$("#datepicker-13").val(helper.formatDate(d));
		
		ymd = document.getElementById("datepicker-13").value;
		var year = ymd.substring(0, ymd.indexOf("/"));
		var month = ymd.substring(ymd.indexOf("/") + 1, ymd.lastIndexOf("/"));
		var day = ymd.substr(ymd.lastIndexOf("/") + 1);
	
		//get the new date (1 month backward from calendar)
		//js month index starts at 0
		var nd = new Date(+new Date(year, month - 2, day));
		
		$("#animation_start, #animation_end").datepicker({ dateFormat: 'yy/mm/dd', maxDate: (new Date()) }); 
		$("#animation_start").val(helper.formatDate(nd));
		$("#animation_end").val(helper.formatDate(d));
		
	});
};

//Function called when the date is changed. Change the png for each of the layers to
//reflect the change.
function reload_layer_images_on_new_datetime() {
	// if the images from the last day have not loaded in yet, ...
	// ... cancel their download 
	//~ if(window.stop !== undefined)
	//~ {
		//~ window.stop();
	//~ }
	//~ else if(document.execCommand !== undefined)
	//~ {
		//~ document.execCommand("Stop", false);
	//~ }
	
	// on change of day, remove all loaded layers:
	//~ rsg_animation.remove_all_loaded_layer_images();
	
	//loop through all four layers
	for (id = 0; id < 4; id++)
	{
		var firefox_debug = document.getElementById("layer"+id+"_");
		firefox_debug.innerHTML = rsghelper_layers.get_layer_copy_by_id(id).assigned_subproperties;
	}
	for (var n = 0; n < 4; n++) 
	{
		// if this layer is NOT locked
		if( !rsg_layers.is_locked(n) ){
			//is this layer non-empty
			iteration_layer = rsghelper_layers.get_layer_copy_by_id(n);
			
			var firefox_debug = document.getElementById("layer"+n+"_");
			firefox_debug.innerHTML = iteration_layer.assigned_subproperties;
			if (iteration_layer.assigned_subproperties === undefined)
			{
				alert("Image downloading has not caught up");
			}
			
			
			if (iteration_layer.source != "-") {
				//get the parameters required to edit the layer
				proj_index = iteration_layer.project_index;
				var_index = iteration_layer.variable_index;
				proj_tab = iteration_layer.project_table;
				
				index="layer"+n.toString()
				delta_t_unit = timepicker_state[index]["time_unit"]
				//~ delta_t_unit = rsghelper_layers.get_layer_copy_by_id(n).delta_t_unit;
				//~ delta_t_frequency = rsghelper_layers.get_layer_copy_by_id(n).delta_t_frequency;
				
				//generate the new png url
				//            generate_png_url(variable_index, project_index, proj_table, layer_id, average) 
				new_png_url = generate_png_url(var_index, proj_index, proj_tab, n, delta_t_unit);
				
				//setup the new png layer
				rsg_layers.loadImgResource(n, new_png_url);
				// when the date (or time) is updated, keep the active (highlighted) layer the same
				date_or_time_changed = true;
				//~ rsg_layers.update_transparency(n, data_changed=false);
			};				
		}
		
	};
	

	for (key in website_state.dynamic_additional_layer_ids)
	{
		console.log(key);
		path_to_new_date_data = add_yyyy_mm_dd_to_path_from_datepicker(website_state.dynamic_additional_layer_ids[key],
		                                                               document.getElementById("datepicker-13").value);
		map_jsonFilename_to_stringData[key] = path_to_new_date_data;
		
		// first, request to unload the existing data (request_on = false, request_off = true)
		toggle_additional_layer(key, false, true);
		// then, with the new 'map_jsonFilename_to_stringData' remapped to new path, ...
		/// ... the new path is loaded
		toggle_additional_layer(key, true, false);
		
	}
	//~ rsg_layers.make_topmost_checked_on_layer_active()
};

/* function that only updates one layer given its ID
 *  (currently - 2020-05-04 - ignores if the layer is locked,but it is used  
 *   called only when unlocking the layer. */ 
function update_single_layer_data_time(n, ignore_locked){
	if (ignore_locked === undefined) ignore_locked = false;
	//get the parameters required to edit the layer
	proj_index = rsghelper_layers.get_layer_copy_by_id(n).project_index;
	var_index = rsghelper_layers.get_layer_copy_by_id(n).variable_index;
	proj_tab = rsghelper_layers.get_layer_copy_by_id(n).project_table;
	
	index="layer"+n.toString()
	delta_t_unit = timepicker_state[index]["time_unit"]
	//~ delta_t_unit = rsghelper_layers.get_layer_copy_by_id(n).delta_t_unit;
	//~ delta_t_frequency = rsghelper_layers.get_layer_copy_by_id(n).delta_t_frequency;
	
	//generate the new png url
	new_png_url = generate_png_url(var_index, proj_index, proj_tab, n, average = delta_t_unit);
	
	//setup the new png layer
	rsg_layers.loadImgResource(n, new_png_url);
	// when the date (or time) is updated, keep the active (highlighted) layer the same
	date_or_time_changed = true;
	//~ rsg_layers.update_transparency(n, data_changed=false);
	
}


function sleepFor( sleepDuration ){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
}
/* function rsg_timepicker.get_timepicker_step_time_in_seconds() MOVED TO TIMEPICKER */

/* function rsg_animation.reset_animation_time_slider(){ MOVED TO ANIMATION */

/* function rsg_animation.remove_all_loaded_layer_images(), function rsg_layers.make_topmost_checked_on_layer_active(){ MOVED TO LAYERS */

////COLOURBAR FUNCTIONS

//function to preload a colourbar image resource. Removes the div if no image available.
function loadcbarResource(url, var_short, unit, flag, information_package) 
{
	if(flag === undefined) {flag = "";}
	if(information_package === undefined) {information_package = "";}
	
	// since can be calling function to get base colourbar image by id multiple times...
	// ... save it and use this for future cases: 
	
	var colourbar_base_img = document.getElementById("colourbar_image");
	var colourbar_maxmin_labels = document.getElementById("colourbar_maxmin_labels");

	var cbar_unit_td = document.getElementById("colourbar_units")
	var units = document.createElement("span");
	units.setAttribute('id','colourbar_unit_label');
	units.innerHTML = " ";


	/*   -------------------- HANDLING OF FLAGS   -------------------- */
	
	// if the colourbar is dynamic, make the base colourbar image narrow ...
	// ... since additional MAX and MIN text labels will be added:
	if (flag == "dynamic")
	{
		// make the new width to be half as wide:
		colourbar_base_img.width = 30;
		
		// and display the MAX and MIN labels:
		colourbar_maxmin_labels.classList.remove("off");
		
		
		document.getElementById("colourbar_max_label").innerHTML = information_package["max_label"];
		document.getElementById("colourbar_min_label").innerHTML = information_package["min_label"];
		
		//~ document.getElementById("colourbar_max_label").innerHTML = requested_layer.max_label;
		//~ document.getElementById("colourbar_min_label").innerHTML = requested_layer.min_label;
		cbar_unit_td.appendChild(units);
		
		
	}
	else if (flag == "nolabel")
	{
		colourbar_base_img.width = 60;
		colourbar_maxmin_labels.classList.add("off");
		document.getElementById("colourbar_units")
		
		var cbar_unit_td = document.getElementById("colourbar_units")
		
		cbar_unit_td.innerHTML = "";
		var max_label = document.createElement("p");
		max_label.setAttribute('id','colourbar_max_label');
		max_label.innerHTML = information_package["max_label"];
		units.innerHTML = "(" + unit + ")";
		var min_label = document.createElement("p");
		min_label.setAttribute('id','colourbar_min_label');
		min_label.innerHTML = information_package["min_label"];
		cbar_unit_td.appendChild(max_label);
		cbar_unit_td.appendChild(units);
		cbar_unit_td.appendChild(min_label);
	}
	else
	{
		// else if this function call is not for a dynamic colourbar, ...
		// ... then make sure it is set back to a default width of 60: 
		colourbar_base_img.width = 60;
		colourbar_maxmin_labels.classList.add("off");
		cbar_unit_td.appendChild(units);
	}
	/*   ------------------ END OF HANDLING FLAGS -------------------- */
	//cbar_unit_td.appendChild(units);
	var cbar = new Image();
	cbar.src = url;
	//hide colourbar div on error
	cbar.onerror = function () {
		rsg_ui.hide_colourbar();
	};
	//update colour bar div on image load
	cbar.onload = function () 
	{
		if (unit != "empty") {
			// by default, remove the rotation class if it was defined for a ...
			// ... previously chosen layer (if class is not there, does not freak out)
			document.getElementById("colourbar_units").classList.remove("rotate-90");
			//~ document.getElementById("colourbar_units").textContent = unit;
			multiline = /\/\//gi // search for //
			// if the colourbar unit is contains break lines ('//') or is longer than 6 characters, rotate sideways (add class rotate-90 defined in StyleSheets.css)
			// <p class="rotate-90">moles/m2 <br> NO2 data includes modified Copernicus data (2020) - processed by RAL</p>
			if( (unit.match(multiline)) || (unit.length > 6) ) {
				var p = document.createElement('p');
				//~ unit="<p class=rotate-90>"+unit+"</p>"
				unit=unit.replace(multiline, '<br>')
				// only rotate colourbar text when it is multiline:
				document.getElementById("colourbar_units").classList.add("rotate-90");
			}
	                                  
			var cbar_arr = url.split("/");
			var cbar_name = cbar_arr[cbar_arr.length -1].split("_");
			if (cbar_name[1] != "nl.png"){
				document.getElementById("colourbar_units").innerHTML = unit;
			}
			
		} else {
			document.getElementById("colourbar_units").textContent = '';
		}
		document.getElementById("colourbar_variable").textContent = var_short.toUpperCase();
		document.getElementById("colourbar_image").src = url;
		rsg_ui.show_colourbar()
	};
	
};

//Given the project table (pt) and row index (ri), return the url of the colour bar.
function get_colourbar_url(ri, pt) {
	//error handling for user data
	if (pt != undefined) 
	{
		colourbar_url = pt[ri][11];
		// if static, return the url:
		return colourbar_url;
	} 
	else 
	{
		return null
	}
};

function get_var_info(allText, delim, layer_index) {
	var current_layer = rsghelper_layers.get_layer_copy_by_id(layer_index);
	var short_name = current_layer.data_short;
    var allTextLines = allText.split(/\r\n|\n/);
    var line = [];
    for (var i = 1; i < allTextLines.length; i++) {
        var data = allTextLines[i].split(delim);
        if (data[0] == short_name) {
            var tarr = [];
            for (var j = 0; j < data.length; j++) {
                line.push(data[j]);
            }
        }
    }
    return line;
};

//Given the layer index, change the colour bar to the layer selected and add the variable name and units.
//Errors handled so colour bar does not show when there is a load error.
function load_and_show_colour_bar(layer_index) {
	//get parameters from layer object
	colourbar_url = get_colourbar_url(rsghelper_layers.get_layer_copy_by_id(layer_index).variable_index, 
	                                  rsghelper_layers.get_layer_copy_by_id(layer_index).project_table);
	
	// flag that depends on the runtime conditions encountered ...
	// ... (updated conditionally and passed to the loadcbarResource)
	var runtime_flag = ""
	var information_package;

	var cbar_arr = colourbar_url.split("/");
	var cbar_name = cbar_arr[cbar_arr.length -1].split("_");
	if (cbar_name[1] == "nl.png"){
		// 'no label'
		var current_layer = rsghelper_layers.get_layer_copy_by_id(layer_index);
		var var_info_url = "http://gws-access.jasmin.ac.uk/public/rsgnceo/projects/c3s_part/docs/";
		var_info_url = var_info_url + cbar_arr[8] + "/" + cbar_arr[8] + "_var_info.dat";
		$.ajax({
			type: "GET",
			url: var_info_url,
			dataType: "text",
			success: function (data) {
				var contents = get_var_info(data,"	", layer_index);
				information_package = {"max_label" : parseInt(contents[5]),
									   "min_label" : parseInt(contents[6])}
				runtime_flag = "nolabel";
				units = rsghelper_layers.get_layer_copy_by_id(layer_index).units;
				var_name = rsghelper_layers.get_layer_copy_by_id(layer_index).data_short;
				loadcbarResource(colourbar_url, var_name, units, runtime_flag, information_package);
			},
			error: function(){
				window.alert(var_info_url);
			} 
		});

	}
	
	if (colourbar_url == "dynamic")
	{
		var current_layer = rsghelper_layers.get_layer_copy_by_id(layer_index);
		runtime_flag = "dynamic";
		colourbar_url = current_layer.colourbar_base_img_url; 
		
		information_package = {"max_label" : current_layer.max_label,
		                       "min_label" : current_layer.min_label}
	}
	
	
	units = rsghelper_layers.get_layer_copy_by_id(layer_index).units;
	var_name = rsghelper_layers.get_layer_copy_by_id(layer_index).data_short;
	
	// only try to download and show the colourbar if a valid colourbar url was created:
	if ( (colourbar_url === null) || (colourbar_url == "empty") ) rsg_ui.hide_colourbar();
	
	else // if valid colourbar url given:
	{
		loadcbarResource(colourbar_url, var_name, units, runtime_flag, information_package)
		// here is the code for loading legend subtexts as suggested in 2020-04-07 RSG web vis-tool access (dd todo)
		if( layer_state.project_table_column_indices[layer_index]["legend_subtext"] != -1 )
		{
			prompted_layer = rsghelper_layers.get_layer_copy_by_id(layer_index)
			new_rows_to_add = parse_legend_subtext(prompted_layer.legend_subtext)
			
			logos_to_add_to_bottom = parse_legend_subtext(prompted_layer.logos)
			// add logos to the bottom of the page (if in the project table there are logos specified in the 'logos' column
			//~ for (logo_nr = 0; logo_nr < logos_to_add_to_bottom.length; logo_nr++)
			//~ {
				//~ request_bottom_logo(logos_to_add_to_bottom[logo_nr][1])
			//~ }
			// add text/logos to the bottom of the LEGEND (if in the project table there are img/text specified in the 'legend_subtext' column
			// NOTE use && to define a new row, and :: to add a class to the img/text it comes after
			for (iterator = 0; iterator < new_rows_to_add.length; iterator++)
			{
				if(new_rows_to_add[iterator][0] == "text")
				{
					add_legend_subtext_text(new_rows_to_add[iterator][1], new_rows_to_add[iterator][2])
				}
				else
				{
					link = new_rows_to_add[iterator][1]
					if(new_rows_to_add[iterator][0] == "label")
						link = get_logo_link_by_identifier(new_rows_to_add[iterator][0])
					
					add_legend_subtext_img(link, new_rows_to_add[iterator][2])
				}
			}
		}
		else remove_all_legend_subtexts()
		
	} 
	
};

function add_table_to_colourbar(id)
{
	colourbar = document.getElementById("colourbar")
	table = document.createElement("table")
	table.setAttribute("id", "colourbar_secondary_table"+id.toString());
	table.classList.add("legend_sub");
	tbody = document.createElement("tbody");
	tbody.setAttribute("id", "colourbar_secondary_tbody"+id.toString());
}

function add_legend_subtext_text(text, style)
{
	// only add if the text under the colourbar does is not already added:
	if(website_state.added_text_under_colourbar.indexOf(text) == -1)
	{
		website_state.added_text_under_colourbar.push(text)
		colourbar = document.getElementById("colourbar")
		
		add_table_to_colourbar(id=1)
		
		table.appendChild(tbody)
		colourbar.appendChild(table)
		
		table = document.getElementById("colourbar_secondary_table1")
		tbody = document.getElementById("colourbar_secondary_tbody1")
		
		
		tr = document.createElement("tr")
		td = document.createElement("td")
		paragraph = document.createElement("p")
		plain_text = document.createTextNode(text)
		
		paragraph.appendChild(plain_text)
		if (style.length != 0) 
		{
			for (i = 0; i < style.length; i++)
				paragraph.classList.add(style[i])
		}
		
		
		td.appendChild(paragraph)
		tr.appendChild(td)
		table.appendChild(tr)
	}

}

function add_legend_subtext_img(link, style)
{
	logo_table = load_logo_config_table()
	
	for (i = 0; i < logo_table.length; i++)
	{
		if(logo_table[i][0] == link) link = logo_table[i][2]
	}
	
	// only add if the text under the colourbar does is not already added:
	if(website_state.added_logos_under_colourbar.indexOf(link) == -1)
	{
		website_state.added_logos_under_colourbar.push(link)
		colourbar = document.getElementById("colourbar")
		table = document.getElementById("colourbar_secondary_table1")
		tbody = document.getElementById("colourbar_secondary_tbody1")
		
		
		tr = document.createElement("tr")
		td = document.createElement("td")
		img = document.createElement("img")
		img.src = link

		if (style.length != 0) 
		{
			for (i = 0; i < style.length; i++)
				img.classList.add(style[i])
		}
		
		td.appendChild(img)
		tr.appendChild(td)
		table.appendChild(tr)
	}
}

function remove_legend_subtext_by_id(id)
{
	table_to_remove = document.getElementById("table"+id)
	table_to_remove.parentNode.removeChild(table_to_remove);
}

function remove_all_legend_subtexts()
{
	all_tables_to_remove = document.getElementsByClassName("legend_sub")
	for (i = 0; i < all_tables_to_remove.length; i++)
	{
		all_tables_to_remove[i].parentNode.removeChild(all_tables_to_remove[i])
	}
	
	website_state.added_text_under_colourbar = [];
	website_state.added_logos_under_colourbar = [];
	website_state.showing_bottom_logos = [];
	
}

function parse_legend_subtext(legend_subtext)
{
	// split the text by '&&' to separate each new row to be created:
	new_rows = legend_subtext.split("&&")
	cells = []
	for (i = 0; i < new_rows.length; i++)
	{
		cells.push( parse_part_of_legend_subtext(new_rows[i]) );
	}
	return cells
}

function parse_part_of_legend_subtext(legend_subtext)
{
	try
	{
		style = legend_subtext.split("::").slice(1)
		legend_subtext=legend_subtext.split("::")[0]
	}
	catch (error)
	{
		style=""
	}
	
	// allowed syntax:
	//~ text(.................)
	//~ or simply:
	//~ ................
	
	// check if given as 'text(...............)' first:
	text_regex1 = /text\((.*)\)/i // case insensitive
	img_regex1 = /img\((.*)\)/i // case insensitive
	img_regex2 = /img_label\((.*)\)/i // case insensitive
	
	is_text = false
	is_img = false
	is_img_label = false
	
	text = ""
	link = ""
	label = ""
	
	if(legend_subtext.match(text_regex1))
	{
		// execute the regexp and access its matching groups:
		var match = text_regex1.exec(legend_subtext);
		text = match[1];
		is_text = true;
	}
	
	else if(legend_subtext.match(img_regex1))
	{
		var match = img_regex1.exec(legend_subtext);
		link = match[1];
		is_img = true;
	}
	
	else if(legend_subtext.match(img_regex2))
	{
		var match = img_regex2.exec(legend_subtext);
		label = match[1];
		is_img_label = true;
	}
	
	else
	{
		// if pure text, but begins with http or ends with .ext (ext can be 1 to 5 characters long, no space between . and ext (. png won't work, but .png will)
		if ( (legend_subtext.match(/http/i) ) || (legend_subtext.match(/.*\.\S{1,5}/i)) )
		{
			link = legend_subtext
			is_img = true
		}
		else
		{
			is_text = true
			text = legend_subtext
		}
	}
	
	if (is_text) return ["text", text, style]
	else if (is_img) return ["link", link, style]
	else if (is_img_label) return ["label", label, style]
	else return "error"
	
}

/* function rsg_ui.toggleColourbar(), function rsg_ui.doubleClickToggleColourbar() MOVED TO UI */

////JQUERY UI rsg_layers FUNCTIONS

//JQuery Functions to show and hide the settings menu when the button is clicked.

function get_started() {
 	$(function () {
		// set cookie for welcome info if user has ticked welcome_info box
		var save_welcome = document.getElementById("welcome_info");
		if(save_welcome.value == "true"){
			set_cookie("welcome_info","off");
		}
 		$("#welcome").hide();
 	});
 }

// function get_started() {
// 	$(function () {
// 		$("#layer_menu").attr("src","Assets/Images/welcome_page/layer_menu_small.jpg");
// 		$("#welcome").show();
// 	});
// }

//Hide the loader animation
function showPage() {
	document.getElementById("loader").style.display = "none";
}


/* --------------------- ROTATE GLOBE FUNCTIONS --------------------- */

//code to handle the rotation buttons.

var lastNow = Date.now();

//HTML button functions add event listeners to fire when clock ticks
//Rotate right html button function
function rotate_right() {
	stop_rotation();
	viewer.clock.onTick.addEventListener(rotateWest)
}

//Rotate left html button function
function rotate_left() {
	stop_rotation();
	viewer.clock.onTick.addEventListener(rotateEast)
}

//Functions fired when clock ticks.
//function that rotates the globe west
function rotateWest(clock) {
	var now = Date.now();
	var spinRate = 0.04;
	var delta = (now - lastNow) / 1000;
	lastNow = now;
	viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, -spinRate * delta);
}

//function that rotates the globe east
function rotateEast(clock) {
	var now = Date.now();
	var spinRate = -0.04;
	var delta = (now - lastNow) / 1000;
	lastNow = now;
	viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, -spinRate * delta);
}

//Setup functions
var rotate_West = viewer.clock.onTick.addEventListener(rotateWest);
var rotate_East = viewer.clock.onTick.addEventListener(rotateEast);

//Stop rotations and remove listeners
function stop_rotation() {
	viewer.clock.onTick.removeEventListener(rotateEast)
	viewer.clock.onTick.removeEventListener(rotateWest)
};

stop_rotation();


////GET SCREEN SIZE FUNCTIONS
//Functions that capture the device screen size and adjust the UI accordingly.

//event to fire when the screen is resized.
window.addEventListener('resize', function (event) {
	rsg_ui.adjust_to_screen_size();
});



////SETUP PAGE FROM URL QUERY FUNCTIONS
//code to setup defaults and from url query on load
// url format: www.blah.ac.uk/rsg_data_viewer/?cal=28C08C2018&proj=1C2&vars=1C2
function setLocFromURL (url) {
	//get current region focus [west,south,east,north]
	var url_loc = getParameterByName("loc", url);

	//if no loc defined, leave as defaults
	if (url_loc != null) {
		url_loc = url_loc.split("C")
		//error handling
		if (url_loc.length != 4) {
// 			return null
//&loc=-120C-60C-80C-20
			var west = -50.0;
			var south = 10.0;
			var east = 60.0;
			var north = 89.0;
		} else {
			var west = url_loc[0];
			var south = url_loc[1];
			var east = url_loc[2];
			var north = url_loc[3];
		}

		// Update view location to requested location ('home' remains default)
		var rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);
// viewer.camera.lookAt(center, new Cesium.Cartesian3(0.0, 0.0, 4200000.0));
		viewer.camera.flyTo({
				 destination : Cesium.Rectangle.fromDegrees(west, south, east, north)
		});
	}  // Location (loc)
	} // func setLocFromURL

function set_region_view_from_url (url) 
{
	//get current region focus [lat,lon,height,range]
	var url_rloc = getParameterByName("rloc", url);

	//if no loc defined, leave as defaults
	if (url_rloc != null) 
	{
		url_rloc = url_rloc.split("C")
		//error handling
		if (url_rloc.length != 4) 
		{
			return null
		} 
		else 
		{
			var lat = url_rloc[0];
			var lon = url_rloc[1];
			var height = url_rloc[2];
			var range = url_rloc[3];
		}

		// Update view location to requested location ('home' remains default)
		viewer.camera.flyTo({destination:Cesium.Cartesian3.fromDegrees(lon, lat, range, Cesium.Ellipsoid.WGS84)});

	}  // Location (loc)
} // func set_region_view_from_url


//given a url query string and variable, return its value
function getParameterByName(name, url) {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
};


// Report lat/lon camera is currently looking at
function cameraLookingAt() {
		var camera = viewer.camera;
		var canvas = viewer.scene.canvas;
		var ray = camera.getPickRay(new Cesium.Cartesian2(
			Math.round(canvas.clientWidth / 2),
			Math.round(canvas.clientHeight / 2)
		));

		var position = viewer.scene.globe.pick(ray, viewer.scene);
		if (Cesium.defined(position)) {
				var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
				var height = cartographic.height;
				var range = Cesium.Cartesian3.distance(position, camera.position);
				var lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(2);
				var lon = Cesium.Math.toDegrees(cartographic.longitude).toFixed(2);
//				alert('Lat/Lon: [' + lat + ',' + lon + ']'+
//							' height: ' + height.toFixed(2) +
//							' range: ' + range.toFixed(2)
//							);
		} else {
				console.log('Looking at space?');
				var lat = 0.0;
				var lon = 0.0;
				var height = 1000000.;
				var range = 10000.;
		}
		height = height.toFixed(2);
		range=range.toFixed(2);
		var loc_uri = "rloc=" + [lat,lon,height,range].join('C');
		return loc_uri
}

function getCameraPosition() {
		var camera = viewer.camera;
		var canvas = viewer.scene.canvas;
		var ray = camera.getPickRay(new Cesium.Cartesian2(
			Math.round(canvas.clientWidth / 2),
			Math.round(canvas.clientHeight / 2)
		));

		var position = viewer.scene.globe.pick(ray, viewer.scene);
		if (Cesium.defined(position)) {
				var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
				var height = cartographic.height;
				var range = Cesium.Cartesian3.distance(position, camera.position);
				var lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(2);
				var lon = Cesium.Math.toDegrees(cartographic.longitude).toFixed(2);
//				alert('Lat/Lon: [' + lat + ',' + lon + ']'+
//							' height: ' + height.toFixed(2) +
//							' range: ' + range.toFixed(2)
//							);
		} else {
				console.log('Looking at space?');
				var lat = 0.0;
				var lon = 0.0;
				var height = 1000000.;
				var range = 10000.;
		}
		height = height.toFixed(2);
		range=range.toFixed(2);
		// lat = 47.09, lon = 2.72, height = -7.99 range = 1045571.08 gives:
		// rloc=47.09C2.72C-7.99C1045571.08
		var loc_uri = "rloc=" + [lat,lon,height,range].join('C');
		return loc_uri
}

viewer.camera.changed.addEventListener(function() {
	zoom_slider = document.getElementById("zoom_slider");
	var currentPosition = viewer.camera.positionCartographic;
	zoom_slider.value = currentPosition.height;
})
viewer.camera.moveStart.addEventListener(function() { 
	zoom_slider = document.getElementById("zoom_slider");
	var currentPosition = viewer.camera.positionCartographic;
	zoom_slider.value = currentPosition.height;
});
viewer.camera.moveEnd.addEventListener(function() { 
	zoom_slider = document.getElementById("zoom_slider");
	var currentPosition = viewer.camera.positionCartographic;
	zoom_slider.value = currentPosition.height;
});


function zoomGlobe(value)
{
	var currentPosition = viewer.camera.positionCartographic;
	
	var camera = viewer.camera;
	var canvas = viewer.scene.canvas;
	var ray = camera.getPickRay(new Cesium.Cartesian2(
			Math.round(canvas.clientWidth / 2),
			Math.round(canvas.clientHeight / 2)
		));
	var position = viewer.scene.globe.pick(ray, viewer.scene);
	var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
	var height = cartographic.height;
	
	cartographic.height = (-1) * value;
	var currentLat = Cesium.Math.toDegrees(cartographic.latitude)
	var currentLon = Cesium.Math.toDegrees(cartographic.longitude)

	viewer.camera.setView({
	    destination: Cesium.Cartesian3.fromDegrees(currentLon, currentLat, value)
	});
	
}

async function  makeScreenshot(selector="body") 
{
  return new Promise((resolve, reject) => {  
    let node = document.querySelector(selector);
    
    html2canvas(node, { onrendered: (canvas) => {
        let pngUrl = canvas.toDataURL();      
        resolve(pngUrl);
    }});  
  });
}




function get_canvas()
{
	// define callback functions
	var prepareScreenshot = function(){
	    var canvas = scene.canvas;    
	    viewer.resolutionScale = targetResolutionScale;
	    scene.preRender.removeEventListener(prepareScreenshot);
	    // take snapshot after defined timeout to allow scene update (ie. loading data)
	    setTimeout(function(){
	        scene.postRender.addEventListener(takeScreenshot);
	    }, timeout);
	}
	
	var takeScreenshot = function(){    
	    scene.postRender.removeEventListener(takeScreenshot);
	    var canvas = scene.canvas;
	    canvas.toBlob(function(blob){
	        var url = URL.createObjectURL(blob);
	        downloadURI(url, "snapshot-" + targetResolutionScale.toString() + "x.png");
	        // reset resolutionScale
	        viewer.resolutionScale = 1.0;
	    });
	}
	
	scene.preRender.addEventListener(prepareScreenshot);
	
}


function saveAs(uri, filename) {

    var link = document.createElement('a');

    if (typeof link.download === 'string') {

        link.href = uri;
        link.download = filename;

        //Firefox requires the link to be in the body
        document.body.appendChild(link);

        //simulate click
        link.click();

        //remove the link when done
        document.body.removeChild(link);

    } else {

        window.open(uri);

    }
}


function getCameraViewCoord () {
// Get camera view co-ordinates bounds
// Doesn't work if not zoomed in quite well (will return full range)
//		var scratchRectangle = new Cesium.Rectangle();
		var scratchRectangle = Cesium.Rectangle();
		var rect = viewer.camera.computeViewRectangle(viewer.scene.globe.ellipsoid,scratchRectangle);
		// Need to call twice as 1st just gives global view first time used?
//		var rect = viewer.camera.computeViewRectangle(viewer.scene.globe.ellipsoid,scratchRectangle);
		var west = Cesium.Math.toDegrees(rect.west).toFixed(2);
		var south =  Cesium.Math.toDegrees(rect.south).toFixed(2);
		var east = Cesium.Math.toDegrees(rect.east).toFixed(2);
		var north = Cesium.Math.toDegrees(rect.north).toFixed(2);
//		loc_uri = west + "C" + south + "C" + east + "C" + north;
		var loc_uri = "loc=" + [west,south,east,north].join("C")
//		alert("Lat/Lon: [" + loc_uri + "]"); // report lat/lon info
		return loc_uri
		}

function tiptest(event){
	var x = event.clientX;
	x = x + 20;
	var y = event.clientY;
	var textbox = document.getElementById("tip");
	textbox.style.position = "absolute";
	textbox.style.left = x+'px';
	textbox.style.width = '200px';
	textbox.style.height = '100px';
	textbox.style.top = y+'px';
}

function reset_webpage(){
	index_of_last_slash = window.location.href.lastIndexOf('/')
	reset_url = window.location.href.substring(0,index_of_last_slash);
	window.location.replace(reset_url);
}


////JQUERY UI SETUP FUNCTIONS
//Set up the colour bar and select data menu to be draggable, 
// ...confined by the window.
rsg_ui.set_draggable("#colourbar");
rsg_ui.set_draggable("#time-selection-ui");
rsg_ui.set_draggable("#colour_picker");
rsg_ui.set_draggable("#data_select_menu");
rsg_ui.set_draggable("#toolbar");
rsg_ui.set_draggable("#settings_menu");
rsg_ui.set_draggable("#events-dropdown");
rsg_ui.set_draggable("#overlay-layers");
rsg_ui.set_draggable("#selected-layers");

//Add the ui slider to the settings div.
rsg_ui_widgets.add_opacity_slider();


function turn_off_button(className, parent_flag){
	if(parent_flag == 'undefined' ){
		button = document.getElementsByClassName(className)[0];
	}
	else{
		button = document.getElementsByClassName(className)[0].parentElement;
	}
	button.classList.add("off");
}

function setup_listeners(){
	// layer lines button
	var buttons_here = ['selected-layers-b','overlay-layers-b','events-dropdown-b','add-layer-b','layer-menu-b'];
	for (i=0; i<buttons_here.length; i++){
		if (i > 1){
			exit = document.getElementById('exit-window-'+i);
			exit.addEventListener('click', function(e){return handle_all_windows(e)});
			
			button = document.getElementById(buttons_here[i]);
			button.addEventListener('click', function(e){return handle_all_windows(e)});
		}
	}
	// events button
	// overlays
	// additional layers
	// add layers
	// all x's (5)
	
}

function remove_initial_glow(){
	var layer_menu_button = document.getElementById("layer-menu-b");
	layer_menu_button.setAttribute('style','');
}

function close_all_windows(){
	rsg_ui.check_close(['overlay-layers']);
	rsg_ui.check_close(['selected-layers']);
	rsg_ui.check_close(['events-dropdown']);
	rsg_ui.hide_toolbar();
	rsg_ui.hide_data_select();
}

function handle_all_windows(e){
	// If e is open, close e and all other windows, open layer_menu
	// If e is not open, open e and close all other windows
	var buttons_here = ['selected-layers-b','overlay-layers-b','events-dropdown-b','add-layer-b','layer-menu-b'];
	// Layers - opens when button pressed, closes otherwise
	// Events - opens when button pressed, closes otherwise
	// Add layer - opens on button, closes and opens layers with exit, closes otherwise
	// Add' layers - opens on button, closes and opens layers with exit, closes otherwise
	// Overlays - opens on button, closes and opens layers with exit, closes otherwise
	
	// rsg_ui.open(['overlays-options']); //overlays
	// rsg_ui.open(['additional-layers']); // Additional layers
	// rsg_ui.show_toolbar(); // layer menu
	// rsg_layers.add_layer(); // add layers
	// check_events(); // events window
	try{
		var id = e.currentTarget.id;
	}
	catch{
		var id = e;
	}
	
	for (i=0; i<buttons_here.length; i++){
		if (id == buttons_here[i]){
			// Button clicked is to open a new window, so shut all others
			// Close all windows, then open this specific one
			close_all_windows();
			if (i < 3){
				var window_to_open = buttons_here[i].substring(0,buttons_here[i].length-2);
				rsg_ui.open([window_to_open]);
			}
			else if (i == 3){rsg_ui.show_data_select()}
			else {rsg_ui.show_toolbar()}
		}
		if (id == 'exit-window-' + i){
			close_all_windows();
			if (i < 2 || i == 3){rsg_ui.show_toolbar()}
		}
	}
	
}

// given parameters, adds the button to top right corner of the website:
function add_button_to_top_toolbar(button_id, button_title, button_class, button_classes, button_onclick, icon_class)
{
	if(button_id === undefined) {button_id = "";}
	if(button_title === undefined) {button_title = "";}
	if(button_class === undefined) {button_class = "";}
	if(button_classes === undefined) {button_classes = [];}
	if(button_onclick === undefined) {button_onclick = "";}
	if(icon_class === undefined) {classes = "";}
	
	// get the HTML element of the Cesium top tool bar (exist only one with that class name)
	cesium_top_toolbar = document.getElementsByClassName("cesium-viewer-toolbar")[0];
	cesium_top_toolbar.setAttribute('style','z-index:5;');
	// create an HTML button, and populate passed arguments:
	button = document.createElement("BUTTON"); // the button to click 
	icon = document.createElement("SPAN"); // this is where button's icon is added
	
	// to add an icon, set the class (since using jQuery icons, ...
	// ... which are set by classname rather than specifying image)
	icon.classList.add("ui-icon") // add base class needed for displaying icon 
	if (icon_class != "") { icon.classList.add(icon_class); }
	icon.classList.add("custom-toolbar-icon") // makes the icon bigger and white, to match Cesium design
	if (button_id != "") { button.id = button_id; } 
	if (button_title != "") { button.title = button_title; } 
	button.classList.add("cesium-button");
	button.classList.add("cesium-toolbar-button");
	if (button_class != "") { button.classList.add(button_class); } 
	// if specified more than one class (in a list), add all:
	if (button_classes != "") 
	{ 
		var i = 0;
		for (i = 0; i < button_classes.length; i++)
		{
			button.classList.add(button_classes[i]);
		}
	}
	if (button_onclick != "")
	{ 
		// if ever needed, can also have functions with parameters (commented out):
		//~ button.onclick = function(){return function_call(eval(args))};
		button.onclick = function(){return button_onclick()};
	}
	
	// turn off the button from showing up on screenshots:
	button.setAttribute("data-html2canvas-ignore", "true");
	
	// add icon to the button:
	button.appendChild(icon);
	
	// finally, with the button fully populated, add it to the top of the toolbar:
	cesium_top_toolbar.appendChild(button);
	/*
	if (button_id == "download")
	{
		document.getElementById("download").addEventListener("click", function() {
			html2canvas(document.querySelector('body'),{allowTaint : true, useCORS: true}).then(function(canvas) 
			{
					saveAs(canvas.toDataURL(), 'file-name.png');
			});
		});
	}
	*/
}

function alter_default_cesium_logo(){
	footer = document.getElementsByClassName("cesium-viewer-bottom")[0];
	while (footer.lastChild){
		footer.removeChild(footer.lastChild);
	}
	var a = document.createElement('a');
	a.setAttribute('title','Cesium');
	a.setAttribute('href','');
	var img = document.createElement('img');
	img.setAttribute('src','http://gws-access.jasmin.ac.uk/public/rsgnceo/web_dev_dw/rsg_data_viewer/Assets/Build/Cesium/Assets/Images/cesium_credit.png');
	img.setAttribute('alt','Cesium');
	img.setAttribute('height','40');
	img.setAttribute('hspace','14');
	a.appendChild(img);
	
	// add logos
	var logos = document.createElement('div');
	logos.setAttribute('id','logos');
	var logos_small = document.createElement('div');
	logos_small.setAttribute('id','logos_small');
	logos.appendChild(a);
	//logos_small.appendChild(a);
	footer.appendChild(logos);
	footer.appendChild(logos_small);
	
	
	//var cs = 'http://gws-access.jasmin.ac.uk/public/rsgnceo/web_dev_dw/rsg_data_viewer/Assets/Build/Cesium/Assets/Images/ion-credit.png';
	//var img_cesium = document.getElementByID("img").src = cs;
	//img_cesium.src = '';
}

function add_credit_data_attribution(){
	footer = document.getElementsByClassName("cesium-viewer-bottom")[0];
	new_attr = document.createElement('a');
	new_attr.setAttribute('title','Data attribution');
	new_attr.setAttribute('href','http://www.usgs.gov/');
	new_attr.setAttribute('class','cesium-credit-expand-link cesium-widget-credits');
	new_attr.innerHTML = "Data attribution";
	footer.appendChild(new_attr);
}

function add_credit_link_to_footer(title_id, url){
	// add link to cookies:
	footer = document.getElementsByClassName("cesium-viewer-bottom")[0];
	
	// Create anchor element. 
	var a = document.createElement('a');
	var a = document.createElement('a');
	
	// Create the text node for anchor element.
	var link = document.createTextNode(title_id);
	
	// Append the text node to anchor element.
	a.appendChild(link);
	
	// Set the title.
	a.title = title_id;
	
	// Set the href property
	a.href = url;
	
	a.classList.add("cesium-credit-expand-link");
	a.classList.add("cesium-widget-credits");
	
	// Append the anchor element to the body
	footer.appendChild(a);	
}

function add_credit_popup_to_footer(title_id, function_call, args){
	// add link to cookies:
	footer = document.getElementsByClassName("cesium-viewer-bottom")[0];
	
	// Create anchor element. 
	var a = document.createElement('a');
	
	// Create the text node for anchor element.
	var link = document.createTextNode(title_id);
	
	// Append the text node to anchor element.
	a.appendChild(link);
	
	// Set the title.
	a.title = title_id;
	
	// Set the href property
	a.onclick = function(){return function_call(eval(args))};
	
	a.classList.add("cesium-credit-expand-link");
	a.classList.add("cesium-widget-credits");
	
	// Append the anchor element to the body
	footer.appendChild(a);	
}



function redirect_toolbar(className, url, title){
	
	toolbar_button = document.getElementsByClassName(className)[0];
	
	toolbar_button.onclick = function (){
		window.location=url;
	}
	
	if (title != undefined){ toolbar_button.title = title };
	
}

function request_bottom_logo(link, style)
{
	if(style === undefined) {style = "";}
	// first, get all the image details from the image config table:
	logo_table = load_logo_config_table()
	
	for (i = 0; i < logo_table.length; i++)
	{
		if(logo_table[i][0] == link)
		{
			// id	href	src	height	alt	hspace	small_screen
			 logo_href = logo_table[i][1]
			 logo_src = logo_table[i][2]
			 logo_height = logo_table[i][3]
			 logo_alt = logo_table[i][4]
			 logo_hspace = logo_table[i][5]
			 logo_small_src = logo_table[i][6]
		}
	}
	
	// finally, call the function adding the actual logo:
	add_bottom_logo(href=logo_href, 
	                src=logo_src, height=logo_height, alt=logo_alt,
	                hspace=logo_hspace, small_scr=logo_small_src)
} 

// <a href="http://www.stfc.ac.uk/"><img src="../Assets/Images/Logos/UKRI_STF_Council-Logo_Horiz-RGB_white.png" alt="UKRI-STFC" height="50px"></a>
function add_bottom_logo(href, src, height, alt, hspace, small_scr){
	// define defaults (function add_bottom_logo(href, src, height, alt, hspace=0, small_scr="") is not compatable on InternetExplorer)
	if(hspace === undefined) {hspace = 0;}
	if(small_scr === undefined) {small_scr = "";}
	//Create a credit with a tooltip, image and link
	// ... built-in Cesium function, but can do it using html ... 
	//~ var credit = new Cesium.Credit('<a href="https://cesium.com/" target="_blank"><img src="'+src+'" title="Cesium"/></a>', true);
	//~ viewer.scene.frameState.creditDisplay.addDefaultCredit(credit)
	
	// adding page bottom logo:
	logo_div = document.getElementById("logos")
	small_logo_div = document.getElementById("logos_small")
	
	var a   = document.createElement('a');
	var img = document.createElement('img');

	a.title = alt;
	a.href = href;
	
	img.src = src;
	img.alt = alt;
	img.height = height;
	img.hspace = hspace;
	
	a.appendChild(img);
	logo_div.appendChild(a);
	
	var small_a   = document.createElement('a');
	var small_img = document.createElement('img');

	small_a.title = alt;
	small_a.href = href;
	
	small_img.src = small_scr;
	small_img.alt = alt;
	small_img.height = height;
	small_img.hspace = hspace;
	
	small_a.appendChild(small_img);
	small_logo_div.appendChild(small_a);
	
}

// 2020-01-08 dosmi, revision 7062 (2/2 main changes)

var options = [];
// push the default layer on the options array:
options.push( default_layer );
// variable 'default layer' is defined at the start of the script

/* $('#additional_layer_wrapper').on('click', 'input', function( event ) MOVED TO UI */
// END of 2020-01-08 dosmi, revision 7062 (2/2 main changes)
