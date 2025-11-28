// Configuration
const CONFIG = {
    API_URL: 'https://pixlcore.pages.dev/Mod_Datas.json',
    CORS_PROXY: 'https://api.allorigins.win/get?url=',
    CORS_PROXY: 'https://api.allorigins.win/get?url=',
    // LOADING_DELAY removed for seamless experience
    CACHE_KEY: 'mods_data_cache',
    CACHE_TIMESTAMP_KEY: 'mods_data_timestamp',
    CACHE_DURATION: 60000 // 1 minute in ms
};

// Global State (for data sharing if needed)
let globalModsData = [];

// Check if valid cache exists
function hasValidCache() {
    const cachedData = localStorage.getItem(CONFIG.CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CONFIG.CACHE_TIMESTAMP_KEY);

    if (cachedData && cachedTimestamp) {
        const now = new Date().getTime();
        const age = now - parseInt(cachedTimestamp);

        if (age < CONFIG.CACHE_DURATION) {
            return true;
        }
    }
    return false;
}
window.hasValidCache = hasValidCache;

// Fetch mods data from the API (Global Helper)
async function fetchModsData() {
    console.log('=== fetchModsData called ===');

    // 1. Check for valid cache first
    const cachedData = localStorage.getItem(CONFIG.CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CONFIG.CACHE_TIMESTAMP_KEY);

    if (cachedData && cachedTimestamp) {
        const now = new Date().getTime();
        const age = now - parseInt(cachedTimestamp);

        if (age < CONFIG.CACHE_DURATION) {
            console.log('✓ Returning valid cache (age:', Math.round(age / 1000), 'seconds)');
            const parsed = JSON.parse(cachedData);
            console.log('✓ Cache has', parsed.length, 'mods');
            return parsed;
        }
        console.log('Cache expired (age:', Math.round(age / 1000), 'seconds)');
    } else {
        console.log('No cache found');
    }

    // 2. Try fetch with simplified approach
    console.log('Fetching from API:', CONFIG.API_URL);

    try {
        const response = await fetch(CONFIG.API_URL);

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers.get('content-type'));

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            console.error('ERROR: Data is not an array!', typeof data);
            throw new Error('Invalid data format: expected array');
        }

        console.log('✓ SUCCESS! Fetched', data.length, 'mods from API');

        // Update cache
        localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CONFIG.CACHE_TIMESTAMP_KEY, new Date().getTime().toString());
        console.log('✓ Cache updated');

        return data;

    } catch (error) {
        console.error('✗ Direct fetch failed:', error.message);

        // 3. Try CORS proxy as fallback
        console.log('Trying CORS proxy:', CONFIG.CORS_PROXY);
        try {
            const proxyUrl = CONFIG.CORS_PROXY + encodeURIComponent(CONFIG.API_URL);
            console.log('  Full proxy URL:', proxyUrl);

            const proxyResponse = await fetch(proxyUrl);
            console.log('  Proxy response status:', proxyResponse.status);

            if (!proxyResponse.ok) {
                throw new Error(`Proxy HTTP ${proxyResponse.status}`);
            }

            const proxyData = await proxyResponse.json();

            // allorigins wraps data in { contents: "..." }
            let finalData;
            if (proxyData.contents) {
                console.log('  Parsing contents from proxy wrapper');
                finalData = JSON.parse(proxyData.contents);
            } else {
                finalData = proxyData;
            }

            if (!Array.isArray(finalData)) {
                console.error('ERROR: Proxy data is not an array!', typeof finalData);
                throw new Error('Invalid proxy data format');
            }

            console.log('✓ CORS PROXY SUCCESS! Got', finalData.length, 'mods');

            // Update cache
            localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(finalData));
            localStorage.setItem(CONFIG.CACHE_TIMESTAMP_KEY, new Date().getTime().toString());
            console.log('✓ Cache updated from proxy');

            return finalData;

        } catch (proxyError) {
            console.error('✗ CORS proxy ALSO failed:', proxyError.message);

            // Try to return stale cache if available
            if (cachedData) {
                console.warn('⚠ Returning STALE cache as fallback');
                const parsed = JSON.parse(cachedData);
                console.log('  Stale cache has', parsed.length, 'mods');
                return parsed;
            }

            console.error('✗ NO CACHE AVAILABLE - Unable to fetch data');
            console.error('  All fetch methods failed. Showing error to user.');
            return null; // Return null to trigger error display
        }
    }
};

// Page Transitions removed for seamless navigation

// Main page functionality (Homepage)
if (document.getElementById('featuredSection') || document.getElementById('recommended-container')) {
    (function () {
        // DOM elements
        let globalLoader;
        let contentWrapper;
        let errorElement;
        let recommendedContainer;
        let newestContainer;
        let gamesContainer;
        let appsContainer;

        // Initialize
        document.addEventListener('DOMContentLoaded', function () {
            globalLoader = document.getElementById('global-loader');
            contentWrapper = document.getElementById('content-wrapper');
            errorElement = document.getElementById('error');
            recommendedContainer = document.getElementById('recommended-container');
            newestContainer = document.getElementById('newest-container');
            gamesContainer = document.getElementById('games-container');
            appsContainer = document.getElementById('apps-container');

            loadMods();
        });

        async function loadMods() {
            const isCached = hasValidCache();

            if (!isCached) {
                showLoading();
            } else {
                // Ensure content is visible and loader is hidden if we're skipping the loader
                if (globalLoader) globalLoader.classList.add('hidden');
                if (contentWrapper) contentWrapper.classList.add('visible');
                document.body.classList.remove('loading-active');
            }

            hideError();

            try {
                // Add minimum loading time for better UX
                const data = await fetchModsData();

                // Check if data fetch failed completely
                if (!data || !Array.isArray(data) || data.length === 0) {
                    console.error('No data returned from fetchModsData');
                    hideLoading();
                    showError();
                    return;
                }

                globalModsData = data;
                const usedMods = new Set();

                // 1. Newest Additions (Priority: High)
                // We process this first to ensure the newest items are always shown here
                let newestMods = [];
                if (newestContainer) {
                    newestMods = data.slice(0, 8);
                    newestMods.forEach(mod => usedMods.add(mod));
                }

                // 2. Recommended Section (Randomized, Unique)
                let recommendedMods = [];
                if (recommendedContainer) {
                    recommendedMods = getUniqueRandomMods(data, 8, usedMods);
                }

                // 3. Popular Games (Randomized, Unique)
                let gameMods = [];
                if (gamesContainer) {
                    const allGameMods = data.filter(mod => mod.Category === 'Strategy' || mod.Category === 'Arcade' || mod.Category === 'Action' || mod.Category === 'Simulation' || mod.Category === 'RPG');
                    const genericGameMods = data.filter(mod => mod.Category !== 'Tools' && mod.Category !== 'Photography' && mod.Category !== 'Productivity');
                    const source = allGameMods.length > 0 ? allGameMods : genericGameMods;

                    gameMods = getUniqueRandomMods(source, 8, usedMods);
                }

                // 4. Essential Apps (Unique)
                let appMods = [];
                if (appsContainer) {
                    const allAppMods = data.filter(mod => mod.Category === 'Tools' || mod.Category === 'Photography' || mod.Category === 'Productivity' || mod.Category === 'Social');
                    // Get first 8 available apps that haven't been shown yet
                    appMods = allAppMods.filter(mod => !usedMods.has(mod)).slice(0, 8);
                    appMods.forEach(mod => usedMods.add(mod));
                }

                // Render all sections
                console.log('=== Rendering Sections ===');
                console.log('Newest mods:', newestMods.length);
                console.log('Recommended mods:', recommendedMods.length);
                console.log('Game mods:', gameMods.length);
                console.log('App mods:', appMods.length);

                if (newestContainer) renderGrid(newestContainer, newestMods);
                if (recommendedContainer) renderRecommended(recommendedMods);
                if (gamesContainer) renderGrid(gamesContainer, gameMods);
                if (appsContainer) renderGrid(appsContainer, appMods);

                hideLoading();

            } catch (error) {
                console.error('Error loading mods:', error);
                hideLoading();
                showError();
            }
        }

        function getUniqueRandomMods(arr, n, usedSet) {
            if (!arr || arr.length === 0) return [];

            // Filter out items that have already been used
            const available = arr.filter(mod => !usedSet.has(mod));

            if (available.length === 0) return [];

            // If we requested more than available, return all available
            if (n >= available.length) {
                available.forEach(mod => usedSet.add(mod));
                return available;
            }

            const result = [];
            const takenIndices = new Set();

            while (result.length < n) {
                const idx = Math.floor(Math.random() * available.length);
                if (!takenIndices.has(idx)) {
                    takenIndices.add(idx);
                    const mod = available[idx];
                    result.push(mod);
                    usedSet.add(mod);
                }
            }
            return result;
        }

        function renderRecommended(mods) {
            if (!recommendedContainer) return;
            recommendedContainer.innerHTML = '';
            mods.forEach(mod => {
                const modIndex = globalModsData.indexOf(mod);
                const card = createRecommendedCard(mod, modIndex);
                recommendedContainer.appendChild(card);
            });
        }

        // Utility functions (local to IIFE)
        function sanitizeText(text) {
            if (typeof text !== 'string') return 'Unknown';
            return text.replace(/[<>]/g, '').trim().substring(0, 200);
        }

        function validateImageUrl(url) {
            if (!url || typeof url !== 'string' || url === 'Null') {
                return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
            }
            try {
                new URL(url);
                return url;
            } catch {
                return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
            }
        }

        // Create Recommended Card (matches CSS .recommended-card structure)
        function createRecommendedCard(mod, index) {
            try {
                const card = document.createElement('a');
                card.href = `download.html?mod=${index}`;
                card.className = 'recommended-card';

                const name = sanitizeText(mod.Name || 'Unknown Mod');
                const category = sanitizeText(mod.Category || 'General');
                const imageUrl = validateImageUrl(mod.Image);

                card.innerHTML = `
                <div class="recommended-image-container">
                    <img src="${imageUrl}" alt="${name}" class="recommended-image" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
                </div>
                <div class="recommended-content">
                    <div class="recommended-category">${category}</div>
                    <h3 class="recommended-title">${name}</h3>
                    <span class="recommended-btn">Get Mod</span>
                </div>
            `;

                return card;
            } catch (error) {
                console.error('Error creating recommended card:', error, mod);
                return document.createElement('div'); // Return empty div on error
            }
        }


        function renderGrid(container, mods) {
            if (!container) return;
            container.innerHTML = '';
            mods.forEach(mod => {
                const modIndex = globalModsData.indexOf(mod);
                const card = createModCard(mod, modIndex);
                container.appendChild(card);
            });
        }

        // Unified Card Creation
        function createModCard(mod, index) {
            const card = document.createElement('a');
            card.href = `download.html?mod=${index}`;
            card.className = 'mod-card';

            const name = sanitizeText(mod.Name || 'Unknown Mod');
            const category = sanitizeText(mod.Category || 'General');
            const imageUrl = validateImageUrl(mod.Image);

            card.innerHTML = `
                <div class="mod-image-container">
                    <img src="${imageUrl}" alt="${name}" class="mod-image" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
                </div>
                <div class="mod-info">
                    <h3 class="mod-title">${name}</h3>
                    <div class="mod-category">${category}</div>
                    <span class="mod-download-btn">Get Mod</span>
                </div>
            `;

            return card;
        }

        // UI Helpers
        function showLoading() {
            if (globalLoader) {
                globalLoader.classList.remove('hidden');
            }
            if (contentWrapper) {
                contentWrapper.classList.remove('visible');
            }
            document.body.classList.add('loading-active');
            if (errorElement) errorElement.style.display = 'none';
        }

        function hideLoading() {
            if (globalLoader) {
                globalLoader.classList.add('hidden');
            }
            // Small delay to ensure DOM is ready and transition is smooth
            setTimeout(() => {
                if (contentWrapper) {
                    contentWrapper.classList.add('visible');
                }
                document.body.classList.remove('loading-active');
            }, 50);
        }

        function showError() {
            if (errorElement) errorElement.style.display = 'block';
        }

        function hideError() {
            if (errorElement) errorElement.style.display = 'none';
        }

    })();
}

// Utility functions
function sanitizeText(text) {
    if (typeof text !== 'string') return 'Unknown';
    return text
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .trim()
        .substring(0, 200); // Limit length
}

function validateImageUrl(url) {
    if (!url || typeof url !== 'string' || url === 'Null') {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    }

    // Basic URL validation
    try {
        new URL(url);
        return url;
    } catch {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    }
}

function formatFileSize(size) {
    if (!size || isNaN(size)) return 'Unknown';

    const sizeInMB = parseFloat(size);
    if (sizeInMB < 1) {
        return `${(sizeInMB * 1024).toFixed(0)} KB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return dateString;
    }
}

// Add some basic error handling for image loading
document.addEventListener('error', function (e) {
    if (e.target.tagName === 'IMG' && (e.target.classList.contains('mod-image') || e.target.classList.contains('featured-image'))) {
        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE4MCI yeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQ yeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    }
}, true);