// Network configurations for Omega and Soneium
const NETWORK_CONFIGS = {
    omega: {
        chainId: '0x4e4542bc', // 1313161916
        chainName: 'Omega Network',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://0x4e4542bc.rpc.aurora-cloud.dev'],
        blockExplorerUrls: ['https://0x4e4542bc.explorer.aurora-cloud.dev'],
        contractAddress: '0x3b8FaC84F93bc0949aAC12eceEB91247bFdd2959',
    },
    soneium: {
        chainId: '0x74c', // 1868
        chainName: 'Soneium',
        nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://soneium.drpc.org', 'https://rpc.sentio.xyz/soneium-mainnet', 'https://rpc.soneium.org'],
        blockExplorerUrls: ['https://soneium.blockscout.com', 'https://www.okx.com/web3/explorer/soneium', 'https://soneium.slam.vision'],
        contractAddress: '0x0000000000000000000000000000000000000000', // Deploy contracts/SoneiumArcadeLeaderboard.sol and set here
    }
};

export class WalletManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.isConnected = false;
        this.selectedNetwork = 'soneium'; // 'omega' | 'soneium'
    }

    setSelectedNetwork(networkKey) {
        if (networkKey === 'omega' || networkKey === 'soneium') {
            this.selectedNetwork = networkKey;
            this.updateUI();
        }
    }

    getContractAddress() {
        return NETWORK_CONFIGS[this.selectedNetwork].contractAddress;
    }

    getNetworkConfig() {
        return NETWORK_CONFIGS[this.selectedNetwork];
    }

    async connect() {
        if (typeof window.ethereum === 'undefined') {
            console.error('MetaMask is not installed!');
            alert('Please install MetaMask to use this feature.');
            return false;
        }

        try {
            await this.checkNetwork(this.selectedNetwork);

            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            this.address = accounts[0];
            this.isConnected = true;

            console.log('Wallet connected:', this.address, 'on', this.getNetworkConfig().chainName);
            this.updateUI();

            this.fetchLeaderboard();

            return true;
        } catch (error) {
            console.error('User denied account access or error occurred:', error);
            const msg = error?.message || String(error);
            if (error?.code === 4001) {
                alert('Connection was rejected. Please approve the request in your wallet.');
            } else {
                alert('Failed to connect: ' + msg);
            }
            return false;
        }
    }

    async checkNetwork(networkKey) {
        const config = NETWORK_CONFIGS[networkKey];
        if (!config) return;

        const networkParams = {
            chainId: config.chainId,
            chainName: config.chainName,
            nativeCurrency: config.nativeCurrency,
            rpcUrls: config.rpcUrls,
            blockExplorerUrls: config.blockExplorerUrls
        };

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: config.chainId }],
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [networkParams],
                    });
                } catch (addError) {
                    console.error('Failed to add ' + config.chainName + ':', addError);
                    if (addError.code === 4001) {
                        throw new Error('You rejected adding ' + config.chainName + '. Please add the network to connect.');
                    }
                    alert('Could not add ' + config.chainName + ' to MetaMask. Please add it manually.');
                    throw addError;
                }
            } else if (switchError.code === 4001) {
                throw new Error('You rejected switching to ' + config.chainName + '. Please approve the network switch.');
            } else {
                console.error('Failed to switch to ' + config.chainName + ':', switchError);
            }
        }
    }

    updateUI() {
        const walletBtn = document.getElementById('wallet-connect-btn');
        if (walletBtn) {
            if (this.isConnected) {
                const shortAddress = `${this.address.substring(0, 6)}...${this.address.substring(38)}`;
                walletBtn.textContent = shortAddress;
                walletBtn.classList.add('connected');
            } else {
                walletBtn.textContent = 'Connect Wallet';
                walletBtn.classList.remove('connected');
            }
        }
        // Update leaderboard title
        const title = document.getElementById('leaderboard-title');
        if (title) title.textContent = this.getNetworkConfig().chainName + ' Leaderboard';
    }

    async submitScore(score) {
        if (!this.isConnected) {
            console.error('Wallet not connected');
            return;
        }

        const contractAddress = this.getContractAddress();

        const GAME_ID_QUAKE = 0;
        const unifiedAbi = [
            "function submitScore(uint8 gameId, uint256 _score) external",
            "event NewHighScore(uint8 indexed gameId, address indexed player, uint256 score)",
            "event ScoreSubmitted(uint8 indexed gameId, address indexed player, uint256 score, uint256 timestamp)"
        ];
        const omegaAbi = [
            "function submitScore(uint256 _score) external",
            "event NewHighScore(address indexed player, uint256 score)",
            "event ScoreSubmitted(address indexed player, uint256 score, uint256 timestamp)"
        ];
        const abi = this.selectedNetwork === 'soneium' ? unifiedAbi : omegaAbi;

        try {
            // Check if contract address is valid
            if (!ethers.isAddress(contractAddress) || contractAddress === "0x0000000000000000000000000000000000000000") {
                console.warn("Contract address not set or invalid. Saving locally/simulating.");
                alert(`Leaderboard contract not deployed on ${this.getNetworkConfig().chainName} yet.\n\nSimulating score submission: ${score}`);
                return;
            }

            const contract = new ethers.Contract(contractAddress, abi, this.signer);

            console.log(`Submitting score: ${score} to contract at ${contractAddress}`);
            const tx = this.selectedNetwork === 'soneium'
                ? await contract.submitScore(GAME_ID_QUAKE, score)
                : await contract.submitScore(score);
            console.log('Transaction sent:', tx.hash);

            alert(`Score ${score} submitted! Transaction Hash: ${tx.hash.substring(0, 20)}...`);

            // Wait for confirmation
            await tx.wait();
            console.log('Transaction confirmed');

            // Refresh leaderboard
            this.fetchLeaderboard();

            return tx;
        } catch (error) {
            console.error('Error submitting score to contract:', error);
            alert(`Failed to submit score: ${error.message}`);
        }
    }

    async fetchLeaderboard() {
        const list = document.getElementById('scores-list');
        const modal = document.getElementById('leaderboard-modal');

        const showError = (msg) => {
            if (list) list.innerHTML = '<div class="score-entry"><span>' + msg + '</span></div>';
            if (modal) modal.style.display = 'block';
        };

        if (!this.isConnected || !this.provider) {
            showError('Connect wallet to view leaderboard');
            return;
        }

        const contractAddress = this.getContractAddress();
        if (!ethers.isAddress(contractAddress) || contractAddress === "0x0000000000000000000000000000000000000000") {
            showError('Leaderboard not deployed on ' + this.getNetworkConfig().chainName);
            return;
        }

        // Show loading
        if (list) list.innerHTML = '<div class="score-entry"><span>Loading...</span></div>';
        if (modal) modal.style.display = 'block';

        const GAME_ID_QUAKE = 0;
        const unifiedAbi = ["event ScoreSubmitted(uint8 indexed gameId, address indexed player, uint256 score, uint256 timestamp)"];
        const omegaAbi = ["event ScoreSubmitted(address indexed player, uint256 score, uint256 timestamp)"];

        try {
            let events;
            let isUnified = false;
            if (this.selectedNetwork === 'soneium') {
                isUnified = true;
                const contract = new ethers.Contract(contractAddress, unifiedAbi, this.provider);
                const config = this.getNetworkConfig();
                const readProvider = new ethers.JsonRpcProvider(config.rpcUrls[0]);
                const currentBlock = await readProvider.getBlockNumber();
                const chunkSize = 999;
                const lookbackBlocks = 5000;
                const fromBlock = Math.max(0, currentBlock - lookbackBlocks);
                const topic = ethers.id("ScoreSubmitted(uint8,address,uint256,uint256)");
                const allLogs = [];
                for (let from = fromBlock; from <= currentBlock; from += chunkSize) {
                    const to = Math.min(from + chunkSize - 1, currentBlock);
                    const logs = await readProvider.getLogs({
                        address: contractAddress,
                        topics: [topic],
                        fromBlock: from,
                        toBlock: to
                    });
                    allLogs.push(...logs);
                }
                events = allLogs.map(log => {
                    const parsed = contract.interface.parseLog({ topics: log.topics, data: log.data });
                    if (!parsed || Number(parsed.args[0]) !== GAME_ID_QUAKE) return null;
                    return { args: parsed.args };
                }).filter(Boolean);
            } else {
                const contract = new ethers.Contract(contractAddress, omegaAbi, this.provider);
                events = await contract.queryFilter(contract.filters.ScoreSubmitted());
            }

            const highScores = {};
            events.forEach(event => {
                const player = isUnified ? event.args[1] : event.args[0];
                const score = Number(isUnified ? event.args[2] : event.args[1]);
                if (!highScores[player] || score > highScores[player]) {
                    highScores[player] = score;
                }
            });

            const sortedScores = Object.entries(highScores)
                .map(([player, score]) => ({ player, score }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);

            if (list) {
                list.innerHTML = '';
                if (sortedScores.length === 0) {
                    list.innerHTML = '<div class="score-entry"><span>No scores yet</span></div>';
                }
                sortedScores.forEach((entry, index) => {
                    const shortAddr = `${entry.player.substring(0, 6)}...${entry.player.substring(38)}`;
                    const div = document.createElement('div');
                    div.className = 'score-entry';
                    if (entry.player.toLowerCase() === this.address.toLowerCase()) {
                        div.style.color = '#fff';
                        div.style.textShadow = '0 0 5px #d8a956';
                    }
                    div.innerHTML = `<span>${index + 1}. ${shortAddr}</span><span>${entry.score}</span>`;
                    list.appendChild(div);
                });
            }

        } catch (error) {
            console.error("Failed to fetch leaderboard", error);
            showError('Failed to load: ' + (error.message || String(error)));
        }
    }
}

export const walletManager = new WalletManager();
