// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards and sections
document.querySelectorAll('.game-card, .feature-card, .about-section').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Play Button functionality - now handled by direct links in HTML

// Hero arcade screen: game-style background animation
(function () {
    const canvas = document.getElementById('hero-game-bg');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let w, h;
    let stars = [];
    let gridOffset = 0;
    let ships = [];
    const STAR_COUNT = 80;
    const GRID_SPACING = 48;

    function resize() {
        w = canvas.width = canvas.offsetWidth;
        h = canvas.height = canvas.offsetHeight;
        if (stars.length === 0) {
            for (let i = 0; i < STAR_COUNT; i++) {
                stars.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    size: 0.5 + Math.random() * 1.2,
                    speed: 0.3 + Math.random() * 1.2,
                    opacity: 0.3 + Math.random() * 0.5
                });
            }
            for (let i = 0; i < 5; i++) {
                ships.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.8,
                    vy: 0.2 + Math.random() * 0.4,
                    size: 4 + Math.random() * 6
                });
            }
        }
    }

    function draw() {
        if (!w || !h) return;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        gridOffset = (gridOffset + 0.6) % GRID_SPACING;
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        for (let x = -GRID_SPACING; x < w + GRID_SPACING; x += GRID_SPACING) {
            const sx = x + (gridOffset * (x / w));
            ctx.beginPath();
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, h);
            ctx.stroke();
        }
        for (let y = -GRID_SPACING; y < h + GRID_SPACING; y += GRID_SPACING) {
            const sy = (y + gridOffset) % (h + GRID_SPACING);
            ctx.beginPath();
            ctx.moveTo(0, sy);
            ctx.lineTo(w, sy);
            ctx.stroke();
        }

        stars.forEach(s => {
            s.y -= s.speed;
            if (s.y < 0) { s.y = h; s.x = Math.random() * w; }
            ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ships.forEach(ship => {
            ship.x += ship.vx;
            ship.y += ship.vy;
            if (ship.x < -20 || ship.x > w + 20) ship.vx *= -1;
            if (ship.y < -20 || ship.y > h + 20) {
                ship.y = ship.y < 0 ? h + 10 : -10;
                ship.x = Math.random() * w;
            }
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(ship.x - ship.size, ship.y + ship.size);
            ctx.lineTo(ship.x, ship.y - ship.size);
            ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
            ctx.closePath();
            ctx.stroke();
        });

        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
})();

// Add hover effect to game cards
document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
});

// Dynamic stats counter animation
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const current = Math.floor(progress * target);
        element.textContent = current.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// Animate counters when they come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statValue = entry.target.querySelector('.stat-value');
            if (statValue && !statValue.classList.contains('animated')) {
                const rawValue = statValue.textContent.replace(/,/g, '');
                const target = parseInt(rawValue);
                if (!isNaN(target)) {
                    animateCounter(statValue, target);
                    statValue.classList.add('animated');
                }
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.game-stats').forEach(stats => {
    statsObserver.observe(stats);
});

// Gradient text animation is now handled via CSS animations

// Image Modal Functions
function viewFullImage(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    modalImg.src = imageSrc;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeImageModal();
    }
});

// Load gallery images from postimg.cc
document.addEventListener('DOMContentLoaded', async () => {
    const galleryItems = document.querySelectorAll('.gallery-item');

    // Manual direct URLs map - update these with actual direct image URLs if known
    // Format: code -> direct URL
    const manualDirectUrls = {
        // Example: 'SnrxwD72': 'https://i.postimg.cc/SnrxwD72/image.png',
    };

    // Process each gallery item
    for (const item of galleryItems) {
        const img = item.querySelector('img');
        const pageUrl = item.dataset.pageUrl;
        const code = item.dataset.imageCode;

        // Check manual URLs first
        if (manualDirectUrls[code]) {
            img.src = manualDirectUrls[code];
            img.style.opacity = '1';

            item.addEventListener('click', () => {
                viewFullImage(img.src);
            });
            continue;
        }

        // Try expanded list of possible URL formats (more comprehensive)
        const possibleUrls = [
            // Direct postimg.cc image CDN formats
            `https://i.postimg.cc/${code}/image.png`,
            `https://i.postimg.cc/${code}/image.jpg`,
            `https://i.postimg.cc/${code}.png`,
            `https://i.postimg.cc/${code}.jpg`,
            `https://i.postimg.cc/${code}`,
            // Alternative CDN paths
            `https://i.postimg.cc/gallery/${code}.png`,
            `https://i.postimg.cc/gallery/${code}.jpg`,
            // Base domain formats (less likely but worth trying)
            `https://postimg.cc/${code}/image.png`,
            `https://postimg.cc/${code}/image.jpg`,
            `https://postimg.cc/${code}.png`,
            `https://postimg.cc/${code}.jpg`,
        ];

        let loaded = false;
        let triedUrls = [];

        // Try loading each URL
        for (const url of possibleUrls) {
            const loadedUrl = await new Promise((resolve) => {
                const testImg = new Image();
                testImg.onload = () => {
                    resolve(url);
                };
                testImg.onerror = () => {
                    resolve(null);
                };
                // Set timeout to prevent hanging
                setTimeout(() => resolve(null), 3000);
                testImg.src = url;
            });

            if (loadedUrl) {
                img.src = loadedUrl;
                img.style.opacity = '1';
                loaded = true;
                break;
            }
        }

        // If all URL attempts failed, try fetching via CORS proxy (silently fail if it doesn't work)
        if (!loaded) {
            try {
                // Try alternative CORS proxies silently
                const proxies = [
                    `https://api.allorigins.win/get?url=${encodeURIComponent(pageUrl)}`,
                    `https://corsproxy.io/?${encodeURIComponent(pageUrl)}`
                ];

                for (const proxyUrl of proxies) {
                    try {
                        const response = await Promise.race([
                            fetch(proxyUrl),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
                        ]);

                        if (response.ok) {
                            const data = await response.json();
                            const html = data.contents || data;

                            // Extract image URL from HTML
                            const imgMatch = html.match(/https?:\/\/i\.postimg\.cc\/[^\s"']+\.(png|jpg|jpeg|webp)/i);
                            if (imgMatch && imgMatch[0]) {
                                img.src = imgMatch[0];
                                img.style.opacity = '1';
                                loaded = true;
                                break;
                            }
                        }
                    } catch (e) {
                        // Silently continue to next proxy
                        continue;
                    }
                }
            } catch (e) {
                // Silently continue if CORS proxy fails
            }
        }

        // If still not loaded, show placeholder
        if (!loaded) {
            img.style.opacity = '0.3';
            img.style.background = 'rgba(255, 255, 255, 0.05)';
            img.alt = 'Click to view image';

            // Check if placeholder already exists
            let placeholder = item.querySelector('.image-placeholder');
            if (!placeholder) {
                placeholder = document.createElement('div');
                placeholder.className = 'image-placeholder';
                placeholder.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: rgba(255,255,255,0.6); font-size: 0.9rem; pointer-events: none; z-index: 1;';
                placeholder.textContent = 'Click to view';
                item.style.position = 'relative';
                item.appendChild(placeholder);
            }
        }

        // Set up click handler
        item.addEventListener('click', () => {
            if (img.src && (img.src.includes('i.postimg.cc') || img.src.includes('postimg.cc'))) {
                viewFullImage(img.src);
            } else {
                window.open(pageUrl, '_blank');
            }
        });
    }

    // Prevent modal close when clicking on image or button
    const modalImage = document.getElementById('modalImage');
    const galleryViewButtons = document.querySelectorAll('.gallery-view-btn');

    if (modalImage) {
        modalImage.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    galleryViewButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = btn.closest('.gallery-item');
            const img = item.querySelector('img');
            const pageUrl = item.dataset.pageUrl;
            if (img.src && (img.src.includes('i.postimg.cc') || img.src.includes('postimg.cc'))) {
                viewFullImage(img.src);
            } else {
                window.open(pageUrl, '_blank');
            }
        });
    });
});

// Console easter egg
console.log('%c🎮 Welcome to Soneium Arcade!', 'font-size: 20px; color: #ffffff; font-weight: bold;');
console.log('%cBuilt on the Soneium Network', 'font-size: 14px; color: #888888;');
console.log('%cInterested in building games? Contact us!', 'font-size: 12px; color: #444444;');


