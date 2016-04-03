app.controller('homeController',['$scope','$rootScope','Auth','$firebaseArray','$timeout','$sce','$http', function($scope,$rootScope,Auth,$firebaseArray,$timeout,$sce,$http){


  	var ref,
  		refTag,
  		ref_generation_requests;

  	var initFirebase = (function initFirebase(){
		ref = new Firebase("https://flickering-heat-6138.firebaseio.com");
		refTag = ref.child('tag');
		ref_generation_requests = ref.child('tag-generation-request');
		
		$scope.tag = $firebaseArray(refTag);

		getListOfRequests(getMyRequests);
	}());

	var Auth = Auth;
	$scope.urlLink = 'https://www.youtube.com/watch?v=iQ4LJSxf3JE&feature=youtu.be.'; //https://www.youtube.com/watch?v=UiyDmqO59QE;
	$scope.tagTypes = [{
		name : '',
		cl : ''
	}];

	
	$scope.currentVideoTagList = [];
	$scope.requestsList = [];
	$scope.myRequests = [];
	$scope.tagType = {};
  	$scope.tagTypes = [];

  	$scope.tagsTable = {
		text : "Show Table",
		visibility : false,
	};

    	
    function getListOfRequests(callback){
		$scope.requestsList = [];
		ref_generation_requests.on('value',function(snapshot){

			$timeout(function(){
				$scope.requestsList = snapshot.val();
				callback();
			});

			
		});

	}

	function getMyRequests(){
		var email = $rootScope.user.password.email;
		for( var i = 0 in $scope.requestsList){
			if($scope.requestsList[i].user_email == email){
				$scope.myRequests.push($scope.requestsList[i]);
			}
		}
		$timeout();
	}

    $scope.doneEditing = function (item,newVal,columnNumber) {
        //dong some background ajax calling for persistence...
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
        $scope.updateTag();
    };

    $scope.myRequestsOnClick = function(elem){
    	
    	if(!!!$scope.requireAuth()){
			return false;
		}
    	
    	var elem = document.getElementById("my-request-view");
		if(elem.style.display == "none"){
			elem.style.display = "block";
			document.getElementById("my-request-btn").innerText = "Hide your Requests"
		}else{
			elem.style.display = "none";
			document.getElementById("my-request-btn").innerText = "My Requests"
		}

    }

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
	function addDefaultTags(){
		$http.get("assets/json/defaultTags.json").then(function(data){
			var type_nbr = data.data;
			console.log('default tags: ', type_nbr);
			for(var i = 0 in type_nbr){
				$scope.tagTypes.push(type_nbr[i]);
			}
		});
	
	}

	function setTagTypes(){
		
		$timeout(function(){
			$scope.tagTypes = [];
			addDefaultTags();
			videojs("vid1").ready(function(){
				
				refTag.on('value',function(snapshot){
					var refChapterIndex = 0;
					setCurrentVideoTagList(snapshot);
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
		});
	}

	function setCurrentVideoTagList(object){
		$scope.currentVideoTagList = [];
		object.forEach(function(childSnapshot) {
		    if(childSnapshot.val().link == $scope.urlLink){
		    	$scope.currentVideoTagList.push(childSnapshot.val());
		    }
		    
		});
		$timeout(initTimeline);
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

	function validateUrl(url){
		if(url.indexOf("youtube") > -1){
			return "youtube";
		}else if(url.indexOf("vimeo") > -1){
			return "vimeo";
		}else{
			alert('We only support YouTube and Vimeo videos for now');
			return null;
		}
	}

	$scope.goButtonClicked = function(url){
		
		var valUrl = validateUrl(url);

		videojs("vid1").ready(function(){
			var player = videojs('vid1');
			player.src(url);
			player.bigPlayButton.show();
			
			player.markers.removeAll();
			player.play();
			// timer to give player time to refresh its player duration
			$timeout(function(){
				setTagTypes();

			},1000);
				
		});
	};
	
	function videoTimeInPercentage(time){
		var player = videojs('vid1');

		return player.currentTime() / player.duration() * 100; 
	}

	$scope.addTagOnClick = function(){
		var player = videojs('vid1'),
			sliderEndInit,
			sliderStartInit;
		
		$scope.addOptions = {
			tagType : '',
			tagname : '',
			starttime : 0,
			endtime : player.duration() * 0.3
		};
		
		if(videoTimeInPercentage(player.currentTime()) + 30 < 100){
			sliderEndInit = parseInt(videoTimeInPercentage(player.currentTime()) + 30, 10);
		}else{
			sliderEndInit = parseInt(100,10);
		}
		sliderStartInit = videoTimeInPercentage(player.currentTime());

		rangeSliderInit('vid1','slider',sliderStartInit,sliderEndInit);
		showAddTagView = true;
		$("#create-tag").css("display","initial");
		document.getElementById("timeline").style.display = "none";
	}

	function isExistantType(name){
		for (var i = 0 ; i < $scope.tagTypes.length ; i++){
			if( name == $scope.tagTypes[i].name){
				return false;
			}
		}
		return true;
	}

	$scope.addTag = function(tagType,starttime,endtime,link,annotation){
			
			if(!!!$scope.requireAuth()){
				return false;
			}

			if(isExistantType(tagType.name)){
				$scope.addTagType(tagType.name);
			}

			var dataObj = {
				link : link,
				annotation : annotation ? annotation : "",
				chapter : tagType.name,
				//tag : tag,
				starttime : starttime,
				endtime : endtime
			}

			if(!isTagAlreadyExistant(dataObj)){
				sendAnnotations(starttime,endtime,annotation);

				$scope.tag.$add(dataObj);

				addMarkerToTimeline(dataObj);
			}else{
				alert('The added tag seems to be already existant');
			}
			

			
			$scope.hideAddTag();
			document.getElementById("timeline").style.display = "block";
	}

	$scope.hideAddTag = function(){
		document.getElementById("create-tag").style.display = "none";
		document.getElementById("timeline").style.display = "block";
	};

	$scope.removeTag = function(item,index){
		
		if(!!!$scope.requireAuth()){
			return false;
		}
		$scope.currentVideoTagList.splice(index,1);
		refTag.on('child_added',function(snapshot){
			if(snapshot.val().link == item.link && snapshot.val().starttime == item.starttime && snapshot.val().endtime == item.endtime ){
				snapshot.ref().remove();
			}
		});


		drawCanvasBackground();
	  	drawTagsOnCanvas(); 

		return true;
	}
	
	$scope.editTag = function(item,columnNumber){
		
		if(!!!$scope.requireAuth()){
			return false;
		}

		if(columnNumber == 1){
			item.editingTag = true;
		}else if(columnNumber == 2){
			item.editingStarttime = true;
		}else if(columnNumber == 3){
			item.editingEndtime = true;
		}
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

		//dataObj.starttime = '00:08.00';
		dataObj.starttime = annotationsAdapter(starttime);
		//dataObj.endtime = '00:10.00';
		dataObj.endtime = annotationsAdapter(endtime);
		
		dataObj.text = '"' + text + '"';

		annotationsAdapter(dataObj);

		$http.post('/annotations', dataObj).then(function(response){
			//console.log('post success:',response);
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
		setTagTypes();

	}

	$timeout(init);
	
	var refChapterIndex = 0;
	
	function rangeSliderInit(playerId,sliderId,start_nbr,end_nbr){
		var player = videojs(playerId);
		var html5Slider = document.getElementById(sliderId);
		
		if(!!html5Slider.childElementCount){
			html5Slider.noUiSlider.set([start_nbr, end_nbr]);
			return;
		}

		var start,
			end;

		if(start_nbr != null){
			start = start_nbr;
		}else{
			start = 0;
		}
		if(end_nbr != null){
			end = end_nbr;
		}else{
			end = player.duration();
		}

		noUiSlider.create(html5Slider, {
			start: [ start, end ],
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
		width : 0,
		relativeTimelineSize : 1
	}

	const TIMELINE_HEIGHT = 20; 
	var tagTypes = ["fire","hello","boom"];
	var timelinesArray = [];
	var markerMap = {};

	

	var populateMarkersArray = function(){
		timelinesArray = [];
		for(var i = 0 ; i < 6 ; i++){
			var markersArray = {markersArray : []};
			timelinesArray.push([i,markersArray]);		
		}
	};
	
	populateMarkersArray();

	//maker object
	function Marker(starttime,endtime,markertype){
		this.starttime = starttime;
		this.endtime = endtime;
		this.chapter = markertype;
	}

	function isTagAlreadyExistant(marker){
		for(var i = 0 ; i < $scope.currentVideoTagList.length ; i++){
			var existantMarker = $scope.currentVideoTagList[i];
			if(parseInt(existantMarker.starttime,10) == parseInt(marker.starttime,10) && parseInt(existantMarker.endtime,10) == parseInt(marker.endtime, 10) && existantMarker.chapter == marker.chapter){
				return true;
			}
		}
		return false;
	}

	function addMarkerToTimeline(marker){	
		var value = markerMap[marker.chapter.toString()];
		if (!(value === undefined)){
			// if(!isTagAlreadyExistant(marker, value)){
			timelinesArray[value][1].markersArray.push(marker);
			drawTagToTimeline(marker, value);	
			// }else{
			// 	alert('The added tag seems to be already existant');
			// }
			
			return;
		}

		for (var i = 0; i < timelinesArray.length; i++){
			if (timelinesArray[i][1].markersArray.length == 0){
				timelinesArray[i][1].markersArray.push(marker);					
				markerMap[marker.chapter.toString()] = i;
				drawTagToTimeline(marker, i);

				return;
			}
		}

		var tagOverlaps = new Array(6);
		for (var i = 0; i < timelinesArray.length; i++){
			if (timelinesArray[i][1].markersArray.length == 0){	
				timelinesArray[i][1].markersArray.push(marker);					
				markerMap[marker.chapter.toString()] = i;
				drawTagToTimeline(marker, i);
			
				return;
			}
			else{
				tagOverlaps[i] = false;
				for (var j = 0; j < timelinesArray[i][1].markersArray.length; j++)
				{
					
					if (isOverlappingAnExistingMarker(marker,timelinesArray[i][1].markersArray[j]))
					{
						tagOverlaps[i] = true;
						break;
					}
				}
			}
		}

		var index = getTimelineIndexWithLessTagsAndNoOverlapping(tagOverlaps)
		if (index != -1){
			timelinesArray[index][1].markersArray.push(marker);			
			markerMap[marker.chapter.toString()] = index;
			drawTagToTimeline(marker, index);

			return;
		}

		// The new marker overlaps in all timelines. Add it to the timeline that has less tags
		index = getTimelineIndexWithLessTags();
		timelinesArray[index][1].markersArray.push(marker);			
		markerMap[marker.chapter.toString()] = index;
		drawTagToTimeline(marker, index);
	}

	function getTimelineIndexWithLessTagsAndNoOverlapping(tagOverlaps)
	{
		var index = -1;
		var numberOfTags = -1;
		for (var i = 0; i < timelinesArray.length; i++){
			if (tagOverlaps[i] == false){
				if (index == -1){
					index = i;
					numberOfTags = timelinesArray[index][1].markersArray.length;
				}

				if (timelinesArray[i][1].markersArray.length < numberOfTags){
					index = i;
				}
			}
		}

		return index;
	}

	function getTimelineIndexWithLessTags(){
		var index = 0;
		var numberOfTags = timelinesArray[index][1].markersArray.length;
		for (var i = 1; i < timelinesArray.length; i++){
			if (timelinesArray[i][1].markersArray.length < numberOfTags)
			{
				index = i;
			}
		}

		return index;
	}

	var relation = {};
	for(var i = 0 ; i < tagTypes.length ; i++){
		if(relation[tagTypes[i]]){
				
		}else{
			relation[tagTypes[i]] = i;
		}
		
	}

	function isOverlappingAnExistingMarker(markerSrc,existantMarker){
		if((markerSrc.starttime <= existantMarker.starttime && markerSrc.endtime >= existantMarker.starttime) || (existantMarker.starttime <= markerSrc.starttime && existantMarker.endtime >= markerSrc.starttime) ){
			return true;
		}else{
			return false;
		}
	}

	var markerArray = [];
	function generateRandomTags(numberOfTags){
		// for (var i = 0; i < numberOfTags; i++){
		// 	var startTime = Math.floor(Math.random() * timelineObj.videoLength);
		// 	var length = Math.floor((Math.random() * 20) + 1);
		// 	var tagTypeIndex = Math.floor(Math.random() * 10);

		// 	if (startTime > 40){
		// 		startTime -= 25;
		// 	}

		// 	if (tagTypeIndex == 10){
		// 		tagTypeIndex = 9;
		// 	}

		// 	//marker = new Marker(startTime, startTime + length, "Tag" + tagTypeIndex);

		// 	marker = {
		// 		annotation : 'bot',
		// 		chapter : {
		// 			name : "Tag" + tagTypeIndex
		// 		},
		// 		endtime : startTime + length,
		// 		link : $scope.urlLink,
		// 		starttime : startTime
		// 	}

		// 	// $scope.addTag(marker.chapter,marker.starttime,marker.endtime,marker.link,marker.annotation);

		// 	markerArray.push(marker);

		// }
		markerArray = $scope.currentVideoTagList;
	}

	function timeToPixel(time){
		var conversion = ( time * timelineObj.width );
		conversion /= timelineObj.videoLength;
		return Math.floor(conversion);
	}

	function drawTagToTimeline(marker,timelineIndex){
		var c = document.getElementById("myCanvas");
		var ctx = c.getContext("2d");
		var x1 = 0;
		var	x2 = 0;
		x1 = timeToPixel(marker.starttime);
		x2 = timeToPixel(marker.endtime);
		
		var markerLength = marker.endtime - marker.starttime;
		var y = 20 + (timelineIndex * 30);

		// -------------------------------- DEBUG only. Delete me ------------------------------
		var color = 0;
		// -------------------------------------------------------------------------------------

		//find index in 
		var colorIndex = 0;
		for(var i  = 0 ; i < $scope.tagTypes.length ; i++){
			if(marker.chapter == $scope.tagTypes[i].name){
				colorIndex = $scope.tagTypes[i].cl;
				color = "color"+colorIndex;
				break;
			}
		}
		//ctx.fillStyle = colors[colorIndex];
		var colorClass = "";
		for(var i = 0; i < document.styleSheets.length ; i++){
			if(!!document.styleSheets[i].href && (document.styleSheets[i].href).indexOf("colors.css") > -1){					
				colorClass = document.styleSheets[i].rules || document.styleSheets[i].cssRules;
				break;
			}
		}

		ctx.globalCompositeOperation = "source-over";
		
		ctx.fillStyle = colorClass[colorIndex].style.backgroundColor;
		ctx.fillRect(x1,y, x2 - x1, 20);
		ctx.fillStyle = "green";
	}

	function getClickedTimelineIndex(y){
		for (var i = 0; i < timelinesArray.length; i++)
		{
			var timelineYCoordinate = TIMELINE_HEIGHT + (i * 30);

			if (timelineYCoordinate <= y && (timelineYCoordinate + TIMELINE_HEIGHT) >= y)
			{
				return i;
			}
		}

		return -1;
	}

	function getTimeFromPixels(x){
		var conversion = x * timelineObj.videoLength;
		conversion /= timelineObj.width;
		return Math.floor(conversion);
	}

	function getMarker(time, timelineIndex){
		for (var i = 0; i < timelinesArray[timelineIndex][1].markersArray.length; i++)
		{
			var marker = timelinesArray[timelineIndex][1].markersArray[i];

			if (marker.starttime <= time && marker.endtime >= time)
			{
				//return marker.starttime;
				// return the marker for now to debug.
				return marker;
			}
		}

		return -1;
	}

	function canvasOnClick(evt, canvasBoundingRect){
		var c = document.getElementById("myCanvas");
		var rect = c.getBoundingClientRect();

		var x = evt.clientX - rect.left
		var y = evt.clientY - rect.top

		var index = getClickedTimelineIndex(y);

		if (index != -1){
			var time = getTimeFromPixels(x);
			var markerObj = getMarker(time, index);

			var player = videojs('vid1');
			player.player().currentTime(markerObj.starttime);

		}
			
	}

	const xTimelineOffset = 0;
	function initTimeline(){
		var canvas;
		if(!document.getElementById('myCanvas')){
			canvas = document.createElement("canvas");
		}else{
			canvas = document.getElementById('myCanvas');
		}
		 
		canvas.id = "myCanvas";
		
		canvas.height = 210;
		canvas.width = videojs('vid1').player().width();
		canvas.style.cssText = "border:1px solid #d3d3d3;";

		document.getElementById("timeline").appendChild(canvas);


		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		// Set listener
		canvas.addEventListener('mousedown', function(evt) { canvasOnClick(evt, canvas.getBoundingClientRect()); }, false);

		//Compute timeline dimensions
	  	timelineObj.width = (canvas.width * timelineObj.relativeTimelineSize) - xTimelineOffset;
	  	
	  	// Not working!
	  	timelineObj.videoLength = videojs('vid1').player().duration();
	  	//timelineObj.videoLength = 266;
		 
	  	generateRandomTags(20);
	  	for(var i = 0 ; i < markerArray.length ; i++ ){
	  		addMarkerToTimeline(markerArray[i]);
	  	}

	  	drawCanvasBackground();
	  	drawTagsOnCanvas(); 
	}

	function FormatTimeString(timeInSeconds)
	{
		var hours   = Math.floor(timeInSeconds / 3600);
	    var minutes = Math.floor((timeInSeconds - (hours * 3600)) / 60);
	    var seconds = timeInSeconds - (hours * 3600) - (minutes * 60);

	    if (hours   < 10)
	    {
	    	hours   = "0"+hours;
	    }

	    if (minutes < 10)
	    {
	    	minutes = "0"+minutes;
	    }
	    

	    if (seconds < 10) 
	    {
	    	seconds = "0"+seconds;
	    }

	    var time    = hours+':'+minutes+':'+seconds;

	    return time;
	}

	function drawCanvasBackground(){
		var canvas,
			ctx; 

		canvas = document.getElementById('myCanvas');
		ctx = canvas.getContext("2d");

		
		var canvas_height = {			
			one : 35,
			two : 70,
			three : 105,
			four : 140,
			five : 175,
			six : 210,
			selected : null
		};

	  	//Compute text dimensions
	  	const xTextOffset = canvas.width * (1.0 - timelineObj.relativeTimelineSize);

		//Timeline bars
	  	if(timelinesArray[0][1].markersArray.length > 0){
	  		canvas_height.selected = canvas_height.one;
	  	}
	  	if(timelinesArray[1][1].markersArray.length > 0){
	  		canvas_height.selected = canvas_height.two;
	  	}
	  	if(timelinesArray[2][1].markersArray.length > 0){
	  		canvas_height.selected = canvas_height.three;
	  	}
	  	if(timelinesArray[3][1].markersArray.length > 0){
	  		canvas_height.selected = canvas_height.four;
	  	}
	  	if(timelinesArray[4][1].markersArray.length > 0){
	  		canvas_height.selected = canvas_height.five;
	  	}
	  	if(timelinesArray[5][1].markersArray.length > 0){
	  		canvas_height.selected = canvas_height.six;
	  	}

	  	canvas.height = canvas_height.selected;

	  	// Compute time coordinates
	  	var time1 = Math.floor(timelineObj.videoLength * 0.25);
	  	var time2 = Math.floor(timelineObj.videoLength * 0.5);
	  	var time3 = Math.floor(timelineObj.videoLength * 0.75);

	  	var time1XCoordinates = canvas.width * 0.25
	  	var time2XCoordinates = canvas.width * 0.5
	  	var time3XCoordinates = canvas.width * 0.75

	  	var formattedTime1 = FormatTimeString(time1);
	  	var formattedTime2 = FormatTimeString(time2);
	  	var formattedTime3 = FormatTimeString(time3);

	  	// Add time on top of multi-timeline view
	  	const TimeHeight = 12
	  	const timeXOffSet = 20;
	  	ctx.font = "11px Arial";
	  	ctx.fillText(formattedTime1, time1XCoordinates - timeXOffSet, TimeHeight);
		ctx.fillText(formattedTime2, time2XCoordinates - timeXOffSet, TimeHeight);
		ctx.fillText(formattedTime3, time3XCoordinates - timeXOffSet, TimeHeight);

	  	// Draw time indicator
	  	ctx.fillRect(time1XCoordinates - 2, TimeHeight + 2, 4, 6); 
	  	ctx.fillRect(time2XCoordinates - 2, TimeHeight + 2, 4, 6); 
	  	ctx.fillRect(time3XCoordinates - 2, TimeHeight + 2, 4, 6); 

	  	ctx.fillStyle="#7d7a79";
	  	ctx.globalCompositeOperation='destination-over';
	  	if(timelinesArray[0][1].markersArray.length > 0){
	  		ctx.fillRect(xTimelineOffset, 20, timelineObj.width, TIMELINE_HEIGHT);		
	  	}
	  	if(timelinesArray[1][1].markersArray.length > 0){
	  		ctx.fillRect(xTimelineOffset, 50, timelineObj.width, TIMELINE_HEIGHT);
	  	}
	  	if(timelinesArray[2][1].markersArray.length > 0){
	  		ctx.fillRect(xTimelineOffset, 80, timelineObj.width, TIMELINE_HEIGHT);
	  	}
	  	if(timelinesArray[3][1].markersArray.length > 0){
	  		ctx.fillRect(xTimelineOffset, 110, timelineObj.width, TIMELINE_HEIGHT);
	  	}
	  	if(timelinesArray[4][1].markersArray.length > 0){
	  		ctx.fillRect(xTimelineOffset, 140, timelineObj.width, TIMELINE_HEIGHT);
	  	}
	  	if(timelinesArray[5][1].markersArray.length > 0){
	  		ctx.fillRect(xTimelineOffset, 170, timelineObj.width, TIMELINE_HEIGHT);
	  	}
	}

	function drawTagsOnCanvas(){
		for(var i = 0 in $scope.currentVideoTagList){
			addMarkerToTimeline($scope.currentVideoTagList[i]);
		}
	}


	$scope.roiController = (function(){
		var video,
			playing,
			initialX,
			initialY,
			iX,
			iY,
			pX,
			pY,
			time,
			video_url,
			user_email,
			data,
			cv_type, 
			sampling_rate, 
			start_time, 
			end_time, 
			hsv_direction, 
			surf_option;
		

		return {
			//slider function for event
			initSlider : function(){
				var player = videojs('vid1'),
				sliderEndInit,
				sliderStartInit;

				if (videoTimeInPercentage(player.currentTime()) + 30 < 100){
					sliderEndInit = parseInt(videoTimeInPercentage(player.currentTime()) + 30, 10);
				} else {
					sliderEndInit = parseInt(100,10);
				}

				sliderStartInit = videoTimeInPercentage(player.currentTime());

				rangeSliderInit('vid1','slider2',sliderStartInit,sliderEndInit);
			},

			offset : function(type){
			    var offset = $("#vid1").offset();

			    if (type == "top") {
			        return offset.top;
			    } else if (type == "left") {
			        return offset.left;
			    } else {
			        return "";
			    }
			},

			submit : function(){
			    if(!!!$scope.requireAuth()){
					return false;
				}
			    video = videojs("vid1").player();
			    user_email = $rootScope.user.password.email;
			    video_url = video.src();
			    
			    cv_type = $("#sel1 :selected").val();
			    sampling_rate = $("#sel2 :selected").val();

			    start_time = $("#sel3 :selected").text();
			    end_time = $("#sel3 :selected").text();

			    hsv_direction = $("#sel4 :selected").val();
			    surf_option = $("#sel5 :selected").val();

			    $scope.roiController.sendData(user_email, video_url, time, cv_type, sampling_rate, start_time, end_time, hsv_direction, surf_option);
			},

			ROI : function(e) {
				if(!!!$scope.requireAuth()){
					return false;
				}
			    video = videojs("vid1").player();
			    $(".video-js").css("pointer-events", "none");
			    $(document).bind("mousedown", $scope.roiController.startSelect);
			    playing = !video.paused();
			    if(playing){
			        video.pause();
			    }
			},

			startSelect : function(e) {
			    $(document).unbind("mousedown", $scope.roiController.startSelect);
			    $(".ghost-select").addClass("ghost-active");
			    $(".ghost-select").css({
			        'left': e.pageX,
			        'top': e.pageY
			    });

			    initialX = e.pageX;
			    initialY = e.pageY;

			    $(document).bind("mouseup", $scope.roiController.endSelect);
			    $(document).bind("mousemove", $scope.roiController.openSelector);

			    iX = initialX - $scope.roiController.offset("left");
			    iY = initialY - $scope.roiController.offset("top");
			    pX = iX;
			    pY = iY;

			    $scope.roiController.printData();
			},

			endSelect : function(e) {
			    video = videojs("vid1").player();
			    $(document).unbind("mousemove", $scope.roiController.openSelector);
			    $(document).unbind("mouseup", $scope.roiController.endSelect);
			    $(".ghost-select").removeClass("ghost-active");
			    $(".ghost-select").width(0).height(0);
			    $(".video-js").css("pointer-events", "auto");
			    time = video.currentTime();
			    video_url = video.src();
			    $("#time").html("Time: " + time);
			    $("#url").html("URL: " + video_url);
			    if(playing){
			        video.play();
			    }
			},

			openSelector : function(e) {
			    var w = Math.abs(initialX - e.pageX);
			    var h = Math.abs(initialY - e.pageY);

			    $(".ghost-select").css({
			        'width': w,
			        'height': h
			    });
			    if (e.pageX <= initialX && e.pageY >= initialY) {
			        $(".ghost-select").css({
			            'left': e.pageX
			        });
			    } else if (e.pageY <= initialY && e.pageX >= initialX) {
			        $(".ghost-select").css({
			            'top': e.pageY
			        });
			    } else if (e.pageY < initialY && e.pageX < initialX) {
			        $(".ghost-select").css({
			            'left': e.pageX,
			            "top": e.pageY
			        });
			    }

			    pX = e.pageX - $scope.roiController.offset("left");
			    pY = e.pageY - $scope.roiController.offset("top");
			    iX = initialX - $scope.roiController.offset("left");
			    iY = initialY - $scope.roiController.offset("top");

			    $scope.roiController.printData();
			},

			printData : function(){
			    $("#topLeft").html("TL: " + iX + ", " + iY);
			    $("#topRight").html("TR: " + pX + ", " + iY);
			    $("#bottomRight").html("BR: " + pX + ", " + pY);
			    $("#bottomLeft").html("BL: " + iX + ", " + pY);
			},

			sendData : function(email, url, time, cv_type, sampling_rate, start_time, end_time, hsv_direction, surf_option){
			    var valTL = iX + ", " + iY;
			    var valTR = pX + ", " + iY;
			    var valBR = pX + ", " + pY;
			    var valBL = iX + ", " + pY;
			    var points = [iX, iY, pX, iY, pX, pY, iX, pY];
			    points = points.toString();

			    console.log("sending data!");

			    data = '{"user_email":"' + email + '", "youtube_url":"' + url + '", "points":"' + points + '","time":"' + time + '","cv_type":"' + cv_type + '","sampling_rate":"' + sampling_rate + '","hsv_direction":"' + hsv_direction + '","surf_option":"' + surf_option + '"}';
			    console.log(data);
			    $.ajax({
			        url: 'http://ec2-54-200-65-191.us-west-2.compute.amazonaws.com/predict',
			        type: 'POST',
			        crossDomain: true,
			        dataType: 'json',
			        contentType: "application/json",
			        success: function (data) {
			            console.log(data);
			        },
			        headers: {'Content-Type':'application/json'},
			        processData: false,
			        data: data
			    }); 
			}
		}

	}());
	
	console.log('roiController: ', $scope.roiController);


}]);

