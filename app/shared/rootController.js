app.controller('rootController',['$scope','$rootScope','Auth','$firebaseArray','$timeout','$http', function($scope,$rootScope,Auth,$firebaseArray,$timeout,$http){
	$scope.createNewAccount = function(email,pw){
  		Auth.register(email,pw);
  	};
  	$scope.login = function(email,pw){
  		Auth.login(email,pw);
  	};
  	$scope.logout = function(){
  		Auth.logout();
  	};

  	// requireAuth returns true if user is authenticated, false otherwise.
  	// this method will open the registration modal if user is not authenticated
  	$scope.requireAuth = function(){
  		if(!!!$rootScope.user){
  			$('#signupModal').modal('show');
  			return false;
  		}
  		return true;
  	}

}]);

