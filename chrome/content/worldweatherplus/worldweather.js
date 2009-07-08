var link_data

var weatherWatcher = {
  myTimeout: null,
  myFadeTimeout: null,
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
    var weatherURL = "http://xoap.weather.com/weather/local/" + this.zipcode + 
                     "?cc=*&dayf=5&unit=" + this.unittype + 
                     "&link=xoap&prod=xoap&par=1030266584&key=b1e4d322e4fc7c9d"
    this.debug(weatherURL);
  	worldweatherRequest.open("GET", weatherURL, true);
  	worldweatherRequest.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
  	worldweatherRequest.setRequestHeader("Pragma", "no-cache");
  	worldweatherRequest.setRequestHeader("Cache-Control", "no-cache");

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

  			var passTagDAYF1   = passXML.getElementsByTagName("dayf")[0].getElementsByTagName("day")[0];
  			var passTagDAYF2   = passXML.getElementsByTagName("dayf")[0].getElementsByTagName("day")[1];
  			var passTagDAYF3   = passXML.getElementsByTagName("dayf")[0].getElementsByTagName("day")[2];
  			var passTagDAYF4   = passXML.getElementsByTagName("dayf")[0].getElementsByTagName("day")[3];
  			var passTagDAYF5   = passXML.getElementsByTagName("dayf")[0].getElementsByTagName("day")[4];
  			// var passTagDAYF6   = passXML.getElementsByTagName("dayf")[0].getElementsByTagName("day")[5];
  			// var passTagDAYF7   = passXML.getElementsByTagName("dayf")[0].getElementsByTagName("day")[6];
  			// var passTagDAYF8   = passXML.getElementsByTagName("dayf")[0].getElementsByTagName("day")[7];
  			// var passTagDAYF9   = passXML.getElementsByTagName("dayf")[0].getElementsByTagName("day")[8];
  			
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

  			return_data["Sunrise"]       = passTagDAYF1.getElementsByTagName("sunr")[0].firstChild.nodeValue;
  			return_data["Sunset"]        = passTagDAYF1.getElementsByTagName("suns")[0].firstChild.nodeValue;
  			
        return_data["forecast1"]     = passTagDAYF1;
        return_data["forecast2"]     = passTagDAYF2;
        return_data["forecast3"]     = passTagDAYF3;
        return_data["forecast4"]     = passTagDAYF4;
        return_data["forecast5"]     = passTagDAYF5;
        // return_data["forecast6"]     = passTagDAYF6;
        // return_data["forecast7"]     = passTagDAYF7;
        // return_data["forecast8"]     = passTagDAYF8;
        // return_data["forecast9"]     = passTagDAYF9;
        
  			if(passTagCC.getElementsByTagName("wind")[0].getElementsByTagName("s")[0].firstChild.nodeValue == "calm") {
  				return_data["Wind"] =  "Calm"
  			} else {
  				return_data["Wind"] = passTagCC.getElementsByTagName("wind")[0].getElementsByTagName("t")[0].firstChild.nodeValue + " " + passTagCC.getElementsByTagName("wind")[0].getElementsByTagName("s")[0].firstChild.nodeValue + " " + passTagHEAD.getElementsByTagName("us")[0].firstChild.nodeValue;
  			}
  			
  			// var passLINKS = passXML.getElementsByTagName("lnks")[0].getElementsByTagName("link")
  			// for(i=0; i < passLINKS.length; i++) {
  				link_data[0][0] = "http://www.weather.com/allergies?par=xoap&amp;site=textlink&amp;cm_ven=XOAP&amp;cm_cat=TextLink&amp;cm_pla=Link1&amp;cm_ite=Allergies"
  				link_data[1][0] = "Local Pollen Reports"

  				link_data[0][1] = "http://www.weather.com/flights?par=xoap&amp;site=textlink&amp;cm_ven=XOAP&amp;cm_cat=TextLink&amp;cm_pla=Link2&amp;cm_ite=BusinessTraveler"
  				link_data[1][1] = "Airport Conditions"

  				link_data[0][2] = "http://www.weather.com/garden?par=xoap&amp;site=textlink&amp;cm_ven=XOAP&amp;cm_cat=TextLink&amp;cm_pla=Link3&amp;cm_ite=Garden"
  				link_data[1][2] = "Lawn and Garden Weather"

  				link_data[0][3] = "http://www.weather.com/traffic?par=xoap&amp;site=textlink&amp;cm_ven=XOAP&amp;cm_cat=TextLink&amp;cm_pla=Link4&amp;cm_ite=Traffic"
  				link_data[1][3] = "Rush Hour Traffic"
          // }
  				
  		} catch (ex) {
        weatherWatcher.debug(ex)
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
  	} catch (ex) {
      weatherWatcher.debug(ex)
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
  	var stringbundle = document.getElementById("worldweatherplusstrings");
  
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

    for (var i = 1; i <= 5; ++i) {
      var forecastIconDay = weatherWatcher.current_worldweather["forecast" + i]
        .getElementsByTagName("part")[0].getElementsByTagName("icon")[0].firstChild.nodeValue;
      var forecastIconNight = weatherWatcher.current_worldweather["forecast" + i]
        .getElementsByTagName("part")[1].getElementsByTagName("icon")[0].firstChild.nodeValue;

      var forecastDay = weatherWatcher.current_worldweather["forecast" + i]
				.getElementsByTagName("part")[0].getElementsByTagName("t")[0].firstChild.nodeValue;
      var forecastNight = weatherWatcher.current_worldweather["forecast" + i]
				.getElementsByTagName("part")[1].getElementsByTagName("t")[0].firstChild.nodeValue;

      var forecastHi = weatherWatcher.current_worldweather["forecast" + i]
        .getElementsByTagName("hi")[0].firstChild.nodeValue;
      var forecastLow = weatherWatcher.current_worldweather["forecast" + i]
        .getElementsByTagName("low")[0].firstChild.nodeValue;

      if (i == 1) {
        document.getElementById("displayWorldWeather-ForecastTinyIcon" + i + "day")
          .setAttribute("src", "chrome://worldweatherplus/skin/icons/tiny/" + forecastIconDay + ".png");
        document.getElementById("displayWorldWeather-ForecastTinyIcon" + i + "night")
          .setAttribute("src", "chrome://worldweatherplus/skin/icons/tiny/" + forecastIconNight + ".png");

        document.getElementById("displayWorldWeather-ForecastTinyTemperature" + i)
          .setAttribute("value", forecastHi + " / " + forecastLow);
      }

      document.getElementById("displayWorldWeather-ForecastIcon" + i + "day")
        .setAttribute("src", "chrome://worldweatherplus/skin/icons/large/" + forecastIconDay + ".png");
      document.getElementById("displayWorldWeather-ForecastIcon" + i + "day")
        .setAttribute("tooltiptext", forecastDay);

			document.getElementById("displayWorldWeather-ForecastIcon" + i + "night")
        .setAttribute("src", "chrome://worldweatherplus/skin/icons/large/" + forecastIconNight + ".png");
      document.getElementById("displayWorldWeather-ForecastIcon" + i + "night")
        .setAttribute("tooltiptext", forecastNight);

      document.getElementById("displayWorldWeather-ForecastTemperature" + i)
        .setAttribute("value", forecastHi + " / " + forecastLow);
      
      document.getElementById("displayWorldWeather-ForecastLocation" + i)
        .setAttribute("value", forecastDay);

    }

    document.getElementById('worldweatherForecast').setAttribute('collapsed', 'true');

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
  },
  
  gOpenTime: 3000, // total time the alert should stay up once we are done animating.
  gFadeIncrement: .05,
  gSlideTime: 50,

  fadeOpen: function() {
    var alertContainer = document.getElementById("worldweatherFadeBox");

    var worldWeatherSidebarHeader = document.getElementById("worldWeatherSidebarHeader");
    //var forecastContainer = document.getElementById('worldweatherPaneForecast');

    worldWeatherSidebarHeader.setAttribute("class", "worldweatherSidebarURL");

    var newOpacity = parseFloat(window.getComputedStyle(alertContainer, "").opacity) + weatherWatcher.gFadeIncrement;
    //var newForecastOpacity = parseFloat(window.getComputedStyle(forecastContainer, "").opacity) + weatherWatcher.gFadeIncrement;

    alertContainer.style.opacity = newOpacity;
    //forecastContainer.style.opacity = newOpacity;
    
		clearTimeout(weatherWatcher.myFadeTimeout);

    if (newOpacity < 1.0) {
      weatherWatcher.myFadeTimeout = setTimeout(weatherWatcher.fadeOpen, weatherWatcher.gSlideTime);
    }
  },

  fadeClose: function()  {
    var alertContainer = document.getElementById("worldweatherFadeBox");
    //var forecastContainer = document.getElementById('worldweatherPaneForecast');

    var worldWeatherSidebarHeader = document.getElementById("worldWeatherSidebarHeader");

    worldWeatherSidebarHeader.removeAttribute("class");

    var newOpacity = parseFloat(window.getComputedStyle(alertContainer, "").opacity) - weatherWatcher.gFadeIncrement;
    //var newForecastOpacity = parseFloat(window.getComputedStyle(forecastContainer, "").opacity) - weatherWatcher.gFadeIncrement;

    alertContainer.style.opacity = newOpacity;
    //forecastContainer.style.opacity = newOpacity;
    
		clearTimeout(weatherWatcher.myFadeTimeout);

    if (newOpacity >= 0) {
      weatherWatcher.myFadeTimeout = setTimeout(weatherWatcher.fadeClose, weatherWatcher.gSlideTime);
    }
  },

  debug: function() {
    var mConsoleService = Components.classes["@mozilla.org/consoleservice;1"]
           .getService(Components.interfaces.nsIConsoleService)
    mConsoleService.logStringMessage("World Weather: " + Array.join(arguments, ": ") + "\n");
  }

}

window.addEventListener("load", function() { weatherWatcher.register(); } , false);
window.addEventListener("unload", function() { weatherWatcher.unregister(); } , false);

// Put the whole shebang in motion once thunderbird loads.
window.addEventListener("load", function() { setTimeout(weatherWatcher.initiateWorldWeather, 500)}, false);