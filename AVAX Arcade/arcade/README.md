# 🎮 Soneium Arcade

A modern, Neo-Arcade homepage built for the Soneium Network. Built on the OP Stack by Sony Block Solutions Labs.

## ✨ Features

- **Soneium Brand Aesthetic**: Monochrome tech style with neon accents
- **Neo-Arcade Theme**: Flashy interactive grid backgrounds and glassmorphism
- **Responsive Layout**: Optimized for all device sizes
- **Smooth Animations**: Parallax effects, hover interactions, and scroll animations
- **Game Showcase**: Featured game cards with stats and "Play Now" buttons
- **Network Stats**: Display Soneium Network's high-performance capabilities (L2 by Sony)
- **Ready to Scale**: Easy to add more games as your arcade grows

## 🎨 Design Philosophy

- Soneium monochrome style (Black/White/Silver)
- Neon active states and glowing accents
- Geometric 3D elements
- Perspective grid animations
- Flashy arcade interactions

## 🚀 Getting Started

1. Simply open `index.html` in your web browser
2. No build process required - pure HTML, CSS, and JavaScript

```bash
# If you want to run a local server
python -m http.server 8000
# or
npx serve
```

Then visit `http://localhost:8000`

## 🎯 Customization

### Adding New Games

Edit the `games-grid` section in `index.html`:

```html
<div class="game-card">
    <div class="game-image your-game-bg">
        <div class="game-badge">New</div>
    </div>
    <div class="game-info">
        <h3>Your Game Name</h3>
        <p>Game description</p>
        <div class="game-stats">
            <!-- Add your stats -->
        </div>
        <button class="btn-play">Play Now</button>
    </div>
</div>
```

### Customizing Colors

All colors are defined in CSS variables in `styles.css`:

```css
:root {
    --soneium-black: #000000;
    --soneium-white: #FFFFFF;
    --soneium-active: #45ffb1;
}
```

### Connecting Your Bushido Game

Update the Play Now button in `script.js`:

```javascript
document.querySelectorAll('.btn-play').forEach(button => {
    button.addEventListener('click', (e) => {
        const gameName = e.target.closest('.game-card').querySelector('h3').textContent;
        if (gameName === 'Bushido') {
            window.location.href = '/bushido'; // Your Bushido game URL
        }
    });
});
```

## 🔗 Integration with Web3

The "Connect Wallet" button is ready for Web3 integration. Add your preferred wallet connection library (WalletConnect, MetaMask, etc.):

```javascript
// Example with ethers.js
document.querySelector('.btn-connect').addEventListener('click', async () => {
    if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        // Connected!
    }
});
```

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- All modern mobile browsers

## 🎮 Featured Game: Bushido

Your first game is prominently featured with:
- Eye-catching red gradient theme with samurai sword emoji
- Player count and rating display
- Prominent "Play Now" call-to-action

## 🌐 Soneium Network

Built to showcase the power of Soneium Network:
- Built by Sony Block Solutions Labs
- Leveraging the OP Stack
- Sub-second block times
- Extremely scalable and low cost

**Network config:** Chain ID `1868` (0x74c), RPCs and explorers are in [SONEIUM_NETWORK_CONFIG.md](SONEIUM_NETWORK_CONFIG.md). Use that file when configuring games (Quake, Arcade Bots, Snake, Space Game) to run on Soneium instead of Somnia.

**Leaderboards:** One contract (`contracts/SoneiumArcadeLeaderboard.sol`) is used by all four games. Deploy it once to Soneium, then set the same address in each game. See’s  See [DEPLOY_LEADERBOARDS_SONEIUM.md](DEPLOY_LEADERBOARDS_SONEIUM.md).


## 📄 License

This project is open source and available for use in your Soneium Arcade.

## 🤝 Contributing

Feel free to customize and extend this arcade homepage as your game collection grows!

---

Built with ❤️ for the Soneium Network

