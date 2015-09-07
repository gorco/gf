'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', [
    'ngRoute', 'signupApp', 'loginApp', 'homeApp', 'classApp', 'gameApp', 'services', 'xeditable',
]).run(function (editableOptions) {
    editableOptions.theme = 'bs3';
}).filter('prettyDateId', function () {
    return function (_id) {
        return $.format.prettyDate(new Date(parseInt(_id.slice(0, 8), 16) * 1000));
    };
}).filter('prettyDate', function () {
    return function (date) {
        return $.format.prettyDate(new Date(date));
    };
}).filter('list', function () {
    return function (list) {
        if (!list || list.length === 0) {
            return 'Empty list';
        } else {
            var result = '';
            list.forEach(function (v) {
                result += v + ', ';
            });
            return result;
        }
    };
}).filter('object2array', function () {
    return function (input) {
        var out = [];
        for (var i in input) {
            out.push(input[i]);
        }
        return out;
    };
}).factory('httpRequestInterceptor', ['$localStorage',
    function ($localStorage) {
        return {
            request: function (config) {
                if ($localStorage.user) {
                    config.headers.Authorization = 'Bearer ' + $localStorage.user.token;
                }

                return config;
            }
        };
    }
]).constant('CONSTANTS', {
    APIPATH: 'http://localhost:3000/api',
    PREFIX: 'gleaner',
    PROXY: 'http://localhost:3000/api/proxy/gleaner'
}).config(['$routeProvider', '$httpProvider', '$locationProvider',
    function ($routeProvider, $httpProvider, $locationProvider) {
        $httpProvider.interceptors.push('httpRequestInterceptor');
        $locationProvider.html5Mode(true);
        $routeProvider.when('/home', {
            templateUrl: '/home',
            controller: 'HomeCtrl'
        }).when('/class', {
            templateUrl: '/class',
            controller: 'ClassCtrl'
        }).when('/game', {
            templateUrl: '/game',
            controller: 'GameCtrl'
        }).when('/login', {
            templateUrl: '/login',
            controller: 'LoginCtrl'
        }).when('/signup', {
            templateUrl: '/signup',
            controller: 'SignupCtrl'
        }).otherwise({
            redirectTo: '/login'
        });
    }
]).controller('AppCtrl', ['$scope', '$location', '$http', '$timeout', '$localStorage', '$window', 'Games', 'Versions', 'Sessions', 'Role', 'CONSTANTS',
    function ($scope, $location, $http, $timeout, $localStorage, $window, Games, Versions, Sessions, Role, CONSTANTS) {
        $scope.$storage = $localStorage;

        $scope.isAdmin = function () {
            return $scope.isUser() &&
                $scope.$storage.user.roles && $scope.$storage.user.roles.indexOf('admin') !== -1;
        };

        $scope.isUser = function () {
            return $scope.$storage && $scope.$storage.user;
        };

        $scope.isTeacher = function () {
            return Role.isTeacher();
        };

        $scope.isDeveloper = function () {
            return Role.isDeveloper();
        };

        $scope.href = function (href) {
            $window.location.href = href;
        };

        $scope.logout = function () {
            $http.delete(CONSTANTS.APIPATH + '/logout').success(function () {
                delete $scope.$storage.user;
                $timeout(function () {
                    $scope.href('/login');
                }, 110);
            }).error(function (data, status) {
                console.error('Error on get /logout ' + JSON.stringify(data) + ', status: ' + status);
            });
        };

        var route = $scope.isDeveloper() ? '/my' : '';
        $http.get(CONSTANTS.PROXY + '/games' + route).success(function (data) {
            $scope.games = data;
            var gameId = $location.search().game;
            if (gameId) {
                for (var i = 0; i < $scope.games.length; i++) {
                    if ($scope.games[i]._id === gameId) {
                        $scope.selectedGame = $scope.games[i];
                    }
                }
            }
            $scope.refreshVersions();
        }).error(function (data, status) {
            console.error('Error on get /games/my ' + JSON.stringify(data) + ', status: ' + status);
        });

        $scope.changeSessionName = function () {
            $http.put(CONSTANTS.PROXY + '/sessions/' + $scope.selectedSession._id, {name: $scope.selectedSession.name}).success(function (data) {
            }).error(function (data, status) {
                console.error('Error on put /sessions/' + $scope.selectedSession._id + " " + JSON.stringify(data) + ', status: ' + status);
            });
        };

        $scope.changeTitle = function () {
            $http.post(CONSTANTS.PROXY + '/games/' + $scope.selectedGame._id, {title: $scope.selectedGame.title}).success(function (data) {
            }).error(function (data, status) {
                console.error('Error on post /games/' + $scope.selectedGame._id + " " + JSON.stringify(data) + ', status: ' + status);
            });
        };

        $scope.changeGameLink = function () {
            $http.post(CONSTANTS.PROXY + '/games/' + $scope.selectedGame._id, {link: $scope.selectedGame.link}).success(function (data) {
            }).error(function (data, status) {
                console.error('Error on post /games/' + $scope.selectedGame._id + " " + JSON.stringify(data) + ', status: ' + status);
            });
        };

        $scope.classStudents = [];
        $scope.inviteStudent = function () {
            $http.put(CONSTANTS.PROXY + '/sessions/' + $scope.selectedSession._id, {students: $scope.student.name}).success(function (data) {
                $scope.classStudents = data.students;
            }).error(function (data, status) {
                console.error('Error on post /sessions/' + $scope.selectedSession._id + " " + JSON.stringify(data) + ', status: ' + status);
            });
        };

        $scope.ejectStudent = function (student) {
            $http.put(CONSTANTS.PROXY + '/sessions/' + $scope.selectedSession._id + '/remove', {students: student}).success(function (data) {
                $scope.classStudents = data.students;
            }).error(function (data, status) {
                console.error('Error on post /sessions/' + $scope.selectedSession._id + " " + JSON.stringify(data) + ', status: ' + status);
            });
        };

        $scope.saveGame = function () {
            if ($scope.selectedGame) {
                $scope.selectedGame.$save();
            }
        };

        $scope.deleteGame = function (game) {
            if (game) {
                $http.delete(CONSTANTS.PROXY + '/games/' + game._id).success(function () {
                    $scope.games = Games.query();
                }).error(function (data, status) {
                    console.error('Error on delete /games/' + $scope.selectedGame._id + " " + JSON.stringify(data) + ', status: ' + status);
                });
            }
        };

        $scope.saveVersion = function (callback) {
            if ($scope.selectedVersion) {
                $scope.selectedVersion.$save(callback);
            }
        };

        $scope.refreshVersions = function (callback) {
            if ($scope.selectedGame) {
                $scope.form.selectedGame = $scope.selectedGame;
                $scope.versions = Versions.query({
                    gameId: $scope.selectedGame._id
                }, function () {
                    $scope.selectedVersion = null;
                    var versionId = $location.search().version;
                    if (versionId) {
                        for (var i = 0; i < $scope.versions.length; i++) {
                            if ($scope.versions[i]._id === versionId) {
                                $scope.selectedVersion = $scope.versions[i];
                            }
                        }
                    }

                    if (!$scope.selectedVersion) {
                        $scope.selectedVersion = $scope.versions[0];
                    }

                    $scope.form.selectedVersion = $scope.selectedVersion;

                    $scope.refreshSessions();

                    if (callback) {
                        callback();
                    }
                });
            }
        };

        $scope.refreshSessions = function () {
            if ($scope.selectedGame && $scope.selectedVersion) {
                $http.get(CONSTANTS.PROXY + '/games/' + $scope.selectedGame._id + '/versions/' + $scope.selectedVersion._id + '/sessions/my').success(function (data) {
                    $scope.sessions = data;
                    $scope.selectedSession = null;
                    var sessionId = $location.search().session;
                    if (sessionId) {
                        for (var i = 0; i < $scope.sessions.length; i++) {
                            if ($scope.sessions[i]._id === sessionId) {
                                $scope.selectedSession = $scope.sessions[i];
                                $scope.classStudents = $scope.selectedSession.students;
                            }
                        }
                    }
                }).error(function (data, status) {
                    console.error('Error on get /games/' + $scope.selectedGame._id + '/versions/' + $scope.selectedVersion._id + '/sessions/my' + JSON.stringify(data) + ', status: ' + status);
                });
            }
        };

        $scope.hasSessions = function () {
            return ($scope.sessions ? $scope.sessions.length : 0) !== 0;
        };

        $scope.hasGames = function () {
            return ($scope.games ? $scope.games.length : 0) !== 0;
        };

        $scope.form = {
            selectedGame: null,
            selectedVersion: null,
            selectedSession: null
        };

        $scope.deselectedGameAndGo = function (href) {
            $scope.form.selectedGame = null;
            $scope.form.selectedVersion = null;
            $scope.form.selectedSession = null;
            $window.location = href;
        };

        $scope.setSelectedGame = function (game) {
            $scope.form.selectedGame = game;
            if (!game) {
                $scope.form.selectedVersion = null;
                $scope.form.selectedSession = null;
            }
        };

        $scope.setSelectedVersionAndGo = function (version) {
            $scope.form.selectedVersion = version;
        };

        $scope.setSelectedSession = function (session, url) {
            $scope.form.selectedSession = session;
            $window.location = url + '?game=' + $scope.form.selectedGame._id + '&version=' + $scope.form.selectedVersion._id + '&session=' + session._id;
        };

        $scope.$watch('form.selectedGame', function (selected) {
            if (selected) {
                $scope.selectedGame = selected;
                $location.search('game', selected._id);
                $scope.refreshVersions();
            }
        });

        $scope.$watch('form.selectedVersion', function (selected) {
            var oldURL = $location.absUrl();
            if (selected) {
                $location.search('version', selected._id);
                $scope.selectedVersion = selected;
            }
            if (oldURL !== $location.absUrl()) {
                $window.location = $location.absUrl();
            }

        });

        $scope.$watch('form.selectedSession', function (selected) {
            if (selected) {
                $location.search('session', selected._id);
                $scope.selectedSession = selected;
            }
        });
    }
]);