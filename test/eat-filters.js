/* ================= NOTES 
- post codes examples: SW1A 1AA, SW7 5BD, EC3A 8BF, E14 5AB, W14 8UX
- in DOM, closed restaurants don't have restaurant IDs;
=========================== */

var JustFilterPlugin = (function(){

	// VARIABLES
	var serpTRList_data, // data for all TRs for a given location
		allTRs = [], // Array of IDs [Str] for all TRs for a given location
		TRtoShow = [], // Array of IDs [Str] for currently shown TRs
		css = '<style> /* Styles for current website"s elements */ #content { background-color: #f5f5f5; } .o-card { box-shadow: none; } .c-serp__header { background-color: #fff; } .c-serp-filter__list[data-ft="cuisineFilter"] ul.o-car { display: none; } .c-serp > div:first-child { width: 30%; } .c-serp > div:last-child { margin-left: 3%; } .c-restaurant.hidden { display: none; } /* General */ .clearfix:after { content: ""; display: table; clear: both; } .just-filter-tickbox { box-sizing: border-box; width: 20px; height: 20px; position: absolute; left: 0; display: inline-block; border: 1px solid #eaeaea; background-color: #fff; vertical-align: middle; margin-left: 0; margin-top: 0; -moz-box-shadow: 0 0 0 2px transparent,0 0 0 0 transparent; box-shadow: 0 0 0 2px transparent, 0 0 0 0 transparent; border-radius: 3px; cursor: pointer; } .just-filter-tickbox:before { content: ""; position: absolute; box-sizing: border-box; top: 0; left: 50%; -webkit-transform: translateX(-50%) rotate(45deg) scale(0); -moz-transform: translateX(-50%) rotate(45deg) scale(0); -ms-transform: translateX(-50%) rotate(45deg) scale(0); transform: translateX(-50%) rotate(45deg) scale(0); border: 2px solid #fff; background-color: transparent; width: 40%; height: 80%; border-top: 0; border-left: 0; display: block; opacity: 0; -moz-transition: all 0.25s ease-in-out; transition: all 0.25s ease-in-out; } li p:hover .just-filter-tickbox { border-color: #266abd; -moz-transition: all 0.25s ease-in-out; transition: all 0.25s ease-in-out; } .is-selected .just-filter-tickbox { background-color: #266abd; border: 3px solid #266abd; } .is-selected .just-filter-tickbox:before { opacity: 1; -webkit-transform: translateX(-50%) rotate(45deg) scale(1); -moz-transform: translateX(-50%) rotate(45deg) scale(1); -ms-transform: translateX(-50%) rotate(45deg) scale(1); transform: translateX(-50%) rotate(45deg) scale(1); } /* Cuisines Filters */ .c-serp-filter__list[data-ft="cuisineFilter"] ul.o-card { display: none; } .c-serp-filter__list[data-ft="cuisineFilter"] .o-card { padding: 8px; } .just-filter-cuisines li { border: 0; cursor: pointer; } .just-filter-cuisines li:hover, .just-filter-cuisines li:active { text-decoration: underline; } .just-filter-cuisines li p { padding: 8px 8px 8px 32px; margin-bottom: 5px; position: relative; } .just-filter-cuisines li.just-filter-separate-item { border-bottom: 1px solid #cacaca; margin-bottom: 8px; } .just-filter-cuisines li.is-selected { padding: 0; font-weight: 400; } .just-filter-cuisines li.is-hideable { display: none; } .just-filter-cuisines li.is-hideable.is-shown { display: block; } .just-filter-cuisines-control { color: #266abd; font-size: 16px; font-weight: 400; cursor: pointer; border-top: 1px solid #cacaca; padding-top: 15px; } .just-filter-cuisines-control .just-filter-cuisines-show-more { display: inline-block; background-image: url(\'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><path fill="%232F7DE1" d="M27.9 43.4c-1.5 0-3.1-.6-4.3-1.8L0 17.9l5.2-5.2 22.7 22.7 22.8-22.7 5.2 5.2-23.6 23.7c-1.2 1.2-2.7 1.8-4.4 1.8z"/></svg>\'); background-position: 100%; background-repeat: no-repeat; -moz-background-size: 14px; background-size: 14px; padding-right: 15px; width: 100%; box-sizing: border-box; } .just-filter-cuisines-control .just-filter-cuisines-show-fewer { display: none; background-image: url(\'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"><path fill="%232F7DE1" d="M5.4 43.2L.2 37.9l23.5-23.4c2.3-2.3 6.2-2.3 8.5 0L55.8 38l-5.2 5.2L28 20.7 5.4 43.2z" class="st0"/></svg>\'); background-position: 100%; background-repeat: no-repeat; -moz-background-size: 14px; background-size: 14px; padding-right: 15px; width: 100%; box-sizing: border-box; } .just-filter-cuisines-control.just-filter-list-expanded .just-filter-cuisines-show-more { display: none; } .just-filter-cuisines-control.just-filter-list-expanded .just-filter-cuisines-show-fewer { display: inline-block; } .just-filter-hide-based-on-cuisine, .just-filter-hide-based-on-minorder, .just-filter-hide-based-on-freedelivery, .just-filter-hide-based-on-rating, .just-filter-hide-based-on-promotion { display: none; } /* New Filters */ #just-filter { position: fixed; top: 0; left: 0; width: 100%; background-color: #fff; border-bottom: 4px solid #fa0029; padding: 10px 0; } #just-filter .just-filter-wrapper { width: 100%; max-width: 940px; margin: 0 auto; } #just-filter .headline { font-size: 20px; font-family: "Ubuntu"; color: #333; font-weight: 500; } #just-filter ul { list-style: none; } #just-filter li { float: left; font-size: 18px; color: #000; cursor: pointer; padding: 5px 5px; margin: 0 15px; } #just-filter li.active { color: #266abd; font-weight: bold; } #just-filter li.active:hover, #just-filter li.active:active { color: #266abd; } #just-filter li:hover, #just-filter li:active { color: #E37222; } </style>',
		html = '<div id="just-filter"> <div class="just-filter-wrapper"> <p class="headline">Filters:</p> <ul class="clearfix"> <li data-just-filter-type="open">Open</li> <li data-just-filter-type="minorder">Minimum Order 0-10&pound;</li> <li data-just-filter-type="freedelivery">Free Delivery</li> <li data-just-filter-type="rating">Rating min. 4/6</li> <li data-just-filter-type="promotion">Promotion</li> </ul> </div> </div>',
		htmlCuisines = '',
		highlightedCuisinesTypes = ['Burgers', 'Pizza', 'Chinese', 'Indian', 'Italian']
		searchState = { cuisines: [], sorting: [], filters: [] };

	var init = function(){

		// CSS styles
		$('body').append( css );

		// add the filters element
		$('body').append( html );

		// get object with TR based on IDs
		serpTRList_data = JSON.parse(window.localStorage.getItem("JE-GTM-serpTRList"));	

		// start with full TR list
		for (var _restaurantID in serpTRList_data ) {
			allTR.push( _restaurantID );
		}

		TRtoShow = allTR.slice();

		// add new Cuisines filters
		_buildCuisines();

		_addIDsToOffileRestaurants();

		// pre-select 'Open' filter
		searchState.filters.push('open');
		updateTRResults();
		$('#just-filter li[data-just-filter-type="open"]').addClass('active');

		$('#just-filter li').on('click', function(){
			// FIXME: add 'disabled' check
			if( true ){
				var _filterType = $(this).data('just-filter-type');

				if( !$(this).hasClass('active') ){
					// FIXME: add animation; move to a separate function; add overlay;
					$(window).scrollTop(0);

					searchState.filters.push(_filterType);
					//filterBy(_filterType);
					$(this).addClass('active');
					updateTRResults();

				} else {
					// FIXME: add animation; move to a separate function; add overlay;
					$(window).scrollTop(0);

					searchState.filters.splice( searchState.filters.indexOf(_filterType), 1);	
					$(this).removeClass('active');
					//defilterBy(_filterType);
					updateTRResults();
				}				
			}
		});
	};

	var _addIDsToOffileRestaurants = function(){
		$('.c-serp__offline .c-restaurant').each(function(){
			var _tempData = $(this).find('.c-restaurant__logo').data('original').split('/').pop();
			_tempData = ""+_tempData.substr(0, _tempData.indexOf('.') );

			$(this).attr('data-restaurant-id', _tempData);
		});
	};

	var _buildCuisines = function(){

		// TODO: change static HTML to dynamically created list

		var htmlCuisinesHighlighted = '';
		var htmlCuisinesNormal = '';

		htmlCuisines = '<div class="o-card"> <ul class="just-filter-cuisines">';

		// loop through current Cuisine DOM list
		// TODO: change it to rely solely on JS object
		$('.c-serp-filter__list[data-ft="cuisineFilter"] ul.o-card li').each(function(index){

			if( index === 0 ){
				// 'All' Cusines count
				htmlCuisines += '<li class="is-selected just-filter-separate-item" data-cuisine-type="all"><p><span class="just-filter-tickbox"></span>All <span class="just-filter-cuisine-count">(213)</span></p></li>';
			} else {

				var title = $(this).find('a').attr('title');
				var cuisineName = title.substring(0, title.indexOf(' (') );
				var trCount = title.substring( title.indexOf(' (') +2, title.length - 1 );

				// highlighted cuisines gathered at the top
				// TODO: arrange them in a specific and fixed order
				if( highlightedCuisinesTypes.indexOf( cuisineName ) > -1 ){
					htmlCuisinesHighlighted += '<li class="just-filter-highlighted-item" data-cuisine-type="'+cuisineName.toLowerCase()+'"><p><span class="just-filter-tickbox"></span>'+cuisineName+' <span class="just-filter-cuisine-count">('+trCount+')</span></p></li>';
				} else {
					htmlCuisinesNormal += '<li class="is-hideable" data-cuisine-type="'+cuisineName.toLowerCase()+'"><p><span class="just-filter-tickbox"></span>'+cuisineName+' <span class="just-filter-cuisine-count">('+trCount+')</span></p></li>';
				}
			}
		});

		htmlCuisines += htmlCuisinesHighlighted;
		htmlCuisines += htmlCuisinesNormal;

		htmlCuisines += '</ul> <p class="just-filter-cuisines-control"> <span class="just-filter-cuisines-show-more">More Cuisines</span> <span class="just-filter-cuisines-show-fewer">Fewer Cuisiens</span> </p> </div>';

		$('.c-serp-filter__list[data-ft="cuisineFilter"] h3').after( htmlCuisines );

		// Cuisine Filters functionality
		// TODO: add: when cuisine selected, 'All' option is deselected automatically
		// TODO: add: when deselecting all specific cuisine filters, automatically select 'All' option
		$('.just-filter-cuisines li p').on('click', function(){
			// TODO: add check for disabled item
			if( true ){
				if( $(this).parent('li').hasClass('is-selected') ){
					$(this).parent('li').removeClass('is-selected');
				} else {
					$(this).parent('li').addClass('is-selected');
				}
				selectCuisine( $(this).closest('li').data('cuisine-type') );
			}
		});

		// Cuisines expand/hide list functionality
		$('.just-filter-cuisines-control').on('click', function(){
			if( $(this).hasClass('just-filter-list-expanded') ){
				$(this).removeClass('just-filter-list-expanded');
				$('.just-filter-cuisines li.is-hideable').removeClass('is-shown');
			} else {
				$(this).addClass('just-filter-list-expanded');
				$('.just-filter-cuisines li.is-hideable').addClass('is-shown');
			}
		});
	};

	var hideTRs = function() {
		$('.c-restaurant').addClass('hidden');

		// FIXME: send event to remove overlay

		// fix for restaurants' logo not loading
		$(window).scrollTop(1);
	};

	var showTRs = function() {

		for (var i = TRtoShow.length - 1; i >= 0; i--) {
			$('.c-restaurant[data-restaurant-id="'+TRtoShow[i]+'"]').removeClass('hidden');
		}

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

		var _temp_TRtoShow = TRtoShow.slice();

		for (var i = _temp_TRtoShow.length - 1; i >= 0; i--) {
			var _restaurantID = _temp_TRtoShow[i];
			var hasPassedFilterConditions = false;

			switch(filterType){
				case "open":
					// TODO: add conditions here
					if( serpTRList_data[_restaurantID].open === true ){
						hasPassedFilterConditions = true;
					}
					break;
				case "minorder":
					if( parseInt(serpTRList_data[_restaurantID].minAmount) <= 10 ){
						hasPassedFilterConditions = true;
					}
					break;
				case "freedelivery":
					// free delivery and available collection conditions
					if( parseFloat(serpTRList_data[_restaurantID].deliveryCost) === 0 && serpTRList_data[_restaurantID].deliveryOptions.indexOf("delivery") >= 0 ){
						hasPassedFilterConditions = true;
					}
					break;
				case "rating":
					if( parseFloat(serpTRList_data[_restaurantID].rating.average) >= 4 ){
						hasPassedFilterConditions = true;
					}
					break;
				case "promotion":
					if( serpTRList_data[_restaurantID].promotion !== null && serpTRList_data[_restaurantID].promotion !== "" ){
						hasPassedFilterConditions = true;
					}
					break;
				default:
					console.log("error: 'Just Filter' plugin doesn't recognise the filter");						
			}

			if( !hasPassedFilterConditions ){
				TRtoShow.splice( TRtoShow.indexOf( _restaurantID ), 1);
			}
		}
	};	

	var selectCuisine = function(cuisineType){

		// update global scope of serachState
		if( cuisineType === 'all' ){
			// deselect all other cuisines
			$('.just-filter-cuisines li.is-selected').removeClass('is-selected');
			$('.just-filter-cuisines li[data-cuisine-type="all"]').addClass('is-selected');
			// if 'All' is selected
			searchState.cuisines = [];

		} else if( searchState.cuisines.indexOf(cuisineType) > -1 ){
			// deselect cuisine type
			searchState.cuisines.splice( searchState.cuisines.indexOf(cuisineType), 1);	
			// when deselecting the only/last cuisine switch to 'All'
			if( searchState.cuisines.length === 0 ){
				$('.just-filter-cuisines li[data-cuisine-type="all"]').addClass('is-selected');
			}

		} else {
			// deselect 'All' option
			$('.just-filter-cuisines li[data-cuisine-type="all"]').removeClass('is-selected');
			// add cuisite type to the list
			searchState.cuisines.push(cuisineType);
		}

		updateTRResults();
	};

	var updateTRResults = function(){
		// TODO: change this to an overlay 
		hideTRs();

		// have data ready: searchState with cuisine types, filters, and sorting
		console.log("--- updateTRresults based on: ", searchState );
		
		// Cuisines types
		if( searchState.cuisines.length === 0 ){

			TRtoShow = allTR.slice();

		} else {

			TRtoShow = []; // reset

			// loop through all TR data
			for (var _restaurantID in serpTRList_data ) {
				if( typeof serpTRList_data[_restaurantID].cuisines != 'undefined' && serpTRList_data[_restaurantID].cuisines.trim().length > 1 ){

					var _cuisineTypes = serpTRList_data[_restaurantID].cuisines.toLowerCase().split(', ');

					if( _cuisineTypes.length >= 1){

						// loop through restaurant's cuisines
						for (var i = _cuisineTypes.length - 1; i >= 0; i--) {
							var _cuisineName = _cuisineTypes[i];

							// check if any of the cuisines is selected
							if( searchState.cuisines.indexOf(_cuisineName) > -1 ){
								TRtoShow.push(_restaurantID);
								continue;
							}
						}
					}
				}
			}
		}
		
		// Filters
		if( searchState.filters.length > 0 ){
			for (var i = searchState.filters.length - 1; i >= 0; i--) {
				filterBy( searchState.filters[i] );
			}
		}

		// Sorting
		if( searchState.sorting.length > 0 ){
			
		}

		console.log("TRtoShow: ", TRtoShow.length );

		// show TRs
		showTRs();
	};

	return {
		init: init
	}
})();

$(document).ready(function(){
	JustFilterPlugin.init();	
});