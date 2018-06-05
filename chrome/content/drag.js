// Status bar drag and drop functionality based off of example code from
// http://kb.mozillazine.org/Dev_:_Extensions_:_Example_Code_:_Adding_Drag_and_Drop_to_Statusbarpanel
//

const gWeather_flavour = "ndfdweather/statusbarpanel";        
const gWeather_statusbarPanel = "weatherStatusPanel"; 
const gWeather_statusbar = "status-bar";

const weather_statObserver = {
  init: function () {
    var statusbarPanel = document.getElementById(gWeather_statusbarPanel);
    var insertbefore = statusbarPanel.getAttribute("insertbefore");
    var insertafter = statusbarPanel.getAttribute("insertafter");

    // if insertbefore or insertafter attributes are set obey the settings and
    // place our statusbar panel before or after the specified panel
    if (insertbefore) {
      document.getElementById(gWeather_statusbar).
               insertBefore(statusbarPanel,
                            document.getElementById(statusbarPanel.getAttribute("insertbefore")));
    }
    else if (insertafter) {
      var prev = document.getElementById(statusbarPanel.getAttribute("insertafter"));
      if (prev) prev = prev.nextSibling;
      if (prev) 
        document.getElementById(gWeather_statusbar).insertBefore(statusbarPanel, prev);
      else
        document.getElementById(gWeather_statusbar).appendChild(statusbarPanel);
    }
  },

  getSupportedFlavours: function () {
    var flavours = new FlavourSet();
    flavours.appendFlavour(gWeather_flavour); 
    return flavours;
  },

  // when user begins to drag, make sure every statusbarpanel has an id and
  // set up the event handlers for the drag and drop
  //
  onDragStart: function (evt,transferData,action) {
    var elme = evt.target;
    while(elme.id != gWeather_statusbarPanel) {
      elme =elme.parentNode;
    }
    var txt=elme.getAttribute("id");
    transferData.data=new TransferData();
    transferData.data.addDataForFlavour(gWeather_flavour,txt);
    var status = document.getElementById(gWeather_statusbarPanel);
    var statusbar = document.getElementById(gWeather_statusbar);
    statusbar.setAttribute("weatherDrag", true);
    var child = statusbar.firstChild;
    var x = 0;
    while (child) {
      if (child != status) {
        // make sure every panel has an id and make that id persistent.  For some reason
        // the persist attribute isn't sticking.  I'm not sure why but this could cause problems.
        if (!child.id) {
          var newId = "statusbarpanel-noID"+x;
          while (document.getElementById(newId)) newId += "x"+x;
          child.id = newId;
          child.setAttribute("persist", new String("id" + (child.persist ? " "+child.persist : "")) );
          x++;
        }
        child.addEventListener("dragover", function(event) { nsDragAndDrop.dragOver(event,weather_statObserver); }, false);
        child.addEventListener("dragdrop", function(event) { nsDragAndDrop.drop(event,weather_statObserver); }, false);
      }
      child = child.nextSibling;
    }
    // this will restore status bar to previous state if user does not drop on status bar
    window.addEventListener("dragexit", function(event) { nsDragAndDrop.dragExit(event,weather_statObserver); }, true);
  },

  
  // clean up when release mouse without dropping on statusbar
  //
  onDragExit: function(evt, session) { 
    var elm = session.sourceNode;
    while(elm.parentNode.nodeName.toLowerCase() != "statusbar") {
      elm = elm.parentNode;
    }
    if (elm == document.getElementById(gWeather_statusbarPanel)) this.scheduleCleanup();
  },

  // highlite the spot where the drop will occur
  //
  onDragOver: function (evt,flavour,session) {
    var elm = evt.target;
    while(elm.parentNode.nodeName.toLowerCase() != "statusbar") {
      elm = elm.parentNode;
    }

    // remove indicator from previous and next siblings 
    var prev = (elm.previousSibling != session.sourceNode) ? elm.previousSibling : elm.previousSibling.previousSibling;
    var next = (elm.nextSibling!= session.sourceNode) ? elm.nextSibling : elm.nextSibling.nextSibling;
    if (prev) prev.removeAttribute("weatherDrag");
    if (next) next.removeAttribute("weatherDrag");

    // this will display a little line where the drop will occur
    var midPointCoord = elm.boxObject.x + (elm.boxObject.width/2);      // the offset + midpoint
    midPointCoord += !elm.previousSibling ? (elm.boxObject.width/4) :   // + additional quarter-coverage for left-most panel
                     (!elm.nextSibling ? (-elm.boxObject.width/4) : 0); // - less quarter-coverage for right-most panel
    if (evt.clientX < midPointCoord)
      elm.setAttribute("weatherDrag", "left");
    else
      elm.setAttribute("weatherDrag", "right");
  },

  // move the icon to the dropped location and save the location for future sessions
  //
  onDrop: function (evt,dropdata,session) {
    if (dropdata.data!="") {

      var droppedPanel = document.getElementById(dropdata.data);
      var parent = droppedPanel.parentNode;
      var prev = evt.target;
      while (prev.nodeName.toLowerCase() != "statusbarpanel") {
        prev = prev.parentNode;
      }

      // this allows user to drop before or after the object under the mouse pointer depending on 
      // where the actual drop occurs.
      var midPointCoord = prev.boxObject.x + (prev.boxObject.width/2); // the offset + midpoint
      midPointCoord += !prev.previousSibling ? (prev.boxObject.width/4) : // + additional quarter-coverage for left-most panel
                       (!prev.nextSibling ? (-prev.boxObject.width/4) : 0); // - less quarter-coverage for right-most panel
      if (evt.clientX < midPointCoord)
        prev = prev.previousSibling;
      var next = (!prev) ? parent.firstChild : (prev.nextSibling != droppedPanel) ? 
                                                prev.nextSibling : prev.nextSibling.nextSibling;
  
      // store the insertbefore or insertafter attribute.  Our overlay is set up so 
      // that both these attributes will persist between browser sessions.
      if (prev) {
        droppedPanel.removeAttribute("insertbefore");
        droppedPanel.setAttribute("insertafter",""+prev.getAttribute("id"));
      }
      else if (next) {
        droppedPanel.removeAttribute("insertafter");
        droppedPanel.setAttribute("insertbefore",""+next.getAttribute("id"));
      }

      // do the actual move
      try {
        parent.removeChild(droppedPanel);

        if (next) 
          parent.insertBefore(droppedPanel,next);
        else
          parent.appendChild(droppedPanel);
      } catch(ex) {
        parent.appendChild(droppedPanel);
      }
      this.cleanUp();
    }
  },

  // calling cleanUp directly fires immediately so use this to get around that
  //
  scheduleCleanup: function(evt) {
    clearTimeout(window.weatherDragCleanup);
    window.weatherDragCleanup = setTimeout('weather_statObserver.cleanUp();',700);
  },

  // restore the statusbar to its normal state
  //
  cleanUp: function() {
    clearTimeout(window.weatherDragCleanup);

    var statusbar = document.getElementById(gWeather_statusbar);
    var statusbarPanel = document.getElementById(gWeather_statusbarPanel);
    statusbar.removeAttribute("weatherDrag");

    // remove the event handlers
    var child = statusbar.firstChild;
    var x = 0;
    while (child) {
      if (child != statusbarPanel) {
        child.removeAttribute("weatherDrag");
        child.removeEventListener("dragover", function(event) { nsDragAndDrop.dragOver(event,weather_statObserver); }, false);
        child.removeEventListener("dragdrop", function(event) { nsDragAndDrop.drop(event,weather_statObserver); }, false);
      }
      child = child.nextSibling;
    }
    window.removeEventListener("dragexit", function(event) { nsDragAndDrop.dragExit(event,weather_statObserver); }, true);
  }
};

// its go time
window.addEventListener('load', weather_statObserver.init, false);
