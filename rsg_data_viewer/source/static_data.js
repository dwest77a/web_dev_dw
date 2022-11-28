//load up the config table
$(document).ready(function () {
    $.ajax({
        type: "GET",
        url: "Assets/Data/static_data_sources/config/data_sources.txt",
        dataType: "text",
        success: function (data) { setup_data_sources(data); }
    });
});

//array holding the data table.
var data_source_table = [];

//setup function that loads the table and populates the dropdowns

function setup_data_sources(table) {
    //delimiter is a tab and not a space
    data_source_table = processData(table, "\t");
    //create the drop down menu
    var div = document.createElement('div');
    div.classList.add('data_sources');
div.innerHTML = '<select id="data_sources" onchange=add_data_source()><option>Add Data Source:</option></select>';
document.getElementById('cesiumContainer').appendChild(div);
//usual function of getting the list of unique items and then adding them as options to the dropdown menu,
var data_sources = get_unique_items(data_source_table, 0);
var data_source_selection = document.getElementById("data_sources")
    for (i = 0; i < data_sources.length; i++) {
        var option = document.createElement("option");
        option.text = data_sources[i];
        data_source_selection.add(option);
    }
//if on a mobile device, don't show the dropdown on startup.
if (small_screen){
    hide_item("#data_sources");
}
}

var data_source_url = "null";
var dataSource1 = new Cesium.CzmlDataSource();
//function to add data on selection
function add_data_source(){
    var ds = document.getElementById("data_sources").value;
    if (ds != "Add Data Source:"){
	item_index = get_data_source_id(ds, data_source_table);
	data_source_url = data_source_table[item_index][1];
	dataSource1.load(data_source_url);
	viewer.dataSources.add(dataSource1);
    }
    //remove the data source (only works for one item in the list)
    if (ds == "Add Data Source:" && data_source_url != "null"){
	viewer.dataSources.remove(dataSource1, false);
    }
}

    function get_data_source_id(item, table){
	for (var b = 0; b <= table.length; b++) {
	    if (item == table[b][0]){
		return b;
	    };
	};
    };

