var worldweather_prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("worldweather.");


function initWorldWeatherOptions() {

	if (worldweather_prefs.getPrefType("zipcode") != 0) {
		document.getElementById("zipcodeInput").setAttribute("value", worldweather_prefs.getCharPref("zipcode"));
	} else {
		document.getElementById("zipcodeInput").setAttribute("value", "");
	}

	if (worldweather_prefs.getPrefType("interval") != 0) {
		document.getElementById("refreshMinutes").setAttribute("value", worldweather_prefs.getCharPref("interval"));
	} else {
		document.getElementById("refreshMinutes").setAttribute("value", "30");
	}

	if (worldweather_prefs.getPrefType("refresh") != 0) {
		if (worldweather_prefs.getBoolPref("refresh")) {
			document.getElementById("refreshGroup").selectedItem = document.getElementById("refreshYes");
		} else {
			document.getElementById("refreshGroup").selectedItem = document.getElementById("refreshNo");
		}
	} else {
		document.getElementById("refreshGroup").selectedItem = document.getElementById("refreshYes");
	}

	if (worldweather_prefs.getPrefType("iconsize") != 0) {
		if (worldweather_prefs.getCharPref("iconsize") == "small") {
			document.getElementById("iconsizeGroup").selectedItem = document.getElementById("iconsizeSmall");
		} else if (worldweather_prefs.getCharPref("iconsize") == "medium") {
			document.getElementById("iconsizeGroup").selectedItem = document.getElementById("iconsizeMedium");
		} else if (worldweather_prefs.getCharPref("iconsize") == "large") {
			document.getElementById("iconsizeGroup").selectedItem = document.getElementById("iconsizeLarge");
		} else {
			document.getElementById("iconsizeGroup").selectedItem = document.getElementById("iconsizeMedium");
		}
	} else {
		document.getElementById("iconsizeGroup").selectedItem = document.getElementById("iconsizeMedium");
	}

	if (worldweather_prefs.getPrefType("textsize") != 0) {
		if (worldweather_prefs.getCharPref("textsize") == "small") {
			document.getElementById("textsizeGroup").selectedItem = document.getElementById("textsizeSmall");
		} else if (worldweather_prefs.getCharPref("textsize") == "medium") {
			document.getElementById("textsizeGroup").selectedItem = document.getElementById("textsizeMedium");
		} else if (worldweather_prefs.getCharPref("textsize") == "large") {
			document.getElementById("textsizeGroup").selectedItem = document.getElementById("textsizeLarge");
		} else {
			document.getElementById("textsizeGroup").selectedItem = document.getElementById("textsizeMedium");
		}
	} else {
		document.getElementById("textsizeGroup").selectedItem = document.getElementById("textsizeMedium");
	}

	
	if (worldweather_prefs.getPrefType("unittype") != 0) {
		if (worldweather_prefs.getCharPref("unittype") == "s") {
			document.getElementById("unittypeGroup").selectedItem = document.getElementById("unittypeStandard");
		} else if (worldweather_prefs.getCharPref("unittype") == "m") {
			document.getElementById("unittypeGroup").selectedItem = document.getElementById("unittypeMetric");
		} else {
			document.getElementById("unittypeGroup").selectedItem = document.getElementById("unittypeStandard");
		}
	} else {
		document.getElementById("unittypeGroup").selectedItem = document.getElementById("unittypeStandard");
	}

	setTimeout("window.sizeToContent()", 5);
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
		worldweather_prefs.setCharPref("interval", document.getElementById("refreshMinutes").value);
	}
	
	if (document.getElementById("refreshGroup").selectedItem == document.getElementById("refreshYes")) {
		worldweather_prefs.setBoolPref("refresh", true);
	} else {
		worldweather_prefs.setBoolPref("refresh", false);
	}

	window.opener.setTimeout("initiateWorldWeather()", 5);
	return true;
}