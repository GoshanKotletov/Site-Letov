// ===== js/preloader.js =====
// Прелоадер

(function() {
    'use strict';
    
    const Preloader = {
        element: null,
        progressFill: null,
        progressText: null,
        mainContent: null,
        progress: 0,
        interval: null,
        
        init: function() {
            this.element = document.getElementById('preloader');
            this.progressFill = document.getElementById('progressFill');
            this.progressText = document.getElementById('progress');
            this.mainContent = document.getElementById('mainContent');
            
            if (!this.element) return;
            
            this.start();
            console.log('Прелоадер запущен');
        },
        
        start: function() {
            this.interval = setInterval(() => {
                this.progress += Math.random() * 10;
                
                if (this.progress >= 100) {
                    this.progress = 100;
                    this.update();
                    this.complete();
                    clearInterval(this.interval);
                } else {
                    this.update();
                }
            }, 80);
            
            // Гарантия завершения
            setTimeout(() => {
                if (this.progress < 90) {
                    this.progress = 90;
                    this.update();
                }
            }, 1500);
        },
        
        update: function() {
            const p = Math.min(Math.floor(this.progress), 100);
            this.progressFill.style.width = p + '%';
            this.progressText.textContent = p + '%';
        },
        
        complete: function() {
            this.progress = 100;
            this.update();
            
            setTimeout(() => {
                this.element.classList.add('hidden');
                this.mainContent.style.opacity = '1';
                
                // Запускаем анимации
                setTimeout(() => {
                    this.initAnimations();
                }, 200);
                
                console.log('Загрузка завершена');
            }, 500);
        },
        
        initAnimations: function() {
            // Intersection Observer для анимаций
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
            
            document.querySelectorAll('.animate, .section').forEach(el => {
                observer.observe(el);
            });
            
            // GSAP анимации если доступны
            if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                gsap.registerPlugin(ScrollTrigger);
                
                gsap.utils.toArray('.section').forEach(section => {
                    gsap.fromTo(section, 
                        { opacity: 0, y: 50 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 1,
                            scrollTrigger: {
                                trigger: section,
                                start: 'top 80%',
                                end: 'bottom 20%',
                                toggleActions: 'play none none none'
                            }
                        }
                    );
                });
            }
            
            // Сохраняем функцию для переиспользования
            window.checkAnimations = () => {
                document.querySelectorAll('.animate, .section').forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.top < window.innerHeight * 0.85) {
                        el.classList.add('visible');
                    }
                });
            };
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Preloader.init());
    } else {
        Preloader.init();
    }
    
})();