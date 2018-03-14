/* ================= NOTES 
- post codes examples: SW1A 1AA, SW7 5BD, EC3A 8BF, E14 5AB, W14 8UX
- in DOM, closed restaurants don't have restaurant IDs;
=========================== */

var JustFilterPlugin = (function(){

	// VARIABLES
	var serpTRList_data,
		TRtoShow = [],
		TRtoHide = [],
		css = '<style>.clearfix:after { content: ""; display: table; clear: both; } #just-filter { position: fixed; top: 0; left: 0; width: 100%; background-color: #fff; border-bottom: 4px solid #fa0029; padding: 10px 0; } #just-filter .just-filter-wrapper { width: 100%; max-width: 940px; margin: 0 auto; } #just-filter .headline { font-size: 20px; font-family: "Ubuntu"; color: #333; font-weight: 500; } #just-filter ul { list-style: none; } #just-filter li { float: left; font-size: 18px; color: #000; cursor: pointer; padding: 5px 5px; margin: 0 15px; } #just-filter li:hover, #just-filter li:active { color: #E37222; } #just-filter li.active { color: #266abd; font-weight: bold; } #just-filter li.active:hover, #just-filter li.active:active { color: #266abd; } </style>',
		html = '<div id="just-filter"> <div class="just-filter-wrapper"> <p class="headline">Filters:</p> <ul class="clearfix"> <li data-just-filter-type="open">Open</li> <li data-just-filter-type="minorder">Minimum Order 0-10&pound;</li> <li data-just-filter-type="freedelivery">Free Delivery</li> <li data-just-filter-type="rating">Rating min. 4/6</li> <li data-just-filter-type="promotion">Promotion</li> </ul> </div> </div>';

	var init = function(){

		// CSS styles
		$('body').append( css );

		// add the filters element
		$('body').append( html );

		// get object with TR based on IDs
		serpTRList_data = JSON.parse(window.localStorage.getItem("JE-GTM-serpTRList"));

		// pre-select 'Open' filter
		filterBy("open");
		$('#just-filter li[data-just-filter-type="open"]').addClass('active');

		$('#just-filter li').on('click', function(){
			// FIXME: add 'disabled' check

			if( !$(this).hasClass('active') ){
				// FIXME: add animation; move to a separate function; add overlay;
				$(window).scrollTop(0);

				var _filterType = $(this).data('just-filter-type');

				filterBy(_filterType);
				$(this).addClass('active');
			} else {
				// FIXME: add deselecting/removing the filter
			}
		});
	};

	var hideTR = function(arr) {
		// loop through all TRs
		$('.c-restaurant').each(function(){
			var _restaurant_id = parseInt($(this).data('restaurant-id'));

			if( arr.indexOf(_restaurant_id) >= 0 ){
				$(this).hide();
			}
		});

		// FIXME: send event to remove overlay
		// fix for restaurants' logo not loading
		$(window).scrollTop(1);
	}

	var filterBy = function(filterType){

		if( filterType  === "open"  ){
			$('.c-serp__offline').hide();	
			$('.c-serp__header.c-serp__header--offline').hide();
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

			hideTR(TRtoHide);		
		}
	};	

	return {
		init: init
	}
})();

JustFilterPlugin.init();