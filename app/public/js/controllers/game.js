/*
 * Copyright 2016 e-UCM (http://www.e-ucm.es/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * This project has received funding from the European Union’s Horizon
 * 2020 research and innovation programme under grant agreement No 644187.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0 (link is external)
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

angular.module('gameApp', ['ngStorage', 'services', 'myApp'])
    .controller('GameCtrl', ['$scope', '$http', '$window', '$localStorage', 'Games', 'Role',
        function ($scope, $http, $window, $localStorage, Games, Role) {
            $scope.$storage = $localStorage;

            $scope.isTeacher = function () {
                return Role.isTeacher();
            };

            $scope.changeTitle = function () {
                $http.put(CONSTANTS.PROXY + '/games/' + $scope.game._id, {title: $scope.game.title}).success(function (data) {
                }).error(function (data, status) {
                    console.error('Error on put /games/' + $scope.game._id + ' ' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            $scope.public = 'btn-default';

            $scope.publicGame = function () {
                $scope.game.$update();
            };

            $scope.changeGameLink = function () {
                $http.put(CONSTANTS.PROXY + '/games/' + $scope.game._id, {link: $scope.game.link}).success(function (data) {
                }).error(function (data, status) {
                    console.error('Error on post /games/' + $scope.game._id + ' ' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            $scope.deleteGame = function (redirect) {
                if ($scope.game) {
                    $scope.game.$remove(function () {
                        if (redirect) {
                            $window.location = '/home';
                        }
                    });
                }
            };
        }
    ]);


