var video;
var playing;
var initialX, initialY;
var iX, iY, pX, pY;
var time, video_url, user_email;
var data;

function offset(type){
    var offset = $("#vid1").offset();

    if (type == "top") {
        return offset.top;
    } else if (type == "left") {
        return offset.left;
    } else {
        return "";
    }
}

function submit(){
    video = videojs("vid1").player();
    user_email = $("#email").val();
    video_url = video.src();
    sendData(user_email, video_url, time);
}

function ROI(e) {
    video = videojs("vid1").player();
    $(".video-js").css("pointer-events", "none");
    $(document).bind("mousedown", startSelect);
    playing = !video.paused();
    if(playing){
        video.pause();
    }
}

function startSelect(e) {
    $(document).unbind("mousedown", startSelect);
    $(".ghost-select").addClass("ghost-active");
    $(".ghost-select").css({
        'left': e.pageX,
        'top': e.pageY
    });

    initialX = e.pageX;
    initialY = e.pageY;

    $(document).bind("mouseup", endSelect);
    $(document).bind("mousemove", openSelector);

    iX = initialX - offset("left");
    iY = initialY - offset("top");
    pX = iX;
    pY = iY;

    printData();
}

function endSelect(e) {
    video = videojs("vid1").player();
    $(document).unbind("mousemove", openSelector);
    $(document).unbind("mouseup", endSelect);
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
}

function openSelector(e) {
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

    pX = e.pageX - offset("left");
    pY = e.pageY - offset("top");
    iX = initialX - offset("left");
    iY = initialY - offset("top");

    printData();
}

function printData(){
    $("#topLeft").html("TL: " + iX + ", " + iY);
    $("#topRight").html("TR: " + pX + ", " + iY);
    $("#bottomRight").html("BR: " + pX + ", " + pY);
    $("#bottomLeft").html("BL: " + iX + ", " + pY);
}

function sendData(email, url, time){
    var valTL = iX + ", " + iY;
    var valTR = pX + ", " + iY;
    var valBR = pX + ", " + pY;
    var valBL = iX + ", " + pY;
    var points = [iX, iY, pX, iY, pX, pY, iX, pY];
    points = points.toString();

    console.log("sending data!");

    data = '{"user_email":"' + email + '", "youtube_url":"' + url + '", "points":"' + points + '","time":"' + time + '"}';
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
