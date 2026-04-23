// ===== js/parallax.js =====
// Параллакс-эффекты для карточек

(function() {
    'use strict';
    
    const Parallax = {
        elements: [],
        mouseX: 0,
        mouseY: 0,
        
        init: function() {
            this.elements = Array.from(document.querySelectorAll('[data-depth]'));
            if (!this.elements.length) return;
            
            this.bindEvents();
            console.log('Параллакс запущен');
        },
        
        bindEvents: function() {
            document.addEventListener('mousemove', (e) => {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
                this.update();
            });
        },
        
        update: function() {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            const moveX = (this.mouseX - centerX) / centerX;
            const moveY = (this.mouseY - centerY) / centerY;
            
            this.elements.forEach(el => {
                const depth = parseFloat(el.dataset.depth) || 0.1;
                
                // Вычисляем смещение
                const translateX = moveX * depth * 40;
                const translateY = moveY * depth * 40;
                const rotateX = moveY * depth * 3;
                const rotateY = -moveX * depth * 3;
                
                el.style.transform = `perspective(1000px) translateX(${translateX}px) translateY(${translateY}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });
        }
    };
    
    document.addEventListener('DOMContentLoaded', () => Parallax.init());
    
})();