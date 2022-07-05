const dataFunctions = new DataFunctions();
(async () => {
  await dataFunctions.init();
  document.getElementById('hollidayCount').innerHTML =
    dataFunctions.hollidayCount;
  document.getElementById('sickCount').innerHTML = dataFunctions.sickCount;
  updateTotal();
})();

let totalTimeElement = document.getElementById('totalTime');

async function updateTotal() {
  let totalTime = await dataFunctions.getTotal();
  totalTimeElement.innerHTML =
    (totalTime > 0 ? '- ' : '+ ') +
    dataFunctions.convertMsToTime(Math.abs(totalTime));
  if (totalTime < 0) {
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

let increaseHollidaysButton = document.getElementById('increaseHollidays');
increaseHollidaysButton.addEventListener('click', function () {
  const newHollidayCount = dataFunctions.hollidayCount + 1;
  dataFunctions.hollidayCount++;
  chrome.storage.sync.set({ hollidayCount: newHollidayCount });
  document.getElementById('hollidayCount').innerHTML = newHollidayCount;
  updateTotal();
});
let decreaseHollidaysButton = document.getElementById('decreaseHollidays');
decreaseHollidaysButton.addEventListener('click', function () {
  const newHollidayCount = dataFunctions.hollidayCount - 1;
  dataFunctions.hollidayCount--;
  chrome.storage.sync.set({ hollidayCount: newHollidayCount });
  document.getElementById('hollidayCount').innerHTML = newHollidayCount;
  updateTotal();
});
let increaseSickButton = document.getElementById('increaseSick');
increaseSickButton.addEventListener('click', function () {
  const newSickCount = dataFunctions.sickCount + 1;
  dataFunctions.sickCount++;
  chrome.storage.sync.set({ sickCount: newSickCount });
  document.getElementById('sickCount').innerHTML = newSickCount;
  updateTotal();
});
let decreaseSickButton = document.getElementById('decreaseSick');
decreaseSickButton.addEventListener('click', function () {
  const newSickCount = dataFunctions.sickCount - 1;
  dataFunctions.sickCount--;
  chrome.storage.sync.set({ sickCount: newSickCount });
  document.getElementById('sickCount').innerHTML = newSickCount;
  updateTotal();
});
