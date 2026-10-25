const fs=require('fs'),vm=require('vm'),assert=require('assert');const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const extras={weekPlan:{},mealSources:{},mealPlanningInfo:{}},meals={};const c={extras,meals,Date,Intl,Set,escapeHtml:s=>s.replaceAll('&','&amp;'),mealPlanName:s=>s.startsWith('__text:')?s.slice(7):s,persistLocal(){},previewExtrasKey:'extras',scheduleCloudSave(){},showToast(){}};vm.createContext(c);vm.runInContext(html.slice(html.indexOf('    const helloFreshMealChoices='),html.indexOf('    const simpleMealAppliances=')),c);
const count=date=>c.helloFreshAvailableChoices(date+':dinner').length;assert.equal(count('2026-10-14'),0);assert.equal(count('2026-10-15'),6);assert.equal(count('2026-10-21'),6);assert.equal(count('2026-10-22'),12);assert(!c.helloFreshManagerRows('2026-10-21:dinner').includes('hf-20261022-'));assert(c.helloFreshManagerRows('2026-10-22:dinner').includes('hf-20261022-tagliata'));
const options=c.helloFreshOptionList('2026-10-22:dinner','','');assert.equal((options.match(/<optgroup/g)||[]).length,2);assert(options.includes('Livraison du 15 octobre'));assert(options.includes('Livraison du 22 octobre'));
assert(c.deleteHelloFreshChoice('hf-20261022-tagliata'));assert.equal(count('2026-10-21'),6);assert.equal(count('2026-10-22'),11);
console.log('OK : deux livraisons, dates de disponibilité, regroupement et suppression limitée à la recette choisie.');

// Livraison du 30 octobre : cinq choix distincts, disponibles à partir du bon jour.
assert.equal(c.helloFreshAvailableChoices('2026-10-29:dinner').filter(recipe=>recipe.id.startsWith('hf-20261030-')).length,0);
const newRecipes=c.helloFreshAvailableChoices('2026-10-30:dinner').filter(recipe=>recipe.id.startsWith('hf-20261030-'));
assert.equal(newRecipes.length,5);assert.equal(newRecipes.find(recipe=>recipe.id==='hf-20261030-paprika').minutes,40);assert.equal(newRecipes.find(recipe=>recipe.id==='hf-20261030-orzo').minutes,35);assert.equal(newRecipes.find(recipe=>recipe.id==='hf-20261030-penne').minutes,25);
assert(!c.helloFreshManagerRows('2026-10-29:dinner').includes('hf-20261030-'));assert(c.helloFreshManagerRows('2026-10-30:dinner').includes('hf-20261030-paprika'));assert(c.helloFreshOptionList('2026-10-30:dinner','','').includes('Livraison du 30 octobre'));
assert(c.deleteHelloFreshChoice('hf-20261030-croque'));assert(!c.helloFreshManagerRows('2026-10-30:dinner').includes('hf-20261030-croque'));assert(!c.helloFreshOptionList('2026-10-30:dinner','','').includes('hf-20261030-croque'));
console.log('OK : cinq recettes du 30 octobre, durées, date limite et suppression définitive.');
