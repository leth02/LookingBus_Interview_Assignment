let operators = [];
var txt = "";

// Function to get transit operators
function generateSelect(operators) {

  txt += '<select id="myselect" onchange="changeOperator(this.value)">';
  txt += '<option value="">Choose...</option>';
  for (obj of operators) {
    txt += `<option value=${obj.Id}>${obj.Name}</option>`;
  }
  txt += "</select>"
  console.log(txt);

  document.getElementById("demo").innerHTML = txt;
}

async function getOperators() {
  const response = await fetch('http://api.511.org/transit/operators?api_key=2e031256-3f0f-48d9-990b-b4df21285a7b&format=json')
  return response.json()
}

// Call functions to get transit operators
getOperators()
.then(data => {
  console.log(data);
  operators = data.map(function (element) {return {"Id":element.Id, "Name":element.Name}});
  console.log(operators, "asddad");
  return operators;
})
.then(operators => generateSelect(operators))

async function getBus(operatorId) {
  const response = await fetch(`http://api.511.org/transit/StopMonitoring?api_key=2e031256-3f0f-48d9-990b-b4df21285a7b&agency=${operatorId}&format=json`)
  return response.json()
}

function changeOperator(Id) {
  if (Id == "") {
    document.getElementById("myTable").innerHTML = "";
  }

  else {
    getBus(Id)
    .then(data => {
      if (data["ServiceDelivery"]["StopMonitoringDelivery"]["MonitoredStopVisit"].length != 0) {
        let busInfo = data["ServiceDelivery"]["StopMonitoringDelivery"]["MonitoredStopVisit"];
        let txt = "";
        
        // create table
        txt += "<table class='table table-hover'>"
        // add table header
        txt += "<thead class='thead-dark'> <tr> <th scope='col'>Bus Code</th> <th scope='col'>Current Location</th> </tr> </thead>";

        // add bus records (aka. table body)
        txt += "<tbody>"
        for (let i = 0; i < busInfo.length; i++) {
          txt += `<tr id='${Id}-${i}' > <td> <button onclick="createMarker(this.parentNode.parentNode.id + '-location')" type='button' class='btn btn-info'>${busInfo[i].MonitoredVehicleJourney.VehicleRef}</button>`;
          txt +=  `<td id='${Id}-${i}-location'>${busInfo[i].MonitoredVehicleJourney.VehicleLocation.Longitude},${busInfo[i].MonitoredVehicleJourney.VehicleLocation.Latitude}</td></tr>`;
        }
        txt += "</tbody> </table>"

        document.getElementById("myTable").innerHTML = txt;

      }
      else {
        document.getElementById("myTable").innerHTML = "There are no buses operating at the moment!"
      }
    })
  }
}

// google map
let map;
function initMap() {
  map = new google.maps.Map(document.getElementById("googleMap"), {
    center: {lat: 37.701081, lng: -122.310717},
    zoom: 13,
    gestureHandling: 'greedy' 
  });
}

let marker = null;

function createMarker(location) {
  
  // Clear the marker of the previously selected bus
  if (marker != null) {
    marker.setMap(null);
    marker = null;
  }
  
  // Set the marker for the currently selected bus
  let latLng1 = document.getElementById(location).innerHTML.split(",");
  
  let latLng2 = latLng1.map(e => parseFloat(e));

  marker = new google.maps.Marker({position: {lat: latLng2[1], lng: latLng2[0]}});
  marker.setMap(map);
}