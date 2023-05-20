document.addEventListener('DOMContentLoaded', function () {
    var strictModeCheckbox = document.getElementById('strict-mode');
    strictModeCheckbox.addEventListener('change', function () {
      chrome.storage.sync.set({ 'strictModeState': strictModeCheckbox.checked });
    });
    chrome.storage.sync.get('strictModeState', function (data) {
      strictModeCheckbox.checked = data.strictModeState;
    });
  });
  