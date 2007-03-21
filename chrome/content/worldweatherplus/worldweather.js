var link_data

var weatherWatcher = {
  myTimeout: null,
  zipcode: null,
	refresh: null,
	interval: 0,
	iconsize: null,
	textsize: null,
	unittype: null,
	current_worldweather: null,
	current_links: null,
	prefBranch_changed: null,
  worldweather_prefs: Components.classes["@mozilla.org/preferences-service;1"]
                               .getService(Components.interfaces.nsIPrefService)
                               .getBranch("worldweather."),

  getBranchPrefInterface: function (thisBranch) {
    if (typeof Components.interfaces.nsIPrefBranch2 == "undefined") {
      return thisBranch.QueryInterface(Components.interfaces.nsIPrefBranchInternal); //1.0.x support
    } else {
      return thisBranch.QueryInterface(Components.interfaces.nsIPrefBranch2); // 1.5+ support
    }
  },
  
  register: function() {
    var prefService = Components.classes["@mozilla.org/preferences-service;1"].
      getService(Components.interfaces.nsIPrefService);

    if(!weatherWatcher.prefBranch_changed) {
      weatherWatcher.prefBranch_changed = prefService.getBranch("worldweather.");
      var pbi = weatherWatcher.getBranchPrefInterface(weatherWatcher.prefBranch_changed);
      pbi.addObserver("", this, false);
    }

  },

  unregister: function() {
  
    if(!weatherWatcher.prefBranch_changed) return;
    var pbi = weatherWatcher.getBranchPrefInterface(weatherWatcher.prefBranch_changed);
    pbi.removeObserver("", this);

  },

  observe: function(aSubject, aTopic, aData) {
    if (aTopic != "nsPref:changed") return;

    setTimeout(weatherWatcher.initiateWorldWeather, 250);

    return;
  },

  getWorldWeather: function() { // Gets weather data from a remote xml file
  
    weatherWatcher.refreshPrefs();

    link_data = new Array(new Array(), new Array());
  	var worldweatherRequest = new XMLHttpRequest();

  	netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
  	worldweatherRequest.overrideMimeType("text/xml");
  	worldweatherRequest.open("GET", "http://xoap.weather.com/weather/local/" + this.zipcode + 
                                    "?cc=*&dayf=1&unit=" + this.unittype + 
                                    "&link=xoap&prod=xoap&par=1030266584&key=b1e4d322e4fc7c9d", true);
  	worldweatherRequest.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
  
  	// Code to execute when you hear back from the web service.
  	worldweatherRequest.onload = function parse() {
  		
  		// Clear the timeout we set when we sent the request below 
  		clearTimeout(this.myTimeout);
  
  		// Try to parse the data we need
  		var return_data = new Array();
  		
  		try {
  			
  			var passXML = worldweatherRequest.responseXML;
  			
  			var passTagLOC    = passXML.getElementsByTagName("loc")[0]
  			var passTagCC     = passXML.getElementsByTagName("cc")[0]
  			var passTagHEAD   = passXML.getElementsByTagName("head")[0]
  			var passTagDAYF   = passXML.getElementsByTagName("dayf")[0]
  			
  			return_data["Location"]      = passTagLOC.getElementsByTagName("dnam")[0].firstChild.nodeValue;
  			return_data["IconIndex"]     = passTagCC.getElementsByTagName("icon")[0].firstChild.nodeValue;
  			return_data["Temperature"]   = passTagCC.getElementsByTagName("tmp")[0].firstChild.nodeValue + "\u00b0 " + passTagHEAD.getElementsByTagName("ut")[0].firstChild.nodeValue;
  			return_data["FeelsLike"]     = passTagCC.getElementsByTagName("flik")[0].firstChild.nodeValue + "\u00b0 " + passTagHEAD.getElementsByTagName("ut")[0].firstChild.nodeValue;
  			return_data["Forecast"]      = passTagCC.getElementsByTagName("t")[0].firstChild.nodeValue;
  			return_data["Visibility"]    = passTagCC.getElementsByTagName("vis")[0].firstChild.nodeValue + " " + passTagHEAD.getElementsByTagName("ud")[0].firstChild.nodeValue;
  			return_data["Pressure"]      = passTagCC.getElementsByTagName("bar")[0].getElementsByTagName("r")[0].firstChild.nodeValue + " " + passTagHEAD.getElementsByTagName("ur")[0].firstChild.nodeValue + " (" + passTagCC.getElementsByTagName("bar")[0].getElementsByTagName("d")[0].firstChild.nodeValue + ")";
  			return_data["DewPoint"]      = passTagCC.getElementsByTagName("dewp")[0].firstChild.nodeValue + "\u00b0 " + passTagHEAD.getElementsByTagName("ut")[0].firstChild.nodeValue;
  			return_data["UVIndex"]       = passTagCC.getElementsByTagName("uv")[0].getElementsByTagName("i")[0].firstChild.nodeValue + " (" + passTagCC.getElementsByTagName("uv")[0].getElementsByTagName("t")[0].firstChild.nodeValue + ")";
  			return_data["Humidity"]      = passTagCC.getElementsByTagName("hmid")[0].firstChild.nodeValue + "%";
  			return_data["ReportedAt"]    = passTagCC.getElementsByTagName("obst")[0].firstChild.nodeValue;
  			return_data["LastUpdated"]   = passTagCC.getElementsByTagName("lsup")[0].firstChild.nodeValue;
  			return_data["Sunrise"]       = passTagDAYF.getElementsByTagName("day")[0].getElementsByTagName("sunr")[0].firstChild.nodeValue;
  			return_data["Sunset"]        = passTagDAYF.getElementsByTagName("day")[0].getElementsByTagName("suns")[0].firstChild.nodeValue;
  			
  			if(passTagCC.getElementsByTagName("wind")[0].getElementsByTagName("s")[0].firstChild.nodeValue == "calm") {
  				return_data["Wind"] =  "Calm"
  			} else {
  				return_data["Wind"] = passTagCC.getElementsByTagName("wind")[0].getElementsByTagName("t")[0].firstChild.nodeValue + " " + passTagCC.getElementsByTagName("wind")[0].getElementsByTagName("s")[0].firstChild.nodeValue + " " + passTagHEAD.getElementsByTagName("us")[0].firstChild.nodeValue;
  			}
  			
  			var passLINKS = passXML.getElementsByTagName("lnks")[0].getElementsByTagName("link")
  			for(i=0; i < passLINKS.length; i++) {
  				link_data[0][i] = passLINKS[i].getElementsByTagName("l")[0].firstChild.nodeValue;
  				link_data[1][i] = passLINKS[i].getElementsByTagName("t")[0].firstChild.nodeValue;
  			}
  				
  		} catch (e) {
        // If the file is corrupted, display the error message.
        weatherWatcher.current_worldweather = "Error"
  		  weatherWatcher.current_links = ""
  
  			weatherWatcher.displayWorldWeather();
  			return true;
  		}
  
  		// Everything must be okay, so pass the array of current weather to the display function
      weatherWatcher.current_worldweather = return_data
  	  weatherWatcher.current_links = link_data
  
  		weatherWatcher.displayWorldWeather();
      return true;
  	}
  
  	// Reset the display to the "Loading..." message
  	document.getElementById('worldweatherDeck').selectedIndex = '1';
  
  	// Try to get the xml from the web.
  	try {
  		worldweatherRequest.send(null);
  		// If we don't hear back from the remote web service in 5 seconds, display the error message.
  		this.myTimeout = setTimeout("weatherWatcher.current_worldweather = 'Error'; weatherWatcher.current_links = ''; weatherWatcher.displayWorldWeather();", 5000);
  	} catch (e) {
  	// If we can't send the request, display the error message.
      weatherWatcher.current_worldweather = "Error"
  	  weatherWatcher.current_links = ""
  		
      weatherWatcher.displayWorldWeather();
  	}
  },
  
  displayWorldWeather: function() {

  // If the user wants to auto-refresh, call this function again in x minutes
    clearTimeout(this.myTimeout);
    if (this.refresh) {
      this.myTimeout = setTimeout(weatherWatcher.initiateWorldWeather, this.interval * 60 * 1000);
    }

    weatherWatcher.refreshPrefs();

  	// gets reference to localized strings
  	var stringbundle = document.getElementById("strings");
  
  	// if the weather server is down, display the error message (the string "Error" doesn't really mean anything)
  	if (weatherWatcher.current_worldweather == "Error") {
  	  document.getElementById("displayWorldWeather-IconError")
        .setAttribute("class", "displayWorldWeather-Icon-" + this.iconsize);
  		document.getElementById("displayWorldWeather-IconError")
        .setAttribute("src", "chrome://worldweatherplus/skin/icons/large/na.png");
  		document.getElementById('worldweatherDeck').selectedIndex = '2';
  		return true;
  	}
  
  	// Load the current icon into the display
  	document.getElementById("displayWorldWeather-Icon")
      .setAttribute("class", "displayWorldWeather-Icon-" + this.iconsize);
  	document.getElementById("displayWorldWeather-Icon")
      .setAttribute("src", "chrome://worldweatherplus/skin/icons/large/" + weatherWatcher.current_worldweather["IconIndex"] + ".png");

  	// Load the current temperature into the display
  	document.getElementById("displayWorldWeather-Temperature")
      .setAttribute("value", weatherWatcher.current_worldweather["Temperature"]);
  	document.getElementById("displayWorldWeather-Temperature")
      .setAttribute("class", "displayWorldWeather-Temperature-" + this.textsize);
  
  	// Load the location into the display
  	document.getElementById("displayWorldWeather-Location")
      .setAttribute("value", weatherWatcher.current_worldweather["Location"]);
  	document.getElementById("displayWorldWeather-Location")
      .setAttribute("class", "displayWorldWeather-Location-" + this.textsize);
  	
  	// Load the values into the hidden field
  	document.getElementById("worldweatherMoreData-PassXML").setAttribute("value", weatherWatcher.current_links);
  
  	// Populate the tooltip grid
  	for (var value in weatherWatcher.current_worldweather) {
  		if (document.getElementById("worldweatherMoreData-" + value) != null){
  			document.getElementById("worldweatherMoreData-" + value)
          .setAttribute("value", weatherWatcher.current_worldweather[value]);
  		}
  	}
  
  	// Change the display from the loading message to the main info message
  	document.getElementById('worldweatherDeck').selectedIndex = "0";
  
  	return true;
  },
  
  // Function called on start up and every time weather refreshes
  initiateWorldWeather: function() {
  	if (weatherWatcher.worldweather_prefs.getCharPref("zipcode") == "" ||
        weatherWatcher.worldweather_prefs.getIntPref("interval") < 30)    {
      clearTimeout(this.myTimeout)
  		window.openDialog('chrome://worldweatherplus/content/worldweatherOptions.xul', 'worldweatherOptions', 'chrome,modal');
  	}	else {
  		weatherWatcher.getWorldWeather();
  	}
  },
  
  refreshPrefs: function() {
	  // Otherwise, load the preferences and get the current conditions from the web
		this.zipcode = weatherWatcher.worldweather_prefs.getCharPref("zipcode");
		this.refresh = weatherWatcher.worldweather_prefs.getBoolPref("refresh");
		this.interval = weatherWatcher.worldweather_prefs.getIntPref("interval");
		this.iconsize = weatherWatcher.worldweather_prefs.getCharPref("iconsize");
		this.textsize = weatherWatcher.worldweather_prefs.getCharPref("textsize");
		this.unittype = weatherWatcher.worldweather_prefs.getCharPref("unittype");
  }

}

window.addEventListener("load", function() { weatherWatcher.register(); } , false);
window.addEventListener("unload", function() { weatherWatcher.unregister(); } , false);

// Put the whole shebang in motion once thunderbird loads.
window.addEventListener("load", function() { setTimeout(weatherWatcher.initiateWorldWeather, 500)}, false);