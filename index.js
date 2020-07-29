// Function to get transit operators
const API_KEY= 'ce1be608-3887-45ce-a1dd-ee79e561d8eb';

function generateSelect(operators) {
  let txt = "";
  txt += '<select id="mySelect" onchange="changeOperator(this.value)">';
  txt += '<option value="">Choose...</option>';
  for (obj of operators) {
    txt += `<option value=${obj.Id}>${obj.Name}</option>`;
  }
  txt += "</select>"

  document.getElementById("demo").innerHTML = txt;
}

async function getOperators() {
  const response = await fetch(`http://api.511.org/transit/operators?api_key=${API_KEY}&format=json`)
  return response.json()
}

async function getBus(operatorId) {
  const response = await fetch(`http://api.511.org/transit/StopMonitoring?api_key=${API_KEY}&agency=${operatorId}&format=json`)
  return response.json()
}

// Create a table of buses from the selected operator
function changeOperator(Id) {
  console.log(document.getElementById("mySelect").value);
  console.log(Id);

  if (Id == "") {
    document.getElementById("myTable").innerHTML = "";
  }
  else {
    getBus(Id)
    .then(data => {
      if (data["ServiceDelivery"]["StopMonitoringDelivery"]["MonitoredStopVisit"].length != 0) {
        let busInfo = data["ServiceDelivery"]["StopMonitoringDelivery"]["MonitoredStopVisit"];
        console.log(busInfo);
        let txt = "";
        /* let busId = busInfo["MonitoredVehicleJourney"]["VehicleRef"];
        let busLongitude = busInfo[i].MonitoredVehicleJourney.VehicleLocation.Longitude;
        let busLatitude = busInfo[i].MonitoredVehicleJourney.VehicleLocation.Latitude; */
        
        // create table
        txt += "<table class='table table-hover'>"
        // add table header
        txt += "<thead class='thead-dark'> <tr> <th scope='col'>Bus Code</th> <th scope='col'>Current Location</th> </tr> </thead>";

        // add bus records (aka. table body)
        txt += "<tbody>"
        for (let i = 0; i < busInfo.length; i++) {
          let busLongitude = busInfo[i].MonitoredVehicleJourney.VehicleLocation.Longitude;
          let busLatitude = busInfo[i].MonitoredVehicleJourney.VehicleLocation.Latitude;

          txt += `<tr id='${i}' > <td> <button id='${i}-button' onclick="createMarker(this.parentNode.parentNode.id)" type='button' class='btn btn-info'>${busInfo[i].MonitoredVehicleJourney.VehicleRef}</button>`;
          txt +=  `<td id='${i}-location'>${busLongitude},${busLatitude}</td></tr>`;
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

//, ${data.ServiceDelivery.ProducerRef}, ${busInfo[i].MonitoredVehicleJourney.VehicleRef}

// Initiate Google map
let map;
function initMap() {
  map = new google.maps.Map(document.getElementById("googleMap"), {
    center: {lat: 37.701081, lng: -122.310717},
    zoom: 13,
    gestureHandling: 'greedy' 
  });
}

// Global variables for marker update and polyline
let marker = null;
let globalBusCode = -1;
let globalBusIndex = -1;
let updateVar;
let busPath = null;

function startUpdate() {
  updateVar = setInterval(updateBusLocation, 15000);
}

function stopUpdate() {
  clearInterval(updateVar);
}

function updateBusLocation() {
  if (marker != null) {
    marker.setMap(null);
    marker = null;
  }

  let currentOperator = document.getElementById("mySelect").value;

  fetch(`http://api.511.org/transit/VehicleMonitoring?api_key=${API_KEY}&agency=${currentOperator}&vehicleID=${globalBusCode}&format=json`)
    .then(data => data.json())
    .then(jsonData => {
      // Get the location
      let newLocation = jsonData["Siri"]["ServiceDelivery"]["VehicleMonitoringDelivery"]["VehicleActivity"][0]["MonitoredVehicleJourney"]["VehicleLocation"];
      // Change attriutes to type float
      for (e in newLocation) {
        newLocation[e] = parseFloat(newLocation[e])
      }

      marker = new google.maps.Marker({
        position: {
          lat: newLocation["Latitude"], lng: newLocation["Longitude"]
        },
        icon: "https://img.icons8.com/dusk/32/000000/bus.png"
        
        });
      marker.setMap(map);
      
      // Accoding to google map docs, Object literals are accepted in place of LatLng objects, as a convenience, in many places.
      // However, this situation below is not the case.
      // I have to create a new LatLng object and pass it to the getPath().push().
      var myLatLng = new google.maps.LatLng(newLocation["Latitude"], newLocation["Longitude"]);
      const path = busPath.getPath();
      path.push(myLatLng);

      map.setCenter({lat: newLocation["Latitude"], lng: newLocation["Longitude"]})
      document.getElementById(globalBusIndex + '-location').innerHTML = newLocation["Longitude"] + ',' + newLocation["Latitude"];

    })
}

function createMarker(busIndex) {

  let busCode = document.getElementById(busIndex + '-button').innerHTML;
  console.log('bus code is', busCode);

  // update the global bus code and global bus index for future update
  globalBusCode = document.getElementById(busIndex + '-button').innerHTML;
  globalBusIndex = busIndex;

  let latLngString = document.getElementById(busIndex + '-location').innerHTML.split(",");
  let latLngFloat = latLngString.map(e => parseFloat(e));

  // Clear the marker of the previously selected bus
  if (marker != null) {
    marker.setMap(null);
    marker = null;
  }
  
  // Clear the polyline of the previously seleceted bus
  if (busPath != null) {
    busPath.setMap(null);
    busPath = null;
  }

  // Set the marker for the currently selected bus
  marker = new google.maps.Marker({
    position: {lat: latLngFloat[1], lng: latLngFloat[0]},
    icon: "https://img.icons8.com/dusk/32/000000/bus.png"
  });
  marker.setMap(map);
  map.setCenter({lat: latLngFloat[1], lng: latLngFloat[0]})

  // Initiate the polyline
  busPath = new google.maps.Polyline({
    strokeColor: "#000000",
    strokeOpacity: 1.0,
    strokeWeight: 3
  });
  busPath.setMap(map);

  document.getElementById("stopUpdateButton").disabled = false; // turn on the Stop Button
  startUpdate()

}

// Call functions to get transit operators
getOperators()
.then(data => {
  let operators = data.map(function (element) {return {"Id":element.Id, "Name":element.Name}});
  return operators;
})
.then(operators => generateSelect(operators))
