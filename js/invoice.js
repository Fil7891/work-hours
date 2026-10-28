const invoiceMonth=document.getElementById("invoiceMonth");
const invoiceType=document.getElementById("invoiceType");
const invoiceNumber=document.getElementById("invoiceNumber");
const invoiceDate=document.getElementById("invoiceDate");

invoiceMonth.value=localStorage.getItem("selectedMonth") || monthKey();
invoiceDate.value=ymd();

function invoiceLocalYmd(d){
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function invoiceAddDays(d,days){
  const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  x.setDate(x.getDate()+days);
  return x;
}
function invoiceLastThursday(year,monthIndex){
  const d=new Date(year,monthIndex+1,0);
  const diff=(d.getDay()-4+7)%7;
  d.setDate(d.getDate()-diff);
  return d;
}
function invoiceCycleEnd(year,monthIndex){
  return invoiceAddDays(invoiceLastThursday(year,monthIndex),-5);
}
function invoiceCycleRange(year,monthIndex){
  const prevMonthDate=new Date(year,monthIndex-1,1);
  const prevEnd=invoiceCycleEnd(prevMonthDate.getFullYear(),prevMonthDate.getMonth());
  const start=invoiceAddDays(prevEnd,2);
  const end=invoiceCycleEnd(year,monthIndex);
  return {start,end};
}
function invoiceInRange(dateString,start,end){
  return dateString>=invoiceLocalYmd(start) && dateString<=invoiceLocalYmd(end);
}
function invoiceCalculate(entries,s){
  const totals={
    total:0,base:0,extraNormal:0,overtime15:0,overtime20:0,
    basePay:0,extraNormalPay:0,overtime15Pay:0,overtime20Pay:0,gross:0
  };
  for(const e of entries){
    const b=entryPayBreakdown(e,s);
    for(const k of Object.keys(totals)) totals[k]+=Number(b[k]||0);
  }
  return totals;
}
function fmtDate(d){
  return d.toLocaleDateString("en-AU",{day:"2-digit",month:"short",year:"numeric"});
}
function cleanText(v){ return String(v||"").trim(); }
function setText(id,value){ document.getElementById(id).textContent=value||""; }

async function getInvoiceProfile(){
  return (await getKV(STORE_SETTINGS,"invoiceProfile")) || {};
}
function defaultInvoiceNumber(){
  return `INV-${invoiceMonth.value || monthKey()}`;
}


function workLogPayLabel(entry,b,s){
  const parts=[];
  if(b.base>0) parts.push(`${fmtMinutes(b.base)} regular`);
  if(b.extraNormal>0) parts.push(`${fmtMinutes(b.extraNormal)} @ 1.0×`);
  if(b.overtime15>0) parts.push(`${fmtMinutes(b.overtime15)} @ ${s.overtime15Multiplier}×`);
  if(b.overtime20>0) parts.push(`${fmtMinutes(b.overtime20)} @ ${s.overtime20Multiplier}×`);
  if(entry.travelAll15===true && b.overtime15>0){
    return `${fmtMinutes(b.overtime15)} travel @ ${s.overtime15Multiplier}×`;
  }
  return parts.join(" · ") || "—";
}

function renderWorkLog(entries,s,cycle,pay){
  const sorted=[...entries].sort((a,b)=>a.date.localeCompare(b.date) || Number(a.id||0)-Number(b.id||0));
  setText("workLogCycle",`${fmtDate(cycle.start)} – ${fmtDate(cycle.end)}`);
  setText("workLogInvoiceNumber",invoiceNumber.value||"—");
  setText("workLogTotalHours",fmtMinutes(pay.total));
  setText("workLogSummaryHours",fmtMinutes(pay.total));
  setText("workLogSummaryGross",fmtMoney(pay.gross));

  const body=document.getElementById("workLogRows");
  if(!sorted.length){
    body.innerHTML='<tr><td colspan="6" class="empty">No work entries were found for this payment cycle.</td></tr>';
    return;
  }

  body.innerHTML=sorted.map(entry=>{
    const b=entryPayBreakdown(entry,s);
    const date=new Date(entry.date+"T12:00:00").toLocaleDateString("en-AU",{
      weekday:"short",day:"2-digit",month:"short",year:"numeric"
    });
    const periods=entryPeriodsText(entry)||"—";
    const breakText=`${Number(entry.breakMinutes||0)} min`;
    const breakdown=workLogPayLabel(entry,b,s);
    return `<tr>
      <td><strong>${date}</strong></td>
      <td>${periods}</td>
      <td>${breakText}</td>
      <td>${fmtMinutes(b.total)}</td>
      <td>${breakdown}</td>
      <td class="money">${fmtMoney(b.gross)}</td>
    </tr>`;
  }).join("");
}

async function renderInvoice(){
  const warning=document.getElementById("invoiceWarning");
  warning.classList.add("hidden");
  warning.textContent="";

  if(!invoiceMonth.value) return;
  if(!invoiceNumber.value) invoiceNumber.value=defaultInvoiceNumber();

  localStorage.setItem("selectedMonth",invoiceMonth.value);

  const [y,m]=invoiceMonth.value.split("-").map(Number);
  const cycle=invoiceCycleRange(y,m-1);
  const s=await getSettings();
  const profile=await getInvoiceProfile();
  const entries=(await getAllEntries()).filter(e=>invoiceInRange(e.date,cycle.start,cycle.end));
  const pay=invoiceCalculate(entries,s);
  const tax=atoMonthlyWithholding(pay.gross,s.claimsTaxFreeThreshold);
  const deductions=Number(s.otherDeductions||0);
  const net=Math.max(0,pay.gross-tax-deductions);
  const type=invoiceType.value;

  setText("documentTypeLabel",type==="ABN"?"ABN INVOICE":"TFN PAYMENT STATEMENT");
  setText("documentOwnerName",cleanText(profile.yourName)||"Your name");
  setText("documentOwnerContact",[profile.yourEmail,profile.yourPhone].filter(Boolean).join(" · "));
  setText("documentInvoiceNumber",invoiceNumber.value||"—");
  setText("documentInvoiceDate",invoiceDate.value?new Date(invoiceDate.value+"T12:00:00").toLocaleDateString("en-AU"):"—");

  setText("fromName",cleanText(profile.yourName)||"Your name");
  setText("fromBusiness",cleanText(profile.yourBusiness));
  setText("fromAbn",profile.yourAbn?`ABN ${profile.yourAbn}`:"");
  setText("fromAddress",cleanText(profile.yourAddress));
  setText("fromContact",[profile.yourEmail,profile.yourPhone].filter(Boolean).join(" · "));

  setText("clientName",cleanText(profile.clientName)||"Company name");
  setText("clientAbn",profile.clientAbn?`ABN ${profile.clientAbn}`:"");
  setText("clientAddress",cleanText(profile.clientAddress));
  setText("clientContact",[profile.clientEmail,profile.clientPhone].filter(Boolean).join(" · "));

  setText("invoiceCycle",`${fmtDate(cycle.start)} – ${fmtDate(cycle.end)}`);
  setText("invoiceTotalHours",fmtMinutes(pay.total));
  setText("invoiceHourlyRate",fmtMoney(s.hourlyRate));

  const items=[];
  if(pay.base>0) items.push(["Regular hours",pay.base,s.hourlyRate,pay.basePay]);
  if(pay.extraNormal>0) items.push(["Extra hours @ 1.0×",pay.extraNormal,s.hourlyRate,pay.extraNormalPay]);
  if(pay.overtime15>0) items.push([`Overtime @ ${s.overtime15Multiplier}×`,pay.overtime15,s.hourlyRate*s.overtime15Multiplier,pay.overtime15Pay]);
  if(pay.overtime20>0) items.push([`Overtime @ ${s.overtime20Multiplier}×`,pay.overtime20,s.hourlyRate*s.overtime20Multiplier,pay.overtime20Pay]);

  document.getElementById("invoiceLineItems").innerHTML=items.length
    ? items.map(([label,mins,rate,amount])=>`<tr><td>${label}</td><td>${fmtMinutes(mins)}</td><td>${fmtMoney(rate)}/hr</td><td class="money">${fmtMoney(amount)}</td></tr>`).join("")
    : `<tr><td colspan="4" class="empty">No work entries were found for this payment cycle.</td></tr>`;

  setText("invoiceGross",fmtMoney(pay.gross));
  setText("invoiceTax","-"+fmtMoney(tax));
  setText("invoiceDeductions","-"+fmtMoney(deductions));
  setText("invoiceNet",fmtMoney(net));
  setText("invoiceAbnTotal",fmtMoney(pay.gross));
  renderWorkLog(entries,s,cycle,pay);

  const taxRow=document.getElementById("invoiceTaxRow");
  const deductionsRow=document.getElementById("invoiceDeductionsRow");
  const netRow=document.getElementById("invoiceNetRow");
  const abnTotalRow=document.getElementById("invoiceAbnTotalRow");

  if(type==="ABN"){
    taxRow.classList.add("hidden");
    deductionsRow.classList.add("hidden");
    netRow.classList.add("hidden");
    abnTotalRow.classList.remove("hidden");
    setText("invoiceModeNote","ABN mode shows gross earnings only. PAYG withholding is not deducted by this document.");
  }else{
    taxRow.classList.remove("hidden");
    deductionsRow.classList.toggle("hidden",deductions===0);
    netRow.classList.remove("hidden");
    abnTotalRow.classList.add("hidden");
    setText("invoiceModeNote","TFN mode shows estimated PAYG withholding using the same ATO monthly withholding calculation used by the Salary page. Your TFN number is intentionally not printed on this document.");
  }
  setText("invoiceUserNote",cleanText(profile.invoiceNote));

  if(!profile.yourName || !profile.clientName){
    warning.textContent="Add your details and the paying company details in Settings before printing.";
    warning.classList.remove("hidden");
  }
}

invoiceMonth.addEventListener("change",()=>{
  invoiceNumber.value=defaultInvoiceNumber();
  renderInvoice();
});
invoiceType.addEventListener("change",renderInvoice);
invoiceNumber.addEventListener("input",renderInvoice);
invoiceDate.addEventListener("change",renderInvoice);
document.getElementById("printInvoiceBtn").addEventListener("click",()=>window.print());

renderInvoice();
