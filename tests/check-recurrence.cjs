const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
const nodes=new Map(),handlers=new Map();
function node(id){if(!nodes.has(id))nodes.set(id,{value:'',hidden:true,style:{},focus(){},addEventListener(type,fn){handlers.set(id+':'+type,fn)},requestSubmit(){handlers.get('#occurrenceForm:submit')({preventDefault(){}})}});return nodes.get(id)}
const c={console,Date,Intl,URLSearchParams,alert:msg=>c.alerts.push(msg),alerts:[],organizer:{appointments:[],tasks:[]},today:'2026-10-08',document:{querySelector:node,body:{style:{},insertAdjacentHTML(){}},addEventListener(){}},niceDate:x=>x,sameId:(a,b)=>String(a)===String(b),dateKey:(y,m,d)=>`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,monthlyDate:(y,m,d)=>new Date(y,m,Math.min(d,new Date(y,m+1,0).getDate()),12),appointmentInvitationSummary:()=>'',importedTodoTheme:()=>'',categoryColor:()=>'',renderTasks(){},renderAgenda(){},renderToday(){},showToast(){},saveOrganizer(){},markAppointmentForCalendar(){}};
vm.createContext(c);
const start=html.indexOf('    function occurrenceDate('),end=html.indexOf('    function agendaEntries()',start);vm.runInContext(html.slice(start,end),c);
const weekly={id:'rdv',title:'Test',date:'2026-10-08',endDate:'2026-10-08',start:'09:00',end:'10:00',recurrence:'weekly',recurrenceEnd:'2026-10-29',occurrenceMoves:{'2026-10-15':'2026-10-16'}};c.organizer.appointments=[weekly];
assert.equal(c.appointmentAgendaEntries(weekly)[1].date,'2026-10-16');
c.openOccurrenceEditor('appointment','rdv','2026-10-15');assert.equal(node('#occurrenceStart').value,'09:00');assert.equal(node('#occurrenceTimeFields').hidden,false);
node('#occurrenceNewDate').value='2026-10-17';node('#occurrenceStart').value='14:00';node('#occurrenceEnd').value='15:30';node('#occurrenceForm').requestSubmit();
let entries=c.appointmentAgendaEntries(weekly);assert.equal(entries[1].date,'2026-10-17');assert.equal(entries[1].start,'14:00');assert.equal(entries[1].end,'15:30');assert.equal(entries[2].start,'09:00');assert.equal(weekly.start,'09:00');
// Same date, different hours.
c.openOccurrenceEditor('appointment','rdv','2026-10-15');node('#occurrenceNewDate').value='2026-10-15';node('#occurrenceStart').value='16:00';node('#occurrenceEnd').value='17:00';node('#occurrenceForm').requestSubmit();assert.equal(c.appointmentAgendaEntries(weekly)[1].start,'16:00');
// Restore both date and times.
c.openOccurrenceEditor('appointment','rdv','2026-10-15');handlers.get('#occurrenceRestore:click')();assert.equal(weekly.occurrenceTimes['2026-10-15'],undefined);assert.equal(weekly.occurrenceMoves['2026-10-15'],undefined);
// Invalid end / missing end cannot change stored data.
c.openOccurrenceEditor('appointment','rdv','2026-10-15');node('#occurrenceStart').value='12:00';node('#occurrenceEnd').value='11:00';node('#occurrenceForm').requestSubmit();assert.equal(weekly.occurrenceTimes['2026-10-15'],undefined);node('#occurrenceEnd').value='';node('#occurrenceForm').requestSubmit();assert.equal(weekly.occurrenceTimes['2026-10-15'],undefined);
// Save failure preserves both previous maps.
c.saveOrganizer=()=>{throw Error('quota')};node('#occurrenceEnd').value='13:00';node('#occurrenceNewDate').value='2026-10-17';node('#occurrenceForm').requestSubmit();assert.equal(weekly.occurrenceTimes['2026-10-15'],undefined);assert.equal(weekly.occurrenceMoves['2026-10-15'],undefined);c.saveOrganizer=()=>{};
// All-day series can have one timed occurrence, monthly clamping remains intact.
const monthly={...weekly,id:'month',date:'2026-01-31',endDate:'2026-01-31',start:'',end:'',recurrence:'monthly',recurrenceEnd:'2026-03-31',occurrenceTimes:{'2026-02-28':{start:'10:00',end:'11:30'}},occurrenceMoves:{}};entries=c.appointmentAgendaEntries(monthly);assert.equal(entries[1].date,'2026-02-28');assert.equal(entries[1].start,'10:00');assert.equal(entries[2].start,'');
// Daily recurrence and multi-day duration survive an individual move.
const daily={...weekly,id:'daily',recurrence:'daily',recurrenceEnd:'2026-10-10',occurrenceTimes:{'2026-10-09':{start:'18:00',end:'19:00'}},occurrenceMoves:{}};assert.equal(c.appointmentAgendaEntries(daily)[1].start,'18:00');assert.equal(c.appointmentAgendaEntries(daily)[2].start,'09:00');
const spanning={...weekly,endDate:'2026-10-09',occurrenceMoves:{'2026-10-15':'2026-10-17'},occurrenceTimes:{'2026-10-15':{start:'23:00',end:'01:00'}}};assert.equal(c.appointmentOccurrence(spanning,'2026-10-15').endDate,'2026-10-18');assert.equal(c.appointmentOccurrence(spanning,'2026-10-15').end,'01:00');
// Tasks keep their date-only editor.
c.organizer.tasks=[{id:'task',text:'Task',deadline:'2026-10-08',recurrence:'weekly'}];c.openOccurrenceEditor('task','task','2026-10-08');assert.equal(node('#occurrenceTimeFields').hidden,true);
// Google instance synchronization, including restoration, is exercised without real calls.
function extract(a,b){return html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)))}
vm.runInContext(extract('    function calendarExceptionLines(', '    function taskCalendarRecurrence('),c);
assert.equal(c.calendarExceptionLines({...weekly,occurrenceMoves:{'2026-10-15':'2026-10-17'},occurrenceTimes:{'2026-10-15':{start:'14:00',end:'15:00'}}},true,'09:00').length,0);
assert.equal(c.calendarExceptionLines({...weekly,occurrenceMoves:{'2026-10-15':'2026-10-17'},occurrenceTimes:{}},true,'09:00').length,2);
vm.runInContext(extract('    async function syncAppointmentOccurrenceTimes(', '    async function syncAllCalendarAppointments('),c);
c.googleCalendarPayload=item=>({start:{dateTime:item.date+'T'+item.start+':00'},end:{dateTime:item.endDate+'T'+item.end+':00'}});
(async()=>{let patches=[];weekly.googleEventId='google';weekly.occurrenceTimes={'2026-10-15':{start:'14:00',end:'15:00'}};weekly.occurrenceMoves={'2026-10-15':'2026-10-17'};c.calendarApi=async(path,opts)=>{if(opts){patches.push(JSON.parse(opts.body));return{}}return{items:[{id:'instance',originalStartTime:{dateTime:new Date('2026-10-15T09:00:00').toISOString()}}]}};await c.syncAppointmentOccurrenceTimes(weekly);assert.equal(patches[0].start.dateTime,'2026-10-17T14:00:00');weekly.occurrenceTimes={};weekly.occurrenceMoves={};await c.syncAppointmentOccurrenceTimes(weekly);assert.equal(patches[1].start.dateTime,'2026-10-15T09:00:00');assert.equal(Object.keys(weekly.googleOccurrenceTimes).length,0);weekly.occurrenceTimes={'2026-10-15':{start:'14:00',end:'15:00'}};c.calendarApi=async()=>({items:[]});await assert.rejects(()=>c.syncAppointmentOccurrenceTimes(weekly),/introuvable/);console.log('OK: syntaxe, horaires, occurrence seule, rétablissement, ancien déplacement, mensuel, journée entière, tâches, sauvegarde refusée, Google simulé.');})().catch(e=>{console.error(e);process.exitCode=1});
