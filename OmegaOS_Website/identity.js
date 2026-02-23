// Omega Identity Manager UI
let currentWindowId = null;

// Web mode: Avalanche Fuji (same addresses as identity-manager.js)
const WEB_CHAIN_ID = 43113;
const WEB_RPC = 'https://api.avax-test.network/ext/bc/C/rpc';
const WEB_IDENTITY_ADDRESS = '0x93932a1608910f50Ac2bC8A9B8A7183010a93e01';
const WEB_LICENSING_ADDRESS = '0x67DDb9eDAF5CBc94e6ab08988FaF1b8CE16256dc';
const WEB_STORAGE_KEY = 'omega_web_identity';
const IDENTITY_ABI = [
    'function registerIdentity(string omegaId, string deviceFingerprint) external',
    'function hasIdentity(address wallet) view returns (bool)',
    'function getIdentity(address wallet) view returns (string omegaId, string deviceFingerprint, uint256 createdAt, bool exists)'
];
const LICENSING_ABI = [
    'function hasActiveLicense(string omegaId) view returns (bool hasLicense, uint8 licenseType, uint256 expiryTime)',
    'function getLicense(string omegaId) view returns (uint8 licenseType, uint256 stakedAmount, uint256 purchaseAmount, uint256 startTime, uint256 expiryTime, bool isActive)',
    'function stakingAmount() view returns (uint256)',
    'function purchaseAmount() view returns (uint256)',
    'function stakeForLicense(string omegaId) payable',
    'function purchaseLicense(string omegaId) payable',
    'function withdrawStake(string omegaId)'
];

// Detect if we're running in Electron (desktop app) or plain browser (web version)
function isElectron() {
    return typeof window.electronAPI === 'object' &&
           window.electronAPI &&
           typeof window.electronAPI.identityInitialize === 'function' &&
           typeof window.electronAPI.identityHasIdentity === 'function';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Get window ID
    if (window.electronAPI) {
        window.electronAPI.onWindowId((windowId) => {
            currentWindowId = windowId;
        });
    }

    // Window Controls
    document.getElementById('minimizeBtn').addEventListener('click', () => {
        if (currentWindowId && window.electronAPI) {
            window.electronAPI.appWindowMinimize(currentWindowId);
        }
    });

    document.getElementById('maximizeBtn').addEventListener('click', () => {
        if (currentWindowId && window.electronAPI) {
            window.electronAPI.appWindowMaximize(currentWindowId);
        }
    });

    document.getElementById('closeBtn').addEventListener('click', () => {
        if (currentWindowId && window.electronAPI) {
            window.electronAPI.appWindowClose(currentWindowId);
        }
    });

    // Connect Wallet (web mode)
    document.getElementById('connectWalletBtn')?.addEventListener('click', async () => {
        await webConnectWallet();
    });

    // Initialize Identity Button
    document.getElementById('initializeIdentityBtn').addEventListener('click', async () => {
        await initializeIdentity();
    });

    // Test Login Button
    document.getElementById('testLoginBtn').addEventListener('click', async () => {
        await testAuthentication();
    });

    // License action buttons
    document.getElementById('stakeLicenseBtn')?.addEventListener('click', async () => {
        await stakeForLicense();
    });

    document.getElementById('purchaseLicenseBtn')?.addEventListener('click', async () => {
        await purchaseLifetimeLicense();
    });

    // Load identity status on startup
    loadIdentityStatus();
    checkLicenseStatus();
});

// --- Web browser flow (MetaMask / injected wallet) ---
async function ensureFuji() {
    const ethereum = window.ethereum;
    if (!ethereum) return null;
    const chainIdHex = '0x' + WEB_CHAIN_ID.toString(16);
    try {
        await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: chainIdHex }] });
    } catch (e) {
        if (e.code === 4902) {
            await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: chainIdHex,
                    chainName: 'Avalanche Fuji C-Chain',
                    rpcUrls: [WEB_RPC],
                    nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
                    blockExplorerUrls: ['https://testnet.snowtrace.io']
                }]
            });
        } else throw e;
    }
    return ethereum;
}

async function getWebSigner() {
    if (!window.ethereum) return null;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.listAccounts();
    if (!accounts || accounts.length === 0) return null;
    return provider.getSigner();
}

async function webConnectWallet() {
    const identityInfo = document.getElementById('identityInfo');
    const connectBtn = document.getElementById('connectWalletBtn');
    const initializeBtn = document.getElementById('initializeIdentityBtn');
    if (!window.ethereum) {
        identityInfo.innerHTML = '<p class="error">No wallet found. Install <a href="https://metamask.io" target="_blank" rel="noopener">MetaMask</a> or another Web3 wallet.</p>';
        return;
    }
    try {
        connectBtn.disabled = true;
        identityInfo.innerHTML = '<p class="loading">Connecting...</p>';
        await window.ethereum.request({ method: 'eth_requestAccounts', params: [] });
        await ensureFuji();
        const signer = await getWebSigner();
        if (!signer) {
            identityInfo.innerHTML = '<p class="error">No account selected.</p>';
            connectBtn.disabled = false;
            return;
        }
        const address = await signer.getAddress();
        const identityContract = new ethers.Contract(WEB_IDENTITY_ADDRESS, IDENTITY_ABI, signer);
        const hasIdentity = await identityContract.hasIdentity(address);
        connectBtn.style.display = 'none';
        if (hasIdentity) {
            const [omegaId] = await identityContract.getIdentity(address);
            try {
                localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify({ address, omegaId }));
            } catch (_) {}
            identityInfo.innerHTML = `
                <p><strong>Omega ID:</strong></p>
                <p class="omega-id">${omegaId}</p>
                <p><strong>Wallet:</strong></p>
                <p class="address">${address}</p>
            `;
            initializeBtn.style.display = 'none';
            loadSyncedDocuments();
        } else {
            identityInfo.innerHTML = '<p>Wallet connected. Click below to register your identity on Avalanche Fuji.</p>';
            initializeBtn.style.display = 'block';
        }
        checkLicenseStatus();
    } catch (e) {
        identityInfo.innerHTML = '<p class="error">' + (e.message || 'Connection failed') + '</p>';
        connectBtn.disabled = false;
    }
}

async function loadIdentityStatusWeb() {
    const identityInfo = document.getElementById('identityInfo');
    const connectBtn = document.getElementById('connectWalletBtn');
    const initializeBtn = document.getElementById('initializeIdentityBtn');

    function showConnectWallet(msg) {
        if (identityInfo) identityInfo.innerHTML = '<p class="info">' + (msg || 'Connect your wallet (e.g. MetaMask) to register and manage licensing on Avalanche Fuji.') + '</p>';
        if (connectBtn) {
            connectBtn.style.display = 'block';
            connectBtn.textContent = 'Connect Wallet';
            connectBtn.disabled = false;
        }
        if (initializeBtn) initializeBtn.style.display = 'none';
        checkLicenseStatus();
    }

    if (typeof ethers === 'undefined') {
        showConnectWallet('Loading wallet library... If this persists, refresh the page.');
        return;
    }
    if (!window.ethereum) {
        showConnectWallet();
        return;
    }

    identityInfo.innerHTML = '<p class="loading">Checking wallet...</p>';
    if (connectBtn) connectBtn.style.display = 'none';

    try {
        const signer = await getWebSigner();
        if (!signer) {
            showConnectWallet('Connect your wallet to continue.');
            return;
        }
        const address = await signer.getAddress();
        const identityContract = new ethers.Contract(WEB_IDENTITY_ADDRESS, IDENTITY_ABI, signer);
        const hasIdentity = await identityContract.hasIdentity(address);
        if (connectBtn) connectBtn.style.display = 'none';
        if (hasIdentity) {
            const [omegaId] = await identityContract.getIdentity(address);
            try {
                localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify({ address, omegaId }));
            } catch (_) {}
            identityInfo.innerHTML = `
                <p><strong>Omega ID:</strong></p>
                <p class="omega-id">${omegaId}</p>
                <p><strong>Wallet:</strong></p>
                <p class="address">${address}</p>
            `;
            initializeBtn.style.display = 'none';
            loadSyncedDocuments();
        } else {
            identityInfo.innerHTML = '<p>Wallet connected. Click below to register your identity on Avalanche Fuji.</p>';
            initializeBtn.style.display = 'block';
        }
        checkLicenseStatus();
    } catch (e) {
        console.error('loadIdentityStatusWeb', e);
        showConnectWallet('Could not load identity. Try connecting your wallet again.');
    }
}

async function loadIdentityStatus() {
    const identityInfo = document.getElementById('identityInfo');
    const initializeBtn = document.getElementById('initializeIdentityBtn');

    if (!isElectron()) {
        await loadIdentityStatusWeb();
        return;
    }
    
    try {
        // Check if wallet is loaded first
        const walletLoaded = await window.electronAPI.walletIsLoaded();
        if (!walletLoaded) {
            identityInfo.innerHTML = '<p class="error">Please unlock your wallet first to use Omega Identity.</p>';
            return;
        }

        // Check if identity exists
        const hasIdentity = await window.electronAPI.identityHasIdentity();
        
        if (!hasIdentity) {
            identityInfo.innerHTML = '<p>No identity found. Click below to initialize your Omega Identity.</p>';
            initializeBtn.style.display = 'block';
            return;
        }

        // Load identity
        const result = await window.electronAPI.identityGet();
        
        if (result.success && result.identity) {
            const identity = result.identity;
            identityInfo.innerHTML = `
                <p><strong>Omega ID:</strong></p>
                <p class="omega-id">${identity.omegaId}</p>
                <p><strong>Wallet Address:</strong></p>
                <p class="address">${identity.address}</p>
                <p><strong>Created:</strong> ${new Date(identity.createdAt).toLocaleString()}</p>
            `;
            initializeBtn.style.display = 'none';
            
            // Load synced documents
            loadSyncedDocuments();
        } else {
            identityInfo.innerHTML = '<p class="error">Failed to load identity: ' + (result.error || 'Unknown error') + '</p>';
            initializeBtn.style.display = 'block';
        }
    } catch (error) {
        identityInfo.innerHTML = '<p class="error">Error loading identity: ' + error.message + '</p>';
        initializeBtn.style.display = 'block';
    }
}

async function initializeIdentity() {
    const identityInfo = document.getElementById('identityInfo');
    const initializeBtn = document.getElementById('initializeIdentityBtn');

    if (!isElectron()) {
        try {
            identityInfo.innerHTML = '<p class="loading">Registering identity on Avalanche Fuji...</p>';
            initializeBtn.disabled = true;
            const signer = await getWebSigner();
            if (!signer) {
                identityInfo.innerHTML = '<p class="error">Connect your wallet first.</p>';
                initializeBtn.disabled = false;
                return;
            }
            const address = await signer.getAddress();
            const omegaId = 'omega://' + ethers.keccak256(ethers.toUtf8Bytes(address + Date.now())).slice(2, 18);
            const deviceFingerprint = 'web-' + (navigator.userAgent || '').slice(0, 32);
            const identityContract = new ethers.Contract(WEB_IDENTITY_ADDRESS, IDENTITY_ABI, signer);
            const tx = await identityContract.registerIdentity(omegaId, deviceFingerprint);
            await tx.wait();
            try {
                localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify({ address, omegaId }));
            } catch (_) {}
            identityInfo.innerHTML = '<p class="success">Identity created and registered on Avalanche Fuji!</p>';
            initializeBtn.style.display = 'none';
            setTimeout(() => loadIdentityStatusWeb(), 1000);
            checkLicenseStatus();
        } catch (e) {
            identityInfo.innerHTML = '<p class="error">' + (e.message || 'Registration failed') + '</p>';
        }
        initializeBtn.disabled = false;
        return;
    }
    
    try {
        identityInfo.innerHTML = '<p class="loading">Initializing identity on Avalanche Fuji...</p>';
        initializeBtn.disabled = true;
        
        const result = await window.electronAPI.identityInitialize();
        
        if (result.success) {
            if (result.exists) {
                identityInfo.innerHTML = '<p class="success">Identity loaded successfully!</p>';
            } else {
                identityInfo.innerHTML = '<p class="success">Identity created and registered on Avalanche Fuji!</p>';
            }
            
            // Reload identity display
            setTimeout(() => {
                loadIdentityStatus();
            }, 1000);
        } else {
            identityInfo.innerHTML = '<p class="error">Failed to initialize identity: ' + (result.error || 'Unknown error') + '</p>';
            initializeBtn.disabled = false;
        }
    } catch (error) {
        identityInfo.innerHTML = '<p class="error">Error initializing identity: ' + error.message + '</p>';
        initializeBtn.disabled = false;
    }
}

async function loadSyncedDocuments() {
    const syncedDocumentsDiv = document.getElementById('syncedDocuments');
    const syncStatus = document.getElementById('syncStatus');

    if (!isElectron()) {
        if (syncStatus) syncStatus.innerHTML = '<p>Document sync from browser: use desktop app for full sync.</p>';
        return;
    }

    try {
        const result = await window.electronAPI.identityGetSyncedDocuments();
        
        if (result.success && result.documents && result.documents.length > 0) {
            syncStatus.innerHTML = `<p>Found ${result.documents.length} synced document(s)</p>`;
            syncedDocumentsDiv.innerHTML = result.documents.map(doc => {
                const date = new Date(doc.timestamp);
                const typeIcon = doc.documentType === 'word' ? '📄' : 
                                doc.documentType === 'sheets' ? '📊' : 
                                doc.documentType === 'slides' ? '📽️' : '📁';
                return `
                <div class="document-item">
                    <div class="document-icon">${typeIcon}</div>
                    <div class="document-info">
                        <div class="document-name">${doc.fileName || doc.documentId}</div>
                        <div class="document-meta">
                            <span class="document-type">${doc.documentType || 'file'}</span>
                            <span class="document-date">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
                        </div>
                        <div class="document-hash">Hash: ${doc.documentHash.substring(0, 16)}...</div>
                    </div>
                </div>
            `;
            }).join('');
        } else {
            syncStatus.innerHTML = '<p>No synced documents yet. Documents will appear here when synced.</p>';
            syncedDocumentsDiv.innerHTML = '';
        }
    } catch (error) {
        syncStatus.innerHTML = '<p class="error">Error loading synced documents: ' + error.message + '</p>';
        syncedDocumentsDiv.innerHTML = '';
    }
}

async function checkLicenseStatus() {
    const licenseStatus = document.getElementById('licenseStatus');
    const licenseActions = document.getElementById('licenseActions');
    const licenseInfo = document.getElementById('licenseInfo');

    if (!isElectron()) {
        try {
            let stored = null;
            try {
                const s = localStorage.getItem(WEB_STORAGE_KEY);
                if (s) stored = JSON.parse(s);
            } catch (_) {}
            const signer = await getWebSigner();
            if (!signer || !stored || !stored.omegaId) {
                licenseStatus.innerHTML = '<p class="info">Connect wallet and register identity first.</p>';
                licenseActions.style.display = 'none';
                licenseInfo.style.display = 'none';
                return;
            }
            const provider = signer.provider;
            const licensingContract = new ethers.Contract(WEB_LICENSING_ADDRESS, LICENSING_ABI, provider);
            const [hasLicense, licenseTypeNum, expiryTime] = await licensingContract.hasActiveLicense(stored.omegaId);
            const stakingWei = await licensingContract.stakingAmount();
            const purchaseWei = await licensingContract.purchaseAmount();
            document.getElementById('stakingPrice').textContent = ethers.formatEther(stakingWei) + ' AVAX';
            document.getElementById('purchasePrice').textContent = ethers.formatEther(purchaseWei) + ' AVAX';
            if (hasLicense) {
                const typeStr = licenseTypeNum === 1 ? 'Staked' : licenseTypeNum === 2 ? 'Purchased' : 'Unknown';
                licenseStatus.innerHTML = '<p class="success">✓ License Active</p><p class="license-type">Type: ' + typeStr + '</p>';
                licenseActions.style.display = 'none';
                const [,,, startTime, exp, isActive] = await licensingContract.getLicense(stored.omegaId);
                const expiryText = exp && BigInt(exp) !== 0n ? new Date(Number(exp) * 1000).toLocaleDateString() : 'Never (Lifetime)';
                licenseInfo.innerHTML = '<div class="license-details"><h4>License Details</h4><p><strong>Type:</strong> ' + typeStr + '</p><p><strong>Expires:</strong> ' + expiryText + '</p></div>';
                licenseInfo.style.display = 'block';
            } else {
                licenseStatus.innerHTML = '<p class="error">✗ Not Licensed</p><p>Choose an option below (AVAX on Fuji).</p>';
                licenseActions.style.display = 'block';
                licenseInfo.style.display = 'none';
            }
        } catch (e) {
            licenseStatus.innerHTML = '<p class="error">Error: ' + (e.message || 'Could not load license') + '</p>';
            licenseActions.style.display = 'none';
            licenseInfo.style.display = 'none';
        }
        return;
    }
    
    try {
        // Check if identity exists first
        const hasIdentity = await window.electronAPI.identityHasIdentity();
        if (!hasIdentity) {
            licenseStatus.innerHTML = '<p class="error">Please register your Omega OS identity first.</p>';
            licenseActions.style.display = 'none';
            licenseInfo.style.display = 'none';
            return;
        }
        
        // Get license status
        const result = await window.electronAPI.identityCheckLicense();
        const pricing = await window.electronAPI.identityGetLicensePricing();
        const details = await window.electronAPI.identityGetLicenseDetails();
        
        // Update pricing display
        if (pricing) {
            const stakingPrice = parseFloat(pricing.stakingAmount) / 1e18;
            const purchasePrice = parseFloat(pricing.purchaseAmount) / 1e18;
            document.getElementById('stakingPrice').textContent = `${stakingPrice.toLocaleString()} OMEGA`;
            document.getElementById('purchasePrice').textContent = `${purchasePrice.toLocaleString()} OMEGA`;
        }
        
        if (result.hasLicense) {
            // User has an active license
            licenseStatus.innerHTML = `
                <p class="success">✓ License Active</p>
                <p class="license-type">Type: ${result.licenseType}</p>
            `;
            licenseActions.style.display = 'none';
            
            // Show license details
            if (details) {
                let expiryText = 'Never (Lifetime)';
                if (details.expiryTime) {
                    const expiryDate = new Date(details.expiryTime);
                    const now = new Date();
                    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                    expiryText = `${expiryDate.toLocaleDateString()} (${daysLeft} days remaining)`;
                }
                
                licenseInfo.innerHTML = `
                    <div class="license-details">
                        <h4>License Details</h4>
                        <p><strong>Type:</strong> ${details.licenseType}</p>
                        <p><strong>Started:</strong> ${new Date(details.startTime).toLocaleDateString()}</p>
                        <p><strong>Expires:</strong> ${expiryText}</p>
                        ${details.licenseType === 'Staked' ? `
                            <p><strong>Staked Amount:</strong> ${(parseFloat(details.stakedAmount) / 1e18).toLocaleString()} OMEGA</p>
                            <button id="withdrawStakeBtn" class="identity-btn secondary" style="margin-top: 10px;">
                                Withdraw Stake (After Expiry)
                            </button>
                        ` : ''}
                    </div>
                `;
                licenseInfo.style.display = 'block';
                
                // Add withdraw button listener if present
                const withdrawBtn = document.getElementById('withdrawStakeBtn');
                if (withdrawBtn) {
                    withdrawBtn.addEventListener('click', async () => {
                        await withdrawStake();
                    });
                }
            }
        } else {
            // No active license
            licenseStatus.innerHTML = `
                <p class="error">✗ Not Licensed</p>
                <p>Choose an option below to unlock Omega OS Pro</p>
            `;
            licenseActions.style.display = 'block';
            licenseInfo.style.display = 'none';
        }
    } catch (error) {
        licenseStatus.innerHTML = `<p class="error">Error checking license: ${error.message}</p>`;
        licenseActions.style.display = 'none';
        licenseInfo.style.display = 'none';
    }
}

async function stakeForLicense() {
    const stakeBtn = document.getElementById('stakeLicenseBtn');
    
    if (!isElectron()) {
        try {
            const stored = JSON.parse(localStorage.getItem(WEB_STORAGE_KEY) || '{}');
            if (!stored.omegaId) {
                alert('Register identity first.');
                return;
            }
            const signer = await getWebSigner();
            if (!signer) {
                alert('Connect wallet first.');
                return;
            }
            const licensingContract = new ethers.Contract(WEB_LICENSING_ADDRESS, LICENSING_ABI, signer);
            const amountWei = await licensingContract.stakingAmount();
            const amountStr = ethers.formatEther(amountWei);
            if (!confirm('Stake ' + amountStr + ' AVAX for a 30-day license? Tokens are locked until expiry.')) return;
            stakeBtn.disabled = true;
            stakeBtn.textContent = 'Staking...';
            const tx = await licensingContract.stakeForLicense(stored.omegaId, { value: amountWei });
            await tx.wait();
            alert('License staked successfully! Tx: ' + tx.hash);
            await checkLicenseStatus();
        } catch (e) {
            alert('Error: ' + (e.message || 'Stake failed'));
        }
        stakeBtn.disabled = false;
        stakeBtn.textContent = 'Stake for License';
        return;
    }
    
    try {
        // Get pricing
        const pricing = await window.electronAPI.identityGetLicensePricing();
        const stakingAmount = parseFloat(pricing.stakingAmount) / 1e18;
        
        // Show confirmation
        const confirmMessage = `Stake ${stakingAmount.toLocaleString()} OMEGA tokens for a 30-day license?\n\n` +
            `Your tokens will be locked for 30 days. After the license expires, you can withdraw your staked tokens.\n\n` +
            `Make sure your wallet is unlocked and has enough Omega tokens.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        stakeBtn.disabled = true;
        stakeBtn.textContent = 'Staking...';
        
        const result = await window.electronAPI.identityStakeForLicense();
        
        if (result.success) {
            alert(`License staked successfully!\n\nTransaction: ${result.txHash}\n\nYour license is active for 30 days.`);
            await checkLicenseStatus(); // Refresh status
        } else {
            alert('Failed to stake for license: ' + (result.error || 'Unknown error'));
            stakeBtn.disabled = false;
            stakeBtn.textContent = 'Stake for License';
        }
    } catch (error) {
        alert('Error staking for license: ' + error.message);
        stakeBtn.disabled = false;
        stakeBtn.textContent = 'Stake for License';
    }
}

async function purchaseLifetimeLicense() {
    const purchaseBtn = document.getElementById('purchaseLicenseBtn');
    
    if (!isElectron()) {
        try {
            const stored = JSON.parse(localStorage.getItem(WEB_STORAGE_KEY) || '{}');
            if (!stored.omegaId) {
                alert('Register identity first.');
                return;
            }
            const signer = await getWebSigner();
            if (!signer) {
                alert('Connect wallet first.');
                return;
            }
            const licensingContract = new ethers.Contract(WEB_LICENSING_ADDRESS, LICENSING_ABI, signer);
            const amountWei = await licensingContract.purchaseAmount();
            const amountStr = ethers.formatEther(amountWei);
            if (!confirm('Purchase lifetime license for ' + amountStr + ' AVAX? One-time payment.')) return;
            purchaseBtn.disabled = true;
            purchaseBtn.textContent = 'Processing...';
            const tx = await licensingContract.purchaseLicense(stored.omegaId, { value: amountWei });
            await tx.wait();
            alert('Lifetime license purchased! Tx: ' + tx.hash);
            await checkLicenseStatus();
        } catch (e) {
            alert('Error: ' + (e.message || 'Purchase failed'));
        }
        purchaseBtn.disabled = false;
        purchaseBtn.textContent = 'Purchase License';
        return;
    }
    
    try {
        // Get pricing
        const pricing = await window.electronAPI.identityGetLicensePricing();
        const purchaseAmount = parseFloat(pricing.purchaseAmount) / 1e18;
        
        // Show confirmation
        const confirmMessage = `Purchase lifetime license for ${purchaseAmount.toLocaleString()} OMEGA tokens?\n\n` +
            `This is a one-time payment. You'll have access to Omega OS Pro forever.\n\n` +
            `Make sure your wallet is unlocked and has enough Omega tokens.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        purchaseBtn.disabled = true;
        purchaseBtn.textContent = 'Processing...';
        
        const result = await window.electronAPI.identityPurchaseLicense();
        
        if (result.success) {
            alert(`Lifetime license purchased successfully!\n\nTransaction: ${result.txHash}\n\nYou now have lifetime access to Omega OS Pro!`);
            await checkLicenseStatus(); // Refresh status
        } else {
            alert('Failed to purchase license: ' + (result.error || 'Unknown error'));
            purchaseBtn.disabled = false;
            purchaseBtn.textContent = 'Purchase License';
        }
    } catch (error) {
        alert('Error purchasing license: ' + error.message);
        purchaseBtn.disabled = false;
        purchaseBtn.textContent = 'Purchase License';
    }
}

async function withdrawStake() {
    const withdrawBtn = document.getElementById('withdrawStakeBtn');
    
    try {
        if (!confirm('Withdraw your staked tokens?\n\nThis will deactivate your license if it\'s still active. Make sure your license has expired first.')) {
            return;
        }
        
        if (withdrawBtn) {
            withdrawBtn.disabled = true;
            withdrawBtn.textContent = 'Withdrawing...';
        }
        
        const result = await window.electronAPI.identityWithdrawStake();
        
        if (result.success) {
            alert(`Stake withdrawn successfully!\n\nTransaction: ${result.txHash}\n\nYour tokens have been returned to your wallet.`);
            await checkLicenseStatus(); // Refresh status
        } else {
            alert('Failed to withdraw stake: ' + (result.error || 'Unknown error'));
            if (withdrawBtn) {
                withdrawBtn.disabled = false;
                withdrawBtn.textContent = 'Withdraw Stake (After Expiry)';
            }
        }
    } catch (error) {
        alert('Error withdrawing stake: ' + error.message);
        if (withdrawBtn) {
            withdrawBtn.disabled = false;
            withdrawBtn.textContent = 'Withdraw Stake (After Expiry)';
        }
    }
}

async function testAuthentication() {
    const loginResult = document.getElementById('loginResult');
    const testLoginBtn = document.getElementById('testLoginBtn');
    
    try {
        testLoginBtn.disabled = true;
        loginResult.style.display = 'none';
        
        const message = 'Omega OS Authentication - ' + Date.now();
        const result = await window.electronAPI.identityAuthenticate(message);
        
        if (result.success) {
            loginResult.className = 'login-result success';
            loginResult.innerHTML = `
                <strong>Authentication Successful!</strong><br>
                Omega ID: ${result.omegaId}<br>
                Address: ${result.address}<br>
                Signature: ${result.signature.substring(0, 20)}...<br>
                Timestamp: ${new Date(result.timestamp).toLocaleString()}
            `;
            loginResult.style.display = 'block';
        } else {
            loginResult.className = 'login-result error';
            loginResult.innerHTML = '<strong>Authentication Failed:</strong> ' + (result.error || 'Unknown error');
            loginResult.style.display = 'block';
        }
    } catch (error) {
        loginResult.className = 'login-result error';
        loginResult.innerHTML = '<strong>Error:</strong> ' + error.message;
        loginResult.style.display = 'block';
    } finally {
        testLoginBtn.disabled = false;
    }
}


