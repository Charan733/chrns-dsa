/**
 * Auth Manager for DSA Practice Tracker
 * Handles Login/Signup modals, input validation, and user session management.
 */

const AuthManager = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const loginBtn = document.getElementById("nav-login-btn");
        const profileBtn = document.getElementById("nav-profile-btn");
        const modalOverlay = document.getElementById("auth-modal-overlay");
        const closeModalBtn = document.getElementById("close-auth-modal");
        const authForm = document.getElementById("auth-form");
        const authSwitchLink = document.getElementById("auth-switch-link");
        const logoutBtn = document.getElementById("nav-logout-btn");

        if (loginBtn) {
            loginBtn.addEventListener("click", () => this.openModal("login"));
        }

        if (profileBtn) {
            profileBtn.addEventListener("click", () => {
                const modal = document.getElementById("settings-modal-overlay");
                if (modal) modal.classList.add("active");
            });
        }

        if (closeModalBtn && modalOverlay) {
            closeModalBtn.addEventListener("click", () => this.closeModal());
            modalOverlay.addEventListener("click", (e) => {
                if (e.target === modalOverlay) this.closeModal();
            });
        }

        if (authSwitchLink) {
            authSwitchLink.addEventListener("click", () => {
                const currentMode = authForm.dataset.mode || "login";
                this.switchMode(currentMode === "login" ? "signup" : "login");
            });
        }

        if (authForm) {
            authForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                await this.handleSubmit();
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener("click", () => {
                StorageManager.logout();
                window.location.href = "../index.html";
            });
        }
    },

    openModal(mode = "login") {
        const overlay = document.getElementById("auth-modal-overlay");
        if (!overlay) return;
        this.switchMode(mode);
        this.clearError();
        overlay.classList.add("active");
    },

    closeModal() {
        const overlay = document.getElementById("auth-modal-overlay");
        if (overlay) overlay.classList.remove("active");
        this.clearError();
    },

    switchMode(mode) {
        const form = document.getElementById("auth-form");
        const title = document.getElementById("auth-modal-title");
        const submitBtn = document.getElementById("auth-submit-btn");
        const switchText = document.getElementById("auth-switch-prompt");
        const switchLink = document.getElementById("auth-switch-link");
        const confirmGroup = document.getElementById("auth-confirm-group");

        if (!form) return;
        form.dataset.mode = mode;
        this.clearError();

        if (mode === "signup") {
            title.textContent = "Create Account";
            submitBtn.textContent = "Create Account";
            switchText.textContent = "Already have an account?";
            switchLink.textContent = "Log In";
            if (confirmGroup) confirmGroup.style.display = "block";
        } else {
            title.textContent = "Welcome Back";
            submitBtn.textContent = "Log In";
            switchText.textContent = "Don't have an account?";
            switchLink.textContent = "Sign Up";
            if (confirmGroup) confirmGroup.style.display = "none";
        }
    },

    showError(msg) {
        const err = document.getElementById("auth-error-msg");
        if (err) {
            err.textContent = msg;
            err.classList.add("active");
        }
    },

    clearError() {
        const err = document.getElementById("auth-error-msg");
        if (err) {
            err.textContent = "";
            err.classList.remove("active");
        }
    },

    async handleSubmit() {
        const form = document.getElementById("auth-form");
        const mode = form.dataset.mode || "login";
        const usernameInput = document.getElementById("auth-username");
        const passwordInput = document.getElementById("auth-password");
        const confirmInput = document.getElementById("auth-confirm-password");

        const username = usernameInput ? usernameInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";
        const confirmPass = confirmInput ? confirmInput.value : "";

        this.clearError();

        try {
            if (mode === "signup") {
                if (!username) throw new Error("Please enter a username.");
                if (!password || password.length < 3) throw new Error("Password must be at least 3 characters.");
                if (password !== confirmPass) throw new Error("Passwords do not match.");

                await StorageManager.registerUser(username, password);
                if (window.UIManager) {
                    window.UIManager.showToast(`Account created for ${username}!`);
                }
            } else {
                if (!username || !password) throw new Error("Please enter username and password.");

                await StorageManager.loginUser(username, password);
                if (window.UIManager) {
                    window.UIManager.showToast(`Welcome back, ${username}!`);
                }
            }

            this.closeModal();
            if (usernameInput) usernameInput.value = "";
            if (passwordInput) passwordInput.value = "";
            if (confirmInput) confirmInput.value = "";

            if (window.UIManager) {
                window.UIManager.renderApp();
            }
        } catch (err) {
            this.showError(err.message);
        }
    }
};

window.AuthManager = AuthManager;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
