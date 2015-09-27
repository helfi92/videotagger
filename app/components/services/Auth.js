app.factory("Auth",['$firebaseAuth','$rootScope',function($firebaseAuth,$rootScope){
        var authRef = $firebaseAuth(new Firebase("https://flickering-heat-6138.firebaseio.com"));
        // any time auth status updates, add the user data to scope
	    var authData;
	    authRef.$onAuth(function(authData){
	      authData = authData;
	      $rootScope.user = authData;
	       console.log('user is: ', authData);
	    });
        var authObject = {
            authData : authData,
            login : function(email, password){
                authRef.$authWithPassword({
                    email : email,
                    password : password
                }).then(
                    function(authData){
                        //$rootScope.isLoggedIn = true;
                        console.log(authData)
                    }, 
                    function(errorData){
                    }
                );
            },
            logout : function(){
                authRef.$unauth();
            },
            register: function(email,password) {
	        	return authRef.$createUser({email: email, password: password});
	    	},

        }

        return authObject;
}]);