app.controller('homeController',['$scope','$rootScope','Auth','$firebaseArray','$timeout', function($scope,$rootScope,Auth,$firebaseArray,$timeout){

  	var ref = new Firebase("https://flickering-heat-6138.firebaseio.com");
  	var refLink = ref.child('link');
  	var refTag = ref.child('tag');
	var refChapters = ref.child('chapters');

	

  	$scope.messages = $firebaseArray(refLink);
  	$scope.tag = $firebaseArray(refTag);
	$scope.chapters = $firebaseArray(refChapters);
	$scope.chaptersInObject = [];
	
	refChapters.on('child_added',function(snapshot){
		console.log('all is: ', snapshot.val())
		$scope.chaptersInObject.push(snapshot.val());
	})

	$scope.goButtonClicked = function(url){
		console.log('go button clicked');
		angular.element(document.querySelector('#vid1'))[0].player.src(url);
	};
	
	$scope.writeLinkToDatabase = function(url){
			if($rootScope.user){
				$scope.messages.$add({
				url : url,
				});
			}else{
				console.log('Not logged in, cant write to database');
			}		
	};
	$scope.addTag = function(chapter,tag,starttime,endtime){
			//if($rootScope.user){
				$scope.tag.$add({
				chapter : chapter,
				tag : tag,
				starttime : starttime,
				endtime : endtime
				});
			// }else{
			// 	console.log('Not logged in, cant write to database');
			// }	
	}
	$scope.setCurrentTime = function(time){
		var strTimeArray = time.split(":");
		var seconds = parseInt(strTimeArray[0],10) * 60;
		var ms = parseInt(strTimeArray[1],10);


		var goTotime = seconds + ms;
		console.log('timeInms: ', goTotime);
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
	        }
	      });
	}
	$scope.init();

	
	

}]);


/*
*
*
*
*/