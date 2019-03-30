var weather_prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.ndfdweather.");
var geoTimeout    = null;
function initWeatherOptions()
{
 var prefZipcodeVal = weather_prefs.getCharPref("zipcode");
 var prefLatLonVal = weather_prefs.getCharPref("latlon");
 var prefIntervalVal = weather_prefs.getIntPref("interval");
 var prefForecastVal = weather_prefs.getIntPref("forecastdays");
 var prefRefreshVal = weather_prefs.getBoolPref("refresh");
 var prefIconsizeVal = weather_prefs.getCharPref("iconsize");
 var prefTextsizeVal = weather_prefs.getCharPref("textsize");
 var prefUnittypeVal = weather_prefs.getCharPref("unittype");
 var prefStatusbarVal = weather_prefs.getBoolPref("statusbar");

 var prefRefresh = "refreshYes";
 var prefLocation = "locationZip";
 var prefLat     = 0;
 var prefLon     = 0;
 var prefIconsize = "iconsizeMedium";
 var prefTextsize = "textsizeLarge";
 var prefUnittype = "unittypeStandard";
 var prefStatusbar = "statusYes";

 if (prefLatLonVal.indexOf(",") > -1)
 {
  prefLat = parseFloat(prefLatLonVal.substr(0, prefLatLonVal.indexOf(",")));
  prefLon = parseFloat(prefLatLonVal.substr(prefLatLonVal.indexOf(",") + 1));
  if (prefLat != 0 && prefLon != 0)
   prefLocation = "locationCoord";
 }
 if (!prefRefreshVal)
  prefRefresh = "refreshNo";
 if (prefIconsizeVal == "small")
  prefIconsize = "iconsizeSmall";
 else if (prefIconsizeVal == "large")
  prefIconsize = "iconsizeLarge";
 if (prefTextsizeVal == "small")
  prefTextsize = "textsizeSmall";
 else if (prefTextsizeVal == "medium")
  prefTextsize = "textsizeMedium";
 if (prefUnittypeVal == "m")
  prefUnittype = "unittypeMetric";
 if (!prefStatusbarVal)
  prefStatusbar = "statusNo";

 document.getElementById("locationGroup").selectedItem = document.getElementById(prefLocation);
 document.getElementById("zipcodeInput").value = prefZipcodeVal;
 document.getElementById("zipcodeInput").setAttribute("value", prefZipcodeVal);
 document.getElementById("coordInputLat").value = prefLat;
 document.getElementById("coordInputLat").setAttribute("value", prefLat);
 document.getElementById("coordInputLon").value = prefLon;
 document.getElementById("coordInputLon").setAttribute("value", prefLon);
 document.getElementById("refreshMinutes").value = prefIntervalVal;
 document.getElementById("refreshMinutes").setAttribute("value", prefIntervalVal);
 document.getElementById("forecastDays").value = prefForecastVal - 1;
 document.getElementById("forecastDays").setAttribute("value", prefForecastVal - 1);
 document.getElementById("refreshGroup").selectedItem = document.getElementById(prefRefresh);
 document.getElementById("iconsizeGroup").selectedItem = document.getElementById(prefIconsize);
 document.getElementById("textsizeGroup").selectedItem = document.getElementById(prefTextsize);
 document.getElementById("unittypeGroup").selectedItem = document.getElementById(prefUnittype);
 document.getElementById("statusGroup").selectedItem = document.getElementById(prefStatusbar);

 if (prefLocation === "locationCoord")
  toggleLocation("geo");
 else
  toggleLocation("zip");
 forecastLabelUpdate();

 setTimeout("window.sizeToContent()", 100);
}
function toggleLocation(enable)
{
 if (enable === "zip")
 {
  document.getElementById("zipcodeInput").disabled = false;
  document.getElementById("coordInputLat").disabled = true;
  document.getElementById("coordInputLon").disabled = true;
 }
 else if (enable === "geo")
 {
  document.getElementById("zipcodeInput").disabled = true;
  document.getElementById("coordInputLat").disabled = false;
  document.getElementById("coordInputLon").disabled = false;
 }
}
function getGeoData()
{
 toggleLocationOptions(false);
 var geoRequest = new XMLHttpRequest();
 geoRequest.overrideMimeType("application/json");
 geoRequest.open("GET", "https://realityripple.com/Software/Mozilla-Extensions/NDFD-Weather/geo.php", true);
 geoRequest.responseType = "JSON";
 geoRequest.setRequestHeader("Content-Type", "application/json; charset=utf-8");
 geoRequest.setRequestHeader("Pragma", "no-cache");
 geoRequest.setRequestHeader("Cache-Control", "no-cache");
 geoRequest.onload = function parse()
 {
  clearTimeout(geoTimeout);
  var return_data = new Array();
  try
  {
   var passJSON = JSON.parse(geoRequest.responseText);
   if (passJSON.error == true)
   {
    console.log("JSON Error");
    setNoGeoData();
    return true;
   }
   if (passJSON.lat == null || passJSON.lon == null)
   {
    console.log("Geo Data contains no location, latitude, or longitude values");
    console.log(passJSON);
    setNoGeoData();
    return true;
   }
   document.getElementById("coordInputLat").value = passJSON.lat;
   document.getElementById("coordInputLat").setAttribute("value", passJSON.lat);
   document.getElementById("coordInputLon").value = passJSON.lon;
   document.getElementById("coordInputLon").setAttribute("value", passJSON.lon);
   toggleLocationOptions(true);
   return true;
  }
  catch (e)
  {
   console.log("Error Parsing Geo Data");
   console.log(e);
   setNoGeoData();
   return true;
  }
 }
 try
 {
  geoRequest.send(null);
  geoTimeout = setTimeout("console.log('Geo Data Timeout'); setNoGeoData();", 7500);
 }
 catch (e)
 {
  console.log("Error Sending Geo Data Request");
  console.log(e);
  setNoGeoData();
 }
}
function setNoGeoData()
{
 clearTimeout(geoTimeout);
 toggleLocationOptions(true);
}
function toggleLocationOptions(enable)
{
 if (enable)
 {
  document.getElementById("locationZip").disabled = false;
  document.getElementById("locationCoord").disabled = false;
  if (document.getElementById("locationGroup").selectedItem == document.getElementById("locationCoord"))
  {
   document.getElementById("coordInputLat").disabled = false;
   document.getElementById("coordInputLon").disabled = false;
  }
  else
  {
   document.getElementById("zipcodeInput").disabled = false;
  }
 }
 else
 {
  document.getElementById("locationZip").disabled = true;
  document.getElementById("zipcodeInput").disabled = true;
  document.getElementById("locationCoord").disabled = true;
  document.getElementById("coordInputLat").disabled = true;
  document.getElementById("coordInputLon").disabled = true;
 }
}
function forecastLabelUpdate()
{
 var locale = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService).createBundle("chrome://ndfdweather/locale/weather.properties");
 var fcScale = document.getElementById("forecastDays");
 var fcAhead = document.getElementById("forecastDaysAhead");
 if (fcScale.value == 1)
  fcAhead.setAttribute("value", locale.GetStringFromName("forecast.ahead.day"));
 else
  fcAhead.setAttribute("value", locale.GetStringFromName("forecast.ahead.days").replace("%1", fcScale.value));
}
function saveWeatherOptions()
{
 var locale = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService).createBundle("chrome://ndfdweather/locale/weather.properties");
 if (document.getElementById("refreshMinutes").value < 30)
 {
  alert(locale.GetStringFromName("alert.refreshtime"));
  return false;
 }
 if (document.getElementById("locationGroup").selectedItem == document.getElementById("locationZip"))
 {
  if (document.getElementById("zipcodeInput").value == "" || isNaN(document.getElementById("zipcodeInput").value) || document.getElementById("zipcodeInput").value.length != 5)
  {
   alert(locale.GetStringFromName("alert.location.zip"));
   return false;
  }
  weather_prefs.setCharPref("zipcode", document.getElementById("zipcodeInput").value);
  weather_prefs.setCharPref("latlon", "0,0");
 }
 else
 {
  weather_prefs.setCharPref("zipcode", "");
  if (document.getElementById("coordInputLat").value == 0 || document.getElementById("coordInputLon").value == 0)
  {
   alert(locale.GetStringFromName("alert.location.geo"));
   return false;
  }
  weather_prefs.setCharPref("latlon", document.getElementById("coordInputLat").value + "," + document.getElementById("coordInputLon").value);
 }
 weather_prefs.setCharPref("iconsize", document.getElementById("iconsizeGroup").selectedItem.value);
 weather_prefs.setCharPref("textsize", document.getElementById("textsizeGroup").selectedItem.value);
 weather_prefs.setCharPref("unittype", document.getElementById("unittypeGroup").selectedItem.value);
 weather_prefs.setIntPref("interval", document.getElementById("refreshMinutes").value);
 weather_prefs.setIntPref("forecastdays", document.getElementById("forecastDays").value + 1);
 weather_prefs.setBoolPref("refresh", (document.getElementById("refreshGroup").selectedItem == document.getElementById("refreshYes")));
 weather_prefs.setBoolPref("statusbar", !(document.getElementById("statusGroup").selectedItem == document.getElementById("statusNo")));
 return true;
}
