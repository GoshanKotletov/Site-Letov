// ===== js/main.js =====
// Главный инициализирующий скрипт

(function() {
    'use strict';
    
    const App = {
        
        init: function() {
            this.initPreloader();
            this.initAnimations();
            this.initTimeline();
            this.initFullscreen();
            this.updateTabIndicator();
            
            console.log('ГРАЖДАНСКАЯ ОБОРОНА · МОНУМЕНТ');
            console.log('ВСЁ ИДЁТ ПО ПЛАНУ');
        },
        
        initPreloader: function() {
            const preloader = document.getElementById('preloader');
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progress');
            const mainContent = document.getElementById('mainContent');
            
            if (!preloader) {
                if (mainContent) mainContent.style.opacity = '1';
                this.initAnimations();
                return;
            }
            
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 12;
                
                if (progress >= 100) {
                    progress = 100;
                    if (progressFill) progressFill.style.width = '100%';
                    if (progressText) progressText.textContent = '100%';
                    clearInterval(interval);
                    
                    setTimeout(() => {
                        preloader.classList.add('hidden');
                        if (mainContent) mainContent.style.opacity = '1';
                        this.initAnimations();
                    }, 500);
                } else {
                    if (progressFill) progressFill.style.width = progress + '%';
                    if (progressText) progressText.textContent = Math.floor(progress) + '%';
                }
            }, 80);
        },
        
        initAnimations: function() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
            
            document.querySelectorAll('.animate, .section').forEach(el => {
                observer.observe(el);
                // Проверка при загрузке
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight * 0.85) {
                    el.classList.add('visible');
                }
            });
            
            // GSAP если есть
            if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                gsap.registerPlugin(ScrollTrigger);
                gsap.utils.toArray('.section').forEach(section => {
                    gsap.fromTo(section, 
                        { opacity: 0, y: 50 },
                        { opacity: 1, y: 0, duration: 1, scrollTrigger: {
                            trigger: section, start: 'top 80%', toggleActions: 'play none none none'
                        }}
                    );
                });
            }
        },
        
        initTimeline: function() {
            document.querySelectorAll('.timeline-node').forEach(node => {
                node.addEventListener('click', () => {
                    const year = node.dataset.year;
                    const album = node.dataset.album;
                    this.showToast(year, album);
                    
                    node.style.transform = 'scale(2)';
                    node.style.background = 'var(--text)';
                    setTimeout(() => {
                        node.style.transform = '';
                        node.style.background = '';
                    }, 300);
                });
            });
        },
        
        showToast: function(year, album) {
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed; bottom: 120px; left: 50%; transform: translateX(-50%);
                background: rgba(0,0,0,0.95); border: 1px solid #fff; padding: 1.5rem 3rem;
                z-index: 100000; text-align: center; backdrop-filter: blur(10px);
                animation: slideUp 0.3s ease-out; font-family: 'Space Mono', monospace;
            `;
            toast.innerHTML = `
                <div style="font-size: 2.5rem; font-weight: 900; color: #fff;">${year}</div>
                <div style="font-size: 1.1rem; color: #aaa; text-transform: uppercase; letter-spacing: 0.2em;">${album}</div>
            `;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s';
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        },
        
        initFullscreen: function() {
            const btn = document.getElementById('fullscreenBtn');
            if (!btn) return;
            btn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                    btn.textContent = '✕';
                } else {
                    document.exitFullscreen();
                    btn.textContent = '⛶';
                }
            });
        },
        
        updateTabIndicator: function() {
            const indicator = document.querySelector('.tab-indicator');
            const activeTab = document.querySelector('.tab.active');
            if (indicator && activeTab) {
                indicator.style.width = activeTab.offsetWidth + 'px';
                indicator.style.left = activeTab.offsetLeft + 'px';
            }
        }
    };
    
    document.addEventListener('DOMContentLoaded', () => App.init());
    window.addEventListener('resize', () => App.updateTabIndicator());
    
})();