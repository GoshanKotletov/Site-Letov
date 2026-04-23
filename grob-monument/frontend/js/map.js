// ===== js/map.js =====
// Интерактивная карта слушателей

(function() {
    'use strict';
    
    const MapApp = {
        map: null,
        markers: [],
        markersLayer: null,
        selectedLat: null,
        selectedLng: null,
        selectedCity: '',
        selectedCountry: '',
        API_URL: '/api',
        
        init: function() {
            this.initMap();
            this.loadMarkers();
            this.loadStats();
            this.loadRecentMarkers();
            this.bindEvents();
            
            console.log('Карта слушателей запущена');
        },
        
        initMap: function() {
            this.map = L.map('map', {
                center: [55.7558, 37.6173],
                zoom: 3,
                zoomControl: true,
                fadeAnimation: true
            });
            
            // СТАНДАРТНЫЕ ТАЙЛЫ OPENSTREETMAP - РАБОТАЮТ 100%
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(this.map);
            
            this.markersLayer = L.layerGroup().addTo(this.map);
            
            this.map.on('click', (e) => {
                this.selectedLat = e.latlng.lat;
                this.selectedLng = e.latlng.lng;
                this.reverseGeocode(e.latlng.lat, e.latlng.lng);
            });
        },
        
        reverseGeocode: async function(lat, lng) {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru`
                );
                const data = await response.json();
                
                this.selectedCity = data.address?.city || data.address?.town || data.address?.village || data.address?.state || 'Неизвестно';
                this.selectedCountry = data.address?.country || 'Неизвестно';
                
                document.getElementById('markerCity').value = this.selectedCity;
                document.getElementById('markerCountry').value = this.selectedCountry;
                
                this.showMarkerForm();
            } catch (err) {
                console.error('Ошибка геокодирования:', err);
                this.selectedCity = 'Неизвестно';
                this.selectedCountry = 'Неизвестно';
                document.getElementById('markerCity').value = this.selectedCity;
                document.getElementById('markerCountry').value = this.selectedCountry;
                this.showMarkerForm();
            }
        },
        
        showMarkerForm: function() {
            document.getElementById('markerForm').style.display = 'block';
            document.getElementById('listenerName').focus();
        },
        
        hideMarkerForm: function() {
            document.getElementById('markerForm').style.display = 'none';
            document.getElementById('listenerName').value = '';
        },
        
        loadMarkers: async function() {
            try {
                const response = await fetch(`${this.API_URL}/markers`);
                const markers = await response.json();
                
                this.markersLayer.clearLayers();
                this.markers = [];
                
                markers.forEach(marker => {
                    this.addMarkerToMap(marker);
                });
                
                document.getElementById('totalMarkers').textContent = markers.length;
                document.getElementById('totalMarkers').setAttribute('data-label', 'МЕТОК');
            } catch (err) {
                console.error('Ошибка загрузки меток:', err);
                document.getElementById('totalMarkers').textContent = '0';
                document.getElementById('totalMarkers').setAttribute('data-label', 'МЕТОК');
            }
        },
        
        addMarkerToMap: function(marker) {
            const customIcon = L.divIcon({
                className: 'custom-marker',
                html: '<div class="marker-dot"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                popupAnchor: [0, -10]
            });
            
            const popupContent = `
                <div style="font-family: 'Space Mono', monospace; text-align: center;">
                    <strong style="color: #000; text-transform: uppercase;">${marker.city || 'Неизвестно'}</strong><br>
                    <span style="color: #555;">${marker.country || ''}</span><br>
                    <em style="color: #888;">${marker.listener_name || 'Аноним'}</em>
                </div>
            `;
            
            const leafletMarker = L.marker([marker.lat, marker.lng], { icon: customIcon })
                .bindPopup(popupContent);
            
            this.markersLayer.addLayer(leafletMarker);
            this.markers.push(leafletMarker);
        },
        
        loadStats: async function() {
            try {
                const response = await fetch(`${this.API_URL}/markers/stats`);
                const stats = await response.json();
                
                const uniqueCountries = stats.length;
                document.getElementById('totalCountries').textContent = uniqueCountries;
                document.getElementById('totalCountries').setAttribute('data-label', 'СТРАН');
            } catch (err) {
                console.error('Ошибка загрузки статистики:', err);
                document.getElementById('totalCountries').textContent = '0';
                document.getElementById('totalCountries').setAttribute('data-label', 'СТРАН');
            }
        },
        
        loadRecentMarkers: async function() {
            try {
                const response = await fetch(`${this.API_URL}/markers`);
                const markers = await response.json();
                
                const recent = markers.slice(0, 10);
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
                console.error('Ошибка загрузки последних меток:', err);
                document.getElementById('recentMarkersList').innerHTML = '<div class="loading">Ошибка загрузки</div>';
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
                        lat: this.selectedLat,
                        lng: this.selectedLng,
                        city: this.selectedCity,
                        country: this.selectedCountry,
                        listener_name: name
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Ошибка сохранения');
                }
                
                const newMarker = await response.json();
                
                this.addMarkerToMap(newMarker);
                this.hideMarkerForm();
                this.loadStats();
                this.loadRecentMarkers();
                
                const totalEl = document.getElementById('totalMarkers');
                totalEl.textContent = parseInt(totalEl.textContent) + 1;
                
                this.showToast('Метка добавлена!', `${this.selectedCity}, ${this.selectedCountry}`);
                
            } catch (err) {
                console.error('Ошибка сохранения метки:', err);
                alert('Ошибка при сохранении. Попробуйте ещё раз.');
            }
        },
        
        locateUser: function() {
            if (!navigator.geolocation) {
                alert('Геолокация не поддерживается вашим браузером');
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    this.map.setView([lat, lng], 8);
                    this.selectedLat = lat;
                    this.selectedLng = lng;
                    this.reverseGeocode(lat, lng);
                    
                    this.showToast('Местоположение определено', 'Теперь добавьте метку');
                },
                (error) => {
                    console.error('Ошибка геолокации:', error);
                    alert('Не удалось определить местоположение');
                }
            );
        },
        
        showToast: function(title, message) {
            const toast = document.createElement('div');
            toast.style.cssText = `
                position: fixed;
                bottom: 120px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.95);
                border: 1px solid #fff;
                padding: 1rem 2rem;
                z-index: 100000;
                text-align: center;
                backdrop-filter: blur(10px);
                font-family: 'Space Mono', monospace;
                animation: slideUp 0.3s ease-out;
            `;
            toast.innerHTML = `
                <div style="font-size: 1.2rem; color: #fff; font-weight: 700;">${title}</div>
                <div style="font-size: 0.9rem; color: #aaa; text-transform: uppercase;">${message}</div>
            `;
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s';
                setTimeout(() => toast.remove(), 300);
            }, 2500);
        },
        
        bindEvents: function() {
            document.getElementById('locateBtn').addEventListener('click', () => this.locateUser());
            
            document.getElementById('addMarkerBtn').addEventListener('click', () => {
                this.showToast('Кликните по карте', 'Выберите место для отметки');
            });
            
            document.getElementById('saveMarkerBtn').addEventListener('click', () => this.saveMarker());
            
            document.getElementById('cancelMarkerBtn').addEventListener('click', () => this.hideMarkerForm());
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.hideMarkerForm();
                }
            });
        }
    };
    
    document.addEventListener('DOMContentLoaded', () => MapApp.init());
    
})();