'use strict';

function init() {
	localStorage.clear();
	window.localStorage.clear();
}


Storage.prototype.setObject = function (key, value) {
	this.setItem(key, JSON.stringify(value));
};

Storage.prototype.getObject = function (key) {
	var value = this.getItem(key);
	return value && JSON.parse(value);
};

var tablink = null;
var currentTab;
var contentLength = null;
var currentTab = {};
chrome.tabs.onUpdated.addListener(function (tabId, tabChangeInfo, tabState) {
	if (tabChangeInfo.status === 'loading' && !localStorage.getObject(tabState.url)) {
		localStorage.setObject(tabState.url, {
			'headers': {},
			'totalBytes': 0,
			'startTime': Date.now(),
			'endTime': 0,
			'bytesPerMs': 0,
			'totalMS': 0
		});
		currentTab = localStorage.getObject(tabState.url);
		// trigger event listeners on tab loading
		chrome.webRequest.onBeforeRequest.addListener(function (details) {
			// set and store current request url.
			currentTab.headers[details.url] = {
				'startTime': details.timeStamp,
				'endTime': 0,
				'totalBytes': 0,
				'bytesPerMs': 0,
				'totalMS': 0
			};
			localStorage.setObject(tablink, currentTab);
		}, {
			urls: ['<all_urls>']
		}, ['requestBody']);

	};

	if (tabChangeInfo.status === 'complete' && localStorage.getObject(tabState.url)) {
		currentTab.endTime = Date.now();
		var totalMS = currentTab.endTime - currentTab.startTime;
		currentTab.totalMS = totalMS;
		currentTab.bytesPerMs = currentTab.totalBytes / totalMS;
		localStorage.setObject(tabState.url, currentTab);
	}
});





chrome.webRequest.onCompleted.addListener(function (data) {
	if (currentTab.headers[data.url] === null) {
		currentTab.headers[data.url] = data.url;
		console.log("Not found: ", data.url)
	}
	if (currentTab.headers[data.url]) {
		currentTab.headers[data.url].endTime = data.timeStamp;
	}
	data.responseHeaders.forEach(function (header) {
		if (header.name.toLowerCase() === 'content-length') {
			contentLength = parseInt(header.value);
			var totalMS = currentTab.headers[data.url].endTime  - currentTab.headers[data.url].startTime;
			currentTab.headers[data.url].totalBytes = contentLength;
			currentTab.headers[data.url].bytesPerMs = contentLength / totalMS;
			currentTab.headers[data.url].totalMS = totalMS
			currentTab.totalBytes += contentLength;
		}
	});
	localStorage.setObject(tablink, currentTab)
}, {
	urls: ['<all_urls>']
}, ['responseHeaders'])

chrome.runtime.onInstalled.addListener(function (details) {
	console.log('previousVersion', details.previousVersion);
});

chrome.browserAction.setBadgeText({
	text: '\'Allo'
});

console.log('\'Allo \'Allo! Event Page for Browser Action');
