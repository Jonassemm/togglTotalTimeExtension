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
  if (Date.now() - lastUpdate > 10000) {
    let coutingTime = 0;
    let currCount = document.querySelector(
      'span.time-format-utils__duration'
    ).innerHTML;
    currCount = currCount.replace(/<[^>]*>/gi, '');
    currCount = currCount.split(':');
    coutingTime += parseInt(currCount[0]) * 60 * 60 * 1000;
    coutingTime += parseInt(currCount[1]) * 60 * 1000;
    coutingTime += parseInt(currCount[2]) * 1000;
    console.log('-- updating real time --');
    updateTime(tmpTime + coutingTime);
    lastUpdate = Date.now();
  }
});

// observice changes in time list (deletin adding entries)
const timeListObserver = new MutationObserver(function (mutations) {
  window.setTimeout(() => {
    if (mutations[0].target.className != 'css-yht0st-Root et8m3zx1') {
      console.log('-- updating time list --');
      updateTime();
    }
  }, 1000);
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
      timeListObserver.observe(document.querySelector('.ejebv9b1').lastChild, {
        childList: true,
        subtree: true,
      });
      // start/stop count time action listener
      document
        .querySelector('button.ew4ipl50')
        .addEventListener('click', function () {
          window.setTimeout(() => {
            console.log('-- updating button click --');
            updateTime();
          }, 1000);
        });
      initTotalDisplay();
    });
  }
});

async function updateTime(updatedTime) {
  let time;
  if (initialized) {
    if (!updatedTime) {
      time = await dataFunctions.getTotal();
      tmpTime = time;
    } else time = updatedTime;
    let timeElement = document.getElementById('totalTime');
    if (time < 0) {
      timeElement.classList.add('totalTime-bad');
      timeElement.classList.remove('totalTime-good');
    } else {
      timeElement.classList.add('totalTime-good');
      timeElement.classList.remove('totalTime-bad');
    }
    timeElement.firstChild.nodeValue = dataFunctions.convertMsToTime(time);
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
  console.log('-- updating init --');
  updateTime();
}

function onUrlChange() {
  if (location.href == 'https://track.toggl.com/timer') {
    initTotalDisplay();
  }
}

chrome.storage.sync.get(['enableInject', 'connected'], (result) => {
  if (result.enableInject && result.connected) {
    observer.observe(document.querySelector('.content-wrapper'), {
      childList: true,
      subtree: true,
    });

    //update when storage changed
    chrome.storage.onChanged.addListener(function (changes, namespace) {
      console.log('-- updating storage change --');
      updateTime();
    });

    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        onUrlChange();
      }
    }).observe(document, { subtree: true, childList: true });
  }
});
