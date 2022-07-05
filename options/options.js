const submitBtn = document.querySelector('#saveOptions');
const workspace_id = document.querySelector('#workspaceID');
const user_agent = document.querySelector('#userAgent');
const authorization = document.querySelector('#authKey');
const saveSuccess = document.getElementById('saveSuccess');
const saveHoliday = document.querySelector('#saveHoliday');
const saveSick = document.querySelector('#saveSick');

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

function specialDayListener(startElement, endElement, identifier) {
  if (startElement.value && endElement.value) {
    chrome.storage.sync.get([identifier], (data) => {
      let tmpArr = [];
      if (data[identifier]) {
        tmpArr = data[identifier];
      }
      tmpArr = tmpArr.concat(
        getDatesInRange(
          new Date(startElement.value),
          new Date(endElement.value)
        )
      );
      chrome.storage.sync.set({
        [identifier]: tmpArr,
      });
      startElement.value = null;
      endElement.value = null;
    });
  }
}

saveSick.addEventListener(
  'click',
  specialDayListener.bind(
    null,
    document.getElementById('sickStart'),
    document.getElementById('sickEnd'),
    'sickdays'
  )
);

saveHoliday.addEventListener('click', () => {
  let holidayStart = document.querySelector('#holidayStart');
  let holidayEnd = document.querySelector('#holidayEnd');
  if (holidayStart && holidayEnd) {
    chrome.storage.sync.get(['holidays'], (data) => {
      let tmpHolidays = [];
      if (data.holidays) {
        tmpHolidays = data.holidays;
      }
      tmpHolidays = tmpHolidays.concat(
        getDatesInRange(
          new Date(holidayStart.value),
          new Date(holidayEnd.value)
        )
      );
      chrome.storage.sync.set({
        holidays: tmpHolidays,
      });
      holidayStart.value = null;
      holidayEnd.value = null;
    });
  }
});

function getDatesInRange(startDate, endDate) {
  const date = new Date(startDate.getTime());

  const dates = [];

  while (date <= endDate) {
    dates.push(new Date(date).toISOString().split('T')[0]);
    date.setDate(date.getDate() + 1);
  }

  return dates;
}
