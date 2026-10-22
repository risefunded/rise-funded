// ============================================================
// RISE FUNDED
// USER DASHBOARD (Support + Transactions + MT + Certificates + KYC + Withdrawal)
// ============================================================

import { initializeApp }
    from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    query,
    orderBy,
    where,
    limit,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyC0ecCQOl6gFEdXe34_xNIFdwcKiFziWfE",
    authDomain: "rise-funded.firebaseapp.com",
    projectId: "rise-funded",
    storageBucket: "rise-funded.firebasestorage.app",
    messagingSenderId: "409746033804",
    appId: "1:409746033804:web:71fa279d7cbd6b5816bfa9"
};


// ============================================================
// INITIALIZE
// ============================================================

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);


// ============================================================
// DOM
// ============================================================

const loadingScreen       = document.getElementById("loadingScreen");
const sidebar             = document.getElementById("sidebar");
const sidebarClose        = document.getElementById("sidebarClose");
const mobileMenu          = document.getElementById("mobileMenu");
const logoutButton        = document.getElementById("logoutButton");
const pageTitle           = document.getElementById("pageTitle");
const notificationButton  = document.getElementById("notificationButton");
const notificationPanel   = document.getElementById("notificationPanel");
const closeNotifications  = document.getElementById("closeNotifications");


// ============================================================
// STATE
// ============================================================

let currentUser    = null;
let currentUserData = null;

let userChallenges   = [];
let userAccounts     = [];
let userPayouts      = [];
let userTransactions = [];
let userTickets      = [];
let userCertificates = [];
let userCertRequests = [];
let userWithdrawals  = [];
let userKycRequests  = [];

let currentTicketId        = null;
let currentTicketUnsub     = null;

let currentAccountIndex = 0;
let equityChart = null;

let selectedCertType = null;
let currentCertPreview = null;


// ============================================================
// CERTIFICATE TYPES
// ============================================================

const CERT_TYPES = {
    phase1: {
        label: "Phase 1 Passed",
        icon: "①",
        description: "For successfully completing Phase 1 of your challenge."
    },
    phase2: {
        label: "Phase 2 Passed",
        icon: "②",
        description: "For successfully completing Phase 2 of your challenge."
    },
    funded: {
        label: "Funded Trader",
        icon: "★",
        description: "For reaching a funded account status."
    },
    payout: {
        label: "Payout Achieved",
        icon: "💰",
        description: "For successfully withdrawing your profits."
    }
};

const ACCOUNT_TYPES_LABEL = {
    "1step":          "1 Step",
    "2step_standard": "2 Step Standard",
    "2step_pro":      "2 Step Pro",
    "instant":        "Instant"
};


// ============================================================
// HELPERS
// ============================================================

function $(id) {
    return document.getElementById(id);
}


function formatMoney(value) {
    const number = Number(value) || 0;

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
}


function formatMoneyAbs(value) {
    const n = Number(value) || 0;
    return "$" + n.toFixed(2);
}


function formatNumber(value) {
    const number = Number(value) || 0;
    return new Intl.NumberFormat("en-US").format(number);
}


function getInitials(firstName = "", lastName = "") {
    const first = firstName.trim().charAt(0);
    const last  = lastName.trim().charAt(0);

    return ((first + last) || "U").toUpperCase();
}


function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function formatDate(value) {
    if (!value) return "—";

    try {
        let date;

        if (value && typeof value.toDate === "function") {
            date = value.toDate();
        } else {
            date = new Date(value);
        }

        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        }).format(date);

    } catch {
        return "—";
    }
}


function formatDateTime(value) {
    if (!value) return "—";

    try {
        let date;

        if (value && typeof value.toDate === "function") {
            date = value.toDate();
        } else {
            date = new Date(value);
        }

        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }).format(date);

    } catch {
        return "—";
    }
}


function parsePercent(value) {
    if (value == null) return 0;
    if (typeof value === "number") return value;
    const match = String(value).match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : 0;
}


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "../auth/login.html";
        return;
    }

    currentUser = user;

    try {
        await loadUserData(user.uid);
        await loadUserCollections(user.uid);
        await loadUserTickets();
        await loadUserCertificates();
        await loadUserCertRequests();
        await loadUserWithdrawals();
        await loadUserKycRequests();
        await refreshNotifications();

        renderDashboard();

        initSupportEvents();
        initMTEvents();
        initAccountSelectorEvent();
        initCertificateEvents();
        initKycEvents();
        initWithdrawalEvents();

    } catch (error) {
        console.error("Dashboard loading error:", error);
        renderDashboard();
        initSupportEvents();
        initMTEvents();
        initAccountSelectorEvent();
        initCertificateEvents();
        initKycEvents();
        initWithdrawalEvents();

    } finally {
        setTimeout(() => {
            loadingScreen.classList.add("hidden");
        }, 300);
    }
});


// ============================================================
// LOAD USER
// ============================================================

async function loadUserData(uid) {
    const userRef = doc(db, "users", uid);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
        currentUserData = snapshot.data();

    } else {
        currentUserData = {
            uid,
            firstName: currentUser.displayName || "Trader",
            lastName: "",
            username: "trader",
            email: currentUser.email || "",
            country: "",
            phone: "",
            role: "trader",
            status: "active",
            kycStatus: "not_verified"
        };
    }
}


// ============================================================
// LOAD USER COLLECTIONS
// ============================================================

async function loadUserCollections(uid) {

    const loadCollection = async (name) => {
        try {
            const ref = collection(db, "users", uid, name);

            const q = query(
                ref,
                orderBy("createdAt", "desc"),
                limit(50)
            );

            const snapshot = await getDocs(q);

            return snapshot.docs.map(item => ({
                id: item.id,
                ...item.data()
            }));

        } catch (error) {
            console.warn(`Could not load ${name}:`, error);
            return [];
        }
    };

    userChallenges   = await loadCollection("challenges");
    userAccounts     = await loadCollection("accounts");
    userPayouts      = await loadCollection("payouts");
    userTransactions = await loadCollection("transactions");
}


// ============================================================
// LOAD CERTIFICATES
// ============================================================

async function loadUserCertificates() {
    if (!currentUser) return;

    try {
        const ref = collection(db, "users", currentUser.uid, "certificates");
        const q = query(ref, orderBy("issuedAt", "desc"));
        const snap = await getDocs(q);

        userCertificates = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

    } catch (err) {
        console.warn("Could not load certificates:", err);
        userCertificates = [];
    }
}


async function loadUserCertRequests() {
    if (!currentUser) return;

    try {
        const q = query(
            collection(db, "certificate_requests"),
            where("userId", "==", currentUser.uid),
            orderBy("requestedAt", "desc")
        );

        const snap = await getDocs(q);

        userCertRequests = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

    } catch (err) {
        console.warn("Could not load cert requests:", err);
        userCertRequests = [];
    }
}


// ============================================================
// LOAD WITHDRAWALS
// ============================================================

async function loadUserWithdrawals() {
    if (!currentUser) return;

    try {
        const q = query(
            collection(db, "withdrawal_requests"),
            where("userId", "==", currentUser.uid),
            orderBy("requestedAt", "desc")
        );

        const snap = await getDocs(q);

        userWithdrawals = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

    } catch (err) {
        console.warn("Could not load withdrawals:", err);
        userWithdrawals = [];
    }
}


// ============================================================
// LOAD KYC REQUESTS
// ============================================================

async function loadUserKycRequests() {
    if (!currentUser) return;

    try {
        const q = query(
            collection(db, "kyc_requests"),
            where("userId", "==", currentUser.uid),
            orderBy("submittedAt", "desc"),
            limit(5)
        );

        const snap = await getDocs(q);

        userKycRequests = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

    } catch (err) {
        console.warn("Could not load KYC requests:", err);
        userKycRequests = [];
    }
}


// ============================================================
// RENDER EVERYTHING
// ============================================================

function renderDashboard() {
    renderUser();
    renderStats();
    renderActiveAccount();
    renderTransactions();
    renderPayouts();
    renderChallenges();
    renderAccounts();
    renderCertificates();
    renderProfile();
    renderKyc();
    renderWithdrawals();
    renderSupport();
}


// ============================================================
// USER
// ============================================================

function renderUser() {
    const firstName = currentUserData?.firstName || "Trader";
    const lastName  = currentUserData?.lastName  || "";
    const username  = currentUserData?.username  || "trader";

    const fullName = `${firstName} ${lastName}`.trim();
    const initials = getInitials(firstName, lastName);

    $("welcomeName").textContent       = firstName;
    $("sidebarName").textContent       = fullName;
    $("sidebarUsername").textContent   = `@${username}`;
    $("topUserName").textContent       = firstName;
    $("sidebarAvatar").textContent     = initials;
    $("topAvatar").textContent         = initials;
    $("profileAvatar").textContent     = initials;

    document.title = `${firstName} — RISE FUNDED`;
}


// ============================================================
// MT MODAL
// ============================================================

function openMTModal(challenge) {
    const modal = $("mtModal");
    const body  = $("mtModalBody");

    if (!modal || !body) return;

    body.innerHTML = `
        <div class="mt-modal-row">
            <span>MT Login</span>
            <strong>${escapeHTML(challenge.mtLogin)}</strong>
        </div>

        <div class="mt-modal-row">
            <span>MT Password</span>
            <strong>${escapeHTML(challenge.mtPassword)}</strong>
        </div>

        <div class="mt-modal-row">
            <span>MT Server</span>
            <strong>${escapeHTML(challenge.mtServer)}</strong>
        </div>

        <div class="mt-modal-row">
            <span>Plan</span>
            <strong>${escapeHTML(challenge.planName || "—")}</strong>
        </div>

        <div class="mt-modal-row">
            <span>Account Size</span>
            <strong>$${(challenge.accountSize || 0).toLocaleString()}</strong>
        </div>

        <div class="mt-modal-row">
            <span>Profit Split</span>
            <strong>${escapeHTML(challenge.profitSplit || "—")}</strong>
        </div>
    `;

    modal.classList.add("show");
}


function initMTEvents() {
    const mtModal      = $("mtModal");
    const mtModalClose = $("mtModalClose");

    if (mtModalClose) {
        mtModalClose.addEventListener("click", () => {
            mtModal.classList.remove("show");
        });
    }

    if (mtModal) {
        mtModal.addEventListener("click", (e) => {
            if (e.target === mtModal) {
                mtModal.classList.remove("show");
            }
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && mtModal && mtModal.classList.contains("show")) {
            mtModal.classList.remove("show");
        }
    });
}


// ============================================================
// STATS
// ============================================================

function renderStats() {
    const accounts = userAccounts.length;

    const activeChallenges = userChallenges.filter(
        challenge =>
            challenge.status === "active" ||
            challenge.status === "funded" ||
            !challenge.status
    ).length;

    const totalProfit = userAccounts.reduce(
        (sum, account) => sum + Number(account.profit || 0),
        0
    );

    const totalPayouts = userPayouts
        .filter(payout =>
            payout.status === "paid" ||
            payout.status === "completed" ||
            payout.status === "success"
        )
        .reduce(
            (sum, payout) => sum + Number(payout.amount || 0),
            0
        );

    $("totalAccounts").textContent       = formatNumber(accounts);
    $("activeChallenges").textContent    = formatNumber(activeChallenges);
    $("totalProfit").textContent         = formatMoney(totalProfit);
    $("totalPayouts").textContent        = formatMoney(totalPayouts);
    $("payoutPreviewAmount").textContent = formatMoney(totalPayouts);
    $("payoutTotal").textContent         = formatMoney(totalPayouts);

    const pending = userPayouts
        .filter(payout => payout.status === "pending")
        .reduce(
            (sum, payout) => sum + Number(payout.amount || 0),
            0
        );

    $("payoutPending").textContent = formatMoney(pending);

    $("payoutCount").textContent = userPayouts.filter(
        payout =>
            payout.status === "paid" ||
            payout.status === "completed" ||
            payout.status === "success"
    ).length;
}


// ============================================================
// ACTIVE ACCOUNT
// ============================================================

function renderActiveAccount() {
    const account = userAccounts[0];

    if (!account) {
        $("accountSize").textContent           = "$0";
        $("accountId").textContent             = "NO ACTIVE ACCOUNT";
        $("accountBalance").textContent        = "$0.00";
        $("accountEquity").textContent         = "$0.00";
        $("accountProfit").textContent         = "+$0.00";
        $("accountProfitPercent").textContent  = "+0.00%";
        $("dailyDrawdown").textContent         = "0.00%";
        $("maxDrawdown").textContent           = "0.00%";
        $("profitProgress").textContent        = "0.00";
        $("profitProgressBar").style.width     = "0%";
        return;
    }

    const accountSize = Number(account.accountSize || account.balance || 0);
    const balance     = Number(account.balance || accountSize);
    const equity      = Number(account.equity  || balance);
    const profit      = Number(account.profit  || equity - accountSize);

    const profitPercent = accountSize > 0
        ? (profit / accountSize * 100)
        : 0;

    const dailyDD = Number(account.dailyDrawdown || 0);
    const maxDD   = Number(account.maxDrawdown   || 0);

    const targetPercent = Number(
        account.profitTarget ||
        account.target ||
        10
    );

    const progress = Math.max(
        0,
        Math.min(100, profitPercent / targetPercent * 100)
    );

    $("accountSize").textContent =
        formatMoney(accountSize).replace(".00", "");

    $("accountId").textContent =
        account.accountId || account.id || "RF-000000";

    $("accountBalance").textContent = formatMoney(balance);
    $("accountEquity").textContent  = formatMoney(equity);

    $("accountProfit").textContent =
        `${profit >= 0 ? "+" : "-"}${formatMoney(Math.abs(profit))}`;

    $("accountProfitPercent").textContent =
        `${profitPercent >= 0 ? "+" : ""}${profitPercent.toFixed(2)}%`;

    $("dailyDrawdown").textContent = `${dailyDD.toFixed(2)}%`;
    $("maxDrawdown").textContent   = `${maxDD.toFixed(2)}%`;

    $("profitProgress").textContent = profitPercent.toFixed(2);
    $("profitProgressBar").style.width = `${progress}%`;

    $("currentProfitSmall").textContent = formatMoney(profit);

    $("targetProfitSmall").textContent = formatMoney(
        accountSize * targetPercent / 100
    );

    $("dashboardSplit").textContent =
        account.profitSplit || "—";

    $("nextPayout").textContent =
        account.nextPayoutDate
            ? formatDate(account.nextPayoutDate)
            : "—";
}


// ============================================================
// TRANSACTIONS
// ============================================================

function getTransactionIcon(type) {
    if (type === "purchase") return "🛒";
    if (type === "payout")   return "💰";
    if (type === "refund")   return "↩️";
    if (type === "fee")      return "⚡";
    if (type === "bonus")    return "🎁";
    if (type === "deposit")  return "⬇️";
    if (type === "withdrawal") return "⬆️";
    return "💳";
}

function getTransactionStatusLabel(status) {
    if (status === "completed") return "Completed";
    if (status === "pending")   return "Pending";
    if (status === "failed")    return "Failed";
    return status || "Unknown";
}

function renderTransactions() {
    const container = $("recentTransactions");

    if (!userTransactions.length) {
        container.innerHTML = `
            <div class="empty-state small">
                <div class="empty-icon">⇄</div>
                <strong>No transactions yet</strong>
                <span>Your activity will appear here.</span>
            </div>
        `;

        $("transactionsTable").innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="table-empty">
                        No transactions yet.
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    const recent = userTransactions.slice(0, 5);

    container.innerHTML = recent.map(t => {
        const amount = Number(t.amount || 0);
        const positive = amount >= 0;

        return `
            <div class="transaction-item">
                <div class="transaction-left">
                    <div class="transaction-icon">
                        ${getTransactionIcon(t.type)}
                    </div>
                    <div>
                        <div class="transaction-name">
                            ${escapeHTML(t.title || t.type || "Transaction")}
                        </div>
                        <span class="transaction-date">
                            ${formatDate(t.createdAt)}
                        </span>
                    </div>
                </div>

                <div class="transaction-amount ${positive ? "positive" : "negative"}">
                    ${positive ? "+" : "−"}
                    ${formatMoney(Math.abs(amount))}
                </div>
            </div>
        `;
    }).join("");

    $("transactionsTable").innerHTML = userTransactions.map(t => {
        const amount = Number(t.amount || 0);
        const positive = amount >= 0;
        const status = t.status || "completed";

        return `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:8px">
                        <span style="font-size:16px">${getTransactionIcon(t.type)}</span>
                        <div>
                            <strong style="display:block;color:var(--navy);font-size:11px">
                                ${escapeHTML(t.title || t.type || "Transaction")}
                            </strong>
                            ${t.description ? `
                                <span style="display:block;color:var(--muted);font-size:9px;margin-top:2px">
                                    ${escapeHTML(t.description)}
                                </span>
                            ` : ""}
                        </div>
                    </div>
                </td>

                <td>
                    ${escapeHTML(t.reference || t.id || "—")}
                </td>

                <td class="${positive ? "positive" : ""}" style="font-weight:800">
                    ${positive ? "+" : "−"}
                    ${formatMoney(Math.abs(amount))}
                </td>

                <td>
                    ${formatDate(t.createdAt)}
                </td>

                <td>
                    <span class="table-status ${
                        status === "pending" ? "pending" :
                        status === "failed"  ? "failed"  :
                        "success"
                    }">
                        ${escapeHTML(getTransactionStatusLabel(status)).toUpperCase()}
                    </span>
                </td>
            </tr>
        `;
    }).join("");
}


// ============================================================
// PAYOUTS (History)
// ============================================================

function renderPayouts() {
    if (!userPayouts.length) {
        $("payoutTable").innerHTML = `
            <tr>
                <td colspan="5">
                    <div class="table-empty">
                        No payout records yet.
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    $("payoutTable").innerHTML = userPayouts.map(payout => {
        const status = payout.status || "pending";
        const statusClass = status === "pending" ? "pending" : "success";

        return `
            <tr>
                <td>
                    ${escapeHTML(payout.payoutId || payout.id || "—")}
                </td>

                <td>
                    ${escapeHTML(payout.accountId || "—")}
                </td>

                <td>
                    ${formatMoney(payout.amount)}
                </td>

                <td>
                    ${formatDate(payout.createdAt || payout.date)}
                </td>

                <td>
                    <span class="table-status ${statusClass}">
                        ${escapeHTML(status).toUpperCase()}
                    </span>
                </td>
            </tr>
        `;
    }).join("");
}


// ============================================================
// CHALLENGES
// ============================================================

function renderChallenges() {
    const container = $("challengeList");

    if (!userChallenges.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">▣</div>
                <strong>No challenges yet</strong>
                <span>Your purchased challenges will appear here.</span>

                <a href="../index.html#challenges" class="primary-button">
                    Explore Challenges
                </a>
            </div>
        `;
        return;
    }

    container.innerHTML = userChallenges.map(challenge => {
        const status = challenge.status || "pending";

        const hasMT =
            challenge.mtLogin &&
            challenge.mtPassword &&
            challenge.mtServer;

        const mtBlock = hasMT ? `
            <div class="challenge-mt-block">
                <div class="challenge-mt-header">
                    <div class="challenge-mt-title">
                        <span class="challenge-mt-icon">📊</span>
                        <div>
                            <strong>MetaTrader Account</strong>
                            <span>Ready to trade</span>
                        </div>
                    </div>
                    <span class="challenge-mt-badge">
                        <span class="status-dot"></span>
                        ACTIVE
                    </span>
                </div>

                <div class="challenge-mt-credentials">
                    <div class="challenge-mt-field">
                        <span>Login</span>
                        <strong id="mtLogin-${challenge.id}">${escapeHTML(challenge.mtLogin)}</strong>
                        <button class="challenge-mt-copy" data-copy="mtLogin-${challenge.id}" title="Copy">📋</button>
                    </div>

                    <div class="challenge-mt-field">
                        <span>Password</span>
                        <strong id="mtPassword-${challenge.id}">${escapeHTML(challenge.mtPassword)}</strong>
                        <button class="challenge-mt-copy" data-copy="mtPassword-${challenge.id}" title="Copy">📋</button>
                    </div>

                    <div class="challenge-mt-field">
                        <span>Server</span>
                        <strong id="mtServer-${challenge.id}">${escapeHTML(challenge.mtServer)}</strong>
                        <button class="challenge-mt-copy" data-copy="mtServer-${challenge.id}" title="Copy">📋</button>
                    </div>
                </div>

                <div class="challenge-mt-actions">
                    <button class="challenge-mt-btn challenge-mt-btn-outline"
                            data-mt-modal="${challenge.id}">
                        View Full Details
                    </button>
                    <button class="challenge-mt-btn challenge-mt-btn-primary"
                            data-mt-copyall="${challenge.id}">
                        Copy All Credentials
                    </button>
                </div>

                <div class="challenge-mt-note">
                    💡 Use these credentials to log in to your MetaTrader 5 platform.
                    Keep them secure.
                </div>
            </div>
        ` : "";

        return `
            <div class="challenge-item ${hasMT ? "challenge-with-mt" : ""}">
                <div class="challenge-top">
                    <span class="challenge-type">
                        ${escapeHTML(
                            challenge.planName ||
                            challenge.plan ||
                            "RISE FUNDED"
                        ).toUpperCase()}
                    </span>
                    <span class="challenge-status">
                        ${escapeHTML(status).toUpperCase()}
                    </span>
                </div>

                <h3>
                    ${formatMoney(challenge.accountSize || 0).replace(".00", "")}
                </h3>

                <div class="challenge-id">
                    ${escapeHTML(
                        challenge.accountId ||
                        challenge.orderId ||
                        challenge.id ||
                        "—"
                    )}
                </div>

                <div class="challenge-details">
                    <div class="challenge-detail">
                        <span>Target</span>
                        <strong>
                            ${escapeHTML(
                                challenge.profitTarget ||
                                challenge.target ||
                                "—"
                            )}
                        </strong>
                    </div>

                    <div class="challenge-detail">
                        <span>Max DD</span>
                        <strong>
                            ${escapeHTML(challenge.maxDrawdown || "—")}
                        </strong>
                    </div>

                    <div class="challenge-detail">
                        <span>Split</span>
                        <strong>
                            ${escapeHTML(challenge.profitSplit || "—")}
                        </strong>
                    </div>
                </div>

                ${mtBlock}
            </div>
        `;
    }).join("");

    container.querySelectorAll(".challenge-mt-copy").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();

            const targetId = btn.dataset.copy;
            const target = document.getElementById(targetId);
            if (!target) return;

            navigator.clipboard.writeText(target.textContent.trim())
                .then(() => {
                    const original = btn.textContent;
                    btn.textContent = "✅";

                    setTimeout(() => {
                        btn.textContent = original;
                    }, 1500);
                })
                .catch(err => console.error("Copy failed:", err));
        });
    });

    container.querySelectorAll("[data-mt-copyall]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();

            const challengeId = btn.dataset.mtCopyall;
            const challenge = userChallenges.find(c => c.id === challengeId);
            if (!challenge) return;

            const text =
                `MetaTrader Account\n\n` +
                `Login: ${challenge.mtLogin}\n` +
                `Password: ${challenge.mtPassword}\n` +
                `Server: ${challenge.mtServer}`;

            navigator.clipboard.writeText(text)
                .then(() => {
                    const original = btn.textContent;
                    btn.textContent = "✅ Copied!";

                    setTimeout(() => {
                        btn.textContent = original;
                    }, 2000);
                })
                .catch(err => console.error("Copy failed:", err));
        });
    });

    container.querySelectorAll("[data-mt-modal]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();

            const challengeId = btn.dataset.mtModal;
            const challenge = userChallenges.find(c => c.id === challengeId);
            if (!challenge) return;

            openMTModal(challenge);
        });
    });
}


// ============================================================
// ACCOUNTS
// ============================================================

function renderAccounts() {
    const emptyState = $("accountsEmptyState");
    const detailView = $("accountDetail");
    const selector   = $("accountSelector");

    if (!emptyState || !detailView) return;

    const activeAccounts = userChallenges.filter(
        c => c.mtLogin && c.mtPassword && c.mtServer
    );

    if (!activeAccounts.length) {
        emptyState.style.display = "block";
        detailView.style.display = "none";
        if (selector) selector.style.display = "none";
        return;
    }

    emptyState.style.display = "none";
    detailView.style.display = "flex";

    if (activeAccounts.length > 1 && selector) {
        selector.style.display = "block";

        selector.innerHTML = activeAccounts.map((acc, i) => `
            <option value="${i}">
                ${escapeHTML(acc.planName || "—")} • $${(acc.accountSize || 0).toLocaleString()} • ${escapeHTML(acc.accountId || "")}
            </option>
        `).join("");

        selector.value = currentAccountIndex;
    } else if (selector) {
        selector.style.display = "none";
    }

    renderAccountDetail(activeAccounts[currentAccountIndex]);
}


function renderAccountDetail(challenge) {
    if (!challenge) return;

    $("detailPlanName").textContent = (challenge.planName || "—").toUpperCase();
    $("detailAccountSize").textContent = "$" + (challenge.accountSize || 0).toLocaleString();
    $("detailAccountId").textContent = challenge.accountId || challenge.id || "—";

    const balance = Number(challenge.balance || challenge.accountSize || 0);
    const equity  = Number(challenge.equity || balance);
    const profit  = Number(challenge.profit || 0);
    const winRate = Number(challenge.winRate || 0);
    const pFactor = Number(challenge.profitFactor || 0);
    const trades  = Number(challenge.totalTrades || 0);

    $("detailBalance").textContent = formatMoney(balance);
    $("detailEquity").textContent  = formatMoney(equity);
    $("detailProfit").textContent  = `${profit >= 0 ? "+" : "−"}${formatMoney(Math.abs(profit))}`;
    $("detailProfit").style.color  = profit >= 0 ? "var(--green)" : "var(--danger)";
    $("detailWinRate").textContent = winRate.toFixed(2) + "%";
    $("detailProfitFactor").textContent = pFactor.toFixed(2);
    $("detailTotalTrades").textContent = trades;

    renderEquityChart(challenge);
    renderCriticalEvents(challenge);
    renderDailyPnlCalendar(challenge);
}


// ============================================================
// EQUITY CHART
// ============================================================

function renderEquityChart(challenge) {
    const container = $("equityChart");
    if (!container) return;

    const equityHistory = challenge.equityHistory || [];

    if (!equityHistory.length) {
        container.innerHTML = `
            <div class="empty-state small" style="min-height:280px">
                <div class="empty-icon">📈</div>
                <strong>No chart data yet</strong>
                <span>Import an MT5 report to see your equity curve.</span>
            </div>
        `;
        return;
    }

    container.innerHTML = "";

    const categories = equityHistory.map(d => d.date);
    const balances   = equityHistory.map(d => Number(d.balance || 0));
    const equities   = equityHistory.map(d => Number(d.equity || d.balance || 0));

    const criticalEvents = challenge.criticalEvents || {};
    const breachPoint = criticalEvents.maxDrawdownBreach;
    const peakPoint   = criticalEvents.peakEquity;

    const annotations = { points: [] };

    if (peakPoint) {
        annotations.points.push({
            x: peakPoint.date,
            y: peakPoint.equity,
            marker: {
                size: 8,
                fillColor: "#20a86b",
                strokeColor: "#ffffff",
                strokeWidth: 3,
                shape: "circle"
            },
            label: {
                borderColor: "#20a86b",
                style: {
                    color: "#fff",
                    background: "#20a86b",
                    fontSize: "10px",
                    fontWeight: 900
                },
                text: `🟢 Peak $${peakPoint.equity.toFixed(0)}`
            }
        });
    }

    if (breachPoint) {
        annotations.points.push({
            x: breachPoint.date,
            y: breachPoint.equity,
            marker: {
                size: 8,
                fillColor: "#c53d4d",
                strokeColor: "#ffffff",
                strokeWidth: 3,
                shape: "circle"
            },
            label: {
                borderColor: "#c53d4d",
                style: {
                    color: "#fff",
                    background: "#c53d4d",
                    fontSize: "10px",
                    fontWeight: 900
                },
                text: `🔴 Breach $${breachPoint.equity.toFixed(0)}`
            }
        });
    }

    const options = {
        series: [
            { name: "Equity",  data: equities },
            { name: "Balance", data: balances }
        ],
        chart: {
            type: "area",
            height: 320,
            fontFamily: "Inter, sans-serif",
            toolbar: { show: false },
            zoom: { enabled: false },
            animations: { enabled: true, easing: "easeinout", speed: 800 }
        },
        colors: ["#20a86b", "#7442c8"],
        fill: {
            type: "gradient",
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.35,
                opacityTo: 0.02,
                stops: [0, 100]
            }
        },
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 3 },
        grid: {
            borderColor: "#e8e1f3",
            strokeDashArray: 4
        },
        markers: { size: 0, hover: { size: 6 } },
        xaxis: {
            categories: categories,
            labels: {
                style: {
                    colors: "#8a909d",
                    fontSize: "10px",
                    fontWeight: 700
                }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                style: {
                    colors: "#8a909d",
                    fontSize: "10px",
                    fontWeight: 700
                },
                formatter: (val) => "$" + Math.round(val).toLocaleString()
            }
        },
        legend: { show: false },
        tooltip: {
            theme: "light",
            y: { formatter: (val) => "$" + val.toFixed(2) }
        },
        annotations: annotations
    };

    if (equityChart) {
        equityChart.destroy();
    }

    equityChart = new ApexCharts(container, options);
    equityChart.render();
}


// ============================================================
// CRITICAL EVENTS
// ============================================================

function renderCriticalEvents(challenge) {
    const events = challenge.criticalEvents || {};
    const breach = events.maxDrawdownBreach;
    const peak   = events.peakEquity;
    const daily  = events.dailyBreaches || [];

    const breachCard = $("drawdownBreachCard");

    if (breachCard) {
        if (breach && breach.equity) {
            breachCard.style.display = "block";

            $("breachDate").textContent     = breach.date || "—";
            $("breachTime").textContent     = breach.time || "—";
            $("breachEquity").textContent   = formatMoneyAbs(breach.equity);
            $("breachBalance").textContent  = formatMoneyAbs(breach.balance);
            $("breachPct").textContent      = `-${Number(breach.drawdownPct || 0).toFixed(2)}%`;
            $("breachLimit").textContent    = `-${Number(breach.threshold || 0).toFixed(2)}%`;
        } else {
            breachCard.style.display = "none";
        }
    }

    const peakCard = $("peakEquityCard");

    if (peakCard) {
        if (peak && peak.equity) {
            peakCard.style.display = "block";

            $("peakDate").textContent      = peak.date || "—";
            $("peakTime").textContent      = peak.time || "—";
            $("peakEquity").textContent    = formatMoneyAbs(peak.equity);
            $("peakBalance").textContent   = formatMoneyAbs(peak.balance);
            $("peakProfitPct").textContent = `+${Number(peak.profitPct || 0).toFixed(2)}%`;
        } else {
            peakCard.style.display = "none";
        }
    }

    const dailyCard = $("dailyBreachesCard");

    if (dailyCard) {
        if (daily && daily.length) {
            dailyCard.style.display = "block";

            $("dailyBreachesList").innerHTML = daily.map(d => `
                <div class="daily-breach-item">
                    <div class="daily-breach-date">${escapeHTML(d.date)}</div>
                    <div class="daily-breach-time">${escapeHTML(d.breachTime)}</div>
                    <div class="daily-breach-dd">-${Number(d.maxDrawdownPct || 0).toFixed(2)}%</div>
                    <div class="daily-breach-limit">Limit: -${Number(d.threshold || 0).toFixed(2)}%</div>
                </div>
            `).join("");
        } else {
            dailyCard.style.display = "none";
        }
    }
}


// ============================================================
// DAILY P&L CALENDAR
// ============================================================

function renderDailyPnlCalendar(challenge) {
    const container = $("dailyPnlCalendar");
    const monthEl   = $("calendarMonth");
    if (!container) return;

    const dailyPnl = challenge.dailyPnl || {};
    const dates = Object.keys(dailyPnl).sort();

    if (!dates.length) {
        container.innerHTML = `
            <div class="empty-state small" style="min-height:200px;grid-column:1/-1">
                <div class="empty-icon">📅</div>
                <strong>No daily activity yet</strong>
                <span>Daily P&L will appear here after import.</span>
            </div>
        `;
        if (monthEl) monthEl.textContent = "—";
        return;
    }

    const lastDate = new Date(dates[dates.length - 1]);
    const year = lastDate.getFullYear();
    const month = lastDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];
    if (monthEl) monthEl.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const headers = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        .map(d => `<div class="calendar-day-header">${d}</div>`)
        .join("");

    let daysHtml = "";
    for (let i = 0; i < startWeekday; i++) {
        daysHtml += `<div class="calendar-day empty"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const data = dailyPnl[dateStr];

        if (data) {
            const cls = data.pnl > 0 ? "positive" : data.pnl < 0 ? "negative" : "zero";
            const sign = data.pnl > 0 ? "+" : data.pnl < 0 ? "−" : "";
            const formatted = sign + "$" + Math.abs(data.pnl).toFixed(2);

            daysHtml += `
                <div class="calendar-day ${cls}" title="${dateStr} • ${data.trades} trades">
                    <div class="calendar-day-number">${day}</div>
                    <div>
                        <div class="calendar-day-pnl">${formatted}</div>
                        <div class="calendar-day-trades">${data.trades} trades</div>
                    </div>
                </div>
            `;
        } else {
            daysHtml += `
                <div class="calendar-day zero">
                    <div class="calendar-day-number">${day}</div>
                    <div class="calendar-day-pnl">—</div>
                </div>
            `;
        }
    }

    container.innerHTML = headers + daysHtml;
}


// ============================================================
// ACCOUNT SELECTOR EVENT
// ============================================================

function initAccountSelectorEvent() {
    const selector = $("accountSelector");

    if (selector) {
        selector.addEventListener("change", (e) => {
            currentAccountIndex = Number(e.target.value) || 0;

            const activeAccounts = userChallenges.filter(
                c => c.mtLogin && c.mtPassword && c.mtServer
            );

            renderAccountDetail(activeAccounts[currentAccountIndex]);
        });
    }
}


// ============================================================
// CERTIFICATES — RENDER
// ============================================================

function renderCertificates() {
    const container = $("certificateGrid");
    const eligibilityBox = $("certEligibility");

    if (!container) return;

    const eligibility = calculateEligibility();

    if (eligibilityBox) {
        const eligibleTypes = Object.keys(eligibility).filter(k => eligibility[k]);
        const pendingTypes = userCertRequests
            .filter(r => r.status === "pending")
            .map(r => r.requestType);

        const newEligible = eligibleTypes.filter(t => !pendingTypes.includes(t));

        if (newEligible.length > 0) {
            eligibilityBox.style.display = "flex";
            eligibilityBox.innerHTML = `
                <span class="cert-eligibility-label">You are eligible for:</span>
                ${newEligible.map(t => `
                    <span class="cert-eligibility-pill">
                        ${escapeHTML(CERT_TYPES[t].label)}
                    </span>
                `).join("")}
            `;
        } else {
            eligibilityBox.style.display = "none";
        }
    }

    const certBadge = $("certificatesBadge");
    if (certBadge) {
        const count = userCertificates.length;
        if (count > 0) {
            certBadge.textContent = count;
            certBadge.style.display = "inline-flex";
        } else {
            certBadge.style.display = "none";
        }
    }

    if (!userCertificates.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">◇</div>
                <strong>No certificates yet</strong>
                <span>Request a certificate once you meet the eligibility criteria.</span>
            </div>
        `;
        return;
    }

    container.innerHTML = userCertificates.map(cert => {
        const typeInfo = CERT_TYPES[cert.type] || {
            label: cert.title || "Certificate",
            icon: "◇"
        };

        const statusClass =
            cert.status === "revoked" ? "revoked" :
            cert.status === "pending" ? "pending" :
            "";

        const statusLabel =
            cert.status === "revoked" ? "REVOKED" :
            cert.status === "pending" ? "PENDING" :
            "✓ VERIFIED";

        return `
            <div class="cert-card" data-cert-id="${cert.id}">

                <div class="cert-card-header">
                    <div class="cert-card-icon">${typeInfo.icon}</div>

                    <span class="cert-card-verify ${statusClass}">
                        ${statusLabel}
                    </span>
                </div>

                <span class="cert-card-type">${escapeHTML(cert.type.toUpperCase())}</span>
                <div class="cert-card-title">${escapeHTML(typeInfo.label)}</div>

                <div class="cert-card-details">
                    <div class="cert-card-detail highlight">
                        <span>Verification ID</span>
                        <strong>${escapeHTML(cert.verificationId || "—")}</strong>
                    </div>

                    <div class="cert-card-detail">
                        <span>Issued</span>
                        <strong>${formatDate(cert.issuedAt)}</strong>
                    </div>

                    <div class="cert-card-detail">
                        <span>Account Size</span>
                        <strong>$${Number(cert.accountSize || 0).toLocaleString()}</strong>
                    </div>

                    <div class="cert-card-detail">
                        <span>Plan</span>
                        <strong>${escapeHTML(cert.accountTypeLabel || "—")}</strong>
                    </div>

                    ${cert.type === "payout" && cert.payoutAmount ? `
                        <div class="cert-card-detail highlight" style="grid-column:1/-1">
                            <span>Payout Amount</span>
                            <strong>$${Number(cert.payoutAmount).toLocaleString()}</strong>
                        </div>
                    ` : ""}
                </div>

                <div class="cert-card-footer">
                    <span class="cert-card-date">
                        ${formatDate(cert.issuedAt)}
                    </span>

                    <div class="cert-card-actions">
                        <button class="cert-btn-view"
                                data-cert-view="${cert.id}">
                            View
                        </button>
                        <button class="cert-btn-download"
                                data-cert-download="${cert.id}"
                                title="Download PDF">
                            ⬇
                        </button>
                    </div>
                </div>

            </div>
        `;
    }).join("");

    container.querySelectorAll("[data-cert-view]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const cert = userCertificates.find(c => c.id === btn.dataset.certView);
            if (cert) openCertPreview(cert);
        });
    });

    container.querySelectorAll("[data-cert-download]").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const cert = userCertificates.find(c => c.id === btn.dataset.certDownload);
            if (!cert) return;

            await openCertPreview(cert);

            setTimeout(() => {
                downloadCertificatePDF();
            }, 1200);
        });
    });
}


// ============================================================
// CERTIFICATES — ELIGIBILITY
// ============================================================

function calculateEligibility() {
    const eligibility = {
        phase1: false,
        phase2: false,
        funded: false,
        payout: false
    };

    userChallenges.forEach(ch => {
        const planName = (ch.planName || ch.plan || "").toLowerCase();
        const profitTarget = parsePercent(ch.profitTarget ?? 10);
        const initialBalance = Number(ch.accountSize || 0);
        const equity = Number(ch.equity ?? ch.balance ?? initialBalance);

        if (initialBalance <= 0) return;

        const profitPct = ((equity - initialBalance) / initialBalance) * 100;

        const events = ch.criticalEvents || {};
        const hasBreach = !!events.maxDrawdownBreach?.equity;
        const hasDailyBreach = (events.dailyBreaches || []).length > 0;

        const passed = profitPct >= profitTarget && !hasBreach && !hasDailyBreach;

        if (planName.includes("phase 1") || planName.includes("phase1")) {
            if (passed) eligibility.phase1 = true;
        }

        if (planName.includes("phase 2") || planName.includes("phase2")) {
            if (passed) eligibility.phase2 = true;
        }

        if (ch.status === "funded" || planName.includes("funded")) {
            eligibility.funded = true;
        }
    });

    const hasPaidPayout = userPayouts.some(
        p => p.status === "paid" || p.status === "completed" || p.status === "success"
    );
    if (hasPaidPayout) eligibility.payout = true;

    userCertificates.forEach(c => {
        if (eligibility[c.type] !== undefined) {
            eligibility[c.type] = false;
        }
    });

    userCertRequests
        .filter(r => r.status === "pending")
        .forEach(r => {
            if (eligibility[r.requestType] !== undefined) {
                eligibility[r.requestType] = false;
            }
        });

    return eligibility;
}


// ============================================================
// CERTIFICATES — INIT EVENTS
// ============================================================

function initCertificateEvents() {
    const requestBtn        = $("requestCertButton");
    const requestModal      = $("certRequestModal");
    const requestModalClose = $("certRequestModalClose");
    const requestCancelBtn  = $("certRequestCancelBtn");
    const requestSubmitBtn  = $("certRequestSubmitBtn");
    const previewModal      = $("certPreviewModal");
    const previewClose      = $("certPreviewModalClose");
    const previewCloseBtn   = $("certPreviewCloseBtn");
    const downloadBtn       = $("certDownloadBtn");

    if (requestBtn) {
        requestBtn.addEventListener("click", openCertRequestModal);
    }

    if (requestModalClose) requestModalClose.addEventListener("click", closeCertRequestModal);
    if (requestCancelBtn)  requestCancelBtn.addEventListener("click", closeCertRequestModal);

    if (requestModal) {
        requestModal.addEventListener("click", (e) => {
            if (e.target === requestModal) closeCertRequestModal();
        });
    }

    if (requestSubmitBtn) {
        requestSubmitBtn.addEventListener("click", submitCertRequest);
    }

    if (previewClose)    previewClose.addEventListener("click", closeCertPreview);
    if (previewCloseBtn) previewCloseBtn.addEventListener("click", closeCertPreview);

    if (previewModal) {
        previewModal.addEventListener("click", (e) => {
            if (e.target === previewModal) closeCertPreview();
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener("click", downloadCertificatePDF);
    }
}


// ============================================================
// CERTIFICATES — REQUEST MODAL
// ============================================================

function openCertRequestModal() {
    const modal     = $("certRequestModal");
    const optionsEl = $("certRequestOptions");
    const errorEl   = $("certRequestError");

    if (!modal || !optionsEl) return;

    const eligibility = calculateEligibility();

    selectedCertType = null;
    errorEl.textContent = "";
    errorEl.classList.remove("show");

    optionsEl.innerHTML = Object.entries(CERT_TYPES).map(([key, info]) => {
        const isEligible = eligibility[key] === true;
        const disabledClass = isEligible ? "" : "disabled";

        return `
            <label class="cert-request-option ${disabledClass}" data-type="${key}">
                <input type="radio" name="certType" value="${key}" ${isEligible ? "" : "disabled"}>
                <div class="cert-request-option-icon">${info.icon}</div>
                <div class="cert-request-option-info">
                    <strong>${escapeHTML(info.label)}</strong>
                    <span>${escapeHTML(info.description)}</span>
                </div>
            </label>
        `;
    }).join("");

    optionsEl.querySelectorAll(".cert-request-option:not(.disabled)").forEach(opt => {
        opt.addEventListener("click", () => {
            optionsEl.querySelectorAll(".cert-request-option").forEach(o => {
                o.classList.remove("selected");
            });
            opt.classList.add("selected");
            selectedCertType = opt.dataset.type;

            const radio = opt.querySelector("input");
            if (radio) radio.checked = true;
        });
    });

    modal.classList.add("show");
}


function closeCertRequestModal() {
    const modal = $("certRequestModal");
    if (modal) modal.classList.remove("show");
    selectedCertType = null;
}


async function submitCertRequest() {
    const submitBtn = $("certRequestSubmitBtn");
    const errorEl   = $("certRequestError");

    if (!selectedCertType) {
        errorEl.textContent = "Please select a certificate type.";
        errorEl.classList.add("show");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
        let relatedChallenge = null;
        let accountType = "1step";
        let accountSize = 0;

        if (selectedCertType === "phase1" || selectedCertType === "phase2") {
            relatedChallenge = userChallenges.find(ch => {
                const p = (ch.planName || ch.plan || "").toLowerCase();
                if (selectedCertType === "phase1") return p.includes("phase 1") || p.includes("phase1");
                if (selectedCertType === "phase2") return p.includes("phase 2") || p.includes("phase2");
                return false;
            });
        } else if (selectedCertType === "funded") {
            relatedChallenge = userChallenges.find(
                ch => ch.status === "funded" || (ch.planName || "").toLowerCase().includes("funded")
            );
        }

        if (relatedChallenge) {
            accountSize = Number(relatedChallenge.accountSize || 0);
            accountType = detectAccountType(relatedChallenge.planName || relatedChallenge.plan);
        }

        let payoutAmount = 0;
        if (selectedCertType === "payout") {
            const paidPayouts = userPayouts.filter(
                p => p.status === "paid" || p.status === "completed" || p.status === "success"
            );
            payoutAmount = paidPayouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);
            const lastPayout = paidPayouts[0];
            if (lastPayout) {
                accountSize = accountSize || Number(lastPayout.accountSize || 0);
            }
        }

        await addDoc(collection(db, "certificate_requests"), {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            userName: `${currentUserData?.firstName || ""} ${currentUserData?.lastName || ""}`.trim() || currentUser.email,

            requestType: selectedCertType,
            accountType: accountType,
            accountSize: accountSize,
            payoutAmount: payoutAmount,

            status: "pending",
            requestedAt: serverTimestamp()
        });

        closeCertRequestModal();

        await loadUserCertRequests();
        renderCertificates();

        alert("✅ Your certificate request has been submitted. Our team will review it shortly.");

    } catch (err) {
        console.error("Submit cert request error:", err);
        errorEl.textContent = "Error: " + err.message;
        errorEl.classList.add("show");

    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Request";
    }
}


function detectAccountType(planName) {
    const p = (planName || "").toLowerCase();

    if (p.includes("instant")) return "instant";
    if (p.includes("2 step") && p.includes("pro")) return "2step_pro";
    if (p.includes("2 step")) return "2step_standard";
    if (p.includes("1 step") || p.includes("one step")) return "1step";

    return "1step";
}


// ============================================================
// CERTIFICATES — PREVIEW
// ============================================================

async function openCertPreview(cert) {
    const modal  = $("certPreviewModal");
    const canvas = $("certCanvas");

    if (!modal || !canvas) return;

    currentCertPreview = cert;

    const userName = cert.userName
        || `${currentUserData?.firstName || ""} ${currentUserData?.lastName || ""}`.trim()
        || "Trader";

    const typeInfo = CERT_TYPES[cert.type] || { label: cert.title || "Certificate" };

    const accountTypeLabel = cert.accountTypeLabel
        || ACCOUNT_TYPES_LABEL[cert.accountType]
        || "—";

    const issueDate = formatCertDate(cert.issuedAt);

    canvas.innerHTML = `
        <!-- نوار بالا -->
        <div class="cert-bar-top"></div>

        <!-- واترمارک لوگو -->
        <div class="cert-watermark">
            <img src="../assets/logo-purple.png" alt="">
        </div>

        <!-- قاب -->
        <div class="cert-canvas-border"></div>

        <!-- گوشه‌ها -->
        <div class="cert-corner tl"></div>
        <div class="cert-corner tr"></div>
        <div class="cert-corner bl"></div>
        <div class="cert-corner br"></div>

        <!-- محتوا -->
        <div class="cert-content">

            <div class="cert-brand">
                <img src="../assets/logo-purple.png" alt="RISE FUNDED">
                <div class="cert-brand-text">
                    <strong>RISE</strong>
                    <span>FUNDED</span>
                </div>
            </div>

            <div class="cert-label">Certificate of Achievement</div>

            <div class="cert-main-title">${escapeHTML(typeInfo.label)}</div>

            <div class="cert-divider">
                <span class="cert-divider-icon">◆</span>
            </div>

            <div class="cert-presented">This certificate is proudly presented to</div>

            <div class="cert-name">${escapeHTML(userName)}</div>

            <div class="cert-subtext">for successfully completing</div>

            <div class="cert-achievement">${escapeHTML(typeInfo.label)}</div>

            <div class="cert-meta">
                <div class="cert-meta-item">
                    <span>Account Size</span>
                    <strong>$${Number(cert.accountSize || 0).toLocaleString()}</strong>
                </div>

                <div class="cert-meta-item">
                    <span>Plan</span>
                    <strong>${escapeHTML(accountTypeLabel)}</strong>
                </div>

                ${cert.type === "payout" && cert.payoutAmount ? `
                    <div class="cert-meta-item">
                        <span>Payout</span>
                        <strong>$${Number(cert.payoutAmount).toLocaleString()}</strong>
                    </div>
                ` : ""}
            </div>

            <div class="cert-separator"></div>

            <div class="cert-bottom">

    <div class="cert-bottom-block">
        <div class="cert-bottom-label">Issue Date</div>
        <div class="cert-bottom-value">${escapeHTML(issueDate)}</div>
    </div>

    <div class="cert-bottom-block">
        <div class="cert-qr" id="certQrContainer"></div>
    </div>

    <div class="cert-bottom-block">
        <div class="cert-signature-block">
            <img src="../assets/signature.png" alt="Signature" class="cert-signature-img">
            <div class="cert-signature-line-script"></div>
            <div class="cert-signature-title">CEO Of Rise Funded</div>
        </div>

    </div>

</div>

</div>

        <!-- نوار پایین -->
        <div class="cert-bar-bottom"></div>
    `;

/* --- QR Code --- */
    const qrContainer = canvas.querySelector("#certQrContainer");

    if (qrContainer && typeof qrcode !== "undefined") {
        try {
            qrContainer.innerHTML = "";

            /* --- محاسبه verification ID --- */
            const verifyId = cert.verificationId
                || cert.certId
                || cert.id;

            console.log("🔍 Cert data:", cert);
            console.log("🔍 verificationId:", cert.verificationId);
            console.log("🔍 certId:", cert.certId);
            console.log("🔍 id:", cert.id);
            console.log("🔍 Using:", verifyId);

            if (!verifyId) {
                console.error("❌ No verification ID for QR");
                qrContainer.innerHTML = `<div style="font-size:8px;color:#8a909d;text-align:center">No ID</div>`;
                modal.classList.add("show");
                document.body.style.overflow = "hidden";
                return;
            }

            const qr = qrcode(0, 'M');
            qr.addData(`https://rise-funded.web.app/verify.html?id=${verifyId}`);
            qr.make();

            const svgString = qr.createSvgTag({
                scalable: true,
                margin: 1,
                cellSize: 4
            });

            const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);

            const qrImg = new Image();
            qrImg.alt = "QR Code";
            qrImg.style.width  = "82px";
            qrImg.style.height = "82px";
            qrImg.style.display = "block";
            qrImg.src = url;

            qrContainer.appendChild(qrImg);

        } catch (qrErr) {
            console.error("QR error:", qrErr);
        }
    }

    modal.classList.add("show");
    document.body.style.overflow = "hidden";
}


function closeCertPreview() {
    const modal = $("certPreviewModal");
    if (modal) modal.classList.remove("show");
    document.body.style.overflow = "";
    currentCertPreview = null;
}


function formatCertDate(value) {
    if (!value) return "—";

    try {
        let date;

        if (value && typeof value.toDate === "function") {
            date = value.toDate();
        } else {
            date = new Date(value);
        }

        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        }).format(date);

    } catch {
        return "—";
    }
}


// ============================================================
// CERTIFICATES — PDF DOWNLOAD
// ============================================================

async function downloadCertificatePDF() {
    const canvas = $("certCanvas");
    const btn    = $("certDownloadBtn");

    if (!canvas || !currentCertPreview) return;

    btn.disabled = true;
    btn.textContent = "⏳ Preparing...";

    try {
        if (document.fonts && document.fonts.ready) {
            try { await document.fonts.ready; } catch {}
        }

        await new Promise(r => setTimeout(r, 800));

        const rendered = await html2canvas(canvas, {
            scale: 2,
            backgroundColor: "#fefeff",
            useCORS: true,
            logging: false,
            allowTaint: true,
            imageTimeout: 15000,
            removeContainer: true
        });

        const imgData = rendered.toDataURL("image/png");

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4"
        });

        const pdfWidth  = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const imgRatio  = rendered.width / rendered.height;
        const pdfRatio  = pdfWidth / pdfHeight;

        let imgWidth, imgHeight;

        if (imgRatio > pdfRatio) {
            imgWidth  = pdfWidth - 20;
            imgHeight = imgWidth / imgRatio;
        } else {
            imgHeight = pdfHeight - 20;
            imgWidth  = imgHeight * imgRatio;
        }

        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;

        pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);

        const fileName = `RISE-FUNDED-Certificate-${currentCertPreview.verificationId || currentCertPreview.id}.pdf`;

        pdf.save(fileName);

    } catch (err) {
        console.error("PDF download error:", err);
        alert("Could not generate PDF. Please try again.");

    } finally {
        btn.disabled = false;
        btn.textContent = "⬇ Download PDF";
    }
}


// ============================================================
// PROFILE
// ============================================================

function renderProfile() {
    const firstName = currentUserData?.firstName || "—";
    const lastName  = currentUserData?.lastName  || "—";
    const username  = currentUserData?.username  || "trader";

    $("profileFullName").textContent = `${firstName} ${lastName}`.trim();
    $("profileUsername").textContent = `@${username}`;
    $("profileFirstName").textContent = firstName;
    $("profileLastName").textContent  = lastName;

    $("profileEmail").textContent =
        currentUserData?.email ||
        currentUser?.email ||
        "—";

    $("profileCountry").textContent =
        currentUserData?.country || "—";

    $("profilePhone").textContent =
        currentUserData?.phone || "—";
}


// ============================================================
// KYC — RENDER
// ============================================================

function renderKyc() {
    const badge = $("kycStatusBadge");
    const content = $("kycContent");
    const navBadge = $("kycBadge");

    if (!badge || !content) return;

    /* --- تعیین وضعیت --- */
    let status = currentUserData?.kycStatus || "not_verified";
    let latestRequest = userKycRequests[0];

    /* --- چک درخواست pending --- */
    if (latestRequest && latestRequest.status === "pending") {
        status = "pending";
    }

    /* --- آپدیت nav badge --- */
    if (navBadge) {
        if (status === "not_verified" || status === "rejected") {
            navBadge.style.display = "inline-flex";
        } else {
            navBadge.style.display = "none";
        }
    }

    /* --- Badge --- */
    const statusLabels = {
        not_verified: { label: "NOT VERIFIED", class: "not-verified" },
        pending:      { label: "UNDER REVIEW", class: "pending" },
        verified:     { label: "VERIFIED",     class: "verified" },
        rejected:     { label: "REJECTED",     class: "rejected" }
    };

    const statusInfo = statusLabels[status] || statusLabels.not_verified;

    badge.className = `kyc-status-badge ${statusInfo.class}`;
    badge.innerHTML = `
        <span class="kyc-status-dot"></span>
        ${statusInfo.label}
    `;

    /* --- Content --- */
    if (status === "not_verified") {
        content.innerHTML = `
            <div class="kyc-empty">
                <div class="kyc-empty-icon">🛡️</div>
                <h4>Verify Your Identity</h4>
                <p>
                    To unlock withdrawals and keep your account secure,
                    please complete identity verification. Our team will review
                    your documents within 24 hours.
                </p>
                <button type="button" class="kyc-start-btn" id="kycStartBtn">
                    🛡️ Start Verification
                </button>
            </div>
        `;

        const startBtn = $("kycStartBtn");
        if (startBtn) {
            startBtn.addEventListener("click", openKycModal);
        }

    } else if (status === "pending") {
        content.innerHTML = `
            <div class="kyc-pending-box">
                <div class="kyc-box-icon">⏳</div>
                <div class="kyc-box-content">
                    <h4>Verification in Progress</h4>
                    <p>
                        We've received your KYC request and are currently reviewing
                        your documents. This usually takes less than 24 hours.
                    </p>
                    ${latestRequest ? `
                        <div class="kyc-box-meta">
                            <div class="kyc-box-meta-item">
                                Submitted: ${formatDateTime(latestRequest.submittedAt)}
                            </div>
                            <div class="kyc-box-meta-item">
                                Type: ${escapeHTML(latestRequest.documentType || "—").toUpperCase()}
                            </div>
                        </div>
                    ` : ""}
                </div>
            </div>
        `;

    } else if (status === "verified") {
        content.innerHTML = `
            <div class="kyc-verified-box">
                <div class="kyc-box-icon">✅</div>
                <div class="kyc-box-content">
                    <h4>Identity Verified</h4>
                    <p>
                        Your identity has been successfully verified.
                        You're now eligible for payouts and withdrawals.
                    </p>
                    <div class="kyc-box-meta">
                        <div class="kyc-box-meta-item">
                            Verified: ${formatDateTime(currentUserData?.kycVerifiedAt)}
                        </div>
                    </div>
                </div>
            </div>
        `;

    } else if (status === "rejected") {
        content.innerHTML = `
            <div class="kyc-rejected-box">
                <div class="kyc-box-icon">❌</div>
                <div class="kyc-box-content">
                    <h4>Verification Failed</h4>
                    <p>
                        Unfortunately, your KYC verification was rejected.
                        You can re-submit with correct documents.
                    </p>
                    ${currentUserData?.kycRejectReason ? `
                        <div class="kyc-reject-reason">
                            <strong>Reason:</strong>
                            ${escapeHTML(currentUserData.kycRejectReason)}
                        </div>
                    ` : ""}
                    <button type="button" class="kyc-resubmit-btn" id="kycResubmitBtn">
                        🔄 Re-submit Documents
                    </button>
                </div>
            </div>
        `;

        const resubmitBtn = $("kycResubmitBtn");
        if (resubmitBtn) {
            resubmitBtn.addEventListener("click", openKycModal);
        }
    }
}


// ============================================================
// KYC — MODAL
// ============================================================

function openKycModal() {
    const modal = $("kycModal");
    const errorEl = $("kycError");

    if (!modal) return;

    /* --- پر کردن فیلدها --- */
    $("kycFullName").value = currentUserData?.kycFullName
        || `${currentUserData?.firstName || ""} ${currentUserData?.lastName || ""}`.trim()
        || "";

    $("kycDocumentType").value = currentUserData?.kycDocumentType || "";
    $("kycCountry").value = currentUserData?.kycCountry || currentUserData?.country || "";
    $("kycDocumentNumber").value = currentUserData?.kycDocumentNumber || "";

    errorEl.textContent = "";
    errorEl.classList.remove("show");

    modal.classList.add("show");
}


function closeKycModal() {
    const modal = $("kycModal");
    if (modal) modal.classList.remove("show");
}


function initKycEvents() {
    const modal      = $("kycModal");
    const closeBtn   = $("kycModalClose");
    const cancelBtn  = $("kycCancelBtn");
    const submitBtn  = $("kycSubmitBtn");

    if (closeBtn)  closeBtn.addEventListener("click", closeKycModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeKycModal);

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeKycModal();
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", submitKycRequest);
    }
}


async function submitKycRequest() {
    const submitBtn = $("kycSubmitBtn");
    const errorEl   = $("kycError");

    const fullName       = $("kycFullName").value.trim();
    const documentType   = $("kycDocumentType").value;
    const country        = $("kycCountry").value;
    const documentNumber = $("kycDocumentNumber").value.trim();

    /* --- اعتبارسنجی --- */
    if (!fullName || fullName.length < 3) {
        errorEl.textContent = "Please enter your full legal name (at least 3 characters).";
        errorEl.classList.add("show");
        return;
    }

    if (!documentType) {
        errorEl.textContent = "Please select your document type.";
        errorEl.classList.add("show");
        return;
    }

    if (!country) {
        errorEl.textContent = "Please select your country.";
        errorEl.classList.add("show");
        return;
    }

    if (!documentNumber || documentNumber.length < 3) {
        errorEl.textContent = "Please enter your document number.";
        errorEl.classList.add("show");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";

    try {
        /* --- ثبت درخواست KYC --- */
        await addDoc(collection(db, "kyc_requests"), {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            userName: `${currentUserData?.firstName || ""} ${currentUserData?.lastName || ""}`.trim() || currentUser.email,

            fullName: fullName,
            documentType: documentType,
            country: country,
            documentNumber: documentNumber,

            status: "pending",
            submittedAt: serverTimestamp()
        });

        /* --- آپدیت user --- */
        await updateDoc(doc(db, "users", currentUser.uid), {
            kycStatus: "pending",
            kycFullName: fullName,
            kycDocumentType: documentType,
            kycCountry: country,
            kycDocumentNumber: documentNumber,
            kycSubmittedAt: serverTimestamp()
        });

        /* --- آپدیت local --- */
        currentUserData.kycStatus = "pending";
        currentUserData.kycFullName = fullName;

        /* --- ساخت لینک mailto --- */
        const subject = `KYC Verification - ${fullName} - ${currentUser.uid}`;

        const body =
            `Hello RISE FUNDED Support,\n\n` +
            `I would like to complete my KYC verification.\n\n` +
            `My Details:\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Full Name: ${fullName}\n` +
            `Email: ${currentUser.email}\n` +
            `User ID: ${currentUser.uid}\n` +
            `Country: ${country}\n` +
            `Document Type: ${documentType}\n` +
            `Document Number: ${documentNumber}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `Please find my documents attached:\n` +
            `1. ID Document (Front)\n` +
            `2. Selfie holding ID\n\n` +
            `Thank you.`;

        const mailtoLink =
            `mailto:risefunded.support@gmail.com` +
            `?subject=${encodeURIComponent(subject)}` +
            `&body=${encodeURIComponent(body)}`;

        /* --- باز کردن ایمیل --- */
        window.location.href = mailtoLink;

        /* --- Reload --- */
        await loadUserKycRequests();
        renderKyc();
        closeKycModal();

        setTimeout(() => {
            alert(
                "✅ Your KYC request has been submitted!\n\n" +
                "📧 A new email window has been opened.\n\n" +
                "Please ATTACH your documents:\n" +
                "1. ID Document (Front)\n" +
                "2. Selfie holding ID\n\n" +
                "Then click Send."
            );
        }, 500);

    } catch (err) {
        console.error("Submit KYC error:", err);
        errorEl.textContent = "Error: " + err.message;
        errorEl.classList.add("show");

    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "📧 Send Documents via Email";
    }
}


// ============================================================
// WITHDRAWALS — RENDER
// ============================================================

function renderWithdrawals() {
    const container = $("withdrawalsList");

    if (!container) return;

    if (!userWithdrawals.length) {
        container.innerHTML = `
            <div class="empty-state small">
                <div class="empty-icon">↑</div>
                <strong>No withdrawal requests yet</strong>
                <span>Request a withdrawal to get started.</span>
            </div>
        `;
        return;
    }

    container.innerHTML = userWithdrawals.map(wd => {
        const status = wd.status || "pending";

        const statusLabels = {
            pending:  "⏳ PENDING",
            approved: "✓ APPROVED",
            paid:     "✅ PAID",
            rejected: "❌ REJECTED"
        };

        return `
            <div class="withdrawal-card status-${status}">

                <div class="withdrawal-left">

                    <div class="withdrawal-header">
                        <div class="withdrawal-icon">↑</div>
                        <div class="withdrawal-info">
                            <strong>${formatMoney(wd.amount)}</strong>
                            <span>${escapeHTML(wd.accountId || "—")}</span>
                        </div>
                    </div>

                    <div class="withdrawal-meta">
                        <span class="withdrawal-tag amount">
                            ${escapeHTML(wd.network || "—")}
                        </span>
                        <span class="withdrawal-tag">
                            ${escapeHTML(wd.walletAddress?.slice(0, 12) || "—")}...
                        </span>
                    </div>

                </div>

                <div class="withdrawal-right">
                    <span class="withdrawal-status ${status}">
                        ${statusLabels[status] || status.toUpperCase()}
                    </span>
                    <span class="withdrawal-date">
                        ${formatDate(wd.requestedAt)}
                    </span>
                </div>

            </div>
        `;
    }).join("");
}


// ============================================================
// WITHDRAWALS — MODAL
// ============================================================

function openWithdrawalModal() {
    const modal = $("withdrawalModal");
    const errorEl = $("withdrawalError");
    const accountSelect = $("wdAccount");

    if (!modal) return;

    errorEl.textContent = "";
    errorEl.classList.remove("show");

    /* --- KYC check --- */
    if (currentUserData?.kycStatus !== "verified") {
        alert(
            "🔒 KYC Verification Required\n\n" +
            "You must complete KYC verification before requesting a withdrawal.\n\n" +
            "Please go to Profile → KYC Verification."
        );
        switchSection("profile");
        return;
    }

    /* --- پر کردن حساب‌ها (فقط Funded) --- */
    const fundedAccounts = userChallenges.filter(ch =>
        (ch.status === "funded" || (ch.planName || "").toLowerCase().includes("funded"))
        && ch.mtLogin
    );

    if (!fundedAccounts.length) {
        alert(
            "❌ No Funded Accounts\n\n" +
            "You don't have any funded accounts yet. " +
            "Complete a challenge first to unlock withdrawals."
        );
        return;
    }

    accountSelect.innerHTML = `
        <option value="">— Select an account —</option>
        ${fundedAccounts.map(acc => `
            <option value="${acc.id}"
                    data-balance="${acc.balance || acc.accountSize || 0}"
                    data-accountid="${acc.accountId || acc.id}">
                ${escapeHTML(acc.planName || "Funded Account")} • $${(acc.accountSize || 0).toLocaleString()} • ${escapeHTML(acc.accountId || "")}
            </option>
        `).join("")}
    `;

    /* --- ریست --- */
    $("wdAmount").value = "";
    $("wdNetwork").value = "";
    $("wdWallet").value = "";
    $("wdAvailableHint").textContent = "Available: $0.00";

    /* --- آپدیت hint موقع انتخاب حساب --- */
    accountSelect.onchange = function () {
        const selected = this.options[this.selectedIndex];
        const balance = Number(selected.dataset.balance) || 0;
        $("wdAvailableHint").textContent = `Available: ${formatMoney(balance)}`;
    };

    modal.classList.add("show");
}


function closeWithdrawalModal() {
    const modal = $("withdrawalModal");
    if (modal) modal.classList.remove("show");
}


function initWithdrawalEvents() {
    const requestBtn = $("requestWithdrawalBtn");
    const modal      = $("withdrawalModal");
    const closeBtn   = $("withdrawalModalClose");
    const cancelBtn  = $("withdrawalCancelBtn");
    const submitBtn  = $("withdrawalSubmitBtn");

    if (requestBtn) requestBtn.addEventListener("click", openWithdrawalModal);
    if (closeBtn)   closeBtn.addEventListener("click", closeWithdrawalModal);
    if (cancelBtn)  cancelBtn.addEventListener("click", closeWithdrawalModal);

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeWithdrawalModal();
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", submitWithdrawal);
    }
}


async function submitWithdrawal() {
    const submitBtn = $("withdrawalSubmitBtn");
    const errorEl   = $("withdrawalError");

    const accountId     = $("wdAccount").value;
    const amount        = Number($("wdAmount").value);
    const network       = $("wdNetwork").value;
    const walletAddress = $("wdWallet").value.trim();

    /* --- اعتبارسنجی --- */
    if (!accountId) {
        errorEl.textContent = "Please select an account.";
        errorEl.classList.add("show");
        return;
    }

    if (!amount || amount < 10) {
        errorEl.textContent = "Minimum withdrawal amount is $10.";
        errorEl.classList.add("show");
        return;
    }

    if (!network) {
        errorEl.textContent = "Please select a network.";
        errorEl.classList.add("show");
        return;
    }

    if (!walletAddress || walletAddress.length < 20) {
        errorEl.textContent = "Please enter a valid wallet address.";
        errorEl.classList.add("show");
        return;
    }

    /* --- گرفتن accountId --- */
    const selectedAcc = userChallenges.find(c => c.id === accountId);
    const realAccountId = selectedAcc?.accountId || accountId;

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
        await addDoc(collection(db, "withdrawal_requests"), {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            userName: `${currentUserData?.firstName || ""} ${currentUserData?.lastName || ""}`.trim() || currentUser.email,

            accountDocId: accountId,
            accountId: realAccountId,

            amount: amount,
            network: network,
            walletAddress: walletAddress,

            status: "pending",
            requestedAt: serverTimestamp()
        });

        await loadUserWithdrawals();
        renderWithdrawals();
        closeWithdrawalModal();

        alert("✅ Withdrawal request submitted! Our team will review it within 24 hours.");

    } catch (err) {
        console.error("Submit withdrawal error:", err);
        errorEl.textContent = "Error: " + err.message;
        errorEl.classList.add("show");

    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Request";
    }
}


// ============================================================
// SUPPORT — LOAD TICKETS
// ============================================================

async function loadUserTickets() {
    if (!currentUser) return;

    try {
        const q = query(
            collection(db, "support_tickets"),
            where("userId", "==", currentUser.uid),
            orderBy("updatedAt", "desc")
        );

        const snap = await getDocs(q);

        userTickets = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

    } catch (err) {
        console.error("Load tickets error:", err);
        userTickets = [];
    }
}


// ============================================================
// SUPPORT — RENDER TICKETS LIST
// ============================================================

function renderSupport() {
    const container = $("ticketsList");
    if (!container) return;

    const openCount = userTickets.filter(
        t => t.status === "open" || t.status === "pending"
    ).length;

    const badge = $("supportBadge");
    if (badge) {
        if (openCount > 0) {
            badge.textContent = openCount;
            badge.style.display = "inline-flex";
        } else {
            badge.style.display = "none";
        }
    }

    if (!userTickets.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">?</div>
                <strong>No support tickets yet</strong>
                <span>Create a ticket and our team will help you shortly.</span>
                <button type="button" class="primary-button" id="emptyNewTicketBtn">
                    Create First Ticket
                </button>
            </div>
        `;

        const emptyBtn = $("emptyNewTicketBtn");
        if (emptyBtn) emptyBtn.addEventListener("click", openTicketModal);

        return;
    }

    container.innerHTML = userTickets.map(ticket => {
        const status = ticket.status || "open";

        const statusClass =
            status === "resolved" ? "resolved" :
            status === "pending"  ? "pending" :
            "open";

        const statusLabel =
            status === "resolved" ? "✅ Resolved" :
            status === "pending"  ? "🟡 Pending" :
            "🟢 Open";

        return `
            <div class="ticket-item" data-ticket-id="${ticket.id}">
                <div class="ticket-item-top">
                    <strong class="ticket-item-subject">
                        ${escapeHTML(ticket.subject || "Support Ticket")}
                    </strong>
                    <span class="ticket-status ${statusClass}">
                        ${statusLabel}
                    </span>
                </div>

                <p class="ticket-item-preview">
                    ${escapeHTML(ticket.lastMessage || "—")}
                </p>

                <div class="ticket-item-bottom">
                    <span>${formatDateTime(ticket.lastMessageAt || ticket.createdAt)}</span>
                    <span class="ticket-item-action">Open Chat →</span>
                </div>
            </div>
        `;
    }).join("");

    container.querySelectorAll(".ticket-item").forEach(item => {
        item.addEventListener("click", () => {
            openChatPanel(item.dataset.ticketId);
        });
    });
}


// ============================================================
// TICKET MODAL
// ============================================================

function openTicketModal() {
    const modal    = $("ticketModal");
    const subject  = $("ticketSubject");
    const message  = $("ticketMessage");
    const error    = $("ticketModalError");

    if (!modal) return;

    subject.value = "";
    message.value = "";
    error.textContent = "";
    error.classList.remove("show");

    modal.classList.add("show");
    subject.focus();
}


function closeTicketModal() {
    const modal = $("ticketModal");
    if (modal) modal.classList.remove("show");
}


async function createTicket() {
    const subjectEl = $("ticketSubject");
    const messageEl = $("ticketMessage");
    const errorEl   = $("ticketModalError");
    const createBtn = $("createTicketBtn");

    const subject = subjectEl.value.trim();
    const message = messageEl.value.trim();

    if (!subject || subject.length < 3) {
        errorEl.textContent = "Please enter a subject (at least 3 characters).";
        errorEl.classList.add("show");
        return;
    }

    if (!message || message.length < 5) {
        errorEl.textContent = "Please describe your issue (at least 5 characters).";
        errorEl.classList.add("show");
        return;
    }

    createBtn.disabled = true;
    createBtn.textContent = "Creating...";

    try {
        const userName =
            `${currentUserData?.firstName || ""} ${currentUserData?.lastName || ""}`.trim()
            || currentUser.email;

        const ticketRef = await addDoc(collection(db, "support_tickets"), {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            userName,
            subject,
            status: "open",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastMessage: message,
            lastMessageAt: serverTimestamp()
        });

        await addDoc(
            collection(db, "support_tickets", ticketRef.id, "messages"),
            {
                senderId: currentUser.uid,
                senderType: "user",
                senderName: userName,
                text: message,
                createdAt: serverTimestamp()
            }
        );

        closeTicketModal();

        await loadUserTickets();
        renderSupport();

        setTimeout(() => {
            openChatPanel(ticketRef.id);
        }, 300);

    } catch (err) {
        console.error("Create ticket error:", err);
        errorEl.textContent = "Error: " + err.message;
        errorEl.classList.add("show");

    } finally {
        createBtn.disabled = false;
        createBtn.textContent = "Create Ticket";
    }
}


// ============================================================
// CHAT PANEL
// ============================================================

async function openChatPanel(ticketId) {
    const panel = $("chatPanel");
    if (!panel) return;

    currentTicketId = ticketId;

    const ticket = userTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    $("chatPanelSubject").textContent =
        ticket.subject || "Support Ticket";

    const statusEl = $("chatPanelStatus");
    const status = ticket.status || "open";

    statusEl.textContent =
        status === "resolved" ? "Resolved" :
        status === "pending"  ? "Pending" :
        "Open";

    statusEl.className = "chat-panel-status " + status;

    panel.classList.add("show");

    await loadTicketMessages(ticketId);

    if (currentTicketUnsub) {
        currentTicketUnsub();
    }

    currentTicketUnsub = onSnapshot(
        query(
            collection(db, "support_tickets", ticketId, "messages"),
            orderBy("createdAt", "asc")
        ),
        (snap) => {
            const messages = snap.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));
            renderMessages(messages);
        },
        (err) => console.error("Snapshot error:", err)
    );
}


async function loadTicketMessages(ticketId) {
    try {
        const q = query(
            collection(db, "support_tickets", ticketId, "messages"),
            orderBy("createdAt", "asc")
        );

        const snap = await getDocs(q);

        const messages = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        renderMessages(messages);

    } catch (err) {
        console.error("Load messages error:", err);
    }
}


function renderMessages(messages) {
    const container = $("chatMessages");
    if (!container) return;

    if (!messages.length) {
        container.innerHTML = `
            <div class="chat-empty">
                <span>No messages yet.</span>
            </div>
        `;
        return;
    }

    container.innerHTML = messages.map(msg => {
        const isUser = msg.senderType === "user";

        const senderName = escapeHTML(
            msg.senderName || (isUser ? "You" : "Support")
        );

        return `
            <div class="chat-message ${isUser ? "from-user" : "from-support"}">
                <div class="chat-message-meta">
                    <strong>${senderName}</strong>
                    <span>${formatDateTime(msg.createdAt)}</span>
                </div>
                <div class="chat-message-bubble">
                    ${escapeHTML(msg.text)}
                </div>
            </div>
        `;
    }).join("");

    container.scrollTop = container.scrollHeight;
}


async function sendChatMessage() {
    const input   = $("chatInput");
    const sendBtn = $("chatSendBtn");

    if (!input || !currentTicketId) return;

    const text = input.value.trim();
    if (!text) return;

    sendBtn.disabled = true;
    input.disabled   = true;

    try {
        const userName =
            `${currentUserData?.firstName || ""} ${currentUserData?.lastName || ""}`.trim()
            || currentUser.email;

        await addDoc(
            collection(db, "support_tickets", currentTicketId, "messages"),
            {
                senderId: currentUser.uid,
                senderType: "user",
                senderName: userName,
                text,
                createdAt: serverTimestamp()
            }
        );

        await updateDoc(
            doc(db, "support_tickets", currentTicketId),
            {
                lastMessage: text,
                lastMessageAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                status: "open"
            }
        );

        input.value = "";
        input.style.height = "auto";

        const t = userTickets.find(x => x.id === currentTicketId);
        if (t) {
            t.lastMessage = text;
            t.status = "open";
        }

    } catch (err) {
        console.error("Send message error:", err);
        alert("Could not send message: " + err.message);

    } finally {
        sendBtn.disabled = false;
        input.disabled   = false;
        input.focus();
    }
}


function closeChatPanel() {
    const panel = $("chatPanel");
    if (panel) panel.classList.remove("show");

    if (currentTicketUnsub) {
        currentTicketUnsub();
        currentTicketUnsub = null;
    }

    currentTicketId = null;
    renderSupport();
}


// ============================================================
// NOTIFICATIONS
// ============================================================

async function loadNotifications() {
    if (!currentUser) return [];

    try {
        const q = query(
            collection(db, "users", currentUser.uid, "notifications"),
            orderBy("createdAt", "desc"),
            limit(20)
        );

        const snap = await getDocs(q);

        return snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

    } catch (err) {
        console.error("Load notifications error:", err);
        return [];
    }
}


async function refreshNotifications() {
    const notifications = await loadNotifications();

    const container = $("notificationList");
    const dot       = $("notificationDot");

    if (!container) return;

    const unread = notifications.filter(n => !n.read);

    if (dot) {
        dot.style.display = unread.length > 0 ? "block" : "none";
    }

    if (!notifications.length) {
        container.innerHTML = `
            <div class="notification-empty">
                <div>♢</div>
                <strong>No notifications yet</strong>
                <span>You're all caught up.</span>
            </div>
        `;
        return;
    }

    container.innerHTML = notifications.map(n => `
        <div class="notification-item ${n.read ? "" : "unread"}">
            <div class="notification-icon">${n.icon || "🔔"}</div>
            <div class="notification-content">
                <strong>${escapeHTML(n.title || "Notification")}</strong>
                <span>${escapeHTML(n.message || "")}</span>
                <small>${formatDateTime(n.createdAt)}</small>
            </div>
        </div>
    `).join("");
}


// ============================================================
// SUPPORT EVENTS
// ============================================================

function initSupportEvents() {
    const newTicketBtn      = $("newTicketBtn");
    const emptyNewTicketBtn = $("emptyNewTicketBtn");
    const ticketModalClose  = $("ticketModalClose");
    const cancelTicketBtn   = $("cancelTicketBtn");
    const createTicketBtn   = $("createTicketBtn");
    const chatBackBtn       = $("chatBackBtn");
    const chatSendBtn       = $("chatSendBtn");
    const chatInput         = $("chatInput");

    if (newTicketBtn)      newTicketBtn.addEventListener("click", openTicketModal);
    if (emptyNewTicketBtn) emptyNewTicketBtn.addEventListener("click", openTicketModal);
    if (ticketModalClose)  ticketModalClose.addEventListener("click", closeTicketModal);
    if (cancelTicketBtn)   cancelTicketBtn.addEventListener("click", closeTicketModal);
    if (createTicketBtn)   createTicketBtn.addEventListener("click", createTicket);
    if (chatBackBtn)       chatBackBtn.addEventListener("click", closeChatPanel);
    if (chatSendBtn)       chatSendBtn.addEventListener("click", sendChatMessage);

    if (chatInput) {
        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });

        chatInput.addEventListener("input", () => {
            chatInput.style.height = "auto";
            chatInput.style.height =
                Math.min(chatInput.scrollHeight, 120) + "px";
        });
    }
}


// ============================================================
// NAVIGATION
// ============================================================

document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", event => {
        event.preventDefault();

        const section = item.dataset.section;

        switchSection(section);

        sidebar.classList.remove("open");
    });
});


document.querySelectorAll("[data-section-link]").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        switchSection(link.dataset.sectionLink);
    });
});


function switchSection(sectionName) {
    document.querySelectorAll(".dashboard-section").forEach(section => {
        section.classList.remove("active-section");
    });

    const target = document.getElementById(`section-${sectionName}`);

    if (!target) return;

    target.classList.add("active-section");

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.toggle(
            "active",
            item.dataset.section === sectionName
        );
    });

    const titles = {
        overview:     "Overview",
        challenges:   "My Challenges",
        accounts:     "Trading Accounts",
        payouts:      "Payouts",
        transactions: "Transactions",
        certificates: "Certificates",
        profile:      "Profile",
        support:      "Support"
    };

    pageTitle.textContent = titles[sectionName] || "Overview";

    if (sectionName === "accounts") {
        renderAccounts();
    }

    if (sectionName === "certificates") {
        renderCertificates();
    }

    if (sectionName === "profile") {
        renderKyc();
    }

    if (sectionName === "payouts") {
        renderWithdrawals();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}


// ============================================================
// MOBILE SIDEBAR
// ============================================================

mobileMenu.addEventListener("click", () => {
    sidebar.classList.add("open");
});


sidebarClose.addEventListener("click", () => {
    sidebar.classList.remove("open");
});


// ============================================================
// NOTIFICATIONS PANEL
// ============================================================

notificationButton.addEventListener("click", () => {
    notificationPanel.classList.toggle("show");

    if (notificationPanel.classList.contains("show")) {
        refreshNotifications();
    }
});


closeNotifications.addEventListener("click", () => {
    notificationPanel.classList.remove("show");
});


document.addEventListener("click", event => {
    if (
        !notificationPanel.contains(event.target) &&
        !notificationButton.contains(event.target)
    ) {
        notificationPanel.classList.remove("show");
    }
});


// ============================================================
// ESCAPE KEY
// ============================================================

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        const kycModal = $("kycModal");
        const wdModal  = $("withdrawalModal");

        if (kycModal && kycModal.classList.contains("show")) closeKycModal();
        if (wdModal && wdModal.classList.contains("show")) closeWithdrawalModal();
        if ($("certRequestModal")?.classList.contains("show")) closeCertRequestModal();
        if ($("certPreviewModal")?.classList.contains("show")) closeCertPreview();
    }
});


// ============================================================
// LOGOUT
// ============================================================

logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    logoutButton.innerHTML = "<span>...</span> Logging out";

    try {
        await signOut(auth);
        window.location.href = "../auth/login.html";

    } catch (error) {
        console.error("Logout error:", error);

        logoutButton.disabled = false;
        logoutButton.innerHTML = "<span>↪</span> Logout";

        alert("Unable to logout. Please try again.");
    }
});