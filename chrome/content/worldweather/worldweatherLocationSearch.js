var myTimeout;

function getWorldWeatherLocationSearch(searchString) { // Gets location data from a remote xml file

	var worldweatherLocationSearchRequest = new XMLHttpRequest();
	netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
	worldweatherLocationSearchRequest.overrideMimeType("text/xml");
	worldweatherLocationSearchRequest.open("GET", "http://xoap.weather.com/search/search?where=" + searchString, true);
	worldweatherLocationSearchRequest.setRequestHeader("Content-Type", "text/xml; charset=utf-8");

	// Code to execute when you hear back from the web service.
	worldweatherLocationSearchRequest.onload = function parse() {

		// Clear the timeout we set when we sent the request below
		clearTimeout(myTimeout);

		// Try to parse the data we need
		var return_data = new Array(new Array(), new Array());

		try {			
			for (i=0; i<worldweatherLocationSearchRequest.responseXML.getElementsByTagName("loc").length; i++) {
				return_data[0][i] = worldweatherLocationSearchRequest.responseXML.getElementsByTagName("loc")[i].firstChild.nodeValue;
				return_data[1][i] = worldweatherLocationSearchRequest.responseXML.getElementsByTagName("loc")[i].getAttributeNode("id").nodeValue;
			}				
		}

		// If the file is corrupted, display the error message.
		catch (e) {
			displayWorldWeatherLocationSearch("Error");
			return true;
		}

		// Everything must be okay, so pass the array of current weather to the display function
		displayWorldWeatherLocationSearch(return_data);
	}

	// Try to get the xml from the web.
	try {
		worldweatherLocationSearchRequest.send(null);
		// If we don't hear back from the remote web service in 5 seconds, display the error message.
		myTimeout = setTimeout("displayWorldWeatherLocationSearch('Error');", 5000);
	}

	// If we can't send the request, display the error message.
	catch (e) {
		displayWorldWeatherLocationSearch("Error");
	}
};



function displayWorldWeatherLocationSearch(current_worldweatherLocationSearch) {

	// if the worldweather server is down, display the error message (the string "Error" doesn't really mean anything)
	if (current_worldweatherLocationSearch == "Error") {
		while (document.getElementById("searchResults").getRowCount() > 0) {
			document.getElementById("searchResults").removeItemAt(0);
		}
	
		var item = document.createElement("listitem");
		item.setAttribute("label","error");
		item.setAttribute("value","xxxxxxxx");
			
		document.getElementById("searchResults").appendChild(item);
	}
	
	if (current_worldweatherLocationSearch[0].length > 0) {
		while (document.getElementById("searchResults").getRowCount() > 0) {
			document.getElementById("searchResults").removeItemAt(0);
		}
	
		for (i=0; i<current_worldweatherLocationSearch[0].length; i++) {
			var item = document.createElement("listitem");
			item.setAttribute("label",current_worldweatherLocationSearch[0][i]);
			item.setAttribute("value",current_worldweatherLocationSearch[1][i]);
			
			document.getElementById("searchResults").appendChild(item);
		}
	} else {
		while (document.getElementById("searchResults").getRowCount() > 0) {
			document.getElementById("searchResults").removeItemAt(0);
		}
	
		var item = document.createElement("listitem");
		item.setAttribute("label","no matches");
		item.setAttribute("value","xxxxxxxx");
			
		document.getElementById("searchResults").appendChild(item);
	}		
}


function setWorldWeatherLocationSearch() {
	if(document.getElementById("searchResults").selectedItem == null || document.getElementById("searchResults").selectedItem.value == "xxxxxxxx") {
		alert("You must select a city or hit 'Cancel'");
		return false;
	} else {
		window.opener.document.getElementById("zipcodeInput").value = document.getElementById("searchResults").selectedItem.value;
		return true;
	}
}


// Function called every time location is searched
function initiateWorldWeatherLocationSearch(searchString) {

	getWorldWeatherLocationSearch(searchString);

}