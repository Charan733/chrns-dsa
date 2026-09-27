/**
 * Contest UI Controller for CodeCal / Challenges Page
 * Renders Hero, Stats, Search/Filter Panel, Summary Cards, Live Challenges,
 * Upcoming Rounds, Recently Concluded, Calendar View, and Footer.
 */

const ContestUI = {
    currentPlatform: "All",
    searchQuery: "",
    viewMode: "grid", // "grid" or "calendar"
    currentUpcomingRange: "today",
    timerId: null,
    refreshIntervalId: null,
    contestsLoaded: false,

    async init() {
        this.bindEvents();
        this.renderAll();
        this.startTimer();

        // Fetch real-time live contest data on page load
        await ContestManager.fetchRealTimeContests();
        this.contestsLoaded = true;
        this.renderAll();

        // Start periodic 5-minute data refresh
        this.startRefreshInterval();
    },

    startRefreshInterval() {
        if (this.refreshIntervalId) clearInterval(this.refreshIntervalId);
        this.refreshIntervalId = setInterval(async () => {
            console.log("Periodic 5-minute data refresh triggered...");
            await ContestManager.fetchRealTimeContests();
            this.renderAll();
        }, 5 * 60 * 1000);
    },

    startTimer() {
        if (this.timerId) clearInterval(this.timerId);
        this.timerId = setInterval(() => {
            this.updateCountdownsAndStatus();
        }, 1000);
    },

    destroyTimer() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    },

    bindEvents() {
        // Explore Contests CTA scroll
        const exploreBtn = document.getElementById("explore-contests-btn");
        if (exploreBtn) {
            exploreBtn.addEventListener("click", () => {
                const target = document.getElementById("challenges-search-section");
                if (target) {
                    target.scrollIntoView({ behavior: "smooth" });
                }
            });
        }

        // Contest Search Input
        const searchInput = document.getElementById("contest-search-input");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderContestLists();
            });
        }

        // Platform Filter Pills
        const platformContainer = document.getElementById("contest-platform-pills");
        if (platformContainer) {
            platformContainer.addEventListener("click", (e) => {
                const btn = e.target.closest(".contest-plat-pill");
                if (!btn) return;
                const platform = btn.dataset.platform;
                this.currentPlatform = platform;

                platformContainer.querySelectorAll(".contest-plat-pill").forEach(b => {
                    b.classList.remove("active");
                });
                btn.classList.add("active");

                this.renderContestLists();
            });
        }

        // View Mode Toggle (Grid vs Calendar)
        const gridViewBtn = document.getElementById("view-mode-grid");
        const calViewBtn = document.getElementById("view-mode-calendar");
        if (gridViewBtn && calViewBtn) {
            gridViewBtn.addEventListener("click", () => {
                this.viewMode = "grid";
                gridViewBtn.classList.add("active");
                calViewBtn.classList.remove("active");
                this.toggleViewLayout();
            });
            calViewBtn.addEventListener("click", () => {
                this.viewMode = "calendar";
                calViewBtn.classList.add("active");
                gridViewBtn.classList.remove("active");
                this.toggleViewLayout();
            });
        }

        // Back-to-Top Button
        const backToTopBtn = document.getElementById("back-to-top-btn");
        if (backToTopBtn) {
            window.addEventListener("scroll", () => {
                if (window.scrollY > 250) {
                    backToTopBtn.style.display = "flex";
                } else {
                    backToTopBtn.style.display = "none";
                }
            });
            backToTopBtn.addEventListener("click", () => {
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        }

        // Upcoming Rounds Hero Button & Dropdown Menu
        const upcomingHeroBtn = document.getElementById("upcoming-rounds-hero-btn");
        const upcomingDropdown = document.getElementById("upcoming-rounds-dropdown");
        if (upcomingHeroBtn && upcomingDropdown) {
            upcomingHeroBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                upcomingDropdown.classList.toggle("active");
            });

            document.addEventListener("click", (e) => {
                if (!e.target.closest(".upcoming-rounds-btn-wrapper")) {
                    upcomingDropdown.classList.remove("active");
                }
            });

            upcomingDropdown.addEventListener("click", (e) => {
                const item = e.target.closest(".upcoming-dropdown-item");
                if (!item) return;
                const range = item.dataset.range;
                upcomingDropdown.classList.remove("active");
                this.openUpcomingRoundsModal(range);
            });
        }

        // Upcoming Rounds Modal & Tabs
        const modalOverlay = document.getElementById("upcoming-rounds-modal-overlay");
        const closeBtn = document.getElementById("close-upcoming-rounds-modal");
        const tabsContainer = document.getElementById("upcoming-modal-tabs");

        if (closeBtn && modalOverlay) {
            closeBtn.addEventListener("click", () => {
                modalOverlay.classList.remove("active");
            });
            modalOverlay.addEventListener("click", (e) => {
                if (e.target === modalOverlay) {
                    modalOverlay.classList.remove("active");
                }
            });
        }

        if (tabsContainer) {
            tabsContainer.addEventListener("click", (e) => {
                const tabBtn = e.target.closest(".upcoming-modal-tab");
                if (!tabBtn) return;
                const range = tabBtn.dataset.range;
                this.currentUpcomingRange = range;
                tabsContainer.querySelectorAll(".upcoming-modal-tab").forEach(t => t.classList.remove("active"));
                tabBtn.classList.add("active");
                this.renderUpcomingRoundsModal(range);
            });
        }
    },

    renderAll() {
        this.renderStats();
        this.renderSummaryCards();
        this.renderContestLists();
        this.updateClock();
        if (typeof StreakCalendar !== "undefined") {
            StreakCalendar.render();
        }
        const modalOverlay = document.getElementById("upcoming-rounds-modal-overlay");
        if (modalOverlay && modalOverlay.classList.contains("active")) {
            this.renderUpcomingRoundsModal(this.currentUpcomingRange);
        }
    },

    toggleViewLayout() {
        const gridContainer = document.getElementById("contests-grid-layout");
        const calendarContainer = document.getElementById("contests-calendar-layout");

        if (this.viewMode === "calendar") {
            if (gridContainer) gridContainer.style.display = "none";
            if (calendarContainer) {
                calendarContainer.style.display = "block";
                this.renderCalendar();
            }
        } else {
            if (calendarContainer) calendarContainer.style.display = "none";
            if (gridContainer) gridContainer.style.display = "block";
        }
    },

    renderStats() {
        const summary = ContestManager.getSummaryStats();
        const totalProbsElem = document.getElementById("hero-stat-problems");
        const totalContestsElem = document.getElementById("hero-stat-contests");
        const totalPlatformsElem = document.getElementById("hero-stat-platforms");

        const problemCount = (typeof PROBLEMS !== "undefined" && Array.isArray(PROBLEMS)) ? PROBLEMS.length : 369;

        if (totalProbsElem) totalProbsElem.textContent = `${problemCount}+`;
        if (totalContestsElem) totalContestsElem.textContent = `${summary.totalContests}+`;
        if (totalPlatformsElem) totalPlatformsElem.textContent = summary.platformCount;
    },

    renderSummaryCards() {
        const summary = ContestManager.getSummaryStats();

        // Active Now
        const activeCountElem = document.getElementById("summary-active-count");
        if (activeCountElem) activeCountElem.textContent = summary.liveCount;

        // Upcoming Next
        const upcomingSubElem = document.getElementById("summary-upcoming-sub");
        if (upcomingSubElem) {
            if (summary.nextUpcoming) {
                const remainingStr = ContestManager.formatCountdown(summary.nextUpcoming.startMs);
                const platLower = summary.nextUpcoming.platform.toLowerCase();
                upcomingSubElem.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span class="plat-dot plat-dot-${platLower}">●</span>
                        <strong style="font-size: 1rem; color: var(--text-primary);">${summary.nextUpcoming.platform}</strong>
                    </div>
                    <div style="font-size: 1.35rem; font-weight: 800; color: var(--primary-purple);" data-countdown-target="${summary.nextUpcoming.startMs}">
                        in ${remainingStr}
                    </div>
                `;
            } else {
                upcomingSubElem.textContent = "No upcoming contests";
            }
        }

        // Recent Finish List
        const recentListElem = document.getElementById("summary-recent-list");
        if (recentListElem && summary.recentFinished) {
            recentListElem.innerHTML = summary.recentFinished.map(c => `
                <div class="recent-finish-item">
                    <span class="plat-dot plat-dot-${c.platform.toLowerCase()}">●</span>
                    <span class="recent-title">${c.title}</span>
                </div>
            `).join("");
        }

        // Today Count
        const todayCountElem = document.getElementById("summary-today-count");
        if (todayCountElem) todayCountElem.textContent = summary.todayCount;
    },

    getCurrentUserId() {
        if (typeof StorageManager !== "undefined" && StorageManager.getCurrentUser) {
            const user = StorageManager.getCurrentUser();
            return user ? user.username : "guest";
        }
        return "guest";
    },

    renderContestLists() {
        const allContests = ContestManager.getContests();
        const userId = this.getCurrentUserId();

        // Filter by platform & search
        const filtered = allContests.filter(c => {
            const matchPlatform = (this.currentPlatform === "All") || (c.platform.toLowerCase() === this.currentPlatform.toLowerCase());
            const matchSearch = !this.searchQuery ||
                c.title.toLowerCase().includes(this.searchQuery) ||
                c.platform.toLowerCase().includes(this.searchQuery) ||
                c.category.toLowerCase().includes(this.searchQuery);
            return matchPlatform && matchSearch;
        });

        const liveContests = filtered.filter(c => c.status === "LIVE NOW");
        const upcomingContests = filtered.filter(c => c.status === "UPCOMING").sort((a, b) => a.startMs - b.startMs);
        const endedContests = filtered.filter(c => c.status === "ENDED").sort((a, b) => b.endMs - a.endMs);

        // While the very first fetch is still in flight we don't yet know whether a
        // list is genuinely empty, so show a loading skeleton instead of "no contests".
        const loadingSkeleton = (n) => Array.from({ length: n }, () =>
            `<div class="contest-card skeleton-card"><div class="skeleton" style="height:14px;width:40%;margin-bottom:10px"></div><div class="skeleton" style="height:20px;width:80%;margin-bottom:10px"></div><div class="skeleton" style="height:12px;width:55%"></div></div>`
        ).join("");

        // Render Live
        const liveContainer = document.getElementById("live-challenges-list");
        if (liveContainer) {
            if (liveContests.length === 0) {
                liveContainer.innerHTML = this.contestsLoaded
                    ? `<div class="empty-contest-card state-card compact"><div class="state-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div><p>No live contests match your search filter.</p></div>`
                    : loadingSkeleton(1);
            } else {
                liveContainer.innerHTML = liveContests.map(c => this.createContestCardHTML(c, userId)).join("");
            }
        }

        // Render Upcoming
        const upcomingContainer = document.getElementById("upcoming-rounds-list");
        if (upcomingContainer) {
            if (upcomingContests.length === 0) {
                upcomingContainer.innerHTML = this.contestsLoaded
                    ? `<div class="empty-contest-card state-card compact"><div class="state-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div><p>No upcoming contests found.</p></div>`
                    : loadingSkeleton(2);
            } else {
                upcomingContainer.innerHTML = upcomingContests.map(c => this.createContestCardHTML(c, userId)).join("");
            }
        }

        // Render Recently Concluded
        const endedContainer = document.getElementById("recently-concluded-list");
        if (endedContainer) {
            if (endedContests.length === 0) {
                endedContainer.innerHTML = this.contestsLoaded
                    ? `<div class="empty-contest-card state-card compact"><div class="state-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div><p>No recently concluded contests.</p></div>`
                    : loadingSkeleton(2);
            } else {
                endedContainer.innerHTML = endedContests.map(c => this.createContestCardHTML(c, userId)).join("");
            }
        }

        if (this.viewMode === "calendar") {
            this.renderCalendar();
        }
    },

    createContestCardHTML(c, userId) {
        const isReminder = ContestManager.isReminderSet(userId, c.id);
        const platformClass = `plat-${c.platform.toLowerCase()}`;
        const difficultyClass = `diff-${c.category.toLowerCase()}`;

        let statusBadge = "";
        let countdownBadge = "";
        let actionBtn = "";

        if (c.status === "LIVE NOW") {
            statusBadge = `
                <div class="live-status-group">
                    <span class="badge badge-today">★ TODAY</span>
                    <span class="badge badge-live"><span class="pulse-dot"></span> Live Now</span>
                </div>
            `;
            actionBtn = `
                <button class="btn-contest-primary" onclick="ContestUI.handleRegister('${c.contestUrl || ''}')">
                    Register & Enter ↗
                </button>
            `;
        } else if (c.status === "UPCOMING") {
            const remaining = ContestManager.formatCountdown(c.startMs);
            countdownBadge = `<span class="contest-countdown-tag" data-countdown-target="${c.startMs}">${remaining}</span>`;
            actionBtn = `
                <div style="display: flex; gap: 8px; width: 100%;">
                    <button class="btn-contest-primary" style="flex: 1;" onclick="ContestUI.handleRegister('${c.contestUrl || ''}')">
                        Register & Enter ↗
                    </button>
                    <button class="btn-reminder ${isReminder ? 'active' : ''}" title="Toggle Reminder" onclick="ContestUI.handleReminderToggle('${c.id}', this)">
                        ${isReminder ? '✓' : '🔔'}
                    </button>
                </div>
            `;
        } else { // ENDED
            statusBadge = `<span class="badge badge-ended">Ended</span>`;
            actionBtn = `
                <button class="btn-contest-secondary" onclick="ContestUI.handleViewProblems('${c.problemsUrl || ''}')">
                    View Problems ↗
                </button>
            `;
        }

        return `
            <div class="contest-card ${c.status === 'LIVE NOW' ? 'contest-card-live' : ''}">
                <div class="contest-card-header">
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span class="platform-badge ${platformClass}">${c.platform.toUpperCase()}</span>
                        <span class="category-badge ${difficultyClass}">${c.category}</span>
                    </div>
                    ${statusBadge || countdownBadge}
                </div>

                <h3 class="contest-title">${c.title}</h3>

                <div class="contest-meta-row">
                    <div class="meta-item">
                        <span>🗓️</span>
                        <span>Starts: ${ContestManager.formatShortTime(c.startTime)}</span>
                    </div>
                    <div class="meta-item">
                        <span>🏁</span>
                        <span>Ends: ${ContestManager.formatShortTime(c.endTime)}</span>
                    </div>
                </div>

                <div class="contest-card-footer">
                    ${actionBtn}
                </div>
            </div>
        `;
    },

    renderCalendar() {
        const calendarContainer = document.getElementById("contests-calendar-layout");
        if (!calendarContainer) return;

        const contests = ContestManager.getContests();
        const daysGroup = {};

        contests.forEach(c => {
            const dateStr = new Date(c.startTime).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' });
            if (!daysGroup[dateStr]) daysGroup[dateStr] = [];
            daysGroup[dateStr].push(c);
        });

        let html = `<div class="calendar-grid-wrapper">`;
        for (const [date, list] of Object.entries(daysGroup)) {
            html += `
                <div class="calendar-day-block">
                    <div class="calendar-date-header">${date}</div>
                    <div class="calendar-day-events">
                        ${list.map(c => `
                            <div class="calendar-event-item plat-border-${c.platform.toLowerCase()}" onclick="ContestUI.handleRegister('${c.contestUrl || ''}')">
                                <div class="cal-event-title">${c.title}</div>
                                <div class="cal-event-time">${c.platform} • ${new Date(c.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
        }
        html += `</div>`;
        calendarContainer.innerHTML = html;
    },

    updateCountdownsAndStatus() {
        let needsReRender = false;
        const nowMs = Date.now();

        // Update elements with data-countdown-target
        const targetElements = document.querySelectorAll("[data-countdown-target]");
        targetElements.forEach(el => {
            const targetMs = parseInt(el.getAttribute("data-countdown-target"), 10);
            if (targetMs) {
                const diff = targetMs - nowMs;
                if (diff <= 0) {
                    needsReRender = true;
                }
                const remaining = ContestManager.formatCountdown(targetMs);
                if (el.textContent.startsWith("in ")) {
                    el.textContent = `in ${remaining}`;
                } else {
                    el.textContent = remaining;
                }
            }
        });

        if (needsReRender) {
            this.renderSummaryCards();
            this.renderContestLists();
        }

        const modalOverlay = document.getElementById("upcoming-rounds-modal-overlay");
        if (modalOverlay && modalOverlay.classList.contains("active")) {
            this.renderUpcomingRoundsModal(this.currentUpcomingRange);
        }

        this.updateClock();
    },

    openUpcomingRoundsModal(range = "today") {
        this.currentUpcomingRange = range;
        const modalOverlay = document.getElementById("upcoming-rounds-modal-overlay");
        const tabsContainer = document.getElementById("upcoming-modal-tabs");
        if (tabsContainer) {
            tabsContainer.querySelectorAll(".upcoming-modal-tab").forEach(t => {
                t.classList.toggle("active", t.dataset.range === range);
            });
        }
        if (modalOverlay) {
            modalOverlay.classList.add("active");
        }
        this.renderUpcomingRoundsModal(range);
    },

    getUpcomingContestsByRange(range) {
        const allContests = ContestManager.getContests();
        const now = new Date();
        const nowMs = Date.now();

        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

        // End of current week (Sunday 23:59:59.999 local time, or at least 7 days ahead)
        const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
        const daysUntilSunday = (7 - dayOfWeek) % 7;
        const sundayEndOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday), 23, 59, 59, 999).getTime();
        const endOfWeek = Math.max(sundayEndOfDay, nowMs + 7 * 24 * 60 * 60 * 1000);

        // End of current month (last day 23:59:59.999 local time)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

        return allContests.filter(c => {
            if (c.status === "ENDED" || c.endMs <= nowMs) {
                return false;
            }

            const startMs = c.startMs;

            if (range === "today") {
                return (startMs >= nowMs && startMs <= endOfToday) || c.status === "LIVE NOW";
            } else if (range === "week") {
                return (startMs >= nowMs && startMs <= endOfWeek) || c.status === "LIVE NOW";
            } else if (range === "month") {
                return (startMs >= nowMs && startMs <= endOfMonth) || c.status === "LIVE NOW";
            }
            return false;
        }).sort((a, b) => a.startMs - b.startMs);
    },

    renderUpcomingRoundsModal(range = "today") {
        const listContainer = document.getElementById("upcoming-rounds-modal-list");
        const subtitleElem = document.getElementById("upcoming-rounds-modal-subtitle");
        if (!listContainer) return;

        const userId = this.getCurrentUserId();
        const contests = this.getUpcomingContestsByRange(range);

        if (subtitleElem) {
            if (range === "today") {
                subtitleElem.textContent = "Contests scheduled for Today";
            } else if (range === "week") {
                subtitleElem.textContent = "Contests scheduled for This Week";
            } else if (range === "month") {
                subtitleElem.textContent = "Contests scheduled for This Month";
            }
        }

        if (contests.length === 0) {
            let emptyText = "No upcoming contests today.";
            if (range === "week") emptyText = "No upcoming contests this week.";
            if (range === "month") emptyText = "No upcoming contests this month.";

            listContainer.innerHTML = `
                <div class="empty-contest-card" style="text-align: center; padding: 32px 16px; color: var(--text-muted);">
                    ${emptyText}
                </div>
            `;
        } else {
            listContainer.innerHTML = contests.map(c => this.createContestCardHTML(c, userId)).join("");
        }
    },

    updateClock() {
        const clockElem = document.getElementById("footer-live-clock");
        if (clockElem) {
            const now = new Date();
            clockElem.textContent = now.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' }) + " " + now.toLocaleTimeString();
        }
    },

    isValidHttpUrl(url) {
        if (!url || typeof url !== "string") return false;
        const trimmed = url.trim();
        return trimmed.startsWith("http://") || trimmed.startsWith("https://");
    },

    handleRegister(url) {
        if (this.isValidHttpUrl(url)) {
            window.open(url, "_blank", "noopener,noreferrer");
        } else {
            this.showToast("Contest link unavailable.");
        }
    },

    handleViewProblems(url) {
        if (this.isValidHttpUrl(url)) {
            window.open(url, "_blank", "noopener,noreferrer");
        } else {
            this.showToast("Problems link unavailable.");
        }
    },

    handleReminderToggle(contestId, buttonElem) {
        const userId = this.getCurrentUserId();
        const isSet = ContestManager.toggleReminder(userId, contestId);
        if (buttonElem) {
            buttonElem.classList.toggle("active", isSet);
            buttonElem.innerHTML = isSet ? "✓" : "🔔";
        }
        this.showToast(isSet ? "✓ Reminder set for contest!" : "Reminder removed.");
    },

    showToast(message) {
        let toast = document.getElementById("codecal-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "codecal-toast";
            toast.className = "codecal-toast-msg";
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
        }, 2800);
    }
};

window.ContestUI = ContestUI;
