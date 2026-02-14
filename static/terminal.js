// --- CONFIGURATION ---
const COMMAND_HISTORY = [];
let historyIndex = -1;
let CURRENT_KEYS = { pub: null, priv: null };
let inputMode = null; 
let tempStorage = {}; 

const inputField = document.getElementById('cmd-input');
const ghostField = document.getElementById('cmd-ghost'); // NEW
const historyContainer = document.getElementById('history');
const terminalContainer = document.getElementById('terminal-scroll-area');
const clockElement = document.getElementById('terminal-clock');

// --- THEME DEFINITIONS ---
const THEMES = [
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

// --- AUTOCOMPLETE CONFIGURATION ---
const SUGGESTIONS = {
    'help': [],
    'clear': [],
    'theme': ['list', 'retro', 'catppuccin', 'dracula', 'nord', 'gruvbox', 'tokyo', 'onedark', 'solarized', 'monokai', 'cyberpunk', 'matrix', 'oled'],
    'genpass': ['-r', '--random', '-m', '--memorable'],
    'vault': ['encrypt', 'decrypt'],
    'identity': ['gen', 'show', 'encrypt', 'decrypt']
};

const suggestionGrid = document.getElementById('suggestion-grid'); // NEW

// --- HELPER: Show Grid ---
function showSuggestions(options) {
    suggestionGrid.innerHTML = ''; // Clear old
    options.forEach(opt => {
        const div = document.createElement('div');
        div.className = "cursor-pointer hover:text-[var(--accent)] transition-colors";
        div.innerText = opt;
        suggestionGrid.appendChild(div);
    });
}

function clearSuggestions() {
    suggestionGrid.innerHTML = '';
}

// --- INITIALIZATION ---
window.onload = function() {
    const savedTheme = localStorage.getItem('cipherTheme') || 'retro';
    applyTheme(savedTheme);
    updateTerminalClock();

    // Animation Logic
    if (typeof LOGOS !== 'undefined' && typeof LOGO_ANIMATIONS !== 'undefined') {
        const logoElement = document.getElementById('ascii-logo');
        if (!logoElement) return;

        let logoIndex = Math.floor(Math.random() * LOGOS.length);
        logoElement.textContent = LOGOS[logoIndex];

        setInterval(() => {
            const anim = LOGO_ANIMATIONS[Math.floor(Math.random() * LOGO_ANIMATIONS.length)];
            clearAnimations(logoElement);
            logoElement.classList.add(...anim.out.split(' '));

            setTimeout(() => {
                logoIndex = (logoIndex + 1) % LOGOS.length;
                logoElement.textContent = LOGOS[logoIndex];
                logoElement.classList.remove(...anim.out.split(' '));
                logoElement.classList.add(...anim.in.split(' '));
                if (anim.name === 'flicker') setTimeout(() => logoElement.classList.remove('animate-pulse'), 1000);
            }, 1000); 
        }, 11000); 
    }
    if (typeof inputField !== 'undefined') inputField.focus();
};

// --- STATE ---
let passwordBuffer = '';

// --- GHOST TEXT LOGIC (Input Event) ---
inputField.addEventListener('input', function(e) {
    clearSuggestions();

    const val = inputField.value;
    
    // 1. Clear state if empty or interacting
    if (!val || inputMode) {
        ghostField.value = '';
        ghostField.dataset.complete = ''; // Clear stored completion
        return;
    }

    // 2. Parse Logic
    const args = val.split(' ');
    const cmd = args[0];
    const isArg = args.length > 1; 
    let match = '';

    // A. Match Command
    if (!isArg) {
        const allCmds = Object.keys(SUGGESTIONS);
        const found = allCmds.find(c => c.startsWith(cmd));
        if (found && found !== cmd) match = found;
    } 
    // B. Match Argument
    else {
        const argPrefix = args[args.length - 1]; 
        
        if (val.endsWith(' ')) {
            ghostField.value = ''; // Don't suggest if typing space
            return;
        }

        const possibleArgs = SUGGESTIONS[cmd]; 
        if (possibleArgs && argPrefix) {
            const foundArg = possibleArgs.find(a => a.startsWith(argPrefix));
            if (foundArg && foundArg !== argPrefix) {
                // Rebuild the full command string
                const base = args.slice(0, -1).join(' ');
                match = base + ' ' + foundArg;
            }
        }
    }

    // 3. Render Ghost
    if (match && match.startsWith(val)) {
        // STORE THE FULL CORRECT COMMAND FOR TAB KEY
        ghostField.dataset.complete = match;

        // Visual Trick: Fill the start with spaces so the grey text appears AFTER cursor
        const suffix = match.slice(val.length);
        const spacer = ' '.repeat(val.length);
        
        ghostField.value = spacer + suffix + ' [Tab]';
    } else {
        ghostField.value = '';
        ghostField.dataset.complete = '';
    }
});

// --- KEYDOWN LOGIC ---
inputField.addEventListener('keydown', function(e) {
    
    // 1. PASSWORD MODE INTERCEPTION
    if (inputMode === 'vault_pass') {
        if (e.key === 'Enter') { /* pass */ }
        else if (e.key === 'Backspace') {
            e.preventDefault();
            passwordBuffer = passwordBuffer.slice(0, -1);
            inputField.value = inputField.value.slice(0, -1);
            return;
        }
        else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            passwordBuffer += e.key;
            inputField.value += '*';
            return;
        }
    }

    // 2. TAB COMPLETION HANDLER
    if (e.key === 'Tab') {
        e.preventDefault(); 
        
        // Priority A: Fill Ghost Text (Inline)
        if (ghostField.value) {
            // Fix: Auto-append a space so user is ready for next argument immediately
            inputField.value = ghostField.dataset.complete + ' ';
            
            ghostField.value = '';
            ghostField.dataset.complete = '';
            return;
        }

        // Priority B: Show Suggestion Grid (Below)
        const val = inputField.value.trim();
        const args = val.split(/\s+/); 
        const cmd = args[0];
        
        // Trigger grid if we have suggestions and aren't deep in a sub-argument
        if (SUGGESTIONS[cmd] && args.length <= 2) {
            showSuggestions(SUGGESTIONS[cmd]);
        }
        
        return;
    }

    // 3. HISTORY NAV
    if (e.key === 'ArrowUp' && !inputMode) {
        e.preventDefault();
        if (historyIndex > 0) { historyIndex--; inputField.value = COMMAND_HISTORY[historyIndex]; }
        ghostField.value = ''; 
    } 
    else if (e.key === 'ArrowDown' && !inputMode) {
        e.preventDefault();
        if (historyIndex < COMMAND_HISTORY.length - 1) { historyIndex++; inputField.value = COMMAND_HISTORY[historyIndex]; }
        else { historyIndex = COMMAND_HISTORY.length; inputField.value = ''; }
        ghostField.value = ''; 
    }
    
    // 4. ENTER KEY
    else if (e.key === 'Enter') {
        ghostField.value = ''; 
        const finalValue = (inputMode === 'vault_pass') ? passwordBuffer : inputField.value.trim();
        
        if (inputMode) {
            handleInteractiveInput(finalValue);
        } else if (finalValue) {
            executeCommand(finalValue);
            COMMAND_HISTORY.push(finalValue);
            historyIndex = COMMAND_HISTORY.length;
        }
        
        inputField.value = '';
        passwordBuffer = '';
        updateTerminalClock(); 
        scrollToBottom();
    }
});

function updateTerminalClock() {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    if (clockElement) clockElement.innerText = timeStr;
}

// --- CORE LOGIC ---
function executeCommand(rawCommand) {
    const promptHtml = `
        <div class="mt-2 flex justify-between items-center">
            <div>
                <span class="text-[var(--accent2)] font-bold">~/ciphershell</span>
                <span class="text-[var(--overlay)]"> (main)</span>
                <span class="text-[var(--green)] font-bold ml-2">➜</span>
                <span class="text-[var(--text)] ml-2">${rawCommand}</span>
            </div>
        </div>`;
    appendToHistory(promptHtml);

    const args = rawCommand.split(' ');
    const cmd = args[0].toLowerCase();
    let output = '';

    switch (cmd) {
        case 'help':
            output = `
            <div class="mb-2 text-[var(--accent)] font-bold">AVAILABLE COMMANDS:</div>
            <div class="grid grid-cols-[120px_1fr] gap-x-2 gap-y-4 text-sm">
              <div class="text-[var(--green)] font-bold">genpass</div>
              <div class="text-[var(--text)]">Generate passwords.<br><span class="text-[var(--overlay)]">Usage: genpass [-r|--random] [-m|--memorable]</span></div>
              <div class="text-[var(--green)] font-bold">vault</div>
              <div class="text-[var(--text)]">Symmetric (AES) encryption.<br><span class="text-[var(--overlay)]">Usage: vault [encrypt|decrypt]</span></div>
              <div class="text-[var(--green)] font-bold">identity</div>
              <div class="text-[var(--text)]">RSA key management.<br><span class="text-[var(--overlay)]">Subcommands: gen, show, encrypt, decrypt</span></div>
              <div class="text-[var(--green)] font-bold">theme</div>
              <div class="text-[var(--text)]">Change visual style.<br><span class="text-[var(--overlay)]">Usage: theme [list | name]</span></div>
              <div class="text-[var(--green)] font-bold">clear</div><div class="text-[var(--text)]">Clear the terminal screen.</div>
            </div>`;
            break;

        case 'clear':
            historyContainer.innerHTML = '';
            return;

        case 'theme':
            if (args[1] === 'list') {
                let listHtml = '<div class="grid grid-cols-2 gap-x-6 gap-y-2 mt-2 max-w-lg">';
                THEMES.forEach(t => {
                    const c1 = t.colors[0];
                    const c2 = t.colors[1];
                    listHtml += `
                        <div class="flex items-center gap-3" data-theme="${t.id}">
                            <div class="cli-theme-icon" style="background-color: ${c1}"></div>
                            <span class="font-bold text-sm tracking-wide" style="color: ${c1}">${t.name}</span>
                            <div class="flex gap-1 ml-auto opacity-60">
                                <div style="background:${c1}" class="w-2 h-2 rounded-full"></div>
                                <div style="background:${c2}" class="w-2 h-2 rounded-full"></div>
                            </div>
                        </div>`;
                });
                listHtml += '</div>';
                output = listHtml;
            } else if (args[1]) {
                const found = THEMES.find(t => t.id === args[1]);
                if (found) {
                    applyTheme(args[1]);
                    output = `<span class="success-msg">✔ Theme switched to: ${found.name}</span>`;
                } else {
                    output = `<span class="error-msg">✘ Theme '${args[1]}' not found. Type 'theme list'.</span>`;
                }
            } else {
                output = `Usage: theme [name] OR theme list`;
            }
            break;

        case 'genpass':
            const mode = (args.includes('-m') || args.includes('--memorable')) ? 'memorable' : 'random';
            appendToHistory(`<div class="ml-4 info-msg">Generating ${mode} password...</div>`);
            fetch('/api/generate-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: mode })
            })
            .then(res => res.json())
            .then(data => {
                appendToHistory(`<div class="ml-4 success-msg">✔ Result:</div>`);
                appendToHistory(`<div class="ml-4 text-[var(--text)] border border-[var(--green)]/30 p-2 select-all bg-[var(--crust)]/50 font-mono text-lg">${data.password}</div>`);
                scrollToBottom();
            });
            break;

        case 'vault':
            const vAction = args[1];
            if (vAction === 'encrypt' || vAction === 'decrypt') {
                tempStorage.vaultAction = vAction;
                inputMode = 'vault_msg';
                output = `<span class="text-[var(--accent2)]">Enter text to ${vAction}:</span>`;
            } else {
                output = `<span class="error-msg">Usage: vault [encrypt | decrypt]</span>`;
            }
            break;

        case 'identity':
            const sub = args[1];
            if (sub === 'gen') {
                appendToHistory(`<div class="info-msg">Generating 2048-bit RSA keypair...</div>`);
                fetch('/api/generate-keys', { method: 'POST' })
                    .then(res => res.json())
                    .then(data => {
                        CURRENT_KEYS.pub = data.public;
                        CURRENT_KEYS.priv = data.private;
                        appendToHistory(`<div class="success-msg">✔ Keys loaded into session.</div>`);
                    });
                return;
            } else if (sub === 'show') {
                if (!CURRENT_KEYS.pub) output = `<span class="error-msg">No keys in session.</span>`;
                else output = `<div class="text-[var(--green)]">PUB:</div><div class="text-[var(--overlay)] text-[10px] break-all border border-[var(--overlay)]/30 p-2 mb-2">${CURRENT_KEYS.pub}</div><div class="text-[var(--red)]">PRIV:</div><div class="text-[var(--overlay)] text-[10px] break-all border border-[var(--overlay)]/30 p-2 blur-[2px] hover:blur-0">${CURRENT_KEYS.priv}</div>`;
            } else if (sub === 'encrypt') {
                inputMode = 'encrypt_msg';
                output = `<span class="text-[var(--accent2)]">Enter message:</span>`;
            } else if (sub === 'decrypt') {
                if (!CURRENT_KEYS.priv) output = `<span class="error-msg">✘ No Private Key loaded.</span>`;
                else {
                    inputMode = 'decrypt_msg';
                    output = `<span class="text-[var(--accent2)]">Paste ciphertext:</span>`;
                }
            } else {
                output = `Usage: identity [gen | show | encrypt | decrypt]`;
            }
            break;

        default:
            output = `<span class="error-msg">✘ Command not found: ${cmd}</span>`;
    }

    if (output) appendToHistory(`<div class="ml-4">${output}</div>`);
}

function handleInteractiveInput(value) {
    let displayValue = value;
    if (inputMode === 'vault_pass') displayValue = '*'.repeat(value.length);
    appendToHistory(`<div class="ml-4 text-[var(--overlay)] mb-2">➜ ${displayValue}</div>`);

    if (inputMode === 'vault_msg') {
        tempStorage.vaultMsg = value;
        inputMode = 'vault_pass';
        passwordBuffer = ''; 
        inputField.value = '';
        appendToHistory(`<div class="ml-4 text-[var(--red)]">Enter Passphrase:</div>`);
    } else if (inputMode === 'vault_pass') {
        performVault(tempStorage.vaultAction, tempStorage.vaultMsg, value);
        inputMode = null;
        passwordBuffer = '';
    } else if (inputMode === 'encrypt_msg') {
        tempStorage.msg = value;
        inputMode = 'encrypt_key';
        appendToHistory(`<div class="ml-4 text-[var(--accent2)]">Paste Public Key (or 'my'):</div>`);
    } else if (inputMode === 'encrypt_key') {
        let keyToUse = (value === 'my') ? CURRENT_KEYS.pub : value;
        if (!keyToUse) { appendToHistory(`<div class="ml-4 error-msg">✘ No key found.</div>`); inputMode = null; return; }
        performCrypto('encrypt', tempStorage.msg, keyToUse);
        inputMode = null;
    } else if (inputMode === 'decrypt_msg') {
        performCrypto('decrypt', value, CURRENT_KEYS.priv);
        inputMode = null;
    }
}

function performCrypto(action, text, key) {
    const isEncrypt = action === 'encrypt';
    const endpoint = isEncrypt ? '/api/rsa-encrypt' : '/api/rsa-decrypt';
    const payload = isEncrypt ? { message: text, public_key: key } : { ciphertext: text, private_key: key };
    
    appendToHistory(`<div class="ml-4 info-msg">Processing...</div>`);
    fetch(endpoint, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)})
    .then(res => res.json())
    .then(data => {
        if(data.error) appendToHistory(`<div class="ml-4 error-msg">✘ ${data.error}</div>`);
        else appendToHistory(`<div class="ml-4 text-[var(--text)] break-all border border-[var(--green)]/30 p-2 bg-[var(--crust)]/50 font-mono text-xs select-all">${data.result}</div>`);
        scrollToBottom();
    });
}

function performVault(action, text, password) {
    const isEncrypt = action === 'encrypt';
    const endpoint = isEncrypt ? '/api/encrypt' : '/api/decrypt';
    const payload = isEncrypt ? { message: text, passphrase: password } : { ciphertext: text, passphrase: password };
    
    appendToHistory(`<div class="ml-4 info-msg">Processing...</div>`);
    fetch(endpoint, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)})
    .then(res => res.json())
    .then(data => {
        if(data.error) appendToHistory(`<div class="ml-4 error-msg">✘ ${data.error}</div>`);
        else if (data.result && data.result.includes("Error:")) appendToHistory(`<div class="ml-4 error-msg">✘ ${data.result}</div>`);
        else appendToHistory(`<div class="ml-4 text-[var(--text)] break-all border border-[var(--accent2)]/30 p-2 bg-[var(--crust)]/50 font-mono text-xs select-all">${data.result}</div>`);
        scrollToBottom();
    });
}

function appendToHistory(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    historyContainer.appendChild(div);
    scrollToBottom();
}

function scrollToBottom() {
    terminalContainer.scrollTop = terminalContainer.scrollHeight;
}

function applyTheme(themeId) {
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('cipherTheme', themeId);
    fetch(`/api/background?theme=${themeId}`).then(res => res.json()).then(data => {
        if(data.url) document.body.style.backgroundImage = `url('${data.url}')`;
    });
}
