const submitBtn = document.querySelector('#saveOptions');
const workspace_id = document.querySelector('#workspaceID');
const user_agent = document.querySelector('#userAgent');
const authorization = document.querySelector('#authKey');
const saveSuccess = document.getElementById('saveSuccess');

submitBtn.addEventListener('click', () => {
  if (workspace_id.value && user_agent.value && authorization.value) {
    chrome.storage.sync.set({
      workspaceID: workspace_id.value,
      userAgent: user_agent.value,
      authKey: authorization.value,
    });
    saveSuccess.style.display = 'block';
  }
});

function initFields() {
  chrome.storage.sync.get(['workspaceID', 'userAgent', 'authKey'], (data) => {
    if (data.workspaceID) {
      workspace_id.value = data.workspaceID;
    }
    if (data.userAgent) {
      user_agent.value = data.userAgent;
    }
    if (data.authKey) {
      authorization.value = data.authKey;
    }
  });
}

initFields();
