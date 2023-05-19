var currentURL;
var currentDomain;
var attemptedURL;
var initialTabId;
var attemptedTabId;
var currentTabId1;

chrome.tabs.onActivated.addListener(function(activeInfo) {
  var currentTabId = activeInfo.tabId;
  chrome.windows.getCurrent(function(currentWindow) {
    chrome.tabs.query({ windowId: currentWindow.id }, function(tabs) {
      var currentTab = tabs.find(function(tab) {
        return tab.id === currentTabId;
        
      });
      if (currentTab) {
        var url = currentTab.url;
        var domain = extractDomain(url);
        if (url === null || url === undefined || url === "") {
          url = currentURL;
          domain = currentDomain;
        }

        currentURL = url;
        currentDomain = domain;
        currentTabId1 = currentTab.id;
        console.log("URL: " + currentURL);
        console.log("Domain: " + currentDomain);
        console.log("TID: " + currentTabId1);
      }
    });
  });
});


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.url) {
    console.log("New attempted: " + attemptedURL);
    console.log("current tab: " + currentTabId1);
    console.log("attempted tab: " + tabId);
    chrome.storage.local.set({ "currentURL": changeInfo.url }, function() {
      console.log("New URL: " + changeInfo.url);
    });
    var newDomain = extractDomain(changeInfo.url);
    if (changeInfo.url.startsWith("chrome://") || currentURL.startsWith("chrome://")) {
      return;
    }
    if (newDomain !== currentDomain) {
      if (tabId !== currentTabId1) {
        console.log("diff tabId");
        attemptedURL = changeInfo.url;
        attemptedTabId = tabId;
        chrome.tabs.remove(tabId);
      } else {
        console.log("same tabId");
        attemptedURL = changeInfo.url;
        attemptedTabId = tabId;
        chrome.tabs.update(tabId, { url: currentURL });
      }
      console.log("New domain: " + newDomain);
      chrome.notifications.create({
        title: "Extension",
        message: "Hey, this website tried to open this link. Open it?: " + changeInfo.url,
        iconUrl: "https://cdn.discordapp.com/attachments/1095083022732230786/1108496272727474297/IMG_3011.jpg",
        type: "basic",
        buttons: [
          { title: "No" },
          { title: "Open" }
        ]
      })
    } else {
      console.log("Same domain: " + newDomain);
      currentDomain = extractDomain(changeInfo.url);
      currentURL = changeInfo.url;
    }
  }
});


chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
  console.log("New attempted111:" + attemptedURL);
  if (buttonIndex === 0) {
    console.log("User clicked 'No'");
  } else if (buttonIndex === 1) {
    console.log("User clicked 'Open'");
    currentDomain = extractDomain(attemptedURL);
    currentURL = attemptedURL;
    chrome.tabs.get(attemptedTabId, function(tab) {
      if (chrome.runtime.lastError || !tab) {
        chrome.tabs.create({ url: attemptedURL });
        //chrome.tabs.update(attemptedTabId, {url: attemptedURL});
      }
      chrome.tabs.update(attemptedTabId, {url: attemptedURL});
    });
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
