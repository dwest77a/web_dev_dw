//These three prototype additions add helper functions to the standard arrays and strings.
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



//load up the config table
$(document).ready(function () {
    $.ajax({
        type: "GET",
        url: "config/config_table.txt",
        dataType: "text",
        success: function (data) {
            setupSelection(data);
        }
    });
});


function get_project_table(url) {
    $.ajax({
        type: "GET",
        url: url,
        dataType: "text",
        success: function (data) {
            setup_project(data);
        }
    });
}


//array holding the config table
var project_table = [];
var config_table = [];

function setup_project(table) {
    project_table = processData(table, "	");
    var A = get_unique_items(project_table, 0);
    add_options_to_dropdown("SA", A);
    setup_selections(project_table);
    show_item("#add");
}

//update selections
function setup_selections(table) {
    update_B(table);
    update_C(table);
    update_D(table);
}

//update each dropdown menu individually
function update_B(table) {
    var A = document.getElementById("SA").value;
    var B = get_items(A, 0, 1, table, "B");
    add_options_to_dropdown("SB", B);
    update_C(table);
}

function update_C(table) {
    var A = document.getElementById("SA").value;
    var B = document.getElementById("SB").value;
    var C = get_2_items(A, 0, B, 1, 2, table, "C");
    add_options_to_dropdown("SC", C);
    update_D(table);
}

function update_D(table) {
    var A = document.getElementById("SA").value;
    var B = document.getElementById("SB").value;
    var C = document.getElementById("SC").value;
    var D = get_3_items(A, 0, B, 1, C, 2, 3, table, "D");
    add_options_to_dropdown("SD", D);
}

//take the .txt comma separated file and put it into an array
function processData(allText, delim) {
    var allTextLines = allText.split(/\r\n|\n/);
    //can change the string in the .split function if a different delimeter is used.
    var headers = allTextLines[0].split(delim);
    var lines = [];
    for (var i = 1; i < allTextLines.length; i++) {
        //also change this delimeter if you want to use a different one.
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
}

//setup function that loads the table and populates the dropdowns
function setupSelection(table) {
    //delimiter is a tab and not a space
    config_table = processData(table, "\t");
    populate_project_product();
    hide_version_selection();
    hide_item("#headings");
    hide_item("#headings_selection");
    hide_item("#add_data");
    hide_item("#description_title");
    hide_item("#description_text");
    hide_item("#add");
    showPage();
    toggle_add_layer(0);
}



//get unique items from a column of the configuration table.
function get_unique_items(table, column) {
    var x = []
    for (i = 0; i < table.length; i++) {
        x.push(table[i][column]);
    };
    return x.unique();
};


//Helper function. Pass a selection dropdown menu and it will remove all options from it.
function removeOptions(selectbox) {
    var i;
    for (i = selectbox.options.length - 1; i >= 0; i--) {
        selectbox.remove(i);
    };
};


//populate the project and product menus with all the available items
function populate_project_product() {
    projects = get_unique_items(config_table, 0);
    products = get_unique_items(config_table, 2);
    var project_selection = document.getElementById("project_selection");
    var product_selection = document.getElementById("product_selection");
    for (i = 0; i < projects.length; i++) {
        var option = document.createElement("option");
        option.text = projects[i];
        project_selection.add(option);
    }
    for (i = 0; i < products.length; i++) {
        var option = document.createElement("option");
        option.text = products[i];
        product_selection.add(option);
    }
}

//resets to the default values and populates the dropdowns with everything available
function reset_selections() {
    var project_selection = document.getElementById("project_selection");
    var product_selection = document.getElementById("product_selection");
    removeOptions(product_selection);
    removeOptions(project_selection);
    removeOptions(document.getElementById("version_selection"));
    var proj_option = document.createElement("option");
    var prod_option = document.createElement("option");
    proj_option.text = "Select Project"
    prod_option.text = "Select Product"
    project_selection.add(proj_option);
    product_selection.add(prod_option);
    populate_project_product();
    hide_version_selection();
    hide_item("#headings");
    hide_item("#headings_selection");
    hide_item("#add_data");
    hide_item("#description_title");
    hide_item("#description_text");
    hide_item("#add");

}


//hide the version selection

function hide_version_selection() {
    hide_item("#version_header");
    hide_item("#version_selection");
}

//show the version selection
function show_version_selection() {
    show_item("#version_header");
    show_item("#version_selection");
}

//update each list based on selection
function update_products() {
    var proj = document.getElementById("project_selection").value;
    if (proj == "Select Project") {
        reset_selections(config_table);
    } else {
        var prod = [];
        prod = get_items(proj, 0, 2, config_table);
        add_options_to_dropdown("product_selection", prod);
        check_both_selected("project_selection", "product_selection");
    }
};

function update_projects() {
    var prod = document.getElementById("product_selection").value;
    if (prod == "Select Product") {
        reset_selections(config_table);
    } else {
        var proj = [];
        proj = get_items(prod, 2, 0, config_table);
        add_options_to_dropdown("project_selection", proj);
        check_both_selected("project_selection", "product_selection");
    }
};

//when a selection of project, product and version has been made, populate the second set of dropdown menus.
function selectionMade() {
    var A = document.getElementById("project_selection");
    var B = document.getElementById("product_selection");
    var C = document.getElementById("version_selection");
    if (A != "Select Project" && B != "Select Product" && C != "") {
        var x = get_table_row_index(config_table);
        var out_url = config_table[x][7];
        show_item("#headings");
        show_item("#headings_selection");
        update_headings(x, config_table)
    }
    get_project_table(out_url);
}


//needs re writing to be more general but given two items selected, return the available items in the third column
function get_versions(A, B, table) {
    var x = [];
    for (i = 0; i < table.length; i++) {
        if (table[i][0] == A && table[i][2] == B) {
            x.push(table[i][4]);
        };
    };
    if (x.unique() == "empty") {
        hide_version_selection();
    } else {
        show_version_selection();
    };
    return x.unique();
}

//get unique items given 2 from the table
function get_2_items(A, colA, B, colB, colC, table, dropdownID) {
    var x = [];
    for (i = 0; i < table.length; i++) {
        if (table[i][colA] == A && table[i][colB] == B) {
            x.push(table[i][colC]);
        };
    };
    if (x.unique() == "empty") {
        hide_item("#H" + dropdownID);
        hide_item("#S" + dropdownID);

    } else {
        show_item("#H" + dropdownID);
        show_item("#S" + dropdownID);
    };
    return x.unique();
};

//get unique items given 3 from the table
function get_3_items(A, colA, B, colB, C, colC, colD, table, dropdownID) {
    var x = [];
    for (i = 0; i < table.length; i++) {
        if (table[i][colA] == A && table[i][colB] == B && table[i][colC] == C) {
            x.push(table[i][colD]);
        };
    };
    if (x.unique() == "empty") {
        hide_item("#H" + dropdownID);
        hide_item("#S" + dropdownID);
    } else {
        show_item("#H" + dropdownID);
        show_item("#S" + dropdownID);
    };
    return x.unique();
};

//bit crappy but checks whether the user has selected something from both the project and product menus abd then populates the version menu
function check_both_selected(dropA, dropB) {
    var dropdownA = document.getElementById(dropA).value;
    var dropdownB = document.getElementById(dropB).value;
    if (dropdownA != "Select Project" && dropdownB != "Select Product") {
        update_versions(dropdownA, dropdownB);
        selectionMade();
    } else {
        removeOptions(version_selection)
    }
}

function update_versions(valA, valB) {
    var versions = get_versions(valA, valB, config_table);
    add_options_to_dropdown("version_selection", versions);
}



//Given the selection of project, product and version, return which row of the data table it came from. Once you know the row, you can find all information
//about the item.
function get_table_row_index(data_table) {
    s = document.getElementById("project_selection").value;
    p = document.getElementById("product_selection").value;
    v = document.getElementById("version_selection").value;
    for (i = 0; i <= data_table.length; i++) {
        if (data_table[i][0] == s && data_table[i][2] == p && data_table[i][4] == v) {
            return i
        };
    };
};


//given the selection of variable made, return the index of the line in the project table it corresponds to.
function get_variable_index(table) {
    var A = document.getElementById("SA").value;
    var B = document.getElementById("SB").value;
    var C = document.getElementById("SC").value;
    var D = document.getElementById("SD").value;
    for (i = 0; i <= table.length; i++) {
        if (table[i][0] == A && table[i][1] == B && table[i][2] == C && table[i][3] == D) {
            return i
        };
    };
}

//IMPORTANT FUNCTION. Generates the png url form the selection in the table and the date.
function generate_png_url(variable_index, project_index, proj_table) {
    var base_url = config_table[project_index][5];
    var base_file_pref = config_table[project_index][6];
    var pre_ymd = config_table[project_index][12];
    ymd_delta = proj_table[variable_index][13];
    ymd = document.getElementById("datepicker-13").value;

    //change the ymd component depending on the config of the variable
    switch (ymd_delta) {
        case 'd':
            ymd = ymd;
            break;
        case 'm':
            ymd = ymd.slice(0, -3);
            break;
        case 'y':
            ymd = ymd.slice(0, -6);
            break;
    };

    ymd_1 = ymd.replaceAll("/", "");
    var png_url = base_url + ymd + "/"
    if (pre_ymd == "empty" || pre_ymd == undefined) {
        png_url += ymd_1;
    }
    else{
        png_url +=  pre_ymd + ymd_1
    }

    if (base_file_pref != "empty") {
        png_url += base_file_pref;
    }
    for (let r = 4; r < 8; r++) {
        if (proj_table[variable_index][r] != "empty") {
            png_url += proj_table[variable_index][r];
        }
    }
    return png_url + ".png"
}

function add_data() {
    var variable_index = get_variable_index(project_table);
    var project_index = get_table_row_index(config_table);
    add_data_to_layer(variable_index, project_index, project_table, active_data_layer);
}


//given a test value, go through all the values in a specified column and return the unique values corresponding to the test value
function get_items(test_value, column_given, column_required, data_table, dropdownID) {
    var x = []
    for (i = 0; i < data_table.length; i++) {
        if (data_table[i][column_given] == test_value) {
            x.push(data_table[i][column_required])
        }
    }
    if (x.unique() == "empty") {
        hide_item("#H" + dropdownID);
        hide_item("#S" + dropdownID);

    } else {
        show_item("#H" + dropdownID);
        show_item("#S" + dropdownID);
    };
    return x.unique();
}

//add options to a dropdown menu
function add_options_to_dropdown(dropdownElement, values) {
    var dropdown = document.getElementById(dropdownElement);
    removeOptions(dropdown);
    for (i = 0; i < values.length; i++) {
        var option = document.createElement("option")
        option.text = values[i]
        dropdown.add(option);
    }
}

//Update the headings of the secondary dropdown menus
function update_headings(table_row, table) {
    var titles = ["HA", "HB", "HC", "HD"];
    var dropdowns = ["SA", "SB", "SC", "SD"];
    for (i = 0; i < titles.length; i++) {
        var header = document.getElementById(titles[i])
        var title = table[table_row][i + 8];
        header.innerText = title;
    }
    if (table[table_row][1] != "empty") {
        show_item("#description_title")
        show_item("#description_text")
        document.getElementById("description_text").innerText = table[table_row][1]
    } else {
        hide_item("#description_title")
        hide_item("#description_text")
    }
    show_item("#add_data")
}


//give an html id and the function will hide it.
function hide_item(item_id) {
    $(function () {
        $(item_id).hide();
    });
};


//give an html id and the function will show it
function show_item(item_id) {
    $(function () {
        $(item_id).show();
    });
};