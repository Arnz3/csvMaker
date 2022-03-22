let markers = [];
let deleteButtons = [];

var table = document.getElementById("coords");

var undoButton = document.getElementById("undo");
var csvButton = document.getElementById("csv");
var markerButton = document.getElementById("placeMarker");
var resetButton = document.getElementById("reset");
var importButton = document.getElementById("selectFile");
var processButton = document.getElementById("procces");

var CSVdata = "lat, lon, direction, pointcode\n";

lang="EN"

const dict = {
    "NL" : { 
        lat: "hoogteligging",
        lon:"breedteligging",
        richting:"richting",
        pointcode:"puntsoort",
        reeks:"richting/reeks",
        zebra:"oversteekplaats",
        activiteit:"activiteit",
        einde: "einde",
    },

    "EN" : {
        lat: "latitude",
        lon: "longtitude",
        richting:"direction",
        pointcode:"pointsort",
        reeks:"direction/series",
        zebra:"zebracrossing",
        activiteit:"activity",
        einde:"end",
    }
}


// Initialize and add the map
function initMap() {
    // The location of Veurne
    const veurne = { lat: 51.07213711, lng: 2.66265667 };
    // The map, centered at Veurne
    var map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: veurne,
        streetViewControl: false,
    });

    var sv = new google.maps.StreetViewService();

    panorama = new google.maps.StreetViewPanorama(
        document.getElementById("pano")
    );

    sv.getPanorama({ location: veurne, radius: 50 }).then(processSVData);
    // Look for a nearby Street View panorama when the map is clicked.
    // getPanorama will return the nearest pano when the given
    // radius is 50 meters or less.
    map.addListener("click", (event) => {
        sv.getPanorama({ location: event.latLng, radius: 50 })
        .then(processSVData)
        .catch((e) =>
            console.error("Street View data not found for this location.")
        );
        addMarker(map, event.latLng)
    });

    markerButton.addEventListener("click", () =>{
        position = panorama.getPosition();
        addMarker(map, { lat: position.lat(), lng: position.lng() })
    });

    processButton.addEventListener("click", () =>{
        var reader = new FileReader();
        var CSVinput = document.getElementById("file-input");
        reader.readAsBinaryString(CSVinput.files[0]);

        for(var i=table.rows.length-1; i>0; i-=1){
            table.deleteRow(i);
        }
        markers.forEach(marker => {
            marker.setMap(null);
            markers = [];
        });
    
        reader.onload = function(e){
            var text = e.target.result;
            var data = csvToArray(text);
    
            data.pop();

            data.forEach(point => {
                addMarker(map, { lat: Number(point[0]) , lng: Number(point[1]) }, point[2], Number(point[point.length-1] - "\r")); 
            });
        }
    });
}

undoButton.addEventListener("click", () =>{
    markers.pop().setMap(null);
    deleteButtons.pop();
    table.deleteRow(table.rows.length-1);
});

csvButton.addEventListener("click", () =>{
    let i = 0;
    var richtingInputs = document.querySelectorAll('.richtingInput');
    var pointcodeSelects = document.querySelectorAll(".pointcode");
    markers.forEach(marker => {
        CSVdata += marker.position.lat() + ",";
        CSVdata += marker.position.lng() + ",";
        if(richtingInputs[i].value == ""){
            CSVdata += "0,"
        } else{
            CSVdata += richtingInputs[i].value + ",";
        }
        CSVdata += pointcodeSelects[i].value + "\n";
        i += 1;
    });

    var hiddenElement = document.createElement('a');  
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(CSVdata);  
    hiddenElement.target = '_blank';  

    //provide the name for the CSV file to be downloaded  
    hiddenElement.download = 'wandeling.csv';  
    hiddenElement.click();  
});

resetButton.addEventListener("click", () =>{
    for(var i=table.rows.length-1; i>0; i-=1){
        table.deleteRow(i);
    }
    markers.forEach(marker => {
        marker.setMap(null);
        markers = [];
    });
    importButton.style.color = "var(--background)";
    deleteButtons = [];
});

importButton.addEventListener("click", (e) =>{
    e.preventDefault();
    var CSVinput = document.getElementById('file-input');
    CSVinput.click();

    if(CSVinput.files && CSVinput.files[0]){
        importButton.style.color = "green"; 
    }
});


function processSVData({ data }) {
    const location = data.location;
    const marker = new google.maps.Marker({
        position: location.latLng,
        map,
        title: location.description,
    });

    panorama.setPano(location.pano);
    panorama.setPov({
        heading: 270,
        pitch: 0,
    });
    panorama.setVisible(true);
    marker.addListener("click", () => {
        const markerPanoID = location.pano;

        // Set the Pano to use the passed panoID.
        panorama.setPano(markerPanoID);
        panorama.setPov({
            heading: 270,
            pitch: 0,
        });
        panorama.setVisible(true);
    });
}

function addMarker(map, latLng, inputData="", selected=0){
    //place marker on map
    var m = new google.maps.Marker({
        position: latLng,
        map: map,
        draggable: true,
        label : String(markers.length+1),
    });
    markers.push(m);
    // place marker info in table
    var row = table.insertRow();
    row.insertCell().innerHTML = String(markers.length);
    row.insertCell().innerHTML = markers[markers.length-1].position.lat();
    row.insertCell().innerHTML = markers[markers.length-1].position.lng();
    var input = document.createElement("input");
    input.className = "richtingInput";
    input.value=inputData;
    row.insertCell().appendChild(input);
    var select = document.createElement("select");
    select.className = "pointcode";
    row.insertCell().appendChild(select);
    var option0 = document.createElement("option")
    option0.setAttribute("value", "0");
    option0.innerHTML = dict[lang].reeks;
    select.appendChild(option0);
    var option1 = document.createElement("option");
    option1.setAttribute("value", "1");
    option1.innerHTML = dict[lang].zebra;
    select.appendChild(option1);
    var option2 = document.createElement("option");
    option2.setAttribute("value" ,"2");
    option2.innerHTML = dict[lang].activiteit;
    select.appendChild(option2);
    var option3 = document.createElement("option");
    option3.setAttribute("value", "3");
    option3.innerHTML = dict[lang].einde;
    select.appendChild(option3);
    //select the choice from the input
    select.selectedIndex = selected;
    //delete button for single row
    var deleteButton = document.createElement("button");
    deleteButtons.push(deleteButton);
    deleteButton.innerHTML = "delete";
    row.insertCell().appendChild(deleteButton);

    // addd button to list an provide event listener
    deleteButton.addEventListener("click", () =>{
        let index = deleteButtons.indexOf(deleteButton);
        markers[index].setMap(null);
        markers.splice(index, 1);
        table.deleteRow(index);
        deleteButtons.splice(index,1);
    });

    google.maps.event.addListener(m, 'dragend', function(e){
        table.rows[markers.indexOf(m)+1].cells[1].innerHTML = m.position.lat();
        table.rows[markers.indexOf(m)+1].cells[2].innerHTML = m.position.lng();
    });
}

function csvToArray(str, delimiter = ",") {
    const arr = []
    // slice from start of text to the first \n index
    // use split to create an array from string by delimiter
    const headers = str.slice(0, str.indexOf("\n")).split(delimiter);

    // slice from \n index + 1 to the end of the text
    // use split to create an array of each csv value row
    const rows = str.slice(str.indexOf("\n") + 1).split("\n");

    // split values into nested arrays 
    rows.forEach(row => {
        arr.push(row.split(delimiter));
    });
    
    // Map the rows
    // split values from each row into an array
    // use headers.reduce to create an object
    // object properties derived from headers:values
    // the object passed as an element of the array
    // const arr = rows.map(function (row) {
    //     const values = row.split(delimiter);
    //     const el = headers.reduce(function (object, header, index) {
    //     object[header] = values[index];
    //     return object;
    //     }, {});
    //     return el;
    // });

    // return the array
    return arr;
}

