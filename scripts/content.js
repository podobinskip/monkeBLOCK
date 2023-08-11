chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (changeInfo.url) {
		chrome.storage.local.set({ currentURL: changeInfo.url }, function () {
			console.log('New URL: ' + changeInfo.url);
		});
	}
});
