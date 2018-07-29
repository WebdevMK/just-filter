(function(){

	// base restaurants data on data pushed to dataLayer by GTM script
	// wait for the data to be passed on, then send it in an event to Extension's content script 
	var waitForRestaurantsData = setInterval(function(){
		
		if( typeof window.dataLayer != 'undefined' ){

			var _dataLayer = window.dataLayer;

			for( var i=0; i < _dataLayer.length; i++ ){

				if( typeof _dataLayer[i]["serpData"] != 'undefined' && typeof _dataLayer[i]["serpData"]["results"] != 'undefined' ){
					clearInterval(waitForRestaurantsData);
					clearTimeout(terminateWaitingForRestaurantsData);

					// get original array of data and change it to obj with keys made of TRs Ids
					var _data = _dataLayer[i]["serpData"]["results"].slice();
					var _data_obj = {};
					for( var j=0; j < _data.length; j++ ){
						_data_obj[ _data[j]["trId"] ] = _data[j];
					}

					// pass data to extension script
				    document.dispatchEvent(new CustomEvent('JustExtention_sendDataToMainScript', {
				        detail: _data_obj
				    }));
				}
			}
		}
		
	}, 30);

	// wait max. 4s, then abort
	var terminateWaitingForRestaurantsData = setTimeout(function(){
		clearInterval(waitForRestaurantsData);
	}, 4000);

})();