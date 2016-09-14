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

angular.module('sessionApp', ['myApp', 'ngStorage', 'services'])
    .config(['$locationProvider',
        function ($locationProvider) {
            $locationProvider.html5Mode(false);
        }
    ])
    .directive('reports', function () {
        return function (scope, element, attrs) {
            new RadialProgress(angular.element(element).children('.progress-marker')[0], scope.result.progress);
            new ColumnProgress(angular.element(element).children('.score-marker')[0], scope.result.score);
        };
    })
    .controller('SessionCtrl', ['$scope', '$location', 'SessionsId', 'Results', 'Versions', 'QueryParams', '$sce', 'CONSTANTS',
        function ($scope, $location, SessionsId, Results, Versions, QueryParams, $sce, CONSTANTS) {

            $scope.refreshResults = function () {
                var rawResults = Results.query({
                        id: $scope.session._id
                    },
                    function () {
                        calculateResults(rawResults);
                    });
            };

            $scope.session = SessionsId.get({
                id: QueryParams.getQueryParam('session')
            }, function () {
                $scope.version = Versions.get({
                    gameId: $scope.session.gameId,
                    versionId: $scope.session.versionId
                }, function () {
                    $scope.refreshResults();
                    if (!$scope.session.end) {
                        setInterval(function () {
                            $scope.refreshResults();
                        }, 10000);
                    }
                });
            });

            var evalExpression = function (expression, defaultValue) {
                try {
                    return eval(expression) || defaultValue;
                } catch (err) {
                    return defaultValue;
                }
            };

            $scope.dashboardLink = function () {
                var url = CONSTANTS.KIBANA + '/app/kibana#/dashboard/dashboard_' +
                    QueryParams.getQueryParam('session') + "?embed=true_g=(refreshInterval:(display:'5%20seconds'," +
                    "pause:!f,section:1,value:5000),time:(from:now-1h,mode:quick,to:now))";
                if (url.startsWith('localhost')) {
                    url = 'http://' + url;
                }
                return $sce.trustAsResourceUrl(url);
            };

            var calculateResults = function (rawResults) {
                var results = [];
                rawResults.forEach(function (result) {
                    result.name = evalExpression.call(result, $scope.version.alias, 'Unknown');

                    result.score = Math.min(1, evalExpression.call(result, $scope.version.score, 0) / $scope.version.maxScore);

                    result.warnings = [];
                    for (var i = 0; $scope.version.warnings && i < $scope.version.warnings.length; i++) {
                        var warning = $scope.version.warnings[i];
                        if (evalExpression.call(result, warning.cond, false)) {
                            result.warnings.push(i);
                        }
                    }

                    result.alerts = [];
                    for (i = 0; $scope.version.alerts && i < $scope.version.alerts.length; i++) {
                        var alert = $scope.version.alerts[i];
                        var level = evalExpression.call(result, alert.value, 0);
                        if (level - ((result.levels && result.levels[i]) || 0) >= alert.maxDiff) {
                            result.alerts.push({
                                id: i,
                                level: level
                            });
                        }
                    }
                    if (result.warnings.length > 0 || result.alerts.length > 0) {
                        results.push(result);
                    }

                    if ($scope.player && $scope.player._id === result._id) {
                        $scope.player = result;
                    }

                });

                $scope.results = results;
            };

            $scope.viewPlayer = function (result) {
                $scope.player = result;
            };

            $scope.updateLevels = function (player) {
                var levels = player.levels || [];

                player.alerts.forEach(function (alert) {
                    levels[alert.id] = alert.level;
                });
                delete player.alerts;
                player.levels = levels;
                player.$save({id: $scope.session._id}, function () {
                    $scope.player = null;
                    $scope.refreshResults();
                });
            };
        }
    ]);