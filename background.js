var currentURL = window.location.href;
var currentDomain = extractDomain(currentURL);

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  var currentURL = window.location.href;
  if (changeInfo.url) {
    chrome.storage.local.set({ "currentURL": changeInfo.url }, function () {
      console.log("New URL: " + changeInfo.url);
    });
    var newDomain = extractDomain(changeInfo.url);

    if (newDomain !== currentDomain) {
      console.log("New domain:" + newDomain);
      //chrome.tabs.remove(tabId);
      
    } else {
      console.log("Same domain:" + newDomain);
    }
    currentDomain = newDomain;
    currentURL = changeInfo.url;
  }
});

function extractDomain(url) {
  var domain;
  if (url.indexOf("://") > -1) {
    domain = url.split("/")[2];
  } else {
    domain = url.split("/")[0];
  }
  domain = domain.split(":")[0];
  domain = domain.split("?")[0];
  return domain;
}
