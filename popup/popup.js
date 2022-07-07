let totalTimeElement = document.getElementById('totalTime');

async function updateTotal() {
  let totalTime = await dataFunctions.getTotal();
  totalTimeElement.innerHTML = dataFunctions.convertMsToTime(totalTime);
  if (totalTime > 0) {
    totalTimeElement.classList.add('workTime-good');
    totalTimeElement.classList.remove('workTime-bad');
  } else {
    totalTimeElement.classList.add('workTime-bad');
    totalTimeElement.classList.remove('workTime-good');
  }
}

let getButton = document.getElementById('getTimeButton');
getButton.addEventListener('click', function () {
  updateTotal();
});

const dataFunctions = new DataFunctions();
dataFunctions.init().then(() => {
  updateTotal();
});

document.querySelector('#go-to-options').addEventListener('click', function () {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});
