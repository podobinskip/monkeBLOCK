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
        console.log("URL: " + url);
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


chrome.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
  if (changeInfo.url) {
    console.log("New attempted: " + attemptedURL);
    console.log("current tab: " + currentTabId1);
    console.log("attempted tab: " + tabId);
    var newDomain = extractDomain(changeInfo.url);
    if (changeInfo.url.startsWith("chrome://") ) {
      return;
    } else {
      const url = new URL(changeInfo.url);
      if (url.protocol === 'https:') {
        const sslLabsEndpoint = 'https://api.ssllabs.com/api/v3/analyze?host=' + changeInfo.url;
        const response = await fetch(sslLabsEndpoint);
        const data = await response.json();
        if (data.endpoints) {
          const endpoint = data.endpoints[0];
          if (['A+', 'A', 'A-', 'B+', 'B'].includes(endpoint.grade)) {
            console.log("yup!");
            console.log("Safe domain: " + newDomain);
          currentDomain = extractDomain(changeInfo.url);
          currentURL = changeInfo.url;
            return;
          }
        }
      }
      console.log("continue!!");
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
          message: "A possible unwanted URL was opened: " + changeInfo.url,
          iconUrl: "https://cdn.discordapp.com/attachments/1095083022732230786/1108496272727474297/IMG_3011.jpg",
          type: "basic",
          buttons: [
            { title: "Stay on this page" },
            { title: "Proceed" }
          ]
        });
      } else {
        console.log("Same domain: " + newDomain);
        currentDomain = extractDomain(changeInfo.url);
        currentURL = changeInfo.url;
      }
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
