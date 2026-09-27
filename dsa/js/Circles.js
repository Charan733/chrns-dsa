/**
 * Circles.js - Rotating Orbital Rings Component (19 DSA Topics)
 * Renders 19 DSA topic icons across 3 concentric rotating orbital rings.
 * Clicking any topic redirects directly to its official GeeksforGeeks page.
 */

(function () {
    'use strict';

    const dsaTopics = [
        // Outer Ring (9 items)
        {
            ring: 'outer',
            name: 'Arrays',
            url: 'https://www.geeksforgeeks.org/array-data-structure/',
            pos: { top: '0%', left: '50%' },
            color: '#00f0ff',
            glow: 'rgba(0, 240, 255, 0.4)',
            svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`
        },
        {
            ring: 'outer',
            name: 'Strings',
            url: 'https://www.geeksforgeeks.org/string-data-structure/',
            pos: { top: '11.7%', left: '82.1%' },
            color: '#10b981',
            glow: 'rgba(16, 185, 129, 0.4)',
            svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>`
        },
        {
            ring: 'outer',
            name: 'Linked List',
            url: 'https://www.geeksforgeeks.org/data-structures/linked-list/',
            pos: { top: '41.3%', left: '99.2%' },
            color: '#ff6b00',
            glow: 'rgba(255, 107, 0, 0.4)',
            svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="3"/><circle cx="18" cy="12" r="3"/><path d="M9 12h6"/><path d="m12 9 3 3-3 3"/></svg>`
        },
        {
            ring: 'outer',
            name: 'Stack',
            url: 'https://www.geeksforgeeks.org/stack-data-structure/',
            pos: { top: '75%', left: '93.3%' },
            color: '#a855f7',
            glow: 'rgba(168, 85, 247, 0.4)',
            svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19h16"/><path d="M4 14h16"/><path d="M4 9h16"/><path d="M4 4h16"/></svg>`
        },
        {
            ring: 'outer',
            name: 'Queue',
            url: 'https://www.geeksforgeeks.org/queue-data-structure/',
            pos: { top: '97.0%', left: '67.1%' },
            color: '#3b82f6',
            glow: 'rgba(59, 130, 246, 0.4)',
            svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="8" rx="2"/><path d="M8 8v8"/><path d="M13 8v8"/><path d="m18 12 3-3-3-3"/></svg>`
        },
        {
            ring: 'outer',
            name: 'Recursion',
            url: 'https://www.geeksforgeeks.org/recursion/',
            pos: { top: '97.0%', left: '32.9%' },
            color: '#ec4899',
            glow: 'rgba(236, 72, 153, 0.4)',
            svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>`
        },
        {
            ring: 'outer',
            name: 'Sorting',
            url: 'https://www.geeksforgeeks.org/sorting-algorithms/',
            pos: { top: '75%', left: '6.7%' },
            color: '#f43f5e',
            glow: 'rgba(244, 63, 94, 0.4)',
            svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18h4v-5H4v5z"/><path d="M10 18h4V10h-4v8z"/><path d="M16 18h4V5h-4v13z"/></svg>`
        },
        {
            ring: 'outer',
            name: 'Binary Search',
            url: 'https://www.geeksforgeeks.org/binary-search/',
            pos: { top: '41.3%', left: '0.8%' },
            color: '#06b6d4',
            glow: 'rgba(6, 182, 212, 0.4)',
            svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/></svg>`
        },
        {
            ring: 'outer',
            name: 'Bit Manipulation',
            url: 'https://www.geeksforgeeks.org/bits-number-theory-data-structures/',
            pos: { top: '11.7%', left: '17.9%' },
            color: '#22c55e',
            glow: 'rgba(34, 197, 94, 0.4)',
            svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="none"><text x="2" y="15" font-size="11" font-weight="800" fill="currentColor">01</text></svg>`
        },

        // Middle Ring (6 items)
        {
            ring: 'middle',
            name: 'Greedy',
            url: 'https://www.geeksforgeeks.org/greedy-algorithms/',
            pos: { top: '0%', left: '50%' },
            color: '#ef4444',
            glow: 'rgba(239, 68, 68, 0.4)',
            svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>`
        },
        {
            ring: 'middle',
            name: 'Sliding Window',
            url: 'https://www.geeksforgeeks.org/window-sliding-technique/',
            pos: { top: '25%', left: '93.3%' },
            color: '#059669',
            glow: 'rgba(5, 150, 105, 0.4)',
            svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v14"/><path d="M16 5v14"/><path d="M4 12h16"/></svg>`
        },
        {
            ring: 'middle',
            name: 'Two Pointer',
            url: 'https://www.geeksforgeeks.org/two-pointers-technique/',
            pos: { top: '75%', left: '93.3%' },
            color: '#00e5ff',
            glow: 'rgba(0, 229, 255, 0.4)',
            svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16V8l-4 4 4 4z" fill="currentColor"/><path d="M17 8v8l4-4-4-4z" fill="currentColor"/><path d="M7 12h10"/></svg>`
        },
        {
            ring: 'middle',
            name: 'Heaps',
            url: 'https://www.geeksforgeeks.org/heap-data-structure/',
            pos: { top: '100%', left: '50%' },
            color: '#9333ea',
            glow: 'rgba(147, 51, 234, 0.4)',
            svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3L2 21h20L12 3z"/><line x1="12" y1="9" x2="12" y2="15"/></svg>`
        },
        {
            ring: 'middle',
            name: 'Trees',
            url: 'https://www.geeksforgeeks.org/tree-data-structure/',
            pos: { top: '75%', left: '6.7%' },
            color: '#eab308',
            glow: 'rgba(234, 179, 8, 0.4)',
            svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><circle cx="6" cy="19" r="3"/><circle cx="18" cy="19" r="3"/><line x1="10" y1="7.5" x2="7.5" y2="16.5"/><line x1="14" y1="7.5" x2="16.5" y2="16.5"/></svg>`
        },
        {
            ring: 'middle',
            name: 'Graphs',
            url: 'https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/',
            pos: { top: '25%', left: '6.7%' },
            color: '#8b5cf6',
            glow: 'rgba(139, 92, 246, 0.4)',
            svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="6" r="3"/><circle cx="19" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><line x1="7.5" y1="7" x2="16.5" y2="7"/><line x1="6.5" y1="8.5" x2="10.5" y2="15.5"/><line x1="17.5" y1="8.5" x2="13.5" y2="15.5"/></svg>`
        },

        // Inner Ring (4 items)
        {
            ring: 'inner',
            name: 'Backtracking',
            url: 'https://www.geeksforgeeks.org/backtracking-algorithms/',
            pos: { top: '14.6%', left: '85.4%' },
            color: '#2563eb',
            glow: 'rgba(37, 99, 235, 0.4)',
            svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>`
        },
        {
            ring: 'inner',
            name: 'Dynamic Programming',
            url: 'https://www.geeksforgeeks.org/dynamic-programming/',
            pos: { top: '85.4%', left: '85.4%' },
            color: '#0284c7',
            glow: 'rgba(2, 132, 199, 0.4)',
            svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>`
        },
        {
            ring: 'inner',
            name: 'Tries',
            url: 'https://www.geeksforgeeks.org/trie-insert-and-search/',
            pos: { top: '85.4%', left: '14.6%' },
            color: '#84cc16',
            glow: 'rgba(132, 204, 22, 0.4)',
            svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="4" cy="20" r="2"/><circle cx="10" cy="20" r="2"/><line x1="10.5" y1="5.5" x2="7.5" y2="10.5"/><line x1="13.5" y1="5.5" x2="16.5" y2="10.5"/><line x1="5.5" y1="13.8" x2="4.5" y2="18.2"/><line x1="6.8" y1="13.8" x2="9.2" y2="18.2"/></svg>`
        },
        {
            ring: 'inner',
            name: 'Additional Practice',
            url: 'https://www.geeksforgeeks.org/dsa-tutorial-learn-data-structures-and-algorithms/',
            pos: { top: '14.6%', left: '14.6%' },
            color: '#f59e0b',
            glow: 'rgba(245, 158, 11, 0.4)',
            svg: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
        }
    ];

    function renderRingItems(ringType) {
        const ringItems = dsaTopics.filter(t => t.ring === ringType);
        return ringItems.map(item => `
            <div class="orbital-item"
                 style="top: ${item.pos.top}; left: ${item.pos.left}; margin-top: -22px; margin-left: -22px; --topic-color: ${item.color}; --topic-glow: ${item.glow}; color: ${item.color};"
                 data-topic="${item.name}"
                 data-url="${item.url}"
                 title="${item.name} — Click to open GeeksforGeeks tutorial"
                 aria-label="${item.name}"
                 role="button"
                 tabindex="0">
                ${item.svg}
                <div class="circles-topic-tooltip">${item.name}</div>
            </div>
        `).join('');
    }

    function initCirclesComponent() {
        const container = document.getElementById('circles-showcase-container');
        if (!container) return;

        // Render HTML structure with 19 DSA topics distributed across 3 rings
        container.innerHTML = `
            <!-- SVG Dashed Orbital Paths -->
            <svg class="circles-svg-paths" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <circle cx="300" cy="300" r="270" class="circles-path" />
                <circle cx="300" cy="300" r="185" class="circles-path" />
                <circle cx="300" cy="300" r="110" class="circles-path" />
            </svg>

            <!-- Central Core Orb -->
            <div class="circles-center-core" title="CHRNS-DSA Core" aria-label="CHRNS-DSA Core">
                <span class="circles-core-logo">&lt;/&gt;</span>
                <span class="circles-core-text">DSA</span>
            </div>

            <!-- Outer Ring (Radius 270px, 9 DSA Topics) -->
            <div class="orbital-ring ring-outer">
                ${renderRingItems('outer')}
            </div>

            <!-- Middle Ring (Radius 185px, 6 DSA Topics) -->
            <div class="orbital-ring ring-middle">
                ${renderRingItems('middle')}
            </div>

            <!-- Inner Ring (Radius 110px, 4 DSA Topics) -->
            <div class="orbital-ring ring-inner">
                ${renderRingItems('inner')}
            </div>
        `;

        // Bind Click Handlers for GeeksforGeeks navigation
        container.querySelectorAll('.orbital-item[data-url]').forEach(item => {
            const openUrl = () => {
                const url = item.getAttribute('data-url');
                if (url) {
                    window.open(url, '_blank', 'noopener,noreferrer');
                }
            };

            item.addEventListener('click', (e) => {
                e.preventDefault();
                openUrl();
            });

            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openUrl();
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCirclesComponent);
    } else {
        initCirclesComponent();
    }
})();
