var weatherWatcher =
{
 myTimeout: null,
 sunTimeout: null,
 refreshTimer: null,
 zipcode: null,
 latlon: null,
 refresh: null,
 interval: 0,
 forecastdays: 5,
 iconsize: null,
 textsize: null,
 unittype: null,
 sunandmoon: null,
 statusbarVis: null,
 current_weather: null,
 current_sun: null,
 prefBranch_changed: null,
 locale: Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService).createBundle("chrome://ndfdweather/locale/weather.properties"),
 weather_prefs: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.ndfdweather."),
 getBranchPrefInterface: function (thisBranch)
 {
  if (typeof Components.interfaces.nsIPrefBranch2 == "undefined" && typeof Components.interfaces.nsIPrefBranchInternal == "undefined")
   return thisBranch.QueryInterface(Components.interfaces.nsIPrefBranch); // 60.0+ support
  else if (typeof Components.interfaces.nsIPrefBranch2 == "undefined")
   return thisBranch.QueryInterface(Components.interfaces.nsIPrefBranchInternal); //1.0.x support
  else
   return thisBranch.QueryInterface(Components.interfaces.nsIPrefBranch2); // 1.5+ support
 },
 register: function()
 {
  var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
  if(!weatherWatcher.prefBranch_changed)
  {
   weatherWatcher.prefBranch_changed = prefService.getBranch("extensions.ndfdweather.");
   var pbi = weatherWatcher.getBranchPrefInterface(weatherWatcher.prefBranch_changed);
   pbi.addObserver("", this, false);
  }
 },
 unregister: function()
 {
  if(!weatherWatcher.prefBranch_changed)
   return;
  var pbi = weatherWatcher.getBranchPrefInterface(weatherWatcher.prefBranch_changed);
  pbi.removeObserver("", this);
 },
 observe: function(aSubject, aTopic, aData)
 {
  if (aTopic != "nsPref:changed")
   return;
  setTimeout(weatherWatcher.initiateWeather, 250);
  return;
 },
 getWeather: function()
 {
  weatherWatcher.refreshPrefs();
  var nowUT   = new Date();
  var beginUT = nowUT.getFullYear() + "/" + ("0" + (nowUT.getMonth()+1)).slice(-2) + "/" + ("0" + nowUT.getDate()).slice(-2) + "T" + ("0" + nowUT.getHours()).slice(-2) + ":00";
  var futUT   = new Date();
  futUT.setDate(futUT.getDate() + 7);
  futUT.setHours(23);
  var endUT = futUT.getFullYear() + "/" + ("0" + (futUT.getMonth()+1)).slice(-2) + "/" + ("0" + futUT.getDate()).slice(-2) + "T" + ("0" + futUT.getHours()).slice(-2) + ":59";
  var weatherURL = "";
  if (this.zipcode !== null && this.zipcode != "")
  {
   weatherURL =  "https://graphical.weather.gov/xml/sample_products/browser_interface/ndfdXMLclient.php" +
                   "?zipCodeList=" + this.zipcode +
                   "&product=time-series&begin=" + beginUT + "&end=" + endUT +
                   "&Unit=" + this.unittype +
                   "&mint=mint" +
                   "&maxt=maxt" +
                   "&temp=temp" +
                   "&appt=appt" +
                   "&wx=wx" +
                   "&dew=dew" +
                   "&rh=rh" +
                   "&wspd=wspd" +
                   "&wdir=wdir" +
                   "&sky=sky" +
                   "&snow=snow" +
                   "&wwa=wwa" +
                   "&iceaccum=iceaccum" +
                   "&icons=icons";
  }
  else if (this.latlon !== null && this.latlon != "")
  {
   var lat = parseFloat(this.latlon.substr(0, this.latlon.indexOf(",")));
   var lon = parseFloat(this.latlon.substr(this.latlon.indexOf(",") + 1));
   weatherURL =  "https://graphical.weather.gov/xml/sample_products/browser_interface/ndfdXMLclient.php" +
                   "?lat=" + lat +
                   "&lon=" + lon +
                   "&product=time-series&begin=" + beginUT + "&end=" + endUT +
                   "&Unit=" + this.unittype +
                   "&mint=mint" +
                   "&maxt=maxt" +
                   "&temp=temp" +
                   "&appt=appt" +
                   "&wx=wx" +
                   "&dew=dew" +
                   "&rh=rh" +
                   "&wspd=wspd" +
                   "&wdir=wdir" +
                   "&sky=sky" +
                   "&snow=snow" +
                   "&wwa=wwa" +
                   "&iceaccum=iceaccum" +
                   "&icons=icons";
  }
  else
  {
   window.openDialog("chrome://ndfdweather/content/weatherOptions.xul", "weatherOptions", "chrome,modal");
   return;
  }
  var weatherRequest = new XMLHttpRequest();
  weatherRequest.overrideMimeType("text/xml");
  this.debug(weatherURL);
  weatherRequest.open("GET", weatherURL, true);
  weatherRequest.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
  weatherRequest.setRequestHeader("Pragma", "no-cache");
  weatherRequest.setRequestHeader("Cache-Control", "no-cache");
  weatherRequest.onload = function parse()
  {
   if (weatherWatcher.myTimeout != null)
   {
    clearTimeout(weatherWatcher.myTimeout);
    weatherWatcher.myTimeout = null;
   }
   if (weatherWatcher.sunTimeout != null)
   {
    clearTimeout(weatherWatcher.sunTimeout);
    weatherWatcher.sunTimeout = null;
   }
   var return_data = new Array();
   try
   {
    var passXML = weatherRequest.responseXML;
    if (passXML == undefined || passXML.documentElement.tagName == "parsererror")
    {
     weatherWatcher.current_weather = "Error";
     weatherWatcher.displayWeather();
     return true;
    }
    var passTagLOC    = passXML.getElementsByTagName("location")[0];
    var passTagTimes  = passXML.getElementsByTagName("time-layout");
    var passTagParams = passXML.getElementsByTagName("parameters")[0].children;
    var timeData = new Object();
    for(var i = 0; i < passTagTimes.length; i++)
    {
     var key = passTagTimes[i].children[0].textContent;
     var timeRanges = [];
     var lStart = "";
     for(var j = 0; j < passTagTimes[i].children.length; j++)
     {
      if (passTagTimes[i].children[j].tagName == "start-valid-time")
      {
       if (lStart == "")
       {
        lStart = passTagTimes[i].children[j].textContent;
       }
       else
       {
        timeRanges.push(lStart);
        lStart = passTagTimes[i].children[j].textContent;
       }
      }
      if (passTagTimes[i].children[j].tagName == "end-valid-time")
      {
       timeRanges.push(lStart + " - " + passTagTimes[i].children[j].textContent);
       lStart = "";
      }
     }
     if (lStart != "")
     {
      timeRanges.push(lStart);
     }
     timeData[key] = timeRanges;
    }
    var maxTemps = new Object();
    var minTemps = new Object();
    var lstTemps = new Object();
    var lstFeelT = new Object();
    var lstDewPt = new Object();
    var lstWndSp = new Object();
    var lstWndDr = new Object();
    var lstCloud = new Object();
    var lstIce   = new Object();
    var lstSnow  = new Object();
    var lstHumid = new Object();
    var lstCond  = new Object();
    var lstIcons = new Object();
    var lstWarns = new Object();
    for(var i = 0; i < passTagParams.length; i++)
    {
     var paramName = passTagParams[i].getElementsByTagName("name")[0].textContent;
     if (paramName == "Daily Maximum Temperature")
     {
      var unit = passTagParams[i].getAttribute("units");
      if (unit == "Fahrenheit")
       unit = weatherWatcher.locale.GetStringFromName("unit.fahrenheit");
      if (unit == "Celsius")
       unit = weatherWatcher.locale.GetStringFromName("unit.celsius");
      var time = passTagParams[i].getAttribute("time-layout");
      var values = passTagParams[i].getElementsByTagName("value");
      for(var j = 0; j < values.length; j++)
      {
       maxTemps[timeData[time][j]] = weatherWatcher.locale.GetStringFromName("unit.display").replace("%1", values[j].textContent).replace("%2", unit);
      }
     }
     if (paramName == "Daily Minimum Temperature")
     {
      var unit = passTagParams[i].getAttribute("units");
      if (unit == "Fahrenheit")
       unit = weatherWatcher.locale.GetStringFromName("unit.fahrenheit");
      if (unit == "Celsius")
       unit = weatherWatcher.locale.GetStringFromName("unit.celsius");
      var time = passTagParams[i].getAttribute("time-layout");
      var values = passTagParams[i].getElementsByTagName("value");
      for(var j = 0; j < values.length; j++)
      {
       minTemps[timeData[time][j]] = weatherWatcher.locale.GetStringFromName("unit.display").replace("%1", values[j].textContent).replace("%2", unit);
      }
     }
     if (paramName == "Temperature")
     {
      var unit = passTagParams[i].getAttribute("units");
      if (unit == "Fahrenheit")
       unit = weatherWatcher.locale.GetStringFromName("unit.fahrenheit");
      if (unit == "Celsius")
       unit = weatherWatcher.locale.GetStringFromName("unit.celsius");
      var time = passTagParams[i].getAttribute("time-layout");
      var values = passTagParams[i].getElementsByTagName("value");
      for(var j = 0; j < values.length; j++)
      {
       lstTemps[timeData[time][j]] = weatherWatcher.locale.GetStringFromName("unit.display").replace("%1", values[j].textContent).replace("%2", unit);
      }
     }
     if (paramName == "Dew Point Temperature")
     {
      var unit = passTagParams[i].getAttribute("units");
      if (unit == "Fahrenheit")
       unit = weatherWatcher.locale.GetStringFromName("unit.fahrenheit");
      if (unit == "Celsius")
       unit = weatherWatcher.locale.GetStringFromName("unit.celsius");
      var time = passTagParams[i].getAttribute("time-layout");
      var values = passTagParams[i].getElementsByTagName("value");
      for(var j = 0; j < values.length; j++)
      {
       lstDewPt[timeData[time][j]] = weatherWatcher.locale.GetStringFromName("unit.display").replace("%1", values[j].textContent).replace("%2", unit);
      }
     }
     if (paramName == "Wind Speed")
     {
      var unit = passTagParams[i].getAttribute("units");
      if (unit == "knots")
       unit = weatherWatcher.locale.GetStringFromName("unit.miles");
      if (unit == "meters/second")
       unit = weatherWatcher.locale.GetStringFromName("unit.meters");
      var time = passTagParams[i].getAttribute("time-layout");
      var values = passTagParams[i].getElementsByTagName("value");
      for(var j = 0; j < values.length; j++)
      {
       var spVal = values[j].textContent;
       if (unit == weatherWatcher.locale.GetStringFromName("unit.miles"))
        spVal = (spVal * 1.15).toFixed(1);
       lstWndSp[timeData[time][j]] = spVal + " " + unit;
      }
     }
     if (paramName == "Wind Direction")
     {
      var unit = passTagParams[i].getAttribute("units");
      var time = passTagParams[i].getAttribute("time-layout");
      var values = passTagParams[i].getElementsByTagName("value");
      for(var j = 0; j < values.length; j++)
      {
       if (unit == "degrees true")
       {
        var cardArr = ["N","NNE","NE","ENE","E","ESE", "SE", "SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
        var cardVal = Math.round(values[j].textContent / 22.5 + 0.5);
        lstWndDr[timeData[time][j]] = cardArr[cardVal % 16];
       }
       else
        lstWndDr[timeData[time][j]] = values[j].textContent + " " + unit;
      }
     }
     if (paramName == "Cloud Cover Amount")
     {
      var time = passTagParams[i].getAttribute("time-layout");
      var values = passTagParams[i].getElementsByTagName("value");
      for(var j = 0; j < values.length; j++)
      {
       lstCloud[timeData[time][j]] = values[j].textContent + "%" ;
      }
     }
     if (paramName == "Apparent Temperature")
     {
      var unit = passTagParams[i].getAttribute("units");
      if (unit == "Fahrenheit")
       unit = weatherWatcher.locale.GetStringFromName("unit.fahrenheit");
      if (unit == "Celsius")
       unit = weatherWatcher.locale.GetStringFromName("unit.celsius");
      var time = passTagParams[i].getAttribute("time-layout");
      var values = passTagParams[i].getElementsByTagName("value");
      for(var j = 0; j < values.length; j++)
      {
       lstFeelT[timeData[time][j]] = weatherWatcher.locale.GetStringFromName("unit.display").replace("%1", values[j].textContent).replace("%2", unit);
      }
     }
     if (paramName == "Ice Accumulation")
     {
      var unit = passTagParams[i].getAttribute("units");
      var time = passTagParams[i].getAttribute("time-layout");
      var values = passTagParams[i].getElementsByTagName("value");
      for(var j = 0; j < values.length; j++)
      {
       if (values[j].textContent == "")
        lstIce[timeData[time][j]] = weatherWatcher.locale.GetStringFromName("generic.none");
       else
        lstIce[timeData[time][j]] = values[j].textContent + " " + unit;
      }
     }
     if (paramName == "Snow Amount")
     {
      var unit = passTagParams[i].getAttribute("units");
      var time = passTagParams[i].getAttribute("time-layout");
      var values = passTagParams[i].getElementsByTagName("value");
      for(var j = 0; j < values.length; j++)
      {
       if (values[j].textContent == "0.00")
        lstSnow[timeData[time][j]] = weatherWatcher.locale.GetStringFromName("generic.none");
       else
        lstSnow[timeData[time][j]] = values[j].textContent + " " + unit;
      }
     }
     if (paramName == "Relative Humidity")
     {
      var time = passTagParams[i].getAttribute("time-layout");
      var values = passTagParams[i].getElementsByTagName("value");
      for(var j = 0; j < values.length; j++)
      {
       lstHumid[timeData[time][j]] = values[j].textContent + "%";
      }
     }
     if (paramName == "Weather Type, Coverage, and Intensity")
     {
      var time = passTagParams[i].getAttribute("time-layout");
      var conditions = passTagParams[i].getElementsByTagName("weather-conditions");
      for(var j = 0; j < conditions.length; j++)
      {
       if (conditions[j].children.length == 0)
       {
        lstCond[timeData[time][j]] = weatherWatcher.locale.GetStringFromName("generic.none");
       }
       else
       {
        var sConditions = "";
        for (var k = 0; k < conditions[j].children.length; k++)
        {
         var wType = conditions[j].children[k].getAttribute("weather-type");
         var wIntensity = conditions[j].children[k].getAttribute("intensity");
         var wCover = conditions[j].children[k].getAttribute("coverage");
         var wQual  = conditions[j].children[k].getAttribute("qualifier");
         var wVis   = conditions[j].children[k].children[0].textContent;
         if (wVis == undefined || wVis == "")
          wVis = "none";
         else
         {
          wVis = conditions[j].children[k].children[0].textContent + " " + conditions[j].children[k].children[0].getAttribute("units");
         }
         var sCond  = weatherWatcher.locale.GetStringFromName("generic.none");
         var sCondL = "generic.none";
         if (wQual == "none")
         {
          if (wIntensity == "none")
          {
           if (wVis == "none")
            sCondL = "conditions.cover+type";
           else
            sCondL = "conditions.cover+type+vis";
          }
          else
          {
           if (wVis == "none")
            sCondL = "conditions.cover+int+type";
           else
            sCondL = "conditions.cover+int+type+vis";
          }
         }
         else
         {
          if (wIntensity == "none")
          {
           if (wVis == "none")
            sCondL = "conditions.qual+cover+type";
           else
            sCondL = "conditions.qual+cover+type+vis";
          }
          else
          {
           if (wVis == "none")
            sCondL = "conditions.qual+int+cover+type";
           else
            sCondL = "conditions.qual+int+cover+type+vis";
          }
         }
									if (wCover.toLowerCase().indexOf("chance") > -1 || wCover.toLowerCase().indexOf("areas") > -1)
										sCondL = sCondL + "-chance";
         sCond  = weatherWatcher.locale.GetStringFromName(sCondL).replace("%1", wType).replace("%2", wCover).replace("%3", wVis).replace("%4", wIntensity).replace("%5", wQual);
         if (sConditions == "")
         {
          sConditions = sCond;
         }
         else
         {
          sConditions = sConditions + ", " + sCond;
         }
        }
        lstCond[timeData[time][j]] = sConditions;
       }
      }
     }
     if (paramName == "Watches, Warnings, and Advisories")
     {
      var time = passTagParams[i].getAttribute("time-layout");
      var hazards = passTagParams[i].getElementsByTagName("hazard-conditions");
      for(var j = 0; j < hazards.length; j++)
      {
       if (hazards[j].children.length == 0)
        lstWarns[timeData[time][j]] = weatherWatcher.locale.GetStringFromName("generic.none");
       else
       {
        lstWarns[timeData[time][j]] = hazards[j].textContent;
        var sWarns = "";
        for (var k = 0; k < hazards[j].children.length; k++)
        {
         var wType = hazards[j].children[k].getAttribute("phenomena");
         var wIntensity = hazards[j].children[k].getAttribute("significance");
         var sCond  = weatherWatcher.locale.GetStringFromName("generic.none");
         if (wIntensity == "none")
          sCond = wType;
         else
          sCond = wType +  " " + wIntensity;
         if (sWarns == "")
         {
          sWarns = sCond;
         }
         else
         {
          sWarns = sWarns + ", " + sCond;
         }
        }
        lstWarns[timeData[time][j]] = sWarns;
       }
      }
     }
     if (paramName == "Conditions Icons")
     {
      var time = passTagParams[i].getAttribute("time-layout");
      var values = passTagParams[i].getElementsByTagName("icon-link");
      for(var j = 0; j < values.length; j++)
      {
       lstIcons[timeData[time][j]] = values[j].textContent;
      }
     }
    }
    var upTime = new Date(passXML.getElementsByTagName("creation-date")[0].textContent);
    return_data["LastUpdated"]   = upTime.toLocaleString().replace(/(\d{1,2}:\d{2})(:\d{2})( [APap][Mm])?$/, "$1$3");
    return_data["Location"]      = passTagLOC.getElementsByTagName("point")[0].getAttribute("latitude") + ", " + passTagLOC.getElementsByTagName("point")[0].getAttribute("longitude");
    return_data["IconPath"]      = lstIcons[Object.keys(lstIcons)[0]];
    return_data["Temperature"]   = lstTemps[Object.keys(lstTemps)[0]];
    return_data["FeelsLike"]     = lstFeelT[Object.keys(lstFeelT)[0]];
    return_data["DewPoint"]      = lstDewPt[Object.keys(lstDewPt)[0]];
    return_data["Humidity"]      = lstHumid[Object.keys(lstHumid)[0]];
    return_data["Wind"]          = weatherWatcher.locale.GetStringFromName("wind.dirandspeed").replace("%1", lstWndDr[Object.keys(lstWndDr)[0]]).replace("%2", lstWndSp[Object.keys(lstWndSp)[0]]);
    return_data["CloudCover"]    = lstCloud[Object.keys(lstCloud)[0]];
    if (Object.keys(lstSnow).length == 0)
     return_data["Snow"]         = weatherWatcher.locale.GetStringFromName("generic.none");
    else
     return_data["Snow"]         = lstSnow[Object.keys(lstSnow)[0]];
    if (Object.keys(lstIce).length == 0)
     return_data["Ice"]          = weatherWatcher.locale.GetStringFromName("generic.none");
    else
     return_data["Ice"]          = lstIce[Object.keys(lstIce)[0]];
    if (Object.keys(lstCond).length == 0)
     return_data["Forecast"]     = weatherWatcher.locale.GetStringFromName("generic.none");
    else
     return_data["Forecast"]     = lstCond[Object.keys(lstCond)[0]];
    if (Object.keys(lstWarns).length == 0)
     return_data["Warnings"]     = weatherWatcher.locale.GetStringFromName("generic.none");
    else
     return_data["Warnings"]     = lstWarns[Object.keys(lstWarns)[0]];
    for (var d = 1; d <= 6; d++)
    {
     var dayData      = new Object();
					dayData["Day"]   = new Object();
					dayData["Night"] = new Object();
     var dayD         = new Date();
     dayD.setHours(12);
     dayD.setMinutes(0);
     dayD.setSeconds(0);
     dayD.setMilliseconds(0);
     dayD.setDate(dayD.getDate() + (d - 1));
     var thisDay = dayD.valueOf();
     var thisNight = thisDay + (1000 * 60 * 60 * 11);
     if (d == 1)
     {
      dayD = new Date();
      if (dayD.getHours() > 20)
      {
       thisDay = 0;
       thisNight = Date.parse(Object.keys(lstIcons)[1]);
      }
      else if (dayD.getHours() > 18)
      {
       thisDay = 0;
       thisNight = Date.parse(Object.keys(lstIcons)[2]);
      }
      else if (dayD.getHours() > 11)
      {
       thisDay = Date.parse(Object.keys(lstIcons)[1]);
       dayD = new Date(thisDay);
       if (dayD.getHours() > 16)
        thisDay = Date.parse(Object.keys(lstIcons)[0]);
      }
     }
					//minTemps
     //dayData["min"] = weatherWatcher.locale.GetStringFromName("generic.unknown");
     for (var i = 0; i < Object.keys(minTemps).length; i++)
     {
      var dRange = Object.keys(minTemps)[i];
      var sFrom  = new Date(dRange.substring(0, dRange.indexOf(" - ")));
      sFrom.setHours(0);
      sFrom.setMinutes(0);
      sFrom.setSeconds(0);
      sFrom.setMilliseconds(0);
      var dFrom  = sFrom.valueOf();
      sFrom.setHours(23);
      sFrom.setMinutes(59);
      sFrom.setSeconds(59);
      sFrom.setMilliseconds(999);
      var dTo    = sFrom.valueOf();
      if (thisDay >= dFrom && thisDay <= dTo)
      {
       dayData["min"] = minTemps[dRange].substring(0, minTemps[dRange].indexOf("\u00b0"));
       break;
      }
     }
					//maxTemps
     //dayData["max"] = weatherWatcher.locale.GetStringFromName("generic.unknown");
     for (var i = 0; i < Object.keys(maxTemps).length; i++)
     {
      var dRange = Object.keys(maxTemps)[i];
      var sFrom  = new Date(dRange.substring(0, dRange.indexOf(" - ")));
      sFrom.setHours(0);
      sFrom.setMinutes(0);
      sFrom.setSeconds(0);
      sFrom.setMilliseconds(0);
      var dFrom  = sFrom.valueOf();
      sFrom.setHours(23);
      sFrom.setMinutes(59);
      sFrom.setSeconds(59);
      sFrom.setMilliseconds(999);
      var dTo    = sFrom.valueOf();
      if (thisDay >= dFrom && thisDay <= dTo)
      {
       dayData["max"] = maxTemps[dRange].substring(0, maxTemps[dRange].indexOf("\u00b0"));
       break;
      }
     }
					//lstTemps
     dayData["Day"]["Temperature"] = weatherWatcher.locale.GetStringFromName("generic.unknown");
     for (var i = 0; i < Object.keys(lstTemps).length; i++)
     {
      var dIdx = Object.keys(lstTemps)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisDay >= dTime && thisDay <= dMax)
      {
					 	dayData["Day"]["Temperature"] = lstTemps[dIdx];
       break;
      }
     }
     dayData["Night"]["Temperature"] = weatherWatcher.locale.GetStringFromName("generic.unknown");
     for (var i = 0; i < Object.keys(lstTemps).length; i++)
     {
      var dIdx = Object.keys(lstTemps)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisNight >= dTime && thisNight <= dMax)
      {
       dayData["Night"]["Temperature"] = lstTemps[dIdx];
       break;
      }
     }
					//lstFeelT
     dayData["Day"]["FeelsLike"] = weatherWatcher.locale.GetStringFromName("generic.unknown");
     for (var i = 0; i < Object.keys(lstFeelT).length; i++)
     {
      var dIdx = Object.keys(lstFeelT)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisDay >= dTime && thisDay <= dMax)
      {
       dayData["Day"]["FeelsLike"] = lstFeelT[dIdx];
       break;
      }
     }
     dayData["Night"]["FeelsLike"] = weatherWatcher.locale.GetStringFromName("generic.unknown");
     for (var i = 0; i < Object.keys(lstFeelT).length; i++)
     {
      var dIdx = Object.keys(lstFeelT)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisNight >= dTime && thisNight <= dMax)
      {
       dayData["Night"]["FeelsLike"] = lstFeelT[dIdx];
       break;
      }
     }
					//lstDewPt
     dayData["Day"]["DewPoint"] = weatherWatcher.locale.GetStringFromName("generic.unknown");
     for (var i = 0; i < Object.keys(lstDewPt).length; i++)
     {
      var dIdx = Object.keys(lstDewPt)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisDay >= dTime && thisDay <= dMax)
      {
       dayData["Day"]["DewPoint"] = lstDewPt[dIdx];
       break;
      }
     }
     dayData["Night"]["DewPoint"] = weatherWatcher.locale.GetStringFromName("generic.unknown");
     for (var i = 0; i < Object.keys(lstDewPt).length; i++)
     {
      var dIdx = Object.keys(lstDewPt)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisNight >= dTime && thisNight <= dMax)
      {
       dayData["Night"]["DewPoint"] = lstDewPt[dIdx];
       break;
      }
     }
					//lstHumid
     dayData["Day"]["Humidity"] = weatherWatcher.locale.GetStringFromName("generic.unknown");
     for (var i = 0; i < Object.keys(lstHumid).length; i++)
     {
      var dIdx = Object.keys(lstHumid)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisDay >= dTime && thisDay <= dMax)
      {
       dayData["Day"]["Humidity"] = lstHumid[dIdx];
       break;
      }
     }
     dayData["Night"]["Humidity"] = weatherWatcher.locale.GetStringFromName("generic.unknown");
     for (var i = 0; i < Object.keys(lstHumid).length; i++)
     {
      var dIdx = Object.keys(lstHumid)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisNight >= dTime && thisNight <= dMax)
      {
       dayData["Night"]["Humidity"] = lstHumid[dIdx];
       break;
      }
     }
					//lstWndDr
     dayData["Day"]["Wind"] = weatherWatcher.locale.GetStringFromName("generic.unknown");
     for (var i = 0; i < Object.keys(lstWndDr).length; i++)
     {
      var dIdx = Object.keys(lstWndDr)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisDay >= dTime && thisDay <= dMax)
      {
       dayData["Day"]["Wind"] = weatherWatcher.locale.GetStringFromName("wind.dirandspeed").replace("%1", lstWndDr[dIdx]).replace("%2", lstWndSp[dIdx]);
       break;
      }
     }
     dayData["Night"]["Wind"] = weatherWatcher.locale.GetStringFromName("generic.unknown");
     for (var i = 0; i < Object.keys(lstWndDr).length; i++)
     {
      var dIdx = Object.keys(lstWndDr)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisNight >= dTime && thisNight <= dMax)
      {
       dayData["Night"]["Wind"] = weatherWatcher.locale.GetStringFromName("wind.dirandspeed").replace("%1", lstWndDr[dIdx]).replace("%2", lstWndSp[dIdx]);
       break;
      }
     }
					//lstCloud
     dayData["Day"]["CloudCover"] = weatherWatcher.locale.GetStringFromName("generic.unknown");
     for (var i = 0; i < Object.keys(lstCloud).length; i++)
     {
      var dIdx = Object.keys(lstCloud)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisDay >= dTime && thisDay <= dMax)
      {
       dayData["Day"]["CloudCover"] = lstCloud[dIdx];
       break;
      }
     }
     dayData["Night"]["CloudCover"] = weatherWatcher.locale.GetStringFromName("generic.unknown");
     for (var i = 0; i < Object.keys(lstCloud).length; i++)
     {
      var dIdx = Object.keys(lstCloud)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisNight >= dTime && thisNight <= dMax)
      {
       dayData["Night"]["CloudCover"] = lstCloud[dIdx];
       break;
      }
     }
					//lstSnow
					dayData["Day"]["Snow"] = weatherWatcher.locale.GetStringFromName("generic.none");
     for (var i = 0; i < Object.keys(lstSnow).length; i++)
     {
      var dIdx = Object.keys(lstSnow)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisDay >= dTime && thisDay <= dMax)
      {
       dayData["Day"]["Snow"] = lstSnow[dIdx];
       break;
      }
     }
					dayData["Night"]["Snow"] = weatherWatcher.locale.GetStringFromName("generic.none");
     for (var i = 0; i < Object.keys(lstSnow).length; i++)
     {
      var dIdx = Object.keys(lstSnow)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisNight >= dTime && thisNight <= dMax)
      {
       dayData["Night"]["Snow"] = lstSnow[dIdx];
       break;
      }
     }
					//lstIce
					dayData["Day"]["Ice"] = weatherWatcher.locale.GetStringFromName("generic.none");
     for (var i = 0; i < Object.keys(lstIce).length; i++)
     {
      var dIdx = Object.keys(lstIce)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisDay >= dTime && thisDay <= dMax)
      {
       dayData["Day"]["Ice"] = lstIce[dIdx];
       break;
      }
     }
					dayData["Night"]["Ice"] = weatherWatcher.locale.GetStringFromName("generic.none");
     for (var i = 0; i < Object.keys(lstIce).length; i++)
     {
      var dIdx = Object.keys(lstIce)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisNight >= dTime && thisNight <= dMax)
      {
       dayData["Night"]["Ice"] = lstIce[dIdx];
       break;
      }
     }
					//lstCond
					dayData["Day"]["Forecast"] = weatherWatcher.locale.GetStringFromName("generic.none");
     for (var i = 0; i < Object.keys(lstCond).length; i++)
     {
      var dIdx = Object.keys(lstCond)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisDay >= dTime && thisDay <= dMax)
      {
       dayData["Day"]["Forecast"] = lstCond[dIdx];
       break;
      }
     }
					dayData["Night"]["Forecast"] = weatherWatcher.locale.GetStringFromName("generic.none");
     for (var i = 0; i < Object.keys(lstCond).length; i++)
     {
      var dIdx = Object.keys(lstCond)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisNight >= dTime && thisNight <= dMax)
      {
       dayData["Night"]["Forecast"] = lstCond[dIdx];
       break;
      }
     }
					//lstWarns
					dayData["Day"]["Warnings"] = weatherWatcher.locale.GetStringFromName("generic.none");
     for (var i = 0; i < Object.keys(lstWarns).length; i++)
     {
      var dIdx = Object.keys(lstWarns)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisDay >= dTime && thisDay <= dMax)
      {
       dayData["Day"]["Warnings"] = lstWarns[dIdx];
       break;
      }
     }
					dayData["Night"]["Warnings"] = weatherWatcher.locale.GetStringFromName("generic.none");
     for (var i = 0; i < Object.keys(lstWarns).length; i++)
     {
      var dIdx = Object.keys(lstWarns)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisNight >= dTime && thisNight <= dMax)
      {
       dayData["Night"]["Warnings"] = lstWarns[dIdx];
       break;
      }
     }
					//lstIcons
     //dayData["Day"]["IconPath"] = "chrome://ndfdweather/skin/na.png";
     for (var i = 0; i < Object.keys(lstIcons).length; i++)
     {
      var dIdx = Object.keys(lstIcons)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisDay >= dTime && thisDay <= dMax)
      {
       dayData["Day"]["IconPath"] = lstIcons[dIdx];
       break;
      }
     }
     //dayData["Night"]["IconPath"] = "chrome://ndfdweather/skin/na.png";
     for (var i = 0; i < Object.keys(lstIcons).length; i++)
     {
      var dIdx = Object.keys(lstIcons)[i];
      var dTime = Date.parse(dIdx);
      var dMax = dTime + (1000 * 60 * 60 * 24) - 1;
      if (i < Object.keys(lstTemps).length - 1)
      {
       var dNdx = Object.keys(lstTemps)[i + 1];
       dMax = Date.parse(dNdx) - 1;
      }
      if (thisNight >= dTime && thisNight <= dMax)
      {
       dayData["Night"]["IconPath"] = lstIcons[dIdx];
       break;
      }
     }
     return_data["forecast" + d] = dayData;
    }
   }
   catch (ex)
   {
    weatherWatcher.debug(ex);
    weatherWatcher.current_weather = "Error";
    weatherWatcher.displayWeather();
    return true;
   }
   weatherWatcher.current_weather = return_data;
   if (weatherWatcher.sunandmoon)
   {
    weatherWatcher.displayWeather();
    weatherWatcher.getSun();
   }
   else
   {
    weatherWatcher.current_sun = null;
    weatherWatcher.displayWeather();
   }
   return true;
  }
  document.getElementById("weatherMailDeck").selectedIndex = "1";
  if (document.getElementById("weatherCalDeck"))
   document.getElementById("weatherCalDeck").selectedIndex = "1";
  try
  {
   if (this.myTimeout != null)
   {
    clearTimeout(this.myTimeout);
    this.myTimeout = null;
   }
   this.myTimeout = setTimeout("weatherWatcher.current_weather = 'Error'; weatherWatcher.displayWeather();", 7500);
   weatherRequest.send(null);
  }
  catch (ex)
  {
   weatherWatcher.debug(ex);
   weatherWatcher.current_weather = "Error";
   weatherWatcher.displayWeather();
  }
 },
 displayWeather: function()
 {
  if (this.myTimeout != null)
  {
   clearTimeout(this.myTimeout);
   this.myTimeout = null;
  }
  weatherWatcher.refreshPrefs();
  if (this.refresh)
  {
   if (this.refreshTimer != null)
   {
    clearTimeout(this.refreshTimer);
    this.refreshTimer = null;
   }
   this.refreshTimer = setTimeout(weatherWatcher.initiateWeather, this.interval * 60 * 1000);
  }
  if (this.statusbarVis)
   document.getElementById("weatherStatusPanel").style.display = "-moz-box";
  else
   document.getElementById("weatherStatusPanel").style.display = "none";
  if (weatherWatcher.current_weather == "Error")
  {
   document.getElementById("displayMailWeather-IconError").setAttribute("class", "displayWeather-Icon-" + this.iconsize);
   if (document.getElementById("displayCalWeather-IconError"))
    document.getElementById("displayCalWeather-IconError").setAttribute("class", "displayWeather-Icon-" + this.iconsize);
   document.getElementById("displayMailWeather-IconError").setAttribute("src", "chrome://ndfdweather/skin/na.png");
   if (document.getElementById("displayCalWeather-IconError"))
    document.getElementById("displayCalWeather-IconError").setAttribute("src", "chrome://ndfdweather/skin/na.png");
   document.getElementById("weatherMailDeck").selectedIndex = "2";
   if (document.getElementById("weatherCalDeck"))
    document.getElementById("weatherCalDeck").selectedIndex = "2";
   return true;
  }
  else
  {
   document.getElementById("displayMailWeather-IconError").setAttribute("class", "displayWeather-Icon-small");
   if (document.getElementById("displayCalWeather-IconError"))
    document.getElementById("displayCalWeather-IconError").setAttribute("class", "displayWeather-Icon-small");
   document.getElementById("displayMailWeather-IconError").setAttribute("src", "about:blank");
   if (document.getElementById("displayCalWeather-IconError"))
    document.getElementById("displayCalWeather-IconError").setAttribute("src", "about:blank");
  }
  document.getElementById("displayMailWeather-Icon").setAttribute("class", "displayWeather-Icon-" + this.iconsize);
  if (document.getElementById("displayCalWeather-Icon"))
   document.getElementById("displayCalWeather-Icon").setAttribute("class", "displayWeather-Icon-" + this.iconsize);
  document.getElementById("displayMailWeather-Icon").setAttribute("src", weatherWatcher.current_weather["IconPath"]);
  if (document.getElementById("displayCalWeather-Icon"))
   document.getElementById("displayCalWeather-Icon").setAttribute("src", weatherWatcher.current_weather["IconPath"]);
  document.getElementById("displayMailWeather-Temperature").setAttribute("value", weatherWatcher.current_weather["Temperature"]);
  if (document.getElementById("displayCalWeather-Temperature"))
   document.getElementById("displayCalWeather-Temperature").setAttribute("value", weatherWatcher.current_weather["Temperature"]);
  document.getElementById("displayMailWeather-Temperature").setAttribute("class", "displayWeather-Temperature-" + this.textsize);
  if (document.getElementById("displayCalWeather-Temperature"))
   document.getElementById("displayCalWeather-Temperature").setAttribute("class", "displayWeather-Temperature-" + this.textsize);
  document.getElementById("displayMailWeather-Location").setAttribute("value", weatherWatcher.current_weather["Location"]);
  if (document.getElementById("displayCalWeather-Location"))
   document.getElementById("displayCalWeather-Location").setAttribute("value", weatherWatcher.current_weather["Location"]);
  document.getElementById("displayMailWeather-Location").setAttribute("class", "displayWeather-Location-" + this.textsize);
  if (document.getElementById("displayCalWeather-Location"))
   document.getElementById("displayCalWeather-Location").setAttribute("class", "displayWeather-Location-" + this.textsize);
  if (weatherWatcher.current_weather["Snow"] === weatherWatcher.locale.GetStringFromName("generic.none"))
   document.getElementById("weatherMoreData-SnowBox").style.display = "none";
  else
   document.getElementById("weatherMoreData-SnowBox").style.display = "-moz-grid-line";
  if (weatherWatcher.current_weather["Ice"] === weatherWatcher.locale.GetStringFromName("generic.none"))
   document.getElementById("weatherMoreData-IceBox").style.display = "none";
  else
   document.getElementById("weatherMoreData-IceBox").style.display = "-moz-grid-line";
  if (weatherWatcher.current_weather["Warnings"] === weatherWatcher.locale.GetStringFromName("generic.none"))
   document.getElementById("weatherMoreData-WarningBox").style.display = "none";
  else
   document.getElementById("weatherMoreData-WarningBox").style.display = "-moz-grid-line";
  for (var value in weatherWatcher.current_weather)
  {
   if (document.getElementById("weatherMoreData-" + value) == null)
    continue;
   document.getElementById("weatherMoreData-" + value).setAttribute("value", weatherWatcher.current_weather[value]);
  }
  if(this.forecastdays > 6)
   this.forecastdays = 6;
  if (this.forecastdays < 2)
   this.forecastdays = 2;
  for (var i = 1; i <= this.forecastdays; ++i)
  {
   var forecastHi        = weatherWatcher.current_weather["forecast" + i]["max"];
   var forecastLow       = weatherWatcher.current_weather["forecast" + i]["min"];
   var forecastDay       = weatherWatcher.current_weather["forecast" + i]["Day"];
   var forecastNight     = weatherWatcher.current_weather["forecast" + i]["Night"];
   if (i == 1)
   {
    if (forecastDay["IconPath"] != undefined)
     document.getElementById("displayWeather-ForecastTinyIcon" + i + "day").setAttribute("src", forecastDay["IconPath"]);
    else
     document.getElementById("displayWeather-ForecastTinyIcon" + i + "day").setAttribute("src", "about:blank");
    if (forecastNight["IconPath"] != undefined)
     document.getElementById("displayWeather-ForecastTinyIcon" + i + "night").setAttribute("src", forecastNight["IconPath"]);
    else
     document.getElementById("displayWeather-ForecastTinyIcon" + i + "night").setAttribute("src", "about:blank");
    if (forecastHi != undefined && forecastLow != undefined)
     document.getElementById("displayWeather-ForecastTinyTemperature" + i).setAttribute("value", forecastHi + "\u00b0 / " + forecastLow + "\u00b0");
    else if (forecastHi != undefined)
     document.getElementById("displayWeather-ForecastTinyTemperature" + i).setAttribute("value", forecastHi + "\u00b0");
    else if (forecastLow != undefined)
     document.getElementById("displayWeather-ForecastTinyTemperature" + i).setAttribute("value", forecastLow + "\u00b0");
    else
     document.getElementById("displayWeather-ForecastTinyTemperature" + i).setAttribute("value", "");
   }
   var forecastDayURL = "about:blank";
   var forecastDayDisplay = "none";
   var forecastDayToolTip = "";
   if (forecastDay["IconPath"] != undefined && forecastDay["Temperature"] != undefined)
   {
    forecastDayURL = forecastDay["IconPath"];
    forecastDayDisplay = "-moz-box";
    forecastDayToolTip = "weatherForeData";
   }
   document.getElementById("displayMailWeather-ForecastIcon" + i + "day").setAttribute("rawData", JSON.stringify(forecastDay));
   document.getElementById("displayMailWeather-ForecastIcon" + i + "day").setAttribute("src", forecastDayURL);
   document.getElementById("displayMailWeather-ForecastIcon" + i + "day").setAttribute("tooltip", forecastDayToolTip);
   document.getElementById("displayMailWeather-ForecastIcon" + i + "day").style.display = forecastDayDisplay;
   if (document.getElementById("displayCalWeather-ForecastIcon" + i + "day"))
   {
    document.getElementById("displayCalWeather-ForecastIcon" + i + "day").setAttribute("rawData", JSON.stringify(forecastDay));
    document.getElementById("displayCalWeather-ForecastIcon" + i + "day").setAttribute("src", forecastDayURL);
    document.getElementById("displayCalWeather-ForecastIcon" + i + "day").setAttribute("tooltip", forecastDayToolTip);
    document.getElementById("displayCalWeather-ForecastIcon" + i + "day").style.display = forecastDayDisplay;
   }

   var forecastNightURL = "about:blank";
   var forecastNightDisplay = "none";
   var forecastNightToolTip = "";
   if (forecastNight["IconPath"] != undefined && forecastNight["Temperature"] != undefined)
   {
    forecastNightURL = forecastNight["IconPath"];
    forecastNightDisplay = "-moz-box";
    forecastNightToolTip = "weatherForeData";
   }
   document.getElementById("displayMailWeather-ForecastIcon" + i + "night").setAttribute("rawData", JSON.stringify(forecastNight));
   document.getElementById("displayMailWeather-ForecastIcon" + i + "night").setAttribute("src", forecastNightURL);
   document.getElementById("displayMailWeather-ForecastIcon" + i + "night").setAttribute("tooltip", forecastNightToolTip);
   document.getElementById("displayMailWeather-ForecastIcon" + i + "night").style.display = forecastNightDisplay;
   if (document.getElementById("displayCalWeather-ForecastIcon" + i + "night"))
   {
    document.getElementById("displayCalWeather-ForecastIcon" + i + "night").setAttribute("rawData", JSON.stringify(forecastNight));
    document.getElementById("displayCalWeather-ForecastIcon" + i + "night").setAttribute("src", forecastNightURL);
    document.getElementById("displayCalWeather-ForecastIcon" + i + "night").setAttribute("tooltip", forecastNightToolTip);
    document.getElementById("displayCalWeather-ForecastIcon" + i + "night").style.display = forecastNightDisplay;
   }

   var weekdays  = new Array(weatherWatcher.locale.GetStringFromName("week.sun"), weatherWatcher.locale.GetStringFromName("week.mon"), weatherWatcher.locale.GetStringFromName("week.tue"), weatherWatcher.locale.GetStringFromName("week.wed"), weatherWatcher.locale.GetStringFromName("week.thu"), weatherWatcher.locale.GetStringFromName("week.fri"), weatherWatcher.locale.GetStringFromName("week.sat"));
   var forecastTemp        = "";
   var forecastTempToolTip = "";
   var forecastTempDisplay = "none";
   var forecastLoc         = "";
   var forecastLocDisplay  = "none";
   if (forecastHi == undefined && forecastLow == undefined)
   {
    if (forecastDay["IconPath"] == undefined && forecastNight["IconPath"] == undefined)
    {
     forecastTemp  = "";
     forecastTempToolTip = "";
     forecastTempDisplay = "none";
     forecastLoc   = "";
     forecastLocDisplay  = "none";
    }
    else
    {
     forecastTemp  = "";
     forecastTempToolTip = "";
     forecastTempDisplay = "none";
     var dayOfWeek = (new Date()).getDay() + (i - 1);
     forecastLoc   = weekdays[dayOfWeek % 7];
     forecastLocDisplay  = "-moz-box";
    }
   }
   else if (forecastLow == undefined)
   {
    forecastTemp   = forecastHi;
    forecastTempToolTip = weatherWatcher.locale.GetStringFromName("forecast.expected.high");
    forecastTempDisplay  = "-moz-box";
    var dayOfWeek = (new Date()).getDay() + (i - 1);
    forecastLoc   = weekdays[dayOfWeek % 7];
    forecastLocDisplay  = "-moz-box";
   }
   else if (forecastHi == undefined)
   {
    forecastTemp  = forecastLow;
    forecastTempToolTip = weatherWatcher.locale.GetStringFromName("forecast.expected.low");
    forecastTempDisplay  = "-moz-box";
    var dayOfWeek = (new Date()).getDay() + (i - 1);
    forecastLoc   = weekdays[dayOfWeek % 7];
    forecastLocDisplay  = "-moz-box";
   }
   else
   {
    forecastTemp  = forecastHi + " / " + forecastLow;
    forecastTempToolTip = weatherWatcher.locale.GetStringFromName("forecast.expected");
    forecastTempDisplay  = "-moz-box";
    var dayOfWeek = (new Date()).getDay() + (i - 1);
    forecastLoc   = weekdays[dayOfWeek % 7];
    forecastLocDisplay  = "-moz-box";
   }
   
   document.getElementById("displayMailWeather-ForecastTemperature" + i).setAttribute("value", forecastTemp);
   document.getElementById("displayMailWeather-ForecastTemperature" + i).setAttribute("tooltiptext", forecastTempToolTip);
   document.getElementById("displayMailWeather-ForecastTemperature" + i).style.display = forecastTempDisplay;
   if (document.getElementById("displayCalWeather-ForecastTemperature" + i))
   {
    document.getElementById("displayCalWeather-ForecastTemperature" + i).setAttribute("value", forecastTemp);
    document.getElementById("displayCalWeather-ForecastTemperature" + i).setAttribute("tooltiptext", forecastTempToolTip);
    document.getElementById("displayCalWeather-ForecastTemperature" + i).style.display = forecastTempDisplay;
   }
   document.getElementById("displayMailWeather-ForecastLocation" + i).setAttribute("value", forecastLoc);
   document.getElementById("displayMailWeather-ForecastLocation" + i).style.display = forecastLocDisplay;
   if (document.getElementById("displayCalWeather-ForecastLocation" + i))
   {
    document.getElementById("displayCalWeather-ForecastLocation" + i).setAttribute("value", forecastLoc);
    document.getElementById("displayCalWeather-ForecastLocation" + i).style.display = forecastLocDisplay;
   }
  }
  if (this.forecastdays < 6)
  {
   for (var i = this.forecastdays + 1; i <= 6; i++)
   {
    document.getElementById("displayMailWeather-ForecastIcon" + i + "day").setAttribute("rawData", "");
    document.getElementById("displayMailWeather-ForecastIcon" + i + "day").setAttribute("src", "about:blank");
    document.getElementById("displayMailWeather-ForecastIcon" + i + "day").setAttribute("tooltip", "");
    document.getElementById("displayMailWeather-ForecastIcon" + i + "day").style.display = "none";
    if (document.getElementById("displayCalWeather-ForecastIcon" + i + "day"))
    {
     document.getElementById("displayCalWeather-ForecastIcon" + i + "day").setAttribute("rawData", "");
     document.getElementById("displayCalWeather-ForecastIcon" + i + "day").setAttribute("src", "about:blank");
     document.getElementById("displayCalWeather-ForecastIcon" + i + "day").setAttribute("tooltip", "");
     document.getElementById("displayCalWeather-ForecastIcon" + i + "day").style.display = "none";
    }
    document.getElementById("displayMailWeather-ForecastIcon" + i + "night").setAttribute("rawData", "");
    document.getElementById("displayMailWeather-ForecastIcon" + i + "night").setAttribute("src", "about:blank");
    document.getElementById("displayMailWeather-ForecastIcon" + i + "night").setAttribute("tooltip", "");
    document.getElementById("displayMailWeather-ForecastIcon" + i + "night").style.display = "none";
    if (document.getElementById("displayCalWeather-ForecastIcon" + i + "night"))
    {
     document.getElementById("displayCalWeather-ForecastIcon" + i + "night").setAttribute("rawData", "");
     document.getElementById("displayCalWeather-ForecastIcon" + i + "night").setAttribute("src", "about:blank");
     document.getElementById("displayCalWeather-ForecastIcon" + i + "night").setAttribute("tooltip", "");
     document.getElementById("displayCalWeather-ForecastIcon" + i + "night").style.display = "none";
    }
    document.getElementById("displayMailWeather-ForecastTemperature" + i).setAttribute("value", "");
    document.getElementById("displayMailWeather-ForecastTemperature" + i).setAttribute("tooltip", "");
    document.getElementById("displayMailWeather-ForecastTemperature" + i).style.display = "none";
    if (document.getElementById("displayCalWeather-ForecastTemperature" + i))
    {
     document.getElementById("displayCalWeather-ForecastTemperature" + i).setAttribute("value", "");
     document.getElementById("displayCalWeather-ForecastTemperature" + i).setAttribute("tooltip", "");
     document.getElementById("displayCalWeather-ForecastTemperature" + i).style.display = "none";
    }
    document.getElementById("displayMailWeather-ForecastLocation" + i).setAttribute("value", "");
    document.getElementById("displayMailWeather-ForecastLocation" + i).style.display = "none";
    if (document.getElementById("displayCalWeather-ForecastLocation" + i))
    {
     document.getElementById("displayCalWeather-ForecastLocation" + i).setAttribute("value", "");
     document.getElementById("displayCalWeather-ForecastLocation" + i).style.display = "none";
    }
   }
  }
  
  if (document.getElementById("weatherMailPaneSelector").label == document.getElementById("weatherMailPaneMenu3").label)
  {
   document.getElementById("weatherMailInfo").setAttribute("collapsed", "true");
   if (document.getElementById("weatherCalInfo"))
    document.getElementById("weatherCalInfo").setAttribute("collapsed", "true");
   document.getElementById("weatherMailForecast").setAttribute("collapsed", "false");
   if (document.getElementById("weatherCalForecast"))
    document.getElementById("weatherCalForecast").setAttribute("collapsed", "false");
   document.getElementById("weatherMailDeck").selectedIndex = "3";
   if (document.getElementById("weatherCalDeck"))
    document.getElementById("weatherCalDeck").selectedIndex = "3";
  }
  else
  {
   document.getElementById("weatherMailInfo").setAttribute("collapsed", "false");
   if (document.getElementById("weatherCalInfo"))
    document.getElementById("weatherCalInfo").setAttribute("collapsed", "false");
   document.getElementById("weatherMailForecast").setAttribute("collapsed", "true");
   if (document.getElementById("weatherCalForecast"))
    document.getElementById("weatherCalForecast").setAttribute("collapsed", "true");
   document.getElementById("weatherMailDeck").selectedIndex = "0"
   if (document.getElementById("weatherCalDeck"))
    document.getElementById("weatherCalDeck").selectedIndex = "0";
  }
  
  if (weatherWatcher.current_sun == null)
  {
   document.getElementById("weatherMoreData-Sunrise").setAttribute("value", weatherWatcher.locale.GetStringFromName("generic.loading"));
   document.getElementById("weatherMoreData-Sunset").setAttribute("value", weatherWatcher.locale.GetStringFromName("generic.loading"));
   document.getElementById("weatherMoreData-Moonrise").setAttribute("value", weatherWatcher.locale.GetStringFromName("generic.loading"));
   document.getElementById("weatherMoreData-Moonset").setAttribute("value", weatherWatcher.locale.GetStringFromName("generic.loading"));
   document.getElementById("weatherMoreData-MoonPhase").setAttribute("value", weatherWatcher.locale.GetStringFromName("generic.loading"));
   var elBoxes = document.getElementsByClassName("weatherMoreData-SunAndMoonBox");
   for (var i = 0; i < elBoxes.length; i++)
   {
    elBoxes[i].style.display = "none";
   }
   return true;
  }
  var elBoxes = document.getElementsByClassName("weatherMoreData-SunAndMoonBox");
  for (var i = 0; i < elBoxes.length; i++)
  {
   elBoxes[i].style.display = "-moz-grid-line";
  }
  if (weatherWatcher.current_sun == "Error")
  {
   document.getElementById("weatherMoreData-Sunrise").setAttribute("value", weatherWatcher.locale.GetStringFromName("generic.unknown"));
   document.getElementById("weatherMoreData-Sunset").setAttribute("value", weatherWatcher.locale.GetStringFromName("generic.unknown"));
   document.getElementById("weatherMoreData-Moonrise").setAttribute("value", weatherWatcher.locale.GetStringFromName("generic.unknown"));
   document.getElementById("weatherMoreData-Moonset").setAttribute("value", weatherWatcher.locale.GetStringFromName("generic.unknown"));
   document.getElementById("weatherMoreData-MoonPhase").setAttribute("value", weatherWatcher.locale.GetStringFromName("generic.unknown"));
   return true;
  }
  for (var value in weatherWatcher.current_sun)
  {
   if (value == "MoonPhase")
   {
    if (document.getElementById("weatherMoreData-MoonPhase") != null)
    {
     document.getElementById("weatherMoreData-MoonPhase").setAttribute("value", weatherWatcher.current_sun[value]);
     if (weatherWatcher.current_sun["MoonVis"] === weatherWatcher.locale.GetStringFromName("generic.unknown"))
      document.getElementById("weatherMoreData-MoonIllum").setAttribute("value", "");
     else
      document.getElementById("weatherMoreData-MoonIllum").setAttribute("value", weatherWatcher.current_sun["MoonVis"] + " Illuminated");
    }
   }
   else
   {
    if (document.getElementById("weatherMoreData-" + value) != null)
     document.getElementById("weatherMoreData-" + value).setAttribute("value", weatherWatcher.current_sun[value]);
   }
  }
  return true;
 },
 initiateWeather: function()
 {
  if (this.myTimeout != null)
  {
   clearTimeout(this.myTimeout);
   this.myTimeout = null;
  }
  if (this.sunTimeout != null)
  {
   clearTimeout(this.sunTimeout);
   this.sunTimeout = null;
  }
  if ((weatherWatcher.weather_prefs.getCharPref("zipcode") == "" && weatherWatcher.weather_prefs.getCharPref("latlon") == "") || weatherWatcher.weather_prefs.getIntPref("interval") < 30)
  {
   window.openDialog("chrome://ndfdweather/content/weatherOptions.xul", "weatherOptions", "chrome,modal");
  }
  else
  {
   weatherWatcher.getWeather();
  }
 },
 getSun: function()
 {
  if (weatherWatcher.current_weather == undefined || weatherWatcher.current_weather == "Error")
   return;
  weatherWatcher.refreshPrefs();
  var nowT    = new Date();
  var sunRequest = new XMLHttpRequest();
  sunRequest.overrideMimeType("application/json");
  var nowTZ   = -1 * (nowT.getTimezoneOffset() / 60);
  var nowDate = (nowT.getMonth() + 1) + "/" + nowT.getDate() + "/" + nowT.getFullYear();
  var coords  = weatherWatcher.current_weather["Location"].replace(", ", ",");
  var sunURL  = "http://api.usno.navy.mil/rstt/oneday" +
                "?date=" + nowDate +
                "&coords=" + coords +
                "&tz=" + nowTZ;
  this.debug(sunURL);
  sunRequest.open("GET", sunURL, true);
  sunRequest.responseType = "JSON";
  sunRequest.setRequestHeader("Content-Type", "application/json; charset=utf-8");
  sunRequest.setRequestHeader("Pragma", "no-cache");
  sunRequest.setRequestHeader("Cache-Control", "no-cache");
  sunRequest.onload = function parse()
  {
   if (weatherWatcher.sunTimeout != null)
   {
    clearTimeout(weatherWatcher.sunTimeout);
    weatherWatcher.sunTimeout = null;
   }
   var return_data = new Array();
   try
   {
    var passJSON = JSON.parse(sunRequest.responseText);
    if (passJSON.error == true)
    {
     weatherWatcher.debug(passJSON.type);
     weatherWatcher.current_sun = "Error";
     weatherWatcher.displayWeather();
     return true;
    }
    var sunRise   = weatherWatcher.locale.GetStringFromName("generic.unknown");
    var sunSet    = weatherWatcher.locale.GetStringFromName("generic.unknown");
    var moonRise  = weatherWatcher.locale.GetStringFromName("generic.unknown");
    var moonSet   = weatherWatcher.locale.GetStringFromName("generic.unknown");
    var moonPhase = weatherWatcher.locale.GetStringFromName("generic.unknown");
    var moonVis   = weatherWatcher.locale.GetStringFromName("generic.unknown");
    if (passJSON.curphase != undefined && passJSON.curphase != "")
     moonPhase = passJSON.curphase;
    else if(passJSON.closestphase != undefined && passJSON.closestphase.phase != undefined && passJSON.closestphase.phase != "")
    {
     if (passJSON.closestphase.time != undefined && passJSON.closestphase.time != "")
					{
				  var moonTime = weatherWatcher.milToTime(passJSON.closestphase.time);
						if (passJSON.closestphase.date != undefined && passJSON.closestphase.date != "")
						{
							var moonDate = new Date(passJSON.closestphase.date);
							var todayDate = new Date();
							var yesterdayDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - 1);
							var tomorrowDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() + 1);
						 var moonData = moonDate + " " + moonTime;
							if (moonDate.getFullYear() == todayDate.getFullYear() && moonDate.getMonth() == todayDate.getMonth() && moonDate.getDate() == todayDate.getDate())
							{
								moonData = moonTime;
							}
							else if (moonDate.getFullYear() == yesterdayDate.getFullYear() && moonDate.getMonth() == yesterdayDate.getMonth() && moonDate.getDate() == yesterdayDate.getDate())
							{
								moonData = weatherWatcher.locale.GetStringFromName("sunandmoon.data.previous").replace("%1", moonTime);
							}
							else if (moonDate.getFullYear() == tomorrowDate.getFullYear() && moonDate.getMonth() == tomorrowDate.getMonth() && moonDate.getDate() == tomorrowDate.getDate())
							{
								moonData = weatherWatcher.locale.GetStringFromName("sunandmoon.data.next").replace("%1", moonTime);
							}
							moonPhase = weatherWatcher.locale.GetStringFromName("moon.phase.forecast").replace("%1", passJSON.closestphase.phase).replace("%2", moonData);
						}
						else
							moonPhase = weatherWatcher.locale.GetStringFromName("moon.phase.forecast").replace("%1", passJSON.closestphase.phase).replace("%2", moonTime);
					}
     else
      moonPhase = passJSON.closestphase.phase;
    }
    if (passJSON.fracillum != undefined && passJSON.fracillum != "")
     moonVis = passJSON.fracillum;
    for(var i = 0; i < passJSON.sundata.length; i++)
    {
     var phenomenon = passJSON.sundata[i].phen;
     if (phenomenon == "R")
      sunRise = weatherWatcher.milToTime(passJSON.sundata[i].time);
     if (phenomenon == "S")
      sunSet = weatherWatcher.milToTime(passJSON.sundata[i].time);
    }
				if (passJSON.nextsundata != undefined)
				{
					for(var i = 0; i < passJSON.nextsundata.length; i++)
					{
						var phenomenon = passJSON.nextsundata[i].phen;
						if (sunRise == weatherWatcher.locale.GetStringFromName("generic.unknown") && phenomenon == "R")
							sunRise = weatherWatcher.locale.GetStringFromName("sunandmoon.data.next").replace("%1", weatherWatcher.milToTime(passJSON.nextsundata[i].time));
						if (sunSet == weatherWatcher.locale.GetStringFromName("generic.unknown") && phenomenon == "S")
							sunSet = weatherWatcher.locale.GetStringFromName("sunandmoon.data.next").replace("%1", weatherWatcher.milToTime(passJSON.nextsundata[i].time));
					}
				}
				if (passJSON.prevsundata != undefined)
				{
					for(var i = 0; i < passJSON.prevsundata.length; i++)
					{
						var phenomenon = passJSON.prevsundata[i].phen;
						if (sunRise == weatherWatcher.locale.GetStringFromName("generic.unknown") && phenomenon == "R")
							sunRise = weatherWatcher.locale.GetStringFromName("sunandmoon.data.previous").replace("%1", weatherWatcher.milToTime(passJSON.prevsundata[i].time));
						if (sunSet == weatherWatcher.locale.GetStringFromName("generic.unknown") && phenomenon == "S")
							sunSet = weatherWatcher.locale.GetStringFromName("sunandmoon.data.previous").replace("%1", weatherWatcher.milToTime(passJSON.prevsundata[i].time));
					}
				}
    for(var i = 0; i < passJSON.moondata.length; i++)
    {
     var phenomenon = passJSON.moondata[i].phen;
     if (phenomenon == "R")
      moonRise = weatherWatcher.milToTime(passJSON.moondata[i].time);
     if (phenomenon == "S")
      moonSet = weatherWatcher.milToTime(passJSON.moondata[i].time);
    }
				if (passJSON.nextmoondata != undefined)
				{
					for(var i = 0; i < passJSON.nextmoondata.length; i++)
					{
						var phenomenon = passJSON.nextmoondata[i].phen;
						if (moonRise == weatherWatcher.locale.GetStringFromName("generic.unknown") && phenomenon == "R")
							moonRise = weatherWatcher.locale.GetStringFromName("sunandmoon.data.next").replace("%1", weatherWatcher.milToTime(passJSON.nextmoondata[i].time));
						if (moonSet == weatherWatcher.locale.GetStringFromName("generic.unknown") && phenomenon == "S")
							moonSet = weatherWatcher.locale.GetStringFromName("sunandmoon.data.next").replace("%1", weatherWatcher.milToTime(passJSON.nextmoondata[i].time));
					}
				}
				if (passJSON.prevmoondata != undefined)
				{
					for(var i = 0; i < passJSON.prevmoondata.length; i++)
					{
						var phenomenon = passJSON.prevmoondata[i].phen;
						if (moonRise == weatherWatcher.locale.GetStringFromName("generic.unknown") && phenomenon == "R")
							moonRise = weatherWatcher.locale.GetStringFromName("sunandmoon.data.previous").replace("%1", weatherWatcher.milToTime(passJSON.prevmoondata[i].time));
						if (moonSet == weatherWatcher.locale.GetStringFromName("generic.unknown") && phenomenon == "S")
							moonSet = weatherWatcher.locale.GetStringFromName("sunandmoon.data.previous").replace("%1", weatherWatcher.milToTime(passJSON.prevmoondata[i].time));
					}
				}

    return_data["Sunrise"]   = sunRise;
    return_data["Sunset"]    = sunSet;
    return_data["Moonrise"]  = moonRise;
    return_data["Moonset"]   = moonSet;
    return_data["MoonPhase"] = moonPhase;
    return_data["MoonVis"]   = moonVis;
   }
   catch (ex)
   {
    weatherWatcher.debug(ex)
    weatherWatcher.current_sun = "Error"
    weatherWatcher.displayWeather();
    return true;
   }
   weatherWatcher.current_sun = return_data
   weatherWatcher.displayWeather();
   return true;
  }
  document.getElementById("weatherMailDeck").selectedIndex = "1";
  if (document.getElementById("weatherCalDeck"))
   document.getElementById("weatherCalDeck").selectedIndex = "1";
  try
  {
   if (this.sunTimeout != null)
   {
    clearTimeout(this.sunTimeout);
    this.sunTimeout = null;
   }
   this.sunTimeout = setTimeout("weatherWatcher.current_sun = 'Error'; weatherWatcher.displayWeather();", 7500);
   sunRequest.send(null);
  }
  catch (ex)
  {
   weatherWatcher.debug(ex)
   weatherWatcher.current_sun = "Error"
   weatherWatcher.displayWeather();
  }
 },
	foreData: function(forecastIcon)
	{
		var forecast = JSON.parse(forecastIcon.getAttribute("rawData"));
		if (forecast["Snow"] === weatherWatcher.locale.GetStringFromName("generic.none"))
   document.getElementById("weatherForeData-SnowBox").style.display = "none";
  else
   document.getElementById("weatherForeData-SnowBox").style.display = "-moz-grid-line";
  if (forecast["Ice"] === weatherWatcher.locale.GetStringFromName("generic.none"))
   document.getElementById("weatherForeData-IceBox").style.display = "none";
  else
   document.getElementById("weatherForeData-IceBox").style.display = "-moz-grid-line";
  if (forecast["Warnings"] === weatherWatcher.locale.GetStringFromName("generic.none"))
   document.getElementById("weatherForeData-WarningBox").style.display = "none";
  else
   document.getElementById("weatherForeData-WarningBox").style.display = "-moz-grid-line";
  for (var value in forecast)
  {
   if (document.getElementById("weatherForeData-" + value) != null)
    document.getElementById("weatherForeData-" + value).setAttribute("value", forecast[value]);
  }
	},
 milToTime: function(time)
 {
  var tm = time.split(":");
  var hr = Number(tm[0]);
  if (hr > 12)
  {
   return (hr - 12) + ":" + tm[1] + " PM";
  }
  else if (hr == 12)
  {
   return "12:" + tm[1] + " PM";
  }
  else if (hr == 0)
  {
   return "12:" + tm[1] + " AM";
  }
  else
  {
   return hr + ":" + tm[1] + " AM";
  }
 },
 refreshPrefs: function()
 {
  this.zipcode = weatherWatcher.weather_prefs.getCharPref("zipcode");
  this.latlon = weatherWatcher.weather_prefs.getCharPref("latlon");
  this.refresh = weatherWatcher.weather_prefs.getBoolPref("refresh");
  this.interval = weatherWatcher.weather_prefs.getIntPref("interval");
  this.forecastdays = weatherWatcher.weather_prefs.getIntPref("forecastdays");
  this.iconsize = weatherWatcher.weather_prefs.getCharPref("iconsize");
  this.textsize = weatherWatcher.weather_prefs.getCharPref("textsize");
  this.unittype = weatherWatcher.weather_prefs.getCharPref("unittype");
  this.sunandmoon = weatherWatcher.weather_prefs.getBoolPref("sunandmoon");
  this.statusbarVis = weatherWatcher.weather_prefs.getBoolPref("statusbar");
 },
 weatherPaneSelector: function(container, value)
 {
  if (value == "O" || value == "R")
   return;
  if (document.getElementById("weather" + container + "Deck").selectedIndex == "1" || document.getElementById("weather" + container + "Deck").selectedIndex == "2")
  {
   document.getElementById("weather" + container + "Info").setAttribute("collapsed", "true");
   document.getElementById("weather" + container + "Forecast").setAttribute("collapsed", "true");
   return;
  }
  if (value == "3")
  {
   document.getElementById("weather" + container + "PaneSelector").label = document.getElementById("weather" + container + "PaneMenu3").label;
   document.getElementById("weather" + container + "Deck").selectedIndex = "3";
   document.getElementById("weather" + container + "Info").setAttribute("collapsed", "true");
   document.getElementById("weather" + container + "Forecast").setAttribute("collapsed", "false");
  }
  else
  {
   document.getElementById("weather" + container + "PaneSelector").label = document.getElementById("weather" + container + "PaneMenu0").label;
   document.getElementById("weather" + container + "Deck").selectedIndex = "0";
   document.getElementById("weather" + container + "Info").setAttribute("collapsed", "false");
   document.getElementById("weather" + container + "Forecast").setAttribute("collapsed", "true");
  }
 },
 debug: function()
 {
  var mConsoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService)
  mConsoleService.logStringMessage("NDFD Weather: " + Array.join(arguments, ": ") + "\n");
 }
}

window.addEventListener("load", function() { weatherWatcher.register(); } , false);
window.addEventListener("unload", function() { weatherWatcher.unregister(); } , false);

window.addEventListener("load", function() { setTimeout(weatherWatcher.initiateWeather, 500)}, false);
