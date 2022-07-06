const submitBtn = document.querySelector('#saveOptions');
const workspace_id = document.querySelector('#workspaceID');
const user_agent = document.querySelector('#userAgent');
const authorization = document.querySelector('#authKey');
const saveSuccess = document.getElementById('saveSuccess');
const saveHoliday = document.querySelector('#saveHoliday');
const saveSick = document.querySelector('#saveSick');
const generateReport = document.querySelector('#generateReport');
const enableInject = document.querySelector('#enableInject');
const firstDay = document.querySelector('#firstDay');
const dailyTime = document.querySelector('#dailyTime');

submitBtn.addEventListener('click', () => {
  if (
    workspace_id.value &&
    user_agent.value &&
    authorization.value &&
    firstDay.value &&
    dailyTime.value
  ) {
    chrome.storage.sync.set({
      workspaceID: workspace_id.value,
      userAgent: user_agent.value,
      authKey: authorization.value,
      firstDay: firstDay.value,
      dailyTime: dailyTime.value * 60 * 1000,
    });
    saveSuccess.style.display = 'block';
  }
});

enableInject.addEventListener('change', (e) => {
  chrome.storage.sync.set({ enableInject: e.target.checked });
});

function initFields() {
  chrome.storage.sync.get(
    [
      'workspaceID',
      'userAgent',
      'authKey',
      'holidays',
      'sickdays',
      'enableInject',
      'firstDay',
      'dailyTime',
    ],
    (data) => {
      if (data.firstDay) {
        firstDay.value = data.firstDay;
      }
      if (data.dailyTime) {
        dailyTime.value = data.dailyTime / 1000 / 60;
      }
      if (data.enableInject) {
        enableInject.checked = true;
      }
      if (data.workspaceID) {
        workspace_id.value = data.workspaceID;
      }
      if (data.userAgent) {
        user_agent.value = data.userAgent;
      }
      if (data.authKey) {
        authorization.value = data.authKey;
      }
      let arr = [];
      if (data.holidays) {
        arr = data.holidays.map((holiday) => {
          return {
            date: holiday,
            type: 'holiday',
          };
        });
      }
      if (data.sickdays) {
        arr = arr.concat(
          data.sickdays.map((sickday) => {
            return {
              date: sickday,
              type: 'sickday',
            };
          })
        );
      }
      populateOffDayTable(arr);
      let deleteEntryButtons = document.querySelectorAll('.deleteEntryButton');
      deleteEntryButtons.forEach((button) => {
        button.addEventListener(
          'click',
          deleteDateEntry.bind(null, button.value)
        );
      });
    }
  );
}

function deleteDateEntry(idx) {
  chrome.storage.sync.get(['holidays', 'sickdays'], (data) => {
    if (data.holidays.length > idx) {
      let tmpArr = data.holidays;
      tmpArr.splice(idx, 1);
      chrome.storage.sync.set({ holidays: tmpArr });
    } else {
      let tmpArr = data.sickdays;
      tmpArr.splice(idx - data.holidays.length, 1);
      chrome.storage.sync.set({ sickdays: tmpArr });
    }
    location.reload();
  });
}

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

saveHoliday.addEventListener(
  'click',
  specialDayListener.bind(
    null,
    document.getElementById('holidayStart'),
    document.getElementById('holidayEnd'),
    'holidays'
  )
);

generateReport.addEventListener('click', () => {
  let start = document.getElementById('reportStart')?.value;
  let end = document.getElementById('reportEnd')?.value;
  if (start && end) {
    let dataFunctions = new DataFunctions();
    dataFunctions.init().then(() => {
      dataFunctions.generateReport(new Date(start), new Date(end));
    });
  } else {
    alert('Please enter a start and end date');
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

function populateOffDayTable(arr) {
  const table = document.getElementById('offDayTable');
  arr.map((entry, index) => {
    let tr = document.createElement('tr');
    let td = document.createElement('td');
    td.textContent = index;
    tr.appendChild(td);
    let td2 = document.createElement('td');
    td2.textContent = entry?.type;
    tr.appendChild(td2);
    let td3 = document.createElement('td');
    td3.textContent = entry?.date;
    tr.appendChild(td3);
    let btn = document.createElement('button');
    btn.textContent = 'Delete';
    btn.value = index;
    btn.classList.add('deleteEntryButton');
    let td4 = document.createElement('td');
    td4.appendChild(btn);
    tr.appendChild(td4);
    table.appendChild(tr);
  });
}

initFields();
