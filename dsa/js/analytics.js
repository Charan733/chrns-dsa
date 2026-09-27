/**
 * Analytics & Streak Engine for DSA Practice Tracker
 */

const AnalyticsEngine = {
    // Check if two ISO date strings belong to the same calendar day (YYYY-MM-DD)
    isSameDay(d1, d2) {
        if (!d1 || !d2) return false;
        const date1 = new Date(d1);
        const date2 = new Date(d2);
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    },

    // Check if d2 is yesterday relative to d1
    isYesterday(todayDate, testDate) {
        const t = new Date(todayDate);
        t.setDate(t.getDate() - 1);
        return this.isSameDay(t.toISOString(), testDate);
    },

    // Update practice streak when a problem is completed
    updateStreakOnCompletion(user) {
        const nowIso = new Date().toISOString();
        const todayStr = nowIso.split("T")[0];

        if (!user.completionDates) user.completionDates = {};
        if (!user.lastActiveDate) {
            user.currentStreak = 1;
            user.longestStreak = 1;
            user.lastActiveDate = nowIso;
        } else {
            const lastStr = user.lastActiveDate.split("T")[0];
            if (todayStr === lastStr) {
                // Same day completion — streak remains unchanged
            } else if (this.isYesterday(nowIso, user.lastActiveDate)) {
                // Consecutive day!
                user.currentStreak += 1;
                if (user.currentStreak > user.longestStreak) {
                    user.longestStreak = user.currentStreak;
                }
                user.lastActiveDate = nowIso;
            } else {
                // Missed one or more days — reset current streak to 1
                user.currentStreak = 1;
                user.lastActiveDate = nowIso;
            }
        }
        return user;
    },

    // Calculate progress stats
    calculateStats(user, problems) {
        const total = problems.length;
        const completedSet = new Set(user ? user.completedProblems || [] : []);
        const completed = completedSet.size;
        const remaining = total - completed;
        const percentage = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;

        // Topic breakdown
        const topicStats = {};
        // Platform breakdown
        const platformStats = {};
        // Difficulty breakdown
        const difficultyStats = {
            Easy: { total: 0, completed: 0 },
            Medium: { total: 0, completed: 0 },
            Hard: { total: 0, completed: 0 }
        };

        problems.forEach(p => {
            // Topic
            const t = p.topic || "General";
            if (!topicStats[t]) {
                topicStats[t] = { total: 0, completed: 0, subtopics: {} };
            }
            topicStats[t].total += 1;
            if (completedSet.has(p.id)) {
                topicStats[t].completed += 1;
            }

            // Platform
            const pl = p.platform || "Other";
            if (!platformStats[pl]) {
                platformStats[pl] = { total: 0, completed: 0 };
            }
            platformStats[pl].total += 1;
            if (completedSet.has(p.id)) {
                platformStats[pl].completed += 1;
            }

            // Difficulty
            const diff = p.difficulty || "Medium";
            if (!difficultyStats[diff]) {
                difficultyStats[diff] = { total: 0, completed: 0 };
            }
            difficultyStats[diff].total += 1;
            if (completedSet.has(p.id)) {
                difficultyStats[diff].completed += 1;
            }
        });

        // Compute percentages
        Object.keys(topicStats).forEach(t => {
            const st = topicStats[t];
            st.percentage = st.total > 0 ? Math.round((st.completed / st.total) * 100) : 0;
        });

        Object.keys(platformStats).forEach(pl => {
            const sp = platformStats[pl];
            sp.percentage = sp.total > 0 ? Math.round((sp.completed / sp.total) * 100) : 0;
        });

        Object.keys(difficultyStats).forEach(d => {
            const sd = difficultyStats[d];
            sd.percentage = sd.total > 0 ? Math.round((sd.completed / sd.total) * 100) : 0;
        });

        return {
            total,
            completed,
            remaining,
            percentage,
            currentStreak: user ? user.currentStreak || 0 : 0,
            longestStreak: user ? user.longestStreak || 0 : 0,
            topicStats,
            platformStats,
            difficultyStats
        };
    },

    logActivity(user, type, description) {
        if (!user.activity) user.activity = [];
        user.activity.unshift({
            type,
            description,
            timestamp: new Date().toISOString()
        });
        // Limit activity log to latest 50 entries
        if (user.activity.length > 50) {
            user.activity = user.activity.slice(0, 50);
        }
    }
};

window.AnalyticsEngine = AnalyticsEngine;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalyticsEngine;
}
