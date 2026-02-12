// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Set focus to the first meaningful element? Or just wait for user.
    console.log("CipherShell Environment Loaded.");
});

// --- KEYBOARD SHORTCUTS ---
document.addEventListener('keydown', (e) => {
    // Alt + 1 : Switch to Generator
    if (e.ctrlKey && e.key === '1') {
        switchTab('generator');
    }
    // Alt + 2 : Switch to Vault
    if (e.ctrlKey && e.key === '2') {
        switchTab('vault');
    }
    
    // Vault Specific Shortcuts
    if (!document.getElementById('section-vault').classList.contains('hidden')) {
        // Ctrl + E : Encrypt
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault(); // Prevent browser search
            processVault('encrypt');
        }
        // Ctrl + D : Decrypt
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault(); // Prevent browser bookmark
            processVault('decrypt');
        }
    }

    // Generator Specific Shortcuts
    if (!document.getElementById('section-generator').classList.contains('hidden')) {
        // F1 : Random
        if (e.key === 'F1') {
            e.preventDefault();
            generatePass('random');
        }
        // F2 : Memorable
        if (e.key === 'F2') {
            e.preventDefault();
            generatePass('memorable');
        }
    }
});


// --- TAB SWITCHING LOGIC ---
function switchTab(tabName) {
    const genSection = document.getElementById('section-generator');
    const vaultSection = document.getElementById('section-vault');
    const genTab = document.getElementById('tab-gen');
    const vaultTab = document.getElementById('tab-vault');

    if (tabName === 'generator') {
        genSection.classList.remove('hidden');
        vaultSection.classList.add('hidden');
        
        // Style Active Tab
        genTab.classList.add('tab-active');
        genTab.classList.remove('tab-inactive');
        // Style Inactive Tab
        vaultTab.classList.remove('tab-active');
        vaultTab.classList.add('tab-inactive');
        
    } else {
        genSection.classList.add('hidden');
        vaultSection.classList.remove('hidden');

        // Style Active Tab
        vaultTab.classList.add('tab-active');
        vaultTab.classList.remove('tab-inactive');
        // Style Inactive Tab
        genTab.classList.remove('tab-active');
        genTab.classList.add('tab-inactive');
        
        // Auto-focus the input line
        setTimeout(() => document.getElementById('vault-input').focus(), 50);
    }
}

// --- PASSWORD GENERATOR ---
async function generatePass(mode) {
    const outputField = document.getElementById('pass-output');
    outputField.innerText = "calculating_entropy..."; // Use innerText for span
    
    try {
        const response = await fetch('/api/generate-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: mode })
        });
        
        const data = await response.json();
        outputField.innerText = data.password;
        
    } catch (error) {
        outputField.innerText = "Error: Connection Refused.";
    }
}

// --- ENCRYPTION VAULT ---
async function processVault(action) {
    const input = document.getElementById('vault-input').value;
    const passphrase = document.getElementById('vault-pass').value;
    const resultField = document.getElementById('vault-result');
    
    // 1. SELECT THE SCROLLABLE CONTAINER
    // This matches the div in your HTML with "overflow-y-auto"
    const terminalContainer = document.querySelector('.overflow-y-auto');

    if (!input || !passphrase) {
        resultField.innerText = "[ERROR]: Input and Passphrase are mandatory.";
        terminalContainer.scrollTop = terminalContainer.scrollHeight; // Scroll to error
        return;
    }

    const endpoint = action === 'encrypt' ? '/api/encrypt' : '/api/decrypt';
    const payload = action === 'encrypt' 
        ? { message: input, passphrase: passphrase }
        : { ciphertext: input, passphrase: passphrase };

    resultField.innerText = "processing_crypto_engine...";
    
    // Scroll immediately to show processing status
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

        // --- THE SCROLL FIX ---
        // We set the scroll position (scrollTop) to the total height of the content (scrollHeight)
        // This guarantees we are at the absolute bottom.
        setTimeout(() => {
            terminalContainer.scrollTo({
                top: terminalContainer.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);

    } catch (error) {
        resultField.innerText = "[SYSTEM_HALT]: " + error;
        terminalContainer.scrollTop = terminalContainer.scrollHeight;
    }
}

// --- UTILITY ---
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    // For input/textarea use .value, for div/span use .innerText
    const text = element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' ? element.value : element.innerText;
    
    navigator.clipboard.writeText(text).then(() => {
        // Optional: Flash the element or show a toast
        console.log("Copied to buffer");
    });
}
