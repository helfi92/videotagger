app.controller('homeController',['$scope','$rootScope','Auth','$firebaseArray','$timeout','$sce', function($scope,$rootScope,Auth,$firebaseArray,$timeout,$sce){


  	var ref = new Firebase("https://flickering-heat-6138.firebaseio.com");
  	var refTag = ref.child('tag');
	var refChapters = ref.child('chapters');
	
	$scope.urlLink = '//www.youtube.com/watch?v=iQ4LJSxf3JE&feature=youtu.be.';
  	$scope.tag = $firebaseArray(refTag);
	$scope.tagTypes = [{
		name : '',
		cl : ''
	}];
	
	$scope.currentVideoTagList = [];
	
	$scope.tagType = {};
  	$scope.tagTypes = [];

  	$scope.tagsTable = {
		text : "Show Table",
		visibility : false,
	};




    $scope.doneEditing = function (item,newVal,columnNumber) {
        //dong some background ajax calling for persistence...
        console.log('done editing: ',item);
        if(columnNumber == 1){
			//$scope.tagname = newVal;
			$scope.chapter = newVal;
			item.editingTag = false;
        }else if(columnNumber == 2){
        	$scope.starttime = newVal;
        	item.editingStarttime = false;
        }else if(columnNumber == 3){
        	$scope.endtime = newVal;
        	item.editingEndtime = false;
        }
        //$scope.updateTag(item.tag,item.chapter);
        $scope.updateTag();

    };

	$scope.toggleTagsTable = function(){
		$scope.tagsTable.visibility = !$scope.tagsTable.visibility;
		if($scope.tagsTable.visibility == true){
			$scope.tagsTable.text = "Hide Table";
		}else{
			$scope.tagsTable.text = "Show Table";
		}
	}

  	$scope.trustAsHtml = function(value) {
	  return $sce.trustAsHtml(value);
	};


	$scope.refreshTagSearchResults = function($select){
	 var search = $select.search,
	   list = angular.copy($select.items), 
	   FLAG = -1;

	 //remove last user input
     list = list.filter(function(item) { 
      	return item.id !== FLAG; 
     });

	 if (!search) {
	   //use the predefined list
	   $select.items = list;
	 }
	 else {	 
	   //manually add user input and set selection
	   var userInputItem = {
	     id: FLAG, 
	     name: search
	   };
	   $select.items = [userInputItem].concat(list);
	   $select.selected = userInputItem;
	 }
	}

	
	function setTagTypes(){
	
		$timeout(function(){
			videojs("vid1").ready(function(){
				
				refTag.on('value',function(snapshot){
					var refChapterIndex = 0;
					setCurrentVideoTagList(snapshot);
					$scope.tagTypes=[];
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
						if(!$scope.tagTypes.length || checkForDuplicate($scope.tagTypes,$scope.currentVideoTagList[i].chapter)){
					    	$scope.tagTypes.push({name : $scope.currentVideoTagList[i].chapter, cl : "" + refChapterIndex});
					    	//$scope.tagTypes[refChapterIndex].cl = "" + refChapterIndex;
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
	    	for(var j = 0 ; j < $scope.tagTypes.length ; j++){
				if(object.chapter == $scope.tagTypes[j].name){
					var classColor = "color" + $scope.tagTypes[j].cl;
					break;
				}
			}
			var time = object.starttime;
			var goTotime = time;
			
			//var tagName = object.tag;
			var tagType = object.chapter;

			var player = videojs('vid1');
			player.markers.add([{ 
				time: goTotime, 
				//text: tagName,
				text : tagType,
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
			
			setTagTypes();
			
		});
	};
			
	$scope.addTagOnClick = function(){
		var player = videojs('vid1');
		$scope.addOptions = {
			tagType : '',
			tagname : '',
			starttime : 0,
			endtime : player.duration() * 0.3
		};
		rangeSliderInit();
		showAddTagView = true;
		$("#create-tag").css("display","initial")
	}
	function isExistantType(name){
		for (var i = 0 ; i < $scope.tagTypes.length ; i++){
			if( name == $scope.tagTypes[i].name){
				return false;
			}
		}
		return true;
	}
	$scope.addTag = function(tagType,tag,starttime,endtime,link,annotation){
			if(isExistantType(tagType.name)){
				$scope.addTagType(tagType.name);
			}
			var dataObj = {
				link : link,
				annotation : annotation,
				chapter : tagType.name,
				//tag : tag,
				starttime : starttime,
				endtime : endtime
			}
			$scope.tag.$add(dataObj);
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
			}
		});
	}
	
	$scope.editTag = function(item,columnNumber){
		if(columnNumber == 1){
			item.editingTag = true;
		}else if(columnNumber == 2){
			item.editingStarttime = true;
		}else if(columnNumber == 3){
			item.editingEndtime = true;
		}
		console.log(item);
		$scope.currentTagOnEdit = item;

		$scope.tagType = item.chapter;
		$scope.tagname = item.tag;
		$scope.starttime = item.starttime;
		$scope.endtime = item.endtime;
		$scope.annotation = item.annotation;
		
	}
	$scope.updateTag = function(){
		refTag.on('child_added',function(snapshot){
			if(snapshot.val().link == $scope.currentTagOnEdit.link && snapshot.val().starttime == $scope.currentTagOnEdit.starttime && snapshot.val().endtime == $scope.currentTagOnEdit.endtime ){
				snapshot.ref().update({
					link : $scope.urlLink,
					annotation : $scope.annotation,
					chapter : $scope.chapter,
					//tag : $scope.tagname,
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

	$scope.addTagType = function(tagType){
		//will push a chapter tempoparily until a user successfully creates a tag
		//a temporary chapter is added for dropdown chapter visibility purposes
		//$scope.tagTypes.push({name : tagtype});
		$scope.tagTypes.push(tagType);
	};

	var init = function(){
		videojs('vid1', {

	        plugins: {
	          // ass: {
	          //   'src': ["assets/annotation/caption.ass"]
	          // }
	        },

	    });

		videojs('vid1').ass({ src: "assets/annotation/caption.ass" });


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

	init();

	var refChapterIndex = 0;
	
	setTagTypes();

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
	
	function rangeSliderInit(){
		var player = videojs('vid1');
		var html5Slider = document.getElementById('slider');
		noUiSlider.create(html5Slider, {
			start: [ 0, 30 ],
			connect: true,
			range: {
				'min': 0,
				'max': 100
			}
		});
		html5Slider.noUiSlider.on('update', function( values, handle ) {
			var value = values[handle];
		
			//right slider changed
			if ( handle ) {
				//inputNumber.value = value;
				$scope.addOptions.endtime = player.duration() * (value / 100);
			} else {//left slider changed
				$scope.addOptions.starttime = player.duration() * (value / 100);;
				var time = player.duration() * (value / 100);
				//select.value = Math.round(value);			
				player.currentTime(time);
			}
			$timeout();
		});	
	}
}]);


/*
*
*
*
*/