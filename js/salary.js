const salaryMonth=document.getElementById("salaryMonth");
salaryMonth.value=monthKey();

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
  const monthEntries=allEntries.filter(e=>e.date.startsWith(salaryMonth.value));
  const month=calculatePayForEntries(monthEntries,s);

  const tax=atoMonthlyWithholding(month.gross,s.claimsTaxFreeThreshold);
  const net=Math.max(0,month.gross-tax-s.otherDeductions);

  const [y,m]=salaryMonth.value.split("-");
  const selectedYear=Number(y), selectedMonth=Number(m);
  const ytdEntries=allEntries.filter(e=>{
    const ey=Number(e.date.slice(0,4)), em=Number(e.date.slice(5,7));
    return ey===selectedYear && em<=selectedMonth;
  });
  const ytd=calculatePayForEntries(ytdEntries,s);

  document.getElementById("salaryTitle").textContent=
    new Date(selectedYear,selectedMonth-1,1).toLocaleDateString("en-AU",{month:"long",year:"numeric"});

  document.getElementById("baseHours").textContent=fmtMinutes(month.base);
  document.getElementById("extraNormalHours").textContent=fmtMinutes(month.extraNormal);
  document.getElementById("overtime15Hours").textContent=fmtMinutes(month.overtime15);
  document.getElementById("overtime20Hours").textContent=fmtMinutes(month.overtime20);

  document.getElementById("basePay").textContent=fmtMoney(month.basePay);
  document.getElementById("extraNormalPay").textContent=fmtMoney(month.extraNormalPay);
  document.getElementById("overtime15Pay").textContent=fmtMoney(month.overtime15Pay);
  document.getElementById("overtime20Pay").textContent=fmtMoney(month.overtime20Pay);

  document.getElementById("grossPay").textContent=fmtMoney(month.gross);
  document.getElementById("taxPay").textContent="-"+fmtMoney(tax);
  document.getElementById("otherDeductions").textContent="-"+fmtMoney(s.otherDeductions);
  document.getElementById("netPay").textContent=fmtMoney(net);

  document.getElementById("monthlySuper").textContent=fmtMoney(month.superAmount);
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
