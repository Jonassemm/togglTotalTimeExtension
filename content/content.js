let lastUpdate = Date.now();
let countingStartTime = null;
let tmpTime = null;
let dataFunctions;
let initialized = false;

//initialize
async function initData() {
  dataFunctions = new DataFunctions();
  await dataFunctions.init();
  initialized = true;
}
// Observing change in today and week total time
const timeObserver = new MutationObserver(function (mutations) {
  if (Date.now() - lastUpdate > 1000) {
    let coutingTime = 0;
    let currCount = document.querySelector(
      'span.time-format-utils__duration'
    ).innerHTML;
    currCount = currCount.replace(/<[^>]*>/gi, '');
    currCount = currCount.split(':');
    coutingTime += parseInt(currCount[0]) * 60 * 60 * 1000;
    coutingTime += parseInt(currCount[1]) * 60 * 1000;
    coutingTime += parseInt(currCount[2]) * 1000;
    updateTime(tmpTime - coutingTime);
    lastUpdate = Date.now();
  }
});

//trigger when page loaded
const observer = new MutationObserver(function (mutations) {
  if (document.querySelector('.css-1705vbf-Column-TimerDashboardArea')) {
    observer.disconnect();
    initData().then(() => {
      timeObserver.observe(
        document.querySelector(
          'div.css-58wx68-TrackedTimeSummaryRoot.e81yt6p0'
        ),
        {
          childList: true,
          subtree: true,
          characterData: true,
        }
      );
      // start/stop count time action listener
      document
        .querySelector('button.ew4ipl50')
        .addEventListener('click', function () {
          window.setTimeout(() => {
            updateTime();
          }, 2000);
        });
      initTotalDisplay();
    });
  }
});

observer.observe(document.querySelector('.content-wrapper'), {
  childList: true,
  subtree: true,
});

async function updateTime(updatedTime) {
  let time;
  if (initialized) {
    if (!updatedTime) {
      time = await dataFunctions.getTotal();
      tmpTime = time;
    } else time = updatedTime;
    let timeElement = document.getElementById('totalTime');
    if (time > 0) {
      timeElement.classList.add('totalTime-bad');
      timeElement.classList.remove('totalTime-good');
    } else {
      timeElement.classList.add('totalTime-good');
      timeElement.classList.remove('totalTime-bad');
    }
    timeElement.firstChild.nodeValue =
      (time > 0 ? '- ' : '') + dataFunctions.convertMsToTime(Math.abs(time));
    return time;
  }
}

function initTotalDisplay() {
  let totalTimeElement = document.createElement('div');
  let totalTimeElementDiv = document.createElement('div');
  totalTimeElementDiv.appendChild(document.createTextNode('Total time: '));

  let timeSpan = document.createElement('span');
  timeSpan.id = 'totalTime';
  timeSpan.appendChild(document.createTextNode(''));

  totalTimeElementDiv.appendChild(timeSpan);

  totalTimeElement.classList.add(
    'css-58wx68-TrackedTimeSummaryRoot',
    'custom-total-time'
  );
  totalTimeElement.appendChild(totalTimeElementDiv);
  const appendElement = document.querySelector(
    '.css-1705vbf-Column-TimerDashboardArea'
  );
  document.querySelector('.custom-total-time')?.remove();
  appendElement.insertBefore(
    totalTimeElement,
    appendElement.querySelector(':nth-child(2)')
  );
  updateTime();
}

//update when storage changed
chrome.storage.onChanged.addListener(function (changes, namespace) {
  updateTime();
});

//updated when url changed to toggl.com/timer
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log(request.url); // new url is now in content scripts!
  if (request === 'update-url') {
    if ((request.url = 'https://track.toggl.com/timer')) {
      updateTime();
    }
  }
});
