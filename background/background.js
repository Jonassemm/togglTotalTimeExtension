chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  console.log('test');
  if (changeInfo.url) {
    chrome.tabs.sendMessage(tabId, {
      message: 'update-url',
      url: changeInfo.url,
    });
  }
});
