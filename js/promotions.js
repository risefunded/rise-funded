/* =========================================================
   RISE FUNDED — PROMOTIONS (Top Bar + Popup)
========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
    getFirestore,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";


/* ---------- FIREBASE ---------- */
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);


/* =========================================================
   TOP BAR PROMOTION
========================================================= */

function renderTopBar(data) {
    const topbar = document.getElementById("promoTopbar");
    const text   = document.getElementById("promoTopbarText");
    const code   = document.getElementById("promoTopbarCode");
    const disc   = document.getElementById("promoTopbarDiscount");
    const close  = document.getElementById("promoTopbarClose");

    if (!topbar || !data) return;

    if (!data.enabled) {
        topbar.style.display = "none";
        return;
    }

    text.textContent = data.text || "";
    code.textContent = data.code || "";
    disc.textContent = data.discount || "";

    topbar.style.display = "flex";
    document.body.classList.add("promo-topbar-active");

    /* دکمه‌ی بستن — فقط برای این session پنهان می‌شه */
    close.addEventListener("click", () => {
        topbar.style.display = "none";
        document.body.classList.remove("promo-topbar-active");
    });
}


/* =========================================================
   POPUP PROMOTION
========================================================= */

function showPopup(data) {
    const overlay  = document.getElementById("promoPopup");
    const close    = document.getElementById("promoPopupClose");
    const title    = document.getElementById("promoPopupTitle");
    const desc     = document.getElementById("promoPopupDesc");
    const code     = document.getElementById("promoPopupCode");
    const percent  = document.getElementById("promoPopupPercent");
    const copyBtn  = document.getElementById("promoPopupCopy");
    const cta      = document.getElementById("promoPopupCTA");

    if (!overlay || !data || !data.enabled) return;

    /* چک کردن که کاربر قبلاً نبسته باشه */
    if (sessionStorage.getItem("promo_popup_closed") === "true") {
        return;
    }

    title.textContent = data.title || "Special Offer";
    desc.textContent  = data.description || "";
    code.textContent  = data.code || "";
    percent.textContent = (data.percent || 0) + "% OFF";

    /* دکمه کپی */
    copyBtn.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(data.code || "");
            copyBtn.textContent = "✅ Copied!";
            copyBtn.style.background = "#2f9b68";

            setTimeout(() => {
                copyBtn.textContent = "Copy Code";
                copyBtn.style.background = "";
            }, 2000);
        } catch (err) {
            console.error("Copy failed:", err);
        }
    });

    /* CTA — بستن پاپ‌آپ و اسکرول به بخش challenges */
    cta.addEventListener("click", () => {
        overlay.classList.remove("show");
        sessionStorage.setItem("promo_popup_closed", "true");
    });

    /* بستن */
    close.addEventListener("click", () => {
        overlay.classList.remove("show");
        sessionStorage.setItem("promo_popup_closed", "true");
    });

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            overlay.classList.remove("show");
            sessionStorage.setItem("promo_popup_closed", "true");
        }
    });

    /* نمایش بعد از delay */
    const delay = Number(data.showDelay) || 3000;

    setTimeout(() => {
        overlay.classList.add("show");
    }, delay);
}


/* =========================================================
   LOAD PROMOTIONS FROM FIRESTORE
========================================================= */

export async function initPromotions() {
    try {
        const snap = await getDoc(doc(db, "settings", "promotions"));

        if (!snap.exists()) {
            console.log("No promotions configured yet.");
            return;
        }

        const data = snap.data();

        /* Top Bar */
        if (data.topbar) {
            renderTopBar(data.topbar);
        }

        /* Popup */
        if (data.popup) {
            showPopup(data.popup);
        }

    } catch (err) {
        console.error("Load promotions error:", err);
    }
}