// --- CONFIGURATION ---
const COMMAND_HISTORY = [];
let historyIndex = -1;
let CURRENT_KEYS = { pub: null, priv: null }; // Store keys in memory for the session

// Interactive Mode State
let inputMode = null; // null | 'encrypt_msg' | 'encrypt_key' | 'decrypt_msg'
let tempStorage = {}; // Holds data between steps

const inputField = document.getElementById('cmd-input');
const passField = document.getElementById('pass-input'); // NEW
const historyContainer = document.getElementById('history');
const terminalContainer = document.getElementById('terminal-scroll-area');

// --- THEME DEFINITIONS ---
const THEMES = [
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
    // 1. Load Theme
    const savedTheme = localStorage.getItem('cipherTheme') || 'catppuccin';
    applyTheme(savedTheme);
    
    // 2. Randomize ASCII Logo [New Feature]
    if (typeof LOGOS !== 'undefined' && LOGOS.length > 0) {
        const randomLogo = LOGOS[Math.floor(Math.random() * LOGOS.length)];
        // Use textContent to safely render the raw ASCII string including whitespace
        const logoElement = document.getElementById('ascii-logo');
        if (logoElement) logoElement.textContent = randomLogo;
    }

    // 3. Focus Input
    inputField.focus();
};

// --- STATE ---
let passwordBuffer = ''; // Hidden storage for the real password

// --- EVENT LISTENERS ---
inputField.addEventListener('keydown', function(e) {
    // 1. PASSWORD MODE INTERCEPTION
    if (inputMode === 'vault_pass') {
        if (e.key === 'Enter') {
            // Let it fall through to the main Enter handler, but use the buffer
        }
        else if (e.key === 'Backspace') {
            e.preventDefault();
            passwordBuffer = passwordBuffer.slice(0, -1);
            inputField.value = inputField.value.slice(0, -1);
            return;
        }
        else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            // It's a printable character (a, b, 1, @, etc.)
            e.preventDefault();
            passwordBuffer += e.key;
            inputField.value += '*'; // Visually show asterisk
            return;
        }
        // Allow arrows, tab, etc. to function normally (or ignore them)
    }

    // 2. NORMAL HISTORY NAVIGATION (Only when NOT in password mode)
    if (e.key === 'ArrowUp' && !inputMode) {
        e.preventDefault();
        if (historyIndex > 0) { historyIndex--; inputField.value = COMMAND_HISTORY[historyIndex]; }
    } 
    else if (e.key === 'ArrowDown' && !inputMode) {
        e.preventDefault();
        if (historyIndex < COMMAND_HISTORY.length - 1) { historyIndex++; inputField.value = COMMAND_HISTORY[historyIndex]; }
        else { historyIndex = COMMAND_HISTORY.length; inputField.value = ''; }
    }
    
    // 3. ENTER KEY HANDLER
    else if (e.key === 'Enter') {
        // If in password mode, use the hidden buffer. Otherwise use the visible text.
        const finalValue = (inputMode === 'vault_pass') ? passwordBuffer : inputField.value.trim();
        
        if (inputMode) {
            handleInteractiveInput(finalValue);
        } else if (finalValue) {
            executeCommand(finalValue);
            COMMAND_HISTORY.push(finalValue);
            historyIndex = COMMAND_HISTORY.length;
        }
        
        // Reset Everything
        inputField.value = '';
        passwordBuffer = ''; // Clear the secret buffer
        scrollToBottom();
    }
});

// --- CORE LOGIC ---

function executeCommand(rawCommand) {
    // Echo the command (Riced Style)
    const promptHtml = `
        <div class="mt-2">
            <span class="text-[var(--accent2)] font-bold">~/ciphershell</span>
            <span class="text-[var(--overlay)]"> (main)</span>
            <span class="text-[var(--green)] font-bold ml-2">➜</span>
            <span class="text-[var(--text)] ml-2">${rawCommand}</span>
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
          <div class="text-[var(--text)]">
              Generate secure passwords.
              <br><span class="text-[var(--overlay)]">Usage: genpass [-r|--random] [-m|--memorable]</span>
          </div>

          <div class="text-[var(--green)] font-bold">vault</div>
          <div class="text-[var(--text)]">
              Symmetric (AES) encryption for text.
              <br><span class="text-[var(--overlay)]">Usage: vault [encrypt|decrypt] "message" -p "password"</span>
          </div>

          <div class="text-[var(--green)] font-bold">identity</div>
          <div class="text-[var(--text)]">
              Asymmetric (RSA) key management.
              <br><span class="text-[var(--overlay)]">Subcommands:</span>
              <ul class="list-disc list-inside text-[var(--overlay)]">
                  <li><span class="text-[var(--text)]">gen</span> : Generate new 2048-bit keypair</li>
                  <li><span class="text-[var(--text)]">show</span> : Display current session keys</li>
                  <li><span class="text-[var(--text)]">encrypt</span> : Encrypt message (Interactive)</li>
                  <li><span class="text-[var(--text)]">decrypt</span> : Decrypt ciphertext (Interactive)</li>
              </ul>
          </div>

          <div class="text-[var(--green)] font-bold">theme</div>
          <div class="text-[var(--text)]">
              Change the terminal visual style.
              <br><span class="text-[var(--overlay)]">Usage: theme [list | name]</span>
          </div>

          <div class="text-[var(--green)] font-bold">clear</div>
          <div class="text-[var(--text)]">Clear the terminal screen.</div>
        </div>
                    `;
                    break;

        case 'clear':
            historyContainer.innerHTML = '';
            return;

        case 'theme':
            if (args[1] === 'list') {
                // RENDER THEME LIST WITH COLORS
                let listHtml = '<div class="grid grid-cols-2 gap-2 mt-2 max-w-md">';
                THEMES.forEach(t => {
                    const color1 = t.colors[0];
                    const color2 = t.colors[1];
                    listHtml += `
                        <div class="flex items-center gap-2">
                            <div class="flex">
                                <div style="background:${color1}" class="w-3 h-3 rounded-sm"></div>
                                <div style="background:${color2}" class="w-3 h-3 rounded-sm ml-1"></div>
                            </div>
                            <span class="text-[var(--text)]">${t.id}</span>
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
            // Determine mode based on flags
            const mode = (args.includes('-m') || args.includes('--memorable')) ? 'memorable' : 'random';
            
            appendToHistory(`<div class="ml-4 info-msg">Generating ${mode} password...</div>`);

            // CHANGED: Now using POST to match @app.route("/api/generate-password", methods=["POST"])
            fetch('/api/generate-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: mode })
            })
            .then(res => res.json())
            .then(data => {
                appendToHistory(`<div class="ml-4 success-msg">✔ Password Generated:</div>`);
                appendToHistory(`<div class="ml-4 text-[var(--text)] border border-[var(--green)]/30 p-2 select-all bg-[var(--crust)]/50 font-mono text-lg">${data.password}</div>`);
                scrollToBottom();
            })
            .catch(err => {
                appendToHistory(`<div class="ml-4 error-msg">✘ Error generating password.</div>`);
            });
            break;

        case 'vault':
            const vAction = args[1];
            if (vAction === 'encrypt' || vAction === 'decrypt') {
                // Store the action for later
                tempStorage.vaultAction = vAction;
                
                // Start Interactive Mode
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
                        appendToHistory(`<div class="success-msg">✔ Keys generated and loaded into session.</div>`);
                        appendToHistory(`<div class="text-[var(--overlay)] text-xs mt-2">Use 'identity show' to view them.</div>`);
                    });
                return; // Async handling
            } 
            else if (sub === 'show') {
                if (!CURRENT_KEYS.pub) output = `<span class="error-msg">No keys in session. Run 'identity gen' first.</span>`;
                else {
                    output = `
<div class="text-[var(--green)] mb-1">PUBLIC KEY:</div>
<div class="text-[var(--overlay)] text-[10px] break-all border border-[var(--overlay)]/30 p-2 mb-2">${CURRENT_KEYS.pub}</div>
<div class="text-[var(--red)] mb-1">PRIVATE KEY:</div>
<div class="text-[var(--overlay)] text-[10px] break-all border border-[var(--overlay)]/30 p-2 blur-[2px] hover:blur-0 transition-all">${CURRENT_KEYS.priv}</div>
                    `;
                }
            }
            else if (sub === 'encrypt') {
                // START INTERACTIVE MODE
                inputMode = 'encrypt_msg';
                output = `<span class="text-[var(--accent2)]">Enter message to encrypt:</span>`;
            }
            else if (sub === 'decrypt') {
                if (!CURRENT_KEYS.priv) {
                    output = `<span class="error-msg">✘ No Private Key loaded. Run 'identity gen' first.</span>`;
                } else {
                    inputMode = 'decrypt_msg';
                    output = `<span class="text-[var(--accent2)]">Paste ciphertext to decrypt:</span>`;
                }
            }
            else {
                output = `Usage: identity [gen | show | encrypt | decrypt]`;
            }
            break;

        default:
            output = `<span class="error-msg">✘ Command not found: ${cmd}</span>`;
    }

    if (output) appendToHistory(`<div class="ml-4">${output}</div>`);
}

// --- UPDATED INTERACTIVE HANDLER ---
function handleInteractiveInput(value) {
    // 1. Echo logic
    let displayValue = value;
    
    // If we just finished typing a password, show asterisks in the log
    if (inputMode === 'vault_pass') {
        displayValue = '*'.repeat(value.length); 
    }
    
    appendToHistory(`<div class="ml-4 text-[var(--overlay)] mb-2">➜ ${displayValue}</div>`);

    // --- VAULT FLOW ---
    if (inputMode === 'vault_msg') {
        tempStorage.vaultMsg = value;
        
        // SWITCH TO PASSWORD MODE
        inputMode = 'vault_pass';
        passwordBuffer = ''; // Reset buffer
        inputField.value = ''; // Ensure field is empty for masking
        
        appendToHistory(`<div class="ml-4 text-[var(--red)]">Enter Passphrase:</div>`);
    }
    else if (inputMode === 'vault_pass') {
        const password = value; // This 'value' comes from our hidden passwordBuffer
        
        performVault(tempStorage.vaultAction, tempStorage.vaultMsg, password);
        
        inputMode = null;
        passwordBuffer = '';
    }

    // --- RSA FLOW (Existing) ---
    else if (inputMode === 'encrypt_msg') {
        tempStorage.msg = value;
        inputMode = 'encrypt_key';
        appendToHistory(`<div class="ml-4 text-[var(--accent2)]">Paste Recipient Public Key (or type 'my'):</div>`);
    } 
    else if (inputMode === 'encrypt_key') {
        let keyToUse = value;
        if (value === 'my') {
            if (!CURRENT_KEYS.pub) {
                appendToHistory(`<div class="ml-4 error-msg">✘ No generated key found.</div>`);
                inputMode = null; return;
            }
            keyToUse = CURRENT_KEYS.pub;
        }
        performCrypto('encrypt', tempStorage.msg, keyToUse);
        inputMode = null;
    }
    else if (inputMode === 'decrypt_msg') {
        performCrypto('decrypt', value, CURRENT_KEYS.priv);
        inputMode = null;
    }
}

// --- CRYPTO API CALLER (Adapted for existing app.py endpoints) ---
function performCrypto(action, text, key) {
    const isEncrypt = action === 'encrypt';
    const endpoint = isEncrypt ? '/api/rsa-encrypt' : '/api/rsa-decrypt';
    
    // Construct payload based on your existing API requirements
    const payload = isEncrypt 
        ? { message: text, public_key: key }
        : { ciphertext: text, private_key: key };

    appendToHistory(`<div class="ml-4 info-msg">Processing ${action}...</div>`);
    
    fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            appendToHistory(`<div class="ml-4 error-msg">✘ Error: ${data.error}</div>`);
        } else {
            appendToHistory(`<div class="ml-4 success-msg">✔ Result:</div>`);
            // Display result in a nice box
            appendToHistory(`<div class="ml-4 text-[var(--text)] break-all border border-[var(--green)]/30 p-2 bg-[var(--crust)]/50 font-mono text-xs select-all">${data.result}</div>`);
        }
        scrollToBottom();
    })
    .catch(err => {
        appendToHistory(`<div class="ml-4 error-msg">✘ Server Error: Connection failed.</div>`);
        console.error(err);
    });
}

// --- VAULT (AES) API CALLER ---
function performVault(action, text, password) {
    const isEncrypt = action === 'encrypt';
    const endpoint = isEncrypt ? '/api/encrypt' : '/api/decrypt';
    
    // MATCHING YOUR BACKEND CODE EXACTLY:
    // Encrypt expects: { message, passphrase }
    // Decrypt expects: { ciphertext, passphrase }
    const payload = isEncrypt
        ? { message: text, passphrase: password }
        : { ciphertext: text, passphrase: password };

    appendToHistory(`<div class="ml-4 info-msg">Processing AES-${action}...</div>`);

    fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            appendToHistory(`<div class="ml-4 error-msg">✘ Error: ${data.error}</div>`);
        } else if (data.result && data.result.includes("Error:")) {
             // Handle the "Error: Could not decrypt" response from your python try/except
            appendToHistory(`<div class="ml-4 error-msg">✘ ${data.result}</div>`);
        } else {
            appendToHistory(`<div class="ml-4 success-msg">✔ Result:</div>`);
            // Selectable Result Box
            appendToHistory(`<div class="ml-4 text-[var(--text)] break-all border border-[var(--accent2)]/30 p-2 bg-[var(--crust)]/50 font-mono text-xs select-all">${data.result}</div>`);
        }
        scrollToBottom();
    })
    .catch(err => {
        appendToHistory(`<div class="ml-4 error-msg">✘ Server Error.</div>`);
    });
}

// --- HELPERS ---
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
    fetch(`/api/background?theme=${themeId}`)
        .then(res => res.json())
        .then(data => {
            if(data.url) document.body.style.backgroundImage = `url('${data.url}')`;
        });
}
