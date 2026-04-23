// ===== js/particles.js =====
// Космическое небо со звёздами

(function() {
    'use strict';
    
    const Stars = {
        canvas: null,
        ctx: null,
        stars: [],
        numStars: 400,
        width: 0,
        height: 0,
        mouseX: 0,
        mouseY: 0,
        
        init: function() {
            this.canvas = document.getElementById('stars-canvas');
            if (!this.canvas) return;
            
            this.ctx = this.canvas.getContext('2d');
            
            this.resize();
            this.createStars();
            this.bindEvents();
            this.animate();
            
            console.log('Космическое небо запущено');
        },
        
        resize: function() {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
        },
        
        createStars: function() {
            this.stars = [];
            
            for (let i = 0; i < this.numStars; i++) {
                this.stars.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    radius: Math.random() * 2.5 + 0.5,
                    brightness: Math.random() * 0.7 + 0.3,
                    speed: Math.random() * 0.05 + 0.01,
                    angle: Math.random() * Math.PI * 2,
                    twinkleSpeed: Math.random() * 0.02 + 0.005,
                    twinklePhase: Math.random() * Math.PI * 2
                });
            }
            
            // Добавляем несколько крупных звёзд
            for (let i = 0; i < 10; i++) {
                this.stars.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    radius: Math.random() * 4 + 2,
                    brightness: Math.random() * 0.5 + 0.5,
                    speed: 0.005,
                    angle: Math.random() * Math.PI * 2,
                    twinkleSpeed: 0.01,
                    twinklePhase: Math.random() * Math.PI * 2,
                    isBig: true
                });
            }
        },
        
        bindEvents: function() {
            window.addEventListener('resize', () => {
                this.resize();
                this.createStars();
            });
            
            document.addEventListener('mousemove', (e) => {
                this.mouseX = (e.clientX / this.width - 0.5) * 2;
                this.mouseY = (e.clientY / this.height - 0.5) * 2;
            });
        },
        
        animate: function() {
            this.ctx.clearRect(0, 0, this.width, this.height);
            
            // Параллакс-эффект от мыши
            const offsetX = this.mouseX * 30;
            const offsetY = this.mouseY * 30;
            
            this.stars.forEach(star => {
                // Мерцание
                const twinkle = Math.sin(Date.now() * star.twinkleSpeed + star.twinklePhase) * 0.2 + 0.8;
                const brightness = star.brightness * twinkle;
                
                // Движение (очень медленное)
                star.angle += star.speed * 0.01;
                star.x += Math.cos(star.angle) * star.speed * (1 + this.mouseX * 2);
                star.y += Math.sin(star.angle) * star.speed * (1 + this.mouseY * 2);
                
                // Зацикливание
                if (star.x < 0) star.x = this.width;
                if (star.x > this.width) star.x = 0;
                if (star.y < 0) star.y = this.height;
                if (star.y > this.height) star.y = 0;
                
                // Рисование звезды
                const drawX = star.x + offsetX * (star.radius / 3);
                const drawY = star.y + offsetY * (star.radius / 3);
                
                // Свечение для крупных звёзд
                if (star.isBig) {
                    const gradient = this.ctx.createRadialGradient(drawX, drawY, 0, drawX, drawY, star.radius * 4);
                    gradient.addColorStop(0, `rgba(255, 255, 255, ${brightness * 0.3})`);
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    this.ctx.fillStyle = gradient;
                    this.ctx.beginPath();
                    this.ctx.arc(drawX, drawY, star.radius * 4, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                // Основная звезда
                this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
                this.ctx.beginPath();
                this.ctx.arc(drawX, drawY, star.radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Крест для ярких звёзд
                if (star.isBig && brightness > 0.6) {
                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${brightness * 0.4})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(drawX - star.radius * 3, drawY);
                    this.ctx.lineTo(drawX + star.radius * 3, drawY);
                    this.ctx.moveTo(drawX, drawY - star.radius * 3);
                    this.ctx.lineTo(drawX, drawY + star.radius * 3);
                    this.ctx.stroke();
                }
            });
            
            requestAnimationFrame(() => this.animate());
        }
    };
    
    // Запуск при загрузке
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Stars.init());
    } else {
        Stars.init();
    }
    
})();