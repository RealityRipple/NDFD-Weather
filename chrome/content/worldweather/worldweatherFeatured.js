var xmlDoc;

function displayWorldWeatherFeatured(passValues) {

	var i;
	
	for (i=0; i < passValues[0].length; i++) {
		
		document.getElementById("link" + i).href = passValues[0][i] + "&par=1005339582";
		document.getElementById("link" + i).firstChild.nodeValue = passValues[1][i];
	}
	
	for (j=i; j < 8; j++) {
		document.getElementById("link" + j).removeChild(document.getElementById("link" + j).firstChild);
		document.getElementById("link" + j).parentNode.removeChild(document.getElementById("link" + j));
		document.getElementById("desc" + j).parentNode.removeChild(document.getElementById("desc" + j));
	}	
	
	window.sizeToContent();
}

// Function called every time location is searched
function initiateWorldWeatherFeatured() {

	displayWorldWeatherFeatured(window.arguments[0]);

}
