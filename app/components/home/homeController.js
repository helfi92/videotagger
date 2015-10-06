app.controller('homeController',['$scope','$rootScope','Auth','$firebaseArray','$timeout', function($scope,$rootScope,Auth,$firebaseArray,$timeout){


  	var ref = new Firebase("https://flickering-heat-6138.firebaseio.com");
  	var refTag = ref.child('tag');
	var refChapters = ref.child('chapters');
	var refLink = ref.child('link');
	
	$scope.urlLink = '//www.youtube.com/watch?v=oAtjf6Ijmtw';
  	$scope.messages = $firebaseArray(refLink);
  	$scope.tag = $firebaseArray(refTag);
	$scope.chapters = $firebaseArray(refChapters);
	$scope.chaptersInObject = [];
	
	
	var refChapterIndex = 0;
	refChapters.on('value',function(snapshot){
		snapshot.forEach(function(childSnapshot) {
		    $scope.chaptersInObject.push(childSnapshot.val());
			$scope.chaptersInObject[refChapterIndex].cl = "" + refChapterIndex;
			refChapterIndex++;
		});
		setMarkersForVideo();
		refChapterIndex = 0;
	});

	function setMarkersForVideo(){
		// This is for the when you first open the window, the default video shown
		refTag.on('child_added',function(childSnapShot){
			
			//if the snap has the same url, add the marker
			var player = videojs('vid1');
			var object = childSnapShot.val();
			for(var i = 0 ; i < $scope.chaptersInObject.length ; i++){
				if(object.chapter == $scope.chaptersInObject[i].name){
					var classColor = "color" + $scope.chaptersInObject[i].cl;
					break;
				}
			}
			if(object.link == $scope.urlLink){

				var time = object.starttime;
				var goTotime = stringToMilliseconds(time);
				var tagName = object.tag;

				
				player.markers.add([{ 
					time: goTotime, 
					text: tagName,
					class: "" + classColor
				}]);
				//change color css through index


			}else{
			}
		});
	}	

	$scope.goButtonClicked = function(url){
		var player = videojs('vid1');
		player.src(url);
		player.bigPlayButton.show();
		
		player.markers.removeAll();

		refTag = "";
		refTag = ref.child('tag');

		refTag.on('child_added',function(childSnapShot){
		
		//if the snap has the same url, add the marker
		var object = childSnapShot.val();
		if(object.link == $scope.urlLink){
			var time = object.starttime;
			var goTotime = stringToMilliseconds(time);

			var tagName = object.tag;
			player.markers.add([{ time: goTotime, text: tagName}]);
		}else{
		}
		

		});

	};
	
	$scope.writeLinkToDatabase = function(url){
			//if($rootScope.user){
				$scope.messages.$add({
				url : url,
				});
			//}else{
				console.log('Not logged in, cant write to database');
			//}		
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

	function stringToMilliseconds (time){
		var strTimeArray = time.split(":");
		var seconds = parseInt(strTimeArray[0],10) * 60;
		var ms = parseInt(strTimeArray[1],10);


		var goTotime = seconds + ms;
		return goTotime;
	}
	
	$scope.setCurrentTime = function(time){
		var goTotime = stringToMilliseconds(time);
		
		document.getElementById('vid1').player.currentTime(goTotime);
	}

	$scope.addChapter = function(chapter){
		
		$scope.chapters.$add({
			name : chapter
		});

	};

	



	
	

	

	$scope.init = function(){
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
	$scope.init();

	

}]);


/*
*
*
*
*/