app.config(['$routeProvider',function($routeProvider) {
$routeProvider
    // route for the home page
    .when('/', {
        templateUrl : 'app/components/home/homeView.html',
        controller  : 'homeController',
        
    })
    
    .otherwise({
        redirectTo: '/',
        
    });
     
}]);