/**
 * UI Rendering & Event Controller for CHRNS-DSA & DSA Practice Tracker
 * Dynamic DOM rendering, Striver A2Z section accordion cards, 3-column problem grids,
 * dynamic statistics calculation from PROBLEMS.length, search, filters, modals, and toasts.
 */

const UIManager = {
    currentFilters: {
        searchQuery: "",
        platform: "All",
        difficulty: "All",
        status: "All",
        topic: "All", // Represents A2Z section or topic
        favoritesOnly: false,
        sortBy: "default"
    },

    expandedTopics: new Set(["01 — Learn the Basics", "03 — Arrays"]),

    activeTab: "challenges",

    THEME_KEY: "codecal_theme",

    init() {
        this.initTheme();
        this.bindEvents();
        this.switchTab("challenges");
        this.renderApp();
    },

    initTheme() {
        let theme = "dark";
        try {
            const saved = localStorage.getItem(this.THEME_KEY);
            if (saved === "light" || saved === "dark") {
                theme = saved;
            }
        } catch (e) {
            console.error("Failed to load theme from LocalStorage:", e);
        }
        this.applyTheme(theme);
    },

    applyTheme(theme) {
        if (theme === "light") {
            document.body.classList.add("light-theme");
        } else {
            document.body.classList.remove("light-theme");
        }

        const themeBtn = document.getElementById("theme-toggle-btn");
        if (themeBtn) {
            themeBtn.innerHTML = theme === "light"
                ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'
                : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
        }

        try {
            localStorage.setItem(this.THEME_KEY, theme);
        } catch (e) {
            console.error("Failed to save theme:", e);
        }
    },

    toggleTheme() {
        const isLight = document.body.classList.contains("light-theme");
        const newTheme = isLight ? "dark" : "light";
        this.applyTheme(newTheme);
        this.showToast(`Switched to ${newTheme === "light" ? "Light" : "Dark"} Theme`);
    },

    bindEvents() {
        // Tab Navigation
        const tabsContainer = document.querySelector(".nav-tabs");
        if (tabsContainer) {
            tabsContainer.addEventListener("click", (e) => {
                const tabBtn = e.target.closest(".nav-tab");
                if (!tabBtn) return;
                const tab = tabBtn.dataset.tab;
                this.switchTab(tab);
            });
        }

        // Search Input (DSA Mastery)
        const searchInput = document.getElementById("search-input");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this.currentFilters.searchQuery = e.target.value.toLowerCase().trim();
                this.renderProblemLibrary();
            });
        }

        // Difficulty Pills (DSA Mastery)
        const difficultyPills = document.getElementById("difficulty-pills");
        if (difficultyPills) {
            difficultyPills.addEventListener("click", (e) => {
                const pill = e.target.closest(".filter-pill");
                if (!pill) return;
                const diff = pill.dataset.difficulty;
                this.currentFilters.difficulty = diff;

                difficultyPills.querySelectorAll(".filter-pill").forEach(p => p.className = "filter-pill");
                if (diff === "All") pill.classList.add("active");
                else if (diff === "Easy") pill.classList.add("active-easy");
                else if (diff === "Medium") pill.classList.add("active-medium");
                else if (diff === "Hard") pill.classList.add("active-hard");

                this.renderProblemLibrary();
            });
        }

        // Platform Select / Pills
        const platformSelect = document.getElementById("platform-select");
        if (platformSelect) {
            platformSelect.addEventListener("change", (e) => {
                this.currentFilters.platform = e.target.value;
                this.renderProblemLibrary();
            });
        }

        // Topic / Section Select
        const topicSelect = document.getElementById("topic-select");
        if (topicSelect) {
            topicSelect.addEventListener("change", (e) => {
                this.currentFilters.topic = e.target.value;
                this.renderProblemLibrary();
            });
        }

        // Status Select
        const statusSelect = document.getElementById("status-select");
        if (statusSelect) {
            statusSelect.addEventListener("change", (e) => {
                this.currentFilters.status = e.target.value;
                this.renderProblemLibrary();
            });
        }

        // Favorites Filter Toggle
        const favToggleBtn = document.getElementById("favorites-toggle-btn");
        if (favToggleBtn) {
            favToggleBtn.addEventListener("click", () => {
                this.currentFilters.favoritesOnly = !this.currentFilters.favoritesOnly;
                favToggleBtn.classList.toggle("active", this.currentFilters.favoritesOnly);
                this.renderProblemLibrary();
            });
        }

        // Sort Select
        const sortSelect = document.getElementById("sort-select");
        if (sortSelect) {
            sortSelect.addEventListener("change", (e) => {
                this.currentFilters.sortBy = e.target.value;
                this.renderProblemLibrary();
            });
        }

        // Event Delegation on Topics Accordion Container
        const accordionContainer = document.getElementById("topics-accordion-container");
        if (accordionContainer) {
            accordionContainer.addEventListener("click", (e) => {
                // Checkbox toggle
                const checkbox = e.target.closest(".custom-checkbox");
                if (checkbox) {
                    e.stopPropagation();
                    const card = checkbox.closest(".problem-card");
                    const problemId = parseInt(card.dataset.id, 10);
                    this.toggleProblemCompletion(problemId);
                    return;
                }

                // Star favorite toggle
                const starBtn = e.target.closest(".star-btn");
                if (starBtn) {
                    e.stopPropagation();
                    const card = starBtn.closest(".problem-card");
                    const problemId = parseInt(card.dataset.id, 10);
                    this.toggleFavorite(problemId);
                    return;
                }

                // Note button click
                const noteBtn = e.target.closest(".note-action-btn");
                if (noteBtn) {
                    e.stopPropagation();
                    const card = noteBtn.closest(".problem-card");
                    const problemId = parseInt(card.dataset.id, 10);
                    this.openNotesModal(problemId);
                    return;
                }

                // Problem card or title click -> open problem URL
                const card = e.target.closest(".problem-card");
                if (card && !e.target.closest("a")) {
                    const problemId = parseInt(card.dataset.id, 10);
                    const problem = PROBLEMS.find(p => p.id === problemId);
                    if (problem && problem.url && problem.url !== "#" && !problem.url.includes("solve")) {
                        window.open(problem.url, "_blank", "noopener,noreferrer");
                        return;
                    }
                }

                // Accordion header click
                const header = e.target.closest(".topic-card-header");
                if (header) {
                    const topicCard = header.closest(".topic-card");
                    const topicName = topicCard.dataset.topic;
                    if (this.expandedTopics.has(topicName)) {
                        this.expandedTopics.delete(topicName);
                    } else {
                        this.expandedTopics.add(topicName);
                    }
                    topicCard.classList.toggle("open", this.expandedTopics.has(topicName));
                    return;
                }
            });
        }

        // Theme Toggle Button
        const themeBtn = document.getElementById("theme-toggle-btn");
        if (themeBtn) {
            themeBtn.addEventListener("click", () => this.toggleTheme());
        }

        // Notes Modal Events
        const notesOverlay = document.getElementById("notes-modal-overlay");
        const closeNotesBtn = document.getElementById("close-notes-modal");
        const saveNotesBtn = document.getElementById("save-note-btn");

        if (closeNotesBtn && notesOverlay) {
            closeNotesBtn.addEventListener("click", () => notesOverlay.classList.remove("active"));
            notesOverlay.addEventListener("click", (e) => {
                if (e.target === notesOverlay) notesOverlay.classList.remove("active");
            });
        }

        if (saveNotesBtn) {
            saveNotesBtn.addEventListener("click", () => this.saveNote());
        }

        // Settings Modal Events
        const settingsOverlay = document.getElementById("settings-modal-overlay");
        const closeSettingsBtn = document.getElementById("close-settings-modal");
        const exportBtn = document.getElementById("export-data-btn");
        const importInput = document.getElementById("import-file-input");
        const resetBtn = document.getElementById("reset-data-btn");

        if (closeSettingsBtn && settingsOverlay) {
            closeSettingsBtn.addEventListener("click", () => settingsOverlay.classList.remove("active"));
            settingsOverlay.addEventListener("click", (e) => {
                if (e.target === settingsOverlay) settingsOverlay.classList.remove("active");
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener("click", () => {
                try {
                    const json = StorageManager.exportUserData();
                    const blob = new Blob([json], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `ctrl_alt_career_backup_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    this.showToast("Backup exported successfully!");
                } catch (err) {
                    this.showToast(err.message);
                }
            });
        }

        if (importInput) {
            importInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        StorageManager.importUserData(evt.target.result);
                        this.showToast("Data imported successfully!");
                        this.renderApp();
                        if (settingsOverlay) settingsOverlay.classList.remove("active");
                    } catch (err) {
                        this.showToast("Import error: " + err.message);
                    }
                };
                reader.readAsText(file);
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                if (confirm("Are you sure you want to reset all your practice progress, notes, and streak?")) {
                    StorageManager.resetCurrentUserData();
                    this.showToast("Progress reset.");
                    this.renderApp();
                    if (settingsOverlay) settingsOverlay.classList.remove("active");
                }
            });
        }
    },

    switchTab(tab) {
        // Roadmap now renders in-app (js/dashboard.js); the original Whimsical map stays linked from that view.

        if (tab === "arcade") {
            window.open("games/arcade.html", "_blank", "noopener,noreferrer");
            return;
        }

        this.activeTab = tab;

        document.querySelectorAll(".nav-tab").forEach(t => {
            t.classList.toggle("active", t.dataset.tab === tab);
        });

        document.querySelectorAll(".view-section").forEach(s => {
            s.classList.toggle("active", s.id === `view-${tab}`);
        });

        if (tab === "challenges" && typeof ContestUI !== "undefined" && ContestUI.renderAll) {
            ContestUI.renderAll();
        } else if (tab === "mastery") {
            this.renderApp();
        }
    },

    renderApp() {
        const user = StorageManager.getCurrentUser();
        const loginBtn = document.getElementById("nav-login-btn");
        const profileBtn = document.getElementById("nav-profile-btn");
        const usernameDisplay = document.getElementById("nav-username-display");

        if (user) {
            if (loginBtn) loginBtn.style.display = "none";
            if (profileBtn) profileBtn.style.display = "flex";
            if (usernameDisplay) usernameDisplay.textContent = user.username;
        } else {
            if (loginBtn) loginBtn.style.display = "flex";
            if (profileBtn) profileBtn.style.display = "none";
        }

        this.renderStats();
        this.renderTopicSelect();
        this.renderProblemLibrary();
        if (typeof StreakCalendar !== "undefined") {
            StreakCalendar.render();
        }
    },

    renderStats() {
        const user = StorageManager.getCurrentUser();
        const stats = AnalyticsEngine.calculateStats(user, PROBLEMS);

        const totalEl = document.getElementById("stat-total");
        const completedEl = document.getElementById("stat-completed") || document.getElementById("stat-solved-count");
        const remainingEl = document.getElementById("stat-remaining");
        const streakEl = document.getElementById("stat-streak") || document.getElementById("stat-streak-count");
        const accuracyEl = document.getElementById("stat-accuracy-count");

        const problemCount = PROBLEMS.length;

        if (totalEl) totalEl.textContent = problemCount;
        if (completedEl) completedEl.textContent = stats.completed;
        if (remainingEl) remainingEl.textContent = problemCount - stats.completed;
        if (streakEl) streakEl.textContent = stats.currentStreak;
        if (accuracyEl) accuracyEl.textContent = `${stats.accuracy}%`;

        const heroStatProbs = document.getElementById("hero-stat-problems");
        if (heroStatProbs) heroStatProbs.textContent = `${problemCount}+`;

        const footerProbsCount = document.getElementById("footer-problems-count");
        if (footerProbsCount) footerProbsCount.textContent = `${problemCount}+`;

        const footerBadge = document.getElementById("footer-mastery-badge");
        if (footerBadge) footerBadge.textContent = problemCount;

        const welcomeName = document.getElementById("welcome-user-name");
        if (welcomeName) {
            welcomeName.textContent = user ? user.username : "Guest";
        }

        const heroSub = document.getElementById("hero-sub-progress");
        if (heroSub) {
            const pct = problemCount > 0 ? Math.round((stats.completed / problemCount) * 100) : 0;
            heroSub.textContent = `Completed ${stats.completed} of ${problemCount} problems (${pct}%)`;
        }

        const heroBar = document.getElementById("hero-progress-bar");
        if (heroBar) {
            const pct = problemCount > 0 ? (stats.completed / problemCount) * 100 : 0;
            heroBar.style.width = `${pct}%`;
        }
    },

    renderTopicSelect() {
        const topicSelect = document.getElementById("topic-select");
        if (!topicSelect) return;

        const sections = [...new Set(PROBLEMS.map(p => p.a2zSection || p.topic))];
        const currentVal = this.currentFilters.topic;

        topicSelect.innerHTML = `<option value="All">All Sections (${PROBLEMS.length})</option>` +
            sections.map(s => {
                const count = PROBLEMS.filter(p => (p.a2zSection || p.topic) === s).length;
                return `<option value="${s}" ${s === currentVal ? "selected" : ""}>${s} (${count})</option>`;
            }).join("");
    },

    renderProblemLibrary() {
        const user = StorageManager.getCurrentUser();
        const filtered = FilterEngine.filterProblems(PROBLEMS, user, this.currentFilters);

        const container = document.getElementById("topics-accordion-container") || document.getElementById("dsa-topics-accordion");
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="state-card"><div class="state-icon"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8.5 11h5"/></svg></div>
                    <h3>No problems found</h3><p>Try adjusting your search or filter options.</p></div>
            `;
            return;
        }

        // Group by a2zSection
        const sectionGroups = {};
        filtered.forEach(p => {
            const sec = p.a2zSection || p.topic;
            if (!sectionGroups[sec]) {
                sectionGroups[sec] = [];
            }
            sectionGroups[sec].push(p);
        });

        const completedSet = new Set(user ? user.completedProblems || [] : []);
        const favoritesSet = new Set(user ? user.favorites || [] : []);
        const notesObj = user ? user.notes || {} : {};

        let html = "";
        Object.keys(sectionGroups).forEach(secName => {
            const secProblems = sectionGroups[secName];
            const secTotal = PROBLEMS.filter(p => (p.a2zSection || p.topic) === secName).length;
            const secCompleted = PROBLEMS.filter(p => (p.a2zSection || p.topic) === secName && completedSet.has(p.id)).length;
            const secPct = secTotal > 0 ? Math.round((secCompleted / secTotal) * 100) : 0;
            const isOpen = this.expandedTopics.has(secName);
            const isFullyCompleted = secCompleted === secTotal && secTotal > 0;

            const circumference = 113.1;
            const dashoffset = circumference - (secPct / 100) * circumference;

            const subGroups = {};
            secProblems.forEach(p => {
                const sub = p.subtopic || secName;
                if (!subGroups[sub]) subGroups[sub] = [];
                subGroups[sub].push(p);
            });

            html += `
                <div class="topic-card ${isOpen ? "open" : ""} ${isFullyCompleted ? "completed" : ""}" data-topic="${secName}">
                    <div class="topic-card-accent-line"></div>
                    <div class="topic-card-header">
                        <div class="topic-info-group">
                            <div class="topic-icon-box">
                                ${this.getSectionIcon(secName)}
                            </div>
                            <div class="topic-title-area">
                                <h2>
                                    ${secName}
                                    <span class="topic-level-badge">${secProblems[0] ? secProblems[0].level || "PRACTICE" : "PRACTICE"}</span>
                                </h2>
                                <div class="topic-subtitle">${secProblems.length} Problems available</div>
                            </div>
                        </div>

                        <div class="topic-progress-group">
                            <div class="progress-circle-wrapper">
                                <svg class="progress-circle-svg">
                                    <circle class="progress-circle-bg" cx="22" cy="22" r="18"></circle>
                                    <circle class="progress-circle-val" cx="22" cy="22" r="18" 
                                            style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${dashoffset};"></circle>
                                </svg>
                                <span class="progress-circle-text">${secPct}%</span>
                            </div>
                            <div class="topic-fraction">${secCompleted}/${secTotal}</div>
                            <div class="chevron-icon">▼</div>
                        </div>
                    </div>

                    <div class="topic-card-body">
                        ${Object.keys(subGroups).map(subName => `
                            <div class="subtopic-header">${subName} (${subGroups[subName].length})</div>
                            <div class="problems-grid">
                                ${subGroups[subName].map(p => {
                                    const isDone = completedSet.has(p.id);
                                    const isFav = favoritesSet.has(p.id);
                                    const hasNote = Boolean(notesObj[p.id]);
                                    const platClass = (p.platform || "").toLowerCase().replace(/\s+/g, '');
                                    const diffClass = (p.difficulty || "medium").toLowerCase();

                                    return `
                                        <div class="problem-card ${isDone ? "completed" : ""}" data-id="${p.id}">
                                            <div class="problem-card-left-border"></div>
                                            <div class="problem-card-top-row">
                                                <div class="checkbox-title-wrapper">
                                                    <div class="custom-checkbox ${isDone ? "checked" : ""}">
                                                        <svg class="check-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                    </div>
                                                    <div class="problem-title">${p.title}</div>
                                                </div>
                                                <button class="star-btn ${isFav ? "active" : ""}" title="Favorite">
                                                    ${isFav ? "★" : "☆"}
                                                </button>
                                            </div>

                                            <div class="problem-card-bottom-row">
                                                <div class="badges-group">
                                                    <span class="badge badge-${diffClass}">${p.difficulty}</span>
                                                    <span class="badge badge-platform ${platClass}">${p.platform}</span>
                                                </div>
                                                <div class="actions-group">
                                                    <button class="action-icon-btn note-action-btn ${hasNote ? "has-note" : ""}" title="Personal Notes">
                                                        📝
                                                    </button>
                                                    ${p.url && p.url !== "#" ? `
                                                        <a href="${p.url}" target="_blank" rel="noopener" class="action-icon-btn" title="Open Problem">
                                                            🎯
                                                        </a>
                                                    ` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join("")}
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    getSectionIcon(sectionName) {
        if (sectionName.includes("01")) return "🧠";
        if (sectionName.includes("02")) return "⚡";
        if (sectionName.includes("03")) return "📊";
        if (sectionName.includes("04")) return "🔍";
        if (sectionName.includes("05")) return "🔤";
        if (sectionName.includes("06")) return "🔗";
        if (sectionName.includes("07")) return "🔄";
        if (sectionName.includes("08")) return "💡";
        if (sectionName.includes("09")) return "🧱";
        if (sectionName.includes("10")) return "🪟";
        if (sectionName.includes("11")) return "🔺";
        if (sectionName.includes("12")) return "💰";
        if (sectionName.includes("13")) return "🌳";
        if (sectionName.includes("14")) return "🌲";
        if (sectionName.includes("15")) return "🕸️";
        if (sectionName.includes("16")) return "🧩";
        if (sectionName.includes("17")) return "🌿";
        if (sectionName.includes("18")) return "🔠";
        return "📚";
    },

    toggleProblemCompletion(problemId) {
        const user = StorageManager.getCurrentUser();
        if (!user) {
            AuthManager.openModal("login");
            this.showToast("Please log in to track your progress.");
            return;
        }

        if (!user.completedProblems) user.completedProblems = [];
        const idx = user.completedProblems.indexOf(problemId);

        const problem = PROBLEMS.find(p => p.id === problemId);
        const title = problem ? problem.title : `Problem #${problemId}`;

        if (idx === -1) {
            user.completedProblems.push(problemId);
            AnalyticsEngine.updateStreakOnCompletion(user);
            AnalyticsEngine.logActivity(user, "PROBLEM_COMPLETED", `Completed: ${title}`);
            this.showToast(`Completed: ${title}`);
        } else {
            user.completedProblems.splice(idx, 1);
            const todayStr = new Date().toISOString().split("T")[0];
            if (user.completionDates && typeof user.completionDates[todayStr] === "number" && user.completionDates[todayStr] > 0) {
                user.completionDates[todayStr] -= 1;
            }
            AnalyticsEngine.logActivity(user, "PROBLEM_UNCOMPLETED", `Unmarked: ${title}`);
            this.showToast(`Unmarked: ${title}`);
        }

        StorageManager.saveCurrentUser(user);
        this.renderApp();
        if (typeof StreakCalendar !== "undefined") {
            StreakCalendar.render();
        }
    },

    toggleFavorite(problemId) {
        const user = StorageManager.getCurrentUser();
        if (!user) {
            AuthManager.openModal("login");
            this.showToast("Please log in to save favorites.");
            return;
        }

        if (!user.favorites) user.favorites = [];
        const idx = user.favorites.indexOf(problemId);

        if (idx === -1) {
            user.favorites.push(problemId);
            this.showToast("Added to favorites");
        } else {
            user.favorites.splice(idx, 1);
            this.showToast("Removed from favorites");
        }

        StorageManager.saveCurrentUser(user);
        this.renderApp();
    },

    currentActiveProblemIdForNote: null,

    openNotesModal(problemId) {
        const user = StorageManager.getCurrentUser();
        if (!user) {
            AuthManager.openModal("login");
            this.showToast("Please log in to save notes.");
            return;
        }

        this.currentActiveProblemIdForNote = problemId;
        const problem = PROBLEMS.find(p => p.id === problemId);
        const modal = document.getElementById("notes-modal-overlay");
        const titleEl = document.getElementById("notes-modal-title");
        const textarea = document.getElementById("notes-textarea");

        if (titleEl && problem) titleEl.textContent = `Notes: ${problem.title}`;
        if (textarea) textarea.value = (user.notes && user.notes[problemId]) || "";
        if (modal) modal.classList.add("active");
    },

    saveNote() {
        const user = StorageManager.getCurrentUser();
        const problemId = this.currentActiveProblemIdForNote;
        if (!user || !problemId) return;

        const textarea = document.getElementById("notes-textarea");
        const noteText = textarea ? textarea.value.trim() : "";

        if (!user.notes) user.notes = {};
        if (noteText) {
            user.notes[problemId] = noteText;
            this.showToast("Note saved.");
        } else {
            delete user.notes[problemId];
            this.showToast("Note cleared.");
        }

        StorageManager.saveCurrentUser(user);
        const modal = document.getElementById("notes-modal-overlay");
        if (modal) modal.classList.remove("active");
        this.renderApp();
    },

    showToast(message) {
        if (typeof ContestUI !== "undefined" && ContestUI.showToast) {
            ContestUI.showToast(message);
            return;
        }
        let container = document.querySelector(".toast-container");
        if (!container) {
            container = document.createElement("div");
            container.className = "toast-container";
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.className = "toast";
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(10px)";
            setTimeout(() => toast.remove(), 300);
        }, 2600);
    }
};

window.UIManager = UIManager;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}
