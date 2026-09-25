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
