const salaryMonth=document.getElementById("salaryMonth");
salaryMonth.value=monthKey();

function calculatePayForEntries(entries, s){
  let regular=0, overtime=0;

  for(const e of entries){
    const mins=entryMinutes(e);
    const threshold=s.regularHoursPerDay*60;
    regular+=Math.min(mins,threshold);
    overtime+=Math.max(0,mins-threshold);
  }

  const regularPay=regular/60*s.hourlyRate;
  const overtimePay=overtime/60*s.hourlyRate*s.overtimeMultiplier;
  const gross=regularPay+overtimePay;

  const superBase = s.includeOvertimeInSuper ? gross : regularPay;
  const superAmount = superBase * (s.superRate/100);

  return {regular,overtime,regularPay,overtimePay,gross,superBase,superAmount};
}

async function render(){
  const s=await getSettings();
  const allEntries=await getAllEntries();

  const monthEntries=allEntries.filter(e=>e.date.startsWith(salaryMonth.value));
  const month=calculatePayForEntries(monthEntries,s);

  const tax=atoMonthlyWithholding(month.gross, s.claimsTaxFreeThreshold);
  const net=Math.max(0,month.gross-tax-s.otherDeductions);

  const [y,m]=salaryMonth.value.split("-");
  const selectedYear=Number(y);
  const selectedMonth=Number(m);

  // Year-to-date means January through the selected month.
  const ytdEntries=allEntries.filter(e=>{
    const ey=Number(e.date.slice(0,4));
    const em=Number(e.date.slice(5,7));
    return ey===selectedYear && em<=selectedMonth;
  });
  const ytd=calculatePayForEntries(ytdEntries,s);

  document.getElementById("salaryTitle").textContent=
    new Date(selectedYear,selectedMonth-1,1).toLocaleDateString("en-AU",{month:"long",year:"numeric"});

  document.getElementById("regularHours").textContent=fmtMinutes(month.regular);
  document.getElementById("overtimeHours").textContent=fmtMinutes(month.overtime);
  document.getElementById("regularPay").textContent=fmtMoney(month.regularPay);
  document.getElementById("overtimePay").textContent=fmtMoney(month.overtimePay);
  document.getElementById("grossPay").textContent=fmtMoney(month.gross);
  document.getElementById("taxPay").textContent="-"+fmtMoney(tax);
  document.getElementById("otherDeductions").textContent="-"+fmtMoney(s.otherDeductions);
  document.getElementById("netPay").textContent=fmtMoney(net);

  document.getElementById("monthlySuper").textContent=fmtMoney(month.superAmount);
  document.getElementById("ytdSuper").textContent=fmtMoney(ytd.superAmount);
  document.getElementById("ytdSuperBase").textContent=fmtMoney(ytd.superBase);
  document.getElementById("superRateDisplay").textContent=`${s.superRate}%`;
  document.getElementById("superBasisNote").textContent=s.includeOvertimeInSuper
    ? "Calculated on regular + overtime earnings."
    : "Calculated on regular/ordinary earnings only. Overtime is excluded.";

  document.getElementById("rateDisplay").textContent=fmtMoney(s.hourlyRate);
  document.getElementById("otDisplay").textContent=`${s.overtimeMultiplier}×`;
  document.getElementById("thresholdDisplay").textContent=s.claimsTaxFreeThreshold?"Yes":"No";
  document.getElementById("taxMethod").textContent=s.claimsTaxFreeThreshold
    ?"With tax-free threshold"
    :"No tax-free threshold";
}

salaryMonth.onchange=render;
render();
