/**
 * Search, Filtering, and Sorting Engine for DSA Practice Tracker
 */

const FilterEngine = {
    filterProblems(problems, user, options = {}) {
        const {
            searchQuery = "",
            platform = "All",
            difficulty = "All",
            status = "All",
            topic = "All",
            favoritesOnly = false,
            sortBy = "default"
        } = options;

        const q = searchQuery.trim().toLowerCase();
        const completedSet = new Set(user ? user.completedProblems || [] : []);
        const favoritesSet = new Set(user ? user.favorites || [] : []);

        const diffOrder = { "Easy": 1, "Medium": 2, "Hard": 3 };

        let filtered = problems.filter(p => {
            // Search query across title, topic, difficulty, platform
            if (q) {
                const matchTitle = p.title.toLowerCase().includes(q);
                const matchTopic = p.topic.toLowerCase().includes(q);
                const matchDiff = p.difficulty.toLowerCase().includes(q);
                const matchPlat = p.platform.toLowerCase().includes(q);
                if (!matchTitle && !matchTopic && !matchDiff && !matchPlat) {
                    return false;
                }
            }

            // Platform filter
            if (platform !== "All") {
                if (platform === "Other") {
                    if (["LeetCode", "GeeksforGeeks", "CodeChef", "HackerRank"].includes(p.platform)) {
                        return false;
                    }
                } else if (p.platform !== platform) {
                    return false;
                }
            }

            // Difficulty filter
            if (difficulty !== "All" && p.difficulty !== difficulty) {
                return false;
            }

            // Status filter
            if (status === "Completed" && !completedSet.has(p.id)) return false;
            if (status === "Incomplete" && completedSet.has(p.id)) return false;

            // Topic filter
            if (topic !== "All" && (p.a2zSection || p.topic) !== topic) return false;

            // Favorites filter
            if (favoritesOnly && !favoritesSet.has(p.id)) return false;

            return true;
        });

        // Sorting
        if (sortBy === "title-asc") {
            filtered.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sortBy === "title-desc") {
            filtered.sort((a, b) => b.title.localeCompare(a.title));
        } else if (sortBy === "difficulty-asc") {
            filtered.sort((a, b) => (diffOrder[a.difficulty] || 2) - (diffOrder[b.difficulty] || 2));
        } else if (sortBy === "difficulty-desc") {
            filtered.sort((a, b) => (diffOrder[b.difficulty] || 2) - (diffOrder[a.difficulty] || 2));
        } else if (sortBy === "completed-first") {
            filtered.sort((a, b) => (completedSet.has(b.id) ? 1 : 0) - (completedSet.has(a.id) ? 1 : 0));
        } else if (sortBy === "incomplete-first") {
            filtered.sort((a, b) => (completedSet.has(a.id) ? 1 : 0) - (completedSet.has(b.id) ? 1 : 0));
        } else {
            // Default: preserve original Excel ID order
            filtered.sort((a, b) => a.id - b.id);
        }

        return filtered;
    }
};

window.FilterEngine = FilterEngine;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FilterEngine;
}
