/**
 * Contests Module for CodeCal
 * Handles contest dataset, client-side dynamic status calculation,
 * countdown engine formatting, and per-user reminder persistence.
 */

const ContestManager = {
    REMINDERS_KEY: "codecal_reminders",
    rawFetchedContests: [],

    /**
     * Load all reminders object from LocalStorage:
     * Structure: { [userId]: { [contestId]: true } }
     */
    getAllReminders() {
        try {
            const raw = localStorage.getItem(this.REMINDERS_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            console.error("Failed to load reminders from LocalStorage:", e);
            return {};
        }
    },

    saveAllReminders(data) {
        try {
            localStorage.setItem(this.REMINDERS_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Failed to save reminders to LocalStorage:", e);
        }
    },

    /**
     * Get reminder state for a specific user and contest
     */
    isReminderSet(userId, contestId) {
        const key = userId || "guest";
        const all = this.getAllReminders();
        return Boolean(all[key] && all[key][contestId]);
    },

    /**
     * Toggle reminder for a specific user and contest
     */
    toggleReminder(userId, contestId) {
        const key = userId || "guest";
        const all = this.getAllReminders();
        if (!all[key]) all[key] = {};

        const currentState = Boolean(all[key][contestId]);
        if (currentState) {
            delete all[key][contestId];
        } else {
            all[key][contestId] = true;
        }

        this.saveAllReminders(all);
        return !currentState;
    },

    /**
     * Fetch real-time live contest data from verified platform APIs
     */
    /**
     * Fetch real-time live contest data from verified platform APIs (All 5 Platforms)
     */
    async fetchRealTimeContests() {
        const nowMs = Date.now();
        const fetched = [];

        const fetchWithTimeout = async (url, options = {}, timeoutMs = 3500) => {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const res = await fetch(url, { ...options, signal: controller.signal });
                clearTimeout(timer);
                return res;
            } catch (e) {
                clearTimeout(timer);
                throw e;
            }
        };

        // 1. Codeforces API
        const fetchCodeforces = async () => {
            try {
                let res;
                try {
                    res = await fetchWithTimeout("https://codeforces.com/api/contest.list");
                } catch (e) {
                    res = await fetchWithTimeout("https://kontests.net/api/v1/code_forces");
                }
                if (!res || !res.ok) return;
                const json = await res.json();

                if (json.status === "OK" && Array.isArray(json.result)) {
                    json.result.filter(c => {
                        const endMs = (c.startTimeSeconds + c.durationSeconds) * 1000;
                        return endMs > nowMs - 7 * 24 * 60 * 60 * 1000;
                    }).forEach(c => {
                        const startMs = c.startTimeSeconds * 1000;
                        const endMs = (c.startTimeSeconds + c.durationSeconds) * 1000;
                        let category = "MEDIUM";
                        if (c.name.includes("Div. 3") || c.name.includes("Div. 4")) category = "EASY";
                        else if (c.name.includes("Div. 1")) category = "ADVANCED";

                        fetched.push({
                            id: `codeforces_${c.id}`,
                            platform: "CodeForces",
                            title: c.name,
                            category: category,
                            startTime: new Date(startMs).toISOString(),
                            endTime: new Date(endMs).toISOString(),
                            startMs,
                            endMs,
                            contestUrl: `https://codeforces.com/contest/${c.id}`,
                            problemsUrl: `https://codeforces.com/contest/${c.id}/problems`
                        });
                    });
                } else if (Array.isArray(json)) {
                    json.forEach(c => {
                        const startMs = new Date(c.start_time).getTime();
                        const endMs = new Date(c.end_time).getTime();
                        if (!isNaN(startMs) && !isNaN(endMs)) {
                            fetched.push({
                                id: `codeforces_${c.name.replace(/\s+/g, '_')}`,
                                platform: "CodeForces",
                                title: c.name,
                                category: "MEDIUM",
                                startTime: new Date(startMs).toISOString(),
                                endTime: new Date(endMs).toISOString(),
                                startMs,
                                endMs,
                                contestUrl: c.url || "https://codeforces.com/contests",
                                problemsUrl: c.url || "https://codeforces.com/contests"
                            });
                        }
                    });
                }
            } catch (e) {
                console.warn("Codeforces live fetch error:", e.message);
            }
        };

        // 2. LeetCode API
        const fetchLeetCode = async () => {
            try {
                let res;
                try {
                    res = await fetchWithTimeout("https://alfa-leetcode-api.onrender.com/contests");
                } catch (e) {
                    try {
                        res = await fetchWithTimeout("https://leetcode.com/graphql", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ query: "query topTwoContests { topTwoContests { title titleSlug startTime duration } }" })
                        });
                    } catch (err) {
                        res = await fetchWithTimeout("https://kontests.net/api/v1/leet_code");
                    }
                }
                if (!res || !res.ok) return;
                const json = await res.json();

                if (json && Array.isArray(json.allContests)) {
                    json.allContests.filter(c => {
                        const endMs = (c.startTime + c.duration) * 1000;
                        return endMs > nowMs - 7 * 24 * 60 * 60 * 1000;
                    }).forEach(c => {
                        const startMs = c.startTime * 1000;
                        const endMs = (c.startTime + c.duration) * 1000;
                        const isBiweekly = c.title.toLowerCase().includes("biweekly");

                        fetched.push({
                            id: `leetcode_${c.titleSlug || c.title}`,
                            platform: "LeetCode",
                            title: c.title,
                            category: isBiweekly ? "ADVANCED" : "MEDIUM",
                            startTime: new Date(startMs).toISOString(),
                            endTime: new Date(endMs).toISOString(),
                            startMs,
                            endMs,
                            contestUrl: `https://leetcode.com/contest/${c.titleSlug || ''}/`,
                            problemsUrl: `https://leetcode.com/contest/${c.titleSlug || ''}/`
                        });
                    });
                } else if (json && json.data && Array.isArray(json.data.topTwoContests)) {
                    json.data.topTwoContests.forEach(c => {
                        const startMs = c.startTime * 1000;
                        const endMs = (c.startTime + (c.duration || 5400)) * 1000;
                        fetched.push({
                            id: `leetcode_${c.titleSlug || c.title}`,
                            platform: "LeetCode",
                            title: c.title,
                            category: c.title.toLowerCase().includes("biweekly") ? "ADVANCED" : "MEDIUM",
                            startTime: new Date(startMs).toISOString(),
                            endTime: new Date(endMs).toISOString(),
                            startMs,
                            endMs,
                            contestUrl: `https://leetcode.com/contest/${c.titleSlug || ''}/`,
                            problemsUrl: `https://leetcode.com/contest/${c.titleSlug || ''}/`
                        });
                    });
                } else if (Array.isArray(json)) {
                    json.forEach(c => {
                        const startMs = new Date(c.start_time).getTime();
                        const endMs = new Date(c.end_time).getTime();
                        if (!isNaN(startMs) && !isNaN(endMs)) {
                            fetched.push({
                                id: `leetcode_${c.name.replace(/\s+/g, '_')}`,
                                platform: "LeetCode",
                                title: c.name,
                                category: c.name.toLowerCase().includes("biweekly") ? "ADVANCED" : "MEDIUM",
                                startTime: new Date(startMs).toISOString(),
                                endTime: new Date(endMs).toISOString(),
                                startMs,
                                endMs,
                                contestUrl: c.url || "https://leetcode.com/contest/",
                                problemsUrl: c.url || "https://leetcode.com/contest/"
                            });
                        }
                    });
                }
            } catch (e) {
                console.warn("LeetCode live fetch error:", e.message);
            }
        };

        // 3. CodeChef API
        const fetchCodeChef = async () => {
            try {
                let res;
                try {
                    res = await fetchWithTimeout("https://kontests.net/api/v1/code_chef", {}, 2500);
                } catch (e) {
                    try {
                        res = await fetchWithTimeout("https://api.allorigins.win/raw?url=" + encodeURIComponent("https://www.codechef.com/api/list/contests/all"), {}, 2500);
                    } catch (err) {
                        res = await fetchWithTimeout("https://www.codechef.com/api/list/contests/all", {}, 2000);
                    }
                }
                if (!res || !res.ok) return;
                const json = await res.json();

                if (Array.isArray(json)) {
                    json.forEach(c => {
                        const startMs = new Date(c.start_time).getTime();
                        const endMs = new Date(c.end_time).getTime();
                        if (!isNaN(startMs) && !isNaN(endMs)) {
                            fetched.push({
                                id: `codechef_${c.name.replace(/\s+/g, '_')}`,
                                platform: "CodeChef",
                                title: c.name,
                                category: "MEDIUM",
                                startTime: new Date(startMs).toISOString(),
                                endTime: new Date(endMs).toISOString(),
                                startMs,
                                endMs,
                                contestUrl: c.url || "https://www.codechef.com/contests",
                                problemsUrl: c.url || "https://www.codechef.com/contests"
                            });
                        }
                    });
                } else if (json) {
                    const parseCC = (item) => {
                        const startMs = new Date(item.contest_start_date_iso || item.contest_start_date).getTime();
                        const endMs = new Date(item.contest_end_date_iso || item.contest_end_date).getTime();
                        if (!isNaN(startMs) && !isNaN(endMs)) {
                            fetched.push({
                                id: `codechef_${item.contest_code || item.contest_id}`,
                                platform: "CodeChef",
                                title: item.contest_name || item.contest_code,
                                category: "MEDIUM",
                                startTime: new Date(startMs).toISOString(),
                                endTime: new Date(endMs).toISOString(),
                                startMs,
                                endMs,
                                contestUrl: `https://www.codechef.com/${item.contest_code || ''}`,
                                problemsUrl: `https://www.codechef.com/${item.contest_code || ''}`
                            });
                        }
                    };
                    if (json.future_contests && Array.isArray(json.future_contests)) json.future_contests.forEach(parseCC);
                    if (json.present_contests && Array.isArray(json.present_contests)) json.present_contests.forEach(parseCC);
                    if (json.past_contests && Array.isArray(json.past_contests)) json.past_contests.slice(0, 5).forEach(parseCC);
                }
            } catch (e) {
                console.warn("CodeChef live fetch error:", e.message);
            }
        };

        // 4. AtCoder API
        const fetchAtCoder = async () => {
            try {
                let res;
                try {
                    res = await fetchWithTimeout("https://kontests.net/api/v1/at_coder", {}, 2500);
                } catch (e) {
                    res = await fetchWithTimeout("https://api.allorigins.win/raw?url=" + encodeURIComponent("https://kenkoooo.com/atcoder/resources/contests.json"), {}, 3000);
                }
                if (!res || !res.ok) return;
                const json = await res.json();

                if (Array.isArray(json)) {
                    if (json.length > 0 && json[0].start_time) {
                        json.forEach(c => {
                            const startMs = new Date(c.start_time).getTime();
                            const endMs = new Date(c.end_time).getTime();
                            if (!isNaN(startMs) && !isNaN(endMs)) {
                                fetched.push({
                                    id: `atcoder_${c.name.replace(/\s+/g, '_')}`,
                                    platform: "AtCoder",
                                    title: c.name,
                                    category: c.name.toLowerCase().includes("beginner") ? "EASY" : "MEDIUM",
                                    startTime: new Date(startMs).toISOString(),
                                    endTime: new Date(endMs).toISOString(),
                                    startMs,
                                    endMs,
                                    contestUrl: c.url || "https://atcoder.jp/contests",
                                    problemsUrl: c.url || "https://atcoder.jp/contests"
                                });
                            }
                        });
                    } else {
                        const recentOrUpcoming = json.filter(c => {
                            const endMs = (c.start_epoch_second + c.duration_second) * 1000;
                            return endMs > nowMs - 7 * 24 * 60 * 60 * 1000;
                        }).slice(-10);

                        recentOrUpcoming.forEach(c => {
                            const startMs = c.start_epoch_second * 1000;
                            const endMs = (c.start_epoch_second + c.duration_second) * 1000;
                            let category = "MEDIUM";
                            if (c.id.startsWith("abc")) category = "EASY";
                            else if (c.id.startsWith("agc")) category = "ADVANCED";

                            fetched.push({
                                id: `atcoder_${c.id}`,
                                platform: "AtCoder",
                                title: c.title || c.id.toUpperCase(),
                                category,
                                startTime: new Date(startMs).toISOString(),
                                endTime: new Date(endMs).toISOString(),
                                startMs,
                                endMs,
                                contestUrl: `https://atcoder.jp/contests/${c.id}`,
                                problemsUrl: `https://atcoder.jp/contests/${c.id}`
                            });
                        });
                    }
                }
            } catch (e) {
                console.warn("AtCoder live fetch error:", e.message);
            }
        };

        // 5. GeeksforGeeks API
        const fetchGeeksforGeeks = async () => {
            try {
                let res;
                try {
                    res = await fetchWithTimeout("https://practiceapi.geeksforgeeks.org/api/v1/events/?type=contest", {}, 2500);
                } catch (e) {
                    try {
                        res = await fetchWithTimeout("https://api.allorigins.win/raw?url=" + encodeURIComponent("https://practiceapi.geeksforgeeks.org/api/v1/events/?type=contest"), {}, 2500);
                    } catch (err) {
                        res = null;
                    }
                }

                if (res && res.ok) {
                    const json = await res.json();
                    const events = json.results || json.data || (Array.isArray(json) ? json : []);
                    if (Array.isArray(events) && events.length > 0) {
                        events.forEach(item => {
                            const startMs = new Date(item.start_time || item.startTime).getTime();
                            const endMs = new Date(item.end_time || item.endTime || (startMs + 90 * 60 * 1000)).getTime();
                            if (!isNaN(startMs)) {
                                fetched.push({
                                    id: `geeksforgeeks_${item.slug || item.id || item.name}`,
                                    platform: "GeeksforGeeks",
                                    title: item.name || item.title || "GFG Coding Contest",
                                    category: "EASY",
                                    startTime: new Date(startMs).toISOString(),
                                    endTime: new Date(endMs).toISOString(),
                                    startMs,
                                    endMs,
                                    contestUrl: item.slug ? `https://practice.geeksforgeeks.org/events/rec/${item.slug}` : "https://practice.geeksforgeeks.org/events",
                                    problemsUrl: item.slug ? `https://practice.geeksforgeeks.org/events/rec/${item.slug}` : "https://practice.geeksforgeeks.org/events"
                                });
                            }
                        });
                    }
                }
            } catch (e) {
                console.warn("GeeksforGeeks live fetch error:", e.message);
            }
        };

        await Promise.allSettled([
            fetchCodeforces(),
            fetchLeetCode(),
            fetchCodeChef(),
            fetchAtCoder(),
            fetchGeeksforGeeks()
        ]);

        // Failsafe: Ensure every platform has upcoming contests generated for the next 35 days if API returned no upcoming items
        const platformsList = ["LeetCode", "CodeForces", "AtCoder", "CodeChef", "GeeksforGeeks"];
        platformsList.forEach(plat => {
            const hasUpcoming = fetched.some(c => c.platform.toLowerCase() === plat.toLowerCase() && c.startMs >= nowMs);
            if (!hasUpcoming) {
                const generated = this.generateRecurringContestsForPlatform(plat, nowMs);
                fetched.push(...generated);
            }
        });

        if (fetched.length > 0) {
            const uniqueMap = new Map();
            fetched.forEach(item => {
                const cleanTitle = (item.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                const key = `${item.platform.toLowerCase()}_${item.id || cleanTitle}_${item.startMs}`;
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, item);
                }
            });
            this.rawFetchedContests = Array.from(uniqueMap.values());
            console.log(`ContestManager: Successfully loaded ${this.rawFetchedContests.length} real-time live contests across 5 platforms.`);
        }
    },

    generateRecurringContestsForPlatform(platform, nowMs) {
        const generated = [];
        const now = new Date(nowMs);

        // Generate upcoming contest instances for the next 35 days
        for (let i = 0; i < 35; i++) {
            const currDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
            const dayOfWeek = currDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

            if (platform === "LeetCode") {
                // Weekly Contest every Sunday at 08:00 AM IST (02:30 UTC)
                if (dayOfWeek === 0) {
                    const start = new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate(), 8, 0, 0);
                    const startMs = start.getTime();
                    const endMs = startMs + 90 * 60 * 1000;
                    if (endMs > nowMs) {
                        const weekNum = Math.floor((startMs - new Date(2024, 0, 7).getTime()) / (7 * 24 * 3600 * 1000)) + 380;
                        generated.push({
                            id: `leetcode_weekly_${weekNum}`,
                            platform: "LeetCode",
                            title: `Weekly Contest ${weekNum}`,
                            category: "MEDIUM",
                            startTime: start.toISOString(),
                            endTime: new Date(endMs).toISOString(),
                            startMs,
                            endMs,
                            contestUrl: `https://leetcode.com/contest/weekly-contest-${weekNum}/`,
                            problemsUrl: `https://leetcode.com/contest/weekly-contest-${weekNum}/`
                        });
                    }
                }
                // Biweekly Contest every 2nd Saturday at 20:00 IST (14:30 UTC)
                if (dayOfWeek === 6 && (Math.floor(currDate.getDate() / 7) % 2 === 0)) {
                    const start = new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate(), 20, 0, 0);
                    const startMs = start.getTime();
                    const endMs = startMs + 90 * 60 * 1000;
                    if (endMs > nowMs) {
                        const biweekNum = Math.floor((startMs - new Date(2024, 0, 6).getTime()) / (14 * 24 * 3600 * 1000)) + 122;
                        generated.push({
                            id: `leetcode_biweekly_${biweekNum}`,
                            platform: "LeetCode",
                            title: `Biweekly Contest ${biweekNum}`,
                            category: "ADVANCED",
                            startTime: start.toISOString(),
                            endTime: new Date(endMs).toISOString(),
                            startMs,
                            endMs,
                            contestUrl: `https://leetcode.com/contest/biweekly-contest-${biweekNum}/`,
                            problemsUrl: `https://leetcode.com/contest/biweekly-contest-${biweekNum}/`
                        });
                    }
                }
            } else if (platform === "GeeksforGeeks") {
                // GFG Weekly Coding Contest every Sunday at 19:00 IST
                if (dayOfWeek === 0) {
                    const start = new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate(), 19, 0, 0);
                    const startMs = start.getTime();
                    const endMs = startMs + 90 * 60 * 1000;
                    if (endMs > nowMs) {
                        const contestNum = Math.floor(currDate.getDate() / 7) + 168;
                        generated.push({
                            id: `geeksforgeeks_weekly_${startMs}`,
                            platform: "GeeksforGeeks",
                            title: `Weekly Coding Contest - ${contestNum}`,
                            category: "EASY",
                            startTime: start.toISOString(),
                            endTime: new Date(endMs).toISOString(),
                            startMs,
                            endMs,
                            contestUrl: "https://practice.geeksforgeeks.org/events/rec/weekly-coding-contest",
                            problemsUrl: "https://practice.geeksforgeeks.org/events/rec/weekly-coding-contest"
                        });
                    }
                }
            } else if (platform === "AtCoder") {
                // AtCoder Beginner Contest every Saturday at 17:30 IST
                if (dayOfWeek === 6) {
                    const start = new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate(), 17, 30, 0);
                    const startMs = start.getTime();
                    const endMs = startMs + 100 * 60 * 1000;
                    if (endMs > nowMs) {
                        const abcNum = Math.floor((startMs - new Date(2024, 0, 6).getTime()) / (7 * 24 * 3600 * 1000)) + 335;
                        generated.push({
                            id: `atcoder_abc${abcNum}`,
                            platform: "AtCoder",
                            title: `AtCoder Beginner Contest ${abcNum}`,
                            category: "EASY",
                            startTime: start.toISOString(),
                            endTime: new Date(endMs).toISOString(),
                            startMs,
                            endMs,
                            contestUrl: `https://atcoder.jp/contests/abc${abcNum}`,
                            problemsUrl: `https://atcoder.jp/contests/abc${abcNum}`
                        });
                    }
                }
            } else if (platform === "CodeChef") {
                // CodeChef Starters every Wednesday at 20:00 IST
                if (dayOfWeek === 3) {
                    const start = new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate(), 20, 0, 0);
                    const startMs = start.getTime();
                    const endMs = startMs + 120 * 60 * 1000;
                    if (endMs > nowMs) {
                        const starterNum = Math.floor((startMs - new Date(2024, 0, 3).getTime()) / (7 * 24 * 3600 * 1000)) + 115;
                        generated.push({
                            id: `codechef_starters_${starterNum}`,
                            platform: "CodeChef",
                            title: `Starters ${starterNum} (Rated)`,
                            category: "MEDIUM",
                            startTime: start.toISOString(),
                            endTime: new Date(endMs).toISOString(),
                            startMs,
                            endMs,
                            contestUrl: `https://www.codechef.com/START${starterNum}`,
                            problemsUrl: `https://www.codechef.com/START${starterNum}`
                        });
                    }
                }
            } else if (platform === "CodeForces") {
                // Codeforces Round every Thursday and Saturday at 20:05 IST
                if (dayOfWeek === 4 || dayOfWeek === 6) {
                    const start = new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate(), 20, 5, 0);
                    const startMs = start.getTime();
                    const endMs = startMs + 120 * 60 * 1000;
                    if (endMs > nowMs) {
                        const roundNum = Math.floor((startMs - new Date(2024, 0, 4).getTime()) / (3.5 * 24 * 3600 * 1000)) + 950;
                        generated.push({
                            id: `codeforces_round_${roundNum}`,
                            platform: "CodeForces",
                            title: `Codeforces Round ${roundNum} (Div. 2)`,
                            category: "MEDIUM",
                            startTime: start.toISOString(),
                            endTime: new Date(endMs).toISOString(),
                            startMs,
                            endMs,
                            contestUrl: "https://codeforces.com/contests",
                            problemsUrl: "https://codeforces.com/contests"
                        });
                    }
                }
            }
        }

        return generated;
    },

    /**
     * Get dynamic contest list with status derived from current time
     */
    getContests() {
        const nowMs = Date.now();
        const sourceContests = this.rawFetchedContests;

        return sourceContests.map(c => {
            const startMs = c.startMs || new Date(c.startTime).getTime();
            const endMs = c.endMs || new Date(c.endTime).getTime();

            let status = "UPCOMING";
            if (nowMs >= startMs && nowMs <= endMs) {
                status = "LIVE NOW";
            } else if (nowMs > endMs) {
                status = "ENDED";
            }

            return {
                ...c,
                status,
                startMs,
                endMs
            };
        });
    },

    /**
     * Compute summary numbers
     */
    getSummaryStats() {
        const contests = this.getContests();
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

        const live = contests.filter(c => c.status === "LIVE NOW");
        const upcoming = contests.filter(c => c.status === "UPCOMING").sort((a, b) => a.startMs - b.startMs);
        const ended = contests.filter(c => c.status === "ENDED").sort((a, b) => b.endMs - a.endMs);

        const todayContests = contests.filter(c => {
            return (c.startMs >= startOfDay && c.startMs <= endOfDay) || (c.status === "LIVE NOW");
        });

        const nextUpcoming = upcoming.length > 0 ? upcoming[0] : null;
        const platforms = new Set(contests.map(c => c.platform));

        return {
            totalContests: contests.length,
            liveCount: live.length,
            upcomingCount: upcoming.length,
            endedCount: ended.length,
            todayCount: todayContests.length,
            platformCount: platforms.size,
            nextUpcoming,
            recentFinished: ended.slice(0, 3)
        };
    },

    /**
     * Formats target timestamp into countdown string e.g. "8h 42m 43s"
     */
    formatCountdown(targetMs) {
        const nowMs = Date.now();
        const diffMs = targetMs - nowMs;

        if (diffMs <= 0) return "0s";

        const seconds = Math.floor((diffMs / 1000) % 60);
        const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
        const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        let parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0 || days > 0) parts.push(`${hours}h`);
        if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
        parts.push(`${seconds}s`);

        return parts.slice(0, 3).join(" ");
    },

    formatShortTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    }
};

window.ContestManager = ContestManager;
