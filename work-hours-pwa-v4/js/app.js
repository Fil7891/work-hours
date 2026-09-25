const monthTitle = document.getElementById("monthTitle");
const monthSummary = document.getElementById("monthSummary");
const calendarGrid = document.getElementById("calendarGrid");
const selectedDateTitle = document.getElementById("selectedDateTitle");
const selectedEntries = document.getElementById("selectedEntries");
const addHoursBtn = document.getElementById("addHoursBtn");
const daySummary = document.getElementById("daySummary");
const dlg = document.getElementById("entryDialog");
const form = document.getElementById("entryForm");
const delBtn = document.getElementById("deleteEntryBtn");

let shownMonth = new Date();
shownMonth = new Date(shownMonth.getFullYear(), shownMonth.getMonth(), 1);
let selectedDate = ymd(new Date());
let deferredPrompt = null;

function localYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function minutesToDayPay(mins, settings) {
  const threshold = settings.regularHoursPerDay * 60;
  const regular = Math.min(mins, threshold);
  const overtime = Math.max(0, mins - threshold);
  return {
    regular,
    overtime,
    pay: regular/60*settings.hourlyRate +
         overtime/60*settings.hourlyRate*settings.overtimeMultiplier
  };
}
async function renderCalendar() {
  const entries = await getAllEntries();
  const settings = await getSettings();
  const year = shownMonth.getFullYear(), month = shownMonth.getMonth();
  monthTitle.textContent = shownMonth.toLocaleDateString("en-AU",{month:"long",year:"numeric"});

  const monthPrefix = `${year}-${String(month+1).padStart(2,"0")}`;
  const monthEntries = entries.filter(e => e.date.startsWith(monthPrefix));
  const monthMinutes = monthEntries.reduce((a,e)=>a+entryMinutes(e),0);
  monthSummary.textContent = `${fmtMinutes(monthMinutes)} recorded`;

  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month+1, 0).getDate();

  let html = "";
  for (let i=0;i<startOffset;i++) html += `<div class="calendar-day blank"></div>`;

  for (let day=1;day<=daysInMonth;day++) {
    const d = new Date(year, month, day);
    const ds = localYmd(d);
    const dayEntries = entries.filter(e=>e.date===ds);
    const mins = dayEntries.reduce((a,e)=>a+entryMinutes(e),0);
    const payInfo = minutesToDayPay(mins, settings);
    const isSelected = ds === selectedDate;
    const isToday = ds === localYmd(new Date());
    html += `
      <button class="calendar-day ${isSelected?"selected":""} ${isToday?"today":""} ${mins?"worked":""}" data-date="${ds}">
        <span class="day-number">${day}</span>
        ${mins ? `<span class="day-hours">${compactHours(mins)}</span><span class="day-pay">${fmtMoney(payInfo.pay)}</span>` : `<span class="day-empty">+</span>`}
      </button>`;
  }
  calendarGrid.innerHTML = html;
  document.querySelectorAll(".calendar-day[data-date]").forEach(el => {
    el.addEventListener("click", async () => {
      selectedDate = el.dataset.date;
      await renderCalendar();
      await renderSelectedDay();
    });
  });
}
function compactHours(mins) {
  const h = mins/60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}
async function renderSelectedDay() {
  if (!selectedDate) return;
  addHoursBtn.disabled = false;
  const d = new Date(selectedDate+"T12:00:00");
  selectedDateTitle.textContent = d.toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

  const settings = await getSettings();
  const entries = (await getAllEntries()).filter(e=>e.date===selectedDate).sort((a,b)=>a.start.localeCompare(b.start));
  const mins = entries.reduce((a,e)=>a+entryMinutes(e),0);
  const info = minutesToDayPay(mins, settings);

  daySummary.classList.remove("hidden");
  document.getElementById("selectedHours").textContent = fmtMinutes(mins);
  document.getElementById("selectedRegular").textContent = fmtMinutes(info.regular);
  document.getElementById("selectedOvertime").textContent = fmtMinutes(info.overtime);
  document.getElementById("selectedPay").textContent = fmtMoney(info.pay);

  if (!entries.length) {
    selectedEntries.innerHTML = `<div class="empty">No hours recorded for this day. Tap <strong>Add hours</strong>.</div>`;
    return;
  }
  selectedEntries.innerHTML = entries.map(e=>`
    <button class="selected-entry" data-id="${e.id}">
      <div>
        <strong>${e.start} – ${e.end}</strong>
        <span>Break ${e.breakMinutes||0}m${e.notes ? ` · ${escapeHtml(e.notes)}` : ""}</span>
      </div>
      <strong>${fmtMinutes(entryMinutes(e))}</strong>
    </button>`).join("");
  document.querySelectorAll(".selected-entry").forEach(el=>el.onclick=()=>openEdit(Number(el.dataset.id)));
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function clearForm() {
  form.reset();
  document.getElementById("entryId").value = "";
  document.getElementById("entryDate").value = selectedDate;
  document.getElementById("entryBreak").value = 30;
  document.getElementById("dialogTitle").textContent = "Add hours";
  delBtn.classList.add("hidden");
  updatePreview();
}
async function openEdit(id) {
  const e = (await getAllEntries()).find(x=>x.id===id);
  if (!e) return;
  document.getElementById("entryId").value=e.id;
  document.getElementById("entryDate").value=e.date;
  document.getElementById("entryStart").value=e.start;
  document.getElementById("entryEnd").value=e.end;
  document.getElementById("entryBreak").value=e.breakMinutes||0;
  document.getElementById("entryNotes").value=e.notes||"";
  document.getElementById("dialogTitle").textContent="Edit hours";
  delBtn.classList.remove("hidden");
  await updatePreview();
  dlg.showModal();
}
async function updatePreview() {
  const start = document.getElementById("entryStart").value;
  const end = document.getElementById("entryEnd").value;
  const breakMinutes = Number(document.getElementById("entryBreak").value||0);
  if (!start || !end) {
    document.getElementById("previewHours").textContent="0h 00m";
    document.getElementById("previewPay").textContent="$0.00";
    return;
  }
  const mins = Math.max(0, minutesBetween(start,end)-breakMinutes);
  const settings = await getSettings();
  const info = minutesToDayPay(mins,settings);
  document.getElementById("previewHours").textContent=fmtMinutes(mins);
  document.getElementById("previewPay").textContent=fmtMoney(info.pay);
}

document.getElementById("prevMonth").onclick=async()=>{shownMonth=new Date(shownMonth.getFullYear(),shownMonth.getMonth()-1,1);selectedDate=localYmd(shownMonth);await renderCalendar();await renderSelectedDay();};
document.getElementById("nextMonth").onclick=async()=>{shownMonth=new Date(shownMonth.getFullYear(),shownMonth.getMonth()+1,1);selectedDate=localYmd(shownMonth);await renderCalendar();await renderSelectedDay();};
addHoursBtn.onclick=()=>{clearForm();dlg.showModal();};
document.getElementById("cancelDialogBtn").onclick=()=>dlg.close();
["entryStart","entryEnd","entryBreak"].forEach(id=>document.getElementById(id).addEventListener("input",updatePreview));

form.addEventListener("submit", async e => {
  e.preventDefault();
  const id = Number(document.getElementById("entryId").value)||null;
  const value = {
    date: document.getElementById("entryDate").value,
    start: document.getElementById("entryStart").value,
    end: document.getElementById("entryEnd").value,
    breakMinutes: Number(document.getElementById("entryBreak").value||0),
    notes: document.getElementById("entryNotes").value.trim()
  };
  if (id) { value.id=id; await updateEntry(value); }
  else await addEntry(value);
  selectedDate=value.date;
  shownMonth=new Date(Number(value.date.slice(0,4)),Number(value.date.slice(5,7))-1,1);
  dlg.close();
  await renderCalendar();
  await renderSelectedDay();
});
delBtn.onclick=async()=>{
  const id=Number(document.getElementById("entryId").value);
  if(id && confirm("Delete this work entry?")){
    await deleteEntry(id); dlg.close(); await renderCalendar(); await renderSelectedDay();
  }
};

window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;document.getElementById("installBtn").classList.remove("hidden");});
document.getElementById("installBtn").onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;}};
if("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js");

renderCalendar().then(renderSelectedDay);
