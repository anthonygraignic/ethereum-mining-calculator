/**
 * Created by Anthony on 02/06/2015.
 */
(function () {
	'use strict';
	angular
		.module('calculator', [])
		.controller('HomeCtrl', HomeCtrl);
	function HomeCtrl($scope, $log, $mdToast, $animate, $http, $locale) {
		// Init object with default value
		$scope.user = {};
		$scope.earnings = {};
		$scope.network = {
			hashrate: 0,
			blockTime: 0,
			ethPrice: 1.0
		};
		$scope.gpus = [];
		$scope.userCurrency = $locale.NUMBER_FORMATS.CURRENCY_SYM;

		$scope.onClick = function (points, evt) {
			console.log(points, evt);
		};

		$scope.showSimpleToast = function (message) {
			$mdToast.show(
				$mdToast.simple()
					.content(message)
					.position('bottom right')
					.hideDelay(3000)
			);
		};

		/**
		 * Compute profits
		 */
		$scope.computeProfits = function () {
			var userRatio = $scope.user.gpu.hashrate * 1e6 / ($scope.network.hashrate * 1e9);
			var blocksPerMin = 60.0 / $scope.network.blockTime;
			var ethPerMin = blocksPerMin * 5.0;
			// Calculate all earnings
			var minuteEth = userRatio * ethPerMin;
			var hourEth = minuteEth * 60;
			var dayEth = hourEth * 24;
			var weekEth = dayEth * 7;
			var monthEth = dayEth * 30;

			// Convert ETH to USD
			var hourPrice = hourEth * $scope.user.price.usd;
			// If cloud, subtract instance hourly price
			if ($scope.user.gpu.price) {
				hourPrice = hourPrice - $scope.user.gpu.price;
			}
			var dayPrice = hourPrice * 24;
			var weekPrice = dayPrice * 7;
			var monthPrice = dayPrice * 30;

			// Put them in an array to ng-repeat
			$scope.earnings.tab = [];
			$scope.earnings.tab.push({
				label: 'Per hour',
				eth: hourEth,
				price: hourPrice
			});
			$scope.earnings.tab.push({
				label: 'Per day',
				eth: dayEth,
				price: dayPrice
			});
			$scope.earnings.tab.push({
				label: 'Per week',
				eth: weekEth,
				price: weekPrice
			});
			$scope.earnings.tab.push({
				label: 'Per month',
				eth: monthEth,
				price: monthPrice,
				// Avoid looking for last element and slow page
				last: true
			});
		};

		/**
		 * Async load of GPU list
		 */
		$scope.loadGPUs = function () {
			// Fill list of GPUs
			$http.get("./assets/json/gpus.json")
				.success(function (data) {
					$scope.gpus = data;
				}).error(function (data, status) {
					console.log("And we just got hit by a " + status + " !!!");
				});
		};
		/**
		 * Reset GPU price (electricity or cloud instance cost)
		 */
		$scope.resetGpuPrice= function () {
			if(!$scope.user.electricity){
				$scope.user.gpu.price = undefined;
				// Compute profits without price
				$scope.computeProfits();
			}
		};

		/**
		 * Reset GPU selection
		 */
		$scope.resetGPU = function () {
			var tmp = $scope.user.gpu.hashrate;
			$scope.user.gpu = {
				hashrate: tmp
			};
		};

		/**
		 * Get all useful data
		 */
		$scope.init = function () {
			$http.get("http://coinmarketcap-nexuist.rhcloud.com/api/eth")
				.success(function (data) {
					$scope.network.market = data;
					fillPrices(data.price);
				}).error(function (data, status) {
					console.log("And we just got hit by a " + status + " !!!");
				});
			$http.get("https://etherchain.org/api/basic_stats")
				.success(function (resp) {
					var sumBlocktime = 0;
					var sumDifficulty = 0;
					var arrayLength = resp.data.blocks.length;
					for (var i = 0; i < arrayLength; i++) {
						sumBlocktime += resp.data.blocks[i].blockTime;
						sumDifficulty += resp.data.blocks[i].difficulty;
					}
					// Calculate average
					$scope.network.blockTime = sumBlocktime / arrayLength;
					$scope.network.hashrate = (sumDifficulty / sumBlocktime) * 1e-9;
				}).error(function (data, status) {
					console.log("And we just got hit by a " + status + " HTTP status !!!");
					//DEV
					$scope.network.blockTime = 1;
					$scope.network.hashrate = 2;
				});
		};

		/**
		 * Fill prices (str -> float)
		 * @param price
		 */
		var fillPrices = function (price) {
			$scope.user.price = {};
			$scope.user.price.usd = parseFloat(price.usd, 10);
		};

		/**
		 * Reset inputs
		 */
		$scope.reset = function () {
			$scope.user = {};
			fillPrices($scope.network.market.price);
			$scope.showSimpleToast('Hashrate reset');
		};
	}
})();