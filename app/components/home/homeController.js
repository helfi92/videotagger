app.controller('homeController',['$scope','$rootScope','Auth','$firebaseArray','$timeout', function($scope,$rootScope,Auth,$firebaseArray,$timeout){


  	var ref = new Firebase("https://flickering-heat-6138.firebaseio.com");
  	var refTag = ref.child('tag');
	var refChapters = ref.child('chapters');
	
	$scope.urlLink = '//www.youtube.com/watch?v=oAtjf6Ijmtw';
  	$scope.tag = $firebaseArray(refTag);
	$scope.chaptersInObject = [{
		name : '',
		cl : ''
	}];
	
	$scope.currentVideoTagList = [];

	
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
			var goTotime = stringToMilliseconds(time);
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
		angular.element('#editTagModal').modal()
	}
	$scope.updateTag = function(){
		refTag.on('child_added',function(snapshot){
			console.log('item is : ', $scope.currentTagOnEdit);
			console.log('child added is: ', snapshot.val());
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
	
	$scope.fastForwardTo = function(time){
		var goTotime = stringToMilliseconds(time);
		
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

	
}]);


/*
*
*
*
*/