/* ================= NOTES 
- post codes examples: SW1A 1AA, SW7 5BD, EC3A 8BF, E14 5AB, W14 8UX
- in DOM, closed restaurants don't have restaurant IDs;
=========================== */

var JustFilterPlugin = (function(){

	// VARIABLES
	var serpTRList_data,
		TRtoShow = [],
		TRtoHide = [],
		css = '<style>.clearfix:after { content: ""; display: table; clear: both; } .just-filter-hide-based-on-cuisine, .just-filter-hide-based-on-minorder, .just-filter-hide-based-on-freedelivery, .just-filter-hide-based-on-rating, .just-filter-hide-based-on-promotion { display: none; } #just-filter { position: fixed; top: 0; left: 0; width: 100%; background-color: #fff; border-bottom: 4px solid #fa0029; padding: 10px 0; } #just-filter .just-filter-wrapper { width: 100%; max-width: 940px; margin: 0 auto; } #just-filter .headline { font-size: 20px; font-family: "Ubuntu"; color: #333; font-weight: 500; } #just-filter ul { list-style: none; } #just-filter li { float: left; font-size: 18px; color: #000; cursor: pointer; padding: 5px 5px; margin: 0 15px; } #just-filter li:hover, #just-filter li:active { color: #E37222; } #just-filter li.active { color: #266abd; font-weight: bold; } #just-filter li.active:hover, #just-filter li.active:active { color: #266abd; } </style>',
		html = '<div id="just-filter"> <div class="just-filter-wrapper"> <p class="headline">Filters:</p> <ul class="clearfix"> <li data-just-filter-type="open">Open</li> <li data-just-filter-type="minorder">Minimum Order 0-10&pound;</li> <li data-just-filter-type="freedelivery">Free Delivery</li> <li data-just-filter-type="rating">Rating min. 4/6</li> <li data-just-filter-type="promotion">Promotion</li> </ul> </div> </div>';

	var init = function(){

		// CSS styles
		$('body').append( css );

		// add the filters element
		$('body').append( html );

		// get object with TR based on IDs
		serpTRList_data = JSON.parse(window.localStorage.getItem("JE-GTM-serpTRList"));

		_addIDsToOffileRestaurants();

		// pre-select 'Open' filter
		filterBy("open");
		$('#just-filter li[data-just-filter-type="open"]').addClass('active');

		$('#just-filter li').on('click', function(){
			// FIXME: add 'disabled' check
			if( true ){
				var _filterType = $(this).data('just-filter-type');

				if( !$(this).hasClass('active') ){
					// FIXME: add animation; move to a separate function; add overlay;
					$(window).scrollTop(0);

					filterBy(_filterType);
					$(this).addClass('active');
				} else {
					// FIXME: add animation; move to a separate function; add overlay;
					$(window).scrollTop(0);

					$(this).removeClass('active');
					defilterBy(_filterType);
				}				
			}
		});

		// Cuisines filter overtake
		$('.c-serp-filter__list[data-ft="cuisineFilter"] a').on('click', function(ev){
			ev.preventDefault();

			var _cuisineType = $(this).attr('title').substr( 0, $(this).attr('title').indexOf('(') ).trim().toLowerCase();
			selectCuisine(_cuisineType);
		});
	};

	var _addIDsToOffileRestaurants = function(){
		$('.c-serp__offline .c-restaurant').each(function(){
			var _tempData = $(this).find('.c-restaurant__logo').data('original').split('/').pop();
			_tempData = ""+_tempData.substr(0, _tempData.indexOf('.') );

			$(this).attr('data-restaurant-id', _tempData);
		});
	};

	var hideTR = function(arr, filterType) {
		for (var i = arr.length - 1; i >= 0; i--) {
			$('.c-restaurant[data-restaurant-id="'+arr[i]+'"]').addClass('just-filter-hide-based-on-'+filterType);
		}

		// FIXME: send event to remove overlay

		// fix for restaurants' logo not loading
		$(window).scrollTop(1);
	};

	var showTR = function(filterType) {

		$('.just-filter-hide-based-on-'+filterType).removeClass('just-filter-hide-based-on-'+filterType);

		// FIXME: send event to remove overlay

		// fix for restaurants' logo not loading
		$(window).scrollTop(1);
	};	

	var defilterBy = function(filterType){

		if( filterType  === "open" ){
			$('.c-serp__offline, .c-serp__closed').show();	
			$('.c-serp__header.c-serp__header--offline, .c-serp__header--closed').show();
		} else {
			showTR(filterType);
		}
	};

	var filterBy = function(filterType){

		TRtoShow = []; // reset
		TRtoHide = []; // reset

		if( filterType  === "open" ){
			$('.c-serp__offline, .c-serp__closed').hide();	
			$('.c-serp__header.c-serp__header--offline, .c-serp__header--closed').hide();
		} else {
			for ( var _restaurantID in serpTRList_data ) {
				var _thisShows = false;

				switch(filterType){
					case "minorder":
						if( parseInt(serpTRList_data[_restaurantID].minAmount) <= 10 ){
							TRtoShow.push(serpTRList_data[_restaurantID].trId);
							_thisShows = true;
						}
						break;
					case "freedelivery":
						// free delivery and available collection conditions
						if( parseFloat(serpTRList_data[_restaurantID].deliveryCost) === 0 && serpTRList_data[_restaurantID].deliveryOptions.indexOf("delivery") >= 0 ){
							TRtoShow.push(serpTRList_data[_restaurantID].trId);
							_thisShows = true;
						}
						break;
					case "rating":
						if( parseFloat(serpTRList_data[_restaurantID].rating.average) >= 4 ){
							TRtoShow.push(serpTRList_data[_restaurantID].trId);
							_thisShows = true;
						}
						break;
					case "promotion":

						if( serpTRList_data[_restaurantID].promotion !== null && serpTRList_data[_restaurantID].promotion !== "" ){
							TRtoShow.push(serpTRList_data[_restaurantID].trId);
							_thisShows = true;
						}
						break;
					default:
						console.log("error: 'Just Filter' plugin doesn't recognise the filter");						
				}

				if( !_thisShows ){
					TRtoHide.push(serpTRList_data[_restaurantID].trId);
				}
			}

			hideTR(TRtoHide, filterType);		
		}
	};	

	var selectCuisine = function(cuisineType){

		TRtoShow = []; // reset

		// loop through all TR data
		for (var _restaurantID in serpTRList_data ) {
			if( typeof serpTRList_data[_restaurantID].cuisines != 'undefined' && serpTRList_data[_restaurantID].cuisines.trim().length > 1 ){

				var _cuisineTypes = serpTRList_data[_restaurantID].cuisines.toLowerCase().split(', ');
				if( _cuisineTypes.length >= 1){

					// loop through restaurant's cuisines
					for (var i = _cuisineTypes.length - 1; i >= 0; i--) {
						var _cuisineName = _cuisineTypes[i];

						// check cuisine
						if( _cuisineTypes[i] === cuisineType ){
							TRtoShow.push(_restaurantID);
						}
					}
				}
			}
		}

		console.log("TRtoShow: ", TRtoShow);

		// TODO: rewrite this to work with filters&sorting and multiple cuisines selected simultaneously
		// hide all
		$('.c-restaurant').addClass('just-filter-hide-based-on-cuisine');
		// show only cuisine-specific TRs
		for (var i = TRtoShow.length - 1; i >= 0; i--) {
			$('.c-restaurant[data-restaurant-id="'+TRtoShow[i]+'"]').removeClass('just-filter-hide-based-on-cuisine');
		}
	};

	return {
		init: init
	}
})();

JustFilterPlugin.init();