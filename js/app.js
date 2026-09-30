
function saveSelectedMonthFromDate(d){
  const value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  localStorage.setItem("selectedMonth", value);
}

function loadSelectedMonthDate(){
  const saved = localStorage.getItem("selectedMonth");
  if(saved && /^\d{4}-\d{2}$/.test(saved)){
    const [y,m] = saved.split("-").map(Number);
    return new Date(y, m-1, 1);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

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

let shownMonth = loadSelectedMonthDate();
shownMonth = new Date(shownMonth.getFullYear(), shownMonth.getMonth(), 1);
let selectedDate = ymd(new Date());
let deferredPrompt = null;

function localYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function minutesToDayPay(entries, settings) {
  const total = {minutes:0, base:0, extraNormal:0, overtime15:0, overtime20:0, pay:0};
  for (const e of entries) {
    const b = entryPayBreakdown(e, settings);
    total.minutes += b.total;
    total.base += b.base;
    total.extraNormal += b.extraNormal;
    total.overtime15 += b.overtime15;
    total.overtime20 += b.overtime20;
    total.pay += b.gross;
  }
  return total;
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
    const payInfo = minutesToDayPay(dayEntries, settings);
    const isSelected = ds === selectedDate;
    const isToday = ds === localYmd(new Date());
    html += `
      <button class="calendar-day ${isSelected?"selected":""} ${isToday?"today":""} ${mins?"worked":""}" data-date="${ds}">
        <span class="day-number">${day}</span>
        ${mins ? `<span class="day-hours">${compactHours(mins)}</span>` : `<span class="day-empty">+</span>`}
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
  const info = minutesToDayPay(entries, settings);

  daySummary.classList.remove("hidden");
  document.getElementById("selectedHours").textContent = fmtMinutes(mins);
  document.getElementById("selectedBase").textContent = fmtMinutes(info.base);
  document.getElementById("selectedExtraNormal").textContent = fmtMinutes(info.extraNormal);
  document.getElementById("selectedOT15").textContent = fmtMinutes(info.overtime15);
  document.getElementById("selectedOT20").textContent = fmtMinutes(info.overtime20);
  document.getElementById("selectedPay").textContent = fmtMoney(info.pay);

  if (!entries.length) {
    selectedEntries.innerHTML = `<div class="empty">No hours recorded for this day. Tap <strong>Add hours</strong>.</div>`;
    return;
  }
  selectedEntries.innerHTML = entries.map(e=>`
    <button class="selected-entry" data-id="${e.id}">
      <div>
        <strong>${entryPeriodsText(e)}</strong>
        <span>Break ${e.breakMinutes||0}m${rateSplitText(e)}${e.notes ? ` · ${escapeHtml(e.notes)}` : ""}</span>
      </div>
      <strong>${fmtMinutes(entryMinutes(e))}</strong>
    </button>`).join("");
  document.querySelectorAll(".selected-entry").forEach(el=>el.onclick=()=>openEdit(Number(el.dataset.id)));
}
function rateSplitText(e) {
  if (e.travelAll15 === true) return " · Travel day: all @1.5×";
  const bits = [];
  if (Number(e.extraNormalHours||0) > 0) bits.push(`${Number(e.extraNormalHours)}h @1.0×`);
  if (Number(e.overtime15Hours||0) > 0) bits.push(`${Number(e.overtime15Hours)}h @1.5×`);
  if (Number(e.overtime20Hours||0) > 0) bits.push(`${Number(e.overtime20Hours)}h @2.0×`);
  return bits.length ? ` · ${bits.join(" · ")}` : "";
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

function getWorkPeriodsFromForm(){
  return [...document.querySelectorAll("#workPeriods .work-period-row")]
    .map(row=>({
      start: row.querySelector(".period-start").value,
      end: row.querySelector(".period-end").value
    }))
    .filter(p=>p.start || p.end);
}

function createWorkPeriodRow(start="", end="", removable=true){
  const row=document.createElement("div");
  row.className="work-period-row";
  row.innerHTML=`
    <label>Start time<input type="time" class="period-start" value="${escapeHtml(start)}" required></label>
    <label>Finish time<input type="time" class="period-end" value="${escapeHtml(end)}" required></label>
    ${removable ? '<button type="button" class="remove-period-btn ghost" aria-label="Remove work period">Remove</button>' : ""}
  `;
  row.querySelectorAll("input").forEach(input=>input.addEventListener("input",updatePreview));
  const remove=row.querySelector(".remove-period-btn");
  if(remove) remove.addEventListener("click",()=>{row.remove();updatePreview();});
  return row;
}

function setWorkPeriods(periods){
  const container=document.getElementById("workPeriods");
  container.innerHTML="";
  const list=(Array.isArray(periods)&&periods.length)?periods:[{start:"",end:""}];
  list.forEach((p,i)=>container.appendChild(createWorkPeriodRow(p.start||"",p.end||"",i>0)));
}

function addWorkPeriod(){
  document.getElementById("workPeriods").appendChild(createWorkPeriodRow("","",true));
}

function clearForm() {
  form.reset();
  setWorkPeriods([{start:"",end:""}]);
  document.getElementById("entryId").value = "";
  document.getElementById("entryDate").value = selectedDate;
  document.getElementById("entryBreak").value = 30;
  document.getElementById("entryExtraNormal").value = 0;
  document.getElementById("entryOT15").value = 0;
  document.getElementById("entryOT20").value = 0;
  document.getElementById("entryTravelAll15").checked = false;
  updateTravelModeUI();
  document.getElementById("dialogTitle").textContent = "Add hours";
  delBtn.classList.add("hidden");
  updatePreview();
}
async function openEdit(id) {
  const e = (await getAllEntries()).find(x=>x.id===id);
  if (!e) return;
  document.getElementById("entryId").value=e.id;
  document.getElementById("entryDate").value=e.date;
  setWorkPeriods(entryPeriods(e));
  document.getElementById("entryBreak").value=e.breakMinutes||0;
  document.getElementById("entryExtraNormal").value=e.extraNormalHours||0;
  document.getElementById("entryOT15").value=e.overtime15Hours||0;
  document.getElementById("entryOT20").value=e.overtime20Hours||0;
  document.getElementById("entryTravelAll15").checked=e.travelAll15===true;
  updateTravelModeUI();
  document.getElementById("entryNotes").value=e.notes||"";
  document.getElementById("dialogTitle").textContent="Edit hours";
  delBtn.classList.remove("hidden");
  await updatePreview();
  dlg.showModal();
}
async function updatePreview() {
  const periods = getWorkPeriodsFromForm();
  const breakMinutes = Number(document.getElementById("entryBreak").value||0);
  const extraNormalHours = Number(document.getElementById("entryExtraNormal").value||0);
  const overtime15Hours = Number(document.getElementById("entryOT15").value||0);
  const overtime20Hours = Number(document.getElementById("entryOT20").value||0);
  const travelAll15 = document.getElementById("entryTravelAll15").checked;
  const warning = document.getElementById("splitWarning");

  if (!periods.length || periods.some(p=>!p.start || !p.end)) {
    document.getElementById("previewHours").textContent="0h 00m";
    document.getElementById("previewPay").textContent="$0.00";
    document.getElementById("previewExtraNormal").textContent="0h 00m";
    document.getElementById("previewOT").textContent="0h 00m / 0h 00m";
    warning.classList.add("hidden");
    return;
  }

  const settings = await getSettings();
  const tempEntry = {
    start: periods[0]?.start || "",
    end: periods[periods.length-1]?.end || "",
    periods,
    breakMinutes,extraNormalHours,overtime15Hours,overtime20Hours,travelAll15
  };
  const b = entryPayBreakdown(tempEntry, settings);
  const requested = travelAll15 ? 0 : hoursFieldToMinutes(extraNormalHours)+hoursFieldToMinutes(overtime15Hours)+hoursFieldToMinutes(overtime20Hours);

  document.getElementById("previewHours").textContent=fmtMinutes(b.total);
  document.getElementById("previewPay").textContent=fmtMoney(b.gross);
  document.getElementById("previewExtraNormal").textContent=fmtMinutes(b.extraNormal);
  document.getElementById("previewOT").textContent=`${fmtMinutes(b.overtime15)} / ${fmtMinutes(b.overtime20)}`;

  if (requested > b.total) {
    warning.textContent="The split hours are greater than the total worked hours. Reduce the split before saving.";
    warning.classList.remove("hidden");
  } else {
    warning.classList.add("hidden");
  }
}

document.getElementById("prevMonth").onclick=async()=>{shownMonth=new Date(shownMonth.getFullYear(),shownMonth.getMonth()-1,1);selectedDate=localYmd(shownMonth);await renderCalendar();await renderSelectedDay();};
document.getElementById("nextMonth").onclick=async()=>{shownMonth=new Date(shownMonth.getFullYear(),shownMonth.getMonth()+1,1);selectedDate=localYmd(shownMonth);await renderCalendar();await renderSelectedDay();};
addHoursBtn.onclick=()=>{clearForm();dlg.showModal();};
document.getElementById("cancelDialogBtn").onclick=()=>dlg.close();
function updateTravelModeUI(){
  const checked = document.getElementById("entryTravelAll15").checked;
  document.getElementById("manualRateSplit").classList.toggle("disabled-split", checked);
  ["entryExtraNormal","entryOT15","entryOT20"].forEach(id=>{
    document.getElementById(id).disabled = checked;
  });
  if (checked) {
    document.getElementById("entryExtraNormal").value = 0;
    document.getElementById("entryOT15").value = 0;
    document.getElementById("entryOT20").value = 0;
  }
}

document.getElementById("entryTravelAll15").addEventListener("change",()=>{
  updateTravelModeUI();
  updatePreview();
});

document.getElementById("addWorkPeriodBtn").addEventListener("click",()=>{
  addWorkPeriod();
});

["entryBreak","entryExtraNormal","entryOT15","entryOT20"].forEach(id=>document.getElementById(id).addEventListener("input",updatePreview));
document.querySelectorAll("#workPeriods input").forEach(input=>input.addEventListener("input",updatePreview));

form.addEventListener("submit", async e => {
  e.preventDefault();
  const id = Number(document.getElementById("entryId").value)||null;
  const periods = getWorkPeriodsFromForm();
  if (!periods.length || periods.some(p=>!p.start || !p.end)) {
    alert("Enter a start and finish time for every work period.");
    return;
  }

  const value = {
    date: document.getElementById("entryDate").value,
    start: periods[0].start,
    end: periods[periods.length-1].end,
    periods,
    breakMinutes: Number(document.getElementById("entryBreak").value||0),
    extraNormalHours: Number(document.getElementById("entryExtraNormal").value||0),
    overtime15Hours: Number(document.getElementById("entryOT15").value||0),
    overtime20Hours: Number(document.getElementById("entryOT20").value||0),
    travelAll15: document.getElementById("entryTravelAll15").checked,
    notes: document.getElementById("entryNotes").value.trim()
  };

  const workedMins = entryMinutes(value);
  const splitMins = value.travelAll15 ? 0 : hoursFieldToMinutes(value.extraNormalHours)+hoursFieldToMinutes(value.overtime15Hours)+hoursFieldToMinutes(value.overtime20Hours);
  if (splitMins > workedMins) {
    alert("The extra/overtime hours cannot be greater than the total worked hours.");
    return;
  }

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
