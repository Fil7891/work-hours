async function load(){
  const s=await getSettings();
  document.getElementById("hourlyRate").value=s.hourlyRate;
  document.getElementById("regularHoursPerDay").value=s.regularHoursPerDay;
  document.getElementById("overtimeMultiplier").value=s.overtimeMultiplier;
  document.getElementById("claimsTaxFreeThreshold").value=String(s.claimsTaxFreeThreshold);
  document.getElementById("superRate").value=s.superRate;
  document.getElementById("includeOvertimeInSuper").value=String(s.includeOvertimeInSuper);
  document.getElementById("otherDeductions").value=s.otherDeductions;
}
document.getElementById("settingsForm").addEventListener("submit",async e=>{
  e.preventDefault();
  await setKV(STORE_SETTINGS,"hourlyRate",Number(document.getElementById("hourlyRate").value));
  await setKV(STORE_SETTINGS,"regularHoursPerDay",Number(document.getElementById("regularHoursPerDay").value));
  await setKV(STORE_SETTINGS,"overtimeMultiplier",Number(document.getElementById("overtimeMultiplier").value));
  await setKV(STORE_SETTINGS,"claimsTaxFreeThreshold",document.getElementById("claimsTaxFreeThreshold").value==="true");
  await setKV(STORE_SETTINGS,"superRate",Number(document.getElementById("superRate").value));
  await setKV(STORE_SETTINGS,"includeOvertimeInSuper",document.getElementById("includeOvertimeInSuper").value==="true");
  await setKV(STORE_SETTINGS,"otherDeductions",Number(document.getElementById("otherDeductions").value));
  const msg=document.getElementById("saveMessage");
  msg.textContent="Settings saved.";
  setTimeout(()=>msg.textContent="",2500);
});
document.getElementById("backupBtn").onclick=async()=>{
  const data={version:2,exportedAt:new Date().toISOString(),entries:await getAllEntries(),settings:await getSettings()};
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
  a.download=`work-hours-backup-${ymd()}.json`;
  a.click(); URL.revokeObjectURL(a.href);
};
document.getElementById("restoreInput").onchange=async e=>{
  const f=e.target.files[0]; if(!f)return;
  try{
    const data=JSON.parse(await f.text());
    if(!Array.isArray(data.entries)||!data.settings)throw new Error();
    if(!confirm("Import this backup? Existing entries will stay, and imported entries will be added."))return;
    for(const ent of data.entries){const c={...ent};delete c.id;await addEntry(c);}
    const s=data.settings;
    for(const k of ["hourlyRate","regularHoursPerDay","overtimeMultiplier","superRate","otherDeductions"]){
      if(k in s) await setKV(STORE_SETTINGS,k,Number(s[k]));
    }
    if("claimsTaxFreeThreshold" in s) await setKV(STORE_SETTINGS,"claimsTaxFreeThreshold",Boolean(s.claimsTaxFreeThreshold));
    if("includeOvertimeInSuper" in s) await setKV(STORE_SETTINGS,"includeOvertimeInSuper",Boolean(s.includeOvertimeInSuper));
    alert("Backup imported."); load();
  }catch{alert("Invalid backup file.");}
};
load();
