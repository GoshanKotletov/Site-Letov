// ===== js/audio.js =====
// Атмосферный генеративный звук

(function() {
    'use strict';
    
    const AudioSystem = {
        context: null,
        isPlaying: false,
        oscillators: [],
        gainNode: null,
        filter: null,
        lfoInterval: null,
        btn: null,
        
        init: function() {
            this.btn = document.getElementById('audioBtn');
            if (!this.btn) return;
            
            this.btn.addEventListener('click', () => this.toggle());
            console.log('Аудиосистема готова');
        },
        
        toggle: function() {
            if (this.isPlaying) {
                this.stop();
            } else {
                this.start();
            }
        },
        
        start: function() {
            if (!this.context) {
                try {
                    this.context = new (window.AudioContext || window.webkitAudioContext)();
                } catch(e) {
                    console.warn('Web Audio API не поддерживается');
                    return;
                }
            }
            
            if (this.context.state === 'suspended') {
                this.context.resume();
            }
            
            // Главный генератор (басовый дрон)
            const osc1 = this.context.createOscillator();
            const osc2 = this.context.createOscillator();
            const osc3 = this.context.createOscillator();
            
            this.gainNode = this.context.createGain();
            this.filter = this.context.createBiquadFilter();
            
            // Настройка генераторов
            osc1.type = 'sine';
            osc1.frequency.value = 55; // A1
            
            osc2.type = 'triangle';
            osc2.frequency.value = 110; // A2
            
            osc3.type = 'sine';
            osc3.frequency.value = 82.41; // E2
            
            // Фильтр
            this.filter.type = 'lowpass';
            this.filter.frequency.value = 400;
            this.filter.Q.value = 0.5;
            
            // Громкость
            this.gainNode.gain.value = 0.04;
            
            // Подключение
            osc1.connect(this.filter);
            osc2.connect(this.filter);
            osc3.connect(this.filter);
            this.filter.connect(this.gainNode);
            this.gainNode.connect(this.context.destination);
            
            osc1.start();
            osc2.start();
            osc3.start();
            
            this.oscillators = [osc1, osc2, osc3];
            
            // Модуляция для атмосферности
            this.lfoInterval = setInterval(() => {
                if (this.oscillators.length) {
                    const time = Date.now() / 2000;
                    
                    // Медленная модуляция частот
                    this.oscillators[0].frequency.value = 55 + Math.sin(time * 0.3) * 3;
                    this.oscillators[1].frequency.value = 110 + Math.sin(time * 0.5) * 5;
                    this.oscillators[2].frequency.value = 82.41 + Math.sin(time * 0.7) * 4;
                    
                    // Движение фильтра
                    this.filter.frequency.value = 350 + Math.sin(time * 0.4) * 150;
                    
                    // Лёгкое изменение громкости
                    this.gainNode.gain.value = 0.04 + Math.sin(time * 0.2) * 0.01;
                }
            }, 50);
            
            this.isPlaying = true;
            this.btn.classList.add('playing');
            this.btn.textContent = '❚❚';
            
            console.log('Аудио включено');
        },
        
        stop: function() {
            if (this.lfoInterval) {
                clearInterval(this.lfoInterval);
                this.lfoInterval = null;
            }
            
            this.oscillators.forEach(osc => {
                try {
                    osc.stop();
                    osc.disconnect();
                } catch(e) {}
            });
            
            this.oscillators = [];
            
            this.isPlaying = false;
            this.btn.classList.remove('playing');
            this.btn.textContent = '▶';
            
            console.log('Аудио выключено');
        }
    };
    
    document.addEventListener('DOMContentLoaded', () => AudioSystem.init());
    
})();