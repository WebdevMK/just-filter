'use strict';

chrome.storage.local.get(['isJustEatExtensionOn'], function(result) {

	var isJustEatExtensionOn = 'true';

	if( typeof result['isJustEatExtensionOn'] != 'undefined'){
		isJustEatExtensionOn = result['isJustEatExtensionOn'];
	} else {
		chrome.storage.local.set({'isJustEatExtensionOn': 'true'}, function() {});
	}	

	let turnOnButton = document.getElementById('turnOn');
	let turnOffButton = document.getElementById('turnOff');

	if( isJustEatExtensionOn === 'true' && !turnOnButton.parentNode.classList.contains('is-on') ){
		turnOnButton.parentNode.className += ' is-on';
	}

	turnOnButton.onclick = function(element) {
	  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

	    chrome.storage.local.set({'isJustEatExtensionOn': 'true'}, function() {
			turnOnButton.parentNode.className += ' is-on';
		});
	    // refresh the tab and turn the extension on
	    chrome.tabs.reload();

	  });
	};

	turnOffButton.onclick = function(element) {
	  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

	    chrome.storage.local.set({'isJustEatExtensionOn': 'false'}, function() {
			turnOnButton.parentNode.className = turnOnButton.parentNode.className.replace('is-on', '');
		});
	    // refresh the page and turn the extension off
	    chrome.tabs.reload();

	  });
	};	
});

