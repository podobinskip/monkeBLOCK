var currentURL;
var currentDomain;
var attemptedURL;

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
        if (url === null || url === undefined || url == "") {
          url = currentURL;
          domain = currentDomain;
        }

        currentURL = url;
        currentDomain = domain;
        console.log("URL: " + currentURL);
        console.log("Domain: " + currentDomain);
      }
    });
  });
});


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.url) {
    console.log("New attempted:" + attemptedURL);
    chrome.storage.local.set({ "currentURL": changeInfo.url }, function () {
      console.log("New URL: " + changeInfo.url);
    });
    var newDomain = extractDomain(changeInfo.url);

    if (newDomain !== currentDomain) {
      attemptedURL = changeInfo.url;
      console.log("New domain:" + newDomain);
      chrome.tabs.remove(tabId);
      //chrome.tabs.update(tabId, {url: currentURL});
      chrome.notifications.create ({
        title: "Extension",
        message: "hey, this website tried to open this link. open it?: " + changeInfo.url,
        iconUrl: "https://cdn.discordapp.com/attachments/1095083022732230786/1108496272727474297/IMG_3011.jpg",
        type: "basic", 
        buttons: [
          { title: "no" },
          { title: "open" }
        ]
      })
    } else {
      console.log("Same domain:" + newDomain);
      currentDomain = extractDomain(changeInfo.url);
      currentURL = changeInfo.url;
      //chrome.tabs.update(tabId, { url: currentURL });
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
    chrome.tabs.create({ url: attemptedURL }); 

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
