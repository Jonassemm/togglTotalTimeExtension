chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  console.log('test');
  if (changeInfo.url) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabId, {
        message: 'update-url',
        url: changeInfo.url,
      });
    });
  }
});
