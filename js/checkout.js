/* =========================================================
   RISE FUNDED — CHECKOUT LOGIC (with Transactions)
========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";
import { plans, discountCodes, payoutOptions } from "./data.js";


/* ---------- FIREBASE ---------- */
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);


/* ---------- STATE ---------- */
let selectedPlan   = "oneStep";
let selectedAccount = 5000;
let appliedDiscount = null;
let previousPayout  = "weekly";
let currentUser     = null;


/* ---------- DOM ---------- */
const el = {
    planTabs: document.querySelectorAll(".plan-tab"),
    accountButtons: document.querySelectorAll(".account-btn"),

    planLabel: document.getElementById("planLabel"),
    accountTitle: document.getElementById("accountTitle"),
    challengePrice: document.getElementById("challengePrice"),
    planDescription: document.getElementById("planDescription"),
    profitTarget: document.getElementById("profitTarget"),
    maxDrawdown: document.getElementById("maxDrawdown"),
    dailyDrawdown: document.getElementById("dailyDrawdown"),
    profitSplit: document.getElementById("profitSplit"),
    minDays: document.getElementById("minDays"),
    leverage: document.getElementById("leverage"),

    selectedPlanText: document.getElementById("selectedPlanText"),
    selectedAccountText: document.getElementById("selectedAccountText"),

    onDemandToggle: document.getElementById("onDemandToggle"),
    startChallengeButton: document.getElementById("startChallengeButton"),

    checkoutOverlay: document.getElementById("checkoutOverlay"),
    checkoutClose: document.getElementById("checkoutClose"),
    checkoutBody: document.getElementById("checkoutBody"),
    orderSuccess: document.getElementById("orderSuccess"),
    closeSuccessButton: document.getElementById("closeSuccessButton"),
    placeOrderButton: document.getElementById("placeOrderButton"),

    discountCodeInput: document.getElementById("discountCode"),
    applyDiscountButton: document.getElementById("applyDiscountButton"),
    discountMessage: document.getElementById("discountMessage"),

    summaryPlan: document.getElementById("summaryPlan"),
    summaryAccount: document.getElementById("summaryAccount"),
    summaryTarget: document.getElementById("summaryTarget"),
    summaryMaxDD: document.getElementById("summaryMaxDD"),
    summaryDailyDD: document.getElementById("summaryDailyDD"),
    summarySplit: document.getElementById("summarySplit"),
    summaryBasePrice: document.getElementById("summaryBasePrice"),
    summaryOnDemand: document.getElementById("summaryOnDemand"),
    summaryPayout: document.getElementById("summaryPayout"),
    summaryDiscount: document.getElementById("summaryDiscount"),
    summaryTotal: document.getElementById("summaryTotal"),
    generatedOrderId: document.getElementById("generatedOrderId")
};


/* =========================================================
   AUTH STATE
========================================================= */
onAuthStateChanged(auth, (user) => {
    currentUser = user;
});


/* =========================================================
   HELPERS
========================================================= */
function getSelectedPayout() {
    const s = document.querySelector('input[name="checkoutPayout"]:checked');
    return s ? s.value : "weekly";
}

function getPayoutData() {
    return payoutOptions[getSelectedPayout()];
}

function calculateDiscount(amount) {
    if (!appliedDiscount) return 0;
    if (appliedDiscount.type === "percent") {
        return Math.round(amount * (appliedDiscount.value / 100));
    }
    return 0;
}

function showDiscountMessage(message, type) {
    el.discountMessage.textContent = message;
    el.discountMessage.className = "discount-message show " + type;
}

function clearDiscountMessage() {
    el.discountMessage.textContent = "";
    el.discountMessage.className = "discount-message";
}


/* =========================================================
   DISCOUNT
========================================================= */
function applyDiscount() {
    const code = el.discountCodeInput.value.trim().toUpperCase();

    if (!code) {
        appliedDiscount = null;
        showDiscountMessage("No code entered. Discount is optional.", "error");
        updateChallenge();
        return;
    }

    const discount = discountCodes[code];

    if (!discount) {
        appliedDiscount = null;
        showDiscountMessage("Invalid or expired discount code.", "error");
        updateChallenge();
        return;
    }

    appliedDiscount = { code, ...discount };
    showDiscountMessage(`${discount.label} applied successfully.`, "success");
    updateChallenge();
}


/* =========================================================
   UPDATE UI
========================================================= */
function updatePayoutOptions() {
    document.querySelectorAll(".payout-option").forEach(option => {
        const radio = option.querySelector("input");
        option.classList.toggle("active", radio.checked);
    });
}


function updateChallenge() {
    const plan       = plans[selectedPlan];
    const basePrice  = plan.prices[selectedAccount];
    const payout     = getPayoutData();

    const onDemandFee  = payout.extraFee ? Math.round(basePrice * 0.10) : 0;
    const subtotal     = basePrice + onDemandFee;
    const discountAmt  = calculateDiscount(subtotal);
    const finalPrice   = Math.max(0, subtotal - discountAmt);

    el.planLabel.textContent       = plan.label;
    el.accountTitle.textContent    = "$" + selectedAccount.toLocaleString() + " Account";
    el.challengePrice.textContent  = "$" + finalPrice;
    el.planDescription.textContent = plan.description;
    el.profitTarget.textContent    = plan.profitTarget;
    el.maxDrawdown.textContent     = plan.maxDrawdown;
    el.dailyDrawdown.textContent   = plan.dailyDrawdown;
    el.profitSplit.textContent     = payout.split;
    el.minDays.textContent         = plan.minDays;
    el.leverage.textContent        = plan.leverage;
    el.selectedPlanText.textContent    = plan.shortLabel;
    el.selectedAccountText.textContent = "$" + (selectedAccount / 1000) + "K";

    el.summaryPlan.textContent      = plan.shortLabel;
    el.summaryAccount.textContent   = "$" + selectedAccount.toLocaleString() + " Trading Account";
    el.summaryTarget.textContent    = plan.profitTarget;
    el.summaryMaxDD.textContent     = plan.maxDrawdown;
    el.summaryDailyDD.textContent   = plan.dailyDrawdown;
    el.summarySplit.textContent     = payout.split;
    el.summaryBasePrice.textContent = "$" + basePrice;
    el.summaryOnDemand.textContent  = onDemandFee ? "+$" + onDemandFee : "$0";
    el.summaryPayout.textContent    = payout.label;
    el.summaryDiscount.textContent  = discountAmt ? "-$" + discountAmt : "$0";
    el.summaryTotal.textContent     = "$" + finalPrice;
}


/* =========================================================
   CHECKOUT OPEN/CLOSE
========================================================= */
function openCheckout() {
    if (!currentUser) {
        window.location.href = "auth/login.html";
        return;
    }

    el.checkoutOverlay.classList.add("open");
    document.body.classList.add("checkout-open");
    el.checkoutBody.style.display = "grid";
    el.orderSuccess.classList.remove("show");
    updateChallenge();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeCheckout() {
    el.checkoutOverlay.classList.remove("open");
    document.body.classList.remove("checkout-open");
}


/* =========================================================
   VALIDATION
========================================================= */
function validateForm() {
    const firstName = document.getElementById("firstName").value.trim();
    const lastName  = document.getElementById("lastName").value.trim();
    const email     = document.getElementById("email").value.trim();
    const country   = document.getElementById("country").value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!firstName) { alert("Please enter your first name."); return false; }
    if (!lastName)  { alert("Please enter your last name.");  return false; }
    if (!emailRegex.test(email)) { alert("Please enter a valid email."); return false; }
    if (!country)   { alert("Please select your country.");   return false; }

    return true;
}


/* =========================================================
   ORDER
========================================================= */
function generateOrderId() {
    const timestamp = Date.now().toString().slice(-6);
    const random    = Math.floor(10 + Math.random() * 90);
    return "RF-" + timestamp + random;
}


/* =========================================================
   CREATE TRANSACTION (Helper)
========================================================= */
async function createTransaction({
    userId,
    type,
    title,
    description,
    amount,
    status,
    reference,
    meta = {}
}) {
    try {
        await addDoc(
            collection(db, "users", userId, "transactions"),
            {
                type,
                title,
                description: description || "",
                amount: Number(amount) || 0,
                currency: "USD",
                status,
                reference: reference || "",
                meta,
                createdAt: serverTimestamp()
            }
        );
        console.log("✅ Transaction created:", title);
    } catch (err) {
        console.error("❌ Create transaction error:", err);
    }
}


async function placeOrder() {
    if (!validateForm()) return;
    if (!currentUser) {
        alert("Please log in first.");
        window.location.href = "auth/login.html";
        return;
    }

    el.placeOrderButton.disabled = true;
    el.placeOrderButton.textContent = "Creating order...";

    const plan      = plans[selectedPlan];
    const payout    = getPayoutData();
    const basePrice = plan.prices[selectedAccount];
    const onDemandFee = payout.extraFee ? Math.round(basePrice * 0.10) : 0;
    const subtotal    = basePrice + onDemandFee;
    const discountAmt = calculateDiscount(subtotal);
    const total       = Math.max(0, subtotal - discountAmt);

    const orderId = generateOrderId();

    const order = {
        orderId,
        userId: currentUser.uid,
        userEmail: currentUser.email,

        plan: selectedPlan,
        planName: plan.shortLabel,
        accountSize: selectedAccount,
        profitTarget: plan.profitTarget,
        maxDrawdown: plan.maxDrawdown,
        dailyDrawdown: plan.dailyDrawdown,
        minDays: plan.minDays,
        leverage: plan.leverage,

        basePrice,
        onDemandFee,
        subtotal,
        discountCode: appliedDiscount ? appliedDiscount.code : null,
        discountPercent: appliedDiscount ? appliedDiscount.value : 0,
        discountAmount: discountAmt,
        total,

        payoutCycle: payout.label,
        profitSplit: payout.split,

        firstName: document.getElementById("firstName").value.trim(),
        lastName:  document.getElementById("lastName").value.trim(),
        email:     document.getElementById("email").value.trim(),
        country:   document.getElementById("country").value,
        phone:     document.getElementById("phone").value.trim(),

        status: "awaiting_payment",
        createdAt: serverTimestamp()
    };

    try {
        const docRef = await addDoc(collection(db, "orders"), order);

        console.log("✅ Order created:", orderId, "| docId:", docRef.id);

        /* ✅ ثبت تراکنش — خرید چلنج */
        await createTransaction({
            userId: currentUser.uid,
            type: "purchase",
            title: "Challenge Purchase",
            description: `${plan.shortLabel} • $${selectedAccount.toLocaleString()} Account`,
            amount: -total,
            status: "pending",
            reference: orderId,
            meta: {
                orderId,
                docId: docRef.id,
                plan: selectedPlan,
                accountSize: selectedAccount,
                payoutCycle: payout.label
            }
        });

        /* اگه On Demand داشت */
        if (onDemandFee > 0) {
            await createTransaction({
                userId: currentUser.uid,
                type: "fee",
                title: "On Demand Fee",
                description: "Add-on for 95% profit split",
                amount: -onDemandFee,
                status: "pending",
                reference: orderId,
                meta: { orderId, docId: docRef.id }
            });
        }

        sessionStorage.setItem("rise_pending_order", JSON.stringify({
            ...order,
            docId: docRef.id,
            createdAt: new Date().toISOString()
        }));

        el.generatedOrderId.textContent = orderId;

        setTimeout(() => {
            window.location.href = `payment/payment.html?order=${docRef.id}`;
        }, 1000);

    } catch (error) {
        console.error("Order error:", error);
        alert("Could not create order. Please try again.\n\n" + error.message);
        el.placeOrderButton.disabled = false;
        el.placeOrderButton.textContent = "Continue to Payment";
    }
}


/* =========================================================
   INIT EVENTS
========================================================= */
function initCheckoutEvents() {

    el.planTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            el.planTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            selectedPlan = tab.dataset.plan;
            updateChallenge();
        });
    });

    el.accountButtons.forEach(button => {
        button.addEventListener("click", () => {
            el.accountButtons.forEach(b => b.classList.remove("active"));
            button.classList.add("active");
            selectedAccount = Number(button.dataset.account);
            updateChallenge();
        });
    });

    document.querySelectorAll('input[name="checkoutPayout"]').forEach(radio => {
        radio.addEventListener("change", () => {
            updatePayoutOptions();
            if (radio.value !== "ondemand") {
                previousPayout = radio.value;
            }
            el.onDemandToggle.checked = radio.value === "ondemand";
            updateChallenge();
        });
    });

    el.onDemandToggle.addEventListener("change", () => {
        const payout = el.onDemandToggle.checked ? "ondemand" : previousPayout;
        const radio = document.querySelector(
            `input[name="checkoutPayout"][value="${payout}"]`
        );
        if (radio) {
            radio.checked = true;
            updatePayoutOptions();
        }
        updateChallenge();
    });

    el.applyDiscountButton.addEventListener("click", applyDiscount);

    el.discountCodeInput.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            applyDiscount();
        }
    });

    el.discountCodeInput.addEventListener("input", () => {
        if (!el.discountCodeInput.value.trim()) {
            appliedDiscount = null;
            clearDiscountMessage();
            updateChallenge();
        }
    });

    el.startChallengeButton.addEventListener("click", openCheckout);
    el.checkoutClose.addEventListener("click", closeCheckout);
    el.closeSuccessButton.addEventListener("click", closeCheckout);

    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && el.checkoutOverlay.classList.contains("open")) {
            closeCheckout();
        }
    });

    el.placeOrderButton.addEventListener("click", placeOrder);
}


/* =========================================================
   INIT
========================================================= */
export function initCheckout() {
    initCheckoutEvents();
    updatePayoutOptions();
    updateChallenge();
}