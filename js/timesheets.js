const monthFilter=document.getElementById("monthFilter"), entriesList=document.getElementById("entriesList"), monthHours=document.getElementById("monthHours");
const dlg=document.getElementById("entryDialog"), form=document.getElementById("entryForm"), delBtn=document.getElementById("deleteEntryBtn");
monthFilter.value=localStorage.getItem("selectedMonth") || monthKey();

function getWorkPeriodsFromForm(){
  return [...document.querySelectorAll("#workPeriods .work-period-row")]
    .map(row=>({
      start:row.querySelector(".period-start").value,
      end:row.querySelector(".period-end").value
    }))
    .filter(p=>p.start || p.end);
}
function createWorkPeriodRow(start="",end="",removable=true){
  const row=document.createElement("div");
  row.className="work-period-row";
  row.innerHTML=`<label>Start<input type="time" class="period-start" value="${start}" required></label><label>Finish<input type="time" class="period-end" value="${end}" required></label>${removable?'<button type="button" class="remove-period-btn ghost">Remove</button>':""}`;
  const remove=row.querySelector(".remove-period-btn");
  if(remove) remove.onclick=()=>row.remove();
  return row;
}
function setWorkPeriods(periods){
  const container=document.getElementById("workPeriods");
  container.innerHTML="";
  const list=(Array.isArray(periods)&&periods.length)?periods:[{start:"",end:""}];
  list.forEach((p,i)=>container.appendChild(createWorkPeriodRow(p.start||"",p.end||"",i>0)));
}
document.getElementById("addWorkPeriodBtn").onclick=()=>{
  document.getElementById("workPeriods").appendChild(createWorkPeriodRow("","",true));
};


async function render(){
  const entries=(await getAllEntries()).filter(e=>e.date.startsWith(monthFilter.value)).sort((a,b)=>b.date.localeCompare(a.date)||b.start.localeCompare(a.start));
  const total=entries.reduce((a,e)=>a+entryMinutes(e),0);monthHours.textContent=fmtMinutes(total);
  entriesList.innerHTML=entries.length?entries.map(e=>`<div class="entry-item" data-id="${e.id}"><div class="entry-main"><strong>${new Date(e.date+"T12:00").toLocaleDateString("en-AU",{weekday:"short",day:"numeric",month:"short"})}</strong><span>${entryPeriodsText(e)} · Break ${e.breakMinutes||0}m${e.notes?` · ${e.notes}`:""}</span></div><div class="entry-hours">${fmtMinutes(entryMinutes(e))}</div></div>`).join(""):`<div class="empty">No entries for this month.</div>`;
  document.querySelectorAll(".entry-item").forEach(el=>el.onclick=()=>openEdit(Number(el.dataset.id)));
}
function clearForm(){form.reset();setWorkPeriods([{start:"",end:""}]);document.getElementById("entryId").value="";document.getElementById("entryDate").value=ymd();document.getElementById("entryBreak").value=30;document.getElementById("entryExtraNormal").value=0;document.getElementById("entryOT15").value=0;document.getElementById("entryOT20").value=0;document.getElementById("entryTravelAll15").checked=false;document.getElementById("dialogTitle").textContent="Add entry";delBtn.classList.add("hidden");}
async function openEdit(id){const e=(await getAllEntries()).find(x=>x.id===id);if(!e)return;document.getElementById("entryId").value=e.id;document.getElementById("entryDate").value=e.date;setWorkPeriods(entryPeriods(e));document.getElementById("entryBreak").value=e.breakMinutes||0;document.getElementById("entryExtraNormal").value=e.extraNormalHours||0;document.getElementById("entryOT15").value=e.overtime15Hours||0;document.getElementById("entryOT20").value=e.overtime20Hours||0;document.getElementById("entryTravelAll15").checked=e.travelAll15===true;document.getElementById("entryNotes").value=e.notes||"";document.getElementById("dialogTitle").textContent="Edit entry";delBtn.classList.remove("hidden");dlg.showModal();}
document.getElementById("addEntryBtn").onclick=()=>{clearForm();dlg.showModal();};
document.getElementById("cancelDialogBtn").onclick=()=>dlg.close();
form.addEventListener("submit",async e=>{
  e.preventDefault();
  const id=Number(document.getElementById("entryId").value)||null;
  const periods=getWorkPeriodsFromForm();
  if(!periods.length||periods.some(p=>!p.start||!p.end)){
    alert("Enter a start and finish time for every work period.");
    return;
  }
  const v={
    date:document.getElementById("entryDate").value,
    start:periods[0].start,
    end:periods[periods.length-1].end,
    periods,
    breakMinutes:Number(document.getElementById("entryBreak").value||0),
    extraNormalHours:Number(document.getElementById("entryExtraNormal").value||0),
    overtime15Hours:Number(document.getElementById("entryOT15").value||0),
    overtime20Hours:Number(document.getElementById("entryOT20").value||0),
    travelAll15:document.getElementById("entryTravelAll15").checked,
    notes:document.getElementById("entryNotes").value.trim()
  };
  if(id){v.id=id;await updateEntry(v);}else await addEntry(v);
  dlg.close();
  render();
});
delBtn.onclick=async()=>{const id=Number(document.getElementById("entryId").value);if(id&&confirm("Delete this entry?")){await deleteEntry(id);dlg.close();render();}};
monthFilter.onchange=()=>{
  localStorage.setItem("selectedMonth", monthFilter.value);
  render();
};

function parseCsv(text){
  const rows=[];
  let row=[], field="", inQuotes=false;

  for(let i=0;i<text.length;i++){
    const ch=text[i];

    if(inQuotes){
      if(ch === '"'){
        if(text[i+1] === '"'){
          field+='"';
          i++;
        }else{
          inQuotes=false;
        }
      }else{
        field+=ch;
      }
    }else{
      if(ch === '"'){
        inQuotes=true;
      }else if(ch === ","){
        row.push(field);
        field="";
      }else if(ch === "\n"){
        row.push(field);
        rows.push(row);
        row=[];
        field="";
      }else if(ch !== "\r"){
        field+=ch;
      }
    }
  }

  if(field.length || row.length){
    row.push(field);
    rows.push(row);
  }

  return rows.filter(r=>r.some(v=>String(v).trim()!==""));
}

function normalizeCsvHeader(value){
  return String(value||"").trim().toLowerCase().replace(/\s+/g," ");
}

function csvValue(row, headerMap, names){
  for(const name of names){
    const idx=headerMap.get(normalizeCsvHeader(name));
    if(idx !== undefined) return String(row[idx] ?? "").trim();
  }
  return "";
}

function parseYesNo(value){
  const v=String(value||"").trim().toLowerCase();
  return ["yes","y","true","1","on"].includes(v);
}

function normalizeCsvDate(value){
  const v=String(value||"").trim();
  if(!v) return "";

  // ISO: YYYY-MM-DD
  let m=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if(m){
    const y=Number(m[1]), mo=Number(m[2]), d=Number(m[3]);
    if(mo>=1&&mo<=12&&d>=1&&d<=31){
      return `${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    }
  }

  // Australian/common spreadsheet format: D/M/YYYY or DD/MM/YYYY
  m=v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if(m){
    const d=Number(m[1]), mo=Number(m[2]), y=Number(m[3]);
    if(mo>=1&&mo<=12&&d>=1&&d<=31){
      return `${y}-${String(mo).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    }
  }

  return "";
}

function normalizeCsvTime(value){
  let v=String(value||"").trim();
  if(!v) return "";

  // Strip seconds if spreadsheet writes HH:MM:SS
  let m=v.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if(!m) return "";

  let h=Number(m[1]);
  const min=Number(m[2]);
  const ampm=(m[4]||"").toUpperCase();

  if(min<0 || min>59) return "";

  if(ampm){
    if(h<1 || h>12) return "";
    if(ampm==="AM" && h===12) h=0;
    if(ampm==="PM" && h!==12) h+=12;
  }else{
    if(h<0 || h>23) return "";
  }

  return `${String(h).padStart(2,"0")}:${String(min).padStart(2,"0")}`;
}

async function importCsvText(text){
  const rows=parseCsv(text);
  if(rows.length < 2) throw new Error("The CSV file has no data rows.");

  const headers=rows[0].map(normalizeCsvHeader);
  const headerMap=new Map(headers.map((h,i)=>[h,i]));

  for(const required of ["date","start","finish","break minutes"]){
    if(!headerMap.has(required)){
      throw new Error(`Missing required column: ${required}`);
    }
  }

  let imported=0;
  let skipped=0;
  const errors=[];

  for(let i=1;i<rows.length;i++){
    const row=rows[i];
    const line=i+1;

    const rawDate=csvValue(row,headerMap,["Date"]);
    const rawStart=csvValue(row,headerMap,["Start"]);
    const rawFinish=csvValue(row,headerMap,["Finish"]);

    const date=normalizeCsvDate(rawDate);
    const start=normalizeCsvTime(rawStart);
    const finish=normalizeCsvTime(rawFinish);
    const breakMinutes=Number(csvValue(row,headerMap,["Break minutes"]) || 0);

    if(!date || !start || !finish || !Number.isFinite(breakMinutes) || breakMinutes < 0){
      skipped++;
      errors.push(`Line ${line}: invalid date/time/break (${rawDate}, ${rawStart}, ${rawFinish}).`);
      continue;
    }

    const extraNormalHours=Number(csvValue(row,headerMap,["Extra normal hours"]) || 0);
    const overtime15Hours=Number(csvValue(row,headerMap,["OT 1.5 hours"]) || 0);
    const overtime20Hours=Number(csvValue(row,headerMap,["OT 2.0 hours"]) || 0);
    const travelAll15=parseYesNo(csvValue(row,headerMap,["Travel day all 1.5"]));
    const notes=csvValue(row,headerMap,["Notes"]);

    if([extraNormalHours,overtime15Hours,overtime20Hours].some(v=>!Number.isFinite(v) || v<0)){
      skipped++;
      errors.push(`Line ${line}: invalid pay-rate hours.`);
      continue;
    }

    const entry={
      date,
      start,
      end:finish,
      periods:[{start,end:finish}],
      breakMinutes,
      extraNormalHours,
      overtime15Hours,
      overtime20Hours,
      travelAll15,
      notes
    };

    const worked=entryMinutes(entry);
    const split=travelAll15 ? 0 :
      hoursFieldToMinutes(extraNormalHours)+
      hoursFieldToMinutes(overtime15Hours)+
      hoursFieldToMinutes(overtime20Hours);

    if(split > worked){
      skipped++;
      errors.push(`Line ${line}: extra/overtime hours exceed worked hours.`);
      continue;
    }

    await addEntry(entry);
    imported++;
  }

  return {imported,skipped,errors};
}

const importCsvBtn=document.getElementById("importCsvBtn");
const importCsvFile=document.getElementById("importCsvFile");

if(importCsvBtn && importCsvFile){
  importCsvBtn.addEventListener("click",()=>{
    importCsvFile.value="";
    importCsvFile.click();
  });

  importCsvFile.addEventListener("change",async()=>{
    const file=importCsvFile.files?.[0];
    if(!file) return;

    try{
      const text=await file.text();
      const result=await importCsvText(text);

      let msg=`Imported ${result.imported} entr${result.imported===1?"y":"ies"}.`;
      if(result.skipped){
        msg+=`\nSkipped ${result.skipped} row${result.skipped===1?"":"s"}.`;
      }
      if(result.errors.length){
        msg+=`\n\n${result.errors.slice(0,8).join("\n")}`;
        if(result.errors.length>8){
          msg+=`\n...and ${result.errors.length-8} more.`;
        }
      }

      alert(msg);
      render();
    }catch(err){
      alert(`Could not import CSV.\n${err.message || err}`);
    }
  });
}


document.getElementById("exportCsvBtn").onclick=async()=>{const es=(await getAllEntries()).filter(e=>e.date.startsWith(monthFilter.value));let csv="Date,Start,Finish,Break minutes,Worked hours,Travel day all 1.5,Extra normal hours,OT 1.5 hours,OT 2.0 hours,Notes\n";for(const e of es){csv+=`${e.date},${e.start},${e.end},${e.breakMinutes||0},${(entryMinutes(e)/60).toFixed(2)},${e.travelAll15===true?"Yes":"No"},${Number(e.extraNormalHours||0).toFixed(2)},${Number(e.overtime15Hours||0).toFixed(2)},${Number(e.overtime20Hours||0).toFixed(2)},"${(e.notes||"").replaceAll('"','""')}"\n`;}const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`timesheet-${monthFilter.value}.csv`;a.click();URL.revokeObjectURL(a.href);};
render();
