/**
 * Main Application Orchestrator for CHRNS-DSA & DSA Practice Tracker
 * Initializes dataset, auth, contest UI, POTD, global theme, and default initial view.
 */

document.addEventListener("DOMContentLoaded", () => {
    console.log("Initializing CHRNS-DSA Application...");

    // Validate dataset fidelity
    if (typeof PROBLEMS === "undefined" || !Array.isArray(PROBLEMS)) {
        console.error("CRITICAL ERROR: PROBLEMS dataset failed to load!");
        alert("CRITICAL ERROR: Problem database is missing.");
        return;
    }

    console.log(`Loaded master dataset with ${PROBLEMS.length} problems.`);

    // 1. Restore Auth & Session state
    AuthManager.init();

    // 2. Initialize Contest UI telemetry
    ContestUI.init();

    // 3. Initialize Problem of the Day (POTD)
    POTDManager.init();

    // 4. Initialize UI & restore global theme preference
    UIManager.init();

    // 5. Initialize Full-Year Streak Calendar
    if (typeof StreakCalendar !== "undefined") {
        StreakCalendar.init();
    }

    // 6. Force default initial route to Challenges / CHRNS-DSA Home Page
    UIManager.switchTab("challenges");

    console.log("CHRNS-DSA initialized successfully with default view: CHALLENGES.");
});
