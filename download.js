// Download page functionality
(function () {
    // State
    let localModsData = [];
    let currentMod = null;

    // DOM elements
    let globalLoader;
    let contentWrapper;
    let downloadPageElement;
    let errorElement;

    // Initialize the download page
    document.addEventListener('DOMContentLoaded', function () {
        // Get DOM elements
        globalLoader = document.getElementById('global-loader');
        contentWrapper = document.getElementById('content-wrapper');
        downloadPageElement = document.getElementById('downloadPage');
        errorElement = document.getElementById('error');

        loadModDetails();
    });

    // Load mod details based on URL parameters
    async function loadModDetails() {
        console.log('Starting loadModDetails...');

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
            // Get mod index from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const modIndex = urlParams.get('mod');
            console.log('Mod index from URL:', modIndex);

            // If no mod parameter, redirect to first mod
            if (!modIndex) {
                console.log('No mod index found, redirecting to mod=0');
                window.location.href = 'download.html?mod=0';
                return;
            }

            console.log('Fetching mods data...');
            // Use global fetchModsData and CONFIG from script.js
            const data = await fetchModsData();
            console.log('Mods data fetched:', data);

            localModsData = data;
            console.log(`Loaded ${data.length} mods, requested index: ${modIndex}`);

            // Get the specific mod with bounds checking
            const modIndexNum = parseInt(modIndex);
            if (isNaN(modIndexNum) || modIndexNum < 0 || modIndexNum >= data.length) {
                console.log(`Invalid mod index: ${modIndexNum}, data length: ${data.length}. Redirecting to valid mod.`);
                // Redirect to a valid mod (first one)
                window.location.href = 'download.html?mod=0';
                return;
            }

            const mod = data[modIndexNum];
            if (!mod) {
                throw new Error('Mod not found');
            }

            currentMod = mod;
            console.log('Displaying details for mod:', mod);
            displayModDetails(mod);
            hideLoading();

            // Setup event listeners after content is rendered
            setupEventListeners();

            console.log('Finished loadModDetails');

        } catch (error) {
            console.error('Error loading mod details:', error);
            hideLoading();
            showError();
        }
    }

    // Display mod details
    function displayModDetails(mod) {
        console.log('Displaying mod details for:', mod.Name);
        // Use global utility functions from script.js
        const name = sanitizeText(mod.Name || 'Unknown Mod');
        const category = sanitizeText(mod.Category || 'General');
        const description = mod.Description || 'No description available';
        const fullDescription = description.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const imageUrl = validateImageUrl(mod.Image);
        const downloadUrl = mod.Link && mod.Link !== 'Null' ? mod.Link : '#';
        const version = sanitizeText(mod.V || 'Unknown');
        const size = mod.Size && mod.Size !== 'Null' ? formatFileSize(mod.Size) : 'Unknown';
        const modifications = mod.M && mod.M !== 'Null' ? sanitizeText(mod.M) : null;
        const updateDate = mod.U && mod.U !== 'Null' ? formatDate(mod.U) : 'Unknown';

        // Generate the download filename
        const downloadFileName = `${name} ${version} Mod By Brotherz Gaming.apk`;

        if (!downloadPageElement) return;

        downloadPageElement.innerHTML = `
            <div class="download-container">
                <!-- Hero Section -->
                <div class="app-hero">
                    <!-- Left Column: Info -->
                    <div class="app-info-column">
                        <div class="app-breadcrumbs">
                            <a href="index.html">Games</a> <span class="separator">/</span> <a href="category.html?cat=${encodeURIComponent(category)}" class="genre-link">${category}</a>
                        </div>
                        
                        <h1 class="app-title">${name}</h1>
                        
                        <!-- Metadata Grid -->
                        <div class="app-meta-row">
                            <div class="meta-box">
                                <span class="meta-label">Updated</span>
                                <span class="meta-value">${updateDate}</span>
                            </div>
                            <div class="meta-box">
                                <span class="meta-label">Version</span>
                                <span class="meta-value">${version}</span>
                            </div>
                            <div class="meta-box">
                                <span class="meta-label">Size</span>
                                <span class="meta-value">${size}</span>
                            </div>
                            <div class="meta-box">
                                <span class="meta-label">Genre</span>
                                <span class="meta-value"><a href="category.html?cat=${encodeURIComponent(category)}" class="genre-link">${category}</a></span>
                            </div>
                        </div>

                        ${modifications ? `
                            <div class="mod-features">
                                <h3>Mod Features:</h3>
                                <p>${modifications.replace(/\n/g, '<br>')}</p>
                            </div>
                        ` : ''}

                        <!-- Action Bar -->
                        <div class="app-actions">
                            <a href="${downloadUrl}" class="action-btn-download" ${downloadUrl === '#' ? 'onclick="event.preventDefault(); alert(\'Download link not available\');"' : ''} target="_blank" rel="noopener noreferrer">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Download APK (${size})
                            </a>
                        </div>
                    </div>

                    <!-- Right Column: Image -->
                    <div class="app-image-column">
                        <div class="app-icon-wrapper">
                            <img src="${imageUrl}" alt="${name}" class="app-icon-large" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
                        </div>
                    </div>
                </div>

                <!-- Content Body (Full Width) -->
                <div class="content-body">
                    <!-- Description Section -->
                    <div class="content-tabs">
                        <button class="tab-btn active">Description</button>
                    </div>

                    <div class="description-content">
                        <div class="description-wrapper collapsed" id="descriptionWrapper">
                            <p class="description-text">${fullDescription.replace(/\n/g, '</p><p>')}</p>
                        </div>
                        
                        <!-- More button below description -->
                        <button class="more-view-btn" id="moreViewBtn">More...</button>
                    </div>
                </div>
            </div>
            `;
    }

    // Setup event listeners for interactive elements
    function setupEventListeners() {
        // More button - expand/collapse description
        const moreBtn = document.getElementById('moreViewBtn');
        const descWrapper = document.getElementById('descriptionWrapper');

        if (moreBtn && descWrapper) {
            moreBtn.addEventListener('click', function () {
                const isCollapsed = descWrapper.classList.contains('collapsed');

                if (isCollapsed) {
                    descWrapper.classList.remove('collapsed');
                    moreBtn.textContent = 'Less...';
                } else {
                    descWrapper.classList.add('collapsed');
                    moreBtn.textContent = 'More...';
                }
            });
        }
    }

    // Handle image loading errors
    document.addEventListener('error', function (e) {
        if (e.target.tagName === 'IMG' && e.target.classList.contains('download-image')) {
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBfiWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
        }
    }, true);

    // UI state management (local versions)
    function showLoading() {
        if (globalLoader) globalLoader.classList.remove('hidden');
        if (contentWrapper) contentWrapper.classList.remove('visible');
        if (errorElement) errorElement.style.display = 'none';
    }

    function hideLoading() {
        if (globalLoader) globalLoader.classList.add('hidden');
        setTimeout(() => {
            if (contentWrapper) contentWrapper.classList.add('visible');
        }, 50);
    }

    function showError() {
        if (errorElement) errorElement.style.display = 'block';
        if (downloadPageElement) downloadPageElement.style.display = 'none';
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

})();
