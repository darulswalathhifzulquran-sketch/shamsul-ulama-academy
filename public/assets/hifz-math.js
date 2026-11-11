/* 604-page Hifz plan calculator. Uses the Academy's configured Juz boundary map.
 * User-selected Juz count is NEVER interpreted as the same number of pages.
 * All calendar operations use UTC calendar dates; local start date comes from Asia/Kolkata.
 */
(function(global){'use strict';
const START=[1,22,42,62,82,102,121,142,162,182,201,222,242,262,282,302,322,342,362,382,402,422,442,462,482,502,522,542,562,582,605];
const size=n=>START[n]-START[n-1];
function sumJuz(count,direction){
 if(!Number.isInteger(count)||count<0||count>30)throw Error('Select 0–30 completed Juz.');
 if(!['ascending','descending'].includes(direction))throw Error('Select a valid memorization direction.');
 let total=0;for(let i=0;i<count;i++){const n=direction==='ascending'?i+1:30-i;total+=size(n);}return total;
}
function nextJuz(count,direction){return count>=30?null:direction==='ascending'?count+1:30-count;}
function dateUtc(y,m,d){return new Date(Date.UTC(y,m-1,d));}
function addMonths(date,number){
 const year=date.getUTCFullYear(),month=date.getUTCMonth()+number;
 const first=new Date(Date.UTC(year,month,1));const last=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();
 return dateUtc(first.getUTCFullYear(),first.getUTCMonth()+1,Math.min(date.getUTCDate(),last));
}
function addDays(date,n){return new Date(date.getTime()+n*86400000);}
function dayCount(start,end){return Math.round((end-start)/86400000);}
function studyCount(start,end,weekdays,holidayDates){
 let n=0;const difference=dayCount(start,end);
 for(let i=1;i<=difference;i++){const d=addDays(start,i);if(weekdays.has(d.getUTCDay())&&!holidayDates.has(d.toISOString().slice(0,10)))n++;}return n;
}
function roadmap({start,end,memorized,weekdays=new Set([0,1,2,3,4,5,6]),holidays=[]}){
 if(!(start instanceof Date)||!(end instanceof Date)||isNaN(start)||isNaN(end)||end<=start)throw Error('Choose a future target date.');
 const week=new Set([...weekdays].map(Number));
 if(!week.size||[...week].some(n=>!Number.isInteger(n)||n<0||n>6))throw Error('Select at least one study day.');
 const omitted=new Set(holidays),totalDays=studyCount(start,end,week,omitted);
 if(!totalDays)throw Error('There are no study days in your chosen schedule.');
 const pages=Math.max(0,604-Number(memorized));
 if(!Number.isFinite(pages)||pages>604||Math.abs(pages*2-Math.round(pages*2))>1e-7)throw Error('Memorized pages must be 0–604 in half-page steps.');
 const units=Math.round(pages*2);
 const rows=[];let previous=start,previousUnits=0,daysSoFar=0;let i=1;
 while(previous<end&&i<=361){
  const candidate=addMonths(start,i);
  const last=candidate<end?candidate:end;
  const session=studyCount(previous,last,week,omitted);
  daysSoFar+=session;
  const allocated=last.getTime()===end.getTime()?units:Math.floor((units*daysSoFar)/totalDays+1e-9);
  const currentUnits=allocated-previousUnits;
  rows.push({month:i,start:previous.toISOString().slice(0,10),end:last.toISOString().slice(0,10),study_days:session,new_pages:currentUnits/2,cumulative_new_pages:allocated/2,estimated_total_pages:Number(memorized)+allocated/2});
  previousUnits=allocated;previous=last;i++;
 }
 if(previous<end||previousUnits!==units||Math.abs(rows.reduce((a,x)=>a+x.new_pages,0)-pages)>1e-7)throw Error('Monthly page allocation did not reconcile.');
 return {remaining:pages,memorized:Number(memorized),study_days:totalDays,calendar_days:dayCount(start,end),per_study_day:pages/totalDays,per_week:pages/totalDays*week.size,months:rows,completion_date:end.toISOString().slice(0,10)};
}
global.AcademyHifzMath=Object.freeze({START,size,sumJuz,nextJuz,addMonths,roadmap,dateUtc});
})(window);
