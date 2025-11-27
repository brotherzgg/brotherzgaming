// Configuration
const CONFIG = {
    API_URL: 'https://pixlcore.pages.dev/Mod_Data.json',
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
    // 1. Check for valid cache first
    const cachedData = localStorage.getItem(CONFIG.CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CONFIG.CACHE_TIMESTAMP_KEY);

    if (cachedData && cachedTimestamp) {
        const now = new Date().getTime();
        const age = now - parseInt(cachedTimestamp);

        if (age < CONFIG.CACHE_DURATION) {
            console.log('Returning valid cache');
            return JSON.parse(cachedData);
        }
    }

    // 2. Try direct fetch
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error('Invalid data format: expected array');
        }

        // Update cache
        localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CONFIG.CACHE_TIMESTAMP_KEY, new Date().getTime().toString());

        return data;
    } catch (error) {
        console.warn('Direct fetch failed, trying CORS proxy:', error);

        try {
            const response = await fetch(CONFIG.CORS_PROXY + encodeURIComponent(CONFIG.API_URL));
            if (!response.ok) throw new Error('CORS proxy fetch failed');

            const data = await response.json();
            // allorigins returns data in 'contents' field, usually as a string
            const parsedData = JSON.parse(data.contents);

            if (!Array.isArray(parsedData)) {
                throw new Error('Invalid data format from proxy');
            }

            // Update cache
            localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(parsedData));
            localStorage.setItem(CONFIG.CACHE_TIMESTAMP_KEY, new Date().getTime().toString());

            return parsedData;
        } catch (corsError) {
            console.warn('CORS proxy failed, trying cache/fallback:', corsError);

            // Try to return stale cache if available (even if expired)
            if (cachedData) {
                console.log('Returning stale cache due to error');
                return JSON.parse(cachedData);
            }

            return getFallbackData();
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

        // Create Recommended Card (matches CSS .recommended-card structure)
        function createRecommendedCard(mod, index) {
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

// Fallback data in case all fetching methods fail
function getFallbackData() {
    return [
        {
            "Name": "Great Conqueror 2 Shogun",
            "Category": "Strategy",
            "Image": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhT2u3ZpZKq_hgjVk5pYovLyweFfZ0ZYOCTobGg2j7hyphenhyphensBqnMBFNaiXHHvff4f9uueFEbPF4ns9GcwUScLGLvVsSYxNpGO1kdW0ShyF4K3l6IzSpQv78-OyeanM5ejAbvgzkL20ZmdABfMvf_y9FGRJpNfHacjW6dnPJUpUftI66O_4LKhEEDMDJ3AUXyIB/w680/unnamed%20(1).webp",
            "Description": "Great Conqueror 2 Shogun is an epic strategy game taking place during the chaotic Sengoku Era of Japan, where you will play the role of a fearless warrior Shogun and will observe an entire historical era, its ups and downs, military confrontations, the spirit of competition and conflict situations, power struggles and historical battles.",
            "M": "Unlimited Coins\nUnlimited Ban-Kin",
            "U": "November 25, 2023",
            "V": "1.0.8",
            "Link": "https://www.mediafire.com/file/sx3qns830hsfve0/Great_Conqueror_2_Shogun_1.0.8_Mod_By_Brotherz_Gaming.apk/file",
            "Size": "649.77"
        },
        {
            "Name": "Vector 2 Premium",
            "Category": "Arcade",
            "Image": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiX6R4IPx5Mo74ne8FM2SqDdGgj6O1JsXkx7c-u837JOXHF9-DD2UxgrjoP70pVXvvCQigtd18wkp5r2CEEpDv6vMbPIb2e0zlh46XYma5nFaV-uCsADD2XSF-bJiOcQ96pfctXbVFIoUTbm6VdwwCVjZi9ZEm-AfVt0zZ_7zYfCY7Tbm2QoSTzLu7BArrs/w680/vector-2-premium.webp",
            "Description": "The continuation of an incredible game about the parkourist, behind whom people from the scientific complex are chasing. The protagonist must pass many tests to become an agent in spec service.",
            "M": "Unlimited Money",
            "Note": "You Can Buy Anything With 0 Cost",
            "U": "November 12, 2023",
            "V": "1.2.1",
            "Link": "https://www.mediafire.com/file/oaqrmsepalgkn7x/Vector_2_Premium_1.2.1_Mod_By_Brotherz_Gaming.apk/file",
            "Size": "125.66"
        },
        {
            "Name": "Fortress Under Siege HD",
            "Category": "Strategy",
            "Image": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiIs03buSxp1zHvRIhDS2p-F7u7A9pkfP2Pxx4kmQ2K66m7C7JCd78qOxP1Y_SPV_9qBi5PPf0nPvyurz5z_0vY06IFx9aDYqF_xRY_HjxlrypkX7HbQLdqHsaaphR8q3KUd5Y1y1qxcCHwwfpLHyQRDTV9VVcLc8hWkVqU9rw6mJGmW3-hs3kBD3TDva4h/w680/unnamed.webp",
            "Description": "A strategy game that will take the player into the epicenter of a large-scale confrontation. The user will have to participate in the battle for the protection of his own Kingdom from the treacherous attack of the enemy.",
            "M": "Unlimited Money",
            "U": "September 29, 2023",
            "V": "1.4.6",
            "Link": "https://www.mediafire.com/file/rm7g9xqux08m9wb/Fortress_Under_Siege_1.4.6_Mod_By_Brotherz_Gaming.apk/file",
            "Size": "46.53"
        },
        {
            "Name": "Glory Of Generals Pacific HD",
            "Category": "Strategy",
            "Image": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhWz90PPGuawfAZCjXIdOugY2EorkvNUpVKfAvdgM_MZpLTikIYCmPXLEPQFxzG7uCB6lmsOsX3ZXX4Fl1KboGRDaoSyBoV5vjzrCY4fy19EBBd9xcnF500YqZ3t96H6TNE7KPxhGHCRqIpn1ABdMxtXYqxPonIyq5YqMC6rOAiFprfg1ceQTRMgGeyWRsE/w680/unnamed.webp",
            "Description": "A turn-based historical strategy game, offering players to take part in dozens of military battles that really took place within the various conflicts. The game will be in the Pacific, and the battle will affect the events of the Second World War.",
            "M": "Unlimited Money\nUnlimited Medals",
            "U": "October 15, 2023",
            "V": "1.2.0",
            "Link": "https://www.mediafire.com/file/example/Glory_Of_Generals_Pacific_HD.apk/file",
            "Size": "89.45"
        },
        {
            "Name": "X8 Sandbox",
            "Category": "Tools",
            "Image": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiqRf1d4zq0whUrHop3hYSi9jCsRO4dU6x219ZiSIMqiafvAyysi1oopHmU6n4jCseU6qosQ/w680/ic_launcher_foreground.png",
            "Description": "Most game modification tools require root access to Android phones. The X8 Sandbox is a tool that provides root access to applications commonly used to edit games.",
            "M": "Null",
            "U": "July 25, 2022",
            "V": "0.7.6.2.09",
            "Link": "https://www.mediafire.com/file/og9hjy4rcr1exu2/X8_Sandbox_0.7.6.2.09-64gp_By_Brotherz_Gaming.apk.apk/file",
            "Size": "359.14"
        },
        {
            "Name": "Adobe Photoshop Touch",
            "Category": "Photography",
            "Image": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgHhtZqwHG45GpS-h6GvmI0xqUEaB43yGDw8cXoUC3GECr3BMWo11c0glSEndG0UVbREdWzkd_xhjAjEt7jqAiwxun6WNhDsK_fpMVtSNEU8vIqvWZWvG4cV7VYMZ7xHEEljUwgMcrKjr8SDaIn-bUSWeOcfswABLf9lHUa99tn6voyH17B90voGdg6oA/w680/f592f9493c7b149d5b42e7c3c04edfc689ca89c7c5bdcce29feb249e92e6a89a_200.jpeg",
            "Description": "Adobe Photoshop Touch is a mobile version of the popular graphics editor. Of course to a full analogue of the desktop version it does not hold, however, many useful features are still there.",
            "M": "Null",
            "U": "April 27, 2022",
            "V": "1.7.7",
            "Link": "Null",
            "Size": "Null"
        }
    ];
}

// Add some basic error handling for image loading
document.addEventListener('error', function (e) {
    if (e.target.tagName === 'IMG' && (e.target.classList.contains('mod-image') || e.target.classList.contains('featured-image'))) {
        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    }
}, true);