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


VERSION 11 - CSV IMPORT
- Based on Version 10.
- Added Import CSV on Timesheets.
- Uses the same columns as Export CSV.
- Required: Date, Start, Finish, Break minutes.
- Supports Travel day all 1.5, Extra normal hours, OT 1.5 hours, OT 2.0 hours, Notes.
- Imported entries are added; existing records are not deleted.
- Invalid rows are skipped and reported.
- Imported CSV rows create a single work period from Start to Finish.


VERSION 12 - FLEXIBLE CSV IMPORT
- Based directly on Version 11.
- CSV importer now accepts dates in:
  YYYY-MM-DD
  D/M/YYYY
  DD/MM/YYYY
  D-M-YYYY
- CSV importer now accepts times in:
  HH:MM
  H:MM
  HH:MM:SS
  H:MM AM/PM
- Imported values are normalized back to the app's internal YYYY-MM-DD and HH:MM format.
- This fixes CSV files opened/edited/saved by Excel or mobile spreadsheet apps that reformat dates and times.
- All other Version 11 functionality remains unchanged.

VERSION 13 VISUAL REFRESH
- New professional Work Hours app icon
- Updated blue/cyan visual identity
- Cleaner card hierarchy, typography, forms and dialogs
- Redesigned mobile calendar and summary blocks
- Floating icon-based bottom navigation
- No database schema or calculation logic changes
- Service worker cache bumped to work-hours-v13

VERSION 14 VISUAL UPDATE
------------------------
- New Work Hours V14 icon filenames for Android/iPhone launcher refresh.
- New white/blue professional app shell based on the approved visual reference.
- Calendar / Summary / Reports segmented navigation.
- Calendar monthly KPI cards: recorded hours, work days, estimated gross.
- Summary gradient net-pay hero.
- Summary Income vs Deductions chart using real pay-cycle data.
- Summary pay-period hours breakdown.
- Reports monthly KPI cards.
- Reports stacked daily-hours chart for regular, 1.5x and 2.0x hours.
- Cleaner fixed bottom navigation.
- No IndexedDB schema or backup/restore format changes.
- Service worker cache updated to work-hours-v14 and uses network-first for app code.

ICON REFRESH
------------
The manifest now uses new filenames:
- icons/work-hours-v14-192.png
- icons/work-hours-v14-512.png
and iPhone uses icons/work-hours-v14-180.png.
This prevents the old icon URL from being reused from cache. Android launchers can still retain an installed icon; if it does not refresh after the V14 deployment, remove the installed PWA (do not clear Chrome site data) and install it again.


VERSION 15
----------
Added Bulk Work Planner on the Calendar page.
- Plan many standard work days across a date range/month.
- Select weekdays (Mon-Fri by default).
- Set one standard start time, finish time, break and optional note.
- Dates that already have work entries are always skipped, never overwritten.
- Every generated date is stored as a normal entry and can be edited later with the existing daily editor.
- Existing salary, tax, reports, backup/restore and IndexedDB structures are unchanged.


VERSION 16
----------
Added Invoice page:
- Select the same employer payment month/cycle used by Salary.
- TFN mode: gross, estimated PAYG withholding, other deductions and net payable.
- ABN mode: gross/total payable only.
- Invoice line items show regular, normal extra, 1.5x and 2.0x hours where applicable.
- Save your personal and paying-company details in Settings.
- Invoice number and invoice date are editable.
- Print / Save as PDF from the browser.
- TFN number is intentionally not stored or printed.
- Existing database schema, work entries, salary, tax, reports and bulk planning are unchanged.


VERSION 17
----------
Small navigation update:
- Settings removed from the bottom navigation.
- Settings moved to a top-right header button.
- Bottom navigation is back to five items.
- No calculations, data, invoice, salary, tax, report or calendar behaviour changed.


VERSION 18
----------
Icon cleanup only:
- Removed duplicate CSS-generated icons from bottom navigation.
- Bottom navigation now shows only the existing lower HTML icon for each item.
- Removed the solid square generated icon from Invoice.
- Made the top-right Settings gear clearly visible on the white header.
- No functionality or calculations changed.


VERSION 19
----------
Invoice PDF update:
- Page 1 remains the invoice/payment statement.
- App logo is hidden from printed/PDF output.
- TFN/ABN explanatory note and generated footer are hidden from printed/PDF output.
- Page 2 is a detailed work log for the selected payment cycle.
- Work log shows each recorded date, work period, break, total hours, pay breakdown and gross amount.
- Page 2 includes cycle total hours and gross earnings.
- On-screen app invoice remains branded.
- No work-hour, salary, PAYG, tax, report or database logic changed.


VERSION 20
----------
Invoice PDF print-fit fix:
- Increased A4 print margins.
- Added safe inner page padding.
- Prevents right-edge clipping on page 1 and page 2.
- Uses fixed table column widths for invoice and work-log tables.
- Tightened print font sizes and spacing for reliable A4 output.
- No invoice calculations or app functionality changed.
