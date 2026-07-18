// RPN Field Brain — Recommendation Engine
// Phase 3: Next Best Action system
//
// Depends on: storage.js, readiness.js (must be loaded first)
//
// Usage:
//   const recs = getRankedRecommendations(data, 3);
//   dismissRec(id);  snoozeRec(id);

var REC_DISMISS_PREFIX = 'rpn_rec_dismiss_';
var REC_SNOOZE_PREFIX  = 'rpn_rec_snooze_';
var SNOOZE_DAYS = 7;

// All possible recommendations ordered by priority (lower = more urgent).
// condition(data) must return true for the rec to be relevant.
// description can be a string or function(data) returning a string.
var RECOMMENDATION_LIBRARY = [

    // ── Life-critical ──────────────────────────────────────────────────
    {
        id: 'no_water',
        priority: 1,
        title: 'Add drinking water — no supply recorded',
        description: 'You have no water logged in your stockpile. Water is the most critical survival resource. An adult needs around 3 litres per day minimum. Open Stockpile and add whatever you have.',
        route: 'stockpile.html',
        routeLabel: 'Go to Stockpile',
        scoreImpact: 7,
        condition: function(d) { return !hasAnyWater(d.items); },
    },
    {
        id: 'no_food',
        priority: 2,
        title: 'Add food — no supply recorded',
        description: 'You have no food logged in your stockpile. Start with easy long-life items: rice, pasta, tinned beans, tinned meat. Open Stockpile and add what you have at home right now.',
        route: 'stockpile.html',
        routeLabel: 'Go to Stockpile',
        scoreImpact: 7,
        condition: function(d) { return !hasAnyFood(d.items); },
    },
    {
        id: 'med_critical',
        priority: 3,
        title: 'Critical medication shortage',
        description: function(d) {
            var n = d.meds && d.meds.critical > 0 ? d.meds.critical : 1;
            return n + ' medication' + (n !== 1 ? 's have' : ' has') + ' less than 7 days of supply remaining. Restock before an emergency locks you out of a pharmacy.';
        },
        route: 'medications.html',
        routeLabel: 'View Medications',
        scoreImpact: 5,
        condition: function(d) { return d.meds && d.meds.critical > 0; },
    },

    // ── Water ──────────────────────────────────────────────────────────
    {
        id: 'water_3day',
        priority: 10,
        title: 'Reach a 3-day water supply',
        description: function(d) {
            var have = d.prep.water_days || 0;
            var hh = d.profile || {};
            var people = Math.max(1, (hh.adults || 1) + (hh.children || 0));
            var need = Math.ceil(Math.max(0, (3 - have) * people * 3));
            return 'You have approximately ' + have.toFixed(1) + ' day' + (have !== 1 ? 's' : '') + ' of water. Add around ' + need + ' litres to reach a 3-day supply for your household.';
        },
        route: 'stockpile.html',
        routeLabel: 'Go to Stockpile',
        scoreImpact: 4,
        condition: function(d) { return hasAnyWater(d.items) && d.prep.water_days < 3; },
    },
    {
        id: 'water_7day',
        priority: 11,
        title: 'Reach a 7-day water supply',
        description: function(d) {
            var have = d.prep.water_days || 0;
            var hh = d.profile || {};
            var people = Math.max(1, (hh.adults || 1) + (hh.children || 0));
            var need = Math.ceil(Math.max(0, (7 - have) * people * 3));
            return 'Good — you have ' + have.toFixed(1) + ' days of water. Add around ' + need + ' more litres to reach a 7-day supply.';
        },
        route: 'stockpile.html',
        routeLabel: 'Go to Stockpile',
        scoreImpact: 4,
        condition: function(d) { return hasAnyWater(d.items) && d.prep.water_days >= 3 && d.prep.water_days < 7; },
    },
    {
        id: 'water_30day',
        priority: 12,
        title: 'Build toward a 30-day water supply',
        description: function(d) {
            var have = d.prep.water_days || 0;
            return 'You have ' + have.toFixed(1) + ' days of water. Pushing to 30 days significantly increases your resilience for extended emergencies.';
        },
        route: 'stockpile.html',
        routeLabel: 'Go to Stockpile',
        scoreImpact: 4,
        condition: function(d) { return hasAnyWater(d.items) && d.prep.water_days >= 7 && d.prep.water_days < 30; },
    },

    // ── Food ───────────────────────────────────────────────────────────
    {
        id: 'food_3day',
        priority: 20,
        title: 'Reach a 3-day food supply',
        description: function(d) {
            var have = d.prep.food_days || 0;
            return 'You have approximately ' + have.toFixed(1) + ' day' + (have !== 1 ? 's' : '') + ' of food stored. A 3-day supply is the first survival milestone.';
        },
        route: 'stockpile.html',
        routeLabel: 'Go to Stockpile',
        scoreImpact: 4,
        condition: function(d) { return hasAnyFood(d.items) && d.prep.food_days < 3; },
    },
    {
        id: 'food_7day',
        priority: 21,
        title: 'Reach a 7-day food supply',
        description: function(d) {
            var have = d.prep.food_days || 0;
            return 'You have ' + have.toFixed(1) + ' days of food. Extend to 7 days to cover most short-term emergencies.';
        },
        route: 'stockpile.html',
        routeLabel: 'Go to Stockpile',
        scoreImpact: 4,
        condition: function(d) { return hasAnyFood(d.items) && d.prep.food_days >= 3 && d.prep.food_days < 7; },
    },
    {
        id: 'food_30day',
        priority: 22,
        title: 'Build toward a 30-day food supply',
        description: function(d) {
            var have = d.prep.food_days || 0;
            return 'You have ' + have.toFixed(1) + ' days of food. A 30-day supply gives you resilience for prolonged disruptions.';
        },
        route: 'stockpile.html',
        routeLabel: 'Go to Stockpile',
        scoreImpact: 4,
        condition: function(d) { return hasAnyFood(d.items) && d.prep.food_days >= 7 && d.prep.food_days < 30; },
    },

    // ── Medical ────────────────────────────────────────────────────────
    {
        id: 'med_low',
        priority: 30,
        title: 'Restock medications running low',
        description: function(d) {
            var n = d.meds && d.meds.low > 0 ? d.meds.low : 1;
            return n + ' tracked medication' + (n !== 1 ? 's are' : ' is') + ' below 14 days of supply. Order a repeat prescription before stock runs out.';
        },
        route: 'medications.html',
        routeLabel: 'View Medications',
        scoreImpact: 3,
        condition: function(d) { return d.meds && d.meds.critical === 0 && d.meds.low > 0; },
    },
    {
        id: 'med_none',
        priority: 31,
        title: 'Log your medications',
        description: 'Tracking your medications lets the app warn you before you run low. Add any prescriptions or essential over-the-counter medicines you rely on.',
        route: 'medications.html',
        routeLabel: 'Add Medications',
        scoreImpact: 4,
        condition: function(d) { return !d.meds || d.meds.total === 0; },
    },

    // ── Power ──────────────────────────────────────────────────────────
    {
        id: 'power_none',
        priority: 40,
        title: 'Add a backup power source',
        description: 'No power source is logged. A power bank, battery pack or generator gives you lighting, communications and device charging when the grid goes down.',
        route: 'stockpile.html',
        routeLabel: 'Go to Stockpile',
        scoreImpact: 3,
        condition: function(d) { return !d.items.some(function(i) { return i.category === 'Power'; }); },
    },
    {
        id: 'power_configure',
        priority: 41,
        title: 'Configure your power setup',
        description: 'You have power items logged. Add your devices in the Power tab so the app can calculate how many days your stored energy will last.',
        route: 'power.html',
        routeLabel: 'Go to Power',
        scoreImpact: 4,
        condition: function(d) {
            return d.items.some(function(i) { return i.category === 'Power'; })
                && (!d.pb || (!d.pb.sustainedBySolar && (d.pb.daysFromStorage === null || d.pb.daysFromStorage < 3)));
        },
    },
    {
        id: 'power_solar',
        priority: 42,
        title: 'Add a solar panel',
        description: 'A solar panel lets you recharge batteries indefinitely during extended outages. Even a small panel (100W+) makes a significant difference.',
        route: 'stockpile.html',
        routeLabel: 'Go to Stockpile',
        scoreImpact: 3,
        condition: function(d) {
            return d.items.some(function(i) { return i.category === 'Power'; })
                && !d.items.some(function(i) { return i.category === 'Power' && i.power_type === 'Solar Panel'; });
        },
    },

    // ── Communications ─────────────────────────────────────────────────
    {
        id: 'comms_freq',
        priority: 50,
        title: 'Save emergency frequencies',
        description: 'Store your local emergency frequencies, repeater details and calling channels in Radio Notebook. In a comms blackout you need these instantly — do not rely on memory.',
        route: 'radio.html',
        routeLabel: 'Open Radio Notebook',
        scoreImpact: 3,
        condition: function(d) { return !d.radio || !d.radio.frequencies || d.radio.frequencies.length === 0; },
    },
    {
        id: 'comms_contacts',
        priority: 51,
        title: 'Add radio contacts',
        description: 'Log the callsigns and frequencies of people you would contact in an emergency. Do not rely on memory under pressure.',
        route: 'radio.html',
        routeLabel: 'Open Radio Notebook',
        scoreImpact: 3,
        condition: function(d) { return !d.radio || !d.radio.contacts || d.radio.contacts.length === 0; },
    },
    {
        id: 'comms_mesh',
        priority: 52,
        title: 'Set up a MeshCore node',
        description: 'A MeshCore node gives you off-grid text communications with other RPN members in your area when all other networks are down.',
        route: 'mesh.html',
        routeLabel: 'Open MeshCore',
        scoreImpact: 4,
        condition: function(d) { return !d.mesh || !d.mesh.nodes || d.mesh.nodes.length === 0; },
    },

    // ── Planning ───────────────────────────────────────────────────────
    {
        id: 'plan_start',
        priority: 60,
        title: 'Start your preparedness checklists',
        description: 'Your checklists cover go-bag, first aid kit, vehicle kit and more. Working through them systematically closes real gaps in your preparedness.',
        route: 'checklists.html',
        routeLabel: 'Open Checklists',
        scoreImpact: 2,
        condition: function(d) { return d.checklistPct === 0; },
    },
    {
        id: 'plan_40',
        priority: 61,
        title: 'Continue your checklists',
        description: function(d) {
            return 'Your checklists are ' + Math.round(d.checklistPct) + '% complete. Keep going — each tick closes a real gap.';
        },
        route: 'checklists.html',
        routeLabel: 'Open Checklists',
        scoreImpact: 4,
        condition: function(d) { return d.checklistPct > 0 && d.checklistPct < 40; },
    },
    {
        id: 'plan_80',
        priority: 62,
        title: 'Push your checklists to 80%',
        description: function(d) {
            return 'Your checklists are ' + Math.round(d.checklistPct) + '% complete. Reaching 80% earns full planning points in your readiness score.';
        },
        route: 'checklists.html',
        routeLabel: 'Open Checklists',
        scoreImpact: 4,
        condition: function(d) { return d.checklistPct >= 40 && d.checklistPct < 80; },
    },

    // ── Drills ─────────────────────────────────────────────────────────
    {
        id: 'drill_first',
        priority: 70,
        title: 'Run your first drill',
        description: 'Knowing your plan is not the same as executing it under pressure. Run any drill — even a simple 10-minute power-cut response — and log the result.',
        route: 'drills.html',
        routeLabel: 'Open Drills',
        scoreImpact: 3,
        condition: function(d) { return !d.drillLog || d.drillLog.length === 0; },
    },
    {
        id: 'drill_overdue',
        priority: 71,
        title: 'Run a drill — overdue',
        description: function(d) {
            var age = d.drillLog && d.drillLog.length ? daysSince(d.drillLog[0].date) : null;
            return age !== null
                ? 'Your last drill was ' + age + ' days ago. Regular practice keeps your household ready to act fast. Aim for at least every 90 days.'
                : 'Run a drill to keep your skills sharp.';
        },
        route: 'drills.html',
        routeLabel: 'Open Drills',
        scoreImpact: 4,
        condition: function(d) {
            if (!d.drillLog || d.drillLog.length === 0) return false;
            var age = daysSince(d.drillLog[0].date);
            return age !== null && age > 90;
        },
    },
    {
        id: 'drill_monthly',
        priority: 72,
        title: 'Run a drill — monthly practice recommended',
        description: function(d) {
            var age = d.drillLog && d.drillLog.length ? daysSince(d.drillLog[0].date) : null;
            return age !== null
                ? 'Your last drill was ' + age + ' days ago. Monthly practice makes responses automatic.'
                : 'Keep up the regular drills.';
        },
        route: 'drills.html',
        routeLabel: 'Open Drills',
        scoreImpact: 3,
        condition: function(d) {
            if (!d.drillLog || d.drillLog.length === 0) return false;
            var age = daysSince(d.drillLog[0].date);
            return age !== null && age > 30 && age <= 90;
        },
    },
];

// ── State helpers ──────────────────────────────────────────────────────

function isDismissed(id) {
    return !!localStorage.getItem(REC_DISMISS_PREFIX + id);
}

function isSnoozed(id) {
    var ts = localStorage.getItem(REC_SNOOZE_PREFIX + id);
    if (!ts) return false;
    return Date.now() < parseInt(ts, 10);
}

function dismissRec(id) {
    localStorage.setItem(REC_DISMISS_PREFIX + id, '1');
}

function snoozeRec(id) {
    var until = Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(REC_SNOOZE_PREFIX + id, String(until));
}

function clearRecState(id) {
    localStorage.removeItem(REC_DISMISS_PREFIX + id);
    localStorage.removeItem(REC_SNOOZE_PREFIX + id);
}

// ── Main API ───────────────────────────────────────────────────────────

// Build the data object for recommendation conditions.
// Pass the same data used for readiness scoring.
function buildRecData(items, prep, pb, meds, checklistPct, drillLog, profile) {
    return {
        items:        items        || [],
        prep:         prep         || { food_days: 0, water_days: 0 },
        pb:           pb           || null,
        meds:         meds         || { total: 0, critical: 0, low: 0 },
        radio:        loadRadio    ? loadRadio()  : { frequencies: [], contacts: [] },
        mesh:         loadMesh     ? loadMesh()   : { nodes: [] },
        checklistPct: checklistPct || 0,
        drillLog:     drillLog     || [],
        profile:      profile      || {},
    };
}

// Returns active recommendations sorted by priority, up to `limit`.
function getRankedRecommendations(data, limit) {
    limit = limit || 10;
    var active = RECOMMENDATION_LIBRARY.filter(function(r) {
        if (isDismissed(r.id)) return false;
        if (isSnoozed(r.id))   return false;
        try { return !!r.condition(data); } catch(e) { return false; }
    });
    active.sort(function(a, b) { return a.priority - b.priority; });
    return active.slice(0, limit);
}

// Resolve description (string or function)
function resolveDesc(r, data) {
    return typeof r.description === 'function' ? r.description(data) : r.description;
}
