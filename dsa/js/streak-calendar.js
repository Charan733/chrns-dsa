/**
 * Full-Year Month-Wise Streak Calendar Component for CHRNS-DSA
 * Renders complete 12-month activity separated into individual month cards.
 * Positioned below the Upcoming Rounds section.
 */

const StreakCalendar = {
    init() {
        this.render();
    },

    render() {
        const container = document.getElementById("streak-calendar-grid");
        if (!container) return;

        const currentYear = new Date().getFullYear();
        const user = StorageManager.getCurrentUser();

        // Update Header Stats
        const yearBadge = document.getElementById("streak-year-badge");
        const currentStreakVal = document.getElementById("yearly-current-streak-val");
        const longestStreakVal = document.getElementById("yearly-longest-streak-val");
        const activeDaysVal = document.getElementById("yearly-active-days-val");

        if (yearBadge) yearBadge.textContent = currentYear;
        if (currentStreakVal) currentStreakVal.textContent = `${user ? user.currentStreak || 0 : 0} Days`;
        if (longestStreakVal) longestStreakVal.textContent = `${user ? user.longestStreak || 0 : 0} Days`;

        const todayIso = new Date().toISOString().split("T")[0];
        const monthShortNames = [
            "JAN", "FEB", "MAR", "APR",
            "MAY", "JUN", "JUL", "AUG",
            "SEP", "OCT", "NOV", "DEC"
        ];

        let totalActiveDays = 0;
        let html = '<div class="streak-months-row">';

        // Loop through all 12 months in ONE horizontal row
        for (let m = 0; m < 12; m++) {
            const firstDayObj = new Date(currentYear, m, 1);
            const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
            
            // Standardize Mon = 0, Tue = 1, Wed = 2, Thu = 3, Fri = 4, Sat = 5, Sun = 6
            const startDay = (firstDayObj.getDay() + 6) % 7;

            const isLastMonth = (m === 11);
            const dividerClass = isLastMonth ? '' : ' month-block-divider';

            html += `<div class="month-block${dividerClass}">`;
            html += `<div class="month-block-title">${monthShortNames[m]}</div>`;
            
            // Weekday Headers (M T W T F S S)
            html += `<div class="month-weekdays-row">`;
            html += `<span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>`;
            html += `</div>`;

            html += `<div class="month-cells-grid">`;

            // 1. Leading empty cells before the 1st of the month
            for (let i = 0; i < startDay; i++) {
                html += `<div class="month-cell empty-placeholder"></div>`;
            }

            // 2. Day cells for this month
            for (let d = 1; d <= daysInMonth; d++) {
                const monthStr = String(m + 1).padStart(2, "0");
                const dayStr = String(d).padStart(2, "0");
                const dateKey = `${currentYear}-${monthStr}-${dayStr}`;

                const count = this.getDailyProblemCount(user, dateKey);
                if (count > 0) totalActiveDays++;

                const level = this.getStreakLevel(count);
                const isToday = (dateKey === todayIso);
                const todayClass = isToday ? ' is-today' : '';

                const dateObj = new Date(currentYear, m, d);
                const dateFormatted = dateObj.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                });

                const activityText = count === 0
                    ? "No activity"
                    : (count === 1 ? "1 problem completed" : `${count} problems completed`);

                const tooltipText = `${dateFormatted} — ${activityText}`;

                html += `<div class="month-cell streak-cell level-${level}${todayClass}"
                             data-date="${dateKey}"
                             data-count="${count}"
                             data-tooltip="${tooltipText}"
                             tabindex="0"
                             aria-label="${tooltipText}"></div>`;
            }

            // 3. Trailing empty cells to fill last row of grid
            const totalCellsSoFar = startDay + daysInMonth;
            const remainder = totalCellsSoFar % 7;
            if (remainder !== 0) {
                const trailingEmpty = 7 - remainder;
                for (let i = 0; i < trailingEmpty; i++) {
                    html += `<div class="month-cell empty-placeholder"></div>`;
                }
            }

            html += `</div>`; // end month-cells-grid
            html += `</div>`; // end month-block
        }

        html += '</div>'; // end streak-months-row

        if (activeDaysVal) activeDaysVal.textContent = totalActiveDays;

        container.innerHTML = html;

        this.bindTooltipEvents(container);
    },

    getDailyProblemCount(user, dateStr) {
        if (!user) return 0;
        let count = 0;

        if (user.completionDates && user.completionDates[dateStr] !== undefined) {
            const val = user.completionDates[dateStr];
            if (typeof val === "number") {
                count = val;
            } else if (val) {
                count = 1;
            }
        }

        if (user.activity && Array.isArray(user.activity)) {
            const actCount = user.activity.filter(a => {
                return (a.type === "PROBLEM_COMPLETED" || a.type === "PROBLEM_SOLVED") && 
                        a.timestamp && 
                        a.timestamp.split("T")[0] === dateStr;
            }).length;
            count = Math.max(count, actCount);
        }

        return count;
    },

    getStreakLevel(count) {
        if (count <= 0) return 0;
        if (count === 1) return 1;
        if (count <= 3) return 2;
        if (count <= 5) return 3;
        return 4;
    },

    bindTooltipEvents(container) {
        let tooltipEl = document.getElementById("streak-global-tooltip");
        if (!tooltipEl) {
            tooltipEl = document.createElement("div");
            tooltipEl.id = "streak-global-tooltip";
            tooltipEl.className = "streak-tooltip";
            document.body.appendChild(tooltipEl);
        }

        container.querySelectorAll(".month-cell[data-tooltip]").forEach(cell => {
            cell.addEventListener("mouseenter", (e) => {
                tooltipEl.textContent = cell.getAttribute("data-tooltip");
                tooltipEl.classList.add("visible");
                this.positionTooltip(e, tooltipEl);
            });

            cell.addEventListener("mousemove", (e) => {
                this.positionTooltip(e, tooltipEl);
            });

            cell.addEventListener("mouseleave", () => {
                tooltipEl.classList.remove("visible");
            });

            cell.addEventListener("focus", (e) => {
                tooltipEl.textContent = cell.getAttribute("data-tooltip");
                tooltipEl.classList.add("visible");
                this.positionTooltip(e, tooltipEl);
            });

            cell.addEventListener("blur", () => {
                tooltipEl.classList.remove("visible");
            });
        });
    },

    positionTooltip(e, tooltipEl) {
        const rect = e.target.getBoundingClientRect();
        const tooltipRect = tooltipEl.getBoundingClientRect();
        
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        let top = rect.top - tooltipRect.height - 8;

        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }

        if (top < 10) {
            top = rect.bottom + 8;
        }

        tooltipEl.style.left = `${left}px`;
        tooltipEl.style.top = `${top}px`;
    }
};

window.StreakCalendar = StreakCalendar;
