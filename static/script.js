// --- THEME CONFIGURATION ---
const themes = [
    { id: 'retro',      name: 'retro green',colors: ['#22c55e', '#16a34a'] },
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
window.onload = function() {
    // 1. Theme Init
    const saved = localStorage.getItem('cipherTheme') || 'retro';
    applyTheme(saved);
    buildThemeMenu();

    // 2. Start ASCII Animation (Only runs if elements exist)
    startLogoAnimation();
};

// --- LOGO ANIMATION ENGINE ---
function startLogoAnimation() {
    // Safety Check: Ensure libraries loaded
    if (typeof LOGOS === 'undefined' || typeof LOGO_ANIMATIONS === 'undefined') return;

    const logoElement = document.getElementById('ascii-logo');
    if (!logoElement) return;

    let logoIndex = Math.floor(Math.random() * LOGOS.length);
    
    // Set Initial State
    logoElement.textContent = LOGOS[logoIndex];
    logoElement.style.opacity = '1';

    setInterval(() => {
        // 1. Pick Random Animation
        const anim = LOGO_ANIMATIONS[Math.floor(Math.random() * LOGO_ANIMATIONS.length)];
        
        // 2. Animate OUT
        clearAnimations(logoElement);
        logoElement.classList.add(...anim.out.split(' '));

        setTimeout(() => {
            // 3. Swap Content
            logoIndex = (logoIndex + 1) % LOGOS.length;
            logoElement.textContent = LOGOS[logoIndex];
            
            // 4. Animate IN
            logoElement.classList.remove(...anim.out.split(' '));
            logoElement.classList.add(...anim.in.split(' '));
            
            // Cleanup pulse effect
            if (anim.name === 'flicker') {
                setTimeout(() => logoElement.classList.remove('animate-pulse'), 1000);
            }
        }, 1000); // 1s transition time

    }, 8000); // 7s hold + 1s transition
}

// --- THEME LOGIC ---
function toggleThemeMenu() {
    document.getElementById('theme-menu').classList.toggle('hidden');
}

function buildThemeMenu() {
    const menu = document.getElementById('theme-menu');
    menu.innerHTML = '';
    
    themes.forEach(t => {
        const btn = document.createElement('button');
        btn.className = "w-full text-left px-3 py-2 hover:bg-[var(--accent)] hover:text-[var(--base)] flex items-center justify-between text-xs font-bold transition-colors border-b border-[var(--overlay)]/30 last:border-0";
        
        btn.innerHTML = `
            <span>${t.name}</span>
            <div class="flex gap-1">
                <div class="w-2 h-2 rounded-full" style="background:${t.colors[0]}"></div>
                <div class="w-2 h-2 rounded-full" style="background:${t.colors[1]}"></div>
            </div>
        `;
        
        btn.onclick = () => { 
            applyTheme(t.id); 
            toggleThemeMenu(); 
        };
        menu.appendChild(btn);
    });
}

function applyTheme(themeId) {
    // 1. Set Attribute for CSS Variables
    document.documentElement.setAttribute('data-theme', themeId);
    
    // 2. Save Preference
    localStorage.setItem('cipherTheme', themeId);
    
    // 3. Update Label
    const themeObj = themes.find(t => t.id === themeId);
    if(themeObj) {
        const label = document.getElementById('current-theme-label');
        if(label) label.innerText = themeObj.name.toUpperCase();
    }

    // 4. Update Background Image (New Logic)
    updateBackground(themeId);
}

// --- BACKGROUND FETCHER ---
function updateBackground(themeId) {
    // If 'retro', remove background image to keep it clean/black
    if (themeId === 'retro') {
        document.body.style.backgroundImage = 'none';
        return;
    }

    fetch(`/api/background?theme=${themeId}`)
        .then(res => res.json())
        .then(data => {
            if(data.url) {
                document.body.style.backgroundImage = `url('${data.url}')`;
                document.body.style.backgroundSize = "cover";
                document.body.style.backgroundPosition = "center";
                document.body.style.backgroundRepeat = "no-repeat";
                document.body.style.backgroundAttachment = "fixed"; // Parallax effect
            }
        })
        .catch(err => console.error("Background fetch failed:", err));
}

// --- TAB SWITCHING LOGIC ---
function switchTab(tabName) {
    const sections = ['section-generator', 'section-vault', 'section-identity'];
    const tabs = ['tab-gen', 'tab-vault', 'tab-identity'];

    sections.forEach(id => document.getElementById(id).classList.add('hidden'));
    
    // Reset tabs
    tabs.forEach(id => {
        const el = document.getElementById(id);
        el.className = "flex-1 py-3 text-center hover:bg-[var(--base)] transition-colors border-r border-[var(--overlay)] text-[var(--overlay)]";
    });

    // Active tab
    if (tabName === 'generator') {
        document.getElementById('section-generator').classList.remove('hidden');
        document.getElementById('tab-gen').className = "flex-1 py-3 text-center transition-colors border-r border-[var(--overlay)] font-bold text-[var(--text)] bg-[var(--base)]";
    } 
    else if (tabName === 'vault') {
        document.getElementById('section-vault').classList.remove('hidden');
        document.getElementById('tab-vault').className = "flex-1 py-3 text-center transition-colors border-r border-l border-[var(--overlay)] font-bold text-[var(--text)] bg-[var(--base)]";
    }
    else if (tabName === 'identity') {
        document.getElementById('section-identity').classList.remove('hidden');
        document.getElementById('tab-identity').className = "flex-1 py-3 text-center transition-colors border-l border-[var(--overlay)] font-bold text-[var(--text)] bg-[var(--base)]";
    }
}

// --- PASSWORD GENERATOR ---
async function generatePass(mode) {
    const outputField = document.getElementById('pass-output');
    outputField.value = "Generating entropy...";
    
    try {
        const response = await fetch('/api/generate-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: mode })
        });
        const data = await response.json();
        outputField.value = data.password;
    } catch (error) {
        outputField.value = "Error: Connection Refused.";
    }
}

// --- VAULT (AES) LOGIC ---
async function processVault(action) {
    const input = document.getElementById('vault-input').value;
    const passphrase = document.getElementById('vault-pass').value;
    const resultField = document.getElementById('vault-result');

    if (!input || !passphrase) {
        resultField.value = "Error: Input and Passphrase required.";
        return;
    }

    const endpoint = action === 'encrypt' ? '/api/encrypt' : '/api/decrypt';
    const payload = action === 'encrypt' 
        ? { message: input, passphrase: passphrase }
        : { ciphertext: input, passphrase: passphrase };

    resultField.value = "Processing AES operations...";

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        
        if (data.error) resultField.value = "Error: " + data.error;
        else if (data.result === undefined) resultField.value = "Error: Operation Failed.";
        else resultField.value = data.result;
    } catch (error) {
        resultField.value = "System Error: " + error;
    }
}

// --- IDENTITY (RSA) LOGIC ---
async function generateRSAKeys() {
    const pubField = document.getElementById('rsa-pub');
    const privField = document.getElementById('rsa-priv');
    
    pubField.value = "Generating...";
    privField.value = "Generating...";

    try {
        const response = await fetch('/api/generate-keys', { method: 'POST' });
        const data = await response.json();
        
        pubField.value = data.public;
        privField.value = data.private;
    } catch (error) {
        pubField.value = "Error generating keys.";
        privField.value = "";
    }
}

function useGeneratedKey(type) {
    const sourceId = type === 'pub' ? 'rsa-pub' : 'rsa-priv';
    const val = document.getElementById(sourceId).value;
    
    if(val && !val.includes("Generating") && !val.includes("Error")) {
        document.getElementById('rsa-key-input').value = val;
    } else {
        alert("No key generated yet!");
    }
}

async function processRSA(action) {
    const input = document.getElementById('rsa-input').value;
    const key = document.getElementById('rsa-key-input').value;
    const resultField = document.getElementById('rsa-result');

    if (!input || !key) {
        resultField.value = "Error: Message and Key required.";
        return;
    }

    const endpoint = action === 'encrypt' ? '/api/rsa-encrypt' : '/api/rsa-decrypt';
    const payload = action === 'encrypt'
        ? { message: input, public_key: key }
        : { ciphertext: input, private_key: key };

    resultField.value = "Processing RSA operations...";

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (data.error) resultField.value = "Error: " + data.error;
        else resultField.value = data.result;
    } catch (error) {
        resultField.value = "System Error: " + error;
    }
}

// --- UTILITY ---
function copyToClipboard(elementId) {
    const copyText = document.getElementById(elementId);
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(copyText.value);
    
    const btn = copyText.nextElementSibling;
    if(btn) {
        const originalText = btn.innerText;
        btn.innerText = "[COPIED!]";
        setTimeout(() => btn.innerText = originalText, 2000);
    }
}
