WORK HOURS & SALARY - VERSION 2

NEW IN VERSION 2
- Calendar is now the main page.
- Tap any date to add hours manually.
- Enter start time, finish time, break minutes and notes.
- Calendar shows worked hours and estimated gross pay for each day.
- Selected day shows regular hours, overtime and gross pay.
- Existing entries can be edited or deleted from the calendar.
- Monthly salary tax now uses the ATO NAT 1007 Monthly tax table.
- Setting added for whether the tax-free threshold is claimed.
- Fixed tax percentage setting removed.

ATO TAX
The app embeds the NAT 1007 monthly table effective from 1 July 2024.
When an exact earnings amount is not listed, the nearest lower figure is used.
For gross monthly earnings above $12,675, the formulas printed on page 11
of NAT 1007 are used and the result is rounded to the nearest dollar.

Tax offsets from page 12 are NOT applied in this version.

DATA
Existing IndexedDB entries from Version 1 remain compatible when Version 2
is served from the same web origin/domain. If you install Version 2 at a
different address, export a backup from the old version and import it here.

PWA
Service workers require HTTPS or localhost.
For a computer test:
  python -m http.server 8080
then open:
  http://localhost:8080


NEW IN VERSION 3
- Superannuation rate setting (default 12%).
- Option to include or exclude overtime earnings from the super calculation.
- Salary page shows employer super for the selected month.
- Salary page shows accumulated super year-to-date (January through selected month).
- Super is displayed separately and does not reduce estimated net pay.

SUPER CALCULATION
The app defaults to 12%.
By default, super is calculated on regular/ordinary earnings only.
You can change "Include overtime earnings in super calculation?" in Settings
if your employment arrangement requires super on those earnings.


VERSION 4 - PWA INSTALLATION IMPROVEMENTS
- Default break for a new entry is now 30 minutes.
- Added 192x192 and 512x512 PNG app icons.
- Added explicit PWA scope and app ID.
- Designed to be hosted over HTTPS (for example GitHub Pages) and then installed on Android.
- Once installed and cached, the app can open and work offline.


VERSION 5 - MANUAL PAY RATE SPLIT
- Each work entry can now split worked hours into:
  * base hours
  * extra hours at normal rate (1.0x)
  * overtime at 1.5x
  * overtime at 2.0x
- Remaining worked hours are automatically treated as base-rate hours.
- Split hours cannot exceed the total worked time for the entry.
- Existing entries remain compatible and are treated as base-rate hours.
- Salary page reports each pay category separately.


VERSION 6 - AUTOMATIC PAY CYCLES
- Salary is no longer calculated by normal calendar month.
- Each selected pay month uses the company's payroll-cycle rule:
  1. Find the last Thursday of the selected month.
  2. Close the pay cycle on the Saturday before the week containing that Thursday.
  3. Start the cycle on the Monday after the previous cycle closes.
- This automatically creates 4-week or 5-week cycles.
- Example: September 2026 = 24 Aug 2026 to 19 Sep 2026.
- The following cycle starts Monday 21 Sep 2026.
- Super YTD now follows pay cycles rather than simple calendar months.


VERSION 7
- Remembers the last selected month across Calendar, Salary and Timesheets.
- The selected month persists when moving between pages or reopening the app.
- Daily dollar amounts were removed from calendar cells.
- Salary calculations remain unchanged and are still shown on the Salary page.


VERSION 8 - TRAVEL DAY ALL AT 1.5X
- Added a Travel day checkbox to work entries.
- When enabled, all worked time after the break is paid at the 1.5x rate.
- Manual 1.0x / 1.5x / 2.0x split fields are disabled for that entry.
- Existing entries remain unchanged.


VERSION 9 - TAX YEAR PAGE
- Adds a separate Tax Year page without changing the existing V8 work-entry, salary, timesheet or settings calculations.
- Supports 2024/25, 2025/26 and 2026/27 Australian resident individual tax-rate estimates.
- Summarises work income from entries dated 1 July to 30 June.
- Allows other taxable income and actual PAYG withheld to be entered for each tax year.
- If actual PAYG is blank, the page estimates PAYG using the app's existing monthly PAYG table.
- Adds editable tax-year expenses with date, category, description and deductible amount.
- Calculates estimated taxable income, income tax, LITO, optional simple 2% Medicare levy, and estimated refund/amount payable.
- Tax expenses are stored locally in IndexedDB on the device.
- Tax result is an estimate only and does not cover every tax circumstance.


VERSION 10 - MULTIPLE WORK PERIODS
- Based directly on Version 9.
- Added multiple work periods inside one daily entry.
- Example: 07:00-10:00 and 13:30-17:00 are added together as worked time.
- Break minutes are still deducted once from the total worked time.
- Existing single-period entries remain compatible.
- All existing pay-rate, travel-day, salary, tax-year, timesheet and settings functions remain in place.
- New unsaved-user default hourly rate changed from $38.00 to $26.44.
- An already saved hourly rate is NOT overwritten.
