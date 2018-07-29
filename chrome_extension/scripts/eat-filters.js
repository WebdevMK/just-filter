/* ================= NOTES 
- post codes examples: SW1A 1AA, SW7 5BD, EC3A 8BF, E14 5AB, W14 8UX
- in DOM, closed restaurants don't have restaurant IDs;
- TR stands for Takeaway Restaurant
=========================== */

var JustFilterPlugin = (function(){

	// VARIABLES
	var serpTRList_data, // data for all TRs for a given location
		allTRs = [], // Array of IDs [Str] for all TRs for a given location
		TRtoShow = [], // Array of IDs [Str] for currently shown TRs
		html = '<div id="just-filter-scroll-top"><span class="just-filter-scroll-top-icon"></span><span class="just-filter-scroll-top-copy">TOP</span></div><div id="just-filter-overlay" class="hidden"></div> <div id="just-filter"> <div class="just-filter-wrapper"> <p class="headline">Filters:</p> <ul class="clearfix"> <li data-just-filter-type="open">Open</li> <li data-just-filter-type="preorder">Preorder</li> <li data-just-filter-type="minorder">Minimum Order 0-10&pound;</li> <li data-just-filter-type="freedelivery">Free Delivery</li> <li data-just-filter-type="rating">Rating min. 4/6</li> <li data-just-filter-type="promotion">Promotion</li> </ul> </div> </div>',
		htmlCuisines = '',
		highlightedCuisinesTypes = ['burgers', 'pizza', 'chinese', 'indian', 'italian'],
		filterList = ['open', 'minorder', 'freedelivery', 'rating', 'promotion', 'preorder'],
		stringOfAvailableFiltersForShownTRs = '',
		cuisinesCount = { 'all': 0},
		searchState = { cuisines: [], sorting: "default", filters: [] },
		shouldIShowResults = false, // a flag indicating the timing for showing TR results (to control overlay animation and minimum overlay time)
		overlayAnimationTiming = [150, 400, 150, 400, 150]; // timing for overlay animation: [ overlay appear -> scrolling begins, scroll time, scrolling stops -> hiding TRs, no TRs shown, showing TRs -> removing overlay]

	var init = function(restaurants_data){

		serpTRList_data = restaurants_data;

		// add class to body for CSS styles
		$('body').addClass('just-extension-active');
		
		// add extension element
		$('.c-serp__header.c-serp__header--primary').after(html);

		// hide Search
		$('.c-nameSearch').parent('div').addClass('just-extension-hidden');

		$('.c-serp__open, .c-serp__closed, .c-serp__offline').first().parent('div').prepend('<div id="just-extension-restaurant-list" class="just-extension-flex-container"></div>');

		_addIDsToOfflineRestaurants();
		var clones = $('.c-restaurant').clone(true);
		$('#just-extension-restaurant-list').append( clones );

		// Sorting
		$('.c-serp-filter__list[data-ft="sortByFilter"] h3').after( '<div class="o-card just-extension-element"><ul><li class="is-selected" data-sort-type="default"><span class="o-radio"></span>Default</li><li data-sort-type="rating"><span class="o-radio"></span>Rating</li><li data-sort-type="distance"><span class="o-radio"></span>Distance</li><li data-sort-type="name"><span class="o-radio"></span>A-Z</li></ul></div>' ); 

		// change Cuisine filters title
		$('.c-serp-filter__list[data-ft="cuisineFilter"] h3').html( $('.c-serp-filter__list[data-ft="cuisineFilter"] h3').html().replace("Cuisines", "Cuisines and dishes") );

		_addPreorderData();

		// loop through all TRs and get some additional data
		for (var _restaurantID in serpTRList_data ) {
			// start with full TR list
			allTRs.push( _restaurantID );

			// create data on all cuisine types and initial count
			if( typeof serpTRList_data[_restaurantID].cuisines != 'undefined' && serpTRList_data[_restaurantID].cuisines.trim().length > 1 ){

				var _cuisineTypes = serpTRList_data[_restaurantID].cuisines.toLowerCase().split(', ');

				if( _cuisineTypes.length >= 1){

					// loop through restaurant's cuisines
					for (var i = _cuisineTypes.length - 1; i >= 0; i--) {
						var _cuisineName = _cuisineTypes[i];

						if( typeof cuisinesCount[ _cuisineName ] === 'undefined' ){
                            cuisinesCount[ _cuisineName ] = 1;
                        } else {
                            cuisinesCount[ _cuisineName ] += 1;
                        }
					}
				}
			}

			// filters
			// check what filter conditions restaurant would pass and add them to the TRs data obj
			if( typeof serpTRList_data[ _restaurantID ].filters === 'undefined' ){
				serpTRList_data[ _restaurantID ].filters = addFilterData(_restaurantID);
			}

			// sorting
			// add data needed for sorting options
			serpTRList_data[ _restaurantID ][ "name" ] = $('#just-extension-restaurant-list .c-restaurant[data-restaurant-id="'+_restaurantID+'"] [data-ft="restaurantDetailsName"]').text();
		
			if( $('#just-extension-restaurant-list .c-restaurant[data-restaurant-id="'+_restaurantID+'"] .c-restaurant__distance').length === 1 ){
				serpTRList_data[ _restaurantID ][ "distance" ] = $('#just-extension-restaurant-list .c-restaurant[data-restaurant-id="'+_restaurantID+'"] .c-restaurant__distance').text().replace('<span class="o-icon o-icon--pin"></span>', '').replace('miles', '').trim();
			} else {
				serpTRList_data[ _restaurantID ][ "distance" ] = '999';
			}
		}

		TRtoShow = allTRs.slice();
		cuisinesCount['all'] = TRtoShow.length;

		// add new Cuisines filters
		_buildCuisines();

		// TODO: re-think this initial overlay animation
		// pre-select 'Open' filter
		searchState.filters.push('open');
		updateTRResults();
		$('#just-filter li[data-just-filter-type="open"]').addClass('active');

		// load images for restaurant logos
		$('#just-extension-restaurant-list .c-restaurant').each(function(){
			$(this).find('.c-restaurant__logo').attr('src', $(this).find('.c-restaurant__logo').data('original') );
		});

		// filters handler
		$('#just-filter li').on('click', function(){
			// 'inactive' check
			if( !$(this).hasClass('is-inactive') ){
				var _filterType = $(this).data('just-filter-type');

				if( !$(this).hasClass('active') ){
					$('#just-filter-overlay').removeClass('hidden');
					searchState.filters.push(_filterType);
					$(this).addClass('active');
					updateTRResults();

				} else {
					searchState.filters.splice( searchState.filters.indexOf(_filterType), 1);	
					$(this).removeClass('active');
					updateTRResults();
				}				
			}
		});

		// sorting handler
		$('.c-serp-filter__list[data-ft="sortByFilter"] li').on('click', function(){
			// 'inactive' check
			if( !$(this).hasClass('is-inactive') && !$(this).hasClass('is-selected') ){
				var _sortType = $(this).data('sort-type');
				searchState.sorting = _sortType;
				$('#just-filter-overlay').removeClass('hidden');
				$('.c-serp-filter__list[data-ft="sortByFilter"] li.is-selected').removeClass('is-selected');
				$(this).addClass('is-selected');
				updateTRResults();
			}
		});

		// 'Scroll to the top' buton 
		$('#just-filter-scroll-top').on('click', function(){
			scrollTo(0, 400 );
		});
	};

	var _addIDsToOfflineRestaurants = function(){
		$('.c-serp__offline .c-restaurant').each(function(){
			var _tempData = $(this).find('.c-restaurant__logo').data('original').split('/').pop();
			_tempData = ""+_tempData.substr(0, _tempData.indexOf('.') );

			$(this).attr('data-restaurant-id', _tempData);
		});
	};

	var _addPreorderData = function(){
		$('.c-serp__closed .c-restaurant').each(function(){

			var _restaurantID = $(this).data('restaurant-id');

			if( typeof serpTRList_data[ _restaurantID ]['takingPreorder'] === 'undefined' ){
				serpTRList_data[ _restaurantID ]['takingPreorder'] = true;
			}					
		});
	};

	var _buildCuisines = function(){

		var _htmlCuisinesHighlighted = '';
		var _htmlCuisinesNormal = '';

		htmlCuisines = '<div class="o-card"> <ul class="just-filter-cuisines">';

		// loop through initial Cuisine list
		for( var _cuisineType in cuisinesCount ){

			if( _cuisineType === 'all' ){
				// 'All' Cusines count
				htmlCuisines += '<li class="is-selected just-filter-separate-item just-filter-cusine-all" data-cuisine-type="all"><p><span class="just-filter-tickbox"></span>All <span class="just-filter-cuisine-count">(213)</span></p></li>';
			} else {
				var _cuisineName = _cuisineType;
				var _trCount = cuisinesCount[ _cuisineType ];

				// highlighted cuisines gathered at the top
				// TODO: arrange them in a specific and fixed order
				if( highlightedCuisinesTypes.indexOf( _cuisineName ) > -1 ){
					_htmlCuisinesHighlighted += '<li class="just-filter-highlighted-item" data-cuisine-type="'+_cuisineName+'"><p><span class="just-filter-tickbox"></span>'+_cuisineName+' <span class="just-filter-cuisine-count">('+_trCount+')</span></p></li>';
				} else {
					_htmlCuisinesNormal += '<li class="is-hideable" data-cuisine-type="'+_cuisineName+'"><p><span class="just-filter-tickbox"></span>'+_cuisineName+' <span class="just-filter-cuisine-count">('+_trCount+')</span></p></li>';
				}
			}
		}

		htmlCuisines += _htmlCuisinesHighlighted;
		htmlCuisines += _htmlCuisinesNormal;

		htmlCuisines += '</ul> <p class="just-filter-cuisines-control"> <span class="just-filter-cuisines-show-more">More Cuisines</span> <span class="just-filter-cuisines-show-fewer">Fewer Cuisines</span> </p> </div>';

		$('.c-serp-filter__list[data-ft="cuisineFilter"] h3').after( htmlCuisines );

		// Cuisine Filters functionality
		$('.just-filter-cuisines li p').on('click', function(){
			// 'inactive' check
			if( !$(this).parent('li').hasClass('is-inactive') ){
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

		// show overlay
		$('#just-filter-overlay').removeClass('hidden');

		setTimeout(function(){
			// scroll the viewport with animation
			// 1px from top of the page as a fix for restaurants' logo not loading (when at the top)
			scrollTo(1, overlayAnimationTiming[1] );

			setTimeout(function(){
				// hide all TRs
				$('#just-extension-restaurant-list .c-restaurant').addClass('hidden');

				setTimeout(function(){
					// allow to show TR results (minimum overlay time has passed)
					shouldIShowResults = true;	
				}, overlayAnimationTiming[3] );				
			}, overlayAnimationTiming[1] + overlayAnimationTiming[2] );
		}, overlayAnimationTiming[0] );
	};

	var showTRs = function() {

		// wait for minimum overlay time to pass
		var waitForHidingTRs = setInterval(function(){
			if( shouldIShowResults ){
				clearInterval(waitForHidingTRs);

				// show and apply sorting
				for (var i = 0; i < TRtoShow.length; i++) {
					$('#just-extension-restaurant-list .c-restaurant[data-restaurant-id="'+TRtoShow[i]+'"]').removeClass('hidden').css('order', ""+(i+1) );
				}

				// remove old condition
				$('#just-extension-restaurant-list .c-restaurant.no-top-border').removeClass('no-top-border')
				// hide first's TR top border
				$('#just-extension-restaurant-list .c-restaurant[data-restaurant-id="'+TRtoShow[0]+'"]').addClass('no-top-border');

				// remove previous information to the user about not known distance for offline TRs
				$('#just-extension-restaurant-list .just-extension-header-distance-unknown').remove();

				// add information to the user about not known distance for offline TRs
				if( searchState.sorting === "distance" && searchState.filters.indexOf('open') === -1 && searchState.filters.indexOf('preorder') === -1 ){
					$('#just-extension-restaurant-list .c-restaurant--offline').not('.hidden').first().before( '<div class="just-extension-header-distance-unknown"><p>Distance unknown</p></div>' );
				}

				setTimeout(function(){
					$('#just-filter-overlay').addClass('hidden');
					shouldIShowResults = false;					
				}, overlayAnimationTiming[4] );
			}
		}, 50);
	};	

	var addFilterData = function(_restaurantID){
		var _filterList =  [];

		if( serpTRList_data[_restaurantID].open === true ){
			_filterList.push('open');
		}
		if( parseInt(serpTRList_data[_restaurantID].minAmount) <= 10 ){
			_filterList.push('minorder');
		}
		// free delivery and available collection conditions
		if( parseFloat(serpTRList_data[_restaurantID].deliveryCost) === 0 && serpTRList_data[_restaurantID].deliveryOptions.indexOf("delivery") >= 0 ){
			_filterList.push('freedelivery');
		}
		if( parseFloat(serpTRList_data[_restaurantID].rating.average) >= 4 ){
			_filterList.push('rating');
		}
		if( serpTRList_data[_restaurantID].promotion !== null && serpTRList_data[_restaurantID].promotion !== "" ){
			_filterList.push('promotion');
		}
		if( serpTRList_data[_restaurantID].open === true || typeof serpTRList_data[_restaurantID]['takingPreorder'] != 'undefined' && serpTRList_data[_restaurantID]['takingPreorder'] === true ){
			_filterList.push('preorder');
		}

		return _filterList;
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
		// hide TRs with an animated changes and overlay
		hideTRs();

		stringOfAvailableFiltersForShownTRs = ''; // reset

		// Filters
		// removes filtered out TRs
		if( searchState.filters.length > 0 ){
			TRtoShow = []; // reset

			for (var _restaurantID in serpTRList_data ) {
				var _passedAllFilters = true;
				
				if( typeof serpTRList_data[_restaurantID].filters != 'undefined' && serpTRList_data[_restaurantID].filters.length >= 1 ){

					for (var i = searchState.filters.length - 1; i >= 0; i--) {
						if( _passedAllFilters && serpTRList_data[_restaurantID].filters.indexOf( searchState.filters[i] ) === -1 ){
							_passedAllFilters = false;
						}
					}
				} else {
					_passedAllFilters = false;
				}

				if( _passedAllFilters ){
					TRtoShow.push(_restaurantID);
				}
			}
		} else {
			TRtoShow = allTRs.slice(); // reset
		}

		// update 'All' TRs count at this point
		$('.just-filter-cuisines li[data-cuisine-type="all"] .just-filter-cuisine-count').html( '('+TRtoShow.length+')' );	

		// Cuisine types
		// reset cuisines count
		for( var _cuisineType in cuisinesCount ){
			if( _cuisineType === 'all' ){
				cuisinesCount[ 'all' ] = TRtoShow.length;
			} else {
				cuisinesCount[ _cuisineType ] = 0;
			}
		}

		// filter available TRs by cuisines
		for (var i = TRtoShow.length - 1; i >= 0; i--) {

			var _restaurantID = TRtoShow[i];
			var _hasPassedFilterConditions = false; // flag for filtering out non-selected TRs

			if( typeof serpTRList_data[_restaurantID].cuisines != 'undefined' && serpTRList_data[_restaurantID].cuisines.trim().length > 1 ){

				var _cuisineTypes = serpTRList_data[_restaurantID].cuisines.toLowerCase().split(', ');

				if( _cuisineTypes.length >= 1){

					// loop through restaurant's cuisines
					for (var j = _cuisineTypes.length - 1; j >= 0; j--) {
						var _cuisineName = _cuisineTypes[j];

						// check if any of the cuisines is selected ('All' is not listed as a cuisine, hence the check for length)
						if( searchState.cuisines.length > 0 && searchState.cuisines.indexOf(_cuisineName) > -1 ){
							_hasPassedFilterConditions = true;
							// compile all filter names for all visible restaurants (when some cuisines are selected)
							stringOfAvailableFiltersForShownTRs += ","+serpTRList_data[_restaurantID].filters.join(',');

						} else if( searchState.cuisines.length === 0 ){ // compile all filter names for all visible restaurants (when 'All' TRs are selected)
							stringOfAvailableFiltersForShownTRs += ","+serpTRList_data[_restaurantID].filters.join(',');
						}

						cuisinesCount[ _cuisineName ] += 1;
					}
				}
			}

			// filter out TR if it's not selected ('All' is not listed as a cuisine, hence the check for length)
			if( searchState.cuisines.length > 0 && !_hasPassedFilterConditions ){
				TRtoShow.splice( TRtoShow.indexOf( _restaurantID ), 1);
			}
		}

		$('#just-filter li.is-inactive').removeClass('is-inactive'); // clear inactive filters
		$('.just-filter-cuisines li.is-inactive').removeClass('is-inactive'); // clear inactive cuisines

		// update cuisines count in DOM
		for( var _cuisineType in cuisinesCount ){
			$('.just-filter-cuisines li[data-cuisine-type="'+_cuisineType+'"]').find('.just-filter-cuisine-count').html( '('+cuisinesCount[ _cuisineType ]+')' );
			if( cuisinesCount[ _cuisineType ] === 0 && !$('.just-filter-cuisines li[data-cuisine-type="'+_cuisineType+'"]').hasClass('is-selected') ){
				$('.just-filter-cuisines li[data-cuisine-type="'+_cuisineType+'"]').addClass('is-inactive');
			}
		}

		// update non-available filters
		// get not selected filters
		if( searchState.filters.length < filterList.length ){
			var _nonSelectedFilters = filterList.filter(function(_filterType){
				return searchState.filters.indexOf(_filterType) === -1;
			});

			// loop through not-selected filters and disable the onse that have no TRs in the shown results
			for (var i = _nonSelectedFilters.length - 1; i >= 0; i--) {
				if( stringOfAvailableFiltersForShownTRs.indexOf(_nonSelectedFilters[i]) === -1 ){
					// make this filter inactive
					$('#just-filter li[data-just-filter-type="'+_nonSelectedFilters[i]+'"]').addClass('is-inactive');
				}
			}
		}

		// Sorting
		// rearranges TRs
		switch(searchState.sorting){
			case 'default':
				TRtoShow.sort(function(a,b) {
				    return serpTRList_data[a].position - serpTRList_data[b].position;
				});
				break;
			case 'name':
				TRtoShow.sort(function(a,b) {
					var nameA = serpTRList_data[a].name.toUpperCase(); // ignore upper and lowercase
					var nameB = serpTRList_data[b].name.toUpperCase(); // ignore upper and lowercase
					if (nameA < nameB) {
						return -1;
					}
					if (nameA > nameB) {
						return 1;
					}

					// names must be equal
					return 0;
				});
				break;
			case 'distance':
				TRtoShow.sort(function(a,b) {
				    return parseFloat(serpTRList_data[a].distance) - parseFloat(serpTRList_data[b].distance);
				});
				break;
			case 'rating':
				TRtoShow.sort(function(a,b) {
				    return parseFloat(serpTRList_data[b].rating.average) - parseFloat(serpTRList_data[a].rating.average);
				});
				break;
			default:
				console.log("Error: Just Extension, sorting option unknown");
		}

		// update 'All' count in the header( total number of currently shown TRs )
		$('h1 .c-serp__header--count').html( TRtoShow.length );

		// show TRs
		showTRs();
	};

	// util function for scroll animation
	var easeInOut = function(currentTime, start, change, duration) {
	    currentTime /= duration / 2;
	    if (currentTime < 1) {
	        return change / 2 * currentTime * currentTime + start;
	    }
	    currentTime -= 1;
	    return Math.floor( -change / 2 * (currentTime * (currentTime - 2) - 1) + start );
	};

	// animated scrolling fn
	var scrollTo = function(to, duration) {

	    var start = (document.documentElement && document.documentElement.scrollTop) || 
	          document.body.scrollTop;
	    var change = to - start,
	        increment = 20;

	    var animateScroll = function(elapsedTime) { 
		     
	        elapsedTime += increment;
	        var position = easeInOut(elapsedTime, start, change, duration);  

	        // crude fix for cross-browser inconsistency between (IE11, FF) and (Chrome, Safari, Edge)
	        document.body.scrollTop = position;
			document.documentElement.scrollTop = position;

	        if (elapsedTime < duration) {
	            setTimeout(function() {
	                animateScroll(elapsedTime);
	            }, increment);
	        }
	    };

	    animateScroll(0);
	};

	return {
		init: init
	}
})();

// check if the extension code should run
chrome.storage.local.get(['isJustEatExtensionOn'], function(result) {

	var isJustEatExtensionOn = "true";

	if( typeof result['isJustEatExtensionOn'] != 'undefined'){
		isJustEatExtensionOn = result['isJustEatExtensionOn'];
	} else {
		chrome.storage.local.set({'isJustEatExtensionOn': 'true'}, function() {});
	}	

	if( isJustEatExtensionOn === 'true' ){

		// check if we are on the general result page
		if( window.location.href.indexOf('just-eat.co.uk/area/') >= 0 && window.location.href.indexOf('so=') === -1 && window.location.pathname.split('/').length === 3 ){
		
			var s = document.createElement('script');
			s.src = chrome.extension.getURL('/scripts/get-restaurants-data.js');
			(document.head||document.documentElement).appendChild(s);
			s.onload = function() {
			    s.remove();
			};

			// Event listener for restaurants data
			document.addEventListener('JustExtention_sendDataToMainScript', function(e) {
			    // e.detail contains the transferred data from window object; event is called from get-restaurants-data.js
			    var restaurants_data = e.detail;

			    $(document).ready(function(){
			    	JustFilterPlugin.init(restaurants_data);
			    });

			});
		}
	}	
});