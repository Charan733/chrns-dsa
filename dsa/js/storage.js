/**
 * Storage Manager for DSA Practice Tracker
 * Handles multi-user LocalStorage isolation, Web Crypto SHA-256 password hashing,
 * and user progress persistence.
 */

const StorageManager = {
    STORAGE_KEY_USERS: "dsa_tracker_users_v1",
    STORAGE_KEY_CURRENT_USER: "dsa_tracker_current_user_id_v1",

    // Password Hashing via Web Crypto API (SHA-256)
    async hashPassword(password) {
        if (!window.crypto || !window.crypto.subtle) {
            // Fallback for non-secure contexts if any
            return btoa(password);
        }
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    },

    getUsers() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY_USERS);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("Failed to load users from localStorage:", e);
            return [];
        }
    },

    saveUsers(users) {
        try {
            localStorage.setItem(this.STORAGE_KEY_USERS, JSON.stringify(users));
        } catch (e) {
            console.error("Failed to save users to localStorage:", e);
        }
    },

    getCurrentUserId() {
        return localStorage.getItem(this.STORAGE_KEY_CURRENT_USER);
    },

    setCurrentUserId(userId) {
        if (userId) {
            localStorage.setItem(this.STORAGE_KEY_CURRENT_USER, userId);
        } else {
            localStorage.removeItem(this.STORAGE_KEY_CURRENT_USER);
        }
    },

    getCurrentUser() {
        const userId = this.getCurrentUserId();
        if (!userId) return null;
        const users = this.getUsers();
        return users.find(u => u.id === userId) || null;
    },

    saveCurrentUser(updatedUser) {
        const users = this.getUsers();
        const idx = users.findIndex(u => u.id === updatedUser.id);
        if (idx !== -1) {
            users[idx] = updatedUser;
            this.saveUsers(users);
        }
    },

    async registerUser(username, password) {
        const cleanName = username.trim();
        if (!cleanName) {
            throw new Error("Username cannot be empty.");
        }
        if (!password || password.length < 3) {
            throw new Error("Password must be at least 3 characters long.");
        }

        const users = this.getUsers();
        const existing = users.find(u => u.username.toLowerCase() === cleanName.toLowerCase());
        if (existing) {
            throw new Error("Username already taken. Please choose another.");
        }

        const hash = await this.hashPassword(password);
        const newUser = {
            id: "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
            username: cleanName,
            passwordHash: hash,
            createdAt: new Date().toISOString(),
            completedProblems: [],
            favorites: [],
            notes: {},
            completionDates: {},
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: null,
            activity: [
                {
                    type: "ACCOUNT_CREATED",
                    description: "Account created",
                    timestamp: new Date().toISOString()
                }
            ],
            settings: {
                theme: "dark"
            }
        };

        users.push(newUser);
        this.saveUsers(users);
        this.setCurrentUserId(newUser.id);
        return newUser;
    },

    async loginUser(username, password) {
        const cleanName = username.trim();
        if (!cleanName || !password) {
            throw new Error("Please enter both username and password.");
        }

        const users = this.getUsers();
        const user = users.find(u => u.username.toLowerCase() === cleanName.toLowerCase());
        if (!user) {
            throw new Error("User not found. Please sign up first.");
        }

        const hash = await this.hashPassword(password);
        if (user.passwordHash !== hash) {
            throw new Error("Incorrect password.");
        }

        this.setCurrentUserId(user.id);
        return user;
    },

    logout() {
        this.setCurrentUserId(null);
    },

    exportUserData() {
        const user = this.getCurrentUser();
        if (!user) throw new Error("No active user session.");
        
        const exportData = {
            version: "1.0",
            exportedAt: new Date().toISOString(),
            userData: {
                username: user.username,
                completedProblems: user.completedProblems || [],
                favorites: user.favorites || [],
                notes: user.notes || {},
                completionDates: user.completionDates || {},
                currentStreak: user.currentStreak || 0,
                longestStreak: user.longestStreak || 0,
                lastActiveDate: user.lastActiveDate || null,
                activity: user.activity || [],
                settings: user.settings || {}
            }
        };
        return JSON.stringify(exportData, null, 2);
    },

    importUserData(jsonString) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) throw new Error("No active user session.");

        let parsed;
        try {
            parsed = JSON.parse(jsonString);
        } catch (e) {
            throw new Error("Invalid JSON backup file.");
        }

        if (!parsed || !parsed.userData) {
            throw new Error("Unrecognized backup format.");
        }

        const d = parsed.userData;
        currentUser.completedProblems = Array.isArray(d.completedProblems) ? d.completedProblems : [];
        currentUser.favorites = Array.isArray(d.favorites) ? d.favorites : [];
        currentUser.notes = typeof d.notes === "object" ? d.notes : {};
        currentUser.completionDates = typeof d.completionDates === "object" ? d.completionDates : {};
        currentUser.currentStreak = typeof d.currentStreak === "number" ? d.currentStreak : 0;
        currentUser.longestStreak = typeof d.longestStreak === "number" ? d.longestStreak : 0;
        currentUser.lastActiveDate = d.lastActiveDate || null;
        currentUser.activity = Array.isArray(d.activity) ? d.activity : [];

        this.saveCurrentUser(currentUser);
        return currentUser;
    },

    resetCurrentUserData() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return null;

        currentUser.completedProblems = [];
        currentUser.favorites = [];
        currentUser.notes = {};
        currentUser.completionDates = {};
        currentUser.currentStreak = 0;
        currentUser.longestStreak = 0;
        currentUser.lastActiveDate = null;
        currentUser.activity = [
            {
                type: "DATA_RESET",
                description: "Progress reset",
                timestamp: new Date().toISOString()
            }
        ];

        this.saveCurrentUser(currentUser);
        return currentUser;
    }
};

window.StorageManager = StorageManager;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
