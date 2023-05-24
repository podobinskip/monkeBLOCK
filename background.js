var currentURL;
var currentDomain;
var attemptedURL;
var initialTabId;
var attemptedTabId;
var currentTabId1;
var strictMode;
var blockingStatus;
const prefixes = ["chrome://", "edge://", "brave://", "file:///", "about:blank"]; // Might have to find a different alternative to this.

updateStrictMode(); // KEEP THIS. IT WILL SET STRICTMODE TO FALSE AND NOT UNDEFINED.
updateBlockingStatus(); // KEEP THIS. IT WILL SET BLOCKING STATUS TO ENABLED AND NOT UNDEFINED.
chrome.storage.onChanged.addListener(function (changes, namespace) {
  if ("strictModeState" in changes) {
    updateStrictMode();
  }
  if ("blockingStatusState" in changes) {
    updateBlockingStatus();
  }
});

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set({ blockingStatusState: true });
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  if (blockingStatus === false || blockingStatus !== true) {
    return;
  }
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
  if (blockingStatus === false || blockingStatus !== true) {
    return;
  }
  if (message.type === "strictModeUpdate") {
    strictMode = message.value;
  }
});

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  if (blockingStatus === false || blockingStatus !== true) {
    return;
  }
  if (changeInfo.url) {
    var newDomain = extractDomain(changeInfo.url);
    for (const prefix of prefixes) {
      if (changeInfo.url.startsWith(prefix)) {
        currentDomain = extractDomain(changeInfo.url);
        currentURL = changeInfo.url;
        return;
      }
    }
    if (newDomain !== currentDomain) {
      const url = new URL(changeInfo.url);
      if (strictMode === false) {
        const httpsURL = "https://" + url.hostname + url.pathname + url.search + url.hash;
        try {
          const httpsResponse = await fetch(httpsURL);
          if (httpsResponse.ok) {
            currentDomain = extractDomain(httpsURL);
            currentURL = httpsURL;
            const sslLabsEndpoint =
              "https://api.ssllabs.com/api/v3/analyze?host=" + changeInfo.url;
            let analysisComplete = false;
            let retryCount = 0;
            const maxRetries = 5; // Maximum number of retries
            while (!analysisComplete && retryCount < maxRetries) {
              try {
                const response = await fetch(sslLabsEndpoint);
                const data = await response.json();
                if (data.status === "READY") {
                  if (data.endpoints && data.endpoints.length > 0) {
                    const endpoint = data.endpoints[0];
                    if (["A+", "A", "A-", "B+", "B"].includes(endpoint.grade)) {
                      currentDomain = extractDomain(changeInfo.url);
                      currentURL = changeInfo.url;
                      chrome.tabs.update(tabId, { url: currentURL });
                      return;
                    }
                  }
                  analysisComplete = true;
                } else {
                  await delay(2000); // Wait for 2 seconds before checking again
                  retryCount++;
                }
              } catch (error) {
                console.error(error);
              }
            }
            if (!analysisComplete) {
              if (maxRetries === 5) {
                return; // Assume the link to be safe.
              }
            }
          } else {
          }
        } catch (error) {
        }
      }
      if (tabId !== currentTabId1) {
        attemptedURL = changeInfo.url;
        attemptedTabId = tabId;
        createNoti();
        chrome.tabs.remove(tabId);
      } else {
        attemptedURL = changeInfo.url;
        attemptedTabId = tabId;
        createNoti();
        chrome.tabs.update(tabId, { url: currentURL });
      }
    } else {
      currentDomain = extractDomain(changeInfo.url);
      currentURL = changeInfo.url;
    }
  }
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


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

function createNoti() {
  chrome.notifications.create({
    title: "monkeBLOCK Alert",
    message: "A possible unwanted URL was opened: " + attemptedURL,
    iconUrl: "monkeBLOCKmain.png",
    type: "basic",
    buttons: [{ title: "Stay on this page" }, { title: "Proceed" }],
  });
}
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

function updateBlockingStatus() {
  chrome.storage.sync.get("blockingStatusState", function (data) {
    if (blockingStatus === undefined) {
      blockingStatus = true;
    }
    blockingStatus = data.blockingStatusState;
    if (blockingStatus !== true) {
      chrome.browserAction.setIcon({ path: "monkeBLOCKicon-greyscale.png" });
    }
    else {
      chrome.browserAction.setIcon({ path: "monkeBLOCKicon.png" });
    }
  });
}


