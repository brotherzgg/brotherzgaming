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
        const description = sanitizeText(mod.Description || 'No description available');
        const imageUrl = validateImageUrl(mod.Image);
        const downloadUrl = mod.Link && mod.Link !== 'Null' ? mod.Link : '#';
        const version = sanitizeText(mod.V || 'Unknown');
        const size = mod.Size && mod.Size !== 'Null' ? formatFileSize(mod.Size) : 'Unknown';
        const modifications = mod.M && mod.M !== 'Null' ? sanitizeText(mod.M) : null;
        const updateDate = mod.U && mod.U !== 'Null' ? formatDate(mod.U) : 'Unknown';
        const note = mod.Note ? sanitizeText(mod.Note) : null;

        if (!downloadPageElement) return;

        downloadPageElement.innerHTML = `
            <div class="download-container">
                <!-- Hero Section: 5play Style -->
                <div class="app-hero">
                    <!-- Left Column: Info -->
                    <div class="app-info-column">
                        <div class="app-breadcrumbs">
                            <a href="index.html">Games</a> <span class="separator">/</span> <span>${category}</span>
                        </div>
                        
                        <h1 class="app-title">${name}</h1>
                        
                        <!-- Specific Metadata Grid (Row) -->
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
                                <span class="meta-label">Requirements</span>
                                <span class="meta-value">Android 5.0+</span>
                            </div>
                            <div class="meta-box">
                                <span class="meta-label">Genre</span>
                                <span class="meta-value">${category}</span>
                            </div>
                            <div class="meta-box">
                                <span class="meta-label">Price</span>
                                <span class="meta-value">Free</span>
                            </div>
                        </div>

                        <!-- Action Bar -->
                        <div class="app-actions">
                            <a href="#download-block" class="action-btn-download">
                                Download APK
                            </a>
                            <div class="action-icons">
                                <button class="icon-btn" title="Share">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                    <span>Share</span>
                                </button>
                                <button class="icon-btn" title="Update">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                                    <span>Update</span>
                                </button>
                                <button class="icon-btn" title="Bookmark">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                                    <span>To bookmarks</span>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Stats (Mocked for visual match) -->
                        <div class="app-stats">
                            <div class="stat-item like">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                                <span>+7032</span>
                            </div>
                            <div class="stat-item dislike">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>
                                <span>-2555</span>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Image -->
                    <div class="app-image-column">
                        <div class="app-icon-wrapper">
                            <img src="${imageUrl}" alt="${name}" class="app-icon-large" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='">
                            <div class="platform-badge">ARM64</div>
                        </div>
                    </div>
                </div>

                <!--Content Body-- >
            <div class="content-body">
                <!-- Tabs (Visual only) -->
                <div class="content-tabs">
                    <button class="tab-btn active">Description</button>
                    <button class="tab-btn">Help</button>
                </div>

                <div class="description-content">
                    <p class="description-text">${description.replace(/\n/g, '</p><p>')}</p>

                    ${modifications ? `
                        <div class="mod-features">
                            <h3>Mod Features:</h3>
                            <p>${modifications.replace(/\n/g, '<br>')}</p>
                        </div>
                        ` : ''}

                    <a href="#" class="more-view-btn">More view</a>
                </div>

                <!-- Distinct Download Block -->
                <div id="download-block" class="download-section">
                    <div class="download-tabs">
                        <button class="dl-tab active">Files</button>
                        <button class="dl-tab">Information</button>
                    </div>

                    <div class="download-box">
                        <h3 class="download-box-title">Download ${name} for Android for free</h3>
                        <p class="download-subtitle">Mod - menu</p>

                        <div class="download-item">
                            <a href="${downloadUrl}" class="download-link-btn" ${downloadUrl === '#' ? 'onclick="event.preventDefault(); alert(\'Download link not available\');"' : ''} target="_blank" rel="noopener noreferrer">
                                <span class="dl-name">${name.toLowerCase().replace(/\s+/g, '-')}-${version}-mod-menu.apk</span>
                                <span class="dl-action">Download APK (${size})</span>
                            </a>
                        </div>

                        <div class="download-footer">
                            <p>Fast download — virus-free!</p>
                            <p class="small-text">On our website, you can download the latest version of ${name} in APK format — fast and free! No sign-up or SMS</p>
                        </div>
                    </div>
                </div>
            </div>
            </div >
            `;
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
