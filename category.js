// Category page functionality
(function () {
    // State
    let allMods = [];
    let currentCategory = 'All';

    // DOM elements
    let categoryFilterElement;
    let modsGridElement;
    let globalLoader;
    let contentWrapper;
    let errorElement;

    // Initialize
    document.addEventListener('DOMContentLoaded', function () {
        categoryFilterElement = document.getElementById('categoryFilter');
        modsGridElement = document.getElementById('modsGrid');
        globalLoader = document.getElementById('global-loader');
        contentWrapper = document.getElementById('content-wrapper');
        errorElement = document.getElementById('error');

        loadCategories();
    });

    async function loadCategories() {
        // Check cache status using global helper
        const isCached = typeof window.hasValidCache === 'function' && window.hasValidCache();

        if (!isCached) {
            showLoading();
        } else {
            if (globalLoader) globalLoader.classList.add('hidden');
            if (contentWrapper) contentWrapper.classList.add('visible');
            document.body.classList.remove('loading-active');
        }

        hideError();

        try {
            // Use global fetchModsData from script.js
            const data = await fetchModsData();

            allMods = data;

            // Get unique categories
            const categories = ['All', ...new Set(data.map(mod => mod.Category).filter(Boolean))];

            // Render category buttons
            renderCategoryButtons(categories);

            // Check URL for category parameter
            const urlParams = new URLSearchParams(window.location.search);
            const catParam = urlParams.get('cat');

            if (catParam && categories.includes(catParam)) {
                currentCategory = catParam;
            }

            // Render mods
            filterAndRenderMods();

            hideLoading();

        } catch (error) {
            console.error('Error loading categories:', error);
            hideLoading();
            showError();
        }
    }

    function renderCategoryButtons(categories) {
        if (!categoryFilterElement) return;
        categoryFilterElement.innerHTML = categories.map(cat => `
            <button class="category-btn ${cat === currentCategory ? 'active' : ''}" 
                    onclick="window.selectCategory('${cat}')">
                ${cat}
            </button>
        `).join('');
    }

    // Expose selectCategory to global scope for button onclick
    window.selectCategory = function (category) {
        currentCategory = category;

        // Update active button state
        const buttons = categoryFilterElement.querySelectorAll('.category-btn');
        buttons.forEach(btn => {
            if (btn.textContent.trim() === category) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update URL without reloading
        const url = new URL(window.location);
        if (category === 'All') {
            url.searchParams.delete('cat');
        } else {
            url.searchParams.set('cat', category);
        }
        window.history.pushState({}, '', url);

        filterAndRenderMods();
    };

    function filterAndRenderMods() {
        if (!modsGridElement) return;

        const filteredMods = currentCategory === 'All'
            ? allMods
            : allMods.filter(mod => mod.Category === currentCategory);

        if (filteredMods.length === 0) {
            modsGridElement.innerHTML = '<div class="no-results">No mods found in this category.</div>';
            return;
        }

        modsGridElement.innerHTML = '';
        filteredMods.forEach(mod => {
            const modIndex = allMods.indexOf(mod);
            const card = createModCard(mod, modIndex);
            modsGridElement.appendChild(card);
        });
    }

    // Unified Card Creation (Same as script.js)
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

    // Utility functions (local to this scope)
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

})();
