document.addEventListener('DOMContentLoaded', function () {
	var strictModeCheckbox = document.getElementById('strict-mode');
	strictModeCheckbox.addEventListener('change', function () {
		chrome.storage.sync.set({ strictModeState: strictModeCheckbox.checked });
	});
	chrome.storage.sync.get('strictModeState', function (data) {
		strictModeCheckbox.checked = data.strictModeState;
	});

	var blockingStatusCheckbox = document.getElementById('blocking-status');
	blockingStatusCheckbox.addEventListener('change', function () {
		chrome.storage.sync.set({ blockingStatusState: blockingStatusCheckbox.checked });
	});
	chrome.storage.sync.get('blockingStatusState', function (data) {
		blockingStatusCheckbox.checked = data.blockingStatusState;
	});

	var removeElementsCheckbox = document.getElementById('remove-elements');
	removeElementsCheckbox.addEventListener('change', function () {
		chrome.storage.sync.set({ removeElementsState: removeElementsCheckbox.checked });
	});
	chrome.storage.sync.get('removeElementsState', function (data) {
		removeElementsCheckbox.checked = data.removeElementsState;
	});

	var reloadButton = document.getElementById('reload-button');
	reloadButton.addEventListener('click', function () {
		console.log('RELOADING');
		chrome.runtime.reload();
	});
});