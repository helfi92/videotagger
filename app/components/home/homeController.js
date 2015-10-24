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
				var refChapterIndex = 0;
				refTag.on('value',function(snapshot){
					var object = snapshot.val();
					console.log('setChapters : ', object);
					setCurrentVideoTagList(snapshot);
					$scope.chaptersInObject=[];
					snapshot.forEach(function(childSnapshot) {
					    console.log('child: ', childSnapshot.val().chapter);
					    
					    //do not add duplicate chapters
					    var checkForDuplicate = function(object,str){
							for(var i = 0 ; i < object.length ; i++){
								if(object[i].name == str){
									return false;
								}
							}
							return true;
						} 
					    if(!$scope.chaptersInObject.length || checkForDuplicate($scope.chaptersInObject,childSnapshot.val().chapter)){
					    	$scope.chaptersInObject.push({name : childSnapshot.val().chapter});
					    	$scope.chaptersInObject[refChapterIndex].cl = "" + refChapterIndex;
					    	refChapterIndex++;
					    }					    					

					 //    $scope.chaptersInObject.push(childSnapshot.val());
						// $scope.chaptersInObject[refChapterIndex].cl = "" + refChapterIndex;
						// refChapterIndex++;
					});
					
					
					setMarkersForVideo();
					refChapterIndex = 0;
				});
			});
			console.log('boom',$scope.chaptersInObject);
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
	$scope.removeTag = function(item){
		$scope.tag.$remove(item);
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