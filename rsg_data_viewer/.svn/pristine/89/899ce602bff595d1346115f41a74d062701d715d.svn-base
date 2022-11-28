function $id(id) {
    return document.getElementById(id);
}

//prevent the page navigation when an item is dropped onto the window
window.addEventListener("dragover", function (e) {
    e = e || event;
    e.preventDefault();
}, false);
window.addEventListener("drop", function (e) {
    e = e || event;
    e.preventDefault();
}, false);

//arrays holding the dragover, dragleave and drop functions to be executed when an event is triggered.
var dragOver = [];
var dragLeave = [];
var drop = []

//setup the dragover and dragleave css style change functions and drop functions for each layer.
function setup_drag_drop() {
    for (var z = 0; z < 4; z++) {
        dragOver.push(makeDragOver(z));
        dragLeave.push(makeDragLeave(z));
        drop.push(makeDrop(z));
    };
};

//given a layer index, return the function to change the css styling of the text on that layer
function makeDragOver(i) {
    return function () {
        $id(get_active_layer(i, true) + "_data").classList.add("dragOver");
        $id(get_active_layer(i, true) + "_source").classList.add("dragOver");
    };
}

function makeDragLeave(i) {
    return function () {
        $id(get_active_layer(i, true) + "_data").classList.remove("dragOver");
        $id(get_active_layer(i, true) + "_source").classList.remove("dragOver");
    };
}

//given a layer index, return the function to be called when an object is dropped on that layer
function makeDrop(i) {
    return function (e) {
        //first remvoe the styling
        dragLeave[i]();
        //upload the files
        var files = e.target.files || e.dataTransfer.files;
        //if an image, then place it onto the layer it was dropped on, and update the properties of the layer
        if (files[0].type.indexOf("image") == 0) {
            var reader = new FileReader();
            reader.onload = function (e) {
                edit_layer_data(i, e.target.result, true);
                get_active_layer(i, false).data_long = "User Data";
                get_active_layer(i, false).source = "-";
                get_active_layer(i, false).data_short = "User";
                update_names();
                noData(i, false);
                vis = get_active_layer((i), true) + "_vis";
                document.getElementById(vis).checked = true;
                update_transparency(i);
                toggle_settings(i);
            }
            reader.readAsDataURL(files[0]);
        }
    }
}

//Initialisation
if (window.File && window.FileList && window.FileReader) {
    Init();
}

//initialisation function. sets up the event handlers and the functions to be called by the events.
function Init() {
    var xhr = new XMLHttpRequest();
    if (xhr.upload) {
        setup_drag_drop();
        setup_handlers();
    }
}

//set up the events for each layer.
function setup_handlers() {
    for (var j = 0; j < 4; j++) {
        r1 = $id(get_active_layer(j, true) + "_r1");
        r2 = $id(get_active_layer(j, true) + "_r2");
        r1.addEventListener("dragover", dragOver[j], false);
        r1.addEventListener("dragleave", dragLeave[j], false);
        r2.addEventListener("dragover", dragOver[j], false);
        r2.addEventListener("dragleave", dragLeave[j], false);
        r1.addEventListener("drop", drop[j], false);
        r2.addEventListener("drop", drop[j], false);
    }
}


//add kml and other format support
var dragDropkml = new Cesium.viewerDragDropMixin(viewer, {
    clearOnDrop: false,
    flyToOnDrop: false
})
viewer.dropError.addEventListener(function (viewerArg, source, error) {
    window.alert('Error processing ' + source + ':' + error);
});