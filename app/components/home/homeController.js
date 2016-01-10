app.controller('homeController',['$scope','$rootScope','Auth','$firebaseArray','$timeout', function($scope,$rootScope,Auth,$firebaseArray,$timeout){


  	var ref = new Firebase("https://flickering-heat-6138.firebaseio.com");
  	var refTag = ref.child('tag');
	var refChapters = ref.child('chapters');
	




	$scope.urlLink = '//www.youtube.com/watch?v=iQ4LJSxf3JE&feature=youtu.be.';
  	$scope.tag = $firebaseArray(refTag);
	$scope.chaptersInObject = [{
		name : '',
		cl : ''
	}];
		
	function setChapters(){
	
		$timeout(function(){
			videojs("vid1").ready(function(){
				
				refTag.on('value',function(snapshot){
					var refChapterIndex = 0;
					setCurrentVideoTagList(snapshot);
					$scope.chaptersInObject=[];
					for( var i = 0 ; i < $scope.currentVideoTagList.length ; i++){
						//do not add duplicate chapters
					    var checkForDuplicate = function(object,str){
							for(var j = 0 ; j < object.length ; j++){
								if(object[j].name == str){
									return false;
								}
							}
							return true;
						}
						if(!$scope.chaptersInObject.length || checkForDuplicate($scope.chaptersInObject,$scope.currentVideoTagList[i].chapter)){
					    	$scope.chaptersInObject.push({name : $scope.currentVideoTagList[i].chapter, cl : "" + refChapterIndex});
					    	//$scope.chaptersInObject[refChapterIndex].cl = "" + refChapterIndex;
					    	refChapterIndex++;
					    }	 

					}
					setMarkersForVideo();
				});
				
			});		
			
		},1000);

	}
	function setCurrentVideoTagList(object){
		$scope.currentVideoTagList = [];
		object.forEach(function(childSnapshot) {
		    if(childSnapshot.val().link == $scope.urlLink){
		    	$scope.currentVideoTagList.push(childSnapshot.val());
		    }
		    
		});
		console.log('currentVideoTagList: ', $scope.currentVideoTagList);
	}
	

	function setMarkersForVideo(){
	    var player = videojs('vid1');
	    player.markers.removeAll();
	    for( var i = 0 ; i < $scope.currentVideoTagList.length ; i++){
	    	var object = $scope.currentVideoTagList[i];
	    	for(var j = 0 ; j < $scope.chaptersInObject.length ; j++){
				if(object.chapter == $scope.chaptersInObject[j].name){
					var classColor = "color" + $scope.chaptersInObject[j].cl;
					break;
				}
			}
			var time = object.starttime;
			//var goTotime = stringToMilliseconds(time);
			var goTotime = time;
			var tagName = object.tag;

			var player = videojs('vid1');
			player.markers.add([{ 
				time: goTotime, 
				text: tagName,
				class: "" + classColor
			}]);

	    }			    
			
	}	

	$scope.goButtonClicked = function(url){
		videojs("vid1").ready(function(){
			var player = videojs('vid1');
			player.src(url);
			player.bigPlayButton.show();
			
			player.markers.removeAll();
			
			setChapters();
			
		});

	};
	
	$scope.addTagButtonOnClick = function(){
		$scope.selectedChapter = '';
		$scope.tagname = '';
		$scope.starttime = '';
		$scope.endtime = '';
		angular.element('#addTagModal').modal();
		rangeSliderInitAndHideVideoControlBar(0,30,'edit-tag-slider-add','vidModal-add');

		$('#addTagModal').on('hide.bs.modal', function (e) {
		  // do something...
		  var player = videojs('vidModal-add');		  
		  player.player().pause();
		  player.player().currentTime(1)
		})

	}
		
	
	$scope.addTag = function(chapter,tag,starttime,endtime,link,annotation){
			//if($rootScope.user){
				$scope.tag.$add({
				link : link,
				annotation : annotation,
				chapter : chapter,
				tag : tag,
				starttime : starttime,
				endtime : endtime
				});
			// }else{
			// 	console.log('Not logged in, cant write to database');
			// }
	}
	$scope.removeTag = function(item,index){
		//$scope.currentVideoTagList.$remove(item);
		$scope.currentVideoTagList.splice(index,1);
		console.log('past ', $scope.currentVideoTagList);
		

		refTag.on('child_added',function(snapshot){
			console.log('item is : ', item);
			console.log('child added is: ', snapshot.val());
			if(snapshot.val().link == item.link && snapshot.val().starttime == item.starttime && snapshot.val().endtime == item.endtime ){
				snapshot.ref().remove();
				//$scope.tag.$remove(snapshot.ref().remove());
			}
		});

	}
	$scope.editTag = function(item,index){
		console.log(item);
		$scope.currentTagOnEdit = item;

		$scope.selectedChapter = item.chapter;
		$scope.tagname = item.tag;
		$scope.starttime = item.starttime;
		$scope.endtime = item.endtime;
		angular.element('#editTagModal').modal();
		$('#editTagModal').on('hide.bs.modal', function (e) {
		  // do something...
		  var player = videojs('vidModal-edit');		  
		  player.player().pause();
		  player.player().currentTime(1)
		});
		rangeSliderInitAndHideVideoControlBar(item.starttime,item.endtime,'edit-tag-slider-edit','vidModal-edit');
	}
	//start time and endtime not inputed in paramters because they are handled by the range slider function
	$scope.updateTag = function(tagname,chapter){
		refTag.on('child_added',function(snapshot){
			$scope.tagname = tagname;
			$scope.selectedChapter = chapter;
			
			// console.log('item is : ', $scope.currentTagOnEdit);
			// console.log('child added is: ', snapshot.val());

			if(snapshot.val().link == $scope.currentTagOnEdit.link && snapshot.val().starttime == $scope.currentTagOnEdit.starttime && snapshot.val().endtime == $scope.currentTagOnEdit.endtime ){
				snapshot.ref().update({
					link : $scope.urlLink,
					annotation : 'annotation',
					chapter : $scope.selectedChapter,
					tag : $scope.tagname,
					starttime : $scope.starttime,
					endtime : $scope.endtime
				});
			}
		});	

		
	}


	function stringToMilliseconds (time){
		
		var strTimeArray = time.split(":");
		var seconds = parseInt(strTimeArray[0],10) * 60;
		var ms = parseInt(strTimeArray[1],10);


		var goTotime = seconds + ms;
		return goTotime;
	}
	 $scope.millisecondsToFormattedTime = function(milli){
		var time = new Date(milli * 1000);
		var minutes = time.getMinutes();
		var seconds = ("0"+time.getSeconds()).slice(-2);
		
		return (minutes + ":" + seconds);
	}
	
	$scope.fastForwardTo = function(time){
		//var goTotime = stringToMilliseconds(time);
		var goTotime = time;
		
		document.getElementById('vid1').player.currentTime(goTotime);
	}

	$scope.addChapter = function(chapter){
		//will push a chapter tempoparily until a user successfully creates a tag
		//a temporary chapter is added for dropdown chapter visibility purposes
		$scope.chaptersInObject.push({name : chapter});
	};


	var init = function(){
		videojs('vid1', {

	        plugins: {
	          ass: {
	            'src': ["assets/css/testcaption.ass"]
	          }
	        },

	    });

			var player = videojs('vid1');
		
		player.markers({
		   	markerStyle: {
		      	'width':'7px',
		      	'border-radius': '30%',
		      	//'background-color': 'blue'
	   		},
	   		markerTip:{
		    	display: true,
		      	text: function(marker) {
		        return marker.text;
		      },
		      time: function(marker) {
		         return marker.time;
		      }
		   },
		   
		});
		//player.markers.removeAll();
	}
	var setupSlider = function(){
		// videojs("vid1").ready(function(){
	 //    	var options ={hidden:false},
		// 		mplayer=videojs("vid1");
		// 		mplayer.rangeslider(options);
		// });	
	}
	init();
	setupSlider();

	var refChapterIndex = 0;
	
	setChapters();




	//seek bar
	// var seekBar = document.getElementById('seek-bar');
	// var player = videojs('vid1');
	// seekBar.addEventListener("change", function() {
	//   // Calculate the new time
	//   console.log('seekBar value is: ', seekBar.value);
	//   var time = player.duration() * (seekBar.value / 100);

	//   // Update the video time
	//   document.getElementById('vid1').player.currentTime(time);
	  
	// });	

	function rangeSliderInitAndHideVideoControlBar(sliderStart,sliderEnd,sliderId,playerModal){
		


		console.log('type: ', sliderStart);
		var player = videojs(playerModal);
		player.controlBar.hide();

		var sliderStarttime,sliderEndtime;
		if(!!sliderStart){
			sliderStarttime = sliderStart;
			sliderEndtime = sliderEnd;
		}else{
			sliderStarttime = 0;
			sliderEndtime = 30;
		}

		
		var html5Slider = document.getElementById(sliderId);
		if(html5Slider.classList.length == 0){
			noUiSlider.create(html5Slider, {
				start: [ sliderStarttime, sliderEndtime ],
				connect: true,
				range: {
					'min': 0,
					'max': 100
				}
			});

			// html5Slider.noUiSlider.set([sliderStarttime, sliderEndtime]);
		}	
		$scope.starttime = 0;
		$scope.endtime = player.duration() * 0.3;

		//update video with seek-bar
		html5Slider.noUiSlider.on('update', function( values, handle ) {
			var value = values[handle];
			

			//right slider changed
			if ( handle ) {
				//inputNumber.value = value;
				$scope.endtime = player.duration() * (value / 100);
			} else {//left slider changed
				$scope.starttime = player.duration() * (value / 100);;
				var time = player.duration() * (value / 100);
				//select.value = Math.round(value);
				player.currentTime(time);

			}
			$timeout();
			//$scope.$apply();
		});	
	}
	
	


	
}]);


/*
*
*
*
*/