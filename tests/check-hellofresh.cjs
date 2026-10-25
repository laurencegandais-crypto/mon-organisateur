const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
const extras={weekPlan:{},mealSources:{},mealPlanningInfo:{}},meals={};let saves=0,fail=false;
const c={extras,meals,Date,Intl,Set,escapeHtml:s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),mealPlanName:s=>s.startsWith('__text:')?s.slice(7):s,persistLocal:()=>{if(fail)throw Error('quota');saves++},previewExtrasKey:'extras',scheduleCloudSave(){},showToast(){}};vm.createContext(c);vm.runInContext(html.slice(html.indexOf('    const helloFreshMealChoices='),html.indexOf('    const simpleMealAppliances=')),c);
const key='2026-10-23:dinner',elsewhere='2026-10-24:dinner',name='Chili con carne de Cyril Lignac',id='hf-20261015-chili';
assert(c.helloFreshManagerRows(key).includes(id));assert(c.helloFreshOptionList(key,'','').includes(id));
extras.weekPlan[key]='__text:'+name;meals[key]=name;extras.mealSources[key]='HelloFresh';
assert(!c.helloFreshManagerRows(key).includes(id));assert(!c.helloFreshManagerRows(elsewhere).includes(id));assert(!c.helloFreshOptionList(elsewhere,'','').includes(id));assert(c.helloFreshOptionList(key,name,'HelloFresh').includes('value="'+id+'" selected'));
delete extras.weekPlan[key];delete meals[key];delete extras.mealSources[key];assert(c.helloFreshManagerRows(key).includes(id));assert(c.helloFreshOptionList(elsewhere,'','').includes(id));
extras.weekPlan[key]='__text:'+name;meals[key]=name;extras.mealSources[key]='HelloFresh';assert(c.deleteHelloFreshChoice(id));assert.equal(extras.weekPlan[key],'__text:'+name);assert.equal(meals[key],name);assert.equal(saves,1);
delete extras.weekPlan[key];delete meals[key];delete extras.mealSources[key];assert(!c.helloFreshManagerRows(key).includes(id));assert(!c.helloFreshOptionList(key,'','').includes(id));
// Une suppression sauvegardée reste effective après un nouveau chargement.
extras.helloFreshChoiceVisibility=JSON.parse(JSON.stringify(extras.helloFreshChoiceVisibility));assert(c.isHelloFreshChoiceDeleted(id));assert(!c.helloFreshManagerRows(key).includes(id));assert(c.deleteHelloFreshChoice(id));assert.equal(saves,1);
// Les retraits effectués avec les anciennes versions ne réapparaissent pas.
extras.helloFreshChoiceVisibility['hf-20261015-orzo']={hidden:true,updatedAt:1};assert(!c.helloFreshManagerRows(key).includes('data-hf-choice-delete="hf-20261015-orzo"'));assert(!c.helloFreshOptionList(key,'','').includes('value="hf-20261015-orzo"'));
fail=true;const before=JSON.stringify(extras);assert.equal(c.deleteHelloFreshChoice('hf-20261022-wraps'),false);assert.equal(JSON.stringify(extras),before);assert(c.helloFreshManagerRows(key).includes('hf-20261022-wraps'));fail=false;
assert.equal(c.deleteHelloFreshChoice('inconnu'),false);
const fields={mealHelloFresh:{value:'hf-20261022-lyonnaise'},mealName:{value:''},mealMinutes:{value:''},mealSource:{value:''},other:{hidden:false}};const form={dataset:{simpleMealForm:key},querySelector:s=>s==='.simple-meal-other'?fields.other:fields[s.match(/name="(.*?)"/)[1]]};c.applyHelloFreshMealChoice(form);assert.equal(fields.mealMinutes.value,'30');fields.mealName.value='Mes ingrédients autrement';fields.mealHelloFresh.value='';c.applyHelloFreshMealChoice(form);assert.equal(fields.mealName.value,'Mes ingrédients autrement');
assert(html.includes('min-height:44px;min-width:80px'));assert(html.includes('white-space:normal;overflow-wrap:anywhere'));assert(!html.includes('data-hf-choice-toggle'));assert(html.includes('data-hf-choice-delete'));assert(html.includes("if(!confirm('Supprimer définitivement"));assert(html.includes('name="mealName" maxlength="160"'));
console.log('OK : plats disponibles, masquage des plats planifiés, retour après déplanification, suppression définitive persistante, planning conservé, anciens retraits, échec de sauvegarde, saisie libre et styles mobiles.');
