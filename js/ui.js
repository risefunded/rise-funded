/* =========================================================
   RISE FUNDED — UI EFFECTS
========================================================= */

import { traderPayouts } from "./data.js";


/* ---------- REVEAL ON SCROLL ---------- */
export function initReveal() {
    const revealObserver = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("show");
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12 }
    );

    document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));
}


/* ---------- HERO PARALLAX ---------- */
export function initHeroParallax() {
    const heroVisual = document.querySelector(".hero-visual");
    if (!heroVisual) return;

    document.addEventListener("mousemove", event => {
        const x = (event.clientX / window.innerWidth) - 0.5;
        const y = (event.clientY / window.innerHeight) - 0.5;
        heroVisual.style.transform = `translate(${x * 8}px, ${y * 8}px)`;
    });
}


/* ---------- MOBILE MENU ---------- */
export function initMobileMenu() {
    const mobileMenu = document.getElementById("mobileMenu");
    const navLinks = document.querySelector(".nav-links");

    if (!mobileMenu || !navLinks) return;

    function toggleMenu() {
        navLinks.classList.toggle("nav-open");
    }

    function closeMenu() {
        navLinks.classList.remove("nav-open");
    }

    mobileMenu.addEventListener("click", toggleMenu);

    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (event) => {
        if (
            !navLinks.contains(event.target) &&
            !mobileMenu.contains(event.target)
        ) {
            closeMenu();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 950) closeMenu();
    });
}


/* ---------- TRADER PAYOUT CARDS ---------- */
export function renderTraderPayouts() {
    const container = document.getElementById("payoutShowcase");
    if (!container || typeof traderPayouts === "undefined") return;

    container.innerHTML = traderPayouts.map(t => `
        <div class="trader-payout-card reveal">
            <div class="payout-top">
                <div class="payout-person">
                    <div class="payout-avatar">${t.initials}</div>
                    <div>
                        <strong>${t.name}</strong>
                        <span>${t.country}</span>
                    </div>
                </div>
                <div class="payout-status">PAID</div>
            </div>

            <div class="payout-middle">
                <div class="payout-label">PROFIT WITHDRAWAL</div>
                <div class="payout-amount">${t.amount}</div>
                <div class="payout-details">
                    <span class="payout-detail">${t.account}</span>
                    <span class="payout-detail">${t.split}</span>
                </div>
            </div>

            <div class="payout-bottom">
                <span class="payout-date">Recent payout</span>
                <span class="payout-demo">PAYOUT CERTIFICATE</span>
            </div>
        </div>
    `).join("");
}


/* ---------- FAQ ACCORDION ---------- */
export function initFAQ() {
    const faqItems = document.querySelectorAll(".faq-item");
    const faqFilters = document.querySelectorAll(".faq-filter");

    if (!faqItems.length) return;

    /* باز/بسته کردن */
    faqItems.forEach(item => {
        const question = item.querySelector(".faq-question");

        question.addEventListener("click", () => {
            const isOpen = item.classList.contains("open");

            faqItems.forEach(other => other.classList.remove("open"));

            if (!isOpen) {
                item.classList.add("open");
            }
        });
    });

    /* فیلتر دسته‌بندی */
    faqFilters.forEach(filter => {
        filter.addEventListener("click", () => {
            const category = filter.dataset.filter;

            faqFilters.forEach(f => f.classList.remove("active"));
            filter.classList.add("active");

            faqItems.forEach(item => {
                const itemCategory = item.dataset.category;

                if (category === "all" || itemCategory === category) {
                    item.classList.remove("hidden");
                } else {
                    item.classList.add("hidden");
                }

                item.classList.remove("open");
            });
        });
    });
}


/* ---------- INIT ALL UI ---------- */
export function initUI() {
    renderTraderPayouts();
    initReveal();
    initHeroParallax();
    initMobileMenu();
    initFAQ();
}