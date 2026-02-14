// --- THEME SYSTEM ---
const themes = [
    { id: 'retro',      name: 'Retro Green',colors: ['#22c55e', '#16a34a'] },
    { id: 'catppuccin', name: 'Catppuccin', colors: ['#cba6f7', '#89b4fa'] },
    { id: 'dracula',    name: 'Dracula',    colors: ['#ff79c6', '#bd93f9'] },
    { id: 'nord',       name: 'Nord',       colors: ['#88c0d0', '#81a1c1'] },
    { id: 'gruvbox',    name: 'Gruvbox',    colors: ['#d79921', '#fe8019'] },
    { id: 'tokyo',      name: 'Tokyo Night',colors: ['#7aa2f7', '#bb9af7'] },
    { id: 'onedark',    name: 'One Dark',   colors: ['#61afef', '#c678dd'] },
    { id: 'solarized',  name: 'Solarized',  colors: ['#268bd2', '#b58900'] },
    { id: 'monokai',    name: 'Monokai',    colors: ['#a6e22e', '#f92672'] },
    { id: 'cyberpunk',  name: 'Cyberpunk',  colors: ['#fcee0a', '#00ff9f'] },
    { id: 'matrix',     name: 'Matrix',     colors: ['#00ff41', '#008f11'] },
    { id: 'oled',       name: 'OLED Midnight', colors: ['#bb9af7', '#0db9d7'] }
];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('cipherTheme') || 'retro';
    applyTheme(savedTheme);
    buildThemeMenu();

    // Start Extras
    updateClock();
    setInterval(updateClock, 1000);
    startLogoAnimation();
});

// --- ASCII ANIMATION ENGINE ---
function startLogoAnimation() {
    if (typeof LOGOS === 'undefined' || typeof LOGO_ANIMATIONS === 'undefined') return;

    const logoElement = document.getElementById('ascii-logo');
    if (!logoElement) return;

    let logoIndex = Math.floor(Math.random() * LOGOS.length);
    
    // Initial Render
    logoElement.textContent = LOGOS[logoIndex];
    logoElement.style.opacity = '1';

    setInterval(() => {
        const anim = LOGO_ANIMATIONS[Math.floor(Math.random() * LOGO_ANIMATIONS.length)];
        
        // 1. Clear Old & Animate OUT
        clearAnimations(logoElement);
        logoElement.classList.add(...anim.out.split(' '));

        setTimeout(() => {
            // 2. Swap Content
            logoIndex = (logoIndex + 1) % LOGOS.length;
            logoElement.textContent = LOGOS[logoIndex];
            
            // 3. Animate IN
            logoElement.classList.remove(...anim.out.split(' '));
            logoElement.classList.add(...anim.in.split(' '));
            
            if (anim.name === 'flicker') {
                setTimeout(() => logoElement.classList.remove('animate-pulse'), 1000);
            }
        }, 1000);

    }, 8000);
}

// --- CLOCK (Format: Sat 14 Feb 08:00) ---
function updateClock() {
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[now.getDay()];
    const dayNum = now.getDate();
    const monthName = months[now.getMonth()];
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const timeString = `${dayName} ${dayNum} ${monthName} ${hours}:${minutes}`;
    
    const clockEl = document.getElementById('clock-display');
    if (clockEl) clockEl.innerText = timeString;
}

// --- THEME LOGIC ---
function toggleThemeMenu(suffix = '') {
    const id = suffix ? `theme-menu-${suffix}` : 'theme-menu';
    const menu = document.getElementById(id);
    menu.classList.toggle('hidden');
}


function buildThemeMenu() {
    // Target both Desktop and Mobile menus
    const containers = ['theme-menu', 'theme-menu-mob'];
    
    containers.forEach(containerId => {
        // Find the inner div that holds the buttons
        const parent = document.querySelector(`#${containerId} > div`);
        if (!parent) return;
        
        parent.innerHTML = ''; 

        themes.forEach(theme => {
            const btn = document.createElement('button');
            
            // 1. Set the data-theme attribute on the button so it can access that theme's variables!
            btn.setAttribute('data-theme', theme.id);
            
            btn.className = "w-full text-left px-4 py-2 hover:bg-[var(--overlay)] flex items-center justify-between group transition-colors";
            btn.onclick = () => {
                applyTheme(theme.id);
                toggleThemeMenu(containerId.includes('mob') ? 'mob' : '');
            };

            // LEFT SIDE: Icon + Name
            const leftContainer = document.createElement('div');
            leftContainer.className = "flex items-center gap-3";

            // The Icon (Uses CSS Variable from the button's data-theme)
            const iconDiv = document.createElement('div');
            iconDiv.className = "theme-icon w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity";
            // Important: Force the background to be the text color of the current theme so it's visible in the dropdown
            iconDiv.style.backgroundColor = "var(--text)"; 

            const nameSpan = document.createElement('span');
            nameSpan.className = "text-[10px] font-bold text-[var(--text)] uppercase tracking-wide";
            nameSpan.innerText = theme.name;

            leftContainer.appendChild(iconDiv);
            leftContainer.appendChild(nameSpan);

            // RIGHT SIDE: Color Swatches
            const rightContainer = document.createElement('div');
            rightContainer.className = "flex gap-1";
            theme.colors.forEach(color => {
                const block = document.createElement('div');
                block.className = "w-2 h-2 rounded-full"; // Changed to rounded-full for cleaner look
                block.style.backgroundColor = color;
                rightContainer.appendChild(block);
            });

            btn.appendChild(leftContainer);
            btn.appendChild(rightContainer);
            parent.appendChild(btn);
        });
    });
}

function applyTheme(themeId) {
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('cipherTheme', themeId);
    
    const themeObj = themes.find(t => t.id === themeId);
    if(themeObj) {
        if(document.getElementById('current-theme-label'))
            document.getElementById('current-theme-label').innerText = themeObj.name;
        if(document.getElementById('current-theme-label-mob'))
            document.getElementById('current-theme-label-mob').innerText = themeObj.name;
    }
    
    updateBackground(themeId);
}

function updateBackground(themeId) {
    if (themeId === 'retro') {
        document.body.style.backgroundImage = 'none';
        return;
    }
    fetch(`/api/background?theme=${themeId}`)
        .then(res => res.json())
        .then(data => {
            if(data.url) document.body.style.backgroundImage = `url('${data.url}')`;
        })
        .catch(console.error);
}

// --- KEYBOARD SHORTCUTS ---
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey) {
        if (e.code === 'Digit1') { e.preventDefault(); switchTab('generator'); }
        if (e.code === 'Digit2') { e.preventDefault(); switchTab('vault'); }
        if (e.code === 'Digit3') { e.preventDefault(); switchTab('identity'); }
    }
    if (!document.getElementById('section-vault').classList.contains('hidden')) {
        if (e.ctrlKey && e.key === 'e') { e.preventDefault(); processVault('encrypt'); }
        if (e.ctrlKey && e.key === 'd') { e.preventDefault(); processVault('decrypt'); }
    }
    if (!document.getElementById('section-identity').classList.contains('hidden')) {
        if (e.ctrlKey && e.key === 'g') { e.preventDefault(); generateIdentity(); }
        if (e.ctrlKey && e.key === 'e') { e.preventDefault(); processRSA('encrypt'); }
        if (e.ctrlKey && e.key === 'd') { e.preventDefault(); processRSA('decrypt'); }
    }
    if (!document.getElementById('section-generator').classList.contains('hidden')) {
        if (e.key === 'F1') { e.preventDefault(); generatePass('random'); }
        if (e.key === 'F2') { e.preventDefault(); generatePass('memorable'); }
    }
});

// --- TAB SWITCHING ---
function switchTab(tabName) {
    ['generator', 'vault', 'identity'].forEach(t => {
        document.getElementById(`section-${t}`).classList.add('hidden');
    });

    document.getElementById(`section-${tabName}`).classList.remove('hidden');

    const desktopTabs = { 'generator': 'tab-gen', 'vault': 'tab-vault', 'identity': 'tab-identity' };
    Object.keys(desktopTabs).forEach(t => {
        const el = document.getElementById(desktopTabs[t]);
        if (t === tabName) { el.classList.remove('tab-inactive'); el.classList.add('tab-active'); } 
        else { el.classList.remove('tab-active'); el.classList.add('tab-inactive'); }
    });

    const mobileTabs = { 'generator': 'mob-tab-gen', 'vault': 'mob-tab-vault', 'identity': 'mob-tab-identity' };
    Object.keys(mobileTabs).forEach(t => {
        const el = document.getElementById(mobileTabs[t]);
        if (t === tabName) {
            el.className = "flex-1 py-2 text-center text-xs font-bold rounded-t-lg cursor-pointer transition-all border-t border-l border-r border-[var(--overlay)]/50 bg-[var(--accent)] text-[var(--base)] translate-y-[1px]";
        } else {
            el.className = "flex-1 py-2 text-center text-xs font-bold rounded-t-lg cursor-pointer transition-all border-t border-l border-r border-transparent text-[var(--overlay)] hover:bg-[var(--overlay)] bg-[var(--crust)]/50";
        }
    });
}

// --- LOGIC FUNCTIONS ---
async function generatePass(mode) {
    const outputField = document.getElementById('pass-output');
    outputField.innerText = "calculating_entropy..."; 
    try {
        const response = await fetch('/api/generate-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: mode })
        });
        const data = await response.json();
        outputField.innerText = data.password;
        // Smart Scroll
        setTimeout(() => outputField.scrollIntoView({behavior: "smooth", block: "center"}), 100);
    } catch (error) { outputField.innerText = "Error: Connection Refused."; }
}

async function processVault(action) {
    const input = document.getElementById('vault-input').value;
    const passphrase = document.getElementById('vault-pass').value;
    const resultField = document.getElementById('vault-result');
    if (!input || !passphrase) {
        resultField.innerText = "[ERROR]: Input and Passphrase are mandatory.";
        return;
    }
    const endpoint = action === 'encrypt' ? '/api/encrypt' : '/api/decrypt';
    const payload = action === 'encrypt' ? { message: input, passphrase: passphrase } : { ciphertext: input, passphrase: passphrase };
    resultField.innerText = "processing_crypto_engine...";
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.error) resultField.innerText = "[ERROR]: " + data.error;
        else if (data.result === undefined) resultField.innerText = "[FAIL]: Integrity check failed.";
        else resultField.innerText = data.result;
        setTimeout(() => resultField.scrollIntoView({behavior: "smooth", block: "center"}), 100);
    } catch (error) { resultField.innerText = "[SYSTEM_HALT]: " + error; }
}

async function generateIdentity() {
    const pubField = document.getElementById('rsa-public');
    const privField = document.getElementById('rsa-private');
    pubField.value = "Generating..."; privField.value = "Calculating...";
    try {
        const response = await fetch('/api/generate-keys', { method: 'POST' });
        const data = await response.json();
        pubField.value = data.public; privField.value = data.private;
        setTimeout(() => pubField.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    } catch (error) { pubField.value = "Error: Keygen failed."; }
}

async function processRSA(action) {
    const resultField = document.getElementById('rsa-result');
    let payload = {}; let endpoint = '';
    if (action === 'encrypt') {
        const msg = document.getElementById('rsa-msg-in').value;
        const key = document.getElementById('rsa-remote-key').value;
        if (!msg || !key) { resultField.innerText = "[ERROR]: Args missing."; return; }
        endpoint = '/api/rsa-encrypt'; payload = { message: msg, public_key: key };
    } else {
        const cipher = document.getElementById('rsa-cipher-in').value;
        const myPrivKey = document.getElementById('rsa-private').value;
        if (!myPrivKey || !cipher) { resultField.innerText = "[ERROR]: Args missing."; return; }
        endpoint = '/api/rsa-decrypt'; payload = { ciphertext: cipher, private_key: myPrivKey };
    }
    resultField.innerText = "processing_rsa_block...";
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.error) resultField.innerText = "[ERROR]: " + data.error;
        else resultField.innerText = data.result;
        setTimeout(() => resultField.scrollIntoView({behavior: "smooth", block: "center"}), 100);
    } catch (error) { resultField.innerText = "[SYSTEM_HALT]: " + error; }
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' ? element.value : element.innerText;
    navigator.clipboard.writeText(text);
}
