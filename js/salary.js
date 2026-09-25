const salaryMonth=document.getElementById("salaryMonth");
salaryMonth.value=monthKey();

function localYmd(d){
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function addDays(d, days){
  const x=new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate()+days);
  return x;
}

function lastThursdayOfMonth(year, monthIndex){
  const d=new Date(year, monthIndex+1, 0); // last day of month
  const day=d.getDay(); // Sun=0 ... Thu=4
  const diff=(day-4+7)%7;
  d.setDate(d.getDate()-diff);
  return d;
}

function payCycleEnd(year, monthIndex){
  // Saturday before the week containing the month's last Thursday.
  return addDays(lastThursdayOfMonth(year, monthIndex), -5);
}

function payCycleRange(year, monthIndex){
  const prevMonthDate=new Date(year, monthIndex-1, 1);
  const prevEnd=payCycleEnd(prevMonthDate.getFullYear(), prevMonthDate.getMonth());
  const start=addDays(prevEnd, 2); // following Monday
  const end=payCycleEnd(year, monthIndex);
  const nextStart=addDays(end, 2);
  const weeks=Math.round((nextStart-start)/(7*24*60*60*1000));
  return {start,end,nextStart,weeks};
}

function inRange(dateString, start, end){
  const s=localYmd(start), e=localYmd(end);
  return dateString>=s && dateString<=e;
}

function calculatePayForEntries(entries, s){
  const totals={
    total:0,base:0,extraNormal:0,overtime15:0,overtime20:0,
    basePay:0,extraNormalPay:0,overtime15Pay:0,overtime20Pay:0,gross:0
  };

  for(const e of entries){
    const b=entryPayBreakdown(e,s);
    totals.total+=b.total;
    totals.base+=b.base;
    totals.extraNormal+=b.extraNormal;
    totals.overtime15+=b.overtime15;
    totals.overtime20+=b.overtime20;
    totals.basePay+=b.basePay;
    totals.extraNormalPay+=b.extraNormalPay;
    totals.overtime15Pay+=b.overtime15Pay;
    totals.overtime20Pay+=b.overtime20Pay;
    totals.gross+=b.gross;
  }

  totals.superBase=s.includeOvertimeInSuper
    ? totals.gross
    : totals.basePay+totals.extraNormalPay;
  totals.superAmount=totals.superBase*(s.superRate/100);
  return totals;
}

async function render(){
  const s=await getSettings();
  const allEntries=await getAllEntries();

  const [y,m]=salaryMonth.value.split("-");
  const selectedYear=Number(y);
  const selectedMonthIndex=Number(m)-1;
  const cycle=payCycleRange(selectedYear, selectedMonthIndex);

  const cycleEntries=allEntries.filter(e=>inRange(e.date,cycle.start,cycle.end));
  const pay=calculatePayForEntries(cycleEntries,s);

  const tax=atoMonthlyWithholding(pay.gross,s.claimsTaxFreeThreshold);
  const net=Math.max(0,pay.gross-tax-s.otherDeductions);

  // YTD follows pay cycles, not calendar work months.
  // January YTD begins at the start of the January pay cycle,
  // which may include days worked in late December.
  const janCycle=payCycleRange(selectedYear,0);
  const ytdEntries=allEntries.filter(e=>inRange(e.date,janCycle.start,cycle.end));
  const ytd=calculatePayForEntries(ytdEntries,s);

  const monthLabel=new Date(selectedYear,selectedMonthIndex,1)
    .toLocaleDateString("en-AU",{month:"long",year:"numeric"});

  document.getElementById("salaryTitle").textContent=`${monthLabel} pay`;
  document.getElementById("cycleStart").textContent=cycle.start.toLocaleDateString("en-AU",{day:"2-digit",month:"short",year:"numeric"});
  document.getElementById("cycleEnd").textContent=cycle.end.toLocaleDateString("en-AU",{day:"2-digit",month:"short",year:"numeric"});
  document.getElementById("cycleWeeks").textContent=`${cycle.weeks}-week cycle`;

  document.getElementById("baseHours").textContent=fmtMinutes(pay.base);
  document.getElementById("extraNormalHours").textContent=fmtMinutes(pay.extraNormal);
  document.getElementById("overtime15Hours").textContent=fmtMinutes(pay.overtime15);
  document.getElementById("overtime20Hours").textContent=fmtMinutes(pay.overtime20);

  document.getElementById("basePay").textContent=fmtMoney(pay.basePay);
  document.getElementById("extraNormalPay").textContent=fmtMoney(pay.extraNormalPay);
  document.getElementById("overtime15Pay").textContent=fmtMoney(pay.overtime15Pay);
  document.getElementById("overtime20Pay").textContent=fmtMoney(pay.overtime20Pay);

  document.getElementById("grossPay").textContent=fmtMoney(pay.gross);
  document.getElementById("taxPay").textContent="-"+fmtMoney(tax);
  document.getElementById("otherDeductions").textContent="-"+fmtMoney(s.otherDeductions);
  document.getElementById("netPay").textContent=fmtMoney(net);

  document.getElementById("monthlySuper").textContent=fmtMoney(pay.superAmount);
  document.getElementById("ytdSuper").textContent=fmtMoney(ytd.superAmount);
  document.getElementById("ytdSuperBase").textContent=fmtMoney(ytd.superBase);
  document.getElementById("superRateDisplay").textContent=`${s.superRate}%`;
  document.getElementById("superBasisNote").textContent=s.includeOvertimeInSuper
    ? "Calculated on all earnings, including overtime."
    : "Calculated on base + normal-rate extra earnings. 1.5× and 2.0× overtime are excluded.";

  document.getElementById("rateDisplay").textContent=fmtMoney(s.hourlyRate);
  document.getElementById("otDisplay").textContent=`${s.overtime15Multiplier}× / ${s.overtime20Multiplier}×`;
  document.getElementById("thresholdDisplay").textContent=s.claimsTaxFreeThreshold?"Yes":"No";
  document.getElementById("taxMethod").textContent=s.claimsTaxFreeThreshold
    ?"With tax-free threshold"
    :"No tax-free threshold";
}

salaryMonth.onchange=render;
render();
