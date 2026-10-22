/* =========================================================
   RISE FUNDED — ADMIN PANEL LOGIC
   (Orders + Support + Promotions + Accounts + Certificates + KYC + Withdrawals)
========================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    addDoc,
    query,
    orderBy,
    where,
    serverTimestamp,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import { firebaseConfig } from "../js/firebase-config.js";


/* ---------- FIREBASE ---------- */
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);


/* ---------- STATE ---------- */
let currentUser   = null;
let allOrders     = [];
let allTickets    = [];
let currentTab    = "pending";
let selectedOrder = null;

let currentTicketId    = null;
let currentTicketUnsub = null;
let currentTicketFilter = "all";

let pendingApproveOrder = null;


/* ---------- ACCOUNTS MONITOR STATE ---------- */
let allAccounts        = [];
let accountsFilter     = "all";
let accountsSearch     = "";
let accountModalChart  = null;
let currentAccountId   = null;


/* ---------- CERTIFICATES STATE ---------- */
let allCertRequests   = [];
let certsFilter       = "pending";
let selectedCertReq   = null;
let currentCertView   = null;
let allUsersList      = [];


/* ---------- KYC STATE ---------- */
let allKycRequests = [];
let kycFilter      = "pending";
let selectedKycReq = null;


/* ---------- WITHDRAWALS STATE ---------- */
let allWithdrawals = [];
let wdFilter       = "pending";
let selectedWdReq  = null;


/* ---------- DOM ---------- */
const loading       = document.getElementById("loading");
const denied        = document.getElementById("denied");
const adminPanel    = document.getElementById("adminPanel");

const navItems      = document.querySelectorAll(".nav-item");
const pageKicker    = document.getElementById("pageKicker");
const pageTitle     = document.getElementById("pageTitle");

const pendingBadge  = document.getElementById("pendingBadge");
const supportBadge  = document.getElementById("supportBadge");
const accountsBadge = document.getElementById("accountsBadge");
const certsBadge    = document.getElementById("certsBadge");
const kycBadge      = document.getElementById("kycBadge");
const withdrawalsBadge = document.getElementById("withdrawalsBadge");
const statPending   = document.getElementById("statPending");
const statApproved  = document.getElementById("statApproved");
const statRejected  = document.getElementById("statRejected");
const statRevenue   = document.getElementById("statRevenue");
const statsRow      = document.getElementById("statsRow");

const ordersList    = document.getElementById("ordersList");
const refreshBtn    = document.getElementById("refreshBtn");

const supportPanel  = document.getElementById("supportPanel");
const supportList   = document.getElementById("supportList");
const supportFilters = document.getElementById("supportFilters");

const promotionsPanel = document.getElementById("promotionsPanel");

const adminAvatar   = document.getElementById("adminAvatar");
const adminName     = document.getElementById("adminName");
const adminEmail    = document.getElementById("adminEmail");
const logoutBtn     = document.getElementById("logoutBtn");

const orderModal    = document.getElementById("orderModal");
const modalClose    = document.getElementById("modalClose");
const modalOrderId  = document.getElementById("modalOrderId");
const modalBody     = document.getElementById("modalBody");
const modalFooter   = document.getElementById("modalFooter");


/* ---------- APPROVE MODAL DOM ---------- */
const approveModal      = document.getElementById("approveModal");
const approveModalClose = document.getElementById("approveModalClose");
const approveCancelBtn  = document.getElementById("approveCancelBtn");
const approveConfirmBtn = document.getElementById("approveConfirmBtn");
const approveInfo       = document.getElementById("approveInfo");
const approveError      = document.getElementById("approveError");


/* ---------- PROMO DOM ---------- */
const topbarEnabled   = document.getElementById("topbarEnabled");
const topbarText      = document.getElementById("topbarText");
const topbarCode      = document.getElementById("topbarCode");
const topbarDiscount  = document.getElementById("topbarDiscount");
const topbarStatus    = document.getElementById("topbarStatus");
const saveTopbarBtn   = document.getElementById("saveTopbarBtn");

const popupEnabled     = document.getElementById("popupEnabled");
const popupTitle       = document.getElementById("popupTitle");
const popupDescription = document.getElementById("popupDescription");
const popupCode        = document.getElementById("popupCode");
const popupPercent     = document.getElementById("popupPercent");
const popupDelay       = document.getElementById("popupDelay");
const popupStatus      = document.getElementById("popupStatus");
const savePopupBtn     = document.getElementById("savePopupBtn");


/* ---------- CHAT DOM ---------- */
const chatPanel        = document.getElementById("chatPanel");
const chatBackBtn      = document.getElementById("chatBackBtn");
const chatPanelSubject = document.getElementById("chatPanelSubject");
const chatPanelStatus  = document.getElementById("chatPanelStatus");
const chatResolveBtn   = document.getElementById("chatResolveBtn");
const chatUserInfo     = document.getElementById("chatUserInfo");
const chatMessages     = document.getElementById("chatMessages");
const chatInput        = document.getElementById("chatInput");
const chatSendBtn      = document.getElementById("chatSendBtn");


/* ---------- ACCOUNTS MONITOR DOM ---------- */
const accountsPanel          = document.getElementById("accountsPanel");
const monitorTotal           = document.getElementById("monitorTotal");
const monitorSafe            = document.getElementById("monitorSafe");
const monitorBreached        = document.getElementById("monitorBreached");
const monitorNear            = document.getElementById("monitorNear");
const accountsSearchInput    = document.getElementById("accountsSearchInput");
const accountsFilters        = document.getElementById("accountsFilters");
const accountsList           = document.getElementById("accountsList");

/* ---------- ACCOUNT MODAL DOM ---------- */
const accountModal          = document.getElementById("accountModal");
const accountModalClose     = document.getElementById("accountModalClose");
const accountModalTitle     = document.getElementById("accountModalTitle");
const accountModalUser      = document.getElementById("accountModalUser");
const accountModalStats     = document.getElementById("accountModalStats");
const accountModalEvents    = document.getElementById("accountModalEvents");
const accountModalCalendar  = document.getElementById("accountModalCalendar");


/* ---------- CERTIFICATES DOM ---------- */
const certificatesPanel       = document.getElementById("certificatesPanel");
const certStatPending         = document.getElementById("certStatPending");
const certStatApproved        = document.getElementById("certStatApproved");
const certStatRejected        = document.getElementById("certStatRejected");
const certStatIssued          = document.getElementById("certStatIssued");
const certsFilters            = document.getElementById("certsFilters");
const certsList               = document.getElementById("certsList");
const newCertBtn              = document.getElementById("newCertBtn");

const certReviewModal         = document.getElementById("certReviewModal");
const certReviewModalClose    = document.getElementById("certReviewModalClose");
const certReviewTitle         = document.getElementById("certReviewTitle");
const certReviewUser          = document.getElementById("certReviewUser");
const certReviewType          = document.getElementById("certReviewType");
const certReviewAccountType   = document.getElementById("certReviewAccountType");
const certReviewAccountSize   = document.getElementById("certReviewAccountSize");
const certReviewPayoutRow     = document.getElementById("certReviewPayoutRow");
const certReviewPayoutAmount  = document.getElementById("certReviewPayoutAmount");
const certReviewError         = document.getElementById("certReviewError");
const certReviewApproveBtn    = document.getElementById("certReviewApproveBtn");
const certReviewRejectBtn     = document.getElementById("certReviewRejectBtn");

const certNewModal            = document.getElementById("certNewModal");
const certNewModalClose       = document.getElementById("certNewModalClose");
const certNewUserSelect       = document.getElementById("certNewUserSelect");
const certNewType             = document.getElementById("certNewType");
const certNewAccountType      = document.getElementById("certNewAccountType");
const certNewAccountSize      = document.getElementById("certNewAccountSize");
const certNewPayoutRow        = document.getElementById("certNewPayoutRow");
const certNewPayoutAmount     = document.getElementById("certNewPayoutAmount");
const certNewError            = document.getElementById("certNewError");
const certNewCancelBtn        = document.getElementById("certNewCancelBtn");
const certNewCreateBtn        = document.getElementById("certNewCreateBtn");

const certPreviewAdminModal   = document.getElementById("certPreviewAdminModal");
const certPreviewAdminClose   = document.getElementById("certPreviewAdminClose");
const certPreviewAdminCloseBtn= document.getElementById("certPreviewAdminCloseBtn");
const certPreviewAdminDownloadBtn = document.getElementById("certPreviewAdminDownloadBtn");
const certAdminCanvas         = document.getElementById("certAdminCanvas");


/* ---------- KYC DOM ---------- */
const kycPanel          = document.getElementById("kycPanel");
const kycStatPending    = document.getElementById("kycStatPending");
const kycStatVerified   = document.getElementById("kycStatVerified");
const kycStatRejected   = document.getElementById("kycStatRejected");
const kycFilters        = document.getElementById("kycFilters");
const kycList           = document.getElementById("kycList");

const kycReviewModal         = document.getElementById("kycReviewModal");
const kycReviewModalClose    = document.getElementById("kycReviewModalClose");
const kycReviewTitle         = document.getElementById("kycReviewTitle");
const kycReviewUser          = document.getElementById("kycReviewUser");
const kycReviewFullName      = document.getElementById("kycReviewFullName");
const kycReviewDocumentType  = document.getElementById("kycReviewDocumentType");
const kycReviewCountry       = document.getElementById("kycReviewCountry");
const kycReviewDocumentNumber = document.getElementById("kycReviewDocumentNumber");
const kycReviewRejectRow     = document.getElementById("kycReviewRejectRow");
const kycReviewRejectReason  = document.getElementById("kycReviewRejectReason");
const kycReviewError         = document.getElementById("kycReviewError");
const kycReviewApproveBtn    = document.getElementById("kycReviewApproveBtn");
const kycReviewRejectBtn     = document.getElementById("kycReviewRejectBtn");


/* ---------- WITHDRAWALS DOM ---------- */
const withdrawalsPanel       = document.getElementById("withdrawalsPanel");
const wdStatPending          = document.getElementById("wdStatPending");
const wdStatPaid             = document.getElementById("wdStatPaid");
const wdStatPendingAmount    = document.getElementById("wdStatPendingAmount");
const wdStatPaidAmount       = document.getElementById("wdStatPaidAmount");
const wdFilters              = document.getElementById("wdFilters");
const wdList                 = document.getElementById("wdList");

const wdReviewModal          = document.getElementById("wdReviewModal");
const wdReviewModalClose     = document.getElementById("wdReviewModalClose");
const wdReviewTitle          = document.getElementById("wdReviewTitle");
const wdReviewUser           = document.getElementById("wdReviewUser");
const wdReviewAmount         = document.getElementById("wdReviewAmount");
const wdReviewNetwork        = document.getElementById("wdReviewNetwork");
const wdReviewWallet         = document.getElementById("wdReviewWallet");
const wdReviewAccountId      = document.getElementById("wdReviewAccountId");
const wdReviewTxidRow        = document.getElementById("wdReviewTxidRow");
const wdReviewTxid           = document.getElementById("wdReviewTxid");
const wdReviewRejectRow      = document.getElementById("wdReviewRejectRow");
const wdReviewRejectReason   = document.getElementById("wdReviewRejectReason");
const wdReviewError          = document.getElementById("wdReviewError");
const wdReviewApproveBtn     = document.getElementById("wdReviewApproveBtn");
const wdReviewRejectBtn      = document.getElementById("wdReviewRejectBtn");


/* =========================================================
   HELPERS
========================================================= */

function formatMoney(value) {
    const n = Number(value) || 0;
    return "$" + n.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

function formatMoneyAbs(value) {
    const n = Number(value) || 0;
    return "$" + n.toFixed(2);
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
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }).format(date);
    } catch {
        return "—";
    }
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

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getExplorerUrl(network, txid) {
    if (!txid) return null;
    if (network === "TRC20") return "https://tronscan.org/#/transaction/" + txid;
    if (network === "BEP20") return "https://bscscan.com/tx/" + txid;
    if (network === "ERC20") return "https://etherscan.io/tx/" + txid;
    return null;
}

function getStatusClass(status) {
    if (status === "paid") return "status-paid";
    if (status === "pending_review") return "status-pending";
    if (status === "rejected") return "status-rejected";
    return "status-awaiting";
}

function getStatusLabel(status) {
    if (status === "paid") return "PAID";
    if (status === "pending_review") return "PENDING";
    if (status === "rejected") return "REJECTED";
    if (status === "awaiting_payment") return "AWAITING PAYMENT";
    return String(status || "UNKNOWN").toUpperCase();
}


/* =========================================================
   ACCOUNT STATUS HELPERS
========================================================= */

function parsePercent(value) {
    if (value == null) return 0;
    if (typeof value === "number") return value;
    const match = String(value).match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : 0;
}

function calculateOverallDrawdown(challenge) {
    const initialBalance = Number(challenge.accountSize || 0);
    const currentEquity  = Number(
        challenge.equity ??
        challenge.balance ??
        initialBalance
    );

    if (initialBalance <= 0) return 0;

    const loss = ((initialBalance - currentEquity) / initialBalance) * 100;
    return loss > 0 ? loss : 0;
}

function getAccountStatus(challenge) {
    const events = challenge.criticalEvents || {};

    if (events.maxDrawdownBreach && events.maxDrawdownBreach.equity) {
        return "breached";
    }

    const overallDD = calculateOverallDrawdown(challenge);
    const maxDDLimit = parsePercent(challenge.maxDrawdown ?? 10);

    if (maxDDLimit > 0 && overallDD >= maxDDLimit) {
        return "breached";
    }

    if (maxDDLimit > 0 && overallDD / maxDDLimit >= 0.7) {
        return "near";
    }

    if ((events.dailyBreaches || []).length > 0) {
        return "near";
    }

    return "safe";
}

function getStatusLabelAccount(status) {
    if (status === "breached") return "🔴 BREACHED";
    if (status === "near")     return "🟡 NEAR LIMIT";
    return "🟢 SAFE";
}

function getStatusClassAccount(status) {
    if (status === "breached") return "status-badge-breach";
    if (status === "near")     return "status-badge-near";
    return "status-badge-safe";
}

function getCardClassAccount(status) {
    if (status === "breached") return "status-breach";
    if (status === "near")     return "status-near";
    return "status-safe";
}


/* =========================================================
   CERTIFICATE HELPERS
========================================================= */

const CERT_TYPES_ADMIN = {
    phase1: { label: "Phase 1 Passed", icon: "①" },
    phase2: { label: "Phase 2 Passed", icon: "②" },
    funded: { label: "Funded Trader",  icon: "★" },
    payout: { label: "Payout Achieved", icon: "💰" }
};

const ACCOUNT_TYPES_LABEL_ADMIN = {
    "1step":          "1 Step",
    "2step_standard": "2 Step Standard",
    "2step_pro":      "2 Step Pro",
    "instant":        "Instant"
};

function generateVerificationId() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let id = "";
    for (let i = 0; i < 12; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}


/* =========================================================
   CHECK ADMIN
========================================================= */

async function checkAdmin(uid) {
    try {
        const snap = await getDoc(doc(db, "admins", uid));
        return snap.exists();
    } catch (err) {
        console.error("Admin check error:", err);
        return false;
    }
}


/* =========================================================
   LOAD ORDERS
========================================================= */

async function loadOrders() {
    try {
        const q = query(
            collection(db, "orders"),
            orderBy("createdAt", "desc")
        );

        const snap = await getDocs(q);

        allOrders = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        renderStats();
        renderOrders();

    } catch (err) {
        console.error("Load orders error:", err);
        ordersList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">⚠️</div>
                <strong>Could not load orders</strong>
                <p>${escapeHTML(err.message)}</p>
            </div>
        `;
    }
}


/* =========================================================
   LOAD TICKETS
========================================================= */

async function loadTickets() {
    try {
        const q = query(
            collection(db, "support_tickets"),
            orderBy("updatedAt", "desc")
        );

        const snap = await getDocs(q);

        allTickets = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        renderSupportBadge();
        renderTickets();

    } catch (err) {
        console.error("Load tickets error:", err);
        supportList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">⚠️</div>
                <strong>Could not load tickets</strong>
                <p>${escapeHTML(err.message)}</p>
            </div>
        `;
    }
}


/* =========================================================
   LOAD ACCOUNTS
========================================================= */

async function loadAccounts() {
    try {
        accountsList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">⏳</div>
                <strong>Loading accounts...</strong>
                <p>Please wait while we scan all users.</p>
            </div>
        `;

        const usersSnap = await getDocs(collection(db, "users"));

        const accounts = [];

        for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data();

            try {
                const chSnap = await getDocs(
                    collection(db, "users", userDoc.id, "challenges")
                );

                chSnap.docs.forEach(chDoc => {
                    const ch = chDoc.data();

                    if (!ch.mtLogin || !ch.mtPassword || !ch.mtServer) {
                        return;
                    }

                    const status = getAccountStatus(ch);

                    accounts.push({
                        id: chDoc.id,
                        userId: userDoc.id,
                        userFirstName: userData.firstName || "",
                        userLastName:  userData.lastName  || "",
                        userName:      `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Unknown",
                        userEmail:     userData.email || "",
                        planName:      ch.planName || ch.plan || "—",
                        accountId:     ch.accountId || "—",
                        accountSize:   Number(ch.accountSize || 0),
                        mtLogin:    ch.mtLogin,
                        mtServer:   ch.mtServer,
                        balance:       Number(ch.balance || ch.accountSize || 0),
                        equity:        Number(ch.equity  || ch.balance || ch.accountSize || 0),
                        profit:        Number(ch.profit  || 0),
                        winRate:       Number(ch.winRate || 0),
                        profitFactor:  Number(ch.profitFactor || 0),
                        totalTrades:   Number(ch.totalTrades || 0),
                        maxDrawdownLimit:   ch.maxDrawdown   ?? "—",
                        overallDrawdown:    calculateOverallDrawdown(ch),
                        criticalEvents: ch.criticalEvents || {},
                        equityHistory:  ch.equityHistory || [],
                        dailyPnl:       ch.dailyPnl || {},
                        status
                    });
                });

            } catch (err) {
                console.warn(`Could not load challenges for user ${userDoc.id}:`, err);
            }
        }

        allAccounts = accounts;

        renderMonitorStats();
        renderAccounts();
        renderAccountsBadge();

    } catch (err) {
        console.error("Load accounts error:", err);
        accountsList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">⚠️</div>
                <strong>Could not load accounts</strong>
                <p>${escapeHTML(err.message)}</p>
            </div>
        `;
    }
}


/* =========================================================
   LOAD CERT REQUESTS
========================================================= */

async function loadCertRequests() {
    try {
        certsList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">⏳</div>
                <strong>Loading certificate requests...</strong>
                <p>Please wait.</p>
            </div>
        `;

        const q = query(
            collection(db, "certificate_requests"),
            orderBy("requestedAt", "desc")
        );

        const snap = await getDocs(q);

        allCertRequests = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        renderCertStats();
        renderCertRequests();
        renderCertsBadge();

    } catch (err) {
        console.error("Load cert requests error:", err);
        certsList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">⚠️</div>
                <strong>Could not load certificate requests</strong>
                <p>${escapeHTML(err.message)}</p>
            </div>
        `;
    }
}


/* =========================================================
   LOAD KYC REQUESTS
========================================================= */

async function loadKycRequests() {
    try {
        kycList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">⏳</div>
                <strong>Loading KYC requests...</strong>
                <p>Please wait.</p>
            </div>
        `;

        const q = query(
            collection(db, "kyc_requests"),
            orderBy("submittedAt", "desc")
        );

        const snap = await getDocs(q);

        allKycRequests = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        renderKycStats();
        renderKycRequests();
        renderKycBadge();

    } catch (err) {
        console.error("Load KYC requests error:", err);
        kycList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">⚠️</div>
                <strong>Could not load KYC requests</strong>
                <p>${escapeHTML(err.message)}</p>
            </div>
        `;
    }
}


/* =========================================================
   LOAD WITHDRAWALS
========================================================= */

async function loadWithdrawals() {
    try {
        wdList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">⏳</div>
                <strong>Loading withdrawal requests...</strong>
                <p>Please wait.</p>
            </div>
        `;

        const q = query(
            collection(db, "withdrawal_requests"),
            orderBy("requestedAt", "desc")
        );

        const snap = await getDocs(q);

        allWithdrawals = snap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        renderWdStats();
        renderWithdrawals();
        renderWdBadge();

    } catch (err) {
        console.error("Load withdrawals error:", err);
        wdList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">⚠️</div>
                <strong>Could not load withdrawals</strong>
                <p>${escapeHTML(err.message)}</p>
            </div>
        `;
    }
}


/* =========================================================
   STATS (Orders)
========================================================= */

function renderStats() {
    const pending  = allOrders.filter(o =>
        o.status === "pending_review" || o.status === "awaiting_payment"
    ).length;

    const approved = allOrders.filter(o => o.status === "paid").length;
    const rejected = allOrders.filter(o => o.status === "rejected").length;

    const revenue = allOrders
        .filter(o => o.status === "paid")
        .reduce((sum, o) => sum + Number(o.total || 0), 0);

    pendingBadge.textContent = pending;
    statPending.textContent  = pending;
    statApproved.textContent = approved;
    statRejected.textContent = rejected;
    statRevenue.textContent  = formatMoney(revenue);
}


/* =========================================================
   RENDER ORDERS
========================================================= */

function getFilteredOrders() {
    if (currentTab === "pending") {
        return allOrders.filter(o =>
            o.status === "pending_review" || o.status === "awaiting_payment"
        );
    }
    if (currentTab === "approved") {
        return allOrders.filter(o => o.status === "paid");
    }
    if (currentTab === "rejected") {
        return allOrders.filter(o => o.status === "rejected");
    }
    return allOrders;
}


function renderOrders() {
    const orders = getFilteredOrders();

    if (!orders.length) {
        ordersList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">📭</div>
                <strong>No orders in this section</strong>
                <p>Nothing to show here right now.</p>
            </div>
        `;
        return;
    }

    ordersList.innerHTML = orders.map(order => {
        const statusClass = getStatusClass(order.status);

        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-left">
                    <div class="order-item">
                        <span>Order ID</span>
                        <strong>${escapeHTML(order.orderId || order.id)}</strong>
                    </div>

                    <div class="order-item">
                        <span>User</span>
                        <strong>${escapeHTML(order.email || order.userEmail || "—")}</strong>
                    </div>

                    <div class="order-item">
                        <span>Plan</span>
                        <strong>${escapeHTML(order.planName || "—")} • $${(order.accountSize || 0).toLocaleString()}</strong>
                    </div>

                    <div class="order-item">
                        <span>Payout</span>
                        <strong>${escapeHTML(order.payoutCycle || "—")} • ${escapeHTML(order.profitSplit || "—")}</strong>
                    </div>

                    <div class="order-item">
                        <span>Network</span>
                        <strong>${escapeHTML(order.network || "—")}</strong>
                    </div>

                    <div class="order-item">
                        <span>Created</span>
                        <strong>${formatDate(order.createdAt)}</strong>
                    </div>

                    ${order.txid ? `
                        <div class="order-item" style="grid-column:1 / -1">
                            <span>TxID</span>
                            <code>${escapeHTML(order.txid)}</code>
                        </div>
                    ` : ""}
                </div>

                <div class="order-right">
                    <div class="status-badge ${statusClass}">
                        ${getStatusLabel(order.status)}
                    </div>

                    <div class="order-amount">
                        ${formatMoney(order.total)}
                    </div>

                    <button class="view-btn" data-action="view" data-id="${order.id}">
                        View Details
                    </button>
                </div>
            </div>
        `;
    }).join("");

    ordersList.querySelectorAll("[data-action='view']").forEach(btn => {
        btn.addEventListener("click", () => {
            openOrderModal(btn.dataset.id);
        });
    });

    ordersList.querySelectorAll(".order-card").forEach(card => {
        card.addEventListener("click", (e) => {
            if (e.target.closest("[data-action]")) return;
            if (card.dataset.orderId) openOrderModal(card.dataset.orderId);
        });
    });
}


/* =========================================================
   RENDER SUPPORT — BADGE
========================================================= */

function renderSupportBadge() {
    const openCount = allTickets.filter(
        t => t.status === "open" || t.status === "pending"
    ).length;

    if (supportBadge) {
        if (openCount > 0) {
            supportBadge.textContent = openCount;
            supportBadge.style.display = "inline-flex";
        } else {
            supportBadge.style.display = "none";
        }
    }
}


/* =========================================================
   RENDER SUPPORT — TICKETS LIST
========================================================= */

function renderTickets() {
    if (!supportList) return;

    let tickets = allTickets;

    if (currentTicketFilter !== "all") {
        tickets = tickets.filter(t => t.status === currentTicketFilter);
    }

    if (!tickets.length) {
        supportList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">💬</div>
                <strong>No tickets in this section</strong>
                <p>Nothing to show here right now.</p>
            </div>
        `;
        return;
    }

    supportList.innerHTML = tickets.map(ticket => {
        const status = ticket.status || "open";
        const statusClass = status;
        const statusLabel =
            status === "resolved" ? "✅ Resolved" :
            status === "pending"  ? "🟡 Pending" :
            "🟢 Open";

        const initials = getInitials(ticket.userName || ticket.userEmail);

        return `
            <div class="support-ticket" data-ticket-id="${ticket.id}">
                <div class="support-ticket-top">
                    <div class="support-ticket-user">
                        <div class="support-ticket-avatar">${initials}</div>
                        <div class="support-ticket-info">
                            <strong>${escapeHTML(ticket.userName || "User")}</strong>
                            <span>${escapeHTML(ticket.userEmail || "")}</span>
                        </div>
                    </div>

                    <span class="support-ticket-status ${statusClass}">
                        ${statusLabel}
                    </span>
                </div>

                <div class="support-ticket-subject">
                    ${escapeHTML(ticket.subject || "No subject")}
                </div>

                <p class="support-ticket-preview">
                    ${escapeHTML(ticket.lastMessage || "—")}
                </p>

                <div class="support-ticket-bottom">
                    <span>${formatDate(ticket.lastMessageAt || ticket.createdAt)}</span>
                    <span class="support-ticket-action">Open Chat →</span>
                </div>
            </div>
        `;
    }).join("");

    supportList.querySelectorAll(".support-ticket").forEach(item => {
        item.addEventListener("click", () => {
            openChatPanel(item.dataset.ticketId);
        });
    });
}


/* =========================================================
   SUPPORT FILTERS
========================================================= */

if (supportFilters) {
    supportFilters.querySelectorAll(".support-filter").forEach(btn => {
        btn.addEventListener("click", () => {
            supportFilters.querySelectorAll(".support-filter").forEach(b => {
                b.classList.remove("active");
            });
            btn.classList.add("active");

            currentTicketFilter = btn.dataset.status;
            renderTickets();
        });
    });
}


/* =========================================================
   RENDER ACCOUNTS MONITOR — STATS
========================================================= */

function renderMonitorStats() {
    if (!monitorTotal) return;

    const total    = allAccounts.length;
    const safe     = allAccounts.filter(a => a.status === "safe").length;
    const breached = allAccounts.filter(a => a.status === "breached").length;
    const near     = allAccounts.filter(a => a.status === "near").length;

    monitorTotal.textContent    = total;
    monitorSafe.textContent     = safe;
    monitorBreached.textContent = breached;
    monitorNear.textContent     = near;
}


function renderAccountsBadge() {
    if (!accountsBadge) return;

    const alertCount = allAccounts.filter(
        a => a.status === "breached" || a.status === "near"
    ).length;

    if (alertCount > 0) {
        accountsBadge.textContent = alertCount;
        accountsBadge.style.display = "inline-flex";
    } else {
        accountsBadge.style.display = "none";
    }
}


/* =========================================================
   RENDER ACCOUNTS MONITOR — LIST
========================================================= */

function getFilteredAccounts() {
    let list = allAccounts;

    if (accountsFilter !== "all") {
        list = list.filter(a => a.status === accountsFilter);
    }

    if (accountsSearch.trim()) {
        const q = accountsSearch.trim().toLowerCase();
        list = list.filter(a =>
            a.userName.toLowerCase().includes(q) ||
            a.userEmail.toLowerCase().includes(q) ||
            String(a.mtLogin).toLowerCase().includes(q) ||
            String(a.accountId).toLowerCase().includes(q)
        );
    }

    const order = { breached: 0, near: 1, safe: 2 };
    list.sort((a, b) => order[a.status] - order[b.status]);

    return list;
}


function renderAccounts() {
    if (!accountsList) return;

    const list = getFilteredAccounts();

    if (!list.length) {
        accountsList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">📊</div>
                <strong>No accounts match</strong>
                <p>Try a different filter or search term.</p>
            </div>
        `;
        return;
    }

    accountsList.innerHTML = list.map(acc => {
        const initials    = getInitials(acc.userName);
        const statusCard  = getCardClassAccount(acc.status);
        const statusBadge = getStatusClassAccount(acc.status);
        const statusLabel = getStatusLabelAccount(acc.status);

        const profitClass = acc.profit >= 0 ? "positive" : "negative";
        const profitSign  = acc.profit >= 0 ? "+" : "−";

        const allowedDD = parsePercent(acc.maxDrawdownLimit);
        const overallDD = acc.overallDrawdown;

        return `
            <div class="account-monitor-card ${statusCard}"
                 data-account-id="${acc.id}"
                 data-user-id="${acc.userId}">
                <div class="account-monitor-left">
                    <div class="account-monitor-header">
                        <div class="account-monitor-avatar">${initials}</div>
                        <div class="account-monitor-info">
                            <strong>${escapeHTML(acc.userName)}</strong>
                            <span>${escapeHTML(acc.userEmail)}</span>
                        </div>
                    </div>

                    <div class="account-monitor-meta">
                        <span class="account-monitor-tag mt-login">
                            MT: ${escapeHTML(String(acc.mtLogin))}
                        </span>
                        <span class="account-monitor-tag">
                            ${escapeHTML(acc.planName)}
                        </span>
                        <span class="account-monitor-tag">
                            $${acc.accountSize.toLocaleString()}
                        </span>
                    </div>

                    <div class="account-monitor-numbers">
                        <div class="account-monitor-number">
                            <span>Balance</span>
                            <strong>${formatMoney(acc.balance)}</strong>
                        </div>

                        <div class="account-monitor-number">
                            <span>Equity</span>
                            <strong>${formatMoney(acc.equity)}</strong>
                        </div>

                        <div class="account-monitor-number">
                            <span>Profit</span>
                            <strong class="${profitClass}">
                                ${profitSign}${formatMoney(Math.abs(acc.profit))}
                            </strong>
                        </div>

                        <div class="account-monitor-number">
                            <span>Current DD</span>
                            <strong class="${overallDD > 0 ? "negative" : ""}">
                                ${overallDD.toFixed(2)}%
                                ${allowedDD ? `<span style="font-size:10px;color:#8a909d;font-weight:700"> / ${allowedDD}%</span>` : ""}
                            </strong>
                        </div>
                    </div>
                </div>

                <div class="account-monitor-right">
                    <div class="account-monitor-status ${statusBadge}">
                        ${statusLabel}
                    </div>

                    <button class="account-monitor-view"
                            data-account-view="${acc.id}">
                        View Details
                    </button>
                </div>
            </div>
        `;
    }).join("");

    accountsList.querySelectorAll("[data-account-view]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            openAccountModal(btn.dataset.accountView);
        });
    });

    accountsList.querySelectorAll(".account-monitor-card").forEach(card => {
        card.addEventListener("click", (e) => {
            if (e.target.closest("[data-account-view]")) return;
            openAccountModal(card.dataset.accountId);
        });
    });
}


/* =========================================================
   ACCOUNTS FILTERS + SEARCH
========================================================= */

if (accountsFilters) {
    accountsFilters.querySelectorAll(".accounts-filter").forEach(btn => {
        btn.addEventListener("click", () => {
            accountsFilters.querySelectorAll(".accounts-filter").forEach(b => {
                b.classList.remove("active");
            });
            btn.classList.add("active");

            accountsFilter = btn.dataset.status;
            renderAccounts();
        });
    });
}

if (accountsSearchInput) {
    accountsSearchInput.addEventListener("input", (e) => {
        accountsSearch = e.target.value;
        renderAccounts();
    });
}


/* =========================================================
   ACCOUNT MODAL
========================================================= */

function openAccountModal(accountId) {
    const acc = allAccounts.find(a => a.id === accountId);
    if (!acc) return;

    currentAccountId = accountId;

    accountModalTitle.textContent = acc.planName || "Account";

    const statusLabel = getStatusLabelAccount(acc.status);
    const statusClass = getStatusClassAccount(acc.status);

    accountModalUser.innerHTML = `
        <strong>${escapeHTML(acc.userName)}</strong>
        <span>${escapeHTML(acc.userEmail)}</span>
        <span>
            MT Login: <b style="font-family:monospace;color:var(--purple)">${escapeHTML(String(acc.mtLogin))}</b>
            &nbsp;•&nbsp;
            Server: <b>${escapeHTML(acc.mtServer)}</b>
        </span>
        <span style="margin-top:10px">
            <span class="account-monitor-status ${statusClass}" style="display:inline-block">
                ${statusLabel}
            </span>
        </span>
    `;

    const profitClass = acc.profit >= 0 ? "positive" : "negative";
    const profitSign  = acc.profit >= 0 ? "+" : "−";
    const allowedDD   = parsePercent(acc.maxDrawdownLimit);

    accountModalStats.innerHTML = `
        <div class="modal-stat">
            <span>Balance</span>
            <strong>${formatMoney(acc.balance)}</strong>
        </div>

        <div class="modal-stat">
            <span>Equity</span>
            <strong>${formatMoney(acc.equity)}</strong>
        </div>

        <div class="modal-stat">
            <span>Net P&L</span>
            <strong class="${profitClass}">
                ${profitSign}${formatMoney(Math.abs(acc.profit))}
            </strong>
        </div>

        <div class="modal-stat">
            <span>Win Rate</span>
            <strong>${acc.winRate.toFixed(2)}%</strong>
        </div>

        <div class="modal-stat">
            <span>Profit Factor</span>
            <strong>${acc.profitFactor.toFixed(2)}</strong>
        </div>

        <div class="modal-stat">
            <span>Total Trades</span>
            <strong>${acc.totalTrades}</strong>
        </div>

        <div class="modal-stat">
            <span>Max DD Limit</span>
            <strong>${escapeHTML(String(acc.maxDrawdownLimit))}</strong>
        </div>

        <div class="modal-stat">
            <span>Current DD</span>
            <strong class="${acc.overallDrawdown > 0 ? "negative" : ""}">
                ${acc.overallDrawdown.toFixed(2)}%
                ${allowedDD ? `<span style="font-size:11px;color:#8a909d;font-weight:700"> / ${allowedDD}%</span>` : ""}
            </strong>
        </div>
    `;

    renderAccountModalEvents(acc);
    renderAccountModalChart(acc);
    renderAccountModalCalendar(acc);

    accountModal.classList.add("open");
    document.body.style.overflow = "hidden";
}


function closeAccountModal() {
    if (!accountModal) return;
    accountModal.classList.remove("open");
    document.body.style.overflow = "";

    if (accountModalChart) {
        try { accountModalChart.destroy(); } catch {}
        accountModalChart = null;
    }

    currentAccountId = null;
}


/* =========================================================
   ACCOUNT MODAL — CRITICAL EVENTS
========================================================= */

function renderAccountModalEvents(acc) {
    if (!accountModalEvents) return;

    const events = acc.criticalEvents || {};
    const breach = events.maxDrawdownBreach;
    const peak   = events.peakEquity;
    const daily  = events.dailyBreaches || [];

    let html = "";

    if (breach && breach.equity) {
        html += `
            <div class="account-modal-event danger">
                <div class="account-modal-event-header">
                    <div class="account-modal-event-icon">🔴</div>
                    <div>
                        <span>MAX DRAWDOWN BREACH</span>
                        <strong>Rule Violation</strong>
                    </div>
                </div>

                <div class="account-modal-event-grid">
                    <div class="account-modal-event-item">
                        <span>Date</span>
                        <strong>${escapeHTML(breach.date || "—")}</strong>
                    </div>
                    <div class="account-modal-event-item">
                        <span>Time</span>
                        <strong>${escapeHTML(breach.time || "—")}</strong>
                    </div>
                    <div class="account-modal-event-item">
                        <span>Equity</span>
                        <strong class="danger">${formatMoneyAbs(breach.equity)}</strong>
                    </div>
                    <div class="account-modal-event-item">
                        <span>Balance</span>
                        <strong>${formatMoneyAbs(breach.balance)}</strong>
                    </div>
                    <div class="account-modal-event-item">
                        <span>Drawdown %</span>
                        <strong class="danger">-${Number(breach.drawdownPct || 0).toFixed(2)}%</strong>
                    </div>
                    <div class="account-modal-event-item">
                        <span>Allowed</span>
                        <strong>-${Number(breach.threshold || 0).toFixed(2)}%</strong>
                    </div>
                </div>
            </div>
        `;
    }

    if (peak && peak.equity) {
        html += `
            <div class="account-modal-event success">
                <div class="account-modal-event-header">
                    <div class="account-modal-event-icon">🟢</div>
                    <div>
                        <span>PEAK EQUITY</span>
                        <strong>Best Performance</strong>
                    </div>
                </div>

                <div class="account-modal-event-grid">
                    <div class="account-modal-event-item">
                        <span>Date</span>
                        <strong>${escapeHTML(peak.date || "—")}</strong>
                    </div>
                    <div class="account-modal-event-item">
                        <span>Time</span>
                        <strong>${escapeHTML(peak.time || "—")}</strong>
                    </div>
                    <div class="account-modal-event-item">
                        <span>Equity</span>
                        <strong class="success">${formatMoneyAbs(peak.equity)}</strong>
                    </div>
                    <div class="account-modal-event-item">
                        <span>Profit %</span>
                        <strong class="success">+${Number(peak.profitPct || 0).toFixed(2)}%</strong>
                    </div>
                </div>
            </div>
        `;
    }

    if (daily.length) {
        const items = daily.map(d => `
            <div class="account-modal-event-item" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <span>${escapeHTML(d.date)} • ${escapeHTML(d.breachTime || "")}</span>
                <span style="text-align:right;font-family:monospace;color:var(--danger);font-weight:900">
                    -${Number(d.maxDrawdownPct || 0).toFixed(2)}%
                </span>
            </div>
        `).join("");

        html += `
            <div class="account-modal-event warning">
                <div class="account-modal-event-header">
                    <div class="account-modal-event-icon">🟡</div>
                    <div>
                        <span>DAILY DRAWDOWN</span>
                        <strong>${daily.length} Violation${daily.length > 1 ? "s" : ""}</strong>
                    </div>
                </div>

                <div style="display:flex;flex-direction:column;gap:8px">
                    ${items}
                </div>
            </div>
        `;
    }

    if (!html) {
        html = `
            <div class="empty" style="grid-column:1/-1;padding:40px">
                <div class="empty-icon">✅</div>
                <strong>No critical events</strong>
                <p>This account has no rule violations.</p>
            </div>
        `;
    }

    accountModalEvents.innerHTML = html;
}


/* =========================================================
   ACCOUNT MODAL — CHART
========================================================= */

function renderAccountModalChart(acc) {
    const wrapper = document.getElementById("accountModalChart");
    if (!wrapper) return;

    if (accountModalChart) {
        try { accountModalChart.destroy(); } catch {}
        accountModalChart = null;
    }

    const history = acc.equityHistory || [];

    if (!history.length) {
        wrapper.innerHTML = `
            <div class="empty small" style="min-height:280px;padding:40px">
                <div class="empty-icon">📈</div>
                <strong>No chart data</strong>
                <p>Equity history has not been imported yet.</p>
            </div>
        `;
        return;
    }

    wrapper.innerHTML = "";

    const categories = history.map(d => d.date);
    const balances   = history.map(d => Number(d.balance || 0));
    const equities   = history.map(d => Number(d.equity ?? d.balance ?? 0));

    const events = acc.criticalEvents || {};
    const annotations = { points: [] };

    if (events.peakEquity) {
        annotations.points.push({
            x: events.peakEquity.date,
            y: events.peakEquity.equity,
            marker: {
                size: 8,
                fillColor: "#20a86b",
                strokeColor: "#fff",
                strokeWidth: 3
            },
            label: {
                borderColor: "#20a86b",
                style: {
                    color: "#fff",
                    background: "#20a86b",
                    fontSize: "10px",
                    fontWeight: 900
                },
                text: `🟢 Peak $${events.peakEquity.equity.toFixed(0)}`
            }
        });
    }

    if (events.maxDrawdownBreach) {
        annotations.points.push({
            x: events.maxDrawdownBreach.date,
            y: events.maxDrawdownBreach.equity,
            marker: {
                size: 8,
                fillColor: "#c53d4d",
                strokeColor: "#fff",
                strokeWidth: 3
            },
            label: {
                borderColor: "#c53d4d",
                style: {
                    color: "#fff",
                    background: "#c53d4d",
                    fontSize: "10px",
                    fontWeight: 900
                },
                text: `🔴 Breach $${events.maxDrawdownBreach.equity.toFixed(0)}`
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
            zoom: { enabled: false }
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
            categories,
            labels: {
                style: {
                    colors: "#8a909d",
                    fontSize: "10px",
                    fontWeight: 700
                }
            }
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
        annotations
    };

    accountModalChart = new ApexCharts(wrapper, options);
    accountModalChart.render();
}


/* =========================================================
   ACCOUNT MODAL — CALENDAR
========================================================= */

function renderAccountModalCalendar(acc) {
    if (!accountModalCalendar) return;

    const dailyPnl = acc.dailyPnl || {};
    const dates = Object.keys(dailyPnl).sort();

    if (!dates.length) {
        accountModalCalendar.innerHTML = `
            <div class="empty small" style="min-height:200px;padding:40px;grid-column:1/-1">
                <div class="empty-icon">📅</div>
                <strong>No daily activity</strong>
                <p>Daily P&L has not been imported yet.</p>
            </div>
        `;
        return;
    }

    const lastDate = new Date(dates[dates.length - 1]);
    const year  = lastDate.getFullYear();
    const month = lastDate.getMonth();

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
            const cls = data.pnl > 0 ? "positive" : data.pnl < 0 ? "negative" : "";
            const sign = data.pnl > 0 ? "+" : data.pnl < 0 ? "−" : "";
            const formatted = sign + "$" + Math.abs(data.pnl).toFixed(2);

            daysHtml += `
                <div class="calendar-day ${cls}" title="${dateStr}">
                    <div class="calendar-day-number">${day}</div>
                    <div class="calendar-day-pnl">${formatted}</div>
                </div>
            `;
        } else {
            daysHtml += `
                <div class="calendar-day">
                    <div class="calendar-day-number">${day}</div>
                    <div class="calendar-day-pnl" style="color:#8a909d">—</div>
                </div>
            `;
        }
    }

    accountModalCalendar.innerHTML = headers + daysHtml;
}


/* =========================================================
   CERTIFICATES — STATS
========================================================= */

function renderCertStats() {
    if (!certStatPending) return;

    const pending  = allCertRequests.filter(r => r.status === "pending").length;
    const approved = allCertRequests.filter(r => r.status === "approved").length;
    const rejected = allCertRequests.filter(r => r.status === "rejected").length;

    certStatPending.textContent  = pending;
    certStatApproved.textContent = approved;
    certStatRejected.textContent = rejected;

    const issued = allCertRequests.filter(
        r => r.status === "approved" && r.certificateId
    ).length;

    certStatIssued.textContent = issued;
}


function renderCertsBadge() {
    if (!certsBadge) return;

    const pending = allCertRequests.filter(r => r.status === "pending").length;

    if (pending > 0) {
        certsBadge.textContent = pending;
        certsBadge.style.display = "inline-flex";
    } else {
        certsBadge.style.display = "none";
    }
}


/* =========================================================
   CERTIFICATES — RENDER LIST
========================================================= */

function getFilteredCertRequests() {
    if (certsFilter === "all") return allCertRequests;
    return allCertRequests.filter(r => r.status === certsFilter);
}


function renderCertRequests() {
    if (!certsList) return;

    const list = getFilteredCertRequests();

    if (!list.length) {
        certsList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">🎓</div>
                <strong>No certificate requests here</strong>
                <p>Nothing to show for this filter.</p>
            </div>
        `;
        return;
    }

    certsList.innerHTML = list.map(req => {
        const initials = getInitials(req.userName || req.userEmail || "?");

        const statusClass =
            req.status === "approved" ? "approved" :
            req.status === "rejected" ? "rejected" :
            "pending";

        const statusLabel =
            req.status === "approved" ? "✅ APPROVED" :
            req.status === "rejected" ? "❌ REJECTED" :
            "⏳ PENDING";

        const typeLabel = CERT_TYPES_ADMIN[req.requestType]?.label || req.requestType;
        const accountTypeLabel = ACCOUNT_TYPES_LABEL_ADMIN[req.accountType] || "—";

        return `
            <div class="cert-request-card status-${statusClass}"
                 data-cert-req-id="${req.id}">

                <div class="cert-request-left">
                    <div class="cert-request-header">
                        <div class="cert-request-avatar">${initials}</div>
                        <div class="cert-request-info">
                            <strong>${escapeHTML(req.userName || "User")}</strong>
                            <span>${escapeHTML(req.userEmail || "")}</span>
                        </div>
                    </div>

                    <div class="cert-request-meta">
                        <span class="cert-request-tag type-tag">
                            ${escapeHTML(typeLabel)}
                        </span>
                        <span class="cert-request-tag">
                            ${escapeHTML(accountTypeLabel)}
                        </span>
                        ${req.accountSize ? `
                            <span class="cert-request-tag">
                                $${Number(req.accountSize).toLocaleString()}
                            </span>
                        ` : ""}
                        ${req.payoutAmount ? `
                            <span class="cert-request-tag">
                                Payout: $${Number(req.payoutAmount).toLocaleString()}
                            </span>
                        ` : ""}
                    </div>
                </div>

                <div class="cert-request-right">
                    <span class="cert-request-status ${statusClass}">
                        ${statusLabel}
                    </span>

                    <span class="cert-request-date">
                        ${formatDate(req.requestedAt)}
                    </span>

                    <button class="cert-request-action"
                            data-cert-review="${req.id}">
                        ${req.status === "pending" ? "Review" : "View"}
                    </button>
                </div>
            </div>
        `;
    }).join("");

    certsList.querySelectorAll("[data-cert-review]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const req = allCertRequests.find(r => r.id === btn.dataset.certReview);
            if (req) openCertReviewModal(req);
        });
    });

    certsList.querySelectorAll(".cert-request-card").forEach(card => {
        card.addEventListener("click", (e) => {
            if (e.target.closest("[data-cert-review]")) return;
            const req = allCertRequests.find(r => r.id === card.dataset.certReqId);
            if (req) openCertReviewModal(req);
        });
    });
}


/* =========================================================
   CERTIFICATES — FILTERS
========================================================= */

if (certsFilters) {
    certsFilters.querySelectorAll(".cert-filter").forEach(btn => {
        btn.addEventListener("click", () => {
            certsFilters.querySelectorAll(".cert-filter").forEach(b => {
                b.classList.remove("active");
            });
            btn.classList.add("active");

            certsFilter = btn.dataset.status;
            renderCertRequests();
        });
    });
}


/* =========================================================
   CERTIFICATES — REVIEW MODAL
========================================================= */

function openCertReviewModal(req) {
    if (!certReviewModal) return;

    selectedCertReq = req;

    const isPending = req.status === "pending";

    certReviewTitle.textContent = isPending ? "Review Request" : "Certificate Details";

    certReviewUser.innerHTML = `
        <strong>${escapeHTML(req.userName || "User")}</strong>
        <span>${escapeHTML(req.userEmail || "")}</span>
        <span>
            Requested Type: <b>${escapeHTML(CERT_TYPES_ADMIN[req.requestType]?.label || req.requestType)}</b>
            &nbsp;•&nbsp;
            Status: <b>${escapeHTML(req.status.toUpperCase())}</b>
        </span>
        <span style="margin-top:6px;color:#8a909d;">
            Submitted: ${formatDate(req.requestedAt)}
        </span>
    `;

    certReviewType.value        = req.requestType || "phase1";
    certReviewAccountType.value = req.accountType || "1step";
    certReviewAccountSize.value = req.accountSize || 0;

    if (req.requestType === "payout") {
        certReviewPayoutRow.style.display = "flex";
        certReviewPayoutAmount.value = req.payoutAmount || 0;
    } else {
        certReviewPayoutRow.style.display = "none";
        certReviewPayoutAmount.value = "";
    }

    certReviewError.textContent = "";
    certReviewError.classList.remove("show");

    if (isPending) {
        certReviewApproveBtn.style.display = "block";
        certReviewRejectBtn.style.display  = "block";
        certReviewApproveBtn.textContent = "Approve & Issue";
    } else {
        certReviewApproveBtn.style.display = "block";
        certReviewRejectBtn.style.display  = "none";
        certReviewApproveBtn.textContent = "Close";
    }

    certReviewType.onchange = () => {
        if (certReviewType.value === "payout") {
            certReviewPayoutRow.style.display = "flex";
        } else {
            certReviewPayoutRow.style.display = "none";
        }
    };

    certReviewModal.classList.add("open");
}


function closeCertReviewModal() {
    if (!certReviewModal) return;
    certReviewModal.classList.remove("open");
    selectedCertReq = null;
}


if (certReviewModalClose) {
    certReviewModalClose.addEventListener("click", closeCertReviewModal);
}

if (certReviewModal) {
    certReviewModal.addEventListener("click", (e) => {
        if (e.target === certReviewModal) closeCertReviewModal();
    });
}


/* =========================================================
   CERTIFICATES — APPROVE / REJECT
========================================================= */

if (certReviewApproveBtn) {
    certReviewApproveBtn.addEventListener("click", async () => {
        if (!selectedCertReq) return;

        if (selectedCertReq.status !== "pending") {
            closeCertReviewModal();
            return;
        }

        const type         = certReviewType.value;
        const accountType  = certReviewAccountType.value;
        const accountSize  = Number(certReviewAccountSize.value) || 0;
        const payoutAmount = type === "payout"
            ? (Number(certReviewPayoutAmount.value) || 0)
            : 0;

        if (!accountSize) {
            certReviewError.textContent = "Account size is required.";
            certReviewError.classList.add("show");
            return;
        }

        if (type === "payout" && !payoutAmount) {
            certReviewError.textContent = "Payout amount is required for payout certificates.";
            certReviewError.classList.add("show");
            return;
        }

        certReviewApproveBtn.disabled = true;
        certReviewApproveBtn.textContent = "Issuing...";

        try {
            const certData = await issueCertificate({
                userId:       selectedCertReq.userId,
                userEmail:    selectedCertReq.userEmail,
                userName:     selectedCertReq.userName,
                type:         type,
                accountType:  accountType,
                accountSize:  accountSize,
                payoutAmount: payoutAmount
            });

            await updateDoc(
                doc(db, "certificate_requests", selectedCertReq.id),
                {
                    status: "approved",
                    certificateId: certData.certId,
                    verificationId: certData.verificationId,
                    reviewedAt: serverTimestamp(),
                    reviewedBy: currentUser.uid
                }
            );

            await addDoc(
                collection(db, "users", selectedCertReq.userId, "notifications"),
                {
                    title: "Certificate Issued 🎓",
                    message: `Your ${CERT_TYPES_ADMIN[type]?.label || type} certificate has been issued. View and download it from your Certificates section.`,
                    icon: "🎓",
                    read: false,
                    createdAt: serverTimestamp()
                }
            );

            closeCertReviewModal();
            await loadCertRequests();

            alert("✅ Certificate issued successfully!");

        } catch (err) {
            console.error("Issue certificate error:", err);
            certReviewError.textContent = "Error: " + err.message;
            certReviewError.classList.add("show");

        } finally {
            certReviewApproveBtn.disabled = false;
            certReviewApproveBtn.textContent = "Approve & Issue";
        }
    });
}


if (certReviewRejectBtn) {
    certReviewRejectBtn.addEventListener("click", async () => {
        if (!selectedCertReq) return;

        const reason = prompt("Reason for rejection (optional):", "");

        if (reason === null) return;

        certReviewRejectBtn.disabled = true;
        certReviewRejectBtn.textContent = "Rejecting...";

        try {
            await updateDoc(
                doc(db, "certificate_requests", selectedCertReq.id),
                {
                    status: "rejected",
                    rejectReason: reason || "No reason provided",
                    reviewedAt: serverTimestamp(),
                    reviewedBy: currentUser.uid
                }
            );

            await addDoc(
                collection(db, "users", selectedCertReq.userId, "notifications"),
                {
                    title: "Certificate Request Rejected",
                    message: `Your certificate request was rejected. ${reason ? "Reason: " + reason : ""}`,
                    icon: "❌",
                    read: false,
                    createdAt: serverTimestamp()
                }
            );

            closeCertReviewModal();
            await loadCertRequests();

            alert("Request rejected.");

        } catch (err) {
            console.error("Reject cert error:", err);
            certReviewError.textContent = "Error: " + err.message;
            certReviewError.classList.add("show");

        } finally {
            certReviewRejectBtn.disabled = false;
            certReviewRejectBtn.textContent = "Reject";
        }
    });
}


/* =========================================================
   CERTIFICATES — ISSUE
========================================================= */

async function issueCertificate({
    userId,
    userEmail,
    userName,
    type,
    accountType,
    accountSize,
    payoutAmount = 0
}) {
    const verificationId   = generateVerificationId();
    const certId           = "CERT-" + verificationId;
    const accountTypeLabel = ACCOUNT_TYPES_LABEL_ADMIN[accountType] || "—";
    const title            = CERT_TYPES_ADMIN[type]?.label || "Certificate";

    const certRef = await addDoc(
        collection(db, "users", userId, "certificates"),
        {
            certId,
            verificationId,
            type,
            title,
            userName,
            userEmail,
            accountType,
            accountTypeLabel,
            accountSize,
            payoutAmount,
            issuedAt: serverTimestamp(),
            issuedBy: currentUser.uid,
            status: "active"
        }
    );

    await setDoc(
        doc(db, "certificates_index", verificationId),
        {
            verificationId,
            certId,
            userId,
            userName,
            type,
            title,
            accountType,
            accountTypeLabel,
            accountSize,
            payoutAmount,
            issuedAt: serverTimestamp(),
            status: "active"
        }
    );

    return {
        id: certRef.id,
        verificationId,
        certId,
        type,
        title,
        userName,
        userEmail,
        accountType,
        accountTypeLabel,
        accountSize,
        payoutAmount
    };
}


/* =========================================================
   CERTIFICATES — NEW MODAL
========================================================= */

async function openCertNewModal() {
    if (!certNewModal) return;

    if (!allUsersList.length) {
        try {
            const snap = await getDocs(collection(db, "users"));
            allUsersList = snap.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));
        } catch (err) {
            console.error("Load users error:", err);
            alert("Could not load users list.");
            return;
        }
    }

    certNewUserSelect.innerHTML = `
        <option value="">— Choose a user —</option>
        ${allUsersList
            .filter(u => u.email)
            .sort((a, b) => (a.email || "").localeCompare(b.email || ""))
            .map(u => {
                const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email;
                return `<option value="${u.id}">${escapeHTML(name)} • ${escapeHTML(u.email)}</option>`;
            }).join("")}
    `;

    certNewType.value        = "phase1";
    certNewAccountType.value = "1step";
    certNewAccountSize.value = 0;
    certNewPayoutAmount.value = "";
    certNewPayoutRow.style.display = "none";
    certNewError.textContent = "";
    certNewError.classList.remove("show");

    certNewType.onchange = () => {
        if (certNewType.value === "payout") {
            certNewPayoutRow.style.display = "flex";
        } else {
            certNewPayoutRow.style.display = "none";
        }
    };

    certNewModal.classList.add("open");
}


function closeCertNewModal() {
    if (!certNewModal) return;
    certNewModal.classList.remove("open");
}


if (newCertBtn) {
    newCertBtn.addEventListener("click", openCertNewModal);
}

if (certNewModalClose) {
    certNewModalClose.addEventListener("click", closeCertNewModal);
}

if (certNewCancelBtn) {
    certNewCancelBtn.addEventListener("click", closeCertNewModal);
}

if (certNewModal) {
    certNewModal.addEventListener("click", (e) => {
        if (e.target === certNewModal) closeCertNewModal();
    });
}


if (certNewCreateBtn) {
    certNewCreateBtn.addEventListener("click", async () => {
        const userId = certNewUserSelect.value;

        if (!userId) {
            certNewError.textContent = "Please select a user.";
            certNewError.classList.add("show");
            return;
        }

        const user = allUsersList.find(u => u.id === userId);
        if (!user) return;

        const type         = certNewType.value;
        const accountType  = certNewAccountType.value;
        const accountSize  = Number(certNewAccountSize.value) || 0;
        const payoutAmount = type === "payout"
            ? (Number(certNewPayoutAmount.value) || 0)
            : 0;

        if (!accountSize) {
            certNewError.textContent = "Account size is required.";
            certNewError.classList.add("show");
            return;
        }

        if (type === "payout" && !payoutAmount) {
            certNewError.textContent = "Payout amount is required for payout certificates.";
            certNewError.classList.add("show");
            return;
        }

        certNewCreateBtn.disabled = true;
        certNewCreateBtn.textContent = "Creating...";

        try {
            const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;

            await issueCertificate({
                userId,
                userEmail: user.email,
                userName,
                type,
                accountType,
                accountSize,
                payoutAmount
            });

            await addDoc(
                collection(db, "users", userId, "notifications"),
                {
                    title: "Certificate Issued 🎓",
                    message: `Your ${CERT_TYPES_ADMIN[type]?.label || type} certificate has been issued. View and download it from your Certificates section.`,
                    icon: "🎓",
                    read: false,
                    createdAt: serverTimestamp()
                }
            );

            closeCertNewModal();
            alert("✅ Certificate created successfully!");

        } catch (err) {
            console.error("Create cert error:", err);
            certNewError.textContent = "Error: " + err.message;
            certNewError.classList.add("show");

        } finally {
            certNewCreateBtn.disabled = false;
            certNewCreateBtn.textContent = "Create Certificate";
        }
    });
}


/* =========================================================
   CERT PREVIEW ADMIN — Close + Download
========================================================= */

function closeCertPreviewAdmin() {
    if (!certPreviewAdminModal) return;
    certPreviewAdminModal.classList.remove("open");
    currentCertView = null;
}

if (certPreviewAdminClose) {
    certPreviewAdminClose.addEventListener("click", closeCertPreviewAdmin);
}
if (certPreviewAdminCloseBtn) {
    certPreviewAdminCloseBtn.addEventListener("click", closeCertPreviewAdmin);
}
if (certPreviewAdminModal) {
    certPreviewAdminModal.addEventListener("click", (e) => {
        if (e.target === certPreviewAdminModal) closeCertPreviewAdmin();
    });
}

if (certPreviewAdminDownloadBtn) {
    certPreviewAdminDownloadBtn.addEventListener("click", async () => {
        if (!certAdminCanvas) return;

        const btn = certPreviewAdminDownloadBtn;
        btn.disabled = true;
        btn.textContent = "⏳ Preparing...";

        try {
            if (document.fonts && document.fonts.ready) {
                try { await document.fonts.ready; } catch {}
            }

            await new Promise(r => setTimeout(r, 500));

            const rendered = await html2canvas(certAdminCanvas, {
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

            const imgRatio = rendered.width / rendered.height;
            const pdfRatio = pdfWidth / pdfHeight;

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
            pdf.save(`RISE-FUNDED-${currentCertView?.certId || "Certificate"}.pdf`);

        } catch (err) {
            console.error("PDF error:", err);
            alert("Could not generate PDF.");
        } finally {
            btn.disabled = false;
            btn.textContent = "⬇ Download PDF";
        }
    });
}


/* =========================================================
   KYC — STATS
========================================================= */

function renderKycStats() {
    if (!kycStatPending) return;

    const pending  = allKycRequests.filter(r => r.status === "pending").length;
    const verified = allKycRequests.filter(r => r.status === "verified").length;
    const rejected = allKycRequests.filter(r => r.status === "rejected").length;

    kycStatPending.textContent  = pending;
    kycStatVerified.textContent = verified;
    kycStatRejected.textContent = rejected;
}


function renderKycBadge() {
    if (!kycBadge) return;

    const pending = allKycRequests.filter(r => r.status === "pending").length;

    if (pending > 0) {
        kycBadge.textContent = pending;
        kycBadge.style.display = "inline-flex";
    } else {
        kycBadge.style.display = "none";
    }
}


/* =========================================================
   KYC — RENDER LIST
========================================================= */

function getFilteredKycRequests() {
    if (kycFilter === "all") return allKycRequests;
    return allKycRequests.filter(r => r.status === kycFilter);
}


function renderKycRequests() {
    if (!kycList) return;

    const list = getFilteredKycRequests();

    if (!list.length) {
        kycList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">🛡️</div>
                <strong>No KYC requests here</strong>
                <p>Nothing to show for this filter.</p>
            </div>
        `;
        return;
    }

    kycList.innerHTML = list.map(req => {
        const initials = getInitials(req.userName || req.userEmail || "?");

        const statusClass =
            req.status === "verified" ? "verified" :
            req.status === "rejected" ? "rejected" :
            "pending";

        const statusLabel =
            req.status === "verified" ? "✅ VERIFIED" :
            req.status === "rejected" ? "❌ REJECTED" :
            "⏳ PENDING";

        const docTypeLabel =
            req.documentType === "passport" ? "Passport" :
            req.documentType === "national_id" ? "National ID" :
            req.documentType === "driver_license" ? "Driver's License" :
            req.documentType || "—";

        return `
            <div class="kyc-request-card status-${statusClass}"
                 data-kyc-req-id="${req.id}">

                <div class="kyc-request-left">
                    <div class="kyc-request-header">
                        <div class="kyc-request-avatar">${initials}</div>
                        <div class="kyc-request-info">
                            <strong>${escapeHTML(req.userName || "User")}</strong>
                            <span>${escapeHTML(req.userEmail || "")}</span>
                        </div>
                    </div>

                    <div class="kyc-request-meta">
                        <span class="kyc-request-tag type-tag">
                            ${escapeHTML(req.fullName || "—")}
                        </span>
                        <span class="kyc-request-tag">
                            ${escapeHTML(docTypeLabel)}
                        </span>
                        <span class="kyc-request-tag">
                            ${escapeHTML(req.country || "—")}
                        </span>
                    </div>
                </div>

                <div class="kyc-request-right">
                    <span class="kyc-request-status ${statusClass}">
                        ${statusLabel}
                    </span>

                    <span class="kyc-request-date">
                        ${formatDate(req.submittedAt)}
                    </span>

                    <button class="kyc-request-action"
                            data-kyc-review="${req.id}">
                        ${req.status === "pending" ? "Review" : "View"}
                    </button>
                </div>
            </div>
        `;
    }).join("");

    kycList.querySelectorAll("[data-kyc-review]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const req = allKycRequests.find(r => r.id === btn.dataset.kycReview);
            if (req) openKycReviewModal(req);
        });
    });

    kycList.querySelectorAll(".kyc-request-card").forEach(card => {
        card.addEventListener("click", (e) => {
            if (e.target.closest("[data-kyc-review]")) return;
            const req = allKycRequests.find(r => r.id === card.dataset.kycReqId);
            if (req) openKycReviewModal(req);
        });
    });
}


/* =========================================================
   KYC — FILTERS
========================================================= */

if (kycFilters) {
    kycFilters.querySelectorAll(".kyc-filter").forEach(btn => {
        btn.addEventListener("click", () => {
            kycFilters.querySelectorAll(".kyc-filter").forEach(b => {
                b.classList.remove("active");
            });
            btn.classList.add("active");

            kycFilter = btn.dataset.status;
            renderKycRequests();
        });
    });
}


/* =========================================================
   KYC — REVIEW MODAL
========================================================= */

function openKycReviewModal(req) {
    if (!kycReviewModal) return;

    selectedKycReq = req;

    const isPending = req.status === "pending";

    kycReviewTitle.textContent = isPending ? "Review KYC" : "KYC Details";

    kycReviewUser.innerHTML = `
        <strong>${escapeHTML(req.userName || "User")}</strong>
        <span>${escapeHTML(req.userEmail || "")}</span>
        <span>
            User ID: <b>${escapeHTML(req.userId || "—")}</b>
        </span>
        <span style="margin-top:6px;color:#8a909d;">
            Submitted: ${formatDate(req.submittedAt)}
        </span>
    `;

    kycReviewFullName.value = req.fullName || "";
    kycReviewDocumentType.value =
        req.documentType === "passport" ? "Passport" :
        req.documentType === "national_id" ? "National ID Card" :
        req.documentType === "driver_license" ? "Driver's License" :
        req.documentType || "";
    kycReviewCountry.value = req.country || "";
    kycReviewDocumentNumber.value = req.documentNumber || "";

    kycReviewError.textContent = "";
    kycReviewError.classList.remove("show");
    kycReviewRejectRow.style.display = "none";
    kycReviewRejectReason.value = "";

    if (isPending) {
        kycReviewApproveBtn.style.display = "block";
        kycReviewRejectBtn.style.display  = "block";
        kycReviewApproveBtn.textContent = "✓ Approve KYC";
    } else {
        kycReviewApproveBtn.style.display = "none";
        kycReviewRejectBtn.style.display  = "none";
    }

    kycReviewModal.classList.add("open");
}


function closeKycReviewModal() {
    if (!kycReviewModal) return;
    kycReviewModal.classList.remove("open");
    selectedKycReq = null;
}


if (kycReviewModalClose) {
    kycReviewModalClose.addEventListener("click", closeKycReviewModal);
}

if (kycReviewModal) {
    kycReviewModal.addEventListener("click", (e) => {
        if (e.target === kycReviewModal) closeKycReviewModal();
    });
}


/* =========================================================
   KYC — APPROVE / REJECT
========================================================= */

if (kycReviewApproveBtn) {
    kycReviewApproveBtn.addEventListener("click", async () => {
        if (!selectedKycReq) return;

        if (selectedKycReq.status !== "pending") {
            closeKycReviewModal();
            return;
        }

        if (!confirm("Approve this KYC request? Make sure you've verified the documents in your email inbox.")) {
            return;
        }

        kycReviewApproveBtn.disabled = true;
        kycReviewApproveBtn.textContent = "Approving...";

        try {
            await updateDoc(
                doc(db, "kyc_requests", selectedKycReq.id),
                {
                    status: "verified",
                    reviewedAt: serverTimestamp(),
                    reviewedBy: currentUser.uid
                }
            );

            await updateDoc(
                doc(db, "users", selectedKycReq.userId),
                {
                    kycStatus: "verified",
                    kycVerifiedAt: serverTimestamp()
                }
            );

            await addDoc(
                collection(db, "users", selectedKycReq.userId, "notifications"),
                {
                    title: "KYC Verified ✅",
                    message: "Your identity has been successfully verified. You're now eligible for withdrawals.",
                    icon: "🛡️",
                    read: false,
                    createdAt: serverTimestamp()
                }
            );

            closeKycReviewModal();
            await loadKycRequests();

            alert("✅ KYC approved successfully!");

        } catch (err) {
            console.error("Approve KYC error:", err);
            kycReviewError.textContent = "Error: " + err.message;
            kycReviewError.classList.add("show");

        } finally {
            kycReviewApproveBtn.disabled = false;
            kycReviewApproveBtn.textContent = "✓ Approve KYC";
        }
    });
}


if (kycReviewRejectBtn) {
    kycReviewRejectBtn.addEventListener("click", async () => {
        if (!selectedKycReq) return;

        /* --- اگه reason hidden هست، نشون بده --- */
        if (kycReviewRejectRow.style.display === "none") {
            kycReviewRejectRow.style.display = "block";
            kycReviewRejectReason.focus();
            kycReviewRejectBtn.textContent = "Confirm Rejection";
            return;
        }

        const reason = kycReviewRejectReason.value.trim();

        if (!reason || reason.length < 5) {
            kycReviewError.textContent = "Please provide a rejection reason (at least 5 characters).";
            kycReviewError.classList.add("show");
            return;
        }

        kycReviewRejectBtn.disabled = true;
        kycReviewRejectBtn.textContent = "Rejecting...";

        try {
            await updateDoc(
                doc(db, "kyc_requests", selectedKycReq.id),
                {
                    status: "rejected",
                    rejectReason: reason,
                    reviewedAt: serverTimestamp(),
                    reviewedBy: currentUser.uid
                }
            );

            await updateDoc(
                doc(db, "users", selectedKycReq.userId),
                {
                    kycStatus: "rejected",
                    kycRejectReason: reason
                }
            );

            await addDoc(
                collection(db, "users", selectedKycReq.userId, "notifications"),
                {
                    title: "KYC Verification Failed ❌",
                    message: `Your KYC was rejected. Reason: ${reason}`,
                    icon: "❌",
                    read: false,
                    createdAt: serverTimestamp()
                }
            );

            closeKycReviewModal();
            await loadKycRequests();

            alert("KYC request rejected.");

        } catch (err) {
            console.error("Reject KYC error:", err);
            kycReviewError.textContent = "Error: " + err.message;
            kycReviewError.classList.add("show");

        } finally {
            kycReviewRejectBtn.disabled = false;
            kycReviewRejectBtn.textContent = "Reject";
        }
    });
}


/* =========================================================
   WITHDRAWALS — STATS
========================================================= */

function renderWdStats() {
    if (!wdStatPending) return;

    const pendingList = allWithdrawals.filter(r => r.status === "pending");
    const paidList    = allWithdrawals.filter(r => r.status === "paid");

    const pendingAmount = pendingList.reduce(
        (sum, r) => sum + Number(r.amount || 0),
        0
    );

    const paidAmount = paidList.reduce(
        (sum, r) => sum + Number(r.amount || 0),
        0
    );

    wdStatPending.textContent       = pendingList.length;
    wdStatPaid.textContent          = paidList.length;
    wdStatPendingAmount.textContent = formatMoney(pendingAmount);
    wdStatPaidAmount.textContent    = formatMoney(paidAmount);
}


function renderWdBadge() {
    if (!withdrawalsBadge) return;

    const pending = allWithdrawals.filter(r => r.status === "pending").length;

    if (pending > 0) {
        withdrawalsBadge.textContent = pending;
        withdrawalsBadge.style.display = "inline-flex";
    } else {
        withdrawalsBadge.style.display = "none";
    }
}


/* =========================================================
   WITHDRAWALS — RENDER LIST
========================================================= */

function getFilteredWithdrawals() {
    if (wdFilter === "all") return allWithdrawals;
    return allWithdrawals.filter(r => r.status === wdFilter);
}


function renderWithdrawals() {
    if (!wdList) return;

    const list = getFilteredWithdrawals();

    if (!list.length) {
        wdList.innerHTML = `
            <div class="empty">
                <div class="empty-icon">💸</div>
                <strong>No withdrawal requests here</strong>
                <p>Nothing to show for this filter.</p>
            </div>
        `;
        return;
    }

    wdList.innerHTML = list.map(req => {
        const initials = getInitials(req.userName || req.userEmail || "?");

        const statusClass = req.status || "pending";

        const statusLabel =
            req.status === "paid"     ? "✅ PAID" :
            req.status === "approved" ? "✓ APPROVED" :
            req.status === "rejected" ? "❌ REJECTED" :
            "⏳ PENDING";

        return `
            <div class="wd-request-card status-${statusClass}"
                 data-wd-req-id="${req.id}">

                <div class="wd-request-left">
                    <div class="wd-request-header">
                        <div class="wd-request-avatar">${initials}</div>
                        <div class="wd-request-info">
                            <strong>${escapeHTML(req.userName || "User")}</strong>
                            <span>${escapeHTML(req.userEmail || "")}</span>
                        </div>
                    </div>

                    <div class="wd-request-meta">
                        <span class="wd-request-tag amount-tag">
                            ${formatMoney(req.amount)}
                        </span>
                        <span class="wd-request-tag">
                            ${escapeHTML(req.network || "—")}
                        </span>
                        <span class="wd-request-tag">
                            ${escapeHTML(req.accountId || "—")}
                        </span>
                    </div>
                </div>

                <div class="wd-request-right">
                    <span class="wd-request-status ${statusClass}">
                        ${statusLabel}
                    </span>

                    <span class="wd-request-date">
                        ${formatDate(req.requestedAt)}
                    </span>

                    <button class="wd-request-action"
                            data-wd-review="${req.id}">
                        ${req.status === "pending" ? "Review" : "View"}
                    </button>
                </div>
            </div>
        `;
    }).join("");

    wdList.querySelectorAll("[data-wd-review]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const req = allWithdrawals.find(r => r.id === btn.dataset.wdReview);
            if (req) openWdReviewModal(req);
        });
    });

    wdList.querySelectorAll(".wd-request-card").forEach(card => {
        card.addEventListener("click", (e) => {
            if (e.target.closest("[data-wd-review]")) return;
            const req = allWithdrawals.find(r => r.id === card.dataset.wdReqId);
            if (req) openWdReviewModal(req);
        });
    });
}


/* =========================================================
   WITHDRAWALS — FILTERS
========================================================= */

if (wdFilters) {
    wdFilters.querySelectorAll(".wd-filter").forEach(btn => {
        btn.addEventListener("click", () => {
            wdFilters.querySelectorAll(".wd-filter").forEach(b => {
                b.classList.remove("active");
            });
            btn.classList.add("active");

            wdFilter = btn.dataset.status;
            renderWithdrawals();
        });
    });
}


/* =========================================================
   WITHDRAWALS — REVIEW MODAL
========================================================= */

function openWdReviewModal(req) {
    if (!wdReviewModal) return;

    selectedWdReq = req;

    const status = req.status || "pending";

    wdReviewTitle.textContent = `Withdrawal — ${formatMoney(req.amount)}`;

    wdReviewUser.innerHTML = `
        <strong>${escapeHTML(req.userName || "User")}</strong>
        <span>${escapeHTML(req.userEmail || "")}</span>
        <span>
            Requested: <b>${formatDate(req.requestedAt)}</b>
        </span>
    `;

    wdReviewAmount.textContent  = formatMoney(req.amount);
    wdReviewNetwork.textContent = req.network || "—";
    wdReviewWallet.textContent  = req.walletAddress || "—";
    wdReviewAccountId.textContent = req.accountId || "—";

    wdReviewError.textContent = "";
    wdReviewError.classList.remove("show");
    wdReviewRejectRow.style.display = "none";
    wdReviewRejectReason.value = "";
    wdReviewTxid.value = "";

    const isPending = status === "pending";

    if (isPending) {
        wdReviewTxidRow.style.display = "flex";
        wdReviewApproveBtn.style.display = "block";
        wdReviewRejectBtn.style.display  = "block";
        wdReviewApproveBtn.textContent = "✓ Approve & Mark Paid";
    } else {
        wdReviewTxidRow.style.display = "none";
        wdReviewApproveBtn.style.display = "none";
        wdReviewRejectBtn.style.display  = "none";
    }

    /* --- پر کردن TxID اگه داشت --- */
    if (req.txid) {
        wdReviewTxid.value = req.txid;
    }

    wdReviewModal.classList.add("open");
}


function closeWdReviewModal() {
    if (!wdReviewModal) return;
    wdReviewModal.classList.remove("open");
    selectedWdReq = null;
}


if (wdReviewModalClose) {
    wdReviewModalClose.addEventListener("click", closeWdReviewModal);
}

if (wdReviewModal) {
    wdReviewModal.addEventListener("click", (e) => {
        if (e.target === wdReviewModal) closeWdReviewModal();
    });
}


/* =========================================================
   WITHDRAWALS — APPROVE / REJECT
========================================================= */

if (wdReviewApproveBtn) {
    wdReviewApproveBtn.addEventListener("click", async () => {
        if (!selectedWdReq) return;

        if (selectedWdReq.status !== "pending") {
            closeWdReviewModal();
            return;
        }

        const txid = wdReviewTxid.value.trim();

        if (!txid || txid.length < 10) {
            wdReviewError.textContent = "Please enter the transaction hash (TxID) for this payout.";
            wdReviewError.classList.add("show");
            return;
        }

        wdReviewApproveBtn.disabled = true;
        wdReviewApproveBtn.textContent = "Processing...";

        try {
            /* --- آپدیت withdrawal request --- */
            await updateDoc(
                doc(db, "withdrawal_requests", selectedWdReq.id),
                {
                    status: "paid",
                    txid: txid,
                    paidAt: serverTimestamp(),
                    reviewedAt: serverTimestamp(),
                    reviewedBy: currentUser.uid
                }
            );

            /* --- ساخت transaction توی user --- */
            await addDoc(
                collection(db, "users", selectedWdReq.userId, "transactions"),
                {
                    type: "withdrawal",
                    title: "Withdrawal Paid",
                    description: `${formatMoney(selectedWdReq.amount)} — ${selectedWdReq.network}`,
                    amount: -Math.abs(Number(selectedWdReq.amount) || 0),
                    currency: "USD",
                    status: "completed",
                    reference: txid,
                    meta: {
                        withdrawalId: selectedWdReq.id,
                        network: selectedWdReq.network,
                        walletAddress: selectedWdReq.walletAddress,
                        accountId: selectedWdReq.accountId,
                        paidAt: new Date().toISOString()
                    },
                    createdAt: serverTimestamp()
                }
            );

            /* --- notification --- */
            await addDoc(
                collection(db, "users", selectedWdReq.userId, "notifications"),
                {
                    title: "Withdrawal Paid ✅",
                    message: `Your withdrawal of ${formatMoney(selectedWdReq.amount)} has been paid. TxID: ${txid.slice(0, 20)}...`,
                    icon: "💸",
                    read: false,
                    createdAt: serverTimestamp()
                }
            );

            closeWdReviewModal();
            await loadWithdrawals();

            alert("✅ Withdrawal paid successfully!");

        } catch (err) {
            console.error("Approve withdrawal error:", err);
            wdReviewError.textContent = "Error: " + err.message;
            wdReviewError.classList.add("show");

        } finally {
            wdReviewApproveBtn.disabled = false;
            wdReviewApproveBtn.textContent = "✓ Approve & Mark Paid";
        }
    });
}


if (wdReviewRejectBtn) {
    wdReviewRejectBtn.addEventListener("click", async () => {
        if (!selectedWdReq) return;

        /* --- اگه reason hidden هست، نشون بده --- */
        if (wdReviewRejectRow.style.display === "none") {
            wdReviewRejectRow.style.display = "block";
            wdReviewRejectReason.focus();
            wdReviewRejectBtn.textContent = "Confirm Rejection";
            return;
        }

        const reason = wdReviewRejectReason.value.trim();

        if (!reason || reason.length < 5) {
            wdReviewError.textContent = "Please provide a rejection reason (at least 5 characters).";
            wdReviewError.classList.add("show");
            return;
        }

        wdReviewRejectBtn.disabled = true;
        wdReviewRejectBtn.textContent = "Rejecting...";

        try {
            await updateDoc(
                doc(db, "withdrawal_requests", selectedWdReq.id),
                {
                    status: "rejected",
                    rejectReason: reason,
                    reviewedAt: serverTimestamp(),
                    reviewedBy: currentUser.uid
                }
            );

            await addDoc(
                collection(db, "users", selectedWdReq.userId, "notifications"),
                {
                    title: "Withdrawal Rejected ❌",
                    message: `Your withdrawal of ${formatMoney(selectedWdReq.amount)} was rejected. Reason: ${reason}`,
                    icon: "❌",
                    read: false,
                    createdAt: serverTimestamp()
                }
            );

            closeWdReviewModal();
            await loadWithdrawals();

            alert("Withdrawal request rejected.");

        } catch (err) {
            console.error("Reject withdrawal error:", err);
            wdReviewError.textContent = "Error: " + err.message;
            wdReviewError.classList.add("show");

        } finally {
            wdReviewRejectBtn.disabled = false;
            wdReviewRejectBtn.textContent = "Reject";
        }
    });
}


/* =========================================================
   CHAT PANEL
========================================================= */

async function openChatPanel(ticketId) {
    if (!chatPanel) return;

    currentTicketId = ticketId;

    const ticket = allTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    chatPanelSubject.textContent = ticket.subject || "Support Ticket";

    const status = ticket.status || "open";
    chatPanelStatus.textContent =
        status === "resolved" ? "Resolved" :
        status === "pending"  ? "Pending" :
        "Open";

    chatPanelStatus.className = "chat-panel-status " + status;

    chatUserInfo.innerHTML = `
        <strong>${escapeHTML(ticket.userName || "User")}</strong>
        <span>${escapeHTML(ticket.userEmail || "")}</span>
    `;

    chatResolveBtn.style.display = status === "resolved" ? "none" : "grid";

    chatPanel.classList.add("show");

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
    if (!chatMessages) return;

    if (!messages.length) {
        chatMessages.innerHTML = `
            <div class="chat-empty">
                <span>No messages yet.</span>
            </div>
        `;
        return;
    }

    chatMessages.innerHTML = messages.map(msg => {
        const isAdmin = msg.senderType === "admin";

        const senderName = escapeHTML(
            msg.senderName || (isAdmin ? "Support" : "User")
        );

        return `
            <div class="chat-message ${isAdmin ? "from-admin" : "from-user"}">
                <div class="chat-message-meta">
                    <strong>${senderName}</strong>
                    <span>${formatDate(msg.createdAt)}</span>
                </div>
                <div class="chat-message-bubble">
                    ${escapeHTML(msg.text)}
                </div>
            </div>
        `;
    }).join("");

    chatMessages.scrollTop = chatMessages.scrollHeight;
}


async function sendChatMessage() {
    if (!chatInput || !currentTicketId) return;

    const text = chatInput.value.trim();
    if (!text) return;

    chatSendBtn.disabled = true;
    chatInput.disabled   = true;

    try {
        await addDoc(
            collection(db, "support_tickets", currentTicketId, "messages"),
            {
                senderId: currentUser.uid,
                senderType: "admin",
                senderName: "RISE FUNDED Support",
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
                status: "pending"
            }
        );

        chatInput.value = "";
        chatInput.style.height = "auto";

        const t = allTickets.find(x => x.id === currentTicketId);
        if (t) {
            t.lastMessage = text;
            t.status = "pending";
        }

        renderSupportBadge();
        renderTickets();

    } catch (err) {
        console.error("Send message error:", err);
        alert("Could not send message: " + err.message);

    } finally {
        chatSendBtn.disabled = false;
        chatInput.disabled   = false;
        chatInput.focus();
    }
}


async function resolveTicket() {
    if (!currentTicketId) return;

    if (!confirm("Mark this ticket as resolved?")) return;

    try {
        await updateDoc(
            doc(db, "support_tickets", currentTicketId),
            {
                status: "resolved",
                updatedAt: serverTimestamp()
            }
        );

        const t = allTickets.find(x => x.id === currentTicketId);
        if (t) t.status = "resolved";

        chatPanelStatus.textContent = "Resolved";
        chatPanelStatus.className = "chat-panel-status resolved";
        chatResolveBtn.style.display = "none";

        renderSupportBadge();
        renderTickets();

    } catch (err) {
        console.error("Resolve error:", err);
        alert("Error: " + err.message);
    }
}


function closeChatPanel() {
    if (chatPanel) chatPanel.classList.remove("show");

    if (currentTicketUnsub) {
        currentTicketUnsub();
        currentTicketUnsub = null;
    }

    currentTicketId = null;
}


/* =========================================================
   ORDER MODAL
========================================================= */

function openOrderModal(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    selectedOrder = order;

    modalOrderId.textContent = order.orderId || order.id;

    const explorer = getExplorerUrl(order.network, order.txid);
    const statusClass = getStatusClass(order.status);

    modalBody.innerHTML = `
        <div class="modal-row">
            <div class="modal-item">
                <span>User Email</span>
                <strong>${escapeHTML(order.email || order.userEmail || "—")}</strong>
            </div>
            <div class="modal-item">
                <span>Full Name</span>
                <strong>${escapeHTML((order.firstName || "") + " " + (order.lastName || ""))}</strong>
            </div>
        </div>

        <div class="modal-row">
            <div class="modal-item">
                <span>Country</span>
                <strong>${escapeHTML(order.country || "—")}</strong>
            </div>
            <div class="modal-item">
                <span>Phone</span>
                <strong>${escapeHTML(order.phone || "—")}</strong>
            </div>
        </div>

        <div class="modal-divider"></div>

        <div class="modal-row">
            <div class="modal-item">
                <span>Plan</span>
                <strong>${escapeHTML(order.planName || "—")}</strong>
            </div>
            <div class="modal-item">
                <span>Account Size</span>
                <strong>$${(order.accountSize || 0).toLocaleString()}</strong>
            </div>
        </div>

        <div class="modal-row">
            <div class="modal-item">
                <span>Payout Cycle</span>
                <strong>${escapeHTML(order.payoutCycle || "—")}</strong>
            </div>
            <div class="modal-item">
                <span>Profit Split</span>
                <strong>${escapeHTML(order.profitSplit || "—")}</strong>
            </div>
        </div>

        <div class="modal-divider"></div>

        <div class="modal-row">
            <div class="modal-item">
                <span>Base Price</span>
                <strong>$${order.basePrice || 0}</strong>
            </div>
            <div class="modal-item">
                <span>Discount</span>
                <strong>${order.discountCode ? `-$${order.discountAmount || 0} (${order.discountCode})` : "—"}</strong>
            </div>
        </div>

        <div class="modal-row">
            <div class="modal-item">
                <span>Total Amount</span>
                <strong style="color:#5b2aa8;font-size:20px">${formatMoney(order.total)}</strong>
            </div>
            <div class="modal-item">
                <span>Status</span>
                <div class="status-badge ${statusClass}" style="width:fit-content">
                    ${getStatusLabel(order.status)}
                </div>
            </div>
        </div>

        ${order.network ? `
            <div class="modal-divider"></div>

            <div class="modal-row">
                <div class="modal-item">
                    <span>Network</span>
                    <strong>${escapeHTML(order.network)}</strong>
                </div>
                <div class="modal-item">
                    <span>Wallet Address</span>
                    <code>${escapeHTML(order.walletAddress || "—")}</code>
                </div>
            </div>

            <div class="modal-item">
                <span>Transaction Hash (TxID)</span>
                <code>${escapeHTML(order.txid || "—")}</code>
                ${explorer ? `
                    <a href="${explorer}" target="_blank" rel="noopener">
                        View on explorer →
                    </a>
                ` : ""}
            </div>
        ` : ""}

        <div class="modal-row">
            <div class="modal-item">
                <span>Created</span>
                <strong>${formatDate(order.createdAt)}</strong>
            </div>
            <div class="modal-item">
                <span>Paid At</span>
                <strong>${formatDate(order.paidAt)}</strong>
            </div>
        </div>
    `;

    renderModalFooter(order);

    orderModal.classList.add("open");
    document.body.style.overflow = "hidden";
}


function renderModalFooter(order) {
    const isPending = order.status === "pending_review";

    if (isPending) {
        modalFooter.innerHTML = `
            <button class="btn-reject" id="btnReject">Reject Order</button>
            <button class="btn-approve" id="btnApprove">Approve & Send MT</button>
        `;

        document.getElementById("btnApprove").addEventListener("click", () => {
            openApproveModal(order);
        });

        document.getElementById("btnReject").addEventListener("click", () => {
            handleReject(order);
        });

    } else {
        modalFooter.innerHTML = `
            <button class="btn-cancel" id="btnClose">Close</button>
        `;
        document.getElementById("btnClose").addEventListener("click", closeModal);
    }
}


function closeModal() {
    orderModal.classList.remove("open");
    document.body.style.overflow = "";
    selectedOrder = null;
}


/* =========================================================
   APPROVE MODAL
========================================================= */

function openApproveModal(order) {
    if (!approveModal) return;

    pendingApproveOrder = order;

    approveInfo.innerHTML = `
        <strong>${escapeHTML(order.planName || "—")} • $${(order.accountSize || 0).toLocaleString()}</strong>
        <span>Trader: ${escapeHTML((order.firstName || "") + " " + (order.lastName || ""))}</span>
        <span>Email: ${escapeHTML(order.email || order.userEmail || "—")}</span>
    `;

    document.getElementById("mtLogin").value    = "";
    document.getElementById("mtPassword").value = "";
    document.getElementById("mtServer").value   = "";
    document.getElementById("mtBalance").value  = order.accountSize || 5000;

    approveError.textContent = "";
    approveError.classList.remove("show");

    approveModal.classList.add("open");
}


function closeApproveModal() {
    if (approveModal) approveModal.classList.remove("open");
    pendingApproveOrder = null;
}


if (approveModalClose) {
    approveModalClose.addEventListener("click", closeApproveModal);
}

if (approveCancelBtn) {
    approveCancelBtn.addEventListener("click", closeApproveModal);
}

if (approveModal) {
    approveModal.addEventListener("click", (e) => {
        if (e.target === approveModal) closeApproveModal();
    });
}

if (approveConfirmBtn) {
    approveConfirmBtn.addEventListener("click", async () => {
        if (!pendingApproveOrder) return;

        const mtLogin    = document.getElementById("mtLogin").value.trim();
        const mtPassword = document.getElementById("mtPassword").value.trim();
        const mtServer   = document.getElementById("mtServer").value.trim();
        const mtBalance  = Number(document.getElementById("mtBalance").value)
            || pendingApproveOrder.accountSize;

        if (!mtLogin) {
            approveError.textContent = "MT Login is required.";
            approveError.classList.add("show");
            return;
        }

        if (!mtPassword) {
            approveError.textContent = "MT Password is required.";
            approveError.classList.add("show");
            return;
        }

        if (!mtServer) {
            approveError.textContent = "MT Server is required.";
            approveError.classList.add("show");
            return;
        }

        approveConfirmBtn.disabled = true;
        approveConfirmBtn.textContent = "Approving...";

        try {
            await approveOrderWithMT(pendingApproveOrder, {
                login: mtLogin,
                password: mtPassword,
                server: mtServer,
                balance: mtBalance
            });

            closeApproveModal();
            closeModal();

            await loadOrders();

        } catch (err) {
            console.error("Approve error:", err);
            approveError.textContent = "Error: " + err.message;
            approveError.classList.add("show");

        } finally {
            approveConfirmBtn.disabled = false;
            approveConfirmBtn.textContent = "Approve & Send";
        }
    });
}


/* =========================================================
   CREATE TRANSACTION
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
    } catch (err) {
        console.error("Create transaction error:", err);
    }
}


/* =========================================================
   APPROVE ORDER
========================================================= */

async function approveOrderWithMT(order, mt) {
    await updateDoc(doc(db, "orders", order.id), {
        status: "paid",
        approvedAt: serverTimestamp(),
        approvedBy: currentUser.uid,
        mtAccount: mt
    });

    const challengeData = {
        orderId: order.orderId,
        planName: order.planName,
        plan: order.plan,
        accountSize: order.accountSize,
        profitTarget: order.profitTarget,
        maxDrawdown: order.maxDrawdown,
        dailyDrawdown: order.dailyDrawdown,
        minDays: order.minDays,
        leverage: order.leverage,
        payoutCycle: order.payoutCycle,
        profitSplit: order.profitSplit,
        accountId: "RF-" + Math.random().toString(36).slice(2, 8).toUpperCase(),

        mtLogin: mt.login,
        mtPassword: mt.password,
        mtServer: mt.server,
        mtBalance: mt.balance || order.accountSize,

        status: "active",
        profit: 0,
        balance: order.accountSize,
        equity: order.accountSize,
        dailyDrawdownCurrent: 0,
        maxDrawdownCurrent: 0,
        createdAt: serverTimestamp()
    };

    await addDoc(
        collection(db, "users", order.userId, "challenges"),
        challengeData
    );

    await createTransaction({
        userId: order.userId,
        type: "purchase",
        title: "Payment Approved",
        description: `${order.planName} • $${(order.accountSize || 0).toLocaleString()} Account`,
        amount: Number(order.total) || 0,
        status: "completed",
        reference: order.orderId,
        meta: {
            orderId: order.orderId,
            docId: order.id,
            plan: order.plan,
            accountSize: order.accountSize,
            mtLogin: mt.login,
            mtServer: mt.server,
            approvedAt: new Date().toISOString()
        }
    });

    await addDoc(
        collection(db, "users", order.userId, "notifications"),
        {
            title: "Challenge Activated ✅",
            message: `Your ${order.planName} $${(order.accountSize || 0).toLocaleString()} challenge is ready. MT credentials are available in your dashboard.`,
            icon: "🎉",
            read: false,
            createdAt: serverTimestamp()
        }
    );

    alert("✅ Order approved and MT account sent!");
}


/* =========================================================
   REJECT ORDER
========================================================= */

async function handleReject(order) {
    const reason = prompt("Why are you rejecting this order? (Optional)", "");

    if (reason === null) return;

    const btn = document.getElementById("btnReject");
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Rejecting...";
    }

    try {
        await updateDoc(doc(db, "orders", order.id), {
            status: "rejected",
            rejectedAt: serverTimestamp(),
            rejectedBy: currentUser.uid,
            rejectReason: reason || "No reason provided"
        });

        await createTransaction({
            userId: order.userId,
            type: "refund",
            title: "Purchase Cancelled",
            description: `${order.planName} • $${(order.accountSize || 0).toLocaleString()} Account ${reason ? "— " + reason : ""}`,
            amount: 0,
            status: "completed",
            reference: order.orderId,
            meta: {
                orderId: order.orderId,
                docId: order.id,
                reason: reason || "No reason provided",
                rejectedAt: new Date().toISOString()
            }
        });

        await addDoc(
            collection(db, "users", order.userId, "notifications"),
            {
                title: "Order Rejected ❌",
                message: `Your order ${order.orderId} has been rejected. ${reason ? "Reason: " + reason : ""}`,
                icon: "❌",
                read: false,
                createdAt: serverTimestamp()
            }
        );

        await loadOrders();
        closeModal();

        alert("Order rejected.");

    } catch (err) {
        console.error("Reject error:", err);
        alert("Error: " + err.message);
        if (btn) {
            btn.disabled = false;
            btn.textContent = "Reject Order";
        }
    }
}


/* =========================================================
   PROMOTIONS
========================================================= */

async function loadPromotions() {
    try {
        const snap = await getDoc(doc(db, "settings", "promotions"));

        if (!snap.exists()) return;

        const data = snap.data();

        if (data.topbar) {
            topbarEnabled.checked = !!data.topbar.enabled;
            topbarText.value      = data.topbar.text || "";
            topbarCode.value      = data.topbar.code || "";
            topbarDiscount.value  = data.topbar.discount || "";
        }

        if (data.popup) {
            popupEnabled.checked   = !!data.popup.enabled;
            popupTitle.value       = data.popup.title || "";
            popupDescription.value = data.popup.description || "";
            popupCode.value        = data.popup.code || "";
            popupPercent.value     = data.popup.percent || "";
            popupDelay.value       = data.popup.showDelay || 3000;
        }

    } catch (err) {
        console.error("Load promotions error:", err);
    }
}


function showPromoStatus(element, message, isError = false) {
    element.textContent = message;
    element.className = "promo-status show" + (isError ? " error" : "");

    setTimeout(() => {
        element.classList.remove("show");
    }, 3000);
}


async function saveTopbar() {
    saveTopbarBtn.disabled = true;
    saveTopbarBtn.textContent = "Saving...";

    try {
        await setDoc(
            doc(db, "settings", "promotions"),
            {
                topbar: {
                    enabled: topbarEnabled.checked,
                    text: topbarText.value.trim(),
                    code: topbarCode.value.trim().toUpperCase(),
                    discount: topbarDiscount.value.trim(),
                    updatedAt: serverTimestamp()
                }
            },
            { merge: true }
        );

        showPromoStatus(topbarStatus, "✅ Saved successfully!");

    } catch (err) {
        console.error("Save topbar error:", err);
        showPromoStatus(topbarStatus, "Error: " + err.message, true);

    } finally {
        saveTopbarBtn.disabled = false;
        saveTopbarBtn.textContent = "Save Top Bar";
    }
}


async function savePopup() {
    savePopupBtn.disabled = true;
    savePopupBtn.textContent = "Saving...";

    try {
        await setDoc(
            doc(db, "settings", "promotions"),
            {
                popup: {
                    enabled: popupEnabled.checked,
                    title: popupTitle.value.trim(),
                    description: popupDescription.value.trim(),
                    code: popupCode.value.trim().toUpperCase(),
                    percent: Number(popupPercent.value) || 0,
                    showDelay: Number(popupDelay.value) || 3000,
                    updatedAt: serverTimestamp()
                }
            },
            { merge: true }
        );

        showPromoStatus(popupStatus, "✅ Saved successfully!");

    } catch (err) {
        console.error("Save popup error:", err);
        showPromoStatus(popupStatus, "Error: " + err.message, true);

    } finally {
        savePopupBtn.disabled = false;
        savePopupBtn.textContent = "Save Popup";
    }
}


/* =========================================================
   TABS
========================================================= */

const tabTitles = {
    pending:      { kicker: "PENDING ORDERS",       title: "Pending Orders" },
    approved:     { kicker: "APPROVED ORDERS",      title: "Approved" },
    rejected:     { kicker: "REJECTED ORDERS",      title: "Rejected" },
    all:          { kicker: "ALL ORDERS",           title: "All Orders" },
    accounts:     { kicker: "ACCOUNTS MONITOR",     title: "Accounts" },
    certificates: { kicker: "CERTIFICATE REQUESTS", title: "Certificates" },
    kyc:          { kicker: "KYC REQUESTS",         title: "KYC Verification" },
    withdrawals:  { kicker: "WITHDRAWAL REQUESTS",  title: "Withdrawals" },
    support:      { kicker: "SUPPORT TICKETS",      title: "Support" },
    promotions:   { kicker: "MARKETING",            title: "Promotions" }
};


function switchTab(tab) {
    currentTab = tab;

    const t = tabTitles[tab] || tabTitles.pending;
    pageKicker.textContent = t.kicker;
    pageTitle.textContent  = t.title;

    /* پنهان کردن همه */
    statsRow.style.display          = "none";
    ordersList.style.display        = "none";
    supportPanel.style.display      = "none";
    promotionsPanel.style.display   = "none";
    accountsPanel.style.display     = "none";
    certificatesPanel.style.display = "none";
    kycPanel.style.display          = "none";
    withdrawalsPanel.style.display  = "none";

    if (tab === "promotions") {
        promotionsPanel.style.display = "flex";

    } else if (tab === "support") {
        supportPanel.style.display = "flex";
        loadTickets();

    } else if (tab === "accounts") {
        accountsPanel.style.display = "flex";
        loadAccounts();

    } else if (tab === "certificates") {
        certificatesPanel.style.display = "flex";
        loadCertRequests();

    } else if (tab === "kyc") {
        kycPanel.style.display = "flex";
        loadKycRequests();

    } else if (tab === "withdrawals") {
        withdrawalsPanel.style.display = "flex";
        loadWithdrawals();

    } else {
        statsRow.style.display   = "grid";
        ordersList.style.display = "flex";
        renderOrders();
    }

    navItems.forEach(item => {
        if (item.dataset.tab) {
            item.classList.toggle("active", item.dataset.tab === tab);
        } else {
            item.classList.remove("active");
        }
    });
}


navItems.forEach(item => {
    item.addEventListener("click", (e) => {
        if (!item.dataset.tab) return;

        e.preventDefault();
        switchTab(item.dataset.tab);
    });
});


/* =========================================================
   EVENTS
========================================================= */

refreshBtn.addEventListener("click", () => {
    refreshBtn.disabled = true;
    refreshBtn.textContent = "🔄 Loading...";

    let promise;

    if (currentTab === "support") {
        promise = loadTickets();
    } else if (currentTab === "accounts") {
        promise = loadAccounts();
    } else if (currentTab === "certificates") {
        promise = loadCertRequests();
    } else if (currentTab === "kyc") {
        promise = loadKycRequests();
    } else if (currentTab === "withdrawals") {
        promise = loadWithdrawals();
    } else {
        promise = loadOrders();
    }

    promise.finally(() => {
        refreshBtn.disabled = false;
        refreshBtn.textContent = "🔄 Refresh";
    });
});

saveTopbarBtn.addEventListener("click", saveTopbar);
savePopupBtn.addEventListener("click", savePopup);

modalClose.addEventListener("click", closeModal);

orderModal.addEventListener("click", (e) => {
    if (e.target === orderModal) closeModal();
});

if (chatBackBtn)    chatBackBtn.addEventListener("click", closeChatPanel);
if (chatSendBtn)    chatSendBtn.addEventListener("click", sendChatMessage);
if (chatResolveBtn) chatResolveBtn.addEventListener("click", resolveTicket);

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

if (accountModalClose) {
    accountModalClose.addEventListener("click", closeAccountModal);
}

if (accountModal) {
    accountModal.addEventListener("click", (e) => {
        if (e.target === accountModal) closeAccountModal();
    });
}

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if (orderModal.classList.contains("open")) closeModal();
        if (chatPanel.classList.contains("show")) closeChatPanel();
        if (approveModal && approveModal.classList.contains("open")) closeApproveModal();
        if (accountModal && accountModal.classList.contains("open")) closeAccountModal();
        if (certReviewModal && certReviewModal.classList.contains("open")) closeCertReviewModal();
        if (certNewModal && certNewModal.classList.contains("open")) closeCertNewModal();
        if (certPreviewAdminModal && certPreviewAdminModal.classList.contains("open")) closeCertPreviewAdmin();
        if (kycReviewModal && kycReviewModal.classList.contains("open")) closeKycReviewModal();
        if (wdReviewModal && wdReviewModal.classList.contains("open")) closeWdReviewModal();
    }
});

logoutBtn.addEventListener("click", async () => {
    logoutBtn.disabled = true;
    logoutBtn.textContent = "Logging out...";

    try {
        await signOut(auth);
        window.location.href = "../auth/login.html";
    } catch (err) {
        console.error("Logout error:", err);
        logoutBtn.disabled = false;
        logoutBtn.textContent = "Logout";
    }
});


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "../auth/login.html";
        return;
    }

    currentUser = user;

    const isAdmin = await checkAdmin(user.uid);

    if (!isAdmin) {
        loading.style.display = "none";
        denied.style.display = "flex";
        return;
    }

    adminEmail.textContent = user.email || "admin@rise-funded.com";
    adminName.textContent  = user.displayName || "Admin";
    adminAvatar.textContent = (user.email || "A").charAt(0).toUpperCase();

    await loadOrders();
    await loadTickets();
    await loadPromotions();

    loading.style.display = "none";
    adminPanel.style.display = "grid";
});