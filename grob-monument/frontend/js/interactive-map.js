// ===== js/interactive-map.js =====
// Интерактивная карта связей и влияния

(function() {
    'use strict';
    
    const InteractiveMap = {
        map: null,
        layers: {
            listeners: L.layerGroup(),
            studios: L.layerGroup(),
            influence: L.layerGroup()
        },
        activeLayers: ['listeners', 'studios', 'influence'],
        selectedLat: null,
        selectedLng: null,
        selectedCity: '',
        selectedCountry: '',
        API_URL: '/api',
        
        // Данные о студиях и местах записи
        studiosData: [
            { lat: 54.9833, lng: 73.3667, name: 'ГрОб-студия', desc: 'Домашняя студия Летова в Омске. Здесь записано большинство альбомов 1987-1990 годов.', city: 'Омск' },
            { lat: 55.0302, lng: 82.9204, name: 'Квартира Янки', desc: 'Место записи ранних акустических альбомов Янки Дягилевой.', city: 'Новосибирск' },
            { lat: 55.7558, lng: 37.6173, name: 'Студия на Петровке', desc: 'Московская студия, где записывались поздние альбомы.', city: 'Москва' },
            { lat: 59.9343, lng: 30.3351, name: 'Андрей Тропилло', desc: 'Легендарная студия в Доме юного техника. Здесь записывались многие альбомы Ленинградского рок-клуба.', city: 'Санкт-Петербург' },
        ],
        
        // Данные о группах, на которые повлиял Летов
        influenceData: [
            { lat: 55.7558, lng: 37.6173, name: 'Lumen', desc: 'Группа из Уфы. Вокалист Рустем Булатов неоднократно называл Летова главным вдохновителем.', city: 'Москва' },
            { lat: 56.8389, lng: 60.6057, name: 'Смысловые Галлюцинации', desc: 'Екатеринбургская группа. Сергей Бобунец — поклонник творчества Летова.', city: 'Екатеринбург' },
            { lat: 53.9045, lng: 27.5615, name: 'Ляпис Трубецкой', desc: 'Сергей Михалок не раз говорил о влиянии сибирского панка на раннее творчество.', city: 'Минск' },
            { lat: 50.4501, lng: 30.5234, name: 'Вопли Видоплясова', desc: 'Киевская группа, испытавшая влияние ГрОб в конце 80-х.', city: 'Киев' },
            { lat: 47.0105, lng: 28.8638, name: 'Zdob și Zdub', desc: 'Молдавская группа, смешивающая фолк и панк. Вдохновлялись Летовым.', city: 'Кишинёв' },
            { lat: 48.8566, lng: 2.3522, name: 'La Fraction', desc: 'Французская панк-группа, исполнявшая каверы на песни ГрОб.', city: 'Париж' },
        ],
        
        init: function() {
            this.initMap();
            this.loadListeners();
            this.addStudioMarkers();
            this.addInfluenceMarkers();
            this.loadStats();
            this.loadRecentMarkers();
            this.bindEvents();
            
            console.log('Интерактивная карта связей запущена');
        },
        
        initMap: function() {
            this.map = L.map('map', {
                center: [55.7558, 70.0],
                zoom: 3,
                zoomControl: true,
                fadeAnimation: true
            });
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CARTO, &copy; OpenStreetMap',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(this.map);
            
            // Добавляем все слои на карту
            this.layers.listeners.addTo(this.map);
            this.layers.studios.addTo(this.map);
            this.layers.influence.addTo(this.map);
            
            this.map.on('click', (e) => {
                this.selectedLat = e.latlng.lat;
                this.selectedLng = e.latlng.lng;
                this.reverseGeocode(e.latlng.lat, e.latlng.lng);
            });
        },
        
        addStudioMarkers: function() {
            const studioIcon = L.divIcon({
                className: 'custom-marker',
                html: '<div class="marker-dot" style="background: #b0a088; border-color: #b0a088;"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            
            this.studiosData.forEach(studio => {
                const marker = L.marker([studio.lat, studio.lng], { icon: studioIcon })
                    .bindPopup(`
                        <div style="font-family: 'Space Mono', monospace;">
                            <strong style="color: #000; text-transform: uppercase;">${studio.name}</strong><br>
                            <span style="color: #555;">${studio.city}</span><br>
                            <em style="color: #888; font-size: 0.9rem;">${studio.desc}</em>
                        </div>
                    `);
                
                marker.on('click', () => {
                    this.showInfoPanel(studio.name, studio.desc, studio.city);
                });
                
                this.layers.studios.addLayer(marker);
            });
        },
        
        addInfluenceMarkers: function() {
            const influenceIcon = L.divIcon({
                className: 'custom-marker',
                html: '<div class="marker-dot" style="background: #ff4444; border-color: #ff4444;"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            
            this.influenceData.forEach(item => {
                const marker = L.marker([item.lat, item.lng], { icon: influenceIcon })
                    .bindPopup(`
                        <div style="font-family: 'Space Mono', monospace;">
                            <strong style="color: #000; text-transform: uppercase;">${item.name}</strong><br>
                            <span style="color: #555;">${item.city}</span><br>
                            <em style="color: #888; font-size: 0.9rem;">${item.desc}</em>
                        </div>
                    `);
                
                marker.on('click', () => {
                    this.showInfoPanel(item.name, item.desc, item.city);
                });
                
                this.layers.influence.addLayer(marker);
            });
            
            document.getElementById('totalInfluence').textContent = this.influenceData.length;
            document.getElementById('totalInfluence').setAttribute('data-label', 'ВЛИЯНИЕ');
        },
        
        showInfoPanel: function(title, desc, subtitle) {
            document.getElementById('panelTitle').textContent = title;
            document.getElementById('panelDesc').innerHTML = `<strong>${subtitle}</strong><br><br>${desc}`;
            document.getElementById('infoPanel').classList.add('active');
        },
        
        loadListeners: async function() {
            try {
                const response = await fetch(`${this.API_URL}/markers`);
                const markers = await response.json();
                
                const listenerIcon = L.divIcon({
                    className: 'custom-marker',
                    html: '<div class="marker-dot" style="background: #fff; border-color: #fff;"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });
                
                markers.forEach(m => {
                    const marker = L.marker([m.lat, m.lng], { icon: listenerIcon })
                        .bindPopup(`
                            <div style="font-family: 'Space Mono', monospace;">
                                <strong style="color: #000;">${m.city || 'Неизвестно'}</strong><br>
                                <span style="color: #555;">${m.country || ''}</span><br>
                                <em style="color: #888;">${m.listener_name || 'Аноним'}</em>
                            </div>
                        `);
                    
                    marker.on('click', () => {
                        this.showInfoPanel('СЛУШАТЕЛЬ', `${m.listener_name || 'Аноним'} слушает ГРОБ в ${m.city || 'неизвестном городе'}, ${m.country || ''}`, m.city);
                    });
                    
                    this.layers.listeners.addLayer(marker);
                });
                
                document.getElementById('totalMarkers').textContent = markers.length;
                document.getElementById('totalMarkers').setAttribute('data-label', 'СЛУШАТЕЛЕЙ');
            } catch (err) {
                console.error('Ошибка загрузки слушателей:', err);
            }
        },
        
        loadStats: async function() {
            try {
                const response = await fetch(`${this.API_URL}/markers/stats`);
                const stats = await response.json();
                document.getElementById('totalCountries').textContent = stats.length;
                document.getElementById('totalCountries').setAttribute('data-label', 'СТРАН');
            } catch (err) {
                console.error('Ошибка загрузки статистики:', err);
            }
        },
        
        loadRecentMarkers: async function() {
            try {
                const response = await fetch(`${this.API_URL}/markers`);
                const markers = await response.json();
                const recent = markers.slice(0, 8);
                const listEl = document.getElementById('recentMarkersList');
                
                if (recent.length === 0) {
                    listEl.innerHTML = '<div class="loading">Пока нет отметок. Будьте первым!</div>';
                    return;
                }
                
                listEl.innerHTML = recent.map(m => `
                    <div class="recent-item">
                        <div class="recent-location">
                            <span class="recent-city">${m.city || 'Неизвестно'}</span>
                            <span class="recent-country">${m.country || ''}</span>
                        </div>
                        <div class="recent-name">${m.listener_name || 'Аноним'}</div>
                        <div class="recent-time">${new Date(m.created_at).toLocaleDateString('ru')}</div>
                    </div>
                `).join('');
            } catch (err) {
                console.error('Ошибка загрузки:', err);
            }
        },
        
        reverseGeocode: async function(lat, lng) {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru`);
                const data = await response.json();
                
                this.selectedCity = data.address?.city || data.address?.town || data.address?.village || 'Неизвестно';
                this.selectedCountry = data.address?.country || 'Неизвестно';
                
                document.getElementById('markerCity').value = this.selectedCity;
                document.getElementById('markerCountry').value = this.selectedCountry;
                
                document.getElementById('markerForm').style.display = 'block';
                document.getElementById('listenerName').focus();
            } catch (err) {
                this.selectedCity = 'Неизвестно';
                this.selectedCountry = 'Неизвестно';
                document.getElementById('markerCity').value = this.selectedCity;
                document.getElementById('markerCountry').value = this.selectedCountry;
                document.getElementById('markerForm').style.display = 'block';
            }
        },
        
        saveMarker: async function() {
            const name = document.getElementById('listenerName').value || 'Аноним';
            
            if (!this.selectedLat || !this.selectedLng) {
                alert('Сначала выберите место на карте');
                return;
            }
            
            try {
                const response = await fetch(`${this.API_URL}/markers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        lat: this.selectedLat, lng: this.selectedLng,
                        city: this.selectedCity, country: this.selectedCountry,
                        listener_name: name
                    })
                });
                
                const newMarker = await response.json();
                
                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: '<div class="marker-dot" style="background: #fff; border-color: #fff;"></div>',
                    iconSize: [20, 20], iconAnchor: [10, 10]
                });
                
                const marker = L.marker([newMarker.lat, newMarker.lng], { icon: icon })
                    .bindPopup(`<div style="font-family: 'Space Mono', monospace;"><strong>${newMarker.city}</strong><br>${newMarker.country}<br><em>${newMarker.listener_name}</em></div>`);
                
                this.layers.listeners.addLayer(marker);
                
                document.getElementById('markerForm').style.display = 'none';
                document.getElementById('totalMarkers').textContent = parseInt(document.getElementById('totalMarkers').textContent) + 1;
                this.loadRecentMarkers();
                this.loadStats();
                
                this.showToast('Метка добавлена!', `${this.selectedCity}, ${this.selectedCountry}`);
            } catch (err) {
                alert('Ошибка при сохранении');
            }
        },
        
        toggleLayer: function(layerName) {
            const index = this.activeLayers.indexOf(layerName);
            if (index > -1) {
                this.activeLayers.splice(index, 1);
                this.map.removeLayer(this.layers[layerName]);
            } else {
                this.activeLayers.push(layerName);
                this.map.addLayer(this.layers[layerName]);
            }
        },
        
        locateUser: function() {
            if (!navigator.geolocation) return alert('Геолокация не поддерживается');
            
            navigator.geolocation.getCurrentPosition((pos) => {
                this.map.setView([pos.coords.latitude, pos.coords.longitude], 8);
                this.selectedLat = pos.coords.latitude;
                this.selectedLng = pos.coords.longitude;
                this.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
            });
        },
        
        showToast: function(title, msg) {
            const toast = document.createElement('div');
            toast.style.cssText = `position:fixed;bottom:120px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.95);border:1px solid #fff;padding:1rem 2rem;z-index:100000;font-family:'Space Mono',monospace;`;
            toast.innerHTML = `<div style="color:#fff;">${title}</div><div style="color:#aaa;">${msg}</div>`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2500);
        },
        
        bindEvents: function() {
            document.querySelectorAll('.legend-item').forEach(item => {
                item.addEventListener('click', () => {
                    const layer = item.dataset.layer;
                    item.classList.toggle('active');
                    this.toggleLayer(layer);
                });
            });
            
            document.getElementById('closePanel').addEventListener('click', () => {
                document.getElementById('infoPanel').classList.remove('active');
            });
            
            document.getElementById('locateBtn').addEventListener('click', () => this.locateUser());
            document.getElementById('addMarkerBtn').addEventListener('click', () => this.showToast('Кликните по карте', 'Выберите место'));
            document.getElementById('resetViewBtn').addEventListener('click', () => this.map.setView([55.7558, 70.0], 3));
            document.getElementById('saveMarkerBtn').addEventListener('click', () => this.saveMarker());
            document.getElementById('cancelMarkerBtn').addEventListener('click', () => {
                document.getElementById('markerForm').style.display = 'none';
            });
        }
    };
    
    document.addEventListener('DOMContentLoaded', () => InteractiveMap.init());
})();