// ===== js/tabs.js =====
// Система вкладок

(function() {
    'use strict';
    
    const Tabs = {
        container: null,
        tabs: [],
        contents: [],
        indicator: null,
        currentIndex: 0,
        
        init: function() {
            this.container = document.querySelector('.tabs-container');
            this.tabs = Array.from(document.querySelectorAll('.tab'));
            this.contents = Array.from(document.querySelectorAll('.tab-content'));
            this.indicator = document.querySelector('.tab-indicator');
            
            if (!this.tabs.length) return;
            
            this.bindEvents();
            this.updateIndicator();
            
            // Проверяем хеш
            const hash = window.location.hash.slice(1);
            if (hash) {
                const tab = this.tabs.find(t => t.dataset.tab === hash);
                if (tab) this.switchTo(tab.dataset.tab);
            }
            
            console.log('Вкладки инициализированы');
        },
        
        bindEvents: function() {
            this.tabs.forEach((tab, index) => {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchTo(tab.dataset.tab);
                });
                
                tab.addEventListener('mouseenter', () => {
                    this.moveIndicator(index);
                });
            });
            
            this.container.addEventListener('mouseleave', () => {
                this.moveIndicator(this.currentIndex);
            });
        },
        
        switchTo: function(tabId) {
            const targetTab = this.tabs.find(t => t.dataset.tab === tabId);
            const targetContent = document.getElementById(`tab-${tabId}`);
            
            if (!targetTab || !targetContent) return;
            
            // Деактивация
            this.tabs.forEach(t => t.classList.remove('active'));
            this.contents.forEach(c => c.classList.remove('active'));
            
            // Активация
            targetTab.classList.add('active');
            targetContent.classList.add('active');
            
            // Обновление индикатора
            this.currentIndex = this.tabs.indexOf(targetTab);
            this.moveIndicator(this.currentIndex);
            
            // Обновление URL
            window.location.hash = tabId;
            
            // Перезапуск анимаций в новой вкладке
            setTimeout(() => {
                if (typeof window.checkAnimations === 'function') {
                    window.checkAnimations();
                }
            }, 100);
            
            console.log('Вкладка переключена:', tabId);
        },
        
        moveIndicator: function(index) {
            if (!this.indicator || !this.tabs[index]) return;
            
            const tab = this.tabs[index];
            const tabRect = tab.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();
            
            this.indicator.style.width = tabRect.width + 'px';
            this.indicator.style.left = (tabRect.left - containerRect.left) + 'px';
        },
        
        updateIndicator: function() {
            if (this.currentIndex >= 0) {
                this.moveIndicator(this.currentIndex);
            }
        }
    };
    
    document.addEventListener('DOMContentLoaded', () => {
        Tabs.init();
        
        window.addEventListener('resize', () => {
            clearTimeout(window._resizeTimeout);
            window._resizeTimeout = setTimeout(() => Tabs.updateIndicator(), 100);
        });
    });
    
})();