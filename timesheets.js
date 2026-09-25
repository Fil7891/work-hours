const monthFilter=document.getElementById("monthFilter"), entriesList=document.getElementById("entriesList"), monthHours=document.getElementById("monthHours");
const dlg=document.getElementById("entryDialog"), form=document.getElementById("entryForm"), delBtn=document.getElementById("deleteEntryBtn");
monthFilter.value=localStorage.getItem("selectedMonth") || monthKey();

async function render(){
  const entries=(await getAllEntries()).filter(e=>e.date.startsWith(monthFilter.value)).sort((a,b)=>b.date.localeCompare(a.date)||b.start.localeCompare(a.start));
  const total=entries.reduce((a,e)=>a+entryMinutes(e),0);monthHours.textContent=fmtMinutes(total);
  entriesList.innerHTML=entries.length?entries.map(e=>`<div class="entry-item" data-id="${e.id}"><div class="entry-main"><strong>${new Date(e.date+"T12:00").toLocaleDateString("en-AU",{weekday:"short",day:"numeric",month:"short"})}</strong><span>${e.start} – ${e.end} · Break ${e.breakMinutes||0}m${e.notes?` · ${e.notes}`:""}</span></div><div class="entry-hours">${fmtMinutes(entryMinutes(e))}</div></div>`).join(""):`<div class="empty">No entries for this month.</div>`;
  document.querySelectorAll(".entry-item").forEach(el=>el.onclick=()=>openEdit(Number(el.dataset.id)));
}
function clearForm(){form.reset();document.getElementById("entryId").value="";document.getElementById("entryDate").value=ymd();document.getElementById("entryBreak").value=30;document.getElementById("entryExtraNormal").value=0;document.getElementById("entryOT15").value=0;document.getElementById("entryOT20").value=0;document.getElementById("dialogTitle").textContent="Add entry";delBtn.classList.add("hidden");}
async function openEdit(id){const e=(await getAllEntries()).find(x=>x.id===id);if(!e)return;document.getElementById("entryId").value=e.id;document.getElementById("entryDate").value=e.date;document.getElementById("entryStart").value=e.start;document.getElementById("entryEnd").value=e.end;document.getElementById("entryBreak").value=e.breakMinutes||0;document.getElementById("entryExtraNormal").value=e.extraNormalHours||0;document.getElementById("entryOT15").value=e.overtime15Hours||0;document.getElementById("entryOT20").value=e.overtime20Hours||0;document.getElementById("entryNotes").value=e.notes||"";document.getElementById("dialogTitle").textContent="Edit entry";delBtn.classList.remove("hidden");dlg.showModal();}
document.getElementById("addEntryBtn").onclick=()=>{clearForm();dlg.showModal();};
document.getElementById("cancelDialogBtn").onclick=()=>dlg.close();
form.addEventListener("submit",async e=>{e.preventDefault();const id=Number(document.getElementById("entryId").value)||null;const v={date:document.getElementById("entryDate").value,start:document.getElementById("entryStart").value,end:document.getElementById("entryEnd").value,breakMinutes:Number(document.getElementById("entryBreak").value||0),extraNormalHours:Number(document.getElementById("entryExtraNormal").value||0),overtime15Hours:Number(document.getElementById("entryOT15").value||0),overtime20Hours:Number(document.getElementById("entryOT20").value||0),notes:document.getElementById("entryNotes").value.trim()};if(id){v.id=id;await updateEntry(v);}else await addEntry(v);dlg.close();render();});
delBtn.onclick=async()=>{const id=Number(document.getElementById("entryId").value);if(id&&confirm("Delete this entry?")){await deleteEntry(id);dlg.close();render();}};
monthFilter.onchange=()=>{
  localStorage.setItem("selectedMonth", monthFilter.value);
  render();
};
document.getElementById("exportCsvBtn").onclick=async()=>{const es=(await getAllEntries()).filter(e=>e.date.startsWith(monthFilter.value));let csv="Date,Start,Finish,Break minutes,Worked hours,Extra normal hours,OT 1.5 hours,OT 2.0 hours,Notes\n";for(const e of es){csv+=`${e.date},${e.start},${e.end},${e.breakMinutes||0},${(entryMinutes(e)/60).toFixed(2)},${Number(e.extraNormalHours||0).toFixed(2)},${Number(e.overtime15Hours||0).toFixed(2)},${Number(e.overtime20Hours||0).toFixed(2)},"${(e.notes||"").replaceAll('"','""')}"\n`;}const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`timesheet-${monthFilter.value}.csv`;a.click();URL.revokeObjectURL(a.href);};
render();
