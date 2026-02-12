// --- KEYBOARD SHORTCUTS (The Brains) ---
document.addEventListener('keydown', (e) => {
    
    // 1. GLOBAL NAVIGATION (Ctrl + Shift + 1/2/3)
    if (e.ctrlKey && e.shiftKey) {
        // We use e.code because "Shift+1" makes e.key equal "!", not "1"
        if (e.code === 'Digit1') {
            e.preventDefault();
            switchTab('generator');
        }
        if (e.code === 'Digit2') {
            e.preventDefault();
            switchTab('vault');
        }
        if (e.code === 'Digit3') {
            e.preventDefault();
            switchTab('identity');
        }
    }

    // 2. VAULT SHORTCUTS
    if (!document.getElementById('section-vault').classList.contains('hidden')) {
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            processVault('encrypt');
        }
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            processVault('decrypt');
        }
    }

    // 3. IDENTITY SHORTCUTS
    if (!document.getElementById('section-identity').classList.contains('hidden')) {
        // Ctrl + G : Generate Keys
        if (e.ctrlKey && e.key === 'g') {
            e.preventDefault();
            generateIdentity();
        }
        // Ctrl + E : Encrypt RSA
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault(); 
            processRSA('encrypt');
        }
        // Ctrl + D : Decrypt RSA
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault(); 
            processRSA('decrypt');
        }
    }

    // 4. GENERATOR SHORTCUTS
    if (!document.getElementById('section-generator').classList.contains('hidden')) {
        if (e.key === 'F1') {
            e.preventDefault();
            generatePass('random');
        }
        if (e.key === 'F2') {
            e.preventDefault();
            generatePass('memorable');
        }
    }
});


// --- TAB SWITCHING LOGIC ---
function switchTab(tabName) {
    // 1. Hide all content sections
    ['generator', 'vault', 'identity'].forEach(t => {
        document.getElementById(`section-${t}`).classList.add('hidden');
    });

    // 2. Show selected content
    document.getElementById(`section-${tabName}`).classList.remove('hidden');

    // 3. Update DESKTOP Tabs (Bottom)
    const desktopTabs = {
        'generator': 'tab-gen',
        'vault': 'tab-vault',
        'identity': 'tab-identity'
    };

    Object.keys(desktopTabs).forEach(t => {
        const el = document.getElementById(desktopTabs[t]);
        if (t === tabName) {
            // Active Desktop Style
            el.classList.remove('tab-inactive');
            el.classList.add('tab-active');
        } else {
            // Inactive Desktop Style
            el.classList.remove('tab-active');
            el.classList.add('tab-inactive');
        }
    });

    // 4. Update MOBILE Tabs (Top - Windows Terminal Style)
    const mobileTabs = {
        'generator': 'mob-tab-gen',
        'vault': 'mob-tab-vault',
        'identity': 'mob-tab-identity'
    };

    Object.keys(mobileTabs).forEach(t => {
        const el = document.getElementById(mobileTabs[t]);
        if (t === tabName) {
            // ACTIVE: Use var(--accent) for background and var(--base) for text
            el.className = "flex-1 py-2 text-center text-xs font-bold rounded-t-lg cursor-pointer transition-all border-t border-l border-r border-[var(--overlay)]/50 bg-[var(--accent)] text-[var(--base)] translate-y-[1px]";
        } else {
            // INACTIVE: Use var(--overlay) for text and var(--crust) for background
            el.className = "flex-1 py-2 text-center text-xs font-bold rounded-t-lg cursor-pointer transition-all border-t border-l border-r border-transparent text-[var(--overlay)] hover:bg-[var(--overlay)] bg-[var(--crust)]/50";
        }
    });
} 

// --- PASSWORD GENERATOR ---
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
        
        // Scroll fix
        const terminalContainer = document.querySelector('.overflow-y-auto');
        terminalContainer.scrollTop = terminalContainer.scrollHeight;

    } catch (error) {
        outputField.innerText = "Error: Connection Refused.";
    }
}

// --- SYMMETRIC VAULT (AES) ---
async function processVault(action) {
    const input = document.getElementById('vault-input').value;
    const passphrase = document.getElementById('vault-pass').value;
    const resultField = document.getElementById('vault-result');
    const terminalContainer = document.querySelector('.overflow-y-auto');

    if (!input || !passphrase) {
        resultField.innerText = "[ERROR]: Input and Passphrase are mandatory.";
        terminalContainer.scrollTop = terminalContainer.scrollHeight;
        return;
    }

    const endpoint = action === 'encrypt' ? '/api/encrypt' : '/api/decrypt';
    const payload = action === 'encrypt' 
        ? { message: input, passphrase: passphrase }
        : { ciphertext: input, passphrase: passphrase };

    resultField.innerText = "processing_crypto_engine...";
    terminalContainer.scrollTop = terminalContainer.scrollHeight;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.error) {
            resultField.innerText = "[ERROR]: " + data.error;
        } else if (data.result === undefined) {
             resultField.innerText = "[FAIL]: Integrity check failed. Wrong key?";
        } else {
            resultField.innerText = data.result;
        }

        setTimeout(() => {
            terminalContainer.scrollTo({ top: terminalContainer.scrollHeight, behavior: 'smooth' });
        }, 100);

    } catch (error) {
        resultField.innerText = "[SYSTEM_HALT]: " + error;
        terminalContainer.scrollTop = terminalContainer.scrollHeight;
    }
}

// --- ASYMMETRIC IDENTITY (RSA) ---
async function generateIdentity() {
    const pubField = document.getElementById('rsa-public');
    const privField = document.getElementById('rsa-private');
    
    pubField.value = "Generating 2048-bit primes...";
    privField.value = "Calculating coefficients...";

    try {
        const response = await fetch('/api/generate-keys', { method: 'POST' });
        const data = await response.json();
        
        pubField.value = data.public;
        privField.value = data.private;
        
        // setTimeout(() => {
            // 2. THE Fix: Smart Scroll
            // Instead of scrolling to the bottom, we target the PUBLIC KEY box.
            const target = document.getElementById('rsa-public');
            
            // "center": Tries to put the element in the middle of the screen.
            // "smooth": Glides there instead of jumping.
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // }, 100);

    } catch (error) {
        pubField.value = "Error: Keygen failed.";
    }
}

async function processRSA(action) {
    const resultField = document.getElementById('rsa-result');
    const terminalContainer = document.querySelector('.overflow-y-auto');
    
    let payload = {};
    let endpoint = '';

    if (action === 'encrypt') {
        const msg = document.getElementById('rsa-msg-in').value;
        const key = document.getElementById('rsa-remote-key').value;
        if (!msg || !key) {
            resultField.innerText = "[ERROR]: Message and Remote Key required.";
            terminalContainer.scrollTop = terminalContainer.scrollHeight;
            return;
        }
        endpoint = '/api/rsa-encrypt';
        payload = { message: msg, public_key: key };
    } else {
        const cipher = document.getElementById('rsa-cipher-in').value;
        const myPrivKey = document.getElementById('rsa-private').value;
        
        if (!myPrivKey) {
            resultField.innerText = "[ERROR]: You must Generate or Paste your Private Key first.";
            terminalContainer.scrollTop = terminalContainer.scrollHeight;
            return;
        }
        if (!cipher) {
             resultField.innerText = "[ERROR]: No ciphertext provided.";
             terminalContainer.scrollTop = terminalContainer.scrollHeight;
             return;
        }

        endpoint = '/api/rsa-decrypt';
        payload = { ciphertext: cipher, private_key: myPrivKey };
    }

    resultField.innerText = "processing_rsa_block...";
    terminalContainer.scrollTop = terminalContainer.scrollHeight;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.error) {
            resultField.innerText = "[ERROR]: " + data.error;
        } else {
            resultField.innerText = data.result;
        }

        setTimeout(() => {
            terminalContainer.scrollTo({ top: terminalContainer.scrollHeight, behavior: 'smooth' });
        }, 100);

    } catch (error) {
        resultField.innerText = "[SYSTEM_HALT]: " + error;
    }
}

// --- UTILITY ---
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' ? element.value : element.innerText;
    
    navigator.clipboard.writeText(text).then(() => {
        console.log("Copied to buffer");
    });
}

// --- CLOCK & STATUS BAR ---
function updateClock() {
    const now = new Date();
    
    // Arrays for formatting
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Extract parts
    const dayName = days[now.getDay()];
    const dayNum = now.getDate();
    const monthName = months[now.getMonth()];
    
    // Time with leading zeros
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    // Construct String: "Thu 12 Feb 14:30"
    const timeString = `${dayName} ${dayNum} ${monthName} ${hours}:${minutes}`;
    
    // Update DOM
    const clockEl = document.getElementById('clock-display');
    if (clockEl) {
        clockEl.innerText = timeString;
    }
}

// --- THEME SYSTEM ---

const themes = [
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
    { id: 'oled', name: 'OLED Midnight', colors: ['#bb9af7', '#0db9d7'] }
];

// 1. Initialize Theme on Load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('cipherTheme') || 'catppuccin';
    applyTheme(savedTheme);
    buildThemeMenu();
});

// 2. Toggle Menu Visibility
function toggleThemeMenu() {
    const menu = document.getElementById('theme-menu');
    menu.classList.toggle('hidden');
}

// 3. Build the Menu (Fastfetch Style)
function buildThemeMenu() {
    const container = document.querySelector('#theme-menu > div');
    container.innerHTML = ''; // Clear existing

    themes.forEach(theme => {
        const btn = document.createElement('button');
        btn.className = "w-full text-left px-4 py-2 hover:bg-[var(--overlay)]/20 flex items-center justify-between group transition-colors";
        btn.onclick = () => {
            applyTheme(theme.id);
            toggleThemeMenu();
        };

        // Name
        const nameSpan = document.createElement('span');
        nameSpan.className = "text-xs font-bold text-[var(--text)] group-hover:text-[var(--accent)]";
        nameSpan.innerText = theme.name;

        // Color Blocks (Fastfetch style)
        const blockContainer = document.createElement('div');
        blockContainer.className = "flex gap-1";
        
        theme.colors.forEach(color => {
            const block = document.createElement('div');
            block.className = "w-3 h-3 rounded-sm";
            block.style.backgroundColor = color;
            blockContainer.appendChild(block);
        });

        btn.appendChild(nameSpan);
        btn.appendChild(blockContainer);
        container.appendChild(btn);
    });
}

// 4. Apply Theme Logic
function applyTheme(themeId) {
    // Set the data-theme attribute for CSS
    document.documentElement.setAttribute('data-theme', themeId);
    
    // Save to local storage for next visit
    localStorage.setItem('cipherTheme', themeId);
    
    // Update the UI label
    const themeObj = themes.find(t => t.id === themeId);
    if(themeObj) {
        document.getElementById('current-theme-label').innerText = themeObj.name;
    }
    
    // FETCH BACKGROUND: Now handled centrally here
    updateBackground(themeId);
}

// 5. Modified Background Fetcher
function updateBackground(themeId) {
    fetch(`/api/background?theme=${themeId}`)
        .then(res => res.json())
        .then(data => {
            if(data.url) {
                document.body.style.backgroundImage = `url('${data.url}')`;
            }
        });
}


// --- INITIALIZATION ---
// Definition: The "Boot Sequence"
function initializeApp() {
    // 1. Start System Clock
    updateClock();
    setInterval(updateClock, 1000);

    // 2. Initialize Theme System
    const savedTheme = localStorage.getItem('cipherTheme') || 'catppuccin';
    
    // 3. Apply the Theme & Fetch Background
    applyTheme(savedTheme); 
    
    // 4. Build the UI Menu
    buildThemeMenu();

    console.log(`CipherShell Initialized: ${savedTheme} mode active.`);
}

initializeApp();
