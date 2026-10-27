const fs=require('fs'),vm=require('vm'),assert=require('assert');const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const c={Date,Intl,Set,URLSearchParams,today:'2026-10-27',niceDate:x=>x,dateKey:(y,m,d)=>`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,monthlyDate:(y,m,d)=>new Date(y,m,Math.min(d,new Date(y,m+1,0).getDate()),12),googleCalendarPayload:item=>({start:{dateTime:item.date+'T'+item.start+':00'},end:{dateTime:item.endDate+'T'+item.end+':00'}})};vm.createContext(c);
function extract(a,b){return html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)))}
vm.runInContext(extract('    function occurrenceDate(', '    function taskAgendaEntries('),c);
vm.runInContext(extract('    function calendarExceptionLines(', '    function taskCalendarRecurrence('),c);
vm.runInContext(extract('    async function syncAppointmentOccurrenceTimes(', '    async function syncAllCalendarAppointments('),c);
(async()=>{
const item={id:'manucure',date:'2026-10-30',endDate:'2026-10-30',start:'12:00',end:'14:00',recurrence:'weekly',recurrenceInterval:3,googleEventId:'master',occurrenceTimes:{'2026-11-05':{start:'12:00',end:'14:00'}},googleOccurrenceTimes:{'2026-11-05':{start:'12:00',end:'14:00'}}};
const savedLocal=JSON.stringify(item.occurrenceTimes);let calls=[];c.calendarApi=async(path,opts)=>{calls.push({path,opts});return{items:[]}};
assert.equal(c.isCurrentAppointmentOccurrence(item,'2026-11-05'),false);assert.equal(c.isCurrentAppointmentOccurrence(item,'2026-11-20'),true);
await c.syncAppointmentOccurrenceTimes(item);assert.equal(calls.length,0);assert.equal(JSON.stringify(item.occurrenceTimes),savedLocal);assert.equal(Object.keys(item.googleOccurrenceTimes).length,0);
// Une référence hors de la fin de l’ancienne série est également ignorée.
const ended={...item,date:'2026-10-15',endDate:'2026-10-15',recurrenceEnd:'2026-11-04',googleOccurrenceTimes:{'2026-11-05':{start:'12:00',end:'14:00'}}};await c.syncAppointmentOccurrenceTimes(ended);assert.equal(calls.length,0);
// Les anciens déplacements ne doivent pas produire de RDATE parasite après un recalcul.
const moved={...item,occurrenceTimes:{},googleOccurrenceTimes:{},occurrenceMoves:{'2026-11-05':'2026-10-30'}};assert.equal(c.calendarExceptionLines(moved,true,'12:00').length,0);
const validMoved={...moved,occurrenceMoves:{'2026-11-20':'2026-11-21'}};assert.equal(c.calendarExceptionLines(validMoved,true,'12:00').length,2);
// Un mélange de références anciennes et d’exceptions valides synchronise seulement les exceptions valides.
item.occurrenceTimes['2026-11-20']={start:'15:00',end:'16:00'};item.occurrenceMoves={'2026-11-20':'2026-11-21'};
c.calendarApi=async(path,opts)=>{calls.push({path,opts});return opts?{}:{items:[{id:'instance20',originalStartTime:{dateTime:new Date('2026-11-20T12:00:00').toISOString()}}]}};
await c.syncAppointmentOccurrenceTimes(item);assert.equal(calls.length,2);assert(calls[0].path.includes('/instances?'));const patch=JSON.parse(calls[1].opts.body);assert.equal(patch.start.dateTime,'2026-11-21T15:00:00');assert.equal(Object.keys(item.googleOccurrenceTimes).length,1);assert.equal(JSON.stringify(item.occurrenceTimes['2026-11-05']),JSON.stringify({start:'12:00',end:'14:00'}));
// Une vraie occurrence manquante conserve l’erreur et les données locales.
const before=JSON.stringify(item);c.calendarApi=async()=>({items:[]});await assert.rejects(()=>c.syncAppointmentOccurrenceTimes(item),/introuvable/);assert.equal(JSON.stringify(item),before);
// Les tâches gardent leur ancien traitement EXDATE/RDATE.
const task={deadline:'2026-10-30',recurrence:'weekly',recurrenceInterval:3,occurrenceMoves:{'2026-11-05':'2026-11-06'}};assert.equal(c.calendarExceptionLines(task,true,'09:00').length,2);
console.log('OK : ancienne date du 5/11 après recalcul, fin de série, exceptions valides, déplacements, données locales conservées, véritable erreur signalée et tâches inchangées.');
})().catch(error=>{console.error(error);process.exitCode=1});
