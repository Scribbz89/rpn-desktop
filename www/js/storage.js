// RPN Field Brain — Data storage layer (localStorage)

const FOOD_CALORIES = {
    "Rice": 360, "Pasta": 370, "Oats": 380, "Flour": 360,
    "Dried Lentils": 350, "Dried Beans": 340, "Tinned Beans": 90,
    "Tinned Tomatoes": 25, "Tinned Meat": 150, "Tinned Fish": 120,
    "Tinned Vegetables": 50, "Tinned Fruit": 60, "Cooking Oil": 900,
    "Sugar": 400, "Salt": 0, "Crackers / Biscuits": 430,
    "Dried Milk Powder": 500, "Honey": 300, "Peanut Butter": 590,
    "Chocolate": 540, "Energy Bars": 420, "Other": 200
};

const FOOD_TYPES = Object.keys(FOOD_CALORIES);

const CATEGORIES = ["Food", "Water", "Medical", "Tools", "Clothing", "Documents", "Communications", "Fuel", "Power", "Pet Food", "Other"];

const POWER_TYPES = ["Generator", "Power Bank", "Solar Panel", "Battery Pack", "UPS", "Battery (AA/AAA/D etc)", "Other"];

const DEFAULT_HOUSEHOLD = {
    adults: 2, children: 0,
    adult_calories: 2000, child_calories: 1000,
    adult_water: 2.0, child_water: 1.5,
    pets: 0, pet_portions_per_day: 0
};

function _get(key, def) {
    try {
        const v = localStorage.getItem('rpn_' + key);
        return v !== null ? JSON.parse(v) : def;
    } catch(e) { return def; }
}
function _set(key, val) {
    localStorage.setItem('rpn_' + key, JSON.stringify(val));
}

// --- Stockpile ---
function loadStockpile() {
    const items = _get('stockpile', []);
    let changed = false;
    let maxId = Math.max(0, ...items.map(i => Number(i.id) || 0));
    items.forEach(i => { if (!i.id && i.id !== 0) { i.id = ++maxId; changed = true; } });
    if (changed) _set('stockpile', items);
    return items;
}
function saveStockpile(items) { _set('stockpile', items); }

function nextId(arr) {
    return arr.length ? Math.max(...arr.map(i => Number(i.id) || 0)) + 1 : 1;
}

function applyExpiryStatus(items) {
    const today = new Date(); today.setHours(0,0,0,0);
    return items.map(item => {
        if (item.expiry) {
            const exp = new Date(item.expiry + 'T00:00:00');
            const days = Math.floor((exp - today) / 86400000);
            item._status = days < 0 ? 'red' : days <= 30 ? 'amber' : 'green';
            item._days_to_expiry = days;
        } else {
            item._status = 'green';
            item._days_to_expiry = null;
        }
        return item;
    });
}

// --- Household ---
function loadHousehold() { return _get('household', { ...DEFAULT_HOUSEHOLD }); }
function saveHousehold(p) { _set('household', p); }

function calculateOverallScore(prep, medReadiness, powerBudget, checklistPct, goalDays) {
    const goal = Number(goalDays) || 30;
    let total = 0, weight = 0;

    // Food and water — always included, highest weight
    total += Math.min(prep.food_days / goal, 1) * 3; weight += 3;
    total += Math.min(prep.water_days / goal, 1) * 3; weight += 3;

    // Checklists — always included
    total += ((checklistPct || 0) / 100) * 1; weight += 1;

    // Medications — only if at least one daily med is tracked
    if (medReadiness && medReadiness.dailyCount > 0 && medReadiness.lowestDays !== null) {
        total += Math.min(medReadiness.lowestDays / goal, 1) * 1; weight += 1;
    }

    // Power — only if loads are configured against power sources
    if (powerBudget && powerBudget.totalWday > 0 && (powerBudget.sustainedBySolar || powerBudget.daysFromStorage !== null || powerBudget.totalStoredWh > 0)) {
        const powerDays = powerBudget.sustainedBySolar ? goal : (powerBudget.daysFromStorage || 0);
        total += Math.min(powerDays / goal, 1) * 1; weight += 1;
    }

    return Math.round((total / weight) * 100);
}

function calculatePreparedness(items, profile) {
    const p = profile || loadHousehold();
    const dailyCals = (Number(p.adults) * Number(p.adult_calories)) + (Number(p.children) * Number(p.child_calories));
    const dailyWater = (Number(p.adults) * Number(p.adult_water)) + (Number(p.children) * Number(p.child_water));
    const dailyPet = Number(p.pet_portions_per_day) || 0;

    let totalCals = 0, totalWater = 0, totalPet = 0, attentionCount = 0;

    items.forEach(item => {
        if (item._status === 'red' || item._status === 'amber') attentionCount++;

        if (item.category === 'Food' && item.weight_g) {
            const cal = Number(item.calories_per_100g) || FOOD_CALORIES[item.food_type] || 200;
            const qty = parseFloat(item.quantity) || 1;
            totalCals += (Number(item.weight_g) / 100) * cal * qty;
        }
        if (item.category === 'Water' && item.weight_g) {
            const qty = parseFloat(item.quantity) || 1;
            totalWater += (Number(item.weight_g) / 1000) * qty;
        }
        if (item.category === 'Pet Food' && item.pet_portions) {
            totalPet += Number(item.pet_portions);
        }
    });

    return {
        food_days: dailyCals > 0 ? Math.round(totalCals / dailyCals * 10) / 10 : 0,
        water_days: dailyWater > 0 ? Math.round(totalWater / dailyWater * 10) / 10 : 0,
        pet_days: dailyPet > 0 ? Math.round(totalPet / dailyPet * 10) / 10 : null,
        attention_count: attentionCount,
    };
}

// Returns true only when the user has entered at least one food item with weight
function hasAnyFood(items) {
    return items.some(i => i.category === 'Food' && Number(i.weight_g) > 0);
}

// Returns true only when the user has entered at least one water item with weight
function hasAnyWater(items) {
    return items.some(i => i.category === 'Water' && Number(i.weight_g) > 0);
}

function calculatePower(items) {
    let generator_hours = 0;
    let stored_wh = 0;
    items.filter(i => i.category === 'Power').forEach(item => {
        if (item.power_type === 'Generator') {
            const fuel = Number(item.fuel_litres) || 0;
            const rate = Number(item.fuel_consumption_lph) || 1;
            generator_hours += fuel / rate;
        } else if (['Power Bank', 'Battery Pack', 'UPS'].includes(item.power_type)) {
            stored_wh += Number(item.capacity_wh) || 0;
        }
    });
    return {
        generator_hours: Math.round(generator_hours * 10) / 10,
        stored_wh: Math.round(stored_wh),
    };
}

// --- Medications ---
function loadMedications() { return _get('medications', []); }
function saveMedications(m) { _set('medications', m); }

function calcMedDays(med) {
    const stock = Number(med.stock_quantity) || 0;
    const unitsPerDose = Number(med.dose_units) || 1;
    const dosesPerDay  = Number(med.doses_per_day) || 1;
    const perDay = unitsPerDose * dosesPerDay;
    return perDay > 0 ? Math.floor(stock / perDay) : null;
}

function calculateMedReadiness(meds) {
    let critical = 0, low = 0, lowestDays = null;
    meds.forEach(med => {
        const days = calcMedDays(med);
        if (days === null) return;
        // warnings apply to all meds
        if (days < 7) critical++;
        else if (days < 14) low++;
        // score only driven by daily medications
        if (med.daily === 'yes') {
            if (lowestDays === null || days < lowestDays) lowestDays = days;
        }
    });
    const dailyCount = meds.filter(m => m.daily === 'yes').length;
    return { critical, low, lowestDays, total: meds.length, dailyCount };
}

// --- Checklists ---
function loadProgress() { return _get('checklist_progress', {}); }
function saveProgress(p) { _set('checklist_progress', p); }
function loadSkipped() { return _get('checklist_skipped', {}); }
function saveSkipped(s) { _set('checklist_skipped', s); }
function loadSkippedLists() { return _get('checklist_skipped_lists', []); }
function saveSkippedLists(s) { _set('checklist_skipped_lists', s); }
function loadCustomChecklists() { return _get('custom_checklists', { overrides: {}, custom_checklists: [] }); }
function saveCustomChecklists(d) { _set('custom_checklists', d); }
function loadChecklistReviews() { return _get('checklist_reviews', {}); }
function saveChecklistReviews(d) { _set('checklist_reviews', d); }
function markChecklistReviewed(listId) {
    var r = loadChecklistReviews();
    r[listId] = new Date().toISOString().slice(0, 10);
    saveChecklistReviews(r);
}
function loadChecklistNotes() { return _get('checklist_notes', {}); }
function saveChecklistNotes(d) { _set('checklist_notes', d); }

// Merge built-in checklist items with user overrides/additions
function mergeChecklist(checklist, overrides, progress, skipped) {
    const id = checklist.id;
    checklist.name = checklist.name || checklist.title || 'Untitled';
    const userItems = overrides[id] || [];
    const baseItems = checklist.items.map(item => ({ text: item, custom: false }));
    const customItems = userItems.map(item => ({ text: item, custom: true }));
    const allItems = [...baseItems, ...customItems];
    const checked = (progress[id] || []);
    const skip = skipped ? (skipped[id] || []) : [];
    return allItems.map((item, idx) => ({ ...item, checked: checked.includes(idx), skipped: skip.includes(idx) }));
}

function checklistStats(builtins) {
    const progress = loadProgress();
    const skipped = loadSkipped();
    const skippedLists = loadSkippedLists();
    const custom = loadCustomChecklists();
    const allLists = [...builtins, ...(custom.custom_checklists || [])];
    let total = 0, done = 0;
    allLists.forEach(cl => {
        if (skippedLists.includes(cl.id)) return; // whole list marked N/A
        const items = mergeChecklist(cl, custom.overrides || {}, progress, skipped);
        const active = items.filter(i => !i.skipped);
        total += active.length;
        done += active.filter(i => i.checked).length;
    });
    return { total, done, pct: total > 0 ? Math.round(done / total * 100) : 0 };
}

// --- Radio ---
function loadRadio() {
    return _get('radio', { frequencies: [], repeaters: [], contacts: [], nets: [], equipment: [], notes: [] });
}
function saveRadio(d) { _set('radio', d); }

// --- Mesh ---
function loadMesh() {
    return _get('mesh', { nodes: [], channels: [], contacts: [], notes: [] });
}
function saveMesh(d) { _set('mesh', d); }

// --- Map ---
function loadMap() { return _get('map_data', { markers: [] }); }
function saveMap(d) { _set('map_data', d); }

// --- Drills ---
function loadDrillData() {
    return _get('drills', { custom: [], overrides: {}, log: [] });
}
function saveDrillData(d) { _set('drills', d); }

function getDrillSteps(drill) {
    const data = loadDrillData();
    const override = (data.overrides || {})[drill.id];
    if (override && override.steps) return override.steps;
    return drill.steps || [];
}

function getDrillTargetTime(drill) {
    const data = loadDrillData();
    const override = (data.overrides || {})[drill.id];
    if (override && override.target_time) return override.target_time;
    return drill.target_time || 600;
}

function getDrillName(drill) {
    const data = loadDrillData();
    const override = (data.overrides || {})[drill.id];
    if (override && override.name) return override.name;
    return drill.name || 'Untitled Drill';
}

function logDrillResult(entry) {
    const data = loadDrillData();
    data.log = data.log || [];
    data.log.unshift(entry); // newest first
    if (data.log.length > 100) data.log = data.log.slice(0, 100);
    saveDrillData(data);
}

function getLastDrillRun(drillId) {
    const data = loadDrillData();
    return (data.log || []).find(e => e.drill_id === drillId) || null;
}

function getDrillRecencyLevel(drillId) {
    var last = getLastDrillRun(drillId);
    if (!last) return 'never';
    var days = daysSince(last.date);
    if (days === null) return 'never';
    if (days <= 90) return 'full';
    if (days <= 180) return 'partial';
    return 'review';
}

function formatDrillTime(seconds) {
    if (!seconds && seconds !== 0) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s.toString().padStart(2,'0')}s` : `${s}s`;
}

// --- Drill frequencies ---
function loadDrillFrequencies() { return _get('drill_frequencies', {}); }
function saveDrillFrequencies(d) { _set('drill_frequencies', d); }

function getDrillFrequency(drillId) {
    return (loadDrillFrequencies()[drillId] || {}).frequency || 0;
}

function setDrillFrequency(drillId, days) {
    const f = loadDrillFrequencies();
    if (!f[drillId]) f[drillId] = {};
    f[drillId].frequency = days;
    saveDrillFrequencies(f);
}

function getDrillReminderStatus(drillId) {
    const freq = getDrillFrequency(drillId);
    if (!freq) return 'none';
    const last = getLastDrillRun(drillId);
    if (!last) return 'overdue';
    const days = daysSince(last.date);
    if (days === null) return 'ok';
    if (days >= freq) return 'overdue';
    if (days >= freq * 0.8) return 'due';
    return 'ok';
}

// --- Stocktake ---
function loadStocktakeSchedule() { return _get('stocktake_schedule', {}); }
function saveStocktakeSchedule(d) { _set('stocktake_schedule', d); }

function loadStocktakeLog() { return _get('stocktake_log', []); }
function saveStocktakeLog(d) { _set('stocktake_log', d); }

function logStocktakeResult(entry) {
    const log = loadStocktakeLog();
    log.unshift(entry);
    if (log.length > 200) log.splice(200);
    saveStocktakeLog(log);
}

function loadStocktakeDraft() { return _get('stocktake_draft', null); }
function saveStocktakeDraft(d) { _set('stocktake_draft', d); }
function clearStocktakeDraft() { localStorage.removeItem('rpn_stocktake_draft'); }

function getStocktakeStatus(category) {
    const schedule = loadStocktakeSchedule();
    const s = schedule[category];
    if (!s || !s.lastDate) return 'never';
    const freq = s.frequency || 90;
    const days = daysSince(s.lastDate);
    if (days === null) return 'never';
    if (days <= freq * 0.85) return 'ok';
    if (days <= freq) return 'due';
    return 'overdue';
}

// --- Audit / Prompt tracking ---
function loadAuditLog() { return _get('audit_log', {}); }
function saveAuditLog(d) { _set('audit_log', d); }

function recordAudit(type) {
    const log = loadAuditLog();
    log[type] = new Date().toISOString().slice(0, 10);
    saveAuditLog(log);
}

function daysSince(dateStr) {
    if (!dateStr) return null;
    const then = new Date(dateStr + 'T00:00:00');
    const now  = new Date(); now.setHours(0,0,0,0);
    return Math.floor((now - then) / 86400000);
}

function generatePrompts(items, meds, drillLog, stats) {
    const audit = loadAuditLog();
    const prompts = [];
    const today = new Date().toISOString().slice(0, 10);

    // Expired stockpile items
    const expired = items.filter(i => i._status === 'red');
    const expiringSoon = items.filter(i => i._status === 'amber');
    if (expired.length > 0) {
        prompts.push({ level: 'red', text: `${expired.length} stockpile item${expired.length>1?'s':''} expired — remove or replace`, link: 'stockpile.html', action: null });
    }
    if (expiringSoon.length > 0) {
        prompts.push({ level: 'amber', text: `${expiringSoon.length} item${expiringSoon.length>1?'s':''} expiring within 30 days`, link: 'stockpile.html', action: null });
    }

    // Stocktake overdue
    const stocktakeSched = loadStocktakeSchedule();
    const schedCats = Object.keys(stocktakeSched);
    const overdueStocktake = schedCats.filter(function(c) {
        const s = stocktakeSched[c];
        return s && s.lastDate && daysSince(s.lastDate) > (s.frequency || 90);
    });
    const neverAudited = schedCats.length === 0;
    if (neverAudited) {
        prompts.push({ level: 'amber', text: 'No stocktake done yet — audit your supplies section by section', link: 'audit.html', action: null });
    } else if (overdueStocktake.length > 0) {
        prompts.push({ level: 'amber', text: overdueStocktake.join(', ') + ' stocktake overdue', link: 'audit.html', action: null });
    }

    // Water check overdue
    const waterAge = daysSince(audit.water);
    if (waterAge === null || waterAge > 90) {
        const msg = waterAge === null ? 'Water supply not yet checked' : `Water supply not checked in ${waterAge} days`;
        prompts.push({ level: 'amber', text: msg, link: 'stockpile.html', action: 'water' });
    }

    // Medication warnings
    if (meds && meds.critical > 0) {
        prompts.push({ level: 'red', text: `${meds.critical} medication${meds.critical>1?'s':''} critical — less than 7 days supply`, link: 'medications.html', action: null });
    }
    if (meds && meds.low > 0) {
        prompts.push({ level: 'amber', text: `${meds.low} medication${meds.low>1?'s':''} running low — less than 14 days supply`, link: 'medications.html', action: null });
    }

    // Drill overdue — general
    const lastDrill = drillLog && drillLog.length > 0 ? drillLog[0].date : null;
    const drillAge = daysSince(lastDrill);
    if (drillAge === null || drillAge > 60) {
        const msg = drillAge === null ? 'No drills completed yet — run your first drill' : `Last drill was ${drillAge} days ago — time to practice`;
        prompts.push({ level: 'amber', text: msg, link: 'drills.html', action: null });
    }

    // Per-drill reminders
    const drillFreqs = loadDrillFrequencies();
    Object.keys(drillFreqs).forEach(function(drillId) {
        const status = getDrillReminderStatus(drillId);
        if (status === 'overdue') {
            const drillEntry = drillLog && drillLog.find(function(e){ return e.drill_id === drillId; });
            const drillName = drillEntry ? drillEntry.drill_name : drillId;
            const freq = drillFreqs[drillId].frequency;
            const last = getLastDrillRun(drillId);
            const age = last ? daysSince(last.date) : null;
            const msg = age === null
                ? drillName + ' drill has never been run'
                : drillName + ' drill overdue — last run ' + age + ' days ago (every ' + freq + ' days)';
            prompts.push({ level: 'amber', text: msg, link: 'drills.html', action: null });
        }
    });

    // Checklist completion low
    if (stats && stats.pct < 40 && stats.total > 0) {
        prompts.push({ level: 'amber', text: `Checklists only ${stats.pct}% complete — review your preparedness`, link: 'checklists.html', action: null });
    }

    // Vehicle check overdue
    const vehicleAge = daysSince(audit.vehicle);
    if (vehicleAge === null || vehicleAge > 60) {
        const msg = vehicleAge === null ? 'Vehicle kit not checked — review your vehicle emergency kit' : `Vehicle kit last checked ${vehicleAge} days ago`;
        prompts.push({ level: 'amber', text: msg, link: 'checklists.html', action: 'vehicle' });
    }

    return prompts;
}

// --- Power loads ---
function loadPowerLoads() { return _get('power_loads', []); }
function savePowerLoads(loads) { _set('power_loads', loads); }

// --- Solar climate lookup ---
const SOLAR_PSH_TABLE = {
    very_high:       { summer: 7,   spring_autumn: 6,   winter: 5   },
    high:            { summer: 6,   spring_autumn: 5,   winter: 3.5 },
    moderate:        { summer: 5,   spring_autumn: 3.5, winter: 2   },
    low:             { summer: 4.5, spring_autumn: 2.5, winter: 1   },
    very_low_winter: { summer: 4,   spring_autumn: 2,   winter: 0.5 },
};
const SOLAR_WEATHER_MULT = { excellent: 1.0, good: 0.8, mixed: 0.5, overcast: 0.2 };

function getSolarPsh(zone, season, weather) {
    const row  = SOLAR_PSH_TABLE[zone]    || SOLAR_PSH_TABLE.moderate;
    const base = row[season]              || row.spring_autumn;
    const mult = SOLAR_WEATHER_MULT[weather] || 0.8;
    return Math.round(base * mult * 10) / 10;
}

function calculatePowerBudget(items, loads, peakSunHours, opts) {
    opts = opts || {};
    const psh = Number(peakSunHours) || 5;
    const SOLAR_EFF   = (Number(opts.solarEff)   || 80) / 100;
    const BATTERY_EFF = (Number(opts.batteryEff) || 85) / 100;

    let ratedStoredWh = 0, usableStoredWh = 0, generatorWh = 0;
    let solarRatedWday = 0, solarWday = 0;
    let totalSolarW = 0;

    items.filter(i => i.category === 'Power').forEach(item => {
        const qty = Math.max(Number(item.quantity) || 1, 1);
        if (item.power_type === 'Generator') {
            const fuel = Number(item.fuel_litres) || 0;
            const rate = Number(item.fuel_consumption_lph) || 1;
            const outputW = Number(item.output_w) || 0;
            generatorWh += (fuel / rate) * outputW * qty;
        } else if (['Power Bank', 'Battery Pack', 'UPS'].includes(item.power_type)) {
            const rated = (Number(item.capacity_wh) || 0) * qty;
            ratedStoredWh += rated;
            usableStoredWh += rated * BATTERY_EFF;
        } else if (item.power_type === 'Solar Panel') {
            const panelW = (Number(item.watt_peak) || Number(item.output_w) || 0) * qty;
            totalSolarW += panelW;
            const ratedDay = panelW * psh;
            solarRatedWday += ratedDay;
            solarWday += ratedDay * SOLAR_EFF;
        }
    });

    const totalStoredWh = usableStoredWh + generatorWh; // usable total
    const totalRatedWh  = ratedStoredWh  + generatorWh; // rated total

    // Rechargeable devices use battery_wh × charges_per_day; others use watts × hours_per_day
    const totalWday = loads.reduce(function(s, l) {
        if (Number(l.battery_wh) > 0) {
            return s + (Number(l.battery_wh) || 0) * (Number(l.charges_per_day) || 1);
        }
        return s + (Number(l.watts) || 0) * (Number(l.hours_per_day) || 0);
    }, 0);

    // Daily surplus (positive) or deficit (negative) after solar
    const dailySurplus  = Math.round(solarWday - totalWday);
    const dailyDeficit  = Math.max(0, -dailySurplus);
    const sustainedBySolar = solarWday >= totalWday && totalWday > 0;

    // Scenario 1: storage drain rate (when solar doesn't fully cover consumption)
    let daysFromStorage = null;
    if (totalWday > 0 && totalStoredWh > 0 && dailyDeficit > 0) {
        daysFromStorage = Math.floor(totalStoredWh / dailyDeficit);
    }

    // Scenario 2: no-solar autonomy — full daily consumption from storage only
    const daysNoSolar = totalWday > 0 && totalStoredWh > 0
        ? Math.floor(totalStoredWh / totalWday) : null;

    // Scenario 3: recharge time — days of good sun to refill batteries from empty
    // Solar surplus (after covering daily use) is what charges batteries
    const daysToRecharge = sustainedBySolar && dailySurplus > 0 && totalStoredWh > 0
        ? Math.ceil(totalStoredWh / dailySurplus) : null;

    // Status level (only when solar and loads both present)
    let statusLevel = null;
    if (totalWday > 0 && solarWday > 0) {
        if      (dailySurplus >= totalWday * 0.5) statusLevel = 'strong_surplus';
        else if (dailySurplus >= 0)               statusLevel = 'sustainable';
        else if (dailyDeficit <= totalWday * 0.2) statusLevel = 'marginal';
        else if (dailyDeficit <= totalWday * 0.5) statusLevel = 'draining';
        else                                       statusLevel = 'unsustainable';
    }

    const cats = {};
    loads.forEach(l => {
        const c = l.category || 'Other';
        if (!cats[c]) cats[c] = 0;
        cats[c] += (Number(l.watts) || 0) * (Number(l.hours_per_day) || 0);
    });

    return {
        // Storage
        ratedStoredWh:  Math.round(ratedStoredWh),
        usableStoredWh: Math.round(usableStoredWh),
        generatorWh:    Math.round(generatorWh),
        totalStoredWh,
        totalRatedWh:   Math.round(totalRatedWh),
        // Solar
        totalSolarW:    Math.round(totalSolarW),
        solarRatedWday: Math.round(solarRatedWday),
        solarWday:      Math.round(solarWday),
        // Consumption
        totalWday:      Math.round(totalWday),
        // Scenarios
        dailySurplus,
        dailyDeficit:   Math.round(dailyDeficit),
        daysFromStorage,
        daysNoSolar,
        daysToRecharge,
        sustainedBySolar,
        statusLevel,
        // Legacy fields (used by home.html power card)
        storedWh:       Math.round(usableStoredWh),
        cats,
    };
}

// --- Export / Import ---
function exportData() {
    var out = { _version: 2, _exported: new Date().toISOString() };
    for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.startsWith('rpn_')) {
            try { out[k] = JSON.parse(localStorage.getItem(k)); }
            catch(e) { out[k] = localStorage.getItem(k); }
        }
    }
    return out;
}

function importData(data) {
    // v2: full rpn_ key dump
    var keys = Object.keys(data).filter(function(k) { return k.startsWith('rpn_'); });
    if (keys.length > 0) {
        keys.forEach(function(k) {
            localStorage.setItem(k, JSON.stringify(data[k]));
        });
        return;
    }
    // v1: named-key fallback for old backups
    var map = {
        stockpile: saveStockpile, household: saveHousehold, medications: saveMedications,
        radio: saveRadio, mesh: saveMesh, map: saveMap,
        checklist_progress: saveProgress, custom_checklists: saveCustomChecklists,
        power_loads: savePowerLoads
    };
    Object.keys(map).forEach(function(key) {
        if (data[key] !== undefined) map[key](data[key]);
    });
}

// --- Data integrity ---
function checkDataIntegrity() {
    var warnings = [];
    var checks = [
        { key: 'stockpile', expected: 'array', save: saveStockpile, def: [] },
        { key: 'medications', expected: 'array', save: saveMedications, def: [] },
        { key: 'power_loads', expected: 'array', save: savePowerLoads, def: [] },
        { key: 'household', expected: 'object', save: saveHousehold, def: {} },
    ];
    checks.forEach(function(c) {
        var raw = localStorage.getItem('rpn_' + c.key);
        if (raw === null) return; // missing is fine — defaults are applied on load
        try {
            var parsed = JSON.parse(raw);
            var ok = c.expected === 'array' ? Array.isArray(parsed) : (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed));
            if (!ok) throw new Error('wrong type');
        } catch(e) {
            localStorage.removeItem('rpn_' + c.key);
            c.save(c.def);
            warnings.push(c.key);
        }
    });
    return warnings;
}

// --- Storage quota ---
function checkStorageQuota(cb) {
    if (!navigator.storage || !navigator.storage.estimate) { cb(null); return; }
    navigator.storage.estimate().then(function(est) {
        if (!est.quota) { cb(null); return; }
        var pct = Math.round((est.usage / est.quota) * 100);
        cb(pct >= 80 ? pct : null);
    }).catch(function() { cb(null); });
}

// --- Utilities ---
function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch(e) { return dateStr; }
}

function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function loadJSON(url) {
    return fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
}

function loadLocations() { return _get('locations', []); }
function saveLocations(d) { _set('locations', d); }
