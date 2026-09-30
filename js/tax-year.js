const yearSelect=document.getElementById("taxYearSelect");
const expenseDialog=document.getElementById("expenseDialog");

function currentFinancialYear(){
  const now=new Date();
  const start=now.getMonth()>=6 ? now.getFullYear() : now.getFullYear()-1;
  return `${start}-${String((start+1)%100).padStart(2,"0")}`;
}

function taxYearDates(key){
  const startYear=Number(key.slice(0,4));
  return {start:`${startYear}-07-01`, end:`${startYear+1}-06-30`};
}

function calculateResidentIncomeTax(taxableIncome, taxYear){
  const x=Math.max(0,Number(taxableIncome)||0);
  const firstRate = taxYear==="2026-27" ? 0.15 : 0.16;
  if(x<=18200) return 0;
  if(x<=45000) return (x-18200)*firstRate;
  const firstBand=(45000-18200)*firstRate;
  if(x<=135000) return firstBand+(x-45000)*0.30;
  const secondBand=(135000-45000)*0.30;
  if(x<=190000) return firstBand+secondBand+(x-135000)*0.37;
  const thirdBand=(190000-135000)*0.37;
  return firstBand+secondBand+thirdBand+(x-190000)*0.45;
}

function lowIncomeTaxOffset(taxableIncome){
  const x=Math.max(0,Number(taxableIncome)||0);
  if(x<=37500) return 700;
  if(x<=45000) return Math.max(0,700-(x-37500)*0.05);
  if(x<=66667) return Math.max(0,325-(x-45000)*0.015);
  return 0;
}

function workGross(entries,settings){
  return entries.reduce((sum,e)=>sum+entryPayBreakdown(e,settings).gross,0);
}

function estimatedPayg(entries,settings){
  const months={};
  for(const e of entries){
    const key=e.date.slice(0,7);
    months[key]=(months[key]||0)+entryPayBreakdown(e,settings).gross;
  }
  return Object.values(months).reduce((sum,gross)=>sum+atoMonthlyWithholding(gross,settings.claimsTaxFreeThreshold),0);
}

async function getTaxSetting(year,name,defaultValue){
  const value=await getKV(STORE_SETTINGS,`tax:${year}:${name}`);
  return value===undefined ? defaultValue : value;
}
async function saveTaxSetting(year,name,value){
  return setKV(STORE_SETTINGS,`tax:${year}:${name}`,value);
}

async function render(){
  const year=yearSelect.value;
  const {start,end}=taxYearDates(year);
  const settings=await getSettings();
  const entries=(await getAllEntries()).filter(e=>e.date>=start && e.date<=end);
  const expenses=(await getAllTaxExpenses()).filter(e=>e.taxYear===year).sort((a,b)=>(b.date||"").localeCompare(a.date||""));

  const gross=workGross(entries,settings);
  const paygEstimate=estimatedPayg(entries,settings);
  const otherIncome=Number(await getTaxSetting(year,"otherIncome",0))||0;
  const actualPaygRaw=await getTaxSetting(year,"actualPayg","");
  const includeMedicare=(await getTaxSetting(year,"includeMedicare",true))!==false;

  document.getElementById("otherIncome").value=otherIncome || 0;
  document.getElementById("actualPayg").value=actualPaygRaw;
  document.getElementById("includeMedicare").checked=includeMedicare;

  const deductions=expenses.reduce((sum,e)=>sum+Number(e.amount||0),0);
  const totalIncome=gross+otherIncome;
  const taxable=Math.max(0,totalIncome-deductions);
  const taxBefore=calculateResidentIncomeTax(taxable,year);
  const offset=Math.min(taxBefore,lowIncomeTaxOffset(taxable));
  const incomeTax=Math.max(0,taxBefore-offset);
  const medicare=includeMedicare ? taxable*0.02 : 0;
  const liability=incomeTax+medicare;
  const actualPayg = actualPaygRaw==="" ? null : Number(actualPaygRaw||0);
  const paygUsed=actualPayg===null ? paygEstimate : actualPayg;
  const outcome=paygUsed-liability;

  document.getElementById("workIncome").textContent=fmtMoney(gross);
  document.getElementById("totalIncome").textContent=fmtMoney(totalIncome);
  document.getElementById("estimatedPaygText").textContent=`App PAYG estimate: ${fmtMoney(paygEstimate)}. Enter the actual amount from your income statement when available.`;
  document.getElementById("paygUsed").textContent=fmtMoney(paygUsed);
  document.getElementById("totalDeductions").textContent=fmtMoney(deductions);

  document.getElementById("resultIncome").textContent=fmtMoney(totalIncome);
  document.getElementById("resultDeductions").textContent="-"+fmtMoney(deductions);
  document.getElementById("taxableIncome").textContent=fmtMoney(taxable);
  document.getElementById("incomeTaxBeforeOffsets").textContent=fmtMoney(taxBefore);
  document.getElementById("lito").textContent="-"+fmtMoney(offset);
  document.getElementById("medicareLevy").textContent=fmtMoney(medicare);
  document.getElementById("taxLiability").textContent=fmtMoney(liability);
  document.getElementById("resultPayg").textContent="-"+fmtMoney(paygUsed);
  document.getElementById("taxOutcomeLabel").textContent=outcome>=0?"Estimated refund":"Estimated amount payable";
  document.getElementById("taxOutcome").textContent=fmtMoney(Math.abs(outcome));
  document.getElementById("taxOutcomeRow").classList.toggle("amount-payable",outcome<0);

  renderExpenses(expenses);
}

function renderExpenses(expenses){
  const list=document.getElementById("expenseList");
  if(!expenses.length){
    list.innerHTML='<div class="empty">No expenses added for this tax year.</div>';
    return;
  }
  list.innerHTML=expenses.map(e=>`<button class="expense-item" data-id="${e.id}">
    <div><strong>${escapeTaxHtml(e.category||"Other")}</strong><span>${escapeTaxHtml(e.date||"")}${e.description?` · ${escapeTaxHtml(e.description)}`:""}</span></div>
    <strong>${fmtMoney(e.amount)}</strong>
  </button>`).join("");
  list.querySelectorAll(".expense-item").forEach(btn=>btn.onclick=()=>openExpense(Number(btn.dataset.id)));
}

function escapeTaxHtml(v){
  return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function defaultExpenseDate(year){
  const {start,end}=taxYearDates(year);
  const today=ymd();
  if(today>=start && today<=end) return today;
  return end;
}

async function openExpense(id=null){
  document.getElementById("expenseId").value=id||"";
  document.getElementById("deleteExpenseBtn").classList.toggle("hidden",!id);
  if(id){
    const expense=(await getAllTaxExpenses()).find(x=>x.id===id);
    if(!expense) return;
    document.getElementById("expenseDialogTitle").textContent="Edit expense";
    document.getElementById("expenseDate").value=expense.date||"";
    document.getElementById("expenseCategory").value=expense.category||"Other";
    document.getElementById("expenseDescription").value=expense.description||"";
    document.getElementById("expenseAmount").value=expense.amount||0;
  }else{
    document.getElementById("expenseDialogTitle").textContent="Add expense";
    document.getElementById("expenseDate").value=defaultExpenseDate(yearSelect.value);
    document.getElementById("expenseCategory").value="Tools & equipment";
    document.getElementById("expenseDescription").value="";
    document.getElementById("expenseAmount").value="";
  }
  expenseDialog.showModal();
}

document.getElementById("addExpenseBtn").onclick=()=>openExpense();
document.getElementById("cancelExpenseBtn").onclick=()=>expenseDialog.close();
document.getElementById("deleteExpenseBtn").onclick=async()=>{
  const id=Number(document.getElementById("expenseId").value);
  if(id && confirm("Delete this expense?")){await deleteTaxExpense(id);expenseDialog.close();render();}
};

document.getElementById("expenseForm").onsubmit=async e=>{
  e.preventDefault();
  const id=Number(document.getElementById("expenseId").value||0);
  const value={
    taxYear:yearSelect.value,
    date:document.getElementById("expenseDate").value,
    category:document.getElementById("expenseCategory").value,
    description:document.getElementById("expenseDescription").value.trim(),
    amount:Number(document.getElementById("expenseAmount").value||0)
  };
  if(id){value.id=id;await updateTaxExpense(value);}else{await addTaxExpense(value);}
  expenseDialog.close();
  render();
};

yearSelect.onchange=async()=>{
  localStorage.setItem("selectedTaxYear",yearSelect.value);
  render();
};
document.getElementById("otherIncome").onchange=async e=>{await saveTaxSetting(yearSelect.value,"otherIncome",Number(e.target.value||0));render();};
document.getElementById("actualPayg").onchange=async e=>{await saveTaxSetting(yearSelect.value,"actualPayg",e.target.value);render();};
document.getElementById("includeMedicare").onchange=async e=>{await saveTaxSetting(yearSelect.value,"includeMedicare",e.target.checked);render();};

const available=[...yearSelect.options].map(o=>o.value);
const remembered=localStorage.getItem("selectedTaxYear");
const current=currentFinancialYear();
yearSelect.value=available.includes(remembered)?remembered:(available.includes(current)?current:"2025-26");
render();
