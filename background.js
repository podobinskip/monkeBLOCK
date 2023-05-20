var currentURL;
var currentDomain;
var attemptedURL;
var initialTabId;
var attemptedTabId;
var currentTabId1;
var strictMode;

updateStrictMode(); // KEEP THIS. IT WILL SET STRICTMODE TO FALSE AND NOT UNDEFINED.
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if ("strictModeState" in changes) {
    updateStrictMode();
  }
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  var currentTabId = activeInfo.tabId;
  chrome.windows.getCurrent(function (currentWindow) {
    chrome.tabs.query({ windowId: currentWindow.id }, function (tabs) {
      var currentTab = tabs.find(function (tab) {
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
      }
    });
  });
});

chrome.runtime.onMessage.addListener(function (message) {
  if (message.type === "strictModeUpdate") {
    strictMode = message.value;
  }
});

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  if (changeInfo.url) {
    var newDomain = extractDomain(changeInfo.url);
    if (changeInfo.url.startsWith("chrome://")) {
      return;
    } else {
      const url = new URL(changeInfo.url);
      if (strictMode === false) {
        if (url.protocol === "https:" || url.protocol === "http:") {
          const httpsURL =
            "https://" + url.hostname + url.pathname + url.search + url.hash;
          try {
            const httpsResponse = await fetch(httpsURL);
            if (httpsResponse.ok) {
              currentDomain = extractDomain(httpsURL);
              currentURL = httpsURL;
              chrome.tabs.update(tabId, { url: currentURL });
              const sslLabsEndpoint =
                "https://api.ssllabs.com/api/v3/analyze?host=" + changeInfo.url;
              try {
                const response = await fetch(sslLabsEndpoint);
                const data = await response.json();
                if (data.endpoints) {
                  const endpoint = data.endpoints[0];
                  if (["A+", "A", "A-", "B+", "B"].includes(endpoint.grade)) {
                    currentDomain = extractDomain(changeInfo.url);
                    currentURL = changeInfo.url;
                    chrome.tabs.update(tabId, { url: currentURL });
                    return;
                  }
                }
              } catch (error) {
              }
            }
          } catch (error) {
          }
        }
      }

      if (newDomain !== currentDomain) {
        if (tabId !== currentTabId1) {
          attemptedURL = changeInfo.url;
          attemptedTabId = tabId;
          chrome.tabs.remove(tabId);
        } else {
          attemptedURL = changeInfo.url;
          attemptedTabId = tabId;
          chrome.tabs.update(tabId, { url: currentURL });
        }

        chrome.notifications.create({
          title: "monkeBLOCK Alert",
          message: "A possible unwanted URL was opened: " + changeInfo.url,
          iconUrl: "monkeBLOCKmain.png",
          type: "basic",
          buttons: [{ title: "Stay on this page" }, { title: "Proceed" }],
        });
      } else {
        currentDomain = extractDomain(changeInfo.url);
        currentURL = changeInfo.url;
      }
    }
  }
});

chrome.notifications.onButtonClicked.addListener(function (
  notificationId,
  buttonIndex
) {
  if (buttonIndex === 0) {
  } else if (buttonIndex === 1) {
    currentDomain = extractDomain(attemptedURL);
    currentURL = attemptedURL;
    chrome.tabs.get(attemptedTabId, function (tab) {
      if (chrome.runtime.lastError || !tab) {
        chrome.tabs.create({ url: attemptedURL });
      }
      chrome.tabs.update(attemptedTabId, { url: attemptedURL });
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

function updateStrictMode() {
  chrome.storage.sync.get("strictModeState", function (data) {
    if (data.strictModeState === undefined) {
      strictMode = false;
    } else {
      strictMode = data.strictModeState;
    }
  });
}
