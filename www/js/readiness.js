// RPN Field Brain — Resilience Scoring Engine
//
// Two-pillar model:
//   Supplies Score  — physical resources (0–100%)
//   Readiness Score — capability, planning, skills, community (0–100%)
//   Overall Resilience = (Supplies + Readiness) / 2
//
// Supplies: Food 25 + Water 25 + Medical 15 + Power 20 + Comms 15 = 100
// Readiness: Planning 15 + Skills 30 + Drills 25 + Community 30  = 100

var SUPPLIES_CRITERIA = {
    food: {
        label: 'Food',
        icon: '&#127827;',
        criteria: [
            { id:'food_3day',  title:'3-day food supply',  description:'Enough food stored for every household member for 3 days.',  points:6,  check:function(d){return d.prep.food_days>=3;},  action:'Add food items to reach a 3-day supply',  route:'stockpile.html' },
            { id:'food_7day',  title:'7-day food supply',  description:'Enough food stored for every household member for 7 days.',  points:6,  check:function(d){return d.prep.food_days>=7;},  action:'Add more food to reach a 7-day supply',   route:'stockpile.html' },
            { id:'food_14day', title:'14-day food supply', description:'Enough food stored for every household member for 14 days.', points:7,  check:function(d){return d.prep.food_days>=14;}, action:'Add more food to reach a 14-day supply',  route:'stockpile.html' },
            { id:'food_30day', title:'30-day food supply', description:'Enough food stored for every household member for 30 days.', points:6,  check:function(d){return d.prep.food_days>=30;}, action:'Add more food to reach a 30-day supply',  route:'stockpile.html' },
        ],
    },
    water: {
        label: 'Water',
        icon: '&#128167;',
        criteria: [
            { id:'water_3day',  title:'3-day water supply',  description:'Enough drinking water stored for every household member for 3 days.',  points:6,  check:function(d){return d.prep.water_days>=3;},  action:'Add stored water to reach a 3-day supply',  route:'stockpile.html' },
            { id:'water_7day',  title:'7-day water supply',  description:'Enough water stored for every household member for 7 days.',  points:6,  check:function(d){return d.prep.water_days>=7;},  action:'Add more water to reach a 7-day supply',    route:'stockpile.html' },
            { id:'water_14day', title:'14-day water supply', description:'Enough water stored for every household member for 14 days.', points:7,  check:function(d){return d.prep.water_days>=14;}, action:'Add more water to reach a 14-day supply',   route:'stockpile.html' },
            { id:'water_30day', title:'30-day water supply', description:'Enough water stored for every household member for 30 days.', points:6,  check:function(d){return d.prep.water_days>=30;}, action:'Add more water to reach a 30-day supply',   route:'stockpile.html' },
        ],
    },
    medical: {
        label: 'Medical Supplies',
        icon: '&#128138;',
        criteria: [
            {
                id:'med_supplies', title:'Medical supplies in stockpile',
                description:'First aid kit, bandages, antiseptic or other medical items logged.',
                points:7,
                check:function(d){return d.items.some(function(i){return i.category==='Medical';});},
                action:'Add a first aid kit or medical supplies in Stockpile', route:'stockpile.html',
            },
            {
                id:'med_tracked', title:'Daily medications covered',
                description:'Daily medications tracked with adequate supply, or no daily medications needed.',
                points:4,
                check:function(d){
                    if(!d.meds||d.meds.dailyCount===0) return d.items.some(function(i){return i.category==='Medical';});
                    return d.meds.critical===0;
                },
                action:'Log your medications and check supply levels', route:'medications.html',
            },
            {
                id:'med_30day', title:'30-day medication supply',
                description:'All daily medications stocked to at least 30 days, or no daily medications needed.',
                points:4,
                check:function(d){
                    if(!d.meds||d.meds.dailyCount===0) return d.items.some(function(i){return i.category==='Medical';});
                    return d.meds.lowestDays!==null&&d.meds.lowestDays>=30;
                },
                action:'Stock up on medications to reach a 30-day supply', route:'medications.html',
            },
        ],
    },
    power: {
        label: 'Power',
        icon: '&#9889;',
        criteria: [
            { id:'power_any',   title:'Backup power source',       description:'A battery pack, generator or solar panel logged in Stockpile.',                 points:5, check:function(d){return d.items.some(function(i){return i.category==='Power';});}, action:'Add a battery, solar panel or generator in Stockpile', route:'stockpile.html' },
            { id:'power_100wh', title:'100Wh+ battery storage',    description:'At least 100Wh of stored battery capacity.',                                    points:5, check:function(d){return d.pb&&d.pb.totalStoredWh>=100;}, action:'Add more battery storage to reach 100Wh', route:'power.html' },
            { id:'power_500wh', title:'500Wh+ battery storage',    description:'At least 500Wh of stored battery capacity — enough for meaningful runtime.',    points:5, check:function(d){return d.pb&&d.pb.totalStoredWh>=500;}, action:'Add more battery storage to reach 500Wh', route:'power.html' },
            { id:'power_solar', title:'Solar generation capability',description:'A solar panel logged in Stockpile, able to recharge batteries.',               points:5, check:function(d){return d.pb&&d.pb.totalSolarW>0;},     action:'Add a solar panel in Stockpile', route:'stockpile.html' },
        ],
    },
    communications: {
        label: 'Communications Equipment',
        icon: '&#128251;',
        criteria: [
            {
                id:'comms_radio', title:'Radio equipment',
                description:'A handheld radio, PMR, CB or similar off-grid communications device in Stockpile or Radio Notebook.',
                points:6,
                check:function(d){
                    var hasItem=d.items.some(function(i){return i.category==='Communications';});
                    var r=d.radio;
                    var hasRadioEntry=r&&(
                        (r.equipment&&r.equipment.length>0)||
                        (r.frequencies&&r.frequencies.length>0)||
                        (r.contacts&&r.contacts.length>0)||
                        (r.nets&&r.nets.length>0)||
                        (r.notes&&r.notes.length>0)
                    );
                    return hasItem||hasRadioEntry;
                },
                action:'Add a radio or comms device in Stockpile, or log frequencies in Radio Notebook', route:'radio.html',
            },
            {
                id:'comms_ham', title:'Radio capability',
                description:'At least one radio logged in the Equipment tab of your Radio Notebook.',
                points:4,
                check:function(d){
                    return d.radio&&d.radio.equipment&&d.radio.equipment.length>0;
                },
                action:'Add your radio in the Equipment tab of Radio Notebook', route:'radio.html',
            },
            {
                id:'comms_licence', title:'Amateur radio licence',
                description:'Hold a Foundation, Intermediate, or Full amateur radio licence.',
                points:2,
                check:function(d){return _hasSkill(d,'hamlicence');},
                action:'Tick this off in your Skills assessment', route:'assessment.html?step=8',
            },
            {
                id:'comms_mesh', title:'Mesh / LoRa node',
                description:'A MeshCore or LoRa node configured — off-grid text messaging capability.',
                points:3,
                check:function(d){return d.mesh&&d.mesh.nodes&&d.mesh.nodes.length>0;},
                action:'Log a MeshCore node in More &#8594; MeshCore Network', route:'mesh.html',
            },
            {
                id:'comms_sat', title:'Satellite communicator',
                description:'Garmin inReach, Spot or similar satellite messaging device.',
                points:2,
                check:function(d){
                    var comms=d.assessAnswers&&d.assessAnswers.comms||[];
                    return comms.indexOf('sat')!==-1;
                },
                action:'Tick this off in your Comms assessment', route:'assessment.html?step=7',
            },
        ],
    },
};

var READINESS_CRITERIA = {
    planning: {
        label: 'Planning',
        icon: '&#10003;',
        criteria: [
            { id:'plan_started',  title:'Checklists started',      description:'At least one checklist item completed.',            points:5, check:function(d){return d.checklistPct>0;},  action:'Start working through your preparedness checklists', route:'checklists.html' },
            { id:'plan_half',     title:'Checklists 50% complete', description:'At least half of active checklist items completed.', points:5, check:function(d){return d.checklistPct>=50;}, action:'Continue working through your checklists',          route:'checklists.html' },
            { id:'plan_done',     title:'Checklists 80% complete', description:'At least 80% of active checklist items completed.',  points:5, check:function(d){return d.checklistPct>=80;}, action:'Complete your remaining checklist items',           route:'checklists.html' },
            { id:'plan_stocktake',title:'Stockpile audited',       description:'At least one stockpile section audited within the last 90 days.', points:5, check:function(d){return d.stocktakeRecent;}, action:'Run a stocktake on your supplies', route:'audit.html' },
        ],
    },
    skills: {
        label: 'Skills',
        icon: '&#127947;',
        criteria: [
            { id:'skill_firstaid',   title:'First aid training',          description:'Trained in CPR, bleeding control, or emergency first aid.',           points:6, check:function(d){return _hasSkill(d,'firstaid');},   action:'Tick this off in your Skills assessment', route:'assessment.html?step=8' },
            { id:'skill_radio',      title:'Radio / comms skills',        description:'Able to operate your radio and communicate effectively off-grid.',    points:6, check:function(d){return _hasSkill(d,'radio');},      action:'Tick this off in your Skills assessment', route:'assessment.html?step=8' },
            { id:'skill_navigation', title:'Navigation skills',           description:'Can navigate using a map and compass without GPS.',                   points:6, check:function(d){return _hasSkill(d,'navigation');}, action:'Tick this off in your Skills assessment', route:'assessment.html?step=8' },
            { id:'skill_fire',       title:'Fire lighting &amp; cooking', description:'Able to light a fire and cook food without mains power.',             points:6, check:function(d){return _hasSkill(d,'fire');},       action:'Tick this off in your Skills assessment', route:'assessment.html?step=8' },
            { id:'skill_water',      title:'Water purification',          description:'Knows how to make water safe to drink in the field.',                 points:6, check:function(d){return _hasSkill(d,'water');},      action:'Tick this off in your Skills assessment', route:'assessment.html?step=8' },
        ],
    },
    drills: {
        label: 'Training &amp; Drills',
        icon: '&#9654;',
        criteria: [
            {
                id:'drill_any', title:'First drill completed',
                description:'At least one preparedness drill has been run and logged.',
                points:8,
                check:function(d){return d.drillLog&&d.drillLog.length>0;},
                action:'Run your first drill', route:'drills.html',
            },
            {
                id:'drill_90days', title:'Drill within 90 days',
                description:'A drill completed within the last 90 days.',
                points:10,
                check:function(d){
                    if(!d.drillLog||d.drillLog.length===0) return false;
                    var age=daysSince(d.drillLog[0].date);
                    return age!==null&&age<=90;
                },
                action:'Run a drill — practice within the last 90 days counts', route:'drills.html',
            },
            {
                id:'drill_30days', title:'Drill within 30 days',
                description:'A drill completed within the last 30 days. Aim to practise monthly.',
                points:7,
                check:function(d){
                    if(!d.drillLog||d.drillLog.length===0) return false;
                    var age=daysSince(d.drillLog[0].date);
                    return age!==null&&age<=30;
                },
                action:'Run a drill this month', route:'drills.html',
            },
        ],
    },
    community: {
        label: 'Community',
        icon: '&#127757;',
        criteria: [
            { id:'comm_contacts', title:'Trusted contacts',         description:'People who know your emergency plan and can be reached when things go wrong.', points:8, check:function(d){return _hasCommunity(d,'contacts');}, action:'Tick this off in your Community assessment', route:'assessment.html?step=9' },
            { id:'comm_network',  title:'Local support network',    description:'Neighbours, local groups or community ties you can call on in a crisis.',       points:7, check:function(d){return _hasCommunity(d,'network');},  action:'Tick this off in your Community assessment', route:'assessment.html?step=9' },
            { id:'comm_mutual',   title:'Mutual aid group',         description:'A preparedness or mutual aid group you are part of.',                           points:8, check:function(d){return _hasCommunity(d,'mutual');},   action:'Tick this off in your Community assessment', route:'assessment.html?step=9' },
            { id:'comm_family',   title:'Nearby family or friends', description:'Family or close friends nearby who are part of your emergency plan.',           points:7, check:function(d){return _hasCommunity(d,'family');},   action:'Tick this off in your Community assessment', route:'assessment.html?step=9' },
        ],
    },
};

function _hasSkill(d, key) {
    var skills = d.assessAnswers && d.assessAnswers.skills || [];
    return skills.indexOf(key) !== -1;
}

function _hasCommunity(d, key) {
    var community = d.assessAnswers && d.assessAnswers.community || [];
    return community.indexOf(key) !== -1;
}

// Build the data object passed to all criteria checks
function buildReadinessData(items, prep, pb, meds, checklistPct, drillLog) {
    var assessAnswers;
    try { assessAnswers = JSON.parse(localStorage.getItem('rpn_assess_answers') || '{}'); }
    catch(e) { assessAnswers = {}; }

    var stocktakeRecent = false;
    try {
        var sched = JSON.parse(localStorage.getItem('rpn_stocktake_schedule') || '{}');
        var cats = Object.keys(sched);
        for (var ci = 0; ci < cats.length; ci++) {
            var s = sched[cats[ci]];
            if (s && s.lastDate) {
                var d2 = daysSince(s.lastDate);
                if (d2 !== null && d2 <= (s.frequency || 90)) { stocktakeRecent = true; break; }
            }
        }
    } catch(e) {}

    return {
        items:          items        || [],
        prep:           prep         || { food_days: 0, water_days: 0 },
        pb:             pb           || null,
        meds:           meds         || { total: 0, critical: 0, low: 0, dailyCount: 0, lowestDays: null },
        radio:          typeof loadRadio === 'function' ? loadRadio() : { frequencies: [], contacts: [], equipment: [] },
        mesh:           typeof loadMesh  === 'function' ? loadMesh()  : { nodes: [] },
        checklistPct:   checklistPct || 0,
        drillLog:       drillLog     || [],
        assessAnswers:  assessAnswers,
        stocktakeRecent: stocktakeRecent,
    };
}

function _scorePillar(criteriaObj, data) {
    return Object.keys(criteriaObj).map(function(key) {
        var cat = criteriaObj[key];
        var earned = 0;
        var possible = cat.criteria.reduce(function(s,c){return s+c.points;},0);
        var completed = [];
        var missing = [];

        cat.criteria.forEach(function(c) {
            var passed = false;
            try { passed = !!c.check(data); } catch(e) { passed = false; }
            if (passed) { earned += c.points; completed.push(c); }
            else { missing.push(c); }
        });

        return {
            id:             key,
            label:          cat.label,
            icon:           cat.icon,
            earnedPoints:   earned,
            possiblePoints: possible,
            score:          possible > 0 ? Math.round(earned/possible*100) : 0,
            completed:      completed,
            missing:        missing,
        };
    });
}

function computeSuppliesScores(data) {
    return _scorePillar(SUPPLIES_CRITERIA, data);
}

function computeReadinessScores(data) {
    return _scorePillar(READINESS_CRITERIA, data);
}

function computeResilienceScore(suppliesScores, readinessScores) {
    function pct(arr) {
        var possible = arr.reduce(function(s,c){return s+c.possiblePoints;},0);
        var earned   = arr.reduce(function(s,c){return s+c.earnedPoints;},0);
        return possible > 0 ? Math.round(earned/possible*100) : 0;
    }
    var s = pct(suppliesScores);
    var r = pct(readinessScores);
    return { supplies: s, readiness: r, overall: Math.round((s+r)/2) };
}

// Backward-compat: flat array of all categories (used by recommendations.js)
function computeCategoryScores(data) {
    return computeSuppliesScores(data).concat(computeReadinessScores(data));
}

// Backward-compat: accepts flat array or resilience object
function computeOverallScore(scoresOrResilience) {
    if (scoresOrResilience && typeof scoresOrResilience.overall === 'number') {
        return scoresOrResilience.overall;
    }
    var arr = scoresOrResilience || [];
    var possible = arr.reduce(function(s,c){return s+c.possiblePoints;},0);
    var earned   = arr.reduce(function(s,c){return s+c.earnedPoints;},0);
    return possible > 0 ? Math.round(earned/possible*100) : 0;
}
