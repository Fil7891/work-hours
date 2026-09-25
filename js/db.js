const DB_NAME = "WorkHoursDB";
const DB_VERSION = 1;
const STORE_ENTRIES = "entries";
const STORE_SETTINGS = "settings";
const STORE_STATE = "state";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_ENTRIES)) {
        const store = db.createObjectStore(STORE_ENTRIES, { keyPath: "id", autoIncrement: true });
        store.createIndex("date", "date");
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) db.createObjectStore(STORE_SETTINGS, { keyPath: "key" });
      if (!db.objectStoreNames.contains(STORE_STATE)) db.createObjectStore(STORE_STATE, { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function tx(storeName, mode="readonly"){ const db=await openDB(); return db.transaction(storeName, mode).objectStore(storeName); }
async function getAllEntries(){ const s=await tx(STORE_ENTRIES); return new Promise((res,rej)=>{const r=s.getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}); }
async function addEntry(v){ const s=await tx(STORE_ENTRIES,"readwrite"); return new Promise((res,rej)=>{const r=s.add(v);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}); }
async function updateEntry(v){ const s=await tx(STORE_ENTRIES,"readwrite"); return new Promise((res,rej)=>{const r=s.put(v);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}); }
async function deleteEntry(id){ const s=await tx(STORE_ENTRIES,"readwrite"); return new Promise((res,rej)=>{const r=s.delete(Number(id));r.onsuccess=()=>res();r.onerror=()=>rej(r.error)}); }
async function getKV(store,key){ const s=await tx(store); return new Promise((res,rej)=>{const r=s.get(key);r.onsuccess=()=>res(r.result?.value);r.onerror=()=>rej(r.error)}); }
async function setKV(store,key,value){ const s=await tx(store,"readwrite"); return new Promise((res,rej)=>{const r=s.put({key,value});r.onsuccess=()=>res();r.onerror=()=>rej(r.error)}); }
async function getSettings(){
  const oldOt = Number(await getKV(STORE_SETTINGS,"overtimeMultiplier") ?? 1.5);
  return {
    hourlyRate: Number(await getKV(STORE_SETTINGS,"hourlyRate") ?? 38),
    regularHoursPerDay: Number(await getKV(STORE_SETTINGS,"regularHoursPerDay") ?? 8),
    overtime15Multiplier: Number(await getKV(STORE_SETTINGS,"overtime15Multiplier") ?? oldOt),
    overtime20Multiplier: Number(await getKV(STORE_SETTINGS,"overtime20Multiplier") ?? 2.0),
    claimsTaxFreeThreshold: (await getKV(STORE_SETTINGS,"claimsTaxFreeThreshold")) ?? true,
    superRate: Number(await getKV(STORE_SETTINGS,"superRate") ?? 12),
    includeOvertimeInSuper: (await getKV(STORE_SETTINGS,"includeOvertimeInSuper")) ?? false,
    otherDeductions: Number(await getKV(STORE_SETTINGS,"otherDeductions") ?? 0)
  };
}
function minutesBetween(start,end){
  const [sh,sm]=start.split(":").map(Number), [eh,em]=end.split(":").map(Number);
  let mins=(eh*60+em)-(sh*60+sm);
  if(mins<0) mins+=24*60;
  return mins;
}
function entryMinutes(e){ return Math.max(0, minutesBetween(e.start,e.end)-Number(e.breakMinutes||0)); }

function hoursFieldToMinutes(v){
  return Math.max(0, Math.round((Number(v)||0)*60));
}

function entryPayBreakdown(e, settings){
  const total = entryMinutes(e);
  const extraNormal = Math.min(total, hoursFieldToMinutes(e.extraNormalHours));
  const remainingAfterExtra = Math.max(0, total-extraNormal);
  const overtime15 = Math.min(remainingAfterExtra, hoursFieldToMinutes(e.overtime15Hours));
  const remainingAfter15 = Math.max(0, remainingAfterExtra-overtime15);
  const overtime20 = Math.min(remainingAfter15, hoursFieldToMinutes(e.overtime20Hours));
  const base = Math.max(0, total-extraNormal-overtime15-overtime20);

  const basePay = base/60*settings.hourlyRate;
  const extraNormalPay = extraNormal/60*settings.hourlyRate;
  const overtime15Pay = overtime15/60*settings.hourlyRate*settings.overtime15Multiplier;
  const overtime20Pay = overtime20/60*settings.hourlyRate*settings.overtime20Multiplier;

  return {
    total, base, extraNormal, overtime15, overtime20,
    basePay, extraNormalPay, overtime15Pay, overtime20Pay,
    gross: basePay+extraNormalPay+overtime15Pay+overtime20Pay
  };
}
function fmtMinutes(mins){ mins=Math.max(0,Math.round(mins)); return `${Math.floor(mins/60)}h ${String(mins%60).padStart(2,"0")}m`; }
function fmtMoney(v){ return new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(v||0); }
function ymd(d=new Date()){ return d.toISOString().slice(0,10); }
function monthKey(d=new Date()){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
