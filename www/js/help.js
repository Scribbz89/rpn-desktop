// RPN Field Brain — Page help content

const PAGE_HELP = {
    home: {
        title: 'Home Screen',
        content: `<p>Your dashboard — everything at a glance.</p>

        <p><strong>The four readiness cards</strong></p>
        <ul>
            <li><strong>Days Food</strong> — How many days your current food stockpile would feed your household. Green = 14+ days, amber = 3–13 days, red = under 3 days.</li>
            <li><strong>Days Water</strong> — How many days your stored water would last. Green = 7+ days, amber = 2–6 days, red = under 2 days. The app uses 2 litres per adult per day.</li>
            <li><strong>Stored Power</strong> — Total energy stored across your power banks, batteries and solar (in watt-hours). Updates from your stockpile.</li>
            <li><strong>Lists Done</strong> — What percentage of your checklist items you have ticked off across all lists.</li>
        </ul>

        <p><strong>Your prep journey</strong></p>
        <ul>
            <li>Shows your progress toward 72 hours, 1 week and 1 month of preparedness.</li>
            <li>The active milestone glows green — work toward it, then the next one unlocks.</li>
            <li>72 hours is the first goal. Most emergencies resolve within 3 days.</li>
        </ul>

        <p><strong>Action items</strong></p>
        <ul>
            <li>Things that need your attention — items expiring soon, stockpile not yet checked, water not tracked, etc.</li>
            <li>Tap an item to go to the relevant section. Tap Done to clear it.</li>
        </ul>

        <p><strong>Emergency button</strong></p>
        <ul>
            <li>Tap <em>! EMERGENCY — WHAT DO I DO?</em> to open the Scenario Engine immediately.</li>
            <li>This gives you step-by-step guidance for common emergencies — power cuts, flooding, shelter-in-place and more.</li>
        </ul>`
    },

    stockpile: {
        title: 'Stockpile',
        content: `<p>Track everything you have stored for emergencies — food, water, medical supplies, power and more.</p>

        <p><strong>Adding items</strong></p>
        <ul>
            <li>Tap <strong>+ Add Item</strong> at the bottom of any category.</li>
            <li>Choose a category, give the item a name, and fill in the details that apply.</li>
            <li>For food: enter the weight in grams and select the food type so the app can estimate calories.</li>
            <li>For water: enter weight in grams (1 litre = 1000g). This feeds the Days Water counter on the home screen.</li>
            <li>For power: enter the stored energy in Wh (watt-hours), or use Ah + Voltage and the app converts it for you.</li>
        </ul>

        <p><strong>Status colours</strong></p>
        <ul>
            <li><span style="color:#6dbf5a;">Green dot</span> — All good</li>
            <li><span style="color:#d4a017;">Amber dot</span> — Expiring within 90 days, or flagged as low</li>
            <li><span style="color:#c0392b;">Red dot</span> — Expired, or critically low</li>
        </ul>

        <p><strong>Editing and deleting</strong></p>
        <ul>
            <li>Each item has an <strong>Edit</strong> and <strong>Del</strong> button. Tap them directly — do not swipe.</li>
        </ul>

        <p><strong>Power Budget tab</strong></p>
        <ul>
            <li>Switch to Power Budget to see how long your stored energy will last given your daily device usage.</li>
            <li>Add each device you use, enter hours per day, and the app shows total runtime.</li>
            <li>The big number at the top ("~6 days of power") is the key result. Tap "See the numbers" for the detail.</li>
        </ul>

        <p><strong>Stock Check</strong></p>
        <ul>
            <li>Tap <strong>Do a stock check</strong> to confirm your stockpile is up to date. This clears the action item on the home screen.</li>
        </ul>`
    },

    checklists: {
        title: 'Checklists',
        content: `<p>Pre-built preparedness checklists covering the essential things to have ready before an emergency.</p>

        <p><strong>How to use them</strong></p>
        <ul>
            <li>Tap a checklist to open it, then tick each item as you acquire or complete it.</li>
            <li>Your progress is saved on your device — you can leave and come back.</li>
            <li>Aim to get every list to 100% over time. Start with the highest priority ones.</li>
        </ul>

        <p><strong>What each checklist covers</strong></p>
        <ul>
            <li><strong>72-Hour Home Kit</strong> — The basics to survive 3 days at home with no power, water or shops. Start here.</li>
            <li><strong>Everyday Carry Bag (EDC)</strong> — Small items you carry on you every day. If something happens away from home, these are what you have.</li>
            <li><strong>Go-Bag (Bug-Out Bag)</strong> — A packed bag ready to grab if you need to leave home quickly. Think 72 hours of supplies in a rucksack.</li>
            <li><strong>Vehicle Kit</strong> — Things to keep in your car for breakdowns, weather or emergencies on the road.</li>
            <li><strong>Water Storage &amp; Purification</strong> — How to store water and make unsafe water drinkable.</li>
            <li><strong>Documents &amp; Important Papers</strong> — Copies of IDs, insurance, prescriptions and contacts you may need in a crisis.</li>
            <li><strong>Communications</strong> — Radios, chargers and ways to stay in contact when mobile networks go down.</li>
            <li><strong>Medical &amp; First Aid</strong> — First aid kit contents, medications and basic medical readiness.</li>
        </ul>

        <p style="color:#7a8f78;font-size:12px;">Tip: The 72-Hour Home Kit is the best place to start if you are new to prepping.</p>`
    },

    scenarios: {
        title: 'Scenario Engine',
        content: `<p>Step-by-step guides that walk you through what to do in an emergency — designed to work offline when you need them most.</p>

        <p><strong>How it works</strong></p>
        <ul>
            <li>Choose a scenario that matches your situation.</li>
            <li>Answer simple questions and the app guides you through the recommended actions in order.</li>
            <li>You can go back to any step or restart at any time.</li>
        </ul>

        <p><strong>Scenarios available</strong></p>
        <ul>
            <li><strong>Power Cut</strong> — What to do in the first minutes, hours and days of a power outage.</li>
            <li><strong>Flooding</strong> — Shelter-in-place vs evacuation decisions, protecting your home, where to go.</li>
            <li><strong>Severe Weather</strong> — Storm preparation, staying safe, aftermath steps.</li>
            <li><strong>Shelter in Place</strong> — When you need to stay home and seal it against outside threats.</li>
            <li><strong>Evacuation</strong> — How to leave quickly and safely with your household.</li>
            <li><strong>Medical Emergency</strong> — First steps before help arrives, when to call 999.</li>
            <li><strong>Communications Down</strong> — How to communicate when phones and internet fail.</li>
        </ul>

        <p style="color:#7a8f78;font-size:12px;">These guides are for reference only and are not a substitute for professional training. Always call 999 in a life-threatening emergency.</p>`
    },

    knowledge: {
        title: 'Knowledge Base',
        content: `<p>A library of reference articles covering preparedness, first aid, radio and survival — all available offline.</p>

        <p><strong>Topics covered</strong></p>
        <ul>
            <li><strong>First Aid</strong> — Bleeding, burns, fractures, CPR, choking, hypothermia and more.</li>
            <li><strong>Water</strong> — How to store water, purification methods (boiling, tablets, filters), signs of dehydration.</li>
            <li><strong>Food &amp; Cooking</strong> — Off-grid cooking, food storage, preserving food without refrigeration.</li>
            <li><strong>Shelter &amp; Warmth</strong> — Keeping warm without heating, improvised shelter, fire safety.</li>
            <li><strong>Radio &amp; Communications</strong> — How to use a radio, emergency frequencies, phonetic alphabet, basic operating.</li>
            <li><strong>Navigation</strong> — Map reading, compass use, finding your position without GPS.</li>
            <li><strong>Security &amp; Awareness</strong> — Situational awareness, protecting your home, community cooperation.</li>
            <li><strong>Mental Resilience</strong> — Staying calm under pressure, looking after your household's mental health in a crisis.</li>
        </ul>

        <p><strong>How to use it</strong></p>
        <ul>
            <li>Browse by category or use the search bar to find a specific topic.</li>
            <li>Articles are stored on your device — no internet needed.</li>
            <li>Read articles now so you are familiar with them before you need them.</li>
        </ul>`
    },

    drills: {
        title: 'Drills',
        content: `<p>Timed practice runs for emergency procedures. Knowing what to do is not the same as being able to do it quickly — drills build the habit.</p>

        <p><strong>How drills work</strong></p>
        <ul>
            <li>Choose a drill and tap Start. A timer runs while you complete the steps.</li>
            <li>Your time is recorded each attempt so you can track improvement.</li>
            <li>Repeat drills regularly — monthly is a good target for your core ones.</li>
        </ul>

        <p><strong>Drills available</strong></p>
        <ul>
            <li><strong>72-Hour Pack Check</strong> — Go through your go-bag and confirm everything is present and in date.</li>
            <li><strong>Power Cut Response</strong> — Run through your first 30 minutes of a power outage from memory.</li>
            <li><strong>Evacuation Drill</strong> — Time how long it takes your household to be ready to leave with bags packed.</li>
            <li><strong>Fire Escape</strong> — Walk every member of your household through the escape routes from each room.</li>
            <li><strong>First Aid Refresher</strong> — Step through the basics: ABCs, CPR, bleeding control.</li>
            <li><strong>Radio Check</strong> — Power up, tune to your emergency frequency and make contact.</li>
        </ul>

        <p style="color:#7a8f78;font-size:12px;">Tip: Do an evacuation drill with your whole household at least twice a year. Children especially benefit from practising it.</p>`
    },

    map: {
        title: 'Map',
        content: `<p>A personal and community map — drop pins for important locations and see other RPN members near you.</p>

        <p><strong>Your private pins</strong></p>
        <ul>
            <li><strong>+ Pin</strong> — Drop a marker anywhere on the map. Use it for rally points, water sources, caches, hazards or anything useful.</li>
            <li>Pins are stored on your device. Only you can see them unless you share them with a group.</li>
            <li>Tap any pin to see its details or edit it.</li>
        </ul>

        <p><strong>Community features (requires account)</strong></p>
        <ul>
            <li><strong>Member locations</strong> — See other RPN members who have shared their location. Blue dot = you, green = other members.</li>
            <li><strong>+ Rep</strong> — Add a radio repeater to the shared map so other members know it exists.</li>
            <li><strong>MeshCore Network</strong> — Toggle to load live MeshCore nodes from around the world.</li>
        </ul>

        <p><strong>Controls</strong></p>
        <ul>
            <li><strong>List</strong> — View and jump to any of your saved pins.</li>
            <li><strong>Filters</strong> — Show or hide different map layers (members, repeaters, mesh nodes, pins).</li>
            <li><strong>Offline</strong> — Download the map tiles for your local area so the map works with no internet.</li>
            <li><strong>Search</strong> — Find a place, member or pin by name.</li>
        </ul>`
    },

    logbook: {
        title: 'Logbook',
        content: `<p>A radio contact log (also called a QSO log). Every time you make a radio contact, log it here.</p>

        <p><strong>What is a QSO?</strong> A QSO is a two-way radio contact — you spoke to someone and they replied. It's the standard term used by radio operators.</p>

        <p><strong>Logging a contact</strong></p>
        <ul>
            <li>Tap <strong>Log a Contact</strong> and fill in the callsign, frequency, mode (FM, SSB, DMR etc.) and signal report.</li>
            <li>RST is the signal report format — Readability (1–5), Strength (1–9), Tone (1–9). A common report is 59 (perfect voice) or 599 (perfect CW).</li>
            <li>Add notes about the contact — what was discussed, location, antenna used, etc.</li>
        </ul>

        <p><strong>RPN-linked contacts</strong></p>
        <ul>
            <li><strong>RPN Member search</strong> — If the other station is an RPN member, search by callsign to link their profile to the log entry.</li>
            <li><strong>Request Live Map</strong> — Ask the other station to share their live location on the community map during the contact.</li>
            <li><strong>Broadcast on Map</strong> — Make this contact visible on the community map so other members can see it happening.</li>
        </ul>

        <p style="color:#7a8f78;font-size:12px;">Your logbook is saved on your device and syncs to RPN when you are connected.</p>`
    },

    more: {
        title: 'More',
        content: `<p>Additional tools and reference material.</p>
        <ul>
            <li><strong>Radio Reference</strong> — Frequency bands, modes and operating guides for licensed and unlicensed radio. Use this to find the right frequency for your situation.</li>
            <li><strong>Mesh Guide</strong> — Introduction to MeshCore mesh radio networks — what they are, how to set one up, and how they link into RPN.</li>
            <li><strong>Household</strong> — Set up your household profile: number of people, calorie and water needs, emergency contacts and meeting points. The stockpile uses this to calculate your days of food and water.</li>
            <li><strong>Community</strong> — Access your RPN profile, contacts, groups and community map.</li>
            <li><strong>Noticeboard</strong> — Announcements from RPN and your local community managers.</li>
            <li><strong>Export / Backup</strong> — Download a copy of your stockpile, logbook and settings so you don't lose your data.</li>
        </ul>`
    },

    radio: {
        title: 'Radio Reference',
        content: `<p>A quick-reference guide for radio operating — useful whether you are licensed or just getting started.</p>
        <ul>
            <li><strong>Frequency bands</strong> — HF (long range, international), VHF (local, line of sight), UHF (short range, urban). Know which band to use for which situation.</li>
            <li><strong>Modes explained</strong> — FM (clear voice, local), SSB (longer range voice), DMR (digital, repeater-linked), FT8 (weak signal data). Each has its place.</li>
            <li><strong>Emergency frequencies</strong> — The channels monitored by emergency services and amateur operators. Know these before you need them.</li>
            <li><strong>Phonetic alphabet</strong> — Alpha, Bravo, Charlie... Used to spell callsigns and important words clearly over a noisy channel.</li>
            <li><strong>Q-codes</strong> — Shorthand used on radio: QTH = my location, QSL = confirmed, QRM = interference. Common ones listed with plain English meanings.</li>
            <li><strong>Logging a contact</strong> — What information to record and why it matters.</li>
        </ul>
        <p style="color:#7a8f78;font-size:12px;">Available offline at all times.</p>`
    },

    mesh: {
        title: 'Mesh Guide',
        content: `<p>MeshCore is a system that lets small radio devices form a network — messages hop from device to device without needing the internet or phone signal.</p>

        <p><strong>Why it matters for preppers</strong></p>
        <ul>
            <li>If the internet and mobile network go down, a mesh network lets your group stay in contact over radio.</li>
            <li>Each MeshCore node extends the range — the more nodes, the bigger the network.</li>
            <li>Works completely off-grid.</li>
        </ul>

        <p><strong>Getting started</strong></p>
        <ul>
            <li>You need a MeshCore-compatible device (such as a Heltec or LILYGO LoRa board).</li>
            <li>Flash the MeshCore firmware, set your callsign, and you are on the network.</li>
            <li>Link your node to RPN Field Brain so it appears on the community map.</li>
        </ul>

        <p><strong>On the map</strong></p>
        <ul>
            <li>Toggle the MeshCore layer on the Map screen to see live nodes reported worldwide.</li>
            <li>Tap any node to see its callsign, last heard time and location.</li>
        </ul>`
    },

    household: {
        title: 'Household',
        content: `<p>Your household profile powers the preparedness calculations across the whole app. Set it up once and the numbers update automatically.</p>

        <p><strong>What to fill in</strong></p>
        <ul>
            <li><strong>Number of adults and children</strong> — The app uses this to calculate daily food and water needs.</li>
            <li><strong>Calorie targets</strong> — Defaults are 2,000 cal/day for adults and 1,000 for children. Adjust if you have higher needs (active adults, teenagers).</li>
            <li><strong>Water targets</strong> — Default is 2 litres per adult per day (drinking only). In hot weather or physical activity, this should be higher.</li>
            <li><strong>Pets</strong> — Add pets so the app can track pet food alongside your supplies.</li>
        </ul>

        <p><strong>Emergency planning</strong></p>
        <ul>
            <li><strong>Meeting points</strong> — Where does your household meet if you cannot get home? Set a primary and backup location.</li>
            <li><strong>Evacuation routes</strong> — Note your planned routes out of your area.</li>
            <li><strong>Emergency contacts</strong> — People outside your household who are your first call in a crisis.</li>
            <li><strong>Special needs</strong> — Any medications, mobility needs or dietary requirements that affect your planning.</li>
        </ul>

        <p style="color:#7a8f78;font-size:12px;">All data stays on your device. Nothing is shared without your consent.</p>`
    },

    noticeboard: {
        title: 'Noticeboard',
        content: `<p>Official announcements from RPN and your local community managers.</p>
        <ul>
            <li>Check here for network news, alerts and updates from RPN.</li>
            <li>Pinned announcements appear at the top and stay visible until removed by an admin.</li>
            <li>You will get a push notification on your phone when a new announcement is posted — make sure notifications are enabled for the app.</li>
            <li>If you manage a local RPN group, your community manager can post here to reach all members in your area.</li>
        </ul>`
    },

    'community-auth': {
        title: 'Community Sign In',
        content: `<p>Sign in or create a free account to access the RPN Community features.</p>
        <ul>
            <li><strong>New account</strong> — Register with your callsign (or name if you are not licensed) and a few basic details. Accounts are reviewed by an RPN admin before full access is granted.</li>
            <li><strong>Existing account</strong> — Log in with your email and password.</li>
            <li><strong>What you get</strong> — Community map, RPN callsign, contacts list, groups, logbook sync and push notifications.</li>
            <li>You do not need an account to use the offline features — stockpile, checklists, scenarios, knowledge base and map pins all work without signing in.</li>
        </ul>`
    },

    'community-profile': {
        title: 'My Profile',
        content: `<p>Your public RPN member profile — visible to other approved members.</p>
        <ul>
            <li><strong>Callsign &amp; name</strong> — Your radio callsign and display name. Keep this accurate so other members can find you.</li>
            <li><strong>Region</strong> — Your general location (county or area). Used to connect you with nearby members.</li>
            <li><strong>Radios &amp; frequencies</strong> — What radios you have and which frequencies you monitor. Other members use this to know how to reach you.</li>
            <li><strong>Location on map</strong> — Opt in to share your approximate location so you appear on the community map. You control when this is active.</li>
            <li><strong>Active hours</strong> — When you are typically monitoring. Helps members know the best time to call you.</li>
        </ul>`
    },

    'community-contacts': {
        title: 'Contacts',
        content: `<p>Your RPN member contact list — people you have connected with on the network.</p>
        <ul>
            <li><strong>Search for members</strong> — Find other RPN members by callsign or name and send a contact request.</li>
            <li><strong>Accept requests</strong> — Members can request to add you. Accept to share profile details with each other.</li>
            <li><strong>Tap a contact</strong> — See their profile, radio details and active frequencies. Useful before calling them on air.</li>
            <li><strong>Log a QSO</strong> — Quickly start a logbook entry from a contact's profile so you do not have to type their callsign manually.</li>
        </ul>`
    },

    'community-groups': {
        title: 'Groups',
        content: `<p>Private groups within RPN — useful for local nets, teams or prepper groups.</p>
        <ul>
            <li><strong>Create a group</strong> — Give it a name and invite members. You become the group admin.</li>
            <li><strong>Shared map pins</strong> — Groups can have their own map pins visible to all members of that group only.</li>
            <li><strong>Joining</strong> — Members must accept an invite — no one is added without agreeing.</li>
            <li><strong>Use cases</strong> — A local radio net, a prepper household group, a community resilience team, a training group.</li>
        </ul>`
    },

    'community-invites': {
        title: 'Invites',
        content: `<p>Pending invitations to RPN groups.</p>
        <ul>
            <li>When another member invites you to a group, it appears here.</li>
            <li><strong>Accept</strong> to join the group and see their shared pins and members.</li>
            <li><strong>Decline</strong> if you do not want to join — the group admin is not notified of your reason.</li>
        </ul>`
    },

    'community-map': {
        title: 'Community Map',
        content: `<p>A live map showing RPN members and community activity.</p>
        <ul>
            <li>See other members who have opted to share their location.</li>
            <li>View pins shared by community groups you belong to.</li>
            <li>Live contacts show active radio QSOs between members in real time.</li>
            <li>Tap any marker to see the member's callsign and basic profile.</li>
        </ul>
        <p style="color:#7a8f78;font-size:12px;">Requires an internet connection and an active RPN account.</p>`
    },

    guide: {
        title: 'Getting Started Guide',
        content: `<p>A walkthrough for new RPN Field Brain users.</p>
        <ul>
            <li>How to set up your household profile so the app calculates your food and water days correctly.</li>
            <li>How to add your first stockpile items and what to prioritise.</li>
            <li>How to work through the checklists in order of importance.</li>
            <li>How to use the Scenario Engine before an emergency so you know where to find it.</li>
            <li>How to join the RPN community and connect with members near you.</li>
        </ul>
        <p style="color:#7a8f78;font-size:12px;">Tip: Read the guide when you first install the app, then revisit it after a week once you have explored the features.</p>`
    },
};

function showPageHelp(pageId) {
    const help = PAGE_HELP[pageId];
    if (!help) return;

    let modal = document.getElementById('helpModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'helpModal';
        modal.style.cssText = 'display:none;position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,0.7);';
        modal.innerHTML = `
            <div id="helpModalSheet" style="position:absolute;bottom:0;left:0;right:0;background:#131f13;border-top:1px solid #3a5a3a;border-radius:16px 16px 0 0;padding:20px 20px 40px;max-height:80vh;overflow-y:auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                    <h2 id="helpModalTitle" style="margin:0;font-size:17px;color:#d4d9d4;"></h2>
                    <button onclick="closePageHelp()" style="background:none;border:none;color:#7a8f78;font-size:20px;cursor:pointer;padding:4px;">&#x2715;</button>
                </div>
                <div id="helpModalBody" style="font-size:13px;color:#c0c9bf;line-height:1.8;"></div>
                <style>
                    #helpModalBody ul { padding-left:18px; margin:8px 0; }
                    #helpModalBody li { margin-bottom:6px; }
                    #helpModalBody strong { color:#d4d9d4; }
                    #helpModalBody p { margin:0 0 10px; }
                </style>
            </div>`;
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closePageHelp();
        });
        document.body.appendChild(modal);
    }

    document.getElementById('helpModalTitle').textContent = help.title;
    document.getElementById('helpModalBody').innerHTML = help.content;
    modal.style.display = 'block';
}

function closePageHelp() {
    const modal = document.getElementById('helpModal');
    if (modal) modal.style.display = 'none';
}
