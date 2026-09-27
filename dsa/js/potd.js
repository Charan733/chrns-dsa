/**
 * Problem of the Day (POTD) Module for CHRNS-DSA
 * Dynamic date generation, platform modal controller, URL validation,
 * and per-user completion state management in LocalStorage.
 */

const POTDManager = {
    PROGRESS_KEY: "ctrl_alt_career_potd_progress",
    leetcodeDailyUrl: "https://leetcode.com/problemset/all/",
    gfgDailyUrl: "https://www.geeksforgeeks.org/problem-of-the-day",

    init() {
        this.renderDate();
        this.bindEvents();
        this.updateCardCompletionState();
        this.fetchDailyUrls();
    },

    async fetchDailyUrls() {
        try {
            const res = await fetch("https://alfa-leetcode-api.onrender.com/daily");
            if (res.ok) {
                const data = await res.json();
                if (data && data.questionLink) {
                    this.leetcodeDailyUrl = data.questionLink;
                }
            }
        } catch (e) {
            console.warn("LeetCode POTD URL fetch fallback:", e);
        }
    },

    getTodayDateString() {
        const now = new Date();
        // YYYY-MM-DD format for storage keys
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    getFormattedDisplayDate() {
        const now = new Date();
        return now.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric"
        });
    },

    renderDate() {
        const dateElem = document.getElementById("potd-date-display");
        if (dateElem) {
            dateElem.textContent = this.getFormattedDisplayDate();
        }
    },

    getCurrentUserId() {
        if (typeof StorageManager !== "undefined" && StorageManager.getCurrentUser) {
            const user = StorageManager.getCurrentUser();
            return user ? user.username : "guest";
        }
        return "guest";
    },

    getAllProgress() {
        try {
            const raw = localStorage.getItem(this.PROGRESS_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            console.error("Failed to load POTD progress:", e);
            return {};
        }
    },

    saveAllProgress(data) {
        try {
            localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Failed to save POTD progress:", e);
        }
    },

    isPlatformCompletedToday(platform) {
        const userId = this.getCurrentUserId();
        const dateStr = this.getTodayDateString();
        const all = this.getAllProgress();
        return Boolean(all[userId] && all[userId][dateStr] && all[userId][dateStr][platform]);
    },

    togglePlatformCompletionToday(platform) {
        const userId = this.getCurrentUserId();
        const dateStr = this.getTodayDateString();
        const all = this.getAllProgress();

        if (!all[userId]) all[userId] = {};
        if (!all[userId][dateStr]) all[userId][dateStr] = {};

        const currentState = Boolean(all[userId][dateStr][platform]);
        all[userId][dateStr][platform] = !currentState;

        this.saveAllProgress(all);
        this.updateCardCompletionState();
        return !currentState;
    },

    updateCardCompletionState() {
        const lcDone = this.isPlatformCompletedToday("leetcode");
        const gfgDone = this.isPlatformCompletedToday("geeksforgeeks");

        const lcBtn = document.getElementById("potd-complete-leetcode-btn");
        const gfgBtn = document.getElementById("potd-complete-gfg-btn");
        const statusBadge = document.getElementById("potd-status-badge");

        if (lcBtn) {
            lcBtn.classList.toggle("completed", lcDone);
            lcBtn.textContent = lcDone ? "✓ Completed (LeetCode)" : "Mark as Completed";
        }

        if (gfgBtn) {
            gfgBtn.classList.toggle("completed", gfgDone);
            gfgBtn.textContent = gfgDone ? "✓ Completed (GFG)" : "Mark as Completed";
        }

        if (statusBadge) {
            if (lcDone || gfgDone) {
                statusBadge.textContent = "★ Completed Today";
                statusBadge.className = "potd-badge potd-badge-done";
            } else {
                statusBadge.textContent = "Daily Challenge";
                statusBadge.className = "potd-badge";
            }
        }
    },

    bindEvents() {
        const triggerBtn = document.getElementById("open-potd-modal-btn");
        const modal = document.getElementById("potd-modal-overlay");
        const closeBtn = document.getElementById("close-potd-modal");

        if (triggerBtn && modal) {
            triggerBtn.addEventListener("click", () => {
                this.updateCardCompletionState();
                modal.classList.add("active");
            });
        }

        if (closeBtn && modal) {
            closeBtn.addEventListener("click", () => modal.classList.remove("active"));
            modal.addEventListener("click", (e) => {
                if (e.target === modal) modal.classList.remove("active");
            });
        }

        // LeetCode Open
        const lcOpenBtn = document.getElementById("potd-open-leetcode-btn");
        if (lcOpenBtn) {
            lcOpenBtn.addEventListener("click", () => {
                const targetUrl = this.leetcodeDailyUrl || "https://leetcode.com/problemset/all/";
                this.openPlatformDaily("leetcode", targetUrl);
            });
        }

        // LeetCode Mark Completed
        const lcCompBtn = document.getElementById("potd-complete-leetcode-btn");
        if (lcCompBtn) {
            lcCompBtn.addEventListener("click", () => {
                const isNowDone = this.togglePlatformCompletionToday("leetcode");
                if (typeof ContestUI !== "undefined" && ContestUI.showToast) {
                    ContestUI.showToast(isNowDone ? "✓ LeetCode Daily marked as completed!" : "LeetCode Daily unmarked.");
                }
            });
        }

        // GFG Open
        const gfgOpenBtn = document.getElementById("potd-open-gfg-btn");
        if (gfgOpenBtn) {
            gfgOpenBtn.addEventListener("click", () => {
                const targetUrl = this.gfgDailyUrl || "https://www.geeksforgeeks.org/problem-of-the-day";
                this.openPlatformDaily("geeksforgeeks", targetUrl);
            });
        }

        // GFG Mark Completed
        const gfgCompBtn = document.getElementById("potd-complete-gfg-btn");
        if (gfgCompBtn) {
            gfgCompBtn.addEventListener("click", () => {
                const isNowDone = this.togglePlatformCompletionToday("geeksforgeeks");
                if (typeof ContestUI !== "undefined" && ContestUI.showToast) {
                    ContestUI.showToast(isNowDone ? "✓ GeeksforGeeks POTD marked as completed!" : "GeeksforGeeks POTD unmarked.");
                }
            });
        }
    },

    openPlatformDaily(platform, url) {
        const targetUrl = url || (platform === "leetcode" ? "https://leetcode.com/problemset/all/" : "https://www.geeksforgeeks.org/problem-of-the-day");
        if (targetUrl && (targetUrl.startsWith("http://") || targetUrl.startsWith("https://"))) {
            window.open(targetUrl, "_blank", "noopener,noreferrer");
        } else {
            if (typeof ContestUI !== "undefined" && ContestUI.showToast) {
                ContestUI.showToast("Today's problem link is unavailable.");
            }
        }
    }
};

window.POTDManager = POTDManager;
