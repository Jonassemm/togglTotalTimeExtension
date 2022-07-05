class DataFunctions {
  constructor() {
    this.hollidayCount = 10;
    this.sickCount = 2;
    this.firstDay = new Date('2021-11-15');
    this.dailyTime = 10800000; //time in ms
    this.hollidays = [];
  }

  init = function () {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        ['hollidayCount', 'sickCount', 'hollidays'],
        (data) => {
          if (data.hollidayCount) {
            this.hollidayCount = data.hollidayCount;
          }
          if (data.sickCount) {
            this.sickCount = data.sickCount;
          }

          if (data.hollidays) {
            this.hollidays = data.hollidays;
            resolve();
          } else {
            this.fetchHollidays().then(() => {
              resolve();
            });
          }
        }
      );
    });
  };

  fetchHollidays = async function () {
    return fetch(`https://get.api-feiertage.de?years=2021,2022,2023&states=bw`)
      .then((response) => response.json())
      .then((data) => data.feiertage)
      .then((data) => data.map((data) => data.date))
      .then((data) => {
        chrome.storage.sync.set({ hollidays: data });
        this.hollidays = data;
      });
  };

  getToggl = async function (start, end) {
    var myHeaders = new Headers();
    myHeaders.append(
      'Authorization',
      'Basic NjE2YmRhNDllMTg4NzYyN2I2Njg3NmFhNTQ2MDEwOWI6YXBpX3Rva2Vu'
    );

    var requestOptions = {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
    };

    return fetch(
      `https://api.track.toggl.com/reports/api/v2/summary?workspace_id=1714409&user_agent=jonas@kurviger.de&since=${start}&until=${end}`,
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => result.total_grand)
      .catch((error) => console.log('error', error));
  };

  getBusinessDatesCount = function (startDate, endDate, hollidays) {
    let count = 0;
    const curDate = new Date(startDate.getTime());
    while (curDate <= endDate) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        if (!hollidays.includes(curDate.toISOString().split('T')[0])) {
          count++;
        }
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  };

  getTotal = async function () {
    const workingDays = this.getBusinessDatesCount(
      this.firstDay,
      new Date(),
      this.hollidays
    );
    const targetTime = workingDays * this.dailyTime;
    const hollidayTime = this.hollidayCount * this.dailyTime;
    const sickTime = this.sickCount * this.dailyTime;
    let togglTime = await this.getToggl(
      this.firstDay.toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );
    return targetTime - togglTime - hollidayTime - sickTime;
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
