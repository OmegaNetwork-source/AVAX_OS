// Web Adapter for Browser-based Omega OS
// This script mocks the electronAPI when running in a standard web browser

(function () {
    // Check if we are in Electron (window.electronAPI should be defined by preload)
    // If it's already defined, we do nothing.
    if (window.electronAPI) {
        console.log('[Web Adapter] Electron environment detected. Adapter inactive.');
        return;
    }

    // Check if we are really in a browser (fallback detection)
    const isBrowser = !window.process || !window.process.type;

    if (!isBrowser) {
        // Technically this shouldn't happen if electronAPI is missing unless something went wrong with preload
        // We'll continue to mock it anyway just in case to prevent crashes
        console.warn('[Web Adapter] Electron environment but API missing? Initializing adapter.');
    } else {
        console.log('[Web Adapter] Initializing Web Compatibility Mode...');
    }

    // Mock storage for simple persistence
    const LOCAL_STORAGE_PREFIX = 'omega_web_';

    // So pages can show web-only UI (e.g. "Back to Desktop" button)
    window.OMEGA_WEB_MODE = true;

    // --- In-browser wallet (used when on wallet page; requires ethers + CryptoJS) ---
    let _webWalletImpl = null;
    function getWebWalletImpl() { return _webWalletImpl; }
    async function requireWebWallet() {
        if (_webWalletImpl) return _webWalletImpl;
        if (typeof window.ethers === 'undefined' || typeof window.CryptoJS === 'undefined')
            throw new Error('Wallet libraries not loaded. Reload the wallet page.');
        _webWalletImpl = createWebWalletImpl();
        return _webWalletImpl;
    }
    function createWebWalletImpl() {
        const STORAGE_KEY = LOCAL_STORAGE_PREFIX + 'wallet_storage';
        let loadedWallet = null;
        let loadedWalletId = null;

        function getStorage() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                return raw ? JSON.parse(raw) : null;
            } catch (e) { return null; }
        }
        function setStorage(s) {
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
        }

        return {
            async walletHasWallet() {
                const s = getStorage();
                return !!(s && s.wallets && s.wallets.length > 0);
            },
            async walletIsLoaded() { return loadedWallet !== null; },
            async walletCreate(password) {
                const w = window.ethers.Wallet.createRandom();
                const encrypted = window.CryptoJS.AES.encrypt(w.privateKey, password).toString();
                const data = { id: 'primary', network: 'multi', name: 'Account 1', evmAddress: w.address, encryptedEvmPrivateKey: encrypted, createdAt: Date.now() };
                const s = getStorage() || { wallets: [], currentWalletIds: {} };
                s.wallets = [data];
                s.currentWalletIds = { solana: 'primary', omega: 'primary', evm: 'primary', bsc: 'primary' };
                setStorage(s);
                loadedWallet = w;
                loadedWalletId = 'primary';
                return { publicKey: w.address, secretKey: w.privateKey, evmAddress: w.address };
            },
            async walletLoad(password) {
                const s = getStorage();
                if (!s || !s.wallets || s.wallets.length === 0) throw new Error('No wallet found');
                const first = s.wallets[0];
                const decrypted = window.CryptoJS.AES.decrypt(first.encryptedEvmPrivateKey, password).toString(window.CryptoJS.enc.Utf8);
                if (!decrypted) throw new Error('Wrong password');
                loadedWallet = new window.ethers.Wallet(decrypted);
                loadedWalletId = first.id || 'primary';
                return { publicKey: loadedWallet.address, evmAddress: loadedWallet.address };
            },
            async walletImportFromPrivateKey(privateKey, password) {
                const pk = privateKey.trim();
                const hex = pk.startsWith('0x') ? pk : '0x' + pk;
                const w = new window.ethers.Wallet(hex);
                const encrypted = window.CryptoJS.AES.encrypt(w.privateKey, password).toString();
                const data = { id: 'primary', network: 'multi', name: 'Account 1', evmAddress: w.address, encryptedEvmPrivateKey: encrypted, createdAt: Date.now() };
                const s = getStorage() || { wallets: [], currentWalletIds: {} };
                s.wallets = [data];
                s.currentWalletIds = { solana: 'primary', omega: 'primary', evm: 'primary', bsc: 'primary' };
                setStorage(s);
                loadedWallet = w;
                loadedWalletId = 'primary';
            },
            async walletGetPublicKey() { return loadedWallet ? loadedWallet.address : null; },
            async walletGetEvmAddress() { return loadedWallet ? loadedWallet.address : null; },
            async walletSetCurrentWallet(network, walletId, password) {
                const s = getStorage();
                if (!s || !s.wallets) throw new Error('No wallets');
                const w = s.wallets.find(x => x.id === walletId);
                if (!w) throw new Error('Wallet not found');
                const decrypted = window.CryptoJS.AES.decrypt(w.encryptedEvmPrivateKey, password).toString(window.CryptoJS.enc.Utf8);
                if (!decrypted) throw new Error('Wrong password');
                loadedWallet = new window.ethers.Wallet(decrypted);
                loadedWalletId = w.id;
            },
            async walletGetCurrentWalletId(network) {
                const s = getStorage();
                if (!s || !s.currentWalletIds) return 'primary';
                return s.currentWalletIds[network] || s.currentWalletIds.omega || 'primary';
            },
            async walletGetWalletsForNetwork(network) {
                const s = getStorage();
                if (!s || !s.wallets) return [];
                return s.wallets.map(x => ({ id: x.id, name: x.name || ('Account ' + x.id), evmAddress: x.evmAddress }));
            },
            async walletGetBalance() {
                if (!loadedWallet) return 0;
                const bal = await this.walletGetEvmBalance(43113);
                return typeof bal === 'number' ? bal : Number(bal) / 1e18;
            },
            async walletGetEvmBalance(chainId) {
                if (!loadedWallet) return 0;
                const rpcs = { 1: 'https://eth.llamarpc.com', 56: 'https://bsc-dataseed.binance.org', 43113: 'https://api.avax-test.network/ext/bc/C/rpc' };
                const url = rpcs[chainId] || rpcs[43113];
                const provider = new window.ethers.JsonRpcProvider(url);
                const balanceWei = await provider.getBalance(loadedWallet.address);
                return Number(balanceWei) / 1e18;
            },
            async walletSendEvmTransaction(to, valueWeiOrHuman, data, chainId) {
                if (!loadedWallet) throw new Error('Wallet not loaded');
                const ethers = window.ethers;
                const valueWei = typeof valueWeiOrHuman === 'string' && valueWeiOrHuman.length < 30
                    ? ethers.parseEther(valueWeiOrHuman)
                    : BigInt(valueWeiOrHuman);
                const rpcs = { 1: 'https://eth.llamarpc.com', 56: 'https://bsc-dataseed.binance.org', 43113: 'https://api.avax-test.network/ext/bc/C/rpc' };
                const url = rpcs[chainId] || rpcs[43113];
                const provider = new ethers.JsonRpcProvider(url);
                const tx = { to, value: valueWei, data: data && data !== '0x' ? data : '0x' };
                const sent = await loadedWallet.connect(provider).sendTransaction(tx);
                const receipt = await sent.wait();
                return receipt.hash;
            },
            async walletExportPrivateKey(password) {
                const s = getStorage();
                if (!s || !s.wallets || s.wallets.length === 0) throw new Error('No wallet');
                const decrypted = window.CryptoJS.AES.decrypt(s.wallets[0].encryptedEvmPrivateKey, password).toString(window.CryptoJS.enc.Utf8);
                if (!decrypted) throw new Error('Wrong password');
                return decrypted;
            },
            async walletCreateForNetwork(password, network, name) {
                const w = window.ethers.Wallet.createRandom();
                const encrypted = window.CryptoJS.AES.encrypt(w.privateKey, password).toString();
                const id = 'wallet_' + Date.now();
                const data = { id, network, name: name || 'Account', evmAddress: w.address, encryptedEvmPrivateKey: encrypted, createdAt: Date.now() };
                const s = getStorage() || { wallets: [], currentWalletIds: {} };
                s.wallets.push(data);
                s.currentWalletIds = s.currentWalletIds || {};
                s.currentWalletIds[network] = id;
                setStorage(s);
                loadedWallet = w;
                loadedWalletId = id;
                return { publicKey: w.address, secretKey: w.privateKey, evmAddress: w.address };
            },
            async walletCleanupDuplicates() { return { deleted: 0 }; }
        };
    }

    // Mock the API
    window.electronAPI = {
        // Window Controls: close navigates back to desktop in browser
        getWindowId: async () => 'web-window-1',
        appWindowMinimize: async (id) => console.log('[Web] Minimize window (no-op)'),
        appWindowMaximize: async (id) => console.log('[Web] Maximize window (no-op)'),
        appWindowClose: async (id) => {
            window.location.href = '/desktop';
        },
        desktopMinimize: async () => console.log('[Web] Minimize desktop (no-op)'),
        desktopMaximize: async () => console.log('[Web] Maximize desktop (no-op)'),
        desktopClose: async () => console.log('[Web] Close desktop (no-op)'),

        // Whisper / Tor (Mocked/Disabled)
        whisperGetInfo: async () => ({
            address: 'web-mode-address-not-available',
            status: 'offline',
            error: 'Tor not available in Web Mode'
        }),
        whisperGetContacts: async () => [],
        whisperGetMessages: async () => [],
        whisperSendMessage: async () => ({ success: false, error: 'Cannot send messages in Web Mode' }),
        whisperAddContact: async () => ({ success: false }),

        // App Management
        launchApp: async (appType) => {
            console.log(`[Web] Launching app: ${appType}`);
            // Simple routing for web version
            const mappings = {
                'browser': 'browser.html',
                'terminal': 'https://terminalv2.omeganetwork.co/',
                'word': 'word.html',
                'finance': 'finance.html',
                'slides': 'slides.html',
                'paint': 'paint.html',
                'filemanager': 'filemanager.html',
                'calculator': 'calculator.html',
                'calendar': 'calendar.html',
                'wallet': 'wallet.html',
                'identity': 'identity.html',
                'whisper': 'whisper.html',
                'bazaar': 'bazaar.html',
                'netrunner': 'netrunner.html',
                'trace': 'trace.html',
                'drainer': 'drainer.html',
                'drainer-landing': 'drainer-landing.html',
                'qr-generator': 'qr-generator.html',
                'xploit': 'xploit.html',
                'omega-vuln': 'omega-vuln.html',
                'steganography': 'steganography.html',
                'ai-dev': 'ai-dev.html',
                'ai-cursor': 'ai-dev.html',
                'phish': 'phish.html',
                'interceptor': 'interceptor.html',
                'notes': 'notes.html',
                'password-manager': 'password-manager.html',
                'privacy-monitor': 'privacy-monitor.html',
                'secure-vault': 'secure-vault.html',
                'firewall': 'firewall.html',
                'cookie-manager': 'cookie-manager.html',
                'crack': 'crack.html',
                'encrypt': 'encrypt.html',
                'hash-verifier': 'hash-verifier.html',
                'integrations-manager': 'integrations-manager.html',
                'pgt': 'https://www.pgtools.tech/',
                'strix': 'strix.html',
                'dappfun': 'http://localhost:5173/',
                'avax-arcade': 'http://localhost:62678/AVAX%20Arcade/avax-arcade.html',
                'heatmap': 'https://networkmap.omeganetwork.co/',
                'quake': 'https://quake.omeganetwork.co/',
                'omegamusic': 'https://omegamusic.omeganetwork.co/'
            };

            if (mappings[appType]) {
                // Identity and Wallet: open in same tab so MetaMask works (extensions don't run in popups)
                if (appType === 'identity' || appType === 'wallet') {
                    window.location.href = mappings[appType];
                    return;
                }
                const width = 1000;
                const height = 700;
                const left = (window.screen.width - width) / 2;
                const top = (window.screen.height - height) / 2;
                window.open(mappings[appType], '_blank', `width=${width},height=${height},left=${left},top=${top}`);
            } else {
                alert(`App ${appType} is not available in Web Demo.`);
            }
        },

        installApp: async (appId) => {
            console.log(`[Web] Installing ${appId}...`);
            await new Promise(r => setTimeout(r, 1000));
            return { success: true };
        },

        // Wallet: in-browser implementation (see web wallet module above)
        walletHasWallet: async () => { try { const impl = await requireWebWallet(); return await impl.walletHasWallet(); } catch (_) { return false; } },
        walletIsLoaded: async () => { try { const impl = await requireWebWallet(); return await impl.walletIsLoaded(); } catch (_) { return false; } },
        walletCreate: async (password) => (await requireWebWallet()).walletCreate(password),
        walletLoad: async (password) => (await requireWebWallet()).walletLoad(password),
        walletImportFromPrivateKey: async (privateKey, password) => (await requireWebWallet()).walletImportFromPrivateKey(privateKey, password),
        walletGetPublicKey: async () => { try { const impl = getWebWalletImpl(); return impl ? await impl.walletGetPublicKey() : null; } catch (_) { return null; } },
        walletGetEvmAddress: async () => { try { const impl = getWebWalletImpl(); return impl ? await impl.walletGetEvmAddress() : null; } catch (_) { return null; } },
        walletSetCurrentWallet: async (network, walletId, password) => (await requireWebWallet()).walletSetCurrentWallet(network, walletId, password),
        walletGetCurrentWalletId: async (network) => { try { const impl = getWebWalletImpl(); return impl ? await impl.walletGetCurrentWalletId(network) : 'primary'; } catch (_) { return 'primary'; } },
        walletGetWalletsForNetwork: async (network) => { try { const impl = getWebWalletImpl(); return impl ? await impl.walletGetWalletsForNetwork(network) : []; } catch (_) { return []; } },
        walletGetBalance: async () => { try { const impl = getWebWalletImpl(); return impl ? await impl.walletGetBalance() : 0; } catch (_) { return 0; } },
        walletGetEvmBalance: async (chainId) => { try { const impl = getWebWalletImpl(); return impl ? await impl.walletGetEvmBalance(chainId) : 0; } catch (_) { return 0; } },
        walletSendSol: async () => { throw new Error('Send SOL not available in web wallet'); },
        walletSendEvmTransaction: async (to, valueWei, data, chainId) => (await requireWebWallet()).walletSendEvmTransaction(to, valueWei, data, chainId),
        walletExportPrivateKey: async (password) => (await requireWebWallet()).walletExportPrivateKey(password),
        walletCreateForNetwork: async (password, network, name) => (await requireWebWallet()).walletCreateForNetwork(password, network, name),
        walletCleanupDuplicates: async () => { try { const impl = await requireWebWallet(); return await impl.walletCleanupDuplicates(); } catch (_) { return { deleted: 0 }; } },
        walletToggleNetwork: async () => {},

        // File System (Mock)
        readFile: async (path) => null,
        writeFile: async (path, content) => console.log(`[Web] Write file to ${path}:`, content),

        // General
        clipboardWriteText: async (text) => navigator.clipboard.writeText(text),
        openExternalUrl: async (url) => window.open(url, '_blank'),

        // Settings/System
        getVolume: async () => 50,
        setVolume: async () => { },
        getBrightness: async () => 100,
        setBrightness: async () => { },

        // Events (No-ops mostly)
        onWindowId: (cb) => cb('web-window-1'),
        onOpenFile: () => { },
        onWalletConfigureForIdentity: () => { },
        onAppInstalled: () => { },
        onWhisperMessageDeleted: () => { },
        onWhisperLog: () => { },

        // invoke fallback
        invoke: async (channel, ...args) => {
            console.log(`[Web] Invoke ${channel}`, args);

            // BLOCK DANGEROUS / MISLEADING ACTIONS IN WEB MODE
            const dangerousChannels = [
                'start-attack', 'run-exploit', 'drain-wallet', 'inject-payload',
                'start-trace', 'intercept-network', 'crack-password', 'generate-malware'
            ];

            if (dangerousChannels.some(c => channel.includes(c))) {
                alert('⚠️ WEB DEMO RESTRICTION ⚠️\n\nThis offensive security feature is disabled in the web demo for safety reasons.\n\nPlease download the Desktop App for full functionality.');
                return { success: false, error: 'Disabled in Web Mode' };
            }

            // Return safe defaults for common calls
            if (channel === 'get-window-id') return 'web-window-1';
            if (channel === 'desktop-create-folder') return true;
            if (channel === 'trash-list') return [];
            return null;
        }
    };

    // Expose global launchApp for desktop.js
    window.launchApp = window.electronAPI.launchApp;

    // --- PATCH: Intercept Dynamic Webview Creation (Top Level) ---
    // This must run immediately, before any other scripts try to create webviews
    const originalCreateElement = document.createElement;
    document.createElement = function (tagName, options) {
        if (tagName && tagName.toLowerCase() === 'webview') {
            console.log('[Web Adapter] Intercepted createElement(webview)');
            const iframe = originalCreateElement.call(document, 'iframe');
            shimWebviewApi(iframe);
            return iframe;
        }
        return originalCreateElement.call(document, tagName, options);
    };

    function shimWebviewApi(iframe) {
        // Add Electron Webview methods/properties to the iframe

        // Event Handling
        const eventListeners = {};

        iframe._addEventListener = iframe.addEventListener;
        iframe.addEventListener = function (event, callback) {
            if (['dom-ready', 'did-navigate', 'did-start-loading', 'did-stop-loading', 'did-finish-load', 'page-title-updated', 'new-window'].includes(event)) {
                if (!eventListeners[event]) eventListeners[event] = [];
                eventListeners[event].push(callback);
            } else {
                iframe._addEventListener(event, callback);
            }
        };

        // Trigger events helper
        function triggerEvent(eventName, eventData = {}) {
            if (eventListeners[eventName]) {
                eventListeners[eventName].forEach(cb => cb(eventData));
            }
        }

        // Method Mocks
        iframe.loadURL = function (url) {
            iframe.src = url;
        };

        iframe.getURL = async function () {
            return iframe._intendedUrl || iframe.getAttribute('src') || '';
        };

        iframe.reload = function () {
            if (iframe._intendedUrl) {
                iframe.src = iframe._intendedUrl;
            } else {
                iframe.contentWindow.location.reload();
            }
        };

        iframe.executeJavaScript = async function (code) {
            console.log('[Web Adapter] executeJavaScript blocked in iframe for security:', code.substring(0, 50) + '...');
            return null;
        };

        // Intercept 'src' property to handle external URLs
        let _src = iframe.getAttribute('src') || '';
        iframe._intendedUrl = _src;

        Object.defineProperty(iframe, 'src', {
            get() { return _src; },
            set(url) {
                _src = url;
                iframe._intendedUrl = url;

                // Allow relative URLs or same-origin
                const isExternal = url.startsWith('http') && !url.includes(window.location.host);

                if (isExternal) {
                    console.log('[Web Adapter] External URL detected, showing fallback:', url);

                    const html = `
                        <style>
                            body { background: #1a1a1a; color: #e0e0e0; font-family: 'Segoe UI', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                            .container { background: #252526; padding: 40px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); max-width: 500px; border: 1px solid #333; }
                            h2 { color: #fff; margin-bottom: 16px; font-weight: 600; font-size: 24px; }
                            p { color: #aaa; line-height: 1.6; margin-bottom: 24px; }
                            .url-badge { background: #333; padding: 4px 10px; border-radius: 4px; font-family: monospace; color: #4fc1ff; font-size: 13px; }
                            .btn { background: #0078d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; transition: background 0.2s; display: inline-block; }
                            .btn:hover { background: #0063b1; }
                            .icon { font-size: 48px; margin-bottom: 20px; opacity: 0.8; }
                        </style>
                        <div class="container">
                            <div class="icon">🛡️</div>
                            <h2>Web Demo Restriction</h2>
                            <p>External websites cannot be loaded inside this Web Demo due to browser security restrictions (X-Frame-Options).</p>
                            <p>Website: <span class="url-badge">${url}</span></p>
                            <a href="${url}" target="_blank" class="btn">Open in New Tab</a>
                        </div>
                    `;

                    // Set the REAL iframe src to the data URL
                    iframe.setAttribute('src', 'data:text/html;charset=utf-8,' + encodeURIComponent(html));

                    // Fire events mocking the ORIGINAL URL so the browser app UI updates correctly
                    setTimeout(() => {
                        triggerEvent('did-start-loading');
                        triggerEvent('did-navigate', { url: url });
                        triggerEvent('did-stop-loading');
                        triggerEvent('page-title-updated', { title: 'External Site' });
                    }, 50);

                } else {
                    // Internal URL - Load normally
                    iframe.setAttribute('src', url);
                }
            }
        });

        // Monitor Standard Iframe Load (for Internal pages)
        iframe.onload = function () {
            // Only trigger events if we haven't already handled them in the setter (for external)
            if (!iframe._intendedUrl || !iframe._intendedUrl.startsWith('http') || iframe._intendedUrl.includes(window.location.host)) {
                console.log('[Web Adapter] Internal iframe loaded:', iframe.getAttribute('src'));
                triggerEvent('dom-ready');
                triggerEvent('did-finish-load');
                triggerEvent('did-stop-loading');
                triggerEvent('did-navigate', { url: iframe.getAttribute('src') });
            }
        };
    }

    // --- DOM Initialization ---
    window.addEventListener('DOMContentLoaded', () => {
        // 1. WEB DEMO RIBBON
        // 1. WEB DEMO RIBBON
        const ribbonStyle = document.createElement('style');
        ribbonStyle.innerHTML = `
            .web-demo-ribbon {
                position: fixed;
                bottom: 60px;
                right: 10px;
                background: rgba(255, 68, 68, 0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 5px;
                font-size: 12px;
                z-index: 999999;
                pointer-events: none;
                font-family: monospace;
            }
            @media (max-width: 768px) {
                .web-demo-ribbon {
                    bottom: auto; /* Reset bottom */
                    top: 10px;
                    right: 10px;
                    font-size: 10px; /* Smaller text */
                    padding: 4px 8px;
                    background: rgba(255, 68, 68, 0.4); /* More transparent on mobile */
                }
            }
        `;
        document.head.appendChild(ribbonStyle);

        const ribbon = document.createElement('div');
        ribbon.className = 'web-demo-ribbon';
        ribbon.innerText = 'WEB DEMO MODE';
        document.body.appendChild(ribbon);

        // 2. HIDE WINDOW CONTROLS
        const minBtn = document.getElementById('minBtn');
        const maxBtn = document.getElementById('maxBtn');
        const closeBtn = document.getElementById('closeBtn');
        if (minBtn) minBtn.style.display = 'none';
        if (maxBtn) maxBtn.style.display = 'none';
        if (closeBtn) closeBtn.style.display = 'none';

        const dragArea = document.querySelector('.title-drag-area');
        if (dragArea) dragArea.style.webkitAppRegion = 'no-drag';

        // 3. VPN BADGE OVERRIDE
        function updateVpnBadge() {
            const vpnBadge = document.getElementById('vpnStatusBadge');
            const vpnTitle = document.getElementById('vpnStatusBadgeTitle');
            const vpnLocation = document.getElementById('vpnStatusBadgeLocation');
            const vpnDot = document.getElementById('vpnStatusBadgeDot');

            if (vpnBadge && vpnTitle && vpnLocation) {
                // Force text
                if (vpnTitle.innerText !== 'Web Mode: Enabled') {
                    vpnTitle.innerText = 'Web Mode: Enabled';
                }
                if (vpnLocation.innerText !== 'For Full Features and Privacy Please download the Desktop App') {
                    vpnLocation.innerText = 'For Full Features and Privacy Please download the Desktop App';
                }

                // Allow text wrapping and expansion
                vpnBadge.style.height = 'auto';
                vpnBadge.style.minHeight = '46px';
                vpnBadge.style.maxWidth = '300px';
                vpnBadge.style.width = 'auto';

                vpnLocation.style.whiteSpace = 'normal';
                vpnLocation.style.overflow = 'visible';
                vpnLocation.style.lineHeight = '1.2';
                vpnLocation.style.marginTop = '4px';

                if (vpnDot) {
                    vpnDot.style.background = '#4ade80'; // Green
                    vpnDot.style.animation = 'none';
                    vpnDot.className = 'vpn-status-badge-dot'; // Remove 'disconnected' class
                }
            }
        }

        // Apply immediately
        updateVpnBadge();

        // And apply repeatedly/observe to prevent overwrites
        const vpnBadge = document.getElementById('vpnStatusBadge');
        if (vpnBadge) {
            const observer = new MutationObserver(() => {
                // Disconnect momentarily to avoid infinite loop if we change DOM
                observer.disconnect();
                updateVpnBadge();
                observer.observe(vpnBadge, { subtree: true, attributes: true, childList: true });
            });
            observer.observe(vpnBadge, { subtree: true, attributes: true, childList: true });
        }

        // Also a failsafe timeout
        setTimeout(updateVpnBadge, 1000);
        setTimeout(updateVpnBadge, 3000);

        // 4. REPLACE STATIC WEBVIEWS
        const webviews = document.querySelectorAll('webview');
        webviews.forEach(webview => {
            console.log('[Web Adapter] Replacing static webview with iframe');
            const iframe = document.createElement('iframe');
            const src = webview.getAttribute('src');
            if (src) iframe.src = src;
            iframe.className = webview.className;
            iframe.id = webview.id;
            iframe.style.cssText = webview.style.cssText;
            if (!iframe.style.width) iframe.style.width = '100%';
            if (!iframe.style.height) iframe.style.height = '100%';
            iframe.style.border = 'none';
            shimWebviewApi(iframe);
            webview.replaceWith(iframe);
        });
    });

})();
