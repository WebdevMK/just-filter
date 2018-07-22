'use strict';

chrome.storage.local.get(['isJustEatExtensionOn'], function(result) {

	var isJustEatExtensionOn = 'true';

	if( typeof result['isJustEatExtensionOn'] != 'undefined'){
		isJustEatExtensionOn = result['isJustEatExtensionOn'];
	} else {
		chrome.storage.local.set({'isJustEatExtensionOn': 'true'}, function() {});
	}	

/*	let turnOnButton = document.getElementById('turnOn');
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
	};*/

	let extensiontSwitchEl = document.querySelector('.filters-switch-main');

	if( isJustEatExtensionOn === 'true' && !extensiontSwitchEl.classList.contains('is-active') ){
		extensiontSwitchEl.className += ' is-active';
	}

	extensiontSwitchEl.onclick = function(element) {
		console.log("--- click: ", extensiontSwitchEl.classList.contains('is-disabled') );

		if( !extensiontSwitchEl.classList.contains('is-disabled') ){

			extensiontSwitchEl.className += ' is-disabled';
			console.log("--- extensiontSwitchEl.className:", extensiontSwitchEl.className );

			if( extensiontSwitchEl.classList.contains('is-active') ){

			  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

			    chrome.storage.local.set({'isJustEatExtensionOn': 'false'}, function() {
					extensiontSwitchEl.className = extensiontSwitchEl.className.replace('is-active', '');
				});
			    // refresh the page and turn the extension off
			    chrome.tabs.reload();

			    setTimeout(function(){
			    	extensiontSwitchEl.className = extensiontSwitchEl.className.replace('is-disabled', '');
			    }, 3000);

			  });

			} else {

			  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

			    chrome.storage.local.set({'isJustEatExtensionOn': 'true'}, function() {
					extensiontSwitchEl.className += ' is-active';
				});
			    // refresh the tab and turn the extension on
			    chrome.tabs.reload();

			    setTimeout(function(){
			    	extensiontSwitchEl.className = extensiontSwitchEl.className.replace('is-disabled', '');
			    }, 3000);

			  });

			}
		}
	};
});

