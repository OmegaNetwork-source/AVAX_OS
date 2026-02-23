// Omega Quake entry point
// Equivalent to WinQuake/sys_win.c WinMain() + main()

import { Sys_Init, Sys_Printf, Sys_Error } from './src/sys.js';
import { COM_InitArgv } from './src/common.js';
import { Host_Init, Host_Frame, Host_Shutdown } from './src/host.js';
import { COM_FetchPak, COM_AddPack, COM_PreloadMaps } from './src/pak.js';
import { Cbuf_AddText } from './src/cmd.js';
import { cls, cl } from './src/client.js';
import { sv } from './src/server.js';
import { scene, camera } from './src/gl_rmain.js';
import { renderer } from './src/vid.js';
import { Draw_CachePicFromPNG } from './src/gl_draw.js';
import { XR_Init } from './src/webxr.js';
import { walletManager } from './src/wallet.js';

const parms = {
	basedir: '.',
	argc: 0,
	argv: []
};

// Resolve asset base URL: use document <base> so it matches the deployed URL (Vercel, etc.)
function getGameBaseUrl() {
	try {
		var base = typeof document !== 'undefined' && document.querySelector && document.querySelector('base');
		if (base && base.href) {
			var href = base.href;
			return href.endsWith('/') ? href : href + '/';
		}
	} catch (e) {}
	return new URL('./', import.meta.url).href;
}
const GAME_BASE_URL = getGameBaseUrl();

async function main() {

	try {

		Sys_Init();

		COM_InitArgv(parms.argv);

		// Wallet UI setup
		const walletBtn = document.getElementById('wallet-connect-btn');
		const networkChoiceModal = document.getElementById('network-choice-modal');
		if (walletBtn) {
			walletBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				e.preventDefault();
				if (!walletManager.isConnected) {
					networkChoiceModal.style.display = 'block';
				} else {
					document.getElementById('leaderboard-modal').style.display = 'block';
					walletManager.fetchLeaderboard();
				}
			});
		}

		// Prevent wallet area clicks from reaching game
		const walletArea = document.getElementById('wallet-area');
		if (walletArea) {
			walletArea.addEventListener('mousedown', (e) => e.stopPropagation());
			walletArea.addEventListener('click', (e) => e.stopPropagation());
		}

		// Network choice modal - Connect to Soneium
		const connectSoneium = document.getElementById('connect-soneium');
		if (connectSoneium) {
			connectSoneium.addEventListener('click', async (e) => {
				e.stopPropagation();
				networkChoiceModal.style.display = 'none';
				walletManager.setSelectedNetwork('soneium');
				await walletManager.connect();
			});
		}

		// Network choice modal - Cancel
		const networkChoiceCancel = document.getElementById('network-choice-cancel');
		if (networkChoiceCancel) {
			networkChoiceCancel.addEventListener('click', (e) => {
				e.stopPropagation();
				networkChoiceModal.style.display = 'none';
			});
		}

		// Prevent modals from propagating to game
		if (networkChoiceModal) {
			networkChoiceModal.addEventListener('mousedown', (e) => e.stopPropagation());
			networkChoiceModal.addEventListener('click', (e) => e.stopPropagation());
		}
		const modal = document.getElementById('leaderboard-modal');
		if (modal) {
			modal.addEventListener('mousedown', (e) => e.stopPropagation());
			modal.addEventListener('click', (e) => e.stopPropagation());
		}

		// Loading bar and status text
		const loadingProgress = document.getElementById('loading-progress');
		const loadingOverlay = document.getElementById('loading');
		const loadingStatus = document.getElementById('loading-status');

		function setStatus(text) {
			if (loadingStatus) loadingStatus.textContent = text;
		}

		function setProgress(value) {
			if (loadingProgress) {
				loadingProgress.style.width = (value * 100) + '%';
			}
		}

		// Fetch with timeout so we don't hang forever (e.g. if server doesn't serve the file)
		const PAK_TIMEOUT_MS = 60000;
		function fetchPakWithTimeout(url, filename, onProgress) {
			return Promise.race([
				COM_FetchPak(url, filename, onProgress),
				new Promise((_, reject) =>
					setTimeout(() => reject(new Error('Timeout loading ' + filename + ' – is the server serving files from this folder?')), PAK_TIMEOUT_MS)
				)
			]);
		}

		setProgress(0);
		setStatus('Loading pak0.pak…');
		Sys_Printf('Loading pak0.pak...\\n');
		let pak0;
		try {
			pak0 = await fetchPakWithTimeout(GAME_BASE_URL + 'pak0.pak', 'pak0.pak', setProgress);
		} catch (e) {
			console.error('pak0 load error:', e);
			if (loadingOverlay) {
				loadingOverlay.innerHTML = '<div style="padding:24px;text-align:center;color:#d8a956;max-width:480px;">' +
					'<strong>Could not load game data</strong><br><br>' +
					'<span style="color:#aa8;">' + (e.message || e) + '</span><br><br>' +
					'Make sure you run a static server from the <strong>Soniuem Arcade</strong> folder so that <code>/games/Omega_Quake/pak0.pak</code> is served.<br><br>' +
					'Example: <code>npx serve . -p 3000</code> or <code>npx http-server . -p 3000</code><br><br>' +
					'Then open: <code>http://localhost:3000/games/Omega_Quake/</code></div>';
			}
			return;
		}
		if (pak0) {

			COM_AddPack(pak0);
			Sys_Printf('pak0.pak loaded successfully\\n');
			setStatus('Loading pak1.pak…');

			// Optionally load pak1.pak (registered version)
			Sys_Printf('Checking for pak1.pak...\\n');
			try {
				const pak1 = await COM_FetchPak(GAME_BASE_URL + 'pak1.pak', 'pak1.pak', (val) => {
					// Update progress bar for pak1 (50-100% range roughly)
					// This is a simple heuristic; ideally we'd sum total bytes
					if (loadingProgress) {
						loadingProgress.style.width = (50 + (val * 50)) + '%';
					}
				});

				if (pak1) {
					COM_AddPack(pak1);
					Sys_Printf('pak1.pak loaded successfully\\n');
				}
			} catch (e) {
				// pak1.pak is optional (shareware doesn't have it)
				Sys_Printf('pak1.pak not found (shareware mode)\\n');
			}

		} else {
			Sys_Printf('Warning: pak0.pak not found - game data will be missing\\n');
			if (loadingOverlay) {
				loadingOverlay.innerHTML = '<div style="padding:24px;text-align:center;color:#d8a956;max-width:480px;">' +
					'<strong>pak0.pak not found</strong><br><br>' +
					'<span style="color:#aa8;">Tried: ' + (GAME_BASE_URL + 'pak0.pak') + '</span><br><br>' +
					'Your server may not be serving static files from <code>games/Omega_Quake/</code>. Run from the <strong>Soniuem Arcade</strong> root:<br><br>' +
					'<code>npx serve . -p 3000</code> or <code>npx http-server . -p 3000</code><br><br>' +
					'Then open: <code>http://localhost:3000/games/Omega_Quake/</code></div>';
				return;
			}
		}

		// Preload custom deathmatch maps (not in PAK files)
		await COM_PreloadMaps([
			'spinev2',   // Headshot
			'rapture1',  // Danimal
			'naked5',    // Gandhi
			'zed',       // Vondur
			'efdm9',     // Mr Fribbles
			'baldm6',    // Bal
			'edc',       // Tyrann
			'ultrav'     // Escher
		], GAME_BASE_URL + 'maps/');

		setStatus('Starting game…');
		await Host_Init(parms);

		// Remove loading overlay
		if (loadingOverlay) {

			loadingOverlay.remove();

		}

		// Preload custom menu images
		try {

			await Draw_CachePicFromPNG('gfx/continue.lmp', GAME_BASE_URL + 'img/continue.png');
			Sys_Printf('Loaded custom menu images\\n');

		} catch (e) {

			Sys_Printf('Warning: Could not load custom menu images\\n');

		}

		// Check URL parameters for auto-join
		const urlParams = new URLSearchParams(window.location.search);
		const roomId = urlParams.get('room');

		if (roomId) {

			const serverUrl = urlParams.get('server') || 'https://wts.mrdoob.com:4433';
			const connectUrl = serverUrl + '?room=' + encodeURIComponent(roomId);
			Sys_Printf('Auto-joining room: %s\\n', roomId);
			Cbuf_AddText('connect "' + connectUrl + '"\n');

		}

		// Initialize WebXR (creates rig, offers VR session — must be after Host_Init)
		XR_Init(scene);

		// Expose for debugging
		window.Cbuf_AddText = Cbuf_AddText;
		window.cls = cls;
		window.cl = cl;
		window.sv = sv;
		window.scene = scene;
		Object.defineProperty(window, 'camera', { get: () => camera });
		Object.defineProperty(window, 'renderer', { get: () => renderer });

		let oldtime = performance.now() / 1000;

		// Use renderer.setAnimationLoop instead of requestAnimationFrame.
		// This is required for WebXR — Three.js automatically switches to
		// xrSession.requestAnimationFrame when a VR session is active.
		// In non-XR mode, behavior is identical to regular rAF.
		renderer.setAnimationLoop(function (timestamp) {

			const newtime = timestamp / 1000;
			const time = newtime - oldtime;
			oldtime = newtime;

			Host_Frame(time);

		});

	} catch (e) {
		console.error('Omega Quake Fatal Error:', e);
		const loadingOverlay = document.getElementById('loading');
		if (loadingOverlay) {
			loadingOverlay.innerHTML = '<div style="padding:24px;text-align:center;color:#d8a956;max-width:480px;">' +
				'<strong>Failed to load</strong><br><br><span style="color:#aa8;">' + (e.message || e) + '</span><br><br>' +
				'Run from the Soniuem Arcade folder: <code>npx serve . -p 3000</code> then open <code>http://localhost:3000/games/Omega_Quake/</code></div>';
		}
		Sys_Error(e.message);
	}

}

main();
