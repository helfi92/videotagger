app.controller('homeController',['$scope','$rootScope','Auth','$firebaseArray','$timeout','$sce','$http', function($scope,$rootScope,Auth,$firebaseArray,$timeout,$sce,$http){


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
			$scope.tagType = newVal;
			item.editingTag = false;
        }else if(columnNumber == 2){
        	$scope.starttime = timeAdapter(newVal);
        	item.editingStarttime = false;
        }else if(columnNumber == 3){
        	$scope.endtime = timeAdapter(newVal);
        	item.editingEndtime = false;
        }
        //$scope.updateTag(item.tag,item.chapter);
        $scope.updateTag();
    };

    function timeAdapter(str){
    	//var str = "80:67";
	    var splittedStr = str.split(":");

	    var minutesFactor = Math.floor(parseInt(splittedStr[0]) / 60);
	    var minutesRemainder = parseInt(splittedStr[0]) % 60;

	    var result = ((minutesFactor * 3600) + (minutesRemainder * 60)) + parseInt(splittedStr[1]);
	    return result;
    }



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
					$http.post('/initAnnotation', {}).then(function(response){
						console.log('post success:',response);
						setMarkersForVideo();		
					},function(err){
						console.log('post error: ', err);
					})

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
			sendAnnotations(object.starttime,object.endtime,object.annotation);
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

			sendAnnotations(starttime,endtime,annotation);

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
		//$scope.tagname = item.tag;
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
					chapter : $scope.tagType,
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

	function annotationsAdapter(str){
		//var str = "80:67";	    
	    var minutes = ""+ Math.floor(parseInt(str) / 60);
	    var seconds = ""+ parseInt(str) % 60;


	    if(minutes.length == 1){
	    	minutes = "0" + minutes;
	    }
	    if(seconds.length == 1){
	    	seconds = "0" + seconds;
	    }

	    var result =minutes + ":" + seconds + ".00" ;
	    return result;
	}

	function sendAnnotations(starttime,endtime,text){
		var dataObj = {
			starttime : starttime,
			endtime : endtime,
			text : text
		};
		console.log('startime: ', starttime);

		//dataObj.starttime = '00:08.00';
		dataObj.starttime = annotationsAdapter(starttime);
		//dataObj.endtime = '00:10.00';
		dataObj.endtime = annotationsAdapter(endtime);
		
		dataObj.text = '"' + text + '"';

		annotationsAdapter(dataObj);

		$http.post('/annotations', dataObj).then(function(response){
			console.log('post success:',response);
		},function(err){
			console.log('post error: ', err);
		})
	}


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


	//timeline


	var timelineObj = {
		videoLength : 0,
		width : 0
	}

	var tagTypes = ["fire","hello","boom"];
	var timelinesArray = [];

	var tagtypeTimelineRelation = {};

	var markersArray = {markersArray : []};

	for(var i = 0 ; i < 6 ; i++){
		timelinesArray.push([i,markersArray]);		
	}

	function addMarkerToTimeline(marker){
		
		if(tagtypeTimelineRelation[marker.markertype]){
			console.log(tagtypeTimelineRelation);
			var index = tagtypeTimelineRelation[marker.markertype];
			console.log('index: ', index);
			//timelinesArray.push[[index,timelinesArray[index].markersArray.push(marker)]];
			timelinesArray[index].markersArray.push(marker);
			return true;
			return tagtypeTimelineRelation[marker.markertype];
		}

		for(var i = 0 ; i < timelinesArray.length ; i++){
			if(!!!timelinesArray[i][1].markersArray.length){	
				timelinesArray[i][1].markersArray.push(marker);
								
				tagtypeTimelineRelation[marker.markertype] = i;
				// tagtypeTimelineRelation.push()
				return true;
			}else{
				if(!!timelinesArray[i][1].markersArray){
					var flag = false;
				

				
					for(var j = 0; j < timelinesArray[i][1].markersArray.length ; j++){
						if(isOverlappingAnExistingMarker(marker,timelinesArray[i][1].markersArray[j])){
							flag = true;
							break;
						}
					
					}
					if(flag == false){
						timelinesArray[i][1].markersArray.push(marker);
						
						tagtypeTimelineRelation[marker.markertype] = i;
						return true;
					}
				}
			}
		}
		return false;
	}
	
	

	var relation = {};
	for(var i = 0 ; i < tagTypes.length ; i++){
		if(relation[tagTypes[i]]){
				
		}else{
			console.log('not here');
			relation[tagTypes[i]] = i;
		}
		
	}

	console.log('relation: ', relation);


	function isOverlappingAnExistingMarker(markerSrc,existantMarker){
		if((markerSrc.starttime <= existantMarker.starttime && markerSrc.endtime >= existantMarker.starttime) || (existantMarker.starttime <= markerSrc.starttime && existantMarker.endtime >= markerSrc.starttime) ){
			return true;
		}else{
			return false;
		}
	}



	//maker object
	function Marker(starttime,endtime,markertype){
		this.starttime = starttime;
		this.endtime = endtime;
		this.markertype = markertype;
	}

	var markerArray = [];
	var colors = ["red","blue","green"];
	function generateRandomTags(numberOfTags,videoLength,maxTagTypes){
			

			var markerOne,
				markerTwo,
				markerThree;

			markerOne = new Marker(20,55,"1");
			markerTwo = new Marker(45,70,"2");
			markerThree = new Marker(200,210,"1");

			
			markerArray.push(markerOne);
			markerArray.push(markerTwo);
			markerArray.push(markerThree);


		
	}
	function timeToPixel(time){
		var conversion = ( time * timelineObj.width );
		conversion /= timelineObj.videoLength;
		return Math.floor(conversion);
	}

	function drawTagToTimeline(marker,timelineIndex){
		$timeout(function(){
			var c = document.getElementById("myCanvas");
			var ctx = c.getContext("2d");
			

			var x1,
				x2;
			x1 = timeToPixel(marker.starttime);
			x2 = timeToPixel(marker.endtime);

			console.log('x1: %d x2: %d',x1,x2);
			
			var markerLength = marker.endtime - marker.starttime;

			
			var y = 20 + (timelineIndex * 30);

			ctx.fillStyle = colors[2];

			ctx.fillRect(x1,y, x2 - x1, 20);
		
			ctx.fillStyle = "green";




		},2000);
	}


	function drawTimeline(){
	$timeout(function(){

		var c = document.getElementById("myCanvas");
		var ctx = c.getContext("2d");
		for(var i in markerArray){
			var curr = markerArray[i];

			drawTagToTimeline(curr,0);
		}
		ctx.fillStyle = "green";
		ctx.fillRect(15,20, 107,20);


		},2000);
	}

	const xTimelineOffset = 0;
	function initTimeline(){
		$timeout(function(){
		var canvas = document.createElement("canvas");
		canvas.id = "myCanvas";
		
		canvas.height = 210;
		canvas.width = videojs('vid1').player().width();

		canvas.style.cssText = "border:1px solid #d3d3d3;width:100%;";

		document.getElementById("timeline").appendChild(canvas);

		var ctx = canvas.getContext("2d");

		//Compute timeline dimensions
	 	const relativeTimelineSize = 1;
	  	timelineObj.width = (canvas.width * relativeTimelineSize) - xTimelineOffset;
	  	timelineObj.videoLength = videojs('vid1').player().duration();

	  	//Compute text dimensions
	  	const xTextOffset = canvas.width * (1.0 - relativeTimelineSize);

	  	//Set text style
	  	ctx.font="18px Arial";
	  	// ctx.fillText("Timeline 1:", xTextOffset, 36);
	  	// ctx.fillText("Timeline 2:", xTextOffset, 66);
	  	// ctx.fillText("Timeline 3:" ,xTextOffset, 96);
	  	// ctx.fillText("Timeline 4:", xTextOffset, 126);
	  	// ctx.fillText("Timeline 5:", xTextOffset, 156);
	  	// ctx.fillText("Timeline 6:", xTextOffset, 186);

	  	//Timeline bars
	  	ctx.fillStyle="#7d7a79";
	  	ctx.fillRect(xTimelineOffset, 20, timelineObj.width, 20);
	  	ctx.fillRect(xTimelineOffset, 50, timelineObj.width, 20);
	  	ctx.fillRect(xTimelineOffset, 80, timelineObj.width, 20);
	  	ctx.fillRect(xTimelineOffset, 110, timelineObj.width, 20);
	  	ctx.fillRect(xTimelineOffset, 140, timelineObj.width, 20);
	  	ctx.fillRect(xTimelineOffset, 170, timelineObj.width, 20);

	  	console.log('width: ', timelineObj.width);
	  	generateRandomTags(10,timelineObj.videoLength,4);
	  	for(var i = 0 ; i < markerArray.length ; i++ ){
	  		addMarkerToTimeline(markerArray[i]);
	  	}
	  	

	  },2000);
	}

	

	initTimeline();
	
	drawTimeline();


	








}]);






/*
*
*
*
*/