class DataFunctions {
  constructor() {
    this.firstDay = new Date();
    this.dailyTime = 0;
    this.publicHolidays = [];
    this.holidays = [];
    this.sickdays = [];
    this.workspaceID;
    this.userAgent;
    this.authKey;
  }

  init = function () {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(
        [
          'workspaceID',
          'userAgent',
          'authKey',
          'sickdays',
          'holidays',
          'publicHolidays',
          'firstDay',
          'dailyTime',
        ],
        (data) => {
          if (
            data.firstDay &&
            data.dailyTime &&
            data.userAgent &&
            data.authKey
          ) {
            this.firstDay = new Date(data.firstDay);
            this.dailyTime = data.dailyTime;
            this.workspaceID = data.workspaceID;
            this.userAgent = data.userAgent;
            this.authKey = data.authKey;

            if (data.sickdays) {
              this.sickdays = data.sickdays;
            }

            if (data.holidays) {
              this.holidays = data.holidays;
            }
            this.fetchHolidays(this.firstDay).then(() => {
              resolve();
            });
          } else {
            alert(
              'Please enter your workspace ID, user agent and authorization key in the extension options to get data from Toggl!'
            );
            reject('Options not set!');
          }
        }
      );
    });
  };

  fetchHolidays = async function (firstDay) {
    let firstYear = new Date(firstDay).getFullYear();
    if (!firstYear) firstYear = 2021;
    const currentYear = new Date().getFullYear();

    let years = '';
    for (let year = firstYear; year <= currentYear; year++) {
      years += year + ',';
    }
    years = years.slice(0, -1); // Remove the trailing comma

    return fetch(`https://get.api-feiertage.de?years=${years}&states=bw`)
      .then((response) => response.json())
      .then((data) => data.feiertage)
      .then((data) => data.map((data) => data.date))
      .then((data) => {
        chrome.storage.sync.set({ publicHolidays: data });
        this.publicHolidays = data;
      });
  };

  getWorkspaces = function () {
    var myHeaders = new Headers();
    myHeaders.append(
      'Authorization',
      `Basic ${btoa(this.authKey + ':api_token')}`
    );

    var requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
    };

    return fetch(
      'https://api.track.toggl.com/api/v8/workspaces',
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => {
        return result.map((data) => {
          return { id: data.id, name: data.name };
        });
      })
      .catch((error) => console.log('error', error));
  };

  getToggl = async function (start, end) {
    let sumOverYears = 0;
    let startYear = start.getFullYear();
    let endYear = end.getFullYear();
    const diff = endYear - startYear + 1;
    if (diff > 1) {
      for (let i = 0; i < diff; i++) {
        if (i == 0) {
          let endOfYear = new Date(startYear, 11, 31);
          sumOverYears += await this.fetchTogglData(start, endOfYear);
          continue;
        }
        if (i == diff - 1) {
          let startOfYear = new Date(endYear, 0, 1);
          sumOverYears += await this.fetchTogglData(startOfYear, end);
          continue;
        }
        let startOfYear = new Date(startYear + i, 0, 1);
        let endOfYear = new Date(startYear + i, 11, 31);
        sumOverYears += await this.fetchTogglData(startOfYear, endOfYear);
      }
    } else {
      sumOverYears = await this.fetchTogglData(start, end);
    }
    return sumOverYears;
  };

  fetchTogglData = async function (start, end) {
    var myHeaders = new Headers();
    myHeaders.append(
      'Authorization',
      `Basic ${btoa(this.authKey + ':api_token')}`
    );
    var requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
    };

    start = start.toISOString().split('T')[0];
    end = end.toISOString().split('T')[0];

    return fetch(
      `https://api.track.toggl.com/reports/api/v2/summary?workspace_id=${this.workspaceID}&user_agent=${this.userAgent}&since=${start}&until=${end}`,
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => result.total_grand)
      .catch((error) => console.log('error', error));
  };

  getBusinessDatesCount = function (startDate, endDate) {
    let count = 0;
    const curDate = new Date(startDate.getTime());
    while (curDate <= endDate) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  };

  getDatesInRange = function (start, end, range) {
    let output = [];
    for (let i = 0; i < range.length; i++) {
      if (new Date(range[i]) >= start && new Date(range[i]) <= end) {
        const dayOfWeek = new Date(range[i]).getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          output.push(range[i]);
        }
      }
    }
    return output;
  };

  getTotal = async function (start = this.firstDay, end = new Date()) {
    const workingDays = this.getBusinessDatesCount(start, end);
    const publicHolidayCount = this.getDatesInRange(
      start,
      end,
      this.publicHolidays
    ).length;
    const holidayCount = this.getDatesInRange(start, end, this.holidays).length;
    const sickCount = this.getDatesInRange(start, end, this.sickdays).length;
    const targetTime =
      (workingDays - holidayCount - sickCount - publicHolidayCount) *
      this.dailyTime;
    let togglTime = await this.getToggl(start, end);
    return togglTime - targetTime;
  };

  padTo2Digits = function (num) {
    return num.toString().padStart(2, '0');
  };

  generateReport = async function (start, end) {
    let workingDays = this.getBusinessDatesCount(start, end);
    let holidayCount = this.getDatesInRange(start, end, this.holidays).length;
    let publicHolidayCount = this.getDatesInRange(
      start,
      end,
      this.publicHolidays
    ).length;
    let sickCount = this.getDatesInRange(start, end, this.sickdays).length;
    let targetTime =
      (workingDays - holidayCount - sickCount - publicHolidayCount) *
      this.dailyTime;
    let togglTime = await this.getToggl(start, end);
    let diff = togglTime - targetTime;

    const output = {
      workingDays,
      holidayCount,
      publicHolidayCount,
      sickCount,
      targetTime: this.convertMsToTime(targetTime),
      togglTime: this.convertMsToTime(togglTime),
      diff: this.convertMsToTime(diff),
    };
    download(output);
  };

  convertMsToTime = function (milliseconds) {
    let negative = milliseconds < 0;
    milliseconds = Math.abs(milliseconds);
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    minutes = minutes % 60;
    return `${negative ? '-' : ''} ${this.padTo2Digits(
      hours
    )} hours ${this.padTo2Digits(minutes)} minutes`;
  };
}

function download(obj) {
  const csvData = csvmaker(obj);
  const blob = new Blob([csvData], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', 'download.csv');
  a.click();
}

const csvmaker = function (data) {
  csvRows = [];
  const headers = Object.keys(data);
  csvRows.push(headers.join(','));
  const values = Object.values(data).join(',');
  csvRows.push(values);
  return csvRows.join('\n');
};
