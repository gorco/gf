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

angular.module('classApp', ['ngStorage', 'services'])
    .controller('ClassCtrl', ['$scope', '$location', '$http', '$window', '$localStorage', 'Games', 'Versions',
        'ClassActivities', 'Role', 'CONSTANTS', 'QueryParams',
        function ($scope, $location, $http, $window, $localStorage, Games, Versions, ClassActivities, Role,
                  CONSTANTS, QueryParams) {
            $scope.$storage = $localStorage;
            $scope.activity = {};
            $scope.class = {};

            var getClasses = function () {
                $http.get(CONSTANTS.PROXY + '/classes/my').success(function (data) {
                    $scope.classes = data;
                }).error(function (data, status) {
                    console.error('Error on get /classes/my' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            getClasses();
            $scope.loading = false;

            $scope.createClass = function () {
                var className = $scope.class.name ? $scope.class.name : 'New class';
                $http.post(CONSTANTS.PROXY + '/classes', {name: className}).success(function (classRes) {
                    $window.location = 'classactivity?class=' + classRes._id;
                }).error(function (data, status) {
                    console.error('Error on post /classes' + JSON.stringify(data) + ', status: ' + status);
                });
            };

            $scope.isTeacher = function () {
                return Role.isTeacher();
            };

            $scope.deleteClass = function (classObj) {
                if (classObj) {
                    $http.delete(CONSTANTS.PROXY + '/classes/' + classObj._id).success(function () {
                        getClasses();
                    }).error(function (data, status) {
                        console.error('Error on delete /classes/' + classObj._id + ' ' +
                            JSON.stringify(data) + ', status: ' + status);
                    });
                }
            };
        }
    ]);