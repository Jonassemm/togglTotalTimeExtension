/* 
const workspace_id = 1714409;
const user_agent = 'jonas@kurviger.de';
const authorization =
  'NjE2YmRhNDllMTg4NzYyN2I2Njg3NmFhNTQ2MDEwOWI6YXBpX3Rva2Vu';
 */
class DataFunctions {
  constructor() {
    this.firstDay = new Date('2021-11-15');
    this.dailyTime = 10800000; //time in ms
    this.publicHolidays = [];
    this.holidays = [];
    this.sickdays = [];
    this.workspaceID;
    this.userAgent;
    this.authKey;
  }

  init = function () {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        [
          'workspaceID',
          'userAgent',
          'authKey',
          'sickdays',
          'holidays',
          'publicHolidays',
        ],
        (data) => {
          if (data.holidays) {
            this.holidays = data.holidays;
          }
          if (data.sickdays) {
            this.sickdays = data.sickdays;
          }
          if (data.sickCount) {
            this.sickCount = data.sickCount;
          }
          if (data.workspaceID && data.userAgent && data.authKey) {
            this.workspaceID = data.workspaceID;
            this.userAgent = data.userAgent;
            this.authKey = data.authKey;
          } else {
            alert(
              'Please enter your workspace ID, user agent and authorization key in the extension options to get data from Toggl!'
            );
          }
          if (data.publicHolidays) {
            this.publicHolidays = data.publicHolidays;
            resolve();
          } else {
            this.fetchHolidays().then(() => {
              resolve();
            });
          }
        }
      );
    });
  };

  fetchHolidays = async function () {
    return fetch(`https://get.api-feiertage.de?years=2021,2022,2023&states=bw`)
      .then((response) => response.json())
      .then((data) => data.feiertage)
      .then((data) => data.map((data) => data.date))
      .then((data) => {
        chrome.storage.sync.set({ publicHolidays: data });
        this.publicHolidays = data;
      });
  };

  getToggl = async function (start, end) {
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
        if (
          !this.publicHolidays.includes(curDate.toISOString().split('T')[0])
        ) {
          count++;
        }
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  };

  getDatesInRange = function (start, end, range) {
    let output = [];
    for (let i = 0; i < range.length; i++) {
      if (new Date(range[i]) > start && new Date(range[i]) < end) {
        output.push(range[i]);
      }
    }
    return output;
  };

  getTotal = async function (start = this.firstDay, end = new Date()) {
    const workingDays = this.getBusinessDatesCount(start, end);
    const targetTime = workingDays * this.dailyTime;
    const holidayCount = this.getDatesInRange(start, end, this.holidays).length;
    const holidayTime = holidayCount * this.dailyTime;
    const sickCount = this.getDatesInRange(start, end, this.sickdays).length;
    const sickTime = sickCount * this.dailyTime;
    let togglTime = await this.getToggl(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    );
    return targetTime - togglTime - holidayTime - sickTime;
  };

  padTo2Digits = function (num) {
    return num.toString().padStart(2, '0');
  };

  convertMsToTime = function (milliseconds) {
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    minutes = minutes % 60;
    return `${this.padTo2Digits(hours)} hours ${this.padTo2Digits(
      minutes
    )} minutes`;
  };
}
