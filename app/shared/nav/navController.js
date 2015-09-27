app.controller('navController',['$scope','Auth', function($scope,Auth) {
	$scope.createNewAccount = function(email,pw){
  		Auth.register(email,pw);
  	};
  	$scope.login = function(email,pw){
  		Auth.login(email,pw);
  	};
  	$scope.logout = function(){
  		Auth.logout();
  	};
}]);



