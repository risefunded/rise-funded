/* =========================================================
   RISE FUNDED — PAYMENT PAGE LOGIC
========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import { firebaseConfig, wallets } from "../js/firebase-config.js";


/* ---------- FIREBASE ---------- */
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);


/* ---------- STATE ---------- */
let currentUser = null;
let orderDocId  = null;
let orderData   = null;
let selectedNetworkKey = "USDT_TRC20";


/* ---------- DOM ---------- */
const loading         = document.getElementById("loading");
const mainContent     = document.getElementById("mainContent");

const orderIdTitle    = document.getElementById("orderIdTitle");
const totalAmount     = document.getElementById("totalAmount");
const summaryPlan     = document.getElementById("summaryPlan");
const summaryAccount  = document.getElementById("summaryAccount");
const summaryPayout   = document.getElementById("summaryPayout");
const summarySplit    = document.getElementById("summarySplit");

const networkGrid     = document.getElementById("networkGrid");

const selectedNetworkName = document.getElementById("selectedNetworkName");
const selectedCoinBadge   = document.getElementById("selectedCoinBadge");
const cryptoAmount        = document.getElementById("cryptoAmount");
const walletAddress       = document.getElementById("walletAddress");

const warningCoin         = document.getElementById("warningCoin");
const warningNetwork      = document.getElementById("warningNetwork");

const txidInput           = document.getElementById("txidInput");
const explorerLink        = document.getElementById("explorerLink");
const formMessage         = document.getElementById("formMessage");
const submitTxButton      = document.getElementById("submitTxButton");


/* =========================================================
   HELPERS
========================================================= */

function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = "message show " + type;
}

function clearMessage() {
    formMessage.textContent = "";
    formMessage.className = "message";
}

function getOrderIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("order");
}


/* =========================================================
   LOAD ORDER
========================================================= */

async function loadOrder() {
    orderDocId = getOrderIdFromUrl();

    if (!orderDocId) {
        showErrorState("No order found in URL.");
        return;
    }

    try {
        const snap = await getDoc(doc(db, "orders", orderDocId));

        if (!snap.exists()) {
            showErrorState("Order not found.");
            return;
        }

        orderData = { id: snap.id, ...snap.data() };

        // بررسی مالکیت سفارش
        if (currentUser && orderData.userId !== currentUser.uid) {
            showErrorState("You are not authorized to view this order.");
            return;
        }

        // اگه پرداخت قبلاً ثبت شده
        if (
            orderData.status === "pending_review" ||
            orderData.status === "paid"
        ) {
            renderOrder();
            showAlreadySubmitted();
            return;
        }

        renderOrder();

        loading.style.display = "none";
        mainContent.style.display = "block";

    } catch (error) {
        console.error("Load order error:", error);
        showErrorState("Error loading order: " + error.message);
    }
}


function showErrorState(message) {
    loading.innerHTML = `
        <div style="
            text-align:center;
            padding:40px 20px;
            color:#c53d4d;
            font-size:14px;
            font-weight:700;
        ">
            ${message}
        </div>
        <a href="../index.html" style="
            display:inline-block;
            padding:12px 22px;
            border-radius:10px;
            background:#5b2aa8;
            color:white;
            text-decoration:none;
            font-size:13px;
            font-weight:800;
        ">
            Back to Home
        </a>
    `;
}


/* =========================================================
   RENDER ORDER
========================================================= */

function renderOrder() {
    orderIdTitle.textContent    = orderData.orderId || "RF-XXXXXX";
    totalAmount.textContent     = "$" + orderData.total;
    summaryPlan.textContent     = orderData.planName;
    summaryAccount.textContent  = "$" + orderData.accountSize.toLocaleString();
    summaryPayout.textContent   = orderData.payoutCycle;
    summarySplit.textContent    = orderData.profitSplit;

    // آپدیت اولیه‌ی مقادیر کریپتو
    updateNetworkUI();
}


/* =========================================================
   NETWORK UI
========================================================= */

function updateNetworkUI() {
    const wallet = wallets[selectedNetworkKey];
    if (!wallet) return;

    selectedNetworkName.textContent = wallet.networkName;
    selectedCoinBadge.textContent   = wallet.coin;

    cryptoAmount.textContent = orderData.total + " " + wallet.coin;
    walletAddress.textContent = wallet.address;

    warningCoin.textContent    = wallet.coin;
    warningNetwork.textContent = wallet.network;

    explorerLink.href = wallet.explorer;
}


/* =========================================================
   COPY BUTTONS
========================================================= */

document.querySelectorAll(".copy-btn").forEach(button => {
    button.addEventListener("click", async () => {
        const targetId = button.dataset.copy;
        const target   = document.getElementById(targetId);

        if (!target) return;

        try {
            await navigator.clipboard.writeText(target.textContent.trim());

            const original = button.textContent;
            button.textContent = "Copied!";
            button.classList.add("copied");

            setTimeout(() => {
                button.textContent = original;
                button.classList.remove("copied");
            }, 1500);

        } catch (err) {
            console.error("Copy failed:", err);
            alert("Could not copy. Please copy manually.");
        }
    });
});


/* =========================================================
   NETWORK SELECT
========================================================= */

networkGrid.querySelectorAll("input[name='network']").forEach(input => {
    input.addEventListener("change", () => {
        selectedNetworkKey = input.value;
        updateNetworkUI();
    });
});


/* =========================================================
   SUBMIT TXID
========================================================= */

async function submitTransaction() {
    clearMessage();

    const txid = txidInput.value.trim();

    if (!txid) {
        showMessage("Please enter your transaction hash.", "error");
        return;
    }

    if (txid.length < 20) {
        showMessage("Transaction hash looks too short. Please check again.", "error");
        return;
    }

    submitTxButton.disabled = true;
    submitTxButton.textContent = "Submitting...";

    try {
        const wallet = wallets[selectedNetworkKey];

        await updateDoc(doc(db, "orders", orderDocId), {
            status: "pending_review",
            txid: txid,
            network: wallet.network,
            networkName: wallet.networkName,
            walletAddress: wallet.address,
            paidAt: serverTimestamp(),
            submittedAt: serverTimestamp()
        });

        showMessage(
            "✅ Payment submitted successfully! We'll verify it soon. Redirecting to your dashboard...",
            "success"
        );

        setTimeout(() => {
            window.location.href = "../dashboard/dashboard.html";
        }, 2000);

    } catch (error) {
        console.error("Submit error:", error);
        showMessage("Error: " + error.message, "error");
        submitTxButton.disabled = false;
        submitTxButton.textContent = "Submit Payment Proof";
    }
}


function showAlreadySubmitted() {
    loading.style.display = "none";
    mainContent.style.display = "block";

    submitTxButton.disabled = true;
    submitTxButton.textContent = "Payment already submitted";

    showMessage(
        "This order has already been submitted. Please wait for admin approval.",
        "success"
    );
}


/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    submitTxButton.addEventListener("click", submitTransaction);
});

onAuthStateChanged(auth, (user) => {
    currentUser = user;

    if (!user) {
        window.location.href = "../auth/login.html";
        return;
    }

    loadOrder();
});