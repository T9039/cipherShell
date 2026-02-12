// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("CipherShell Environment Loaded.");
    
    // --- SMART BACKGROUND LOADER ---
    fetch('/api/background?theme=catppuccin')
        .then(response => response.json())
        .then(data => {
            console.log("here")
            if (data.url) {
                // Apply to body
                console.log("here")

                document.body.style.backgroundImage = `url('${data.url}')`;
                document.body.style.backgroundSize = "cover";
                document.body.style.backgroundPosition = "center";
            }
        })
        .catch(err => console.log("Background load failed, using CSS default."));
});

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
    const sections = ['generator', 'vault', 'identity'];
    const tabs = ['tab-gen', 'tab-vault', 'tab-identity'];
    const terminalContainer = document.querySelector('.overflow-y-auto');

    // 1. Force Scroll to Top Immediately
    terminalContainer.scrollTop = 0;

    sections.forEach((sec, index) => {
        const el = document.getElementById(`section-${sec}`);
        const tabEl = document.getElementById(tabs[index]);
        
        if (sec === tabName) {
            el.classList.remove('hidden');
            tabEl.classList.add('tab-active');
            tabEl.classList.remove('tab-inactive');
            
            // 2. Focus with "preventScroll" option
            setTimeout(() => {
                if (sec === 'vault') {
                    const vInput = document.getElementById('vault-input');
                    if (vInput) vInput.focus({ preventScroll: true });
                }
                if (sec === 'identity') {
                    const rInput = document.getElementById('rsa-msg-in');
                    if (rInput) rInput.focus({ preventScroll: true });
                }
            }, 50);
            
        } else {
            el.classList.add('hidden');
            tabEl.classList.remove('tab-active');
            tabEl.classList.add('tab-inactive');
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
    const terminalContainer = document.querySelector('.overflow-y-auto');
    
    pubField.value = "Generating 2048-bit primes...";
    privField.value = "Calculating coefficients...";
    terminalContainer.scrollTop = terminalContainer.scrollHeight;

    try {
        const response = await fetch('/api/generate-keys', { method: 'POST' });
        const data = await response.json();
        
        pubField.value = data.public;
        privField.value = data.private;
        
        setTimeout(() => {
            terminalContainer.scrollTo({ top: terminalContainer.scrollHeight, behavior: 'smooth' });
        }, 100);

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

// Start the clock immediately and update every second
setInterval(updateClock, 1000);
updateClock(); // Initial call to avoid 1s delay  
