// --- TAB SWITCHING LOGIC ---
function switchTab(tabName) {
    const genSection = document.getElementById('section-generator');
    const vaultSection = document.getElementById('section-vault');
    const genTab = document.getElementById('tab-gen');
    const vaultTab = document.getElementById('tab-vault');

    if (tabName === 'generator') {
        genSection.classList.remove('hidden');
        vaultSection.classList.add('hidden');
        
        // Active Styling
        genTab.classList.add('bg-green-900/20', 'font-bold', 'border-r');
        vaultTab.classList.remove('bg-green-900/20', 'font-bold', 'border-r');
    } else {
        genSection.classList.add('hidden');
        vaultSection.classList.remove('hidden');

        // Active Styling
        vaultTab.classList.add('bg-green-900/20', 'font-bold', 'border-l');
        genTab.classList.remove('bg-green-900/20', 'font-bold', 'border-r');
    }
}

// --- PASSWORD GENERATOR LOGIC ---
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

// --- ENCRYPTION/DECRYPTION LOGIC ---
async function processVault(action) {
    const input = document.getElementById('vault-input').value;
    const passphrase = document.getElementById('vault-pass').value;
    const resultField = document.getElementById('vault-result');

    if (!input || !passphrase) {
        resultField.value = "Error: Input and Passphrase are required.";
        return;
    }

    // Determine Endpoint
    const endpoint = action === 'encrypt' ? '/api/encrypt' : '/api/decrypt';
    
    // Prepare Data
    const payload = action === 'encrypt' 
        ? { message: input, passphrase: passphrase }
        : { ciphertext: input, passphrase: passphrase };

    resultField.value = "Processing crypto operations...";

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.error) {
            resultField.value = "Error: " + data.error;
        } else if (data.result === undefined) {
             // Fallback for generic errors
             resultField.value = "Error: Operation Failed. Check passphrase.";
        } else {
            resultField.value = data.result;
        }

    } catch (error) {
        resultField.value = "System Error: " + error;
    }
}

// --- UTILITY: COPY TO CLIPBOARD ---
function copyToClipboard(elementId) {
    const copyText = document.getElementById(elementId);
    copyText.select();
    copyText.setSelectionRange(0, 99999); // For mobile devices
    navigator.clipboard.writeText(copyText.value);
    
    // Brief visual feedback could go here
    alert("Copied to clipboard!");
}
