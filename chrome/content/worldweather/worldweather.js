var myTimeout;
var numLinks;
var passXML;
var link_data = new Array(new Array(), new Array());


function getWorldWeather(zipcode,iconsize,unittype) { // Gets weather data from a remote xml file

	var worldweatherRequest = new XMLHttpRequest();
	netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
	worldweatherRequest.overrideMimeType("text/xml");
	worldweatherRequest.open("GET", "http://xoap.weather.com/weather/local/" + zipcode + "?cc=*&unit=" + unittype + "&link=xoap&prod=xoap&par=1005339582&key=6c926e998e80b44e", true);
	worldweatherRequest.setRequestHeader("Content-Type", "text/xml; charset=utf-8");

	// Code to execute when you hear back from the web service.
	worldweatherRequest.onload = function parse() {
		
		// Clear the timeout we set when we sent the request below 
		clearTimeout(myTimeout);

		// Try to parse the data we need
		var return_data = new Array();
		
		try {
			
			
			passXML = worldweatherRequest.responseXML;
			
			return_data["Location"] = passXML.getElementsByTagName("loc")[0].getElementsByTagName("dnam")[0].firstChild.nodeValue;
			return_data["IconIndex"] = passXML.getElementsByTagName("cc")[0].getElementsByTagName("icon")[0].firstChild.nodeValue;
			return_data["Temprature"] = passXML.getElementsByTagName("cc")[0].getElementsByTagName("tmp")[0].firstChild.nodeValue + "° " + passXML.getElementsByTagName("head")[0].getElementsByTagName("ut")[0].firstChild.nodeValue;
			return_data["FeelsLike"] = passXML.getElementsByTagName("cc")[0].getElementsByTagName("flik")[0].firstChild.nodeValue + "° " + passXML.getElementsByTagName("head")[0].getElementsByTagName("ut")[0].firstChild.nodeValue;
			return_data["Forecast"] = passXML.getElementsByTagName("cc")[0].getElementsByTagName("t")[0].firstChild.nodeValue;
			return_data["Visibility"] = passXML.getElementsByTagName("cc")[0].getElementsByTagName("vis")[0].firstChild.nodeValue + " " + passXML.getElementsByTagName("head")[0].getElementsByTagName("ud")[0].firstChild.nodeValue;
			return_data["Pressure"] = passXML.getElementsByTagName("cc")[0].getElementsByTagName("bar")[0].getElementsByTagName("r")[0].firstChild.nodeValue + " " + passXML.getElementsByTagName("head")[0].getElementsByTagName("ur")[0].firstChild.nodeValue + " (" + passXML.getElementsByTagName("cc")[0].getElementsByTagName("bar")[0].getElementsByTagName("d")[0].firstChild.nodeValue + ")";
			return_data["DewPoint"] = passXML.getElementsByTagName("cc")[0].getElementsByTagName("dewp")[0].firstChild.nodeValue + "° " + passXML.getElementsByTagName("head")[0].getElementsByTagName("ut")[0].firstChild.nodeValue;
			return_data["UVIndex"] = passXML.getElementsByTagName("cc")[0].getElementsByTagName("uv")[0].getElementsByTagName("i")[0].firstChild.nodeValue + " (" + passXML.getElementsByTagName("cc")[0].getElementsByTagName("uv")[0].getElementsByTagName("t")[0].firstChild.nodeValue + ")";
			return_data["Humidity"] = passXML.getElementsByTagName("cc")[0].getElementsByTagName("hmid")[0].firstChild.nodeValue + "%";
			return_data["ReportedAt"] = passXML.getElementsByTagName("cc")[0].getElementsByTagName("obst")[0].firstChild.nodeValue;
			return_data["LastUpdated"] = passXML.getElementsByTagName("cc")[0].getElementsByTagName("lsup")[0].firstChild.nodeValue;
			
			if(passXML.getElementsByTagName("cc")[0].getElementsByTagName("wind")[0].getElementsByTagName("s")[0].firstChild.nodeValue == "calm") {
				return_data["Wind"] =  "Calm"
			} else {
				return_data["Wind"] = passXML.getElementsByTagName("cc")[0].getElementsByTagName("wind")[0].getElementsByTagName("t")[0].firstChild.nodeValue + " " + passXML.getElementsByTagName("cc")[0].getElementsByTagName("wind")[0].getElementsByTagName("s")[0].firstChild.nodeValue + " " + passXML.getElementsByTagName("head")[0].getElementsByTagName("us")[0].firstChild.nodeValue;
			}
			
			for(i=0; i < passXML.getElementsByTagName("lnks")[0].getElementsByTagName("link").length; i++) {
				link_data[0][i] = passXML.getElementsByTagName("lnks")[0].getElementsByTagName("link")[i].getElementsByTagName("l")[0].firstChild.nodeValue;
				link_data[1][i] = passXML.getElementsByTagName("lnks")[0].getElementsByTagName("link")[i].getElementsByTagName("t")[0].firstChild.nodeValue;
			}
				
		}
		
		// If the file is corrupted, display the error message.
		catch (e) {
			displayWorldWeather("Error",iconsize,"");
			return true;
		}

		// Everything must be okay, so pass the array of current weather to the display function
		displayWorldWeather(return_data,iconsize,link_data);
	}

	// Reset the display to the "Loading..." message
	document.getElementById('worldweatherDeck').selectedIndex = '1';

	// Try to get the xml from the web.
	try {
		worldweatherRequest.send(null);
		// If we don't hear back from the remote web service in 5 seconds, display the error message.
		myTimeout = setTimeout("displayWorldWeather('Error',iconsize,'');", 5000);
	}
	
	// If we can't send the request, display the error message.
	catch (e) {
		displayWorldWeather("Error",iconsize,"");
	}
};



function displayWorldWeather(current_worldweather,iconsize,current_links) {

	// gets reference to localized strings
	var stringbundle = document.getElementById("strings");

	// if the weather server is down, display the error message (the string "Error" doesn't really mean anything)
	if (current_worldweather == "Error") {
		document.getElementById("displayWorldWeather-IconError").setAttribute("src", "chrome://worldweather/skin/icons/" + iconsize + "/na.png");
		document.getElementById('worldweatherDeck').selectedIndex = '2';
		return true;
	}

	// Load the current icon into the display
	document.getElementById("displayWorldWeather-Icon").setAttribute("src", "chrome://worldweather/skin/icons/" + iconsize + "/" + current_worldweather["IconIndex"] + ".png");

	// Load the current temperature into the display
	document.getElementById("displayWorldWeather-Temperature").setAttribute("value", current_worldweather["Temprature"]);

	// Load the location into the display
	document.getElementById("displayWorldWeather-Location").setAttribute("value", current_worldweather["Location"]);
	
	// Load the values into the hidden field
	//document.getElementById("worldweatherMoreData-PassXML").setAttribute("value", current_links);

	// Populate the tooltip grid
	for (var value in current_worldweather) {
		if (document.getElementById("worldweatherMoreData-" + value) != null){
			document.getElementById("worldweatherMoreData-" + value).setAttribute("value", current_worldweather[value]);
		}
	}

	// Change the display from the loading message to the main info message
	document.getElementById('worldweatherDeck').selectedIndex = "0";
}



// Function called on start up and every time weather refreshes
function initiateWorldWeather() {
	
	// Get current user preferences
	var worldweather_prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("worldweather.");

	// If any of the preferences aren't set, display the options dialog.
	if (worldweather_prefs.getPrefType("zipcode") == 0 || worldweather_prefs.getPrefType("refresh") == 0 || worldweather_prefs.getPrefType("interval") == 0 || worldweather_prefs.getPrefType("iconsize") == 0 || worldweather_prefs.getPrefType("unittype") == 0) {
		window.openDialog('chrome://worldweather/content/worldweatherOptions.xul', 'worldweatherOptions', 'chrome');
	} else if (worldweather_prefs.getCharPref("interval") < 30) {
		window.openDialog('chrome://worldweather/content/worldweatherOptions.xul', 'worldweatherOptions', 'chrome');
	}
	// Otherwise, load the preferences and get the current conditions from the web
	else {
		var zipcode = worldweather_prefs.getCharPref("zipcode");
		var refresh = worldweather_prefs.getBoolPref("refresh");
		var interval = worldweather_prefs.getCharPref("interval");
		var iconsize = worldweather_prefs.getCharPref("iconsize");
		var unittype = worldweather_prefs.getCharPref("unittype");

		getWorldWeather(zipcode,iconsize,unittype);

		// If the user wants to auto-refresh, call this function again in x minutes
		if(refresh){
			setTimeout("initiateWorldWeather()", interval * 60 * 1000);
		}
	}
}



// Put the whole shebang in motion once thunderbird loads.
addEventListener("load", initiateWorldWeather, false);