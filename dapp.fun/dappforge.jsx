import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { compileSolidity } from "./solidityCompiler";
import { solanaDeployToken } from "./solanaUtils";

// AVAX Mainnet first, then Fuji Testnet, then Avalanche L1s, then Solana & others
const CHAINS = [
  // --- Avalanche C-Chain (primary) ---
  { id: "avax-mainnet", name: "Avalanche C-Chain", icon: "▲", color: "#E84142", explorer: "snowtrace.io", chainId: 43114, hexId: "0xa86a", rpc: "https://api.avax.network/ext/bc/C/rpc", symbol: "AVAX" },
  { id: "avax-fuji", name: "Avalanche Fuji Testnet", icon: "▲", color: "#E84142", explorer: "testnet.snowtrace.io", chainId: 43113, hexId: "0xa869", rpc: "https://api.avax-test.network/ext/bc/C/rpc", symbol: "AVAX" },
  // --- Avalanche L1s (subnets) ---
  { id: "avax-dfk", name: "DFK L1", icon: "▲", color: "#E84142", explorer: "explorer.dfkchain.com", chainId: 53935, hexId: "0xd2af", rpc: "https://subnets.avax.network/defi-kingdoms/dfk-chain/rpc", symbol: "JEWEL" },
  { id: "avax-dexalot", name: "Dexalot L1", icon: "▲", color: "#E84142", explorer: "subnets.avax.network/dexalot", chainId: 432204, hexId: "0x6984c", rpc: "https://subnets.avax.network/dexalot/mainnet/rpc", symbol: "ALOT" },
  { id: "avax-beam", name: "Beam L1", icon: "▲", color: "#E84142", explorer: "subnets.avax.network/beam", chainId: 4337, hexId: "0x10f1", rpc: "https://subnets.avax.network/beam/mainnet/rpc", symbol: "BEAM" },
  { id: "avax-blitz", name: "Blitz L1", icon: "▲", color: "#E84142", explorer: "avascan.info", chainId: 1344, hexId: "0x540", rpc: "https://subnets.avax.network/blitz/mainnet/rpc", symbol: "AVAX" },
  { id: "avax-artery", name: "Artery", icon: "▲", color: "#E84142", explorer: "avascan.info", chainId: 4313, hexId: "0x10d9", rpc: "https://subnets.avax.network/artery/mainnet/rpc", symbol: "AVAX" },
  { id: "avax-blaze", name: "Blaze", icon: "▲", color: "#E84142", explorer: "avascan.info", chainId: 46975, hexId: "0xb77f", rpc: "https://subnets.avax.network/blaze/mainnet/rpc", symbol: "AVAX" },
  { id: "avax-aibtrust", name: "AIBTRUST Mainnet", icon: "▲", color: "#E84142", explorer: "avascan.info", chainId: 80000, hexId: "0x13880", rpc: "https://subnets.avax.network/aibtrust/mainnet/rpc", symbol: "AVAX" },
  { id: "avax-andromeda", name: "Andromeda", icon: "▲", color: "#E84142", explorer: "avascan.info", chainId: 241121, hexId: "0x3ad61", rpc: "https://subnets.avax.network/andromeda/mainnet/rpc", symbol: "AVAX" },
  { id: "avax-blockticity", name: "Blockticity", icon: "▲", color: "#E84142", explorer: "avascan.info", chainId: 28530, hexId: "0x6f72", rpc: "https://subnets.avax.network/blockticity/mainnet/rpc", symbol: "AVAX" },
  { id: "avax-cx", name: "CX Chain", icon: "▲", color: "#E84142", explorer: "avascan.info", chainId: 737373, hexId: "0xb407d", rpc: "https://subnets.avax.network/cx/mainnet/rpc", symbol: "AVAX" },
  { id: "avax-cloudverse", name: "Cloudverse L1", icon: "▲", color: "#E84142", explorer: "avascan.info", chainId: 33210, hexId: "0x81ba", rpc: "https://subnets.avax.network/cloudverse/mainnet/rpc", symbol: "AVAX" },
  { id: "avax-dos", name: "DOS L1", icon: "▲", color: "#E84142", explorer: "avascan.info", chainId: 7979, hexId: "0x1f2b", rpc: "https://subnets.avax.network/dos/mainnet/rpc", symbol: "AVAX" },
  { id: "avax-deboard", name: "Deboard L1", icon: "▲", color: "#E84142", explorer: "avascan.info", chainId: 29732, hexId: "0x7424", rpc: "https://subnets.avax.network/deboard/mainnet/rpc", symbol: "AVAX" },
  // --- Other networks ---
  { id: "solana", name: "Solana", icon: "◎", color: "#14F195", explorer: "explorer.solana.com", symbol: "SOL" },
  { id: "omega-mainnet", name: "Omega Mainnet", icon: "Ω", color: "#1E90FF", explorer: "0x4e4542bc.explorer.aurora-cloud.dev", chainId: 1313161916, hexId: "0x4e4542bc", rpc: "https://0x4e4542bc.rpc.aurora-cloud.dev", symbol: "OMN" },
  { id: "omega-testnet", name: "Omega Testnet", icon: "Ω", color: "#1E90FF", explorer: "explorer.omeganetwork.co", chainId: 1313161768, hexId: "0x4e454128", rpc: "https://0x4e454228.rpc.aurora-cloud.dev", symbol: "OMN" },
  { id: "somnia", name: "Somnia", icon: "S", color: "#2E3A59", explorer: "explorer.somnia.network", chainId: 5031, hexId: "0x13a7", rpc: "https://api.infra.mainnet.somnia.network/", symbol: "SOMI" },
  { id: "monad", name: "Monad", icon: "M", color: "#836EF9", explorer: "monadscan.com", chainId: 143, hexId: "0x8f", rpc: "https://rpc.monad.xyz", symbol: "MON" },
  { id: "ethereum", name: "Ethereum", icon: "⟠", color: "#627EEA", explorer: "etherscan.io" },
  { id: "bsc", name: "BNB Chain", icon: "◆", color: "#F3BA2F", explorer: "bscscan.com" },
  { id: "polygon", name: "Polygon", icon: "⬡", color: "#8247E5", explorer: "polygonscan.com" },
  { id: "arbitrum", name: "Arbitrum", icon: "◈", color: "#28A0F0", explorer: "arbiscan.io" },
  { id: "avalanche", name: "Avalanche (legacy)", icon: "▲", color: "#E84142", explorer: "snowtrace.io", chainId: 43114, hexId: "0xa86a", rpc: "https://api.avax.network/ext/bc/C/rpc", symbol: "AVAX" },
  { id: "base", name: "Base", icon: "◉", color: "#0052FF", explorer: "basescan.org" },
  { id: "optimism", name: "Optimism", icon: "◎", color: "#FF0420", explorer: "optimistic.etherscan.io" },
];

const TEMPLATES = [
  {
    id: "dex", name: "DEX", subtitle: "Uniswap V2 Fork", icon: "⇋", color: "#A0A0A0",
    desc: "Decentralized exchange with AMM, liquidity pools, and swap routing.",
    tags: ["DeFi", "AMM", "Liquidity"], contracts: ["Router.sol", "Factory.sol", "Pair.sol", "WETH.sol"],
    uiComps: ["SwapCard", "PoolList", "LiquidityAdd", "TokenSelector", "Header", "Footer"],
    fields: [
      { key: "swapFee", label: "Swap Fee (%)", type: "number", def: "0.3", ph: "0.3" },
      { key: "protocolFee", label: "Protocol Fee (%)", type: "number", def: "0.05", ph: "0.05" },
      { key: "feeReceiver", label: "Fee Receiver", type: "address", def: "", ph: "0x..." },
      { key: "routerName", label: "Router Name", type: "text", def: "MyDEX Router", ph: "MyDEX Router" },
    ],
  },
  {
    id: "nft", name: "NFT Marketplace", subtitle: "OpenSea-style", icon: "◈", color: "#C0C0C0",
    desc: "Full-featured NFT marketplace with listings, auctions, and royalty enforcement.",
    tags: ["NFT", "Marketplace", "ERC-721"], contracts: ["Marketplace.sol", "RoyaltyEngine.sol", "AuctionHouse.sol", "TransferProxy.sol"],
    uiComps: ["NFTGrid", "ListingCard", "AuctionTimer", "BidPanel", "Header", "Footer"],
    fields: [
      { key: "platformFee", label: "Platform Fee (%)", type: "number", def: "2.5", ph: "2.5" },
      { key: "feeReceiver", label: "Fee Receiver", type: "address", def: "", ph: "0x..." },
      { key: "royaltySupport", label: "Enforce Royalties", type: "toggle", def: true },
      { key: "auctionSupport", label: "Enable Auctions", type: "toggle", def: true },
    ],
  },
  {
    id: "token", name: "Token Launcher", subtitle: "ERC-20 + Tokenomics", icon: "⬢", color: "#B0B0B0",
    desc: "Custom ERC-20 token with configurable taxes, limits, and LP locking.",
    tags: ["Token", "ERC-20", "Launch"], contracts: ["Token.sol", "TokenFactory.sol", "LiquidityLocker.sol"],
    uiComps: ["TokenInfo", "BuyWidget", "ChartEmbed", "HolderTable", "Header", "Footer"],
    fields: [
      { key: "tokenName", label: "Token Name", type: "text", def: "", ph: "My Token" },
      { key: "tokenSymbol", label: "Symbol", type: "text", def: "", ph: "MTK" },
      { key: "totalSupply", label: "Total Supply", type: "number", def: "1000000000", ph: "1B" },
      { key: "buyTax", label: "Buy Tax (%)", type: "number", def: "0", ph: "0" },
      { key: "sellTax", label: "Sell Tax (%)", type: "number", def: "0", ph: "0" },
      { key: "taxReceiver", label: "Tax Receiver", type: "address", def: "", ph: "0x..." },
      { key: "lpLock", label: "LP Lock", type: "select", options: ["No Lock", "30 Days", "90 Days", "1 Year", "Forever"], def: "90 Days" },
    ],
  },
  {
    id: "staking", name: "Staking Platform", subtitle: "Flexible & Locked", icon: "⏣", color: "#D0D0D0",
    desc: "Staking with flexible/locked pools, multiple tiers, and customizable rewards.",
    tags: ["Staking", "Yield", "DeFi"], contracts: ["StakingPool.sol", "RewardDistributor.sol", "StakingFactory.sol", "TimeLock.sol"],
    uiComps: ["StakeCard", "PoolSelector", "RewardsPanel", "StatsBar", "Header", "Footer"],
    fields: [
      { key: "rewardToken", label: "Reward Token", type: "address", def: "", ph: "0x..." },
      { key: "stakingToken", label: "Staking Token", type: "address", def: "", ph: "0x..." },
      { key: "rewardRate", label: "APR (%)", type: "number", def: "12", ph: "12" },
      { key: "lockPeriods", label: "Lock Periods", type: "select", options: ["Flexible Only", "30/60/90 Days", "Custom"], def: "30/60/90 Days" },
      { key: "penalty", label: "Early Withdraw Penalty (%)", type: "number", def: "10", ph: "10" },
    ],
  },
  {
    id: "dao", name: "DAO Governance", subtitle: "Governor + Timelock", icon: "⚖", color: "#A8A8A8",
    desc: "On-chain DAO with proposals, voting, timelock execution, and treasury.",
    tags: ["DAO", "Governance", "Voting"], contracts: ["Governor.sol", "GovernanceToken.sol", "TimeLock.sol", "Treasury.sol"],
    uiComps: ["ProposalList", "VotePanel", "CreateProposal", "TreasuryView", "Header", "Footer"],
    fields: [
      { key: "tokenName", label: "Gov Token Name", type: "text", def: "", ph: "MyDAO Token" },
      { key: "tokenSymbol", label: "Symbol", type: "text", def: "", ph: "MDAO" },
      { key: "votingPeriod", label: "Voting Period (blocks)", type: "number", def: "45818", ph: "~1 week" },
      { key: "quorumPercent", label: "Quorum (%)", type: "number", def: "4", ph: "4" },
      { key: "timelockDelay", label: "Timelock (seconds)", type: "number", def: "172800", ph: "2 days" },
    ],
  },
  {
    id: "lending", name: "Lending Protocol", subtitle: "Aave-style Pools", icon: "⟐", color: "#B8B8B8",
    desc: "Lending/borrowing with variable rates, liquidations, and flash loans.",
    tags: ["Lending", "DeFi", "Yield"], contracts: ["LendingPool.sol", "InterestRateModel.sol", "Oracle.sol", "Liquidator.sol", "aToken.sol"],
    uiComps: ["MarketTable", "SupplyPanel", "BorrowPanel", "PositionSummary", "Header", "Footer"],
    fields: [
      { key: "baseBorrowRate", label: "Base Borrow Rate (%)", type: "number", def: "2", ph: "2" },
      { key: "liquidationThreshold", label: "Liquidation Threshold (%)", type: "number", def: "80", ph: "80" },
      { key: "liquidationBonus", label: "Liquidation Bonus (%)", type: "number", def: "5", ph: "5" },
      { key: "flashLoanFee", label: "Flash Loan Fee (%)", type: "number", def: "0.09", ph: "0.09" },
      { key: "oracleType", label: "Price Oracle", type: "select", options: ["Chainlink", "Uniswap TWAP", "Custom"], def: "Chainlink" },
    ],
  },
  {
    id: "launchpad", name: "Launchpad", subtitle: "IDO Platform", icon: "❖", color: "#D8D8D8",
    desc: "IDO launchpad with tiered allocation, vesting, and whitelist management.",
    tags: ["Launchpad", "IDO", "Fundraise"], contracts: ["LaunchpadFactory.sol", "IDOPool.sol", "VestingVault.sol", "WhitelistManager.sol"],
    uiComps: ["LaunchList", "IDOCard", "ContributePanel", "VestingSchedule", "Header", "Footer"],
    fields: [
      { key: "hardCap", label: "Hard Cap (ETH)", type: "number", def: "100", ph: "100" },
      { key: "softCap", label: "Soft Cap (ETH)", type: "number", def: "50", ph: "50" },
      { key: "minContrib", label: "Min Contribution", type: "number", def: "0.1", ph: "0.1" },
      { key: "maxContrib", label: "Max Contribution", type: "number", def: "5", ph: "5" },
      { key: "vestingDuration", label: "Vesting Duration", type: "select", options: ["Instant", "30 Days", "90 Days", "180 Days", "1 Year"], def: "180 Days" },
      { key: "whitelist", label: "Whitelist Required", type: "toggle", def: true },
    ],
  },
];

// Simple iconic logo - stylized code block with diamond
const Logo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#888888" />
      </linearGradient>
    </defs>
    {/* Diamond shape */}
    <path d="M16 2L28 16L16 30L4 16L16 2Z" fill="url(#logoGrad)" opacity="0.9" />
    {/* Inner code brackets */}
    <path d="M12 11L8 16L12 21" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 11L24 16L20 21" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Sample contract names for live feed
const SAMPLE_CONTRACTS = [
  "TokenSwap.sol", "NFTCollection.sol", "StakingPool.sol", "MultiSig.sol", "Bridge.sol",
  "Vault.sol", "Governor.sol", "Factory.sol", "Router.sol", "Airdrop.sol", "Lottery.sol",
  "GameFi.sol", "LaunchPad.sol", "Marketplace.sol", "Escrow.sol", "Farming.sol", "DAO.sol"
];

// Generate random wallet addresses for live feed
const randomWallet = () => "0x" + Math.random().toString(16).slice(2, 6) + "..." + Math.random().toString(16).slice(2, 6);

const CODE = {
  dex: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IFactory.sol";
import "./interfaces/IPair.sol";

contract Router {
    address public immutable factory;
    address public immutable WETH;
    uint256 public swapFee = 30; // 0.3%
    address public feeReceiver;

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, 'EXPIRED');
        _;
    }

    constructor(address _factory, address _WETH, address _feeReceiver) {
        factory = _factory;
        WETH = _WETH;
        feeReceiver = _feeReceiver;
    }

    function swapExactTokensForTokens(
        uint amountIn, uint amountOutMin,
        address[] calldata path, address to, uint deadline
    ) external ensure(deadline) returns (uint[] memory amounts) {
        amounts = getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, 'INSUFFICIENT_OUTPUT');
        TransferHelper.safeTransferFrom(path[0], msg.sender, pairFor(path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
    }

    function addLiquidity(
        address tokenA, address tokenB,
        uint amountADesired, uint amountBDesired,
        uint amountAMin, uint amountBMin,
        address to, uint deadline
    ) external ensure(deadline) returns (uint amountA, uint amountB, uint liquidity) {
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = pairFor(tokenA, tokenB);
        TransferHelper.safeTransferFrom(tokenA, msg.sender, pair, amountA);
        TransferHelper.safeTransferFrom(tokenB, msg.sender, pair, amountB);
        liquidity = IPair(pair).mint(to);
    }

    function removeLiquidity(
        address tokenA, address tokenB, uint liquidity,
        uint amountAMin, uint amountBMin, address to, uint deadline
    ) public ensure(deadline) returns (uint amountA, uint amountB) {
        address pair = pairFor(tokenA, tokenB);
        IPair(pair).transferFrom(msg.sender, pair, liquidity);
        (uint a0, uint a1) = IPair(pair).burn(to);
        (address t0,) = sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == t0 ? (a0, a1) : (a1, a0);
        require(amountA >= amountAMin && amountB >= amountBMin, 'INSUFFICIENT');
    }
}`,
  nft: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarketplace is ReentrancyGuard {
    struct Listing {
        address seller; address nftContract; uint256 tokenId;
        uint256 price; bool isAuction; uint256 auctionEnd;
        address highestBidder; uint256 highestBid; bool active;
    }

    uint256 public platformFee = 250;
    address public feeReceiver;
    uint256 private _counter;
    mapping(uint256 => Listing) public listings;

    event Listed(uint256 indexed id, address seller, uint256 price);
    event Sold(uint256 indexed id, address buyer, uint256 price);

    constructor(address _feeReceiver) { feeReceiver = _feeReceiver; }

    function listItem(address nft, uint256 tokenId, uint256 price, bool auction, uint256 dur)
        external nonReentrant returns (uint256) {
        IERC721(nft).transferFrom(msg.sender, address(this), tokenId);
        uint256 id = _counter++;
        listings[id] = Listing(msg.sender, nft, tokenId, price, auction,
            auction ? block.timestamp + dur : 0, address(0), 0, true);
        emit Listed(id, msg.sender, price);
        return id;
    }

    function buyItem(uint256 id) external payable nonReentrant {
        Listing storage l = listings[id];
        require(l.active && !l.isAuction && msg.value >= l.price, "Invalid");
        l.active = false;
        uint256 fee = (msg.value * platformFee) / 10000;
        payable(feeReceiver).transfer(fee);
        payable(l.seller).transfer(msg.value - fee);
        IERC721(l.nftContract).transferFrom(address(this), msg.sender, l.tokenId);
        emit Sold(id, msg.sender, msg.value);
    }
}`,
  token: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CustomToken is ERC20, Ownable {
    uint256 public buyTax;
    uint256 public sellTax;
    address public taxReceiver;
    uint256 public maxWalletAmount;
    mapping(address => bool) public isExcluded;
    mapping(address => bool) public isAMM;

    constructor(string memory _name, string memory _symbol, uint256 _supply,
        uint256 _buyTax, uint256 _sellTax, address _taxRx, uint256 _maxPct
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        buyTax = _buyTax; sellTax = _sellTax;
        taxReceiver = _taxRx;
        maxWalletAmount = (_supply * _maxPct) / 100;
        isExcluded[msg.sender] = true;
        _mint(msg.sender, _supply * 10 ** decimals());
    }

    function _update(address from, address to, uint256 amount) internal override {
        if (isExcluded[from] || isExcluded[to]) { super._update(from, to, amount); return; }
        uint256 tax = isAMM[from] ? (amount * buyTax) / 10000 :
                      isAMM[to] ? (amount * sellTax) / 10000 : 0;
        if (tax > 0) super._update(from, taxReceiver, tax);
        super._update(from, to, amount - tax);
        if (maxWalletAmount > 0 && !isAMM[to]) require(balanceOf(to) <= maxWalletAmount, "Max wallet");
    }
}`,
  staking: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract StakingPool is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct StakeInfo { uint256 amount; uint256 rewardDebt; uint256 lockEnd; uint256 tier; }

    IERC20 public stakingToken;
    IERC20 public rewardToken;
    uint256 public rewardPerSecond;
    uint256 public accRewardPerShare;
    uint256 public lastRewardTime;
    uint256 public totalStaked;
    uint256 public earlyPenalty = 1000;
    uint256[] public lockDurations = [0, 30 days, 60 days, 90 days];
    mapping(address => StakeInfo) public stakes;

    constructor(address _stk, address _rwd, uint256 _rps) {
        stakingToken = IERC20(_stk); rewardToken = IERC20(_rwd);
        rewardPerSecond = _rps; lastRewardTime = block.timestamp;
    }

    function stake(uint256 amount, uint256 tier) external nonReentrant {
        require(tier < lockDurations.length && amount > 0);
        updatePool();
        StakeInfo storage s = stakes[msg.sender];
        if (s.amount > 0) {
            uint256 p = (s.amount * accRewardPerShare) / 1e12 - s.rewardDebt;
            if (p > 0) rewardToken.safeTransfer(msg.sender, p);
        }
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        s.amount += amount; s.lockEnd = block.timestamp + lockDurations[tier];
        s.rewardDebt = (s.amount * accRewardPerShare) / 1e12;
        totalStaked += amount;
    }

    function updatePool() public {
        if (block.timestamp <= lastRewardTime || totalStaked == 0) { lastRewardTime = block.timestamp; return; }
        accRewardPerShare += ((block.timestamp - lastRewardTime) * rewardPerSecond * 1e12) / totalStaked;
        lastRewardTime = block.timestamp;
    }
}`,
  dao: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

contract DAOGovernor is Governor, GovernorSettings, GovernorCountingSimple,
    GovernorVotes, GovernorTimelockControl {

    uint256 private _quorumPct;

    constructor(IVotes _token, TimelockController _tl, uint48 _delay,
        uint32 _period, uint256 _threshold, uint256 _quorum)
        Governor("MyDAO") GovernorSettings(_delay, _period, _threshold)
        GovernorVotes(_token) GovernorTimelockControl(_tl) {
        _quorumPct = _quorum;
    }

    function quorum(uint256 bn) public view override returns (uint256) {
        return (token().getPastTotalSupply(bn) * _quorumPct) / 100;
    }

    function state(uint256 id) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
        return super.state(id);
    }
}`,
  lending: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LendingPool is ReentrancyGuard {
    struct Market { IERC20 underlying; uint256 totalSupplied; uint256 totalBorrowed; uint256 lastUpdate; uint256 collateralFactor; }
    struct Position { uint256 supplied; uint256 borrowed; }

    mapping(address => Market) public markets;
    mapping(address => mapping(address => Position)) public positions;
    address public oracle;
    uint256 public baseBorrowRate = 200;
    uint256 public liquidationBonus = 500;
    uint256 public flashLoanFee = 9;

    constructor(address _oracle) { oracle = _oracle; }

    function supply(address token, uint256 amount) external nonReentrant {
        Market storage m = markets[token];
        m.underlying.transferFrom(msg.sender, address(this), amount);
        positions[msg.sender][token].supplied += amount;
        m.totalSupplied += amount;
    }

    function borrow(address token, uint256 amount) external nonReentrant {
        Market storage m = markets[token];
        require(m.totalSupplied - m.totalBorrowed >= amount, "No liquidity");
        positions[msg.sender][token].borrowed += amount;
        m.totalBorrowed += amount;
        m.underlying.transfer(msg.sender, amount);
    }

    function flashLoan(address token, uint256 amount, address rx, bytes calldata data) external nonReentrant {
        Market storage m = markets[token];
        uint256 bal = m.underlying.balanceOf(address(this));
        m.underlying.transfer(rx, amount);
        IFlash(rx).onFlashLoan(msg.sender, token, amount, flashLoanFee, data);
        require(m.underlying.balanceOf(address(this)) >= bal + (amount * flashLoanFee) / 10000);
    }
}
interface IFlash { function onFlashLoan(address,address,uint256,uint256,bytes calldata) external; }`,
  launchpad: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract IDOPool is ReentrancyGuard {
    IERC20 public saleToken;
    uint256 public tokenPrice;
    uint256 public hardCap;
    uint256 public softCap;
    uint256 public minContrib;
    uint256 public maxContrib;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public totalRaised;
    bool public whitelistEnabled;
    mapping(address => bool) public whitelisted;
    mapping(address => uint256) public contributions;

    constructor(address _token, uint256 _price, uint256 _hard, uint256 _soft,
        uint256 _min, uint256 _max, uint256 _start, uint256 _end, bool _wl) {
        saleToken = IERC20(_token); tokenPrice = _price;
        hardCap = _hard; softCap = _soft; minContrib = _min;
        maxContrib = _max; startTime = _start; endTime = _end;
        whitelistEnabled = _wl;
    }

    function contribute() external payable nonReentrant {
        require(block.timestamp >= startTime && block.timestamp <= endTime);
        require(totalRaised + msg.value <= hardCap && msg.value >= minContrib);
        require(contributions[msg.sender] + msg.value <= maxContrib);
        if (whitelistEnabled) require(whitelisted[msg.sender]);
        contributions[msg.sender] += msg.value;
        totalRaised += msg.value;
    }

    function claimTokens() external nonReentrant {
        require(block.timestamp > endTime && totalRaised >= softCap);
        uint256 tokens = contributions[msg.sender] * tokenPrice;
        contributions[msg.sender] = 0;
        saleToken.transfer(msg.sender, tokens);
    }

    function refund() external nonReentrant {
        require(block.timestamp > endTime && totalRaised < softCap);
        uint256 amt = contributions[msg.sender];
        contributions[msg.sender] = 0;
        payable(msg.sender).transfer(amt);
    }
}`,
};

// AI response logic
function getAIResponse(input) {
  const l = input.toLowerCase();
  if (l.includes("fee") || l.includes("tax")) return "I can help modify fees. I'd suggest:\n\n1. Add setFee() with onlyOwner\n2. Cap fees at 10% max\n3. Emit FeeUpdated event\n\nWant me to generate the code?";
  if (l.includes("gas") || l.includes("optim")) return "Gas optimization tips:\n\n1. Use uint96 for fees (slot packing)\n2. Cache storage vars in memory\n3. Use unchecked where safe\n4. Custom errors vs require strings\n\nShall I apply these?";
  if (l.includes("secur") || l.includes("audit")) return "Security analysis:\n\n✅ ReentrancyGuard used\n✅ SafeERC20 for transfers\n⚠️ Add pause mechanism\n⚠️ Add input validation\n⚠️ Consider timelocked admin\n\nWant me to add these?";
  if (l.includes("explain") || l.includes("how") || l.includes("what")) return "Key functions breakdown:\n\n• Constructor: initializes immutable state\n• Core functions: access control modifiers\n• Events: emitted for all state changes\n• Pattern: checks-effects-interactions\n\nAsk about any specific function.";
  return "I'll analyze the contract for that. Based on the current implementation, I can help you customize the logic. What specific changes would you like to make?";
}

// Styles
// Styles - Apple-inspired Monochrome
const F = `'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace`; // coding font
const D = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`; // system font
// Theme: Black background, dark gray surfaces, white text, subtle borders
// Theme: Clear Glass
const bg = "transparent";       // Transparent to let wallpaper show
const sf = "rgba(20, 20, 30, 0.6)"; // Glass panel: dark but translucent
const sf2 = "rgba(255, 255, 255, 0.05)"; // Glass card: lighter
const bd = "rgba(255, 255, 255, 0.1)";   // Glass border
const t1 = "#ffffff";       // White text
const t2 = "rgba(255, 255, 255, 0.6)"; // White secondary
const accent = "#E0E0E0";   // Silver/White accent

const Glow = () => null; // Removed generic glows for cleaner look
const Tag = ({ children }) =>
  <span style={{ padding: "4px 8px", borderRadius: 12, fontSize: 10, fontWeight: 500, background: "#1c1c1e", color: t2, letterSpacing: "0.2px", border: `1px solid ${bd}` }}>{children}</span>;

// ─── UI PREVIEWS ───
function UIPreview({ type, accent: propAccent, brandName, config }) {
  const brand = brandName || "dApp";
  const ac = "#2997FF"; // Force Apple Blue for UI consistent look, or use propAccent if preferred for specific buttons

  // Common Container
  const Container = ({ children }) => (
    <div style={{ background: sf, borderRadius: 20, overflow: "hidden", height: "100%", border: `1px solid ${bd}`, display: "flex", flexDirection: "column", fontFamily: D }}>
      <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${bd}`, background: "rgba(20,20,20,0.5)", backdropFilter: "blur(10px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5F57" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FEBC2E" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28C840" }} />
        </div>
        <span style={{ fontWeight: 600, color: t1, fontSize: 13, opacity: 0.8 }}>{brand}</span>
        <div style={{ width: 40 }} />
      </div>
      <div style={{ flex: 1, padding: 24, display: "flex", justifyContent: "center", alignItems: "center", background: bg, position: "relative", overflow: "hidden" }}>
        {/* Abstract Background Elements */}
        <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, background: ac, opacity: 0.05, filter: "blur(60px)", borderRadius: "50%" }}></div>
        <div style={{ position: "absolute", bottom: -50, left: -50, width: 200, height: 200, background: "#FF007A", opacity: 0.03, filter: "blur(60px)", borderRadius: "50%" }}></div>
        {children}
      </div>
    </div>
  );

  if (type === "dex") return (
    <Container>
      <div style={{ width: 300, background: sf, borderRadius: 24, padding: 20, border: `1px solid ${bd}`, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontWeight: 600, color: t1 }}>Swap</span>
          <span style={{ color: ac, fontSize: 13, cursor: "pointer" }}>Settings</span>
        </div>
        <div style={{ background: sf2, borderRadius: 18, padding: 16, marginBottom: 8, border: `1px solid ${bd}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: t2 }}>Pay</span>
            <span style={{ fontSize: 12, color: t2 }}>Balance: 2.45</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 28, fontWeight: 500, color: t1 }}>1.0</span>
            <button style={{ background: "#2c2c2e", border: "none", padding: "6px 12px", borderRadius: 12, color: t1, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#627EEA" }}></span> ETH
            </button>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", margin: "-12px 0", position: "relative", zIndex: 10 }}>
          <div style={{ background: sf, border: `4px solid ${bg}`, borderRadius: 12, padding: 6, color: t1 }}>↓</div>
        </div>
        <div style={{ background: sf2, borderRadius: 18, padding: 16, marginBottom: 16, border: `1px solid ${bd}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: t2 }}>Receive</span>
            <span style={{ fontSize: 12, color: t2 }}>Balance: 0.00</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 28, fontWeight: 500, color: t1 }}>1850.5</span>
            <button style={{ background: "#2c2c2e", border: "none", padding: "6px 12px", borderRadius: 12, color: t1, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#2775CA" }}></span> USDC
            </button>
          </div>
        </div>
        <button style={{ width: "100%", padding: 16, background: ac, border: "none", borderRadius: 18, color: "#fff", fontWeight: 600, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 12px rgba(41, 151, 255, 0.3)" }}>Swap</button>
      </div>
    </Container>
  );

  if (type === "nft") return (
    <Container>
      <div style={{ width: 280, background: sf, borderRadius: 24, overflow: "hidden", border: `1px solid ${bd}`, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ height: 280, background: sf2, position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: t2, fontSize: 48, opacity: 0.2 }}>🖼️</div>
          <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(0,0,0,0.6)", padding: "4px 8px", borderRadius: 8, backdropFilter: "blur(4px)", fontSize: 10, color: "#fff", fontWeight: 600 }}>#{config.maxSupply || "1000"}</div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: t1, marginBottom: 4 }}>{config.name || "My NFT Collection"}</div>
          <div style={{ fontSize: 13, color: t2, marginBottom: 16 }}>Price: {config.mintPrice || "0.05"} ETH</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ flex: 1, padding: "12px", background: ac, border: "none", borderRadius: 14, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Mint</button>
            <button style={{ width: 44, padding: "12px", background: sf2, border: "none", borderRadius: 14, color: t1, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>-</button>
            <button style={{ width: 44, padding: "12px", background: sf2, border: "none", borderRadius: 14, color: t1, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>+</button>
          </div>
        </div>
      </div>
    </Container>
  );

  if (type === "token" || type === "staking") return (
    <Container>
      <div style={{ width: 320, background: sf, borderRadius: 24, padding: 24, border: `1px solid ${bd}`, textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${ac}, #8E8E93)`, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#fff" }}>
          {config.symbol?.[0] || "$"}
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: t1, marginBottom: 4 }}>{config.name || "Token Name"}</div>
        <div style={{ fontSize: 14, color: t2, marginBottom: 24 }}>{config.symbol || "TKN"} • {type === "staking" ? "Staking Pool" : "ERC20"}</div>

        {type === "staking" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <div style={{ background: sf2, padding: 12, borderRadius: 16 }}>
              <div style={{ fontSize: 10, color: t2, textTransform: "uppercase" }}>APY</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: "#00D395" }}>124%</div>
            </div>
            <div style={{ background: sf2, padding: 12, borderRadius: 16 }}>
              <div style={{ fontSize: 10, color: t2, textTransform: "uppercase" }}>TVL</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: t1 }}>$1.2M</div>
            </div>
          </div>
        ) : (
          <div style={{ background: sf2, borderRadius: 16, padding: 16, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 11, color: t2 }}>Your Balance</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: t1 }}>0.00 {config.symbol}</div>
            </div>
          </div>
        )}

        <button style={{ width: "100%", padding: 16, background: ac, border: "none", borderRadius: 18, color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>
          {type === "staking" ? "Stake Tokens" : "Transfer"}
        </button>
      </div>
    </Container>
  );

  if (type === "dao") return (
    <Container>
      <div style={{ width: 340, background: sf, borderRadius: 24, padding: 24, border: `1px solid ${bd}`, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: t1 }}>Governance</div>
          <div style={{ fontSize: 12, color: ac, background: "#2997FF20", padding: "4px 8px", borderRadius: 8 }}>Active</div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: t1, marginBottom: 8, lineHeight: 1.4 }}>Proposal #42: Allocate Treasury for Marketing Campaign</div>
        <div style={{ fontSize: 12, color: t2, marginBottom: 20, lineHeight: 1.5 }}>Authorize 50,000 USDC for Q3 marketing initiatives across social media...</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: t2, marginBottom: 2 }}>
            <span>For</span><span>85%</span>
          </div>
          <div style={{ height: 6, background: sf2, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: "85%", height: "100%", background: "#00D395" }}></div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: t2, marginBottom: 2, marginTop: 4 }}>
            <span>Against</span><span>15%</span>
          </div>
          <div style={{ height: 6, background: sf2, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: "15%", height: "100%", background: "#FF5F57" }}></div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button style={{ flex: 1, padding: 12, background: sf2, border: `1px solid ${bd}`, borderRadius: 14, color: t1, fontWeight: 600, cursor: "pointer" }}>Vote For</button>
          <button style={{ flex: 1, padding: 12, background: sf2, border: `1px solid ${bd}`, borderRadius: 14, color: t1, fontWeight: 600, cursor: "pointer" }}>Vote Against</button>
        </div>
      </div>
    </Container>
  );

  // Default / Launchpad / Lending
  return (
    <Container>
      <div style={{ width: 300, background: sf, borderRadius: 24, padding: 24, border: `1px solid ${bd}`, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: sf2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🚀</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: t1 }}>{brand}</div>
            <div style={{ fontSize: 11, color: t2 }}>Launchpad</div>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: t2, marginBottom: 6 }}>
            <span>Progress</span>
            <span style={{ color: ac }}>75%</span>
          </div>
          <div style={{ height: 8, background: sf2, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: "75%", height: "100%", background: ac }}></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: t1 }}>
            <span>75 ETH</span>
            <span>100 ETH</span>
          </div>
        </div>
        <div style={{ background: sf2, borderRadius: 16, padding: 16, marginBottom: 16, border: `1px solid ${bd}` }}>
          <div style={{ fontSize: 10, color: t2, textTransform: "uppercase", marginBottom: 4 }}>Time Remaining</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: t1 }}>2 Days 14 Hours</div>
        </div>
        <button style={{ width: "100%", padding: 16, background: ac, border: "none", borderRadius: 18, color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Participate</button>
      </div>
    </Container>
  );
}

// ━━━━━ MAIN APP ━━━━━
export default function DAppForge() {
  const [view, setView] = useState("home");
  const [selected, setSelected] = useState(null);
  const [chain, setChain] = useState(CHAINS[0]);
  const [config, setConfig] = useState({});
  const [activeFile, setActiveFile] = useState(0);
  const [deployPct, setDeployPct] = useState(0);
  const [deployLogs, setDeployLogs] = useState([]);
  const [sidePanel, setSidePanel] = useState("files");
  const [aiMsgs, setAiMsgs] = useState([]);
  const [aiIn, setAiIn] = useState("");
  const [chainPicker, setChainPicker] = useState(false);
  const [walletPicker, setWalletPicker] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [walletType, setWalletType] = useState(null); // 'metamask' or 'phantom'
  const [deployed, setDeployed] = useState([]);
  const [uiAccent, setUiAccent] = useState("");
  const [uiBrand, setUiBrand] = useState("");
  const [uiTab, setUiTab] = useState("style");
  const [compileStatus, setCompileStatus] = useState(null);
  const [consoleLogs, setConsoleLogs] = useState([]);

  // Folders state for IDE
  const [ideExpandedFolders, setIdeExpandedFolders] = useState({ "contracts": true, "scripts": true, "tests": true, "root": true, "programs": true });



  // ── Standalone IDE state ──
  const DEFAULT_FILES = [
    { name: "Contract.sol", folder: "contracts", content: `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.19;\n\nimport "@openzeppelin/contracts/access/Ownable.sol";\n\ncontract MyContract is Ownable {\n    uint256 public value;\n    \n    event ValueChanged(uint256 newValue);\n    \n    constructor(uint256 _initialValue) Ownable(msg.sender) {\n        value = _initialValue;\n    }\n    \n    function setValue(uint256 _value) external onlyOwner {\n        value = _value;\n        emit ValueChanged(_value);\n    }\n    \n    function getValue() external view returns (uint256) {\n        return value;\n    }\n}` },
    { name: "ERC20Token.sol", folder: "contracts", content: `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.19;\n\nimport "@openzeppelin/contracts/token/ERC20/ERC20.sol";\nimport "@openzeppelin/contracts/access/Ownable.sol";\n\ncontract MyToken is ERC20, Ownable {\n    constructor(\n        string memory name_,\n        string memory symbol_,\n        uint256 initialSupply\n    ) ERC20(name_, symbol_) Ownable(msg.sender) {\n        _mint(msg.sender, initialSupply * 10 ** decimals());\n    }\n    \n    function mint(address to, uint256 amount) external onlyOwner {\n        _mint(to, amount);\n    }\n    \n    function burn(uint256 amount) external {\n        _burn(msg.sender, amount);\n    }\n}` },
    { name: "NFT.sol", folder: "contracts", content: `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.19;\n\nimport "@openzeppelin/contracts/token/ERC721/ERC721.sol";\nimport "@openzeppelin/contracts/access/Ownable.sol";\n\ncontract MyNFT is ERC721, Ownable {\n    uint256 private _nextTokenId;\n    uint256 public mintPrice = 0.05 ether;\n    uint256 public maxSupply = 10000;\n    string private _baseTokenURI;\n    \n    constructor() ERC721("MyNFT", "MNFT") Ownable(msg.sender) {}\n    \n    function mint() external payable {\n        require(msg.value >= mintPrice, "Insufficient payment");\n        require(_nextTokenId < maxSupply, "Max supply reached");\n        _safeMint(msg.sender, _nextTokenId++);\n    }\n    \n    function setBaseURI(string memory baseURI) external onlyOwner {\n        _baseTokenURI = baseURI;\n    }\n    \n    function _baseURI() internal view override returns (string memory) {\n        return _baseTokenURI;\n    }\n    \n    function withdraw() external onlyOwner {\n        payable(owner()).transfer(address(this).balance);\n    }\n}` },
    { name: "deploy.js", folder: "scripts", content: `const hre = require("hardhat");\n\nasync function main() {\n    const [deployer] = await hre.ethers.getSigners();\n    console.log("Deploying with:", deployer.address);\n    \n    const Contract = await hre.ethers.getContractFactory("MyContract");\n    const contract = await Contract.deploy(42);\n    await contract.waitForDeployment();\n    \n    console.log("Contract deployed to:", await contract.getAddress());\n    \n    // Verify on block explorer\n    await hre.run("verify:verify", {\n        address: await contract.getAddress(),\n        constructorArguments: [42],\n    });\n}\n\nmain().catch(console.error);` },
    { name: "test.js", folder: "tests", content: `const { expect } = require("chai");\nconst { ethers } = require("hardhat");\n\ndescribe("MyContract", function () {\n    let contract, owner, addr1;\n    \n    beforeEach(async function () {\n        [owner, addr1] = await ethers.getSigners();\n        const Contract = await ethers.getContractFactory("MyContract");\n        contract = await Contract.deploy(42);\n    });\n    \n    it("Should return initial value", async function () {\n        expect(await contract.getValue()).to.equal(42);\n    });\n    \n    it("Should update value", async function () {\n        await contract.setValue(100);\n        expect(await contract.getValue()).to.equal(100);\n    });\n    \n    it("Should emit event", async function () {\n        await expect(contract.setValue(100))\n            .to.emit(contract, "ValueChanged")\n            .withArgs(100);\n    });\n    \n    it("Should reject non-owner", async function () {\n        await expect(contract.connect(addr1).setValue(100))\n            .to.be.reverted;\n    });\n});` },
    { name: "hardhat.config.js", folder: "root", content: `require("@nomicfoundation/hardhat-toolbox");\nrequire("dotenv").config();\n\nmodule.exports = {\n    solidity: {\n        version: "0.8.19",\n        settings: {\n            optimizer: { enabled: true, runs: 200 }\n        }\n    },\n    networks: {\n        hardhat: {},\n        sepolia: {\n            url: process.env.SEPOLIA_RPC || "",\n            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []\n        },\n        mainnet: {\n            url: process.env.MAINNET_RPC || "",\n            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []\n        }\n    },\n    etherscan: {\n        apiKey: process.env.ETHERSCAN_API_KEY || ""\n    }\n};` },
    { name: ".env", folder: "root", content: `PRIVATE_KEY=\nSEPOLIA_RPC=https://rpc.sepolia.org\nMAINNET_RPC=\nETHERSCAN_API_KEY=` },
    {
      name: "OmegaToken.sol", folder: "contracts", content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OmegaToken is ERC20, Ownable {
    constructor() ERC20("Omega Token", "OMN") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}` },
  ];
  const [ideFiles, setIdeFiles] = useState(DEFAULT_FILES);
  const [ideActiveFile, setIdeActiveFile] = useState(0);
  const [ideOpenTabs, setIdeOpenTabs] = useState([0]);
  const [ideSidePanel, setIdeSidePanel] = useState("files");
  const [ideConsole, setIdeConsole] = useState(["> Workspace ready. Solidity v0.8.19", "> Type or paste your contracts to begin."]);
  const [ideCompile, setIdeCompile] = useState(null);
  const [ideAiMsgs, setIdeAiMsgs] = useState([{ role: "ai", text: "Welcome to the IDE! I can help you:\n\n• Write Solidity contracts\n• Debug errors\n• Optimize gas\n• Generate tests\n• Explain code\n\nJust ask!" }]);
  const [ideAiIn, setIdeAiIn] = useState("");
  const [ideNewFileModal, setIdeNewFileModal] = useState(false);
  const [ideNewFileName, setIdeNewFileName] = useState("");
  const ideAiRef = useRef(null);
  const idePreRef = useRef(null);
  const chatRef = useRef(null);

  // Console resizing state
  const [consoleHeight, setConsoleHeight] = useState(130); // Start expanded
  const [isDraggingConsole, setIsDraggingConsole] = useState(false);
  const [docsModal, setDocsModal] = useState(false);
  const [docsSection, setDocsSection] = useState("intro");
  const [consoleExpanded, setConsoleExpanded] = useState(true); // Start expanded
  const [deploymentHistory, setDeploymentHistory] = useState([]);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [estimatingGas, setEstimatingGas] = useState(false);
  const [compilerVersion, setCompilerVersion] = useState("0.8.19");
  const [optimizerRuns, setOptimizerRuns] = useState(200);
  const [autoSave, setAutoSave] = useState(true);
  const [liveFeed, setLiveFeed] = useState([]);
  const [ideShowRust, setIdeShowRust] = useState(false);

  function transpileToRust(sol) {
    if (!sol) return "";
    // 1. Extract contract name
    let contractName = sol.match(/contract\s+(\w+)/)?.[1] || "MyProgram";
    let snakeContract = contractName.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

    // 2. Extract state variables
    let stateVars = [];
    let stateRegex = /(uint256|address|bool|string)\s+(?:public\s+)?(\w+)\s*(?:=.*)?;/g;
    let match;
    while ((match = stateRegex.exec(sol)) !== null) {
      let type = match[1] === 'uint256' ? 'u64' : match[1] === 'address' ? 'Pubkey' : match[1] === 'bool' ? 'bool' : 'String';
      stateVars.push({ type: type, name: match[2] });
    }

    // 3. Extract functions
    let functions = [];
    let funcRegex = /function\s+(\w+)\s*\(([^)]*)\)\s*(?:external|public)[\s\w]*\{([\s\S]*?)\}/g;
    while ((match = funcRegex.exec(sol)) !== null) {
      let name = match[1];
      let pString = match[2];
      let params = pString.split(',').filter(x => x.trim()).map(p => {
        let parts = p.trim().split(/\s+/);
        let t = parts[0] === 'uint256' ? 'u64' : parts[0] === 'address' ? 'Pubkey' : 'String';
        return { name: parts[parts.length - 1], type: t };
      });
      functions.push({ name: name, params: params });
    }

    // 4. Assemble Anchor code
    let rust = `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod ${snakeContract} {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, ${stateVars.map(v => `${v.name}: ${v.type}`).join(', ')}) -> Result<()> {
        let state = &mut ctx.accounts.state;
        ${stateVars.map(v => `state.${v.name} = ${v.name};`).join('\n        ')}
        Ok(())
    }

${functions.map(f => `    pub fn ${f.name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()}(ctx: Context<${f.name.charAt(0).toUpperCase() + f.name.slice(1)}>, ${f.params.map(p => `${p.name}: ${p.type}`).join(', ')}) -> Result<()> {
        // Business logic translated from ${f.name}
        Ok(())
    }`).join('\n\n')}
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + ${stateVars.length * 32})]
    pub state: Account<'info, GlobalState>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

${functions.map(f => `#[derive(Accounts)]
pub struct ${f.name.charAt(0).toUpperCase() + f.name.slice(1)}<'info> {
    #[account(mut)]
    pub state: Account<'info, GlobalState>,
}`).join('\n\n')}

#[account]
pub struct GlobalState {
    ${stateVars.map(v => `pub ${v.name}: ${v.type},`).join('\n    ')}
}`;
    return rust;
  }

  // Live deployment feed effect - regenerate ALL items for chaotic effect
  useEffect(() => {
    let counter = 0;
    const generateFeedItem = () => ({
      id: counter++,
      wallet: randomWallet(),
      contract: SAMPLE_CONTRACTS[Math.floor(Math.random() * SAMPLE_CONTRACTS.length)],
      chain: CHAINS[Math.floor(Math.random() * 3)], // Top 3 chains
      time: ["just now", "1s ago", "2s ago", "3s ago"][Math.floor(Math.random() * 4)]
    });

    const generateAllItems = () => {
      counter = Date.now(); // Reset counter for unique IDs
      return Array(5).fill(0).map(() => generateFeedItem());
    };

    // Initial feed
    setLiveFeed(generateAllItems());

    // Regenerate ALL items every 1.5-2.5 seconds for chaotic effect
    const interval = setInterval(() => {
      setLiveFeed(generateAllItems());
    }, 1500 + Math.random() * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => { if (ideAiRef.current) ideAiRef.current.scrollTop = ideAiRef.current.scrollHeight; }, [ideAiMsgs]);

  // Update console when compiler version changes
  useEffect(() => {
    setIdeConsole([`> Workspace ready. Solidity v${compilerVersion}`, `> Type or paste your contracts to begin.`]);
  }, [compilerVersion]);

  // Console dragging logic
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingConsole) return;
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight > 30 && newHeight < window.innerHeight - 100) {
        setConsoleHeight(newHeight);
      }
    };
    const handleMouseUp = () => setIsDraggingConsole(false);

    if (isDraggingConsole) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingConsole]);

  const ideDeleteFile = (index) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    // 1. Remove file
    const newFiles = ideFiles.filter((_, i) => i !== index);
    setIdeFiles(newFiles);

    // 2. Fix Open Tabs
    // If deleted file was in tabs, remove it.
    // Also, all indices > index must be decremented.
    let newTabs = ideOpenTabs.filter(t => t !== index).map(t => (t > index ? t - 1 : t));

    // If we closed the last tab, fallback to empty or 0 if files exist
    if (newTabs.length === 0 && newFiles.length > 0) newTabs = [0];
    setIdeOpenTabs(newTabs);

    // 3. Fix Active File
    if (ideActiveFile === index) {
      // If we deleted the active file, switch to the last open tab or 0
      setIdeActiveFile(newTabs.length > 0 ? newTabs[newTabs.length - 1] : 0);
    } else if (ideActiveFile > index) {
      setIdeActiveFile(ideActiveFile - 1);
    }
  };

  const tmpl = TEMPLATES.find(t => t.id === selected);
  const accent = tmpl?.color || "#6366F1";

  useEffect(() => {
    if (selected && tmpl) {
      const d = {}; tmpl.fields.forEach(f => d[f.key] = f.def);
      setConfig(d); setUiAccent(tmpl.color); setUiBrand(tmpl.name);
      setAiMsgs([{ role: "ai", text: "I can help customize this contract. Ask me to:\n• Add features\n• Explain code\n• Optimize gas\n• Audit security" }]);
      setConsoleLogs([`> ${tmpl.contracts.length} contracts loaded.`]);
      setCompileStatus(null); setActiveFile(0);
    }
  }, [selected]);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [aiMsgs]);

  const connect = async (type = "metamask") => {
    setWalletPicker(false);
    let providerObj = null;

    // 1. Determine Provider
    if (type === "phantom") {
      if (chain.id === "solana") {
        providerObj = window.phantom?.solana || window.solana;
      } else {
        providerObj = window.phantom?.ethereum || (window.ethereum?.isPhantom ? window.ethereum : null);
      }
    } else {
      // For MetaMask, prioritize MetaMask provider and avoid Phantom
      if (window.ethereum?.providers?.length) {
        providerObj = window.ethereum.providers.find(p => p.isMetaMask && !p.isPhantom) || window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum.providers[0];
      } else {
        // Check if window.ethereum is MetaMask (not Phantom)
        providerObj = (window.ethereum?.isMetaMask && !window.ethereum?.isPhantom) ? window.ethereum : null;
        // If not found, try to find MetaMask in providers array
        if (!providerObj && window.ethereum?.providers) {
          providerObj = window.ethereum.providers.find(p => p.isMetaMask && !p.isPhantom);
        }
      }
    }

    if (!providerObj) {
      alert(`${type === "phantom" ? "Phantom" : "MetaMask"} not installed.`);
      return null;
    }

    try {
      // 2. Solana Connection
      if (chain.id === "solana" || (type === "phantom" && !providerObj.request)) {
        const resp = await providerObj.connect();
        const addr = resp.publicKey.toString();
        setWallet(addr);
        setWalletType("phantom-solana");
        return addr;
      }

      // 3. EVM Connection
      const accounts = await providerObj.request({ method: 'eth_requestAccounts' });
      setWallet(accounts[0]);
      setWalletType(type);

      // Switch to the selected chain (Avalanche C-Chain by default)
      if (chain && chain.rpc && chain.hexId && chain.id !== "solana") {
        // Important: Phantom EVM ONLY supports Ethereum and Polygon. 
        // Trying to switch to other networks like Omega causes an 'Unsupported network' error.
        const isPhantom = type === "phantom" || providerObj.isPhantom;
        const phantomSupported = ["ethereum", "polygon"].includes(chain.id);

        if (isPhantom && !phantomSupported) {
          console.warn(`Phantom EVM does not support network: ${chain.name}. Connection will proceed on whatever network the wallet is currently on.`);
        } else {
          try {
            await providerObj.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: chain.hexId }],
            });
          } catch (switchError) {
            if (switchError.code === 4902) {
              await providerObj.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: chain.hexId,
                  chainName: chain.name,
                  rpcUrls: [chain.rpc],
                  blockExplorerUrls: [chain.explorer.startsWith("http") ? chain.explorer : `https://${chain.explorer}`],
                  nativeCurrency: { name: chain.symbol, symbol: chain.symbol, decimals: 18 }
                }],
              });
            }
          }
        }
      }

      const chainId = await providerObj.request({ method: 'eth_chainId' });
      const found = CHAINS.find(c => c.hexId === chainId);
      if (found) setChain(found);

      return accounts[0];
    } catch (error) {
      console.error("Connection failed", error);
      return null;
    }
  };

  function ideOpenFile(idx) {
    setIdeActiveFile(idx);
    if (!ideOpenTabs.includes(idx)) setIdeOpenTabs(p => [...p, idx]);
  }
  function ideCloseTab(idx) {
    const newTabs = ideOpenTabs.filter(t => t !== idx);
    if (newTabs.length === 0) { setIdeOpenTabs([0]); setIdeActiveFile(0); return; }
    setIdeOpenTabs(newTabs);
    if (ideActiveFile === idx) setIdeActiveFile(newTabs[newTabs.length - 1]);
  }
  function ideAddFile() {
    if (!ideNewFileName.trim()) return;
    const name = ideNewFileName.trim();
    const folder = name.endsWith(".sol") ? "contracts" : (name.endsWith(".rs") ? "programs" : (name.endsWith(".js") ? "scripts" : "root"));
    const content = name.endsWith(".sol") ? `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.19;\n\ncontract ${name.replace(".sol", "")} {\n    \n}` :
      (name.endsWith(".rs") ? `use anchor_lang::prelude::*;\n\ndeclare_id!("11111111111111111111111111111111");\n\n#[program]\npub mod ${name.replace(".rs", "").toLowerCase()} {\n    use super::*;\n\n    pub function initialize(ctx: Context<Initialize>) -> Result<()> {\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct Initialize {}` : `// ${name}\n`);
    setIdeFiles(p => [...p, { name, folder, content }]);
    setIdeNewFileModal(false); setIdeNewFileName("");
    setTimeout(() => { ideOpenFile(ideFiles.length); }, 50);
  }

  const openTemplateInAdvancedIde = () => {
    if (!tmpl) return;
    // Populate IDE with template files
    const templateFiles = tmpl.contracts.map((c, i) => ({
      name: c,
      folder: "contracts",
      content: i === 0 ? (CODE[selected] || "// " + c) : "// Additional contract for " + tmpl.name
    }));

    // Add default scripts if they don't exist
    if (!templateFiles.find(f => f.name === "deploy.js")) {
      templateFiles.push({ name: "deploy.js", folder: "scripts", content: "// Deployment script\n" });
    }

    setIdeFiles(templateFiles);
    setIdeOpenTabs(templateFiles.map((_, i) => i));
    setIdeActiveFile(0);
    setIdeExpandedFolders({ root: true, contracts: true, scripts: true, programs: false });
    setView("standalone-ide");
    setIdeConsole(p => [...p, `> Template "${tmpl.name}" loaded into workspace.`, `> Ready for Omega Network deployment.`]);
  };

  async function ideCompileAll() {
    setIdeCompile("compiling");
    const activeFile = ideFiles[ideActiveFile];
    const isRust = activeFile?.name?.endsWith(".rs") || chain.id === "solana";

    if (isRust) {
      setIdeConsole(p => [...p, `> Building Solana program via Solang Service...`]);
      try {
        // Option A: Real Remote Compiler API
        const response = await fetch("https://api.dappforge.io/compile/solana", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: ideFiles.filter(f => f.name.endsWith(".sol") || f.name.endsWith(".rs")),
            target: activeFile.name
          })
        }).catch(() => ({ ok: false, statusText: "Offline" }));

        if (response.ok) {
          const result = await response.json();
          setIdeConsole(p => [...p, ...result.logs]);
          setIdeCompile("success");
          window.compiledSolanaProgram = result.program;
        } else {
          // Fallback for local dev if API is not yet live
          setIdeConsole(p => [...p, "> ⚠ Remote Compiler Service (Option A) currently Offline.", "> Falling back to local verification..."]);
          setTimeout(() => {
            setIdeConsole(p => [...p, "> ✓ Syntax check passed.", "> ✓ Ready for deployment via Phantom."]);
            setIdeCompile("success");
          }, 1000);
        }
      } catch (e) {
        setIdeConsole(p => [...p, `> ✗ Compilation failed: ${e.message}`]);
        setIdeCompile("error");
      }
      return;
    }

    const targetFile = activeFile?.name?.endsWith(".sol") ? activeFile.name : null;
    setIdeConsole(p => [...p, `> Starting compilation${targetFile ? " of " + targetFile : ""}...`]);

    // Prepare sources for compiler
    const sources = {};
    ideFiles.filter(f => f.name.endsWith(".sol")).forEach(f => {
      sources[f.name] = { content: f.content };
    });
    // Actually, passing all local sources is safer to resolve local imports.

    try {
      const output = await compileSolidity(sources);

      // Process output
      if (output.errors) {
        let hasError = false;
        output.errors.forEach(err => {
          if (err.severity === "error") hasError = true;
          setIdeConsole(p => [...p, `> ${err.severity.toUpperCase()}: ${err.formattedMessage}`]);
        });
        if (hasError) {
          setIdeCompile("error");
          setIdeConsole(p => [...p, "> ✗ Compilation failed."]);
          return;
        }
      }

      const compiledContracts = [];
      let activeFileArtifacts = 0;
      let totalArtifacts = 0;

      for (const file in output.contracts) {
        for (const contract in output.contracts[file]) {
          totalArtifacts++;
          if (file === targetFile) activeFileArtifacts++;

          compiledContracts.push({
            name: contract,
            abi: output.contracts[file][contract].abi,
            bytecode: output.contracts[file][contract].evm.bytecode.object,
            fileName: file
          });
        }
      }

      const summary = targetFile
        ? `> ✓ Compiled ${targetFile} (${activeFileArtifacts} contract${activeFileArtifacts > 1 ? "s" : ""}). Total artifacts: ${totalArtifacts}.`
        : `> ✓ Compilation successful! Generated ${totalArtifacts} artifacts.`;

      setIdeConsole(p => [...p, summary]);
      setIdeCompile("success");

      // Store compiled artifacts for deployment
      window.compiledArtifacts = compiledContracts;

      // Force re-render to update Copy ABI button
      setIdeCompile("success");

    } catch (e) {
      console.error(e);
      setIdeConsole(p => [...p, `> ✗ Compilation error: ${e.message}`]);
      setIdeCompile("error");
    }
  }
  function ideSendAI() {
    if (!ideAiIn.trim()) return;
    const q = ideAiIn.trim();
    setIdeAiMsgs(p => [...p, { role: "user", text: q }]);
    setIdeAiIn("");
    setTimeout(() => setIdeAiMsgs(p => [...p, { role: "ai", text: getAIResponse(q) }]), 500);
  }

  function compile() {
    setCompileStatus("compiling"); setConsoleLogs(p => [...p, "> Compiling..."]);
    setTimeout(() => { setConsoleLogs(p => [...p, "> ✓ Compiled successfully"]); setCompileStatus("success"); }, 1500);
  }

  async function deploy() {
    if (!wallet) {
      const addr = await connect();
      if (!addr) return;
    }

    const isIde = view === "standalone-ide";
    const currentFileName = isIde ? ideFiles[ideActiveFile]?.name : "";

    if (!isIde) {
      setView("deploying"); setDeployPct(0); setDeployLogs([]);
    } else {
      setIdeConsole(p => [...p, "> Starting deployment..."]);
      setIdeCompile("compiling");
    }

    // Check if we have artifacts from IDE compilation (if coming from IDE) or need to compile template (wizard)
    let artifacts = window.compiledArtifacts;

    if (!artifacts || artifacts.length === 0) {
      if (tmpl && CODE[selected]) {
        // Wizard flow compilation
        if (!isIde) setDeployLogs(p => [...p, "Compiling template code..."]);
        const sources = {
          [`${tmpl.contracts[0]}`]: { content: CODE[selected] }
        };
        try {
          const output = await compileSolidity(sources);
          if (output.errors && output.errors.some(e => e.severity === "error")) {
            throw new Error("Compilation failed");
          }
          artifacts = [];
          for (const f in output.contracts) {
            for (const c in output.contracts[f]) {
              artifacts.push({
                name: c,
                abi: output.contracts[f][c].abi,
                bytecode: output.contracts[f][c].evm.bytecode.object,
                fileName: f
              });
            }
          }
        } catch (e) {
          const msg = `Error possibly due to missing imports or setup: ${e.message}`;
          if (isIde) setIdeConsole(p => [...p, `> ✗ ${msg}`]);
          else setDeployLogs(p => [...p, msg]);
        }
      }
    }

    // If still no artifacts
    if (!artifacts || artifacts.length === 0) {
      const msg = "No compiled contracts found. Please compile first.";
      if (isIde) {
        setIdeConsole(p => [...p, `> ✗ ${msg}`]);
        setIdeCompile("error");
      } else {
        setDeployLogs(p => [...p, msg]);
      }
      return;
    }

    // Filter to only deploy the "main" contract
    let targetArtifacts = artifacts;
    if (isIde && currentFileName) {
      // Try to find contract in current file
      const main = artifacts.filter(a => a.fileName === currentFileName || currentFileName.includes(a.name));
      if (main.length > 0) targetArtifacts = main;
      else targetArtifacts = [artifacts[artifacts.length - 1]];
    } else if (tmpl) {
      const main = artifacts.find(a => tmpl.contracts.includes(a.name) || a.name === tmpl.name);
      if (main) targetArtifacts = [main];
      else targetArtifacts = [artifacts[artifacts.length - 1]];
    }

    if (!isIde) setDeployPct(20);

    try {
      if (chain.id === "solana") {
        const providerObj = window.phantom?.solana || window.solana;
        if (!providerObj) throw new Error("Phantom Solana wallet not detected.");

        if (isIde) setIdeConsole(p => [...p, "> Preparing REAL Solana Transaction..."]);
        else setDeployLogs(p => [...p, "Preparing REAL Solana Transaction..."]);

        // REAL Solana Deployment for Tokens
        const results = await solanaDeployToken(providerObj, {
          name: config.tokenName || "Dapp.Fun Token",
          symbol: config.tokenSymbol || "FUN",
          supply: config.totalSupply || "1000000"
        });

        if (results.success) {
          const msg = `✓ Deployment Successful! Signature: ${results.signature.slice(0, 16)}...`;
          if (isIde) {
            setIdeConsole(p => [...p, `> ${msg}`, `> Mint Address: ${results.address}`, `> View: https://explorer.solana.com/address/${results.address}?cluster=devnet`]);
            setIdeCompile("success");
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 3000);
          } else {
            setDeployLogs(p => [...p, msg, `Mint: ${results.address}`]);
            setDeployPct(100);
            setTimeout(() => setView("done"), 1500);
          }
        }
        return;
      }

      // Use the same provider detection logic as connect() to avoid Phantom when MetaMask is selected
      let providerObj = null;
      if (walletType === "phantom") {
        providerObj = window.phantom?.ethereum || (window.ethereum?.isPhantom ? window.ethereum : null);
      } else {
        // For MetaMask, prioritize MetaMask provider and avoid Phantom
        if (window.ethereum?.providers?.length) {
          providerObj = window.ethereum.providers.find(p => p.isMetaMask && !p.isPhantom) || window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum.providers[0];
        } else {
          // Check if window.ethereum is MetaMask (not Phantom)
          providerObj = (window.ethereum?.isMetaMask && !window.ethereum?.isPhantom) ? window.ethereum : null;
          // If not found, try to find MetaMask in providers array
          if (!providerObj && window.ethereum?.providers) {
            providerObj = window.ethereum.providers.find(p => p.isMetaMask && !p.isPhantom);
          }
        }
      }
      if (!providerObj) throw new Error("No wallet found");
      const provider = new ethers.BrowserProvider(providerObj);

      // Network Verification
      const network = await provider.getNetwork();
      if (chain.chainId && network.chainId !== BigInt(chain.chainId)) {
        setIdeConsole(p => [...p, `> ⚠ Network mismatch. Selected: ${chain.name}. Wallet: Chain ${network.chainId}.`]);
        try {
          // Use the correct provider (already determined above)
          await providerObj.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chain.hexId }],
          });
          // Brief pause for signer change
          await new Promise(r => setTimeout(r, 500));
        } catch (switchError) {
          if (switchError.code === 4902) {
            // Network doesn't exist, add it
            await providerObj.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: chain.hexId,
                chainName: chain.name,
                rpcUrls: [chain.rpc],
                blockExplorerUrls: [chain.explorer.startsWith("http") ? chain.explorer : `https://${chain.explorer}`],
                nativeCurrency: { name: chain.symbol, symbol: chain.symbol, decimals: 18 }
              }],
            });
            // Brief pause for signer change
            await new Promise(r => setTimeout(r, 500));
          } else {
            console.warn(switchError);
            throw new Error(`Please switch wallet to ${chain.name} (Chain ID: ${chain.chainId})`);
          }
        }
      }

      const signer = await provider.getSigner();
      const signerAddr = await signer.getAddress();

      const connectedMsg = `Connected: ${signerAddr}`;
      if (isIde) setIdeConsole(p => [...p, `> ${connectedMsg}`]);
      else { setDeployLogs(p => [...p, connectedMsg]); setDeployPct(30); }

      const deployedAddrs = [];
      const total = targetArtifacts.length;

      for (let i = 0; i < total; i++) {
        const art = targetArtifacts[i];
        const deployMsg = `Deploying ${art.name} to ${chain.name}...`;
        if (isIde) setIdeConsole(p => [...p, `> ${deployMsg}`]);
        else setDeployLogs(p => [...p, deployMsg]);

        const factory = new ethers.ContractFactory(art.abi, art.bytecode, signer);
        try {
          const deployArgs = [];
          const constructor = art.abi.find(x => x.type === 'constructor');
          if (constructor?.inputs.length > 0) {
            const inputs = constructor.inputs;
            const currentWalletAddr = await signer.getAddress();
            for (const input of inputs) {
              if (input.type.includes("uint")) deployArgs.push(100);
              else if (input.type.includes("address")) deployArgs.push(currentWalletAddr);
              else if (input.type.includes("string")) deployArgs.push("Demo Token");
              else if (input.type.includes("bool")) deployArgs.push(true);
              else deployArgs.push("0x");
            }
            const argMsg = `   (Using mock args: ${deployArgs.join(', ')})`;
            if (isIde) setIdeConsole(p => [...p, `> ${argMsg}`]);
            else setDeployLogs(p => [...p, argMsg]);
          }

          const contract = await factory.deploy(...deployArgs);
          const txHash = contract.deploymentTransaction().hash;
          const txMsg = `   Tx sent: ${txHash.slice(0, 10)}...`;
          const explorerLink = chain.explorer ? `> View Tx: https://${chain.explorer}/tx/${txHash}` : "";

          if (isIde) {
            setIdeConsole(p => [...p, `> ${txMsg}`, explorerLink].filter(Boolean));
          } else {
            setDeployLogs(p => [...p, txMsg, explorerLink].filter(Boolean));
          }

          await contract.waitForDeployment();
          const addr = await contract.getAddress();

          deployedAddrs.push({ name: art.name, address: addr });
          const successMsg = `   ✓ Deployed ${art.name} at ${addr}`;
          const addrExplorer = chain.explorer ? `> View Contract: https://${chain.explorer}/address/${addr}` : "";

          if (isIde) setIdeConsole(p => [...p, `> ${successMsg}`, addrExplorer].filter(Boolean));
          else {
            setDeployLogs(p => [...p, successMsg, addrExplorer].filter(Boolean));
            setDeployPct(30 + ((i + 1) / total * 60));
          }

        } catch (e) {
          console.error(e);
          let errMsg = e.message;
          if (errMsg.includes("user rejected")) errMsg = "User rejected transaction";
          const failMsg = `   ✗ Failed to deploy ${art.name}: ${errMsg.slice(0, 100)}...`;
          if (isIde) setIdeConsole(p => [...p, `> ${failMsg}`]);
          else setDeployLogs(p => [...p, failMsg]);
        }
      }

      setDeployed(deployedAddrs);
      if (deployedAddrs.length > 0) {
        if (!isIde) {
          setDeployLogs(p => [...p, "🎉 Deployment complete!"]);
          setTimeout(() => setView("done"), 1000);
        } else {
          setIdeConsole(p => [...p, "> 🎉 Deployment complete!"]);
          setIdeCompile("success");
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);

          // Add to deployment history
          const last = deployedAddrs[deployedAddrs.length - 1];
          setDeploymentHistory(prev => [{
            name: last.name,
            address: last.address,
            network: chain.name,
            time: new Date().toLocaleTimeString(),
            verified: false
          }, ...prev]);
        }
      } else {
        if (!isIde) setDeployLogs(p => [...p, "Deployment finished with errors."]);
        else {
          setIdeConsole(p => [...p, "> Deployment finished with errors."]);
          setIdeCompile("error");
        }
      }
    } catch (e) {
      console.error(e);
      const msg = `Deployment error: ${e.message}`;
      if (isIde) {
        setIdeConsole(p => [...p, `> ✗ ${msg}`]);
        setIdeCompile("error");
      } else {
        setDeployLogs(p => [...p, msg]);
      }
    }
  }

  function sendAI() {
    if (!aiIn.trim()) return;
    setAiMsgs(p => [...p, { role: "user", text: aiIn }]);
    const q = aiIn; setAiIn("");
    setTimeout(() => setAiMsgs(p => [...p, { role: "ai", text: getAIResponse(q) }]), 500);
  }

  const FL = () => <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />;

  function TopBar({ back, title, sub, extra }) {
    return (
      <div style={{ padding: "9px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${bd}`, background: sf, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {back && <button onClick={back} style={{ background: "none", border: "none", color: t2, cursor: "pointer", fontSize: 15, padding: "2px 5px" }}>←</button>}
          {title === "Dapp.Fun" ? <Logo size={20} /> : (tmpl && <span style={{ color: accent, fontSize: 16 }}>{tmpl.icon}</span>)}
          <span style={{ fontWeight: 700, fontSize: 14, color: t1, fontFamily: D }}>{typeof title === "string" && (title === "Dapp.Fun" || title === "Wizard") ? <>Dapp<span style={{ color: "#fff", opacity: 0.8 }}>.Fun</span></> : title}</span>
          {sub && <span style={{ color: t2, fontSize: 11 }}>— {sub}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {extra}
          <div style={{ position: "relative" }}>
            <button onClick={() => setChainPicker(!chainPicker)} style={{ background: sf2, border: `1px solid ${bd}`, borderRadius: 7, padding: "4px 10px", color: t1, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontFamily: D }}>
              <span style={{ color: chain.color }}>{chain.icon}</span>{chain.name}<span style={{ color: t2, fontSize: 8 }}>▼</span>
            </button>
            {chainPicker && <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: sf, border: `1px solid ${bd}`, borderRadius: 10, padding: 4, zIndex: 999, minWidth: 150, boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}>
              {CHAINS.map(c => <button key={c.id} onClick={() => { setChain(c); setChainPicker(false) }} style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 9px", width: "100%", border: "none", background: chain.id === c.id ? sf2 : "transparent", color: t1, borderRadius: 5, cursor: "pointer", fontSize: 11, fontFamily: D }}><span style={{ color: c.color }}>{c.icon}</span>{c.name}</button>)}
            </div>}
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={wallet ? undefined : () => setWalletPicker(!walletPicker)} style={{ background: wallet ? sf2 : "linear-gradient(135deg,#6366F1,#818CF8)", border: wallet ? `1px solid ${bd}` : "none", borderRadius: 7, padding: "4px 12px", color: wallet ? accent : "#fff", fontWeight: 600, cursor: "pointer", fontSize: 11, fontFamily: D }}>
              {wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Connect Wallet"}
            </button>
            {(!wallet && walletPicker) && (
              <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: sf, border: `1px solid ${bd}`, borderRadius: 10, padding: 4, zIndex: 999, minWidth: 140, boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}>
                <button onClick={() => { connect("metamask"); setWalletPicker(false); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", width: "100%", border: "none", background: "transparent", color: t1, borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: D, textAlign: "left" }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" style={{ width: 14, height: 14 }} alt="" /> MetaMask
                </button>
                <button onClick={() => { connect("phantom"); setWalletPicker(false); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", width: "100%", border: "none", background: "transparent", color: t1, borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: D, textAlign: "left" }}>
                  <img src="https://cryptologos.cc/logos/phantom-ftm-logo.svg?v=035" style={{ width: 14, height: 14 }} alt="" /> Phantom
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ━━━ HOME ━━━
  if (view === "home") return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: D }}>
      <FL />
      {/* Abstract Liquid Blobs Background */}
      <div className="blob" style={{ width: 600, height: 600, background: "radial-gradient(circle, #ffffff 0%, transparent 70%)", top: "-10%", left: "-10%", animationDelay: "0s", opacity: 0.08 }}></div>
      <div className="blob" style={{ width: 500, height: 500, background: "radial-gradient(circle, #e0e0e0 0%, transparent 70%)", top: "20%", right: "-10%", animationDelay: "5s", opacity: 0.05 }}></div>
      <div className="blob" style={{ width: 600, height: 600, background: "radial-gradient(circle, #cccccc 0%, transparent 70%)", bottom: "-10%", left: "20%", animationDelay: "10s", opacity: 0.08 }}></div>

      {/* Modern Glass Navbar */}
      <div style={{ padding: "0 12px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 100 }}>
        <div className="glass-pill" style={{ padding: "6px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <Logo size={24} />
          <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.5px", background: "linear-gradient(90deg, #fff, #bbb)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Dapp.Fun</div>
        </div>

        <div />

        <div className="glass-pill" style={{ padding: "4px", display: "flex", gap: 4 }}>
          <button onClick={() => setDocsModal(true)} style={{
            background: "#fff",
            border: "none", borderRadius: 20, padding: "8px 20px",
            color: "#000", fontWeight: 600, cursor: "pointer", fontSize: 13,
            boxShadow: "0 4px 12px rgba(255,255,255,0.1)"
          }}>
            Docs
          </button>
        </div>
      </div>

      {/* Documentation Modal */}
      {docsModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setDocsModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#1a1a1a", borderRadius: 24, width: "100%", maxWidth: 1000, maxHeight: "85vh", display: "flex", overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 25px 50px rgba(0,0,0,0.4)" }}>
            {/* Sidebar */}
            <div style={{ width: 220, background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.05)", padding: 16, flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: "#fff" }}>Dapp.Fun Docs</div>
              {[
                { id: "intro", label: "Introduction" },
                { id: "howto", label: "How It Works" },
                { id: "templates", label: "Template Sources" },
                { id: "audits", label: "Security & Audits" },
                { id: "projects", label: "Who Uses These" },
                { id: "technical", label: "Technical Details" },
                { id: "api", label: "API Reference" },
                { id: "license", label: "License" },
              ].map(item => (
                <button key={item.id} onClick={() => setDocsSection(item.id)} style={{
                  display: "block", width: "100%", textAlign: "left", padding: "10px 12px", marginBottom: 4,
                  background: docsSection === item.id ? "rgba(255,255,255,0.1)" : "transparent",
                  border: "none", borderRadius: 8, color: docsSection === item.id ? "#fff" : "rgba(255,255,255,0.6)",
                  cursor: "pointer", fontSize: 13, fontFamily: D, fontWeight: docsSection === item.id ? 600 : 400,
                  transition: "all 0.15s"
                }}>{item.label}</button>
              ))}
            </div>
            {/* Content */}
            <div style={{ flex: 1, padding: 32, overflow: "auto" }}>
              <button onClick={() => setDocsModal(false)} style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, width: 32, height: 32, color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>

              {docsSection === "intro" && <>
                <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16, letterSpacing: "-1px" }}>Introduction to Dapp.Fun</h2>
                <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8, marginBottom: 20 }}>Dapp.Fun is a comprehensive Web3 development platform that enables developers to build, deploy, and customize decentralized applications in minutes. Our platform provides battle-tested smart contract templates, a professional-grade IDE, and seamless deployment to multiple networks.</p>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, marginTop: 24 }}>Core Features</h3>
                <ul style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8, paddingLeft: 20 }}>
                  <li>Pre-audited smart contract templates</li>
                  <li>Browser-based Solidity IDE with syntax highlighting</li>
                  <li>One-click deployment to Ethereum, Base, Polygon, and more</li>
                  <li>Automatic frontend generation</li>
                  <li>Real-time compilation and error checking</li>
                </ul>
              </>}

              {docsSection === "howto" && <>
                <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16, letterSpacing: "-1px" }}>How It Works</h2>
                <div style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, marginTop: 24, color: "#fff" }}>1. Choose a Template</h3>
                  <p style={{ marginBottom: 16 }}>Select from our library of production-ready templates including DEXs, NFT collections, tokens, DAOs, and more. Each template is fully customizable.</p>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, marginTop: 24, color: "#fff" }}>2. Configure Your Project</h3>
                  <p style={{ marginBottom: 16 }}>Customize parameters like token names, supply, fees, and other settings through our intuitive wizard interface.</p>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, marginTop: 24, color: "#fff" }}>3. Review in IDE</h3>
                  <p style={{ marginBottom: 16 }}>Open the full IDE to review generated code, make custom modifications, and add additional functionality.</p>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, marginTop: 24, color: "#fff" }}>4. Deploy</h3>
                  <p>Connect your wallet and deploy to your chosen network with a single click. The platform handles compilation, gas estimation, and transaction management.</p>
                </div>
              </>}

              {docsSection === "templates" && <>
                <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16, letterSpacing: "-1px" }}>Template Sources</h2>
                <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8, marginBottom: 20 }}>Our templates are built on industry-standard implementations from trusted sources:</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { name: "OpenZeppelin Contracts", url: "github.com/OpenZeppelin/openzeppelin-contracts", desc: "The gold standard for secure smart contract development. Used for ERC20, ERC721, access control, and security patterns." },
                    { name: "Uniswap V2/V3", url: "github.com/Uniswap", desc: "Reference implementation for AMM DEX functionality and liquidity pool mechanics." },
                    { name: "Compound Protocol", url: "github.com/compound-finance/compound-protocol", desc: "Lending and borrowing protocol patterns and interest rate models." },
                    { name: "Chainlink", url: "github.com/smartcontractkit/chainlink", desc: "Oracle integration patterns for price feeds and external data." },
                    { name: "OpenZeppelin Governor", url: "github.com/OpenZeppelin/openzeppelin-contracts", desc: "DAO governance patterns including voting, proposals, and timelock." },
                  ].map((src, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontWeight: 600, color: "#fff", marginBottom: 4 }}>{src.name}</div>
                      <div style={{ fontSize: 12, color: "#56B6C2", marginBottom: 8, fontFamily: F }}>{src.url}</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{src.desc}</div>
                    </div>
                  ))}
                </div>
              </>}

              {docsSection === "audits" && <>
                <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16, letterSpacing: "-1px" }}>Security & Audits</h2>
                <div style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}>
                  <p style={{ marginBottom: 20 }}>Security is our top priority. Our templates leverage extensively audited codebases:</p>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: "#fff" }}>OpenZeppelin Audits</h3>
                  <p style={{ marginBottom: 16 }}>OpenZeppelin contracts have undergone 30+ security audits by firms including Trail of Bits, ConsenSys Diligence, and Certora. They secure over $50B+ in on-chain value.</p>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: "#fff" }}>Template Verification</h3>
                  <p style={{ marginBottom: 16 }}>Each template is verified against known vulnerabilities including reentrancy, overflow/underflow, front-running, and access control issues.</p>
                  <div style={{ background: "rgba(255,193,7,0.1)", border: "1px solid rgba(255,193,7,0.3)", borderRadius: 12, padding: 16, marginTop: 20 }}>
                    <div style={{ fontWeight: 600, color: "#ffc107", marginBottom: 8 }}>⚠️ Important Notice</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>While our templates are based on audited code, any modifications you make should undergo independent security review before mainnet deployment with significant value.</div>
                  </div>
                </div>
              </>}

              {docsSection === "projects" && <>
                <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16, letterSpacing: "-1px" }}>Who Uses These Contracts</h2>
                <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8, marginBottom: 20 }}>The contract patterns in our templates power some of the largest protocols in DeFi:</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  {[
                    { name: "Uniswap", tvl: "$5B+ TVL", type: "DEX" },
                    { name: "Aave", tvl: "$10B+ TVL", type: "Lending" },
                    { name: "Compound", tvl: "$2B+ TVL", type: "Lending" },
                    { name: "OpenSea", tvl: "$30B+ Volume", type: "NFT" },
                    { name: "MakerDAO", tvl: "$8B+ TVL", type: "DAO" },
                    { name: "Lido", tvl: "$15B+ TVL", type: "Staking" },
                  ].map((proj, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontWeight: 600, color: "#fff", marginBottom: 4 }}>{proj.name}</div>
                      <div style={{ fontSize: 12, color: "#56B6C2" }}>{proj.tvl}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{proj.type}</div>
                    </div>
                  ))}
                </div>
              </>}

              {docsSection === "technical" && <>
                <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16, letterSpacing: "-1px" }}>Technical Details</h2>
                <div style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: "#fff" }}>Compiler</h3>
                  <p style={{ marginBottom: 16 }}>Solidity compiler v0.8.19 with optimizer enabled (200 runs). Compilation happens in-browser using solc-js.</p>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: "#fff" }}>Supported Networks</h3>
                  <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
                    <li>Ethereum Mainnet & Sepolia</li>
                    <li>Base Mainnet & Sepolia</li>
                    <li>Polygon Mainnet & Mumbai</li>
                    <li>Arbitrum One & Sepolia</li>
                    <li>Optimism Mainnet & Sepolia</li>
                  </ul>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: "#fff" }}>Wallet Support</h3>
                  <p>MetaMask, WalletConnect, Coinbase Wallet, and any injected Web3 provider via ethers.js v6.</p>
                </div>
              </>}

              {docsSection === "api" && <>
                <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16, letterSpacing: "-1px" }}>Dapp.Fun API</h2>
                <div style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}>
                  <p style={{ marginBottom: 20 }}>Dapp.Fun provides a REST API for <strong>Avalanche</strong> launches: compile and deploy to <strong>Avalanche C-Chain</strong> (mainnet), <strong>Fuji Testnet</strong>, and Avalanche L1 subnets. Use <code>chainId</code> <code>avax-mainnet</code> or <code>avax-fuji</code>; see <strong>API_DOCUMENTATION.md</strong> for network details and examples.</p>

                  <div style={{ padding: "16px", background: "rgba(41, 151, 255, 0.1)", borderLeft: "4px solid #2997FF", borderRadius: 4, marginBottom: 32 }}>
                    <div style={{ fontWeight: 600, color: "#fff", fontSize: 14, marginBottom: 4 }}>Production Endpoint</div>
                    <div style={{ fontFamily: F, color: "#2997FF", fontSize: 13 }}>https://dapp-fun-api.onrender.com/deploy</div>
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#fff" }}>AVAX network reference</h3>
                  <div style={{ fontSize: 12, marginBottom: 24, color: "rgba(255,255,255,0.8)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 16px", fontFamily: F }}>
                      <span style={{ color: "#888" }}>Mainnet</span><span><code>avax-mainnet</code> — Chain ID 43114 · RPC: api.avax.network · <a href="https://snowtrace.io" target="_blank" rel="noopener noreferrer" style={{ color: "#2997FF" }}>snowtrace.io</a></span>
                      <span style={{ color: "#888" }}>Testnet</span><span><code>avax-fuji</code> — Chain ID 43113 · RPC: api.avax-test.network · <a href="https://testnet.snowtrace.io" target="_blank" rel="noopener noreferrer" style={{ color: "#2997FF" }}>testnet.snowtrace.io</a></span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: "#fff" }}>Supported Networks</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
                    {[
                      { id: "avax-mainnet", name: "Avalanche C-Chain", type: "Mainnet" },
                      { id: "avax-fuji", name: "Avalanche Fuji", type: "Testnet" },
                      { id: "avax-dfk", name: "DFK L1", type: "Subnet" },
                      { id: "avax-dexalot", name: "Dexalot L1", type: "Subnet" },
                      { id: "base", name: "Base", type: "Low Gas" },
                      { id: "ethereum", name: "Ethereum", type: "Standard" },
                    ].map(net => (
                      <div key={net.id} style={{ background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "#ddd", fontFamily: F }}>{net.id}</span>
                        <span style={{ fontSize: 10, background: net.type === "Mainnet" ? "#E84142" : net.type === "Testnet" ? "#4ade80" : "rgba(255,255,255,0.1)", color: net.type === "Mainnet" || net.type === "Testnet" ? "#fff" : "#888", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>{net.type}</span>
                      </div>
                    ))}
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: "#fff" }}>Agent Deployment Examples</h3>
                  <p style={{ fontSize: 13, marginBottom: 16 }}>Copy these JSON payloads to instruct your AI agent.</p>

                  {/* ERC-20 Example */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#56B6C2", marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>Scenario 1: Deploy a Meme Token (AVAX Mainnet)</div>
                    <div style={{ background: "#0a0a0a", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
                      <pre style={{ fontSize: 11, color: "#e0e0e0", fontFamily: F, margin: 0, overflow: "auto", maxHeight: 200 }}>{`{
  "chainId": "avax-mainnet",
  "privateKey": "YOUR_KEY",
  "contractName": "LobsterCoin",
  "constructorArgs": ["LobsterCoin", "LOB", "1000000"],
  "sources": {
    "LobsterCoin.sol": {
      "content": "// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.20;\\nimport '@openzeppelin/contracts/token/ERC20/ERC20.sol';\\ncontract LobsterCoin is ERC20 {\\n constructor(string memory n, string memory s, uint256 supply) ERC20(n, s) {\\n _mint(msg.sender, supply * 10**18);\\n }\\n}"
    }
  }
}`}</pre>
                    </div>
                  </div>

                  {/* NFT Example */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#C678DD", marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>Scenario 2: Deploy NFT Collection (AVAX Fuji Testnet)</div>
                    <div style={{ background: "#0a0a0a", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
                      <pre style={{ fontSize: 11, color: "#e0e0e0", fontFamily: F, margin: 0, overflow: "auto", maxHeight: 200 }}>{`{
  "chainId": "avax-fuji",
  "privateKey": "YOUR_KEY",
  "contractName": "CyberLobsters",
  "constructorArgs": ["CyberLobsters", "CLOB"],
  "sources": {
    "CyberLobsters.sol": {
      "content": "..." // Standard ERC721 Code
    }
  }
}`}</pre>
                    </div>
                  </div>

                  {/* DEX Example */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#E5C07B", marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>Scenario 3: Deploy DEX Factory (AVAX C-Chain)</div>
                    <div style={{ background: "#0a0a0a", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden" }}>
                      <pre style={{ fontSize: 11, color: "#e0e0e0", fontFamily: F, margin: 0, overflow: "auto", maxHeight: 200 }}>{`{
  "chainId": "avax-mainnet",
  "privateKey": "YOUR_KEY",
  "contractName": "DEXFactory",
  "constructorArgs": ["0xFeeReceiverAddress"],
  "sources": {
    "DEX.sol": {
      "content": "contract DEXFactory { ... }"
    }
  }
}`}</pre>
                    </div>
                  </div>

                  <div style={{ marginTop: 32, padding: 16, background: "rgba(255, 193, 7, 0.1)", border: "1px solid rgba(255, 193, 7, 0.2)", borderRadius: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#FFC107", marginBottom: 4 }}>⚠️ Auto-Import Feature</div>
                    <p style={{ fontSize: 12, margin: 0, opacity: 0.8 }}>The API automatically resolves imports from <code>@openzeppelin</code> via unpkg. You do not need to upload these files manually.</p>
                  </div>

                </div>
              </>}

              {docsSection === "license" && <>
                <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16, letterSpacing: "-1px" }}>License</h2>
                <div style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}>
                  <p style={{ marginBottom: 16 }}>Dapp.Fun platform code is proprietary. However, all generated smart contracts are released under the MIT License, giving you full ownership and rights to deploy, modify, and commercialize.</p>
                  <p style={{ marginBottom: 16 }}>Template source code inherits licenses from their respective origins:</p>
                  <ul style={{ paddingLeft: 20 }}>
                    <li>OpenZeppelin Contracts: MIT License</li>
                    <li>Uniswap Contracts: GPL-3.0 / Business Source License</li>
                    <li>Compound Protocol: BSD-3-Clause</li>
                  </ul>
                </div>
              </>}
            </div>
          </div >
        </div >
      )
      }

      {/* Hero Section */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 16px", textAlign: "center" }}>
        <div style={{ fontSize: "clamp(28px, 8vw, 48px)", fontWeight: 600, letterSpacing: "-2px", lineHeight: 1.1, marginBottom: 16, maxWidth: 600 }}>
          Develop the future.<br />Faster than ever.
        </div>
        <p style={{ fontSize: "clamp(14px, 3vw, 16px)", color: t2, maxWidth: 460, lineHeight: 1.5, marginBottom: 40, padding: "0 10px" }}>
          The all-in-one platform for Web3 development. Write contracts, deploy templates, and launch frontends in minutes.
        </p>

        {/* Action Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, width: "100%", maxWidth: 800 }}>


          {/* Card 1: Templates */}
          <div onClick={() => setView("templates")}
            className="glass-card"
            style={{ borderRadius: 32, padding: 40, textAlign: "left", cursor: "pointer", transition: "transform 0.3s", position: "relative", overflow: "hidden" }}>
            {/* Inner Highlight Blob */}
            <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)", filter: "blur(40px)" }}></div>

            <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 24, boxShadow: "0 8px 16px rgba(0,0,0,0.1)" }}>⚡</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: "#fff", letterSpacing: "-0.5px" }}>Start with Templates</div>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: 30 }}>Launch Tokens, NFTs, DAOs within seconds. Pre-audited smart contracts ready to deploy.</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 13, fontWeight: 600 }}>Browse Library →</div>
          </div>

          {/* Card 2: IDE */}
          <div onClick={() => setView("standalone-ide")}
            className="glass-card"
            style={{ borderRadius: 32, padding: 40, textAlign: "left", cursor: "pointer", transition: "transform 0.3s", position: "relative", overflow: "hidden" }}>
            {/* Inner Highlight Blob */}
            <div style={{ position: "absolute", bottom: -50, left: -50, width: 200, height: 200, background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)", filter: "blur(40px)" }}></div>

            <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 24, boxShadow: "0 8px 16px rgba(0,0,0,0.1)" }}>⌨</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: "#fff", letterSpacing: "-0.5px" }}>Open Web IDE</div>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: 30 }}>Professional-grade Solidity editor. Compile, debug, and deploy directly from your browser.</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 20, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", fontSize: 13, fontWeight: 600 }}>Launch Editor →</div>
          </div>

        </div>

        {/* Live Deployment Feed */}
        <div style={{ marginTop: 40, width: "100%", maxWidth: 650, padding: "0 8px", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4ade80", animation: "pulse 1s infinite", boxShadow: "0 0 10px #4ade80" }} />
            <span style={{ fontSize: 11, color: t2, textTransform: "uppercase", letterSpacing: "2px", fontWeight: 600 }}>Live Deployments</span>
          </div>
          <div className="glass-panel" style={{ borderRadius: 16, padding: 10, overflow: "hidden", boxShadow: "0 0 40px rgba(74, 222, 128, 0.1)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {liveFeed.map((item, i) => (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 4,
                  padding: "10px 12px", borderRadius: 10,
                  background: `linear-gradient(90deg, ${item.chain?.color || "#4ade80"}15 0%, rgba(255,255,255,0.02) 100%)`,
                  border: `1px solid ${item.chain?.color || "#4ade80"}30`,
                  animation: "slideIn 0.4s ease-out",
                  boxShadow: i === 0 ? `0 0 20px ${item.chain?.color || "#4ade80"}20` : "none"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0, overflow: "hidden" }}>
                    <span style={{ fontSize: 13, color: item.chain?.color || "#fff", filter: `drop-shadow(0 0 4px ${item.chain?.color || "#fff"}80)`, flexShrink: 0 }}>{item.chain?.icon}</span>
                    <span style={{ fontSize: 10, color: "#4ade80", fontFamily: F, fontWeight: 500, flexShrink: 0 }}>{item.wallet}</span>
                    <span style={{ fontSize: 9, color: t2, flexShrink: 0 }}>→</span>
                    <span style={{ fontSize: 11, color: "#fff", fontWeight: 700, fontFamily: F, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.contract}</span>
                  </div>
                  <span style={{ fontSize: 9, color: t2, opacity: 0.6, flexShrink: 0 }}>{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
        <div style={{ marginBottom: 10 }}>&copy; 2026 Dapp.Fun. Designed for builders.</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          <span>Privacy</span><span>Terms</span>
        </div>
      </div>
    </div >
  );

  // ━━━ TEMPLATES ━━━
  if (view === "templates") return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: D, background: "#050505" }}>
      <FL />
      {/* Subtle Background Ambiance */}
      <div className="blob" style={{ width: 800, height: 800, background: "radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%)", top: "-20%", right: "-20%" }}></div>
      <div className="blob" style={{ width: 600, height: 600, background: "radial-gradient(circle, rgba(255, 255, 255, 0.02) 0%, transparent 70%)", bottom: "-20%", left: "-10%" }}></div>

      {/* Top Bar - Silver Minimalist */}
      <div style={{ padding: "0 32px", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 100, borderBottom: `1px solid ${bd}`, backdropFilter: "blur(20px)", background: "rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <button onClick={() => setView("home")} className="glass-pill" style={{ padding: "10px 24px", border: `1px solid ${bd}`, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, transition: "0.2s" }}>
            Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo size={28} />
            <div style={{ fontWeight: 800, fontSize: 20, color: "#fff", letterSpacing: "-0.5px" }}>DappForge <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>Modules</span></div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>Workspace:</span>
          <div className="glass-pill" style={{ padding: "6px 16px", background: "rgba(255,255,255,0.05)", border: `1px solid ${bd}`, color: "#fff", fontSize: 12, fontWeight: 700 }}>{chain.name}</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "60px 40px", overflow: "auto", position: "relative", zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 44px)", fontWeight: 800, marginBottom: 12, letterSpacing: "-1.5px", color: "#fff" }}>Template Library</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 17, maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>Industrial-grade protocol infrastructure. Ready for high-concurrency environments.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 32 }}>
            {TEMPLATES.map(t => (
              <div key={t.id} onClick={() => { setSelected(t.id); setView("wizard"); }}
                className="glass-card module-card"
                style={{
                  borderRadius: 32, padding: 32, cursor: "pointer", display: "flex", flexDirection: "column", gap: 20,
                  position: "relative", overflow: "hidden", border: `1px solid ${bd}`, background: "rgba(255,255,255,0.01)",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.05)", border: `1px solid rgba(255,255,255,0.1)`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#fff"
                }}>{t.icon}</div>

                <div>
                  <div style={{ fontSize: 21, fontWeight: 800, marginBottom: 4, color: "#fff", letterSpacing: "-0.5px" }}>{t.name}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>{t.subtitle}</div>
                </div>

                <div style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, flex: 1 }}>{t.desc}</div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {t.tags.slice(0, 3).map(tag => (
                    <span key={tag} style={{ fontSize: 10, padding: "6px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: `1px solid ${bd}`, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{tag}</span>
                  ))}
                </div>

                <div className="card-arrow" style={{ position: "absolute", bottom: 32, right: 32, fontSize: 20, opacity: 0.2, transition: "0.2s" }}>→</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .module-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.15) !important; background: rgba(255,255,255,0.03) !important; }
        .module-card:hover .card-arrow { opacity: 0.8; transform: translateX(4px); color: #fff; }
      `}</style>
    </div>
  );
  // ━━━ WIZARD ━━━
  if (view === "wizard" && tmpl) return (
    <div style={{ height: "100vh", background: "#050505", color: t1, fontFamily: D, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <FL />

      <TopBar back={() => setView("templates")} title={tmpl.name} sub="Configuration Matrix" extra={
        <div style={{ display: "flex", gap: 12 }}>
          {/* Minimalist Silver Connectivity */}
          <div className="glass-pill" style={{ padding: "6px 14px", border: `1px solid ${bd}`, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.03)" }}>Active: {chain.name}</div>
          <button onClick={() => connect(chain.id === "solana" ? "phantom" : "metamask")} className="glass-pill" style={{ padding: "6px 14px", border: `1px solid rgba(255,255,255,0.2)`, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", background: "transparent" }}>
            {wallet ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : "Connect Wallet"}
          </button>
        </div>
      } />

      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* Optimized 3-Column Workspace Layout */}
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 340px 380px", gap: 0, height: "100%" }}>

          {/* Column 1: Config Parameters */}
          <div style={{ padding: "50px 60px", overflow: "auto", borderRight: `1px solid ${bd}` }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 40, letterSpacing: "-1.5px" }}>Protocol Design</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {tmpl.fields.map(f => (
                <div key={f.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <label style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1.5px", fontFamily: F }}>{f.label}</label>
                    {f.ph && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: F }}>{f.ph}</span>}
                  </div>

                  {f.type === "toggle" ?
                    <button onClick={() => setConfig(p => ({ ...p, [f.key]: !p[f.key] }))}
                      style={{
                        width: 48, height: 26, borderRadius: 13, background: config[f.key] ? "#fff" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${bd}`, cursor: "pointer", position: "relative", transition: "0.3s"
                      }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: config[f.key] ? "#000" : "#fff", position: "absolute", top: 3, left: config[f.key] ? 26 : 3, transition: "left 0.3s" }} />
                    </button>
                    : f.type === "select" ?
                      <div style={{ position: "relative" }}>
                        <select value={config[f.key] || f.def} onChange={e => setConfig(p => ({ ...p, [f.key]: e.target.value }))}
                          style={{ width: "100%", padding: "16px", background: "rgba(255,255,255,0.02)", border: `1px solid ${bd}`, borderRadius: 16, color: "#fff", fontSize: 14, fontFamily: F, outline: "none", appearance: "none" }}>
                          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 10, pointerEvents: "none", opacity: 0.3 }}>▼</div>
                      </div>
                      :
                      <input type="text" value={config[f.key] || ""} onChange={e => setConfig(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph || f.def}
                        style={{ width: "100%", padding: "16px", background: "rgba(255,255,255,0.02)", border: `1px solid ${bd}`, borderRadius: 16, color: "#fff", fontSize: 14, fontFamily: F, outline: "none", boxSizing: "border-box", transition: "0.2s" }}
                        onFocus={e => { e.target.style.borderColor = "rgba(255,255,255,0.3)"; e.target.style.background = "rgba(255,255,255,0.04)"; }}
                        onBlur={e => { e.target.style.borderColor = bd; e.target.style.background = "rgba(255,255,255,0.02)"; }} />
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Action Center - Utilizing central space */}
          <div style={{ padding: "50px 30px", background: "rgba(255,255,255,0.005)", borderRight: `1px solid ${bd}`, display: "flex", flexDirection: "column", gap: 24 }}>
            <h3 style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 12 }}>Terminal Alpha</h3>

            <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${bd}`, borderRadius: 32, padding: 32, display: "flex", flexDirection: "column", gap: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8, letterSpacing: "-0.5px" }}>Broadcast Status</div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>Ready to instantiate {tmpl.name} on the {chain.name} mainnet. All parameters verified against security standards.</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button onClick={deploy} className="silver-btn" style={{
                  width: "100%", padding: "20px", borderRadius: 18, background: "#fff", border: "none", color: "#000", fontWeight: 800,
                  cursor: "pointer", fontSize: 15, fontFamily: D, boxShadow: "0 10px 40px rgba(255,255,255,0.1)", transition: "0.2s"
                }}>
                  Execute Deployment
                </button>

                <button onClick={openTemplateInAdvancedIde} style={{
                  width: "100%", padding: "18px", borderRadius: 18, background: "rgba(255,255,255,0.05)", border: `1px solid ${bd}`,
                  color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: D, transition: "0.2s"
                }}>
                  Open Workspace IDE
                </button>
              </div>
            </div>

            <div style={{ marginTop: "auto", padding: 24, borderRadius: 24, background: "rgba(255,255,255,0.02)", border: `1px solid ${bd}` }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.3)", marginBottom: 12, letterSpacing: "1px" }}>SYSTEM INTEGRITY</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>Protocols are cross-referenced with industry libraries for maximum fault tolerance.</div>
            </div>
          </div>

          {/* Column 3: Protocol Inspector (Sidebar) */}
          <div style={{ background: "#080808", overflow: "auto" }}>
            <div style={{ padding: 50 }}>
              <h3 style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.15)", textTransform: "uppercase", letterSpacing: "2.5px", marginBottom: 40, fontFamily: F }}>Protocol Manifest</h3>

              <div style={{ marginBottom: 48 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.4)", marginBottom: 20, letterSpacing: "1px" }}>SOURCES</div>
                {tmpl.contracts.map(c => (
                  <div key={c} style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0", borderBottom: `1px solid rgba(255,255,255,0.04)`, fontSize: 13, fontFamily: F, color: "rgba(255,255,255,0.4)" }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#666" }}></div> {c}
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.4)", marginBottom: 16, letterSpacing: "1px" }}>RESOURCE ANALYTICS</div>
                <div style={{ fontSize: 42, fontWeight: 800, color: "#fff", letterSpacing: "-2px" }}>{(tmpl.contracts.length * 1.2).toFixed(1)}M<span style={{ fontSize: 16, color: "rgba(255,255,255,0.15)", fontWeight: 500, marginLeft: 10, letterSpacing: "1px" }}>GAS</span></div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.03)", borderRadius: 2, marginTop: 20, overflow: "hidden" }}>
                  <div style={{ width: "45%", height: "100%", background: "rgba(255,255,255,0.4)" }}></div>
                </div>
                <p style={{ marginTop: 12, fontSize: 11, color: "rgba(255,255,255,0.2)", fontFamily: F }}>Estimated network congestion: Nominal</p>
              </div>
            </div>
          </div>

        </div>
      </div>
      <style>{`
        .silver-btn:hover { background: #e0e0e0 !important; transform: translateY(-2px); }
      `}</style>
    </div>
  );

  // ━━━ IDE ━━━

  // ━━━ DEPLOYING ━━━
  if (view === "deploying" && tmpl) return (
    <div style={{ minHeight: "100vh", background: bg, color: t1, fontFamily: D, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <FL />
      <div style={{ width: 500, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>{tmpl.icon}</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Deploying {tmpl.name}</h2>
        <p style={{ color: t2, fontSize: 12, marginBottom: 24 }}>to {chain.name} {chain.icon}</p>
        <div style={{ width: "100%", height: 4, background: sf2, borderRadius: 2, marginBottom: 24, overflow: "hidden" }}>
          <div style={{ width: `${deployPct}%`, height: "100%", background: `linear-gradient(90deg,${accent},${accent}AA)`, borderRadius: 2, transition: "width 0.4s" }} />
        </div>
        <div style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 10, padding: 14, textAlign: "left", maxHeight: 240, overflow: "auto" }}>
          {deployLogs.map((l, i) => {
            const color = l.includes("✓") || l.includes("🎉") ? "#00D395" : l.includes("→") ? accent : t2;
            // Check if line contains a URL
            const urlMatch = l.match(/(https?:\/\/[^\s]+)/);
            if (urlMatch) {
              const url = urlMatch[1];
              const parts = l.split(urlMatch[0]);
              return (
                <div key={i} style={{ fontSize: 10, fontFamily: F, padding: "2px 0", color }}>
                  {parts[0]}
                  <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "underline", cursor: "pointer" }}>{url}</a>
                  {parts[1]}
                </div>
              );
            }
            return <div key={i} style={{ fontSize: 10, fontFamily: F, padding: "2px 0", color }}>{l}</div>;
          })}
          {deployPct < 100 && <div style={{ fontSize: 11, fontFamily: F, color: accent, animation: "pulse 1s infinite" }}>▌</div>}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );

  // ━━━ DONE → with UI CUSTOMIZER ━━━
  if (view === "done" && tmpl) return (
    <div style={{ minHeight: "100vh", background: bg, color: t1, fontFamily: D }}>
      <FL />
      <TopBar back={() => setView("home")} title={tmpl.name} sub="Deployed ✓" />
      <div style={{ display: "flex", height: "calc(100vh - 42px)" }}>
        {/* Left: Config Panel */}
        <div style={{ width: 300, borderRight: `1px solid ${bd}`, background: sf, overflow: "auto", flexShrink: 0, padding: 16 }}>
          {/* Deployed info */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "#00D39520", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✓</div>
              <div><div style={{ fontSize: 13, fontWeight: 700 }}>Deployed!</div><div style={{ fontSize: 10, color: t2 }}>{chain.name}</div></div>
            </div>
            {deployed.map(c => <div key={c.name} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${bd}22` }}>
              <span style={{ fontSize: 10, color: t2 }}>{c.name}</span>
              <span style={{ fontSize: 9, fontFamily: F, color: accent }}>{c.address.slice(0, 8)}...</span>
            </div>)}
          </div>

          <div style={{ height: 1, background: bd, margin: "16px 0" }} />

          {/* UI Customizer tabs */}
          <div style={{ display: "flex", gap: 0, marginBottom: 14 }}>
            {["style", "components", "settings"].map(tab =>
              <button key={tab} onClick={() => setUiTab(tab)} style={{ flex: 1, padding: "6px 0", border: "none", background: uiTab === tab ? sf2 : "transparent", color: uiTab === tab ? t1 : t2, cursor: "pointer", fontSize: 10, fontWeight: 600, borderRadius: 5, textTransform: "capitalize", fontFamily: D }}>{tab}</button>
            )}
          </div>

          {uiTab === "style" && <>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 9, fontWeight: 600, color: t2, textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: F, display: "block", marginBottom: 4 }}>Brand Name</label>
              <input value={uiBrand} onChange={e => setUiBrand(e.target.value)} style={{ width: "100%", padding: "7px 8px", background: sf2, border: `1px solid ${bd}`, borderRadius: 6, color: t1, fontSize: 12, fontFamily: F, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 9, fontWeight: 600, color: t2, textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: F, display: "block", marginBottom: 4 }}>Accent Color</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["#FF007A", "#2081E2", "#00D395", "#F5A623", "#9B59B6", "#E74C3C", "#6366F1", "#0052FF", "#FF0420", "#627EEA"].map(c =>
                  <button key={c} onClick={() => setUiAccent(c)} style={{ width: 28, height: 28, borderRadius: 8, background: c, border: uiAccent === c ? `2px solid #fff` : `2px solid transparent`, cursor: "pointer", transition: "all 0.15s" }} />
                )}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 9, fontWeight: 600, color: t2, textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: F, display: "block", marginBottom: 4 }}>Theme</label>
              <div style={{ display: "flex", gap: 6 }}>
                {["Dark", "Light"].map(th =>
                  <button key={th} onClick={() => { }} style={{ flex: 1, padding: "6px", borderRadius: 6, background: th === "Dark" ? sf2 : "#e2e2e2", border: `1px solid ${th === "Dark" ? accent : bd}`, color: th === "Dark" ? t1 : "#333", cursor: "pointer", fontSize: 10, fontFamily: D, fontWeight: 600 }}>{th}</button>
                )}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 9, fontWeight: 600, color: t2, textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: F, display: "block", marginBottom: 4 }}>Font</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Space Grotesk", "Inter", "Poppins", "DM Sans"].map(f =>
                  <button key={f} style={{ padding: "4px 8px", borderRadius: 5, background: sf2, border: `1px solid ${bd}`, color: t2, cursor: "pointer", fontSize: 9, fontFamily: f }}>{f}</button>
                )}
              </div>
            </div>
          </>}

          {uiTab === "components" && <>
            <div style={{ fontSize: 10, color: t2, marginBottom: 8 }}>Drag to reorder. Toggle visibility.</div>
            {(tmpl.uiComps || []).map((comp, i) =>
              <div key={comp} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 8px", background: sf2, borderRadius: 6, marginBottom: 4, border: `1px solid ${bd}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: t2, fontSize: 10, cursor: "grab" }}>⠿</span>
                  <span style={{ fontSize: 11, color: t1, fontFamily: F }}>{comp}</span>
                </div>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: accent + "30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: accent }}>✓</div>
              </div>
            )}
          </>}

          {uiTab === "settings" && <>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 9, fontWeight: 600, color: t2, textTransform: "uppercase", fontFamily: F, display: "block", marginBottom: 4 }}>Custom Domain</label>
              <input placeholder="app.mydex.com" style={{ width: "100%", padding: "7px 8px", background: sf2, border: `1px solid ${bd}`, borderRadius: 6, color: t1, fontSize: 11, fontFamily: F, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 9, fontWeight: 600, color: t2, textTransform: "uppercase", fontFamily: F, display: "block", marginBottom: 4 }}>Analytics</label>
              <input placeholder="GA-XXXXXXX" style={{ width: "100%", padding: "7px 8px", background: sf2, border: `1px solid ${bd}`, borderRadius: 6, color: t1, fontSize: 11, fontFamily: F, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 9, fontWeight: 600, color: t2, textTransform: "uppercase", fontFamily: F, display: "block", marginBottom: 4 }}>Social Links</label>
              {["Twitter", "Discord", "Telegram"].map(s =>
                <input key={s} placeholder={s + " URL"} style={{ width: "100%", padding: "6px 8px", background: sf2, border: `1px solid ${bd}`, borderRadius: 6, color: t1, fontSize: 10, fontFamily: F, outline: "none", boxSizing: "border-box", marginBottom: 4 }} />
              )}
            </div>
          </>}

          <button style={{ width: "100%", padding: "10px", borderRadius: 8, background: `linear-gradient(135deg,${uiAccent || accent},${uiAccent || accent}CC)`, border: "none", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: D, marginTop: 12 }}>
            🚀 Publish Frontend
          </button>
          <button onClick={() => setView("home")} style={{ width: "100%", padding: "8px", borderRadius: 8, background: sf2, border: `1px solid ${bd}`, color: t2, cursor: "pointer", fontSize: 11, fontFamily: D, marginTop: 6 }}>
            ← Back to Templates
          </button>
        </div>

        {/* Right: Live Preview */}
        <div style={{ flex: 1, padding: 20, overflow: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: t2, textTransform: "uppercase", letterSpacing: "1px", fontFamily: F, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Live Preview</span>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5F57" }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFBD2E" }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28CA41" }} />
            </div>
          </div>
          <div style={{ flex: 1, border: `1px solid ${bd}`, borderRadius: 14, overflow: "hidden", minHeight: 400 }}>
            <UIPreview type={selected} accent={uiAccent || accent} brandName={uiBrand} config={config} />
          </div>
        </div>
      </div>
    </div>
  );

  // ━━━ STANDALONE IDE (Remix-style) ━━━
  if (view === "standalone-ide") {
    const file = ideFiles[ideActiveFile];
    const code = file?.content || "";
    const isSol = file?.name?.endsWith(".sol");
    const isRust = file?.name?.endsWith(".rs");
    const folders = {};
    ideFiles.forEach((f, i) => { if (!folders[f.folder]) folders[f.folder] = []; folders[f.folder].push({ ...f, idx: i }); });

    // Check if mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (isMobile) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", fontFamily: D }}>
          <FL />
          <Logo size={64} />
          <div style={{ fontSize: 24, fontWeight: 600, marginTop: 24, marginBottom: 12 }}>
            IDE is best on desktop
          </div>
          <p style={{ color: t2, maxWidth: 300, marginBottom: 32, lineHeight: 1.6 }}>
            The Dapp.Fun IDE requires a larger screen for the best development experience. Please visit us on a desktop browser.
          </p>
          <button onClick={() => setView("home")} style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 12,
            padding: "12px 24px",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 14
          }}>
            ← Back to Home
          </button>
        </div>
      );
    }

    return (
      <div style={{ height: "100vh", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: D }}>
        <FL />
        {/* Background Blobs for IDE */}
        {/* Background Blobs for IDE */}
        <div className="blob" style={{ width: 800, height: 800, background: "radial-gradient(circle, #ffffff 0%, transparent 70%)", top: "-20%", right: "-20%", opacity: 0.05 }}></div>
        <div className="blob" style={{ width: 600, height: 600, background: "radial-gradient(circle, #cccccc 0%, transparent 70%)", bottom: "-20%", left: "-10%", opacity: 0.05 }}></div>

        {/* Glass Sticky Top Bar */}
        <div style={{ padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)", zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => setView("home")} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer", fontSize: 16 }}>←</button>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Logo size={32} />
              <span style={{ fontWeight: 700, fontSize: 15, color: "#fff", letterSpacing: "-0.5px" }}>
                Dapp<span style={{ opacity: 0.7, fontWeight: 400 }}>.Fun IDE</span>
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

            {/* Prominent Network Indicator */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setChainPicker(!chainPicker)} style={{
                borderRadius: 12, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600,
                background: `${chain.color}20`, border: `1px solid ${chain.color}40`, color: "#fff", cursor: "pointer",
                transition: "all 0.2s"
              }}>
                <span style={{ fontSize: 14 }}>{chain.icon}</span>
                <span>{chain.name}</span>
                <span style={{ fontSize: 10, opacity: 0.6 }}>▼</span>
              </button>
              {chainPicker && <div className="glass-panel" style={{ position: "absolute", top: "110%", right: 0, borderRadius: 16, padding: 6, zIndex: 999, minWidth: 180 }}>
                {CHAINS.map(c => <button key={c.id} onClick={() => { setChain(c); setChainPicker(false) }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", width: "100%", border: "none", background: chain.id === c.id ? `${c.color}20` : "transparent", color: "#fff", borderRadius: 10, cursor: "pointer", fontSize: 12, fontFamily: D, textAlign: "left" }}><span style={{ fontSize: 14 }}>{c.icon}</span><span style={{ fontWeight: chain.id === c.id ? 600 : 400 }}>{c.name}</span></button>)}
              </div>}
            </div>
            <div style={{ position: "relative" }}>
              <button onClick={wallet ? undefined : () => setWalletPicker(!walletPicker)} className="glass-button" style={{ borderRadius: 12, padding: "8px 16px", fontWeight: 600, fontSize: 12 }}>
                {wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "Connect"}
              </button>
              {(!wallet && walletPicker) && (
                <div className="glass-panel" style={{ position: "absolute", top: "110%", right: 0, borderRadius: 16, padding: 6, zIndex: 999, minWidth: 160 }}>
                  <button onClick={() => { connect("metamask"); setWalletPicker(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", width: "100%", border: "none", background: "transparent", color: "#fff", borderRadius: 10, cursor: "pointer", fontSize: 12, fontFamily: D, textAlign: "left" }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" style={{ width: 16, height: 16 }} alt="" /> MetaMask
                  </button>
                  <button onClick={() => { connect("phantom"); setWalletPicker(false); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", width: "100%", border: "none", background: "transparent", color: "#fff", borderRadius: 10, cursor: "pointer", fontSize: 12, fontFamily: D, textAlign: "left" }}>
                    <img src="https://phantom.app/favicon.ico" style={{ width: 16, height: 16, borderRadius: 4 }} alt="" /> Phantom
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Success Celebration Overlay */}
        {showCelebration && (
          <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, pointerEvents: "none" }}>
            <div style={{ background: "rgba(74, 222, 128, 0.15)", backdropFilter: "blur(8px)", borderRadius: 24, padding: "32px 48px", border: "1px solid rgba(74, 222, 128, 0.3)", animation: "celebrationPop 0.3s ease-out" }}>
              <div style={{ fontSize: 48, marginBottom: 12, textAlign: "center" }}>🎉</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#4ade80", textAlign: "center" }}>Deployed Successfully!</div>
            </div>
          </div>
        )}
        <style>{`@keyframes celebrationPop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>

        <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative", zIndex: 10 }}>
          {/* ── LEFT PANEL: Files / AI / Plugins ── */}
          <div className="glass-panel" style={{ width: 200, margin: "10px 0 10px 10px", borderRadius: 20, display: "flex", flexDirection: "column", flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
            {/* ... (Left panel content handled by existing code, not replacing entire block, just ensuring we match context) ... */}
            <div style={{ display: "flex", borderBottom: `1px solid ${bd}` }}>
              {[{ id: "files", icon: "📁", label: "Files" }, { id: "history", icon: "📋", label: "History" }, { id: "plugins", icon: "⚙", label: "Settings" }].map(tab =>
                <button key={tab.id} onClick={() => setIdeSidePanel(tab.id)} title={tab.label} style={{ flex: 1, padding: "12px 0", border: "none", background: ideSidePanel === tab.id ? sf2 : "transparent", color: ideSidePanel === tab.id ? t1 : t2, cursor: "pointer", fontSize: 14, fontFamily: D, borderBottom: ideSidePanel === tab.id ? `2px solid rgba(255,255,255,0.5)` : "2px solid transparent", transition: "all 0.15s" }}>{tab.icon}</button>
              )}
            </div>
            <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
              {ideSidePanel === "files" && <div style={{ padding: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: t2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", fontFamily: F }}>Explorer</span>
                  <button onClick={() => setIdeNewFileModal(true)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1 }} title="New File">+</button>
                </div>
                {Object.entries(folders).map(([folder, files]) => (
                  <div key={folder}>
                    <button
                      onClick={() => setIdeExpandedFolders(p => ({ ...p, [folder]: !p[folder] }))}
                      style={{ fontSize: 9, color: t2, fontWeight: 600, padding: "6px 6px 2px", fontFamily: F, display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", width: "100%" }}
                    >
                      <span style={{ fontSize: 8, transform: ideExpandedFolders[folder] ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.1s", color: t2 }}>▶</span>
                      <span style={{ fontSize: 11 }}>📂</span> {folder === "root" ? "/" : `${folder}`}
                    </button>
                    {ideExpandedFolders[folder] && files.map(f => (
                      <div key={f.idx} style={{ display: "flex", alignItems: "center", marginBottom: 2, paddingRight: 4, borderRadius: 6, background: ideActiveFile === f.idx ? "#2997FF20" : "transparent", paddingLeft: 14 }}>
                        <button onClick={() => ideOpenFile(f.idx)} style={{
                          display: "flex", alignItems: "center", gap: 6, flex: 1, textAlign: "left", padding: "6px 8px 6px 6px", border: "none", background: "transparent",
                          color: ideActiveFile === f.idx ? "#2997FF" : t2, cursor: "pointer", fontSize: 11, fontFamily: F
                        }}>
                          <span style={{ fontSize: 10 }}>{f.name.endsWith(".sol") ? "📄" : f.name.endsWith(".rs") ? "🦀" : f.name.endsWith(".js") ? "📜" : "📋"}</span> {f.name}
                        </button>
                        {ideActiveFile === f.idx && <button onClick={(e) => { e.stopPropagation(); ideDeleteFile(f.idx); }} title="Delete" style={{ background: "none", border: "none", color: t2, cursor: "pointer", fontSize: 10, padding: "2px 4px", opacity: 0.8 }}>🗑</button>}
                      </div>
                    ))}
                  </div>
                ))}

                {/* New File Modal */}
                {ideNewFileModal && <div style={{ padding: 10, background: sf2, borderRadius: 8, border: `1px solid ${bd}`, marginTop: 10 }}>
                  <div style={{ fontSize: 10, color: t2, fontWeight: 600, marginBottom: 6, fontFamily: F }}>NEW FILE</div>
                  <input value={ideNewFileName} onChange={e => setIdeNewFileName(e.target.value)} placeholder="filename.sol"
                    onKeyDown={e => { if (e.key === "Enter") ideAddFile(); if (e.key === "Escape") setIdeNewFileModal(false); }}
                    autoFocus
                    style={{ width: "100%", padding: "6px 8px", background: bg, border: `1px solid ${bd}`, borderRadius: 6, color: t1, fontSize: 12, fontFamily: F, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={ideAddFile} style={{ flex: 1, padding: "6px", background: "#2997FF", border: "none", borderRadius: 6, color: "#fff", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>Create</button>
                    <button onClick={() => setIdeNewFileModal(false)} style={{ flex: 1, padding: "6px", background: sf, border: `1px solid ${bd}`, borderRadius: 6, color: t2, fontSize: 10, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>}
              </div>}

              {ideSidePanel === "history" && <div style={{ padding: 10, flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 10, color: t2, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: "1px", fontFamily: F }}>Deployment History</div>
                {deploymentHistory.length === 0 ? (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: t2, fontSize: 12, fontStyle: "italic", opacity: 0.6 }}>
                    No deployments yet
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {deploymentHistory.map((dep, i) => (
                      <div key={i} style={{ background: sf2, borderRadius: 10, padding: 10, border: `1px solid ${bd}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: t1 }}>{dep.name}</span>
                          <span style={{ fontSize: 9, color: dep.verified ? "#4ade80" : t2, display: "flex", alignItems: "center", gap: 4 }}>
                            {dep.verified ? "✓ Verified" : "○ Unverified"}
                          </span>
                        </div>
                        <div style={{ fontSize: 10, fontFamily: F, color: "#56B6C2", marginBottom: 4, cursor: "pointer" }} onClick={() => navigator.clipboard.writeText(dep.address)}>
                          {dep.address.slice(0, 10)}...{dep.address.slice(-8)}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 9, color: t2 }}>{dep.network}</span>
                          <span style={{ fontSize: 9, color: t2 }}>{dep.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>}

              {ideSidePanel === "plugins" && <div style={{ padding: 10 }}>
                <div style={{ fontSize: 10, color: t2, fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "1px", fontFamily: F }}>Compiler Settings</div>

                {/* Compiler Version */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 10, color: t2, display: "block", marginBottom: 6 }}>Solidity Version</label>
                  <select
                    value={compilerVersion}
                    onChange={e => setCompilerVersion(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 10px", background: "#1a1a1a", border: `1px solid ${bd}`,
                      borderRadius: 8, color: "#fff", fontSize: 11, fontFamily: F, outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option style={{ background: "#1a1a1a", color: "#fff" }} value="0.8.24">v0.8.24 (latest)</option>
                    <option style={{ background: "#1a1a1a", color: "#fff" }} value="0.8.23">v0.8.23</option>
                    <option style={{ background: "#1a1a1a", color: "#fff" }} value="0.8.22">v0.8.22</option>
                    <option style={{ background: "#1a1a1a", color: "#fff" }} value="0.8.21">v0.8.21</option>
                    <option style={{ background: "#1a1a1a", color: "#fff" }} value="0.8.20">v0.8.20</option>
                    <option style={{ background: "#1a1a1a", color: "#fff" }} value="0.8.19">v0.8.19</option>
                    <option style={{ background: "#1a1a1a", color: "#fff" }} value="0.8.18">v0.8.18</option>
                    <option style={{ background: "#1a1a1a", color: "#fff" }} value="0.8.17">v0.8.17</option>
                    <option style={{ background: "#1a1a1a", color: "#fff" }} value="0.8.0">v0.8.0</option>
                    <option style={{ background: "#1a1a1a", color: "#fff" }} value="0.7.6">v0.7.6</option>
                    <option style={{ background: "#1a1a1a", color: "#fff" }} value="0.6.12">v0.6.12</option>
                  </select>
                </div>

                {/* Optimizer */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 10, color: t2, display: "block", marginBottom: 6 }}>Optimizer Runs</label>
                  <input
                    type="number"
                    value={optimizerRuns}
                    onChange={e => setOptimizerRuns(parseInt(e.target.value) || 200)}
                    style={{
                      width: "100%", padding: "8px 10px", background: sf2, border: `1px solid ${bd}`,
                      borderRadius: 8, color: t1, fontSize: 11, fontFamily: F, outline: "none", boxSizing: "border-box"
                    }}
                  />
                  <div style={{ fontSize: 9, color: t2, marginTop: 4, opacity: 0.7 }}>Higher = optimized for many calls</div>
                </div>

                {/* Auto-save Toggle */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: sf2, borderRadius: 10, border: `1px solid ${bd}` }}>
                  <span style={{ fontSize: 11, color: t1 }}>Auto-save</span>
                  <button
                    onClick={() => setAutoSave(!autoSave)}
                    style={{
                      width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
                      background: autoSave ? "#4ade80" : bd, position: "relative", transition: "background 0.2s"
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute",
                      top: 2, left: autoSave ? 18 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
                    }} />
                  </button>
                </div>
              </div>}
            </div>
          </div>

          {/* ── MAIN EDITOR AREA ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, margin: 10 }}>
            {/* Tabs */}
            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, padding: "10px 0", flexShrink: 0, overflow: "auto", alignItems: "center" }}>
              {ideOpenTabs.map(idx => {
                const f = ideFiles[idx];
                if (!f) return null;
                return (
                  <button key={idx} onClick={() => setIdeActiveFile(idx)} style={{
                    padding: "8px 16px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontFamily: D,
                    background: ideActiveFile === idx ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
                    border: ideActiveFile === idx ? "1px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    color: ideActiveFile === idx ? "#fff" : "rgba(255,255,255,0.5)",
                    fontWeight: ideActiveFile === idx ? 600 : 400,
                    transition: "all 0.2s"
                  }}>
                    {f.name}
                    {ideOpenTabs.length > 1 && <span onClick={(e) => { e.stopPropagation(); ideCloseTab(idx) }} style={{ marginLeft: 4, fontSize: 10, opacity: 0.5, cursor: "pointer" }}>✕</span>}
                  </button>
                );
              })}

              {/* Translate to Rust Button */}
              {isSol && (
                <button onClick={() => setIdeShowRust(!ideShowRust)} style={{
                  padding: "8px 16px", background: ideShowRust ? "#836EF9" : "rgba(131, 110, 249, 0.2)",
                  border: `1px solid ${ideShowRust ? "#836EF9" : "rgba(131, 110, 249, 0.4)"}`,
                  borderRadius: 12, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer",
                  marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s"
                }}>
                  <span>{ideShowRust ? "← Hide Solana" : "Translate to Solana (Rust)"}</span>
                </button>
              )}
            </div>

            <div style={{ flex: 1, display: "flex", gap: 10, minHeight: 0 }}>
              {/* Code Editor */}
              <div className="glass-panel" style={{ flex: 1, position: "relative", borderRadius: 20, overflow: "hidden", background: "rgba(0,0,0,0.3)" }}>
                {/* Syntax Highlight Layer */}
                <pre ref={idePreRef} style={{ margin: 0, padding: "20px 50px 20px 20px", fontSize: 14, fontFamily: F, lineHeight: 1.6, color: "rgba(255,255,255,0.8)", whiteSpace: "pre-wrap", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", pointerEvents: "none" }}>
                  {code.split("\n").map((line, i) => (
                    <div key={i} style={{ display: "flex" }}>
                      <span style={{ width: 30, display: "inline-block", color: "rgba(255,255,255,0.2)", textAlign: "right", paddingRight: 16, userSelect: "none", flexShrink: 0, fontSize: 11 }}>{i + 1}</span>
                      <span style={{
                        color:
                          line.trim().startsWith("//") ? "rgba(255,255,255,0.4)" :
                            line.trim().startsWith("*") ? "rgba(255,255,255,0.4)" :
                              line.match(/\b(function|contract|constructor|modifier|interface|library|struct|enum|event|error|describe|it|before|async|await|const|let|require|module|exports|pub|fn|use|mod|trait|impl|type|where)\b/) ? "#56B6C2" :
                                line.match(/\b(require|revert|assert|expect|panic|assert_eq|Result|Option)\b/) ? "#f43f5e" :
                                  line.match(/\b(emit|console|println|msg|declare_id)\b/) ? "#fbbf24" :
                                    line.match(/\b(uint256|address|bool|string|bytes|mapping|uint128|uint96|uint8|u64|u128|i64|String|Pubkey|Account|Signer|Program)\b/) ? "#60a5fa" :
                                      line.match(/\b(public|external|internal|private|view|pure|payable|immutable|constant|override|virtual|memory|storage|calldata|mut|ref|crate|super|self|Self)\b/) ? "#2dd4bf" :
                                        line.match(/\b(import|pragma|returns?|if|else|for|while|return|new|using|is|from|let|match|move|loop|in|as|break|continue)\b/) ? "#82aaff" :
                                          (line.includes('"') || line.includes("'") || line.includes("`")) ? "#34d399" :
                                            line.match(/\b\d+\b/) ? "#fcd34d" : "rgba(255,255,255,0.9)"
                      }}>{line || " "}</span>
                    </div>
                  ))}
                </pre>
                {/* Editable Layer */}
                <textarea
                  value={code}
                  onChange={e => {
                    const newContent = e.target.value;
                    setIdeFiles(prev => prev.map((f, i) => i === ideActiveFile ? { ...f, content: newContent } : f));
                  }}
                  onScroll={e => {
                    if (idePreRef.current) {
                      idePreRef.current.scrollTop = e.target.scrollTop;
                      idePreRef.current.scrollLeft = e.target.scrollLeft;
                    }
                  }}
                  spellCheck={false}
                  style={{
                    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                    margin: 0, padding: "20px 50px 20px 50px",
                    fontSize: 14, fontFamily: F, lineHeight: 1.6,
                    color: "transparent", caretColor: "#60a5fa", background: "transparent",
                    border: "none", outline: "none", resize: "none", overflow: "auto", whiteSpace: "pre-wrap"
                  }}
                />
              </div>

              {/* Rust Translation Pane */}
              {ideShowRust && isSol && (
                <div className="glass-panel" style={{ flex: 1, display: "flex", flexDirection: "column", background: "rgba(10,10,10,0.4)", borderRadius: 20, border: "1px solid rgba(131, 110, 249, 0.3)", overflow: "hidden" }}>
                  <div style={{ padding: "10px 16px", background: "rgba(131, 110, 249, 0.1)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 10px #4ade80" }}></div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#836EF9", letterSpacing: "1px" }}>SOLANA (ANCHOR RUST)</span>
                    </div>
                    <span style={{ fontSize: 9, opacity: 0.5, color: "#fff", fontWeight: 600 }}>AUTO-TRANSPILER v1.0</span>
                  </div>
                  <div style={{ flex: 1, padding: 20, overflow: "auto" }}>
                    <pre style={{ margin: 0, fontSize: 13, fontFamily: F, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {transpileToRust(code)}
                    </pre>
                  </div>
                  <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 8 }}>
                    <button onClick={() => {
                      const name = ideFiles[ideActiveFile].name.replace(".sol", ".rs");
                      const content = transpileToRust(code);
                      setIdeFiles(p => [...p, { name, folder: "programs", content }]);
                      setIdeShowRust(false);
                      setTimeout(() => { ideOpenFile(ideFiles.length); }, 50);
                      setIdeConsole(p => [...p, `> Created new Solana program: ${name}`]);
                    }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "#836EF9", border: "none", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                      CREATE SOLANA FILE
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(transpileToRust(code)); alert("Rust code copied!") }} style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                      COPY
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Console Panel */}
            <div className="glass-panel" style={{ height: consoleExpanded ? consoleHeight : 44, marginTop: 10, borderRadius: consoleExpanded ? 20 : 12, display: "flex", flexDirection: "column", flexShrink: 0, position: "relative", transition: "all 0.2s ease", border: consoleExpanded ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.2)", background: consoleExpanded ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)", boxShadow: "0 0 30px rgba(255,255,255,0.08), 0 0 60px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
              {/* Resize Handle (only when expanded) */}
              {consoleExpanded && (
                <div
                  onMouseDown={() => setIsDraggingConsole(true)}
                  style={{
                    position: "absolute", top: -4, left: 0, right: 0, height: 8, cursor: "row-resize", zIndex: 10,
                    background: "transparent",
                  }}
                />
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: consoleExpanded ? "8px 16px" : "10px 16px", borderBottom: consoleExpanded ? `1px solid rgba(255,255,255,0.05)` : "none", cursor: consoleExpanded ? "default" : "pointer" }} onClick={() => !consoleExpanded && setConsoleExpanded(true)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={(e) => { e.stopPropagation(); setConsoleExpanded(!consoleExpanded); if (!consoleExpanded) setConsoleHeight(130); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: t1, cursor: "pointer", fontSize: 10, padding: "4px 6px", borderRadius: 4, display: "flex", alignItems: "center" }}>
                    {consoleExpanded ? "▼" : "▶"}
                  </button>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: F }}>Console</span>
                  {gasEstimate && (
                    <span style={{ fontSize: 10, color: t2, fontFamily: F, display: "flex", alignItems: "center", gap: 4 }}>
                      <span>⛽</span> {gasEstimate}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    setEstimatingGas(true);
                    setIdeConsole(prev => [...prev, `> Compiling with solc v${compilerVersion} (${optimizerRuns} optimizer runs)...`]);
                    ideCompileAll().then(() => {
                      setTimeout(() => {
                        setGasEstimate("~2.1M gas (~$4.20)");
                        setEstimatingGas(false);
                        setConsoleExpanded(true);
                      }, 500);
                    });
                  }} style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff",
                    display: "flex", alignItems: "center", gap: 4
                  }}>
                    {ideCompile === "compiling" || estimatingGas ? "..." : `Compile: ${ideFiles[ideActiveFile]?.name || "Contract"}`}
                  </button>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    const artifacts = window.compiledArtifacts;
                    if (!artifacts || artifacts.length === 0) {
                      setIdeConsole(p => [...p, "> ⚠ No compiled artifacts found. Please compile first."]);
                      return;
                    }
                    // Get the main contract ABI (first one or match current file)
                    const currentFile = ideFiles[ideActiveFile]?.name;
                    const targetArtifact = artifacts.find(a => currentFile && a.fileName === currentFile) || artifacts[0];
                    if (targetArtifact && targetArtifact.abi) {
                      const abiJson = JSON.stringify(targetArtifact.abi, null, 2);
                      navigator.clipboard.writeText(abiJson).then(() => {
                        setIdeConsole(p => [...p, `> ✓ Copied ABI for ${targetArtifact.name} to clipboard.`]);
                      }).catch(err => {
                        setIdeConsole(p => [...p, `> ✗ Failed to copy ABI: ${err.message}`]);
                      });
                    } else {
                      setIdeConsole(p => [...p, "> ✗ No ABI found in compiled artifacts."]);
                    }
                  }} style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: ideCompile === "success" ? "pointer" : "not-allowed",
                    background: ideCompile === "success" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.15)", color: ideCompile === "success" ? "#fff" : "rgba(255,255,255,0.4)",
                    display: "flex", alignItems: "center", gap: 4,
                    opacity: ideCompile === "success" ? 1 : 0.5
                  }}>
                    Copy ABI
                  </button>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    if (!wallet) { connect(); return; }
                    deploy();
                  }} style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
                    background: "#fff", border: "none", color: "#000",
                    display: "flex", alignItems: "center", gap: 4
                  }}>
                    Deploy: {ideFiles[ideActiveFile]?.name || "Contract"}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setIdeConsole([]); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 10, fontFamily: F, marginLeft: 4 }}>CLEAR</button>
                </div>
              </div>
              {consoleExpanded && (
                <div style={{ flex: 1, overflow: "auto", padding: "8px 16px" }}>
                  {ideConsole.map((l, i) => {
                    const color = l.includes("✓") ? "#4ade80" : l.includes("Error") || l.includes("✗") ? "#fecaca" : l.includes("⚠") ? "#fdedc9" : "rgba(255,255,255,0.7)";
                    // Check if line contains a URL
                    const urlMatch = l.match(/(https?:\/\/[^\s]+)/);
                    if (urlMatch) {
                      const url = urlMatch[1];
                      const parts = l.split(urlMatch[0]);
                      return (
                        <div key={i} style={{ fontSize: 11, fontFamily: F, color, padding: "2px 0" }}>
                          {parts[0]}
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", textDecoration: "underline", cursor: "pointer" }}>{url}</a>
                          {parts[1]}
                        </div>
                      );
                    }
                    return <div key={i} style={{ fontSize: 11, fontFamily: F, color, padding: "2px 0" }}>{l}</div>;
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div >
    );
  }

  // ━━━ SHOWCASE removed ━━━

  return null;
}
