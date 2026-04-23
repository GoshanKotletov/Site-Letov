// ===== js/cursor.js =====
// Кастомный курсор (знак анархии)

(function() {
    'use strict';
    
    const Cursor = {
        cursor: null,
        cursorDot: null,
        mouseX: 0,
        mouseY: 0,
        cursorX: 0,
        cursorY: 0,
        dotX: 0,
        dotY: 0,
        raf: null,
        isTouch: false,
        
        init: function() {
            this.cursor = document.querySelector('.cursor-anarchy');
            this.cursorDot = document.querySelector('.cursor-dot');
            
            if (!this.cursor || !this.cursorDot) return;
            
            // Проверка на тач-устройство
            this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            if (this.isTouch) {
                this.cursor.style.display = 'none';
                this.cursorDot.style.display = 'none';
                document.body.style.cursor = 'auto';
                return;
            }
            
            this.bindEvents();
            this.animate();
            
            console.log('Курсор анархии запущен');
        },
        
        bindEvents: function() {
            document.addEventListener('mousemove', (e) => {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
            });
            
            document.addEventListener('mouseleave', () => {
                this.cursor.style.opacity = '0';
                this.cursorDot.style.opacity = '0';
            });
            
            document.addEventListener('mouseenter', () => {
                this.cursor.style.opacity = '1';
                this.cursorDot.style.opacity = '1';
            });
            
            // Эффект при наведении на интерактивные элементы
            const interactive = document.querySelectorAll('a, button, .tab, .card, .timeline-node, .album-row');
            
            interactive.forEach(el => {
                el.addEventListener('mouseenter', () => {
                    this.cursor.classList.add('active');
                    this.cursorDot.style.transform = 'translate(-50%, -50%) scale(1.5)';
                });
                
                el.addEventListener('mouseleave', () => {
                    this.cursor.classList.remove('active');
                    this.cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
                });
            });
            
            // При клике
            document.addEventListener('mousedown', () => {
                this.cursor.style.transform = 'translate(-50%, -50%) scale(0.9)';
            });
            
            document.addEventListener('mouseup', () => {
                this.cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            });
        },
        
        animate: function() {
            const lerp = (start, end, factor) => start + (end - start) * factor;
            
            const step = () => {
                // Плавное следование
                this.cursorX = lerp(this.cursorX, this.mouseX, 0.12);
                this.cursorY = lerp(this.cursorY, this.mouseY, 0.12);
                
                this.dotX = lerp(this.dotX, this.mouseX, 0.3);
                this.dotY = lerp(this.dotY, this.mouseY, 0.3);
                
                if (this.cursor) {
                    this.cursor.style.left = this.cursorX + 'px';
                    this.cursor.style.top = this.cursorY + 'px';
                }
                
                if (this.cursorDot) {
                    this.cursorDot.style.left = this.dotX + 'px';
                    this.cursorDot.style.top = this.dotY + 'px';
                }
                
                this.raf = requestAnimationFrame(step);
            };
            
            this.raf = requestAnimationFrame(step);
        }
    };
    
    document.addEventListener('DOMContentLoaded', () => Cursor.init());
    
})();