app.factory("Auth",['$firebaseAuth','$rootScope',function($firebaseAuth,$rootScope){
        var authRef = $firebaseAuth(new Firebase("https://flickering-heat-6138.firebaseio.com"));
        // any time auth status updates, add the user data to scope
	    var authData;
	    authRef.$onAuth(function(authData){
	      authData = authData;
	      $rootScope.user = authData;
	       console.log('user is: ', authData);
	    });

        function errorModal(){
            $('#errorModal').modal('show');
        }

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
                        return authData;
                    }, 
                    function(errorData){
                        errorModal();
                    }
                );
            },
            logout : function(){
                authRef.$unauth().then(function(data){
                }, function(errorData){
                    errorModal();
                });
            },
            register: function(email,password) {
	        	return authRef.$createUser({email: email, password: password}).then(function(data){
                },function(errorData){
                    errorModal();                
                });
	    	},
        }

        return authObject;
}]);