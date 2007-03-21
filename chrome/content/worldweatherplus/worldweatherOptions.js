var worldweather_prefs = Components.classes["@mozilla.org/preferences-service;1"].
                           getService(Components.interfaces.nsIPrefService).
                           getBranch("worldweather.");

function initWorldWeatherOptions() {

  document.getElementById("zipcodeInput").setAttribute("value", worldweather_prefs.getCharPref("zipcode"));
	document.getElementById("refreshMinutes").setAttribute("value", worldweather_prefs.getIntPref("interval"));

  if (worldweather_prefs.getBoolPref("refresh")) {
    document.getElementById("refreshGroup").selectedItem = document.getElementById("refreshYes");
  } else {
    document.getElementById("refreshGroup").selectedItem = document.getElementById("refreshNo");
  }

  if (worldweather_prefs.getCharPref("iconsize") == "small") {
    document.getElementById("iconsizeGroup").selectedItem = document.getElementById("iconsizeSmall");
  } else if (worldweather_prefs.getCharPref("iconsize") == "medium") {
    document.getElementById("iconsizeGroup").selectedItem = document.getElementById("iconsizeMedium");
  } else if (worldweather_prefs.getCharPref("iconsize") == "large") {
    document.getElementById("iconsizeGroup").selectedItem = document.getElementById("iconsizeLarge");
  }

  if (worldweather_prefs.getCharPref("textsize") == "small") {
    document.getElementById("textsizeGroup").selectedItem = document.getElementById("textsizeSmall");
  } else if (worldweather_prefs.getCharPref("textsize") == "medium") {
    document.getElementById("textsizeGroup").selectedItem = document.getElementById("textsizeMedium");
  } else if (worldweather_prefs.getCharPref("textsize") == "large") {
    document.getElementById("textsizeGroup").selectedItem = document.getElementById("textsizeLarge");
  }
	
  if (worldweather_prefs.getCharPref("unittype") == "s") {
    document.getElementById("unittypeGroup").selectedItem = document.getElementById("unittypeStandard");
  } else if (worldweather_prefs.getCharPref("unittype") == "m") {
    document.getElementById("unittypeGroup").selectedItem = document.getElementById("unittypeMetric");
  }

	setTimeout("window.sizeToContent()", 100);
}


function saveWorldWeatherOptions() {
	
	worldweather_prefs.setCharPref("zipcode", document.getElementById("zipcodeInput").value);
	worldweather_prefs.setCharPref("iconsize", document.getElementById("iconsizeGroup").selectedItem.value);
	worldweather_prefs.setCharPref("textsize", document.getElementById("textsizeGroup").selectedItem.value);
	worldweather_prefs.setCharPref("unittype", document.getElementById("unittypeGroup").selectedItem.value);

	if (document.getElementById("refreshMinutes").value < 30){
		alert("Refresh time may not be set below 30 minutes (as mandated by weather.com).");
		return false;
	} else {		
		worldweather_prefs.setIntPref("interval", document.getElementById("refreshMinutes").value);
	}
	
	if (document.getElementById("refreshGroup").selectedItem == document.getElementById("refreshYes")) {
		worldweather_prefs.setBoolPref("refresh", true);
	} else {
		worldweather_prefs.setBoolPref("refresh", false);
	}

	return true;
}