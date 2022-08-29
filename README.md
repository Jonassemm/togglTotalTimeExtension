# togglTotalTimeExtension

## General

Chrome Extension that calculates the cumulative working time balance.
Currently it analyzes the whole working time from the first day to the current date.
The calculation considers the daily working time, public holidays, vacation days, sick-days, tracked time.

The extension popup displays the working time balance.

The extionsion injects the total balance to toggl.com in the timer page next to the daily and weekly total.

## API

Gets tracked time entries from api.track.toggl.com and public holidays from get.api-feiertage.de

## Config

-> right click on extension -> options

As a setup the **workplace ID, user email, API key, daily working time and first day** need to be set in the extensions options.

If you want need the total time injected to toggl.com you can enable that with the "Enable Toggl Injection" checkbox.

The options page is also for entering holidays and sick-days and managing them. Furthermore CSV reports can be generated for any given time span.
