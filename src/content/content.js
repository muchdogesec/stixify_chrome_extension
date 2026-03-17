// Content script to check if page can be captured
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'checkPageType') {
    sendResponse({ contentType: document.contentType})
    return true
  }
})
