/* =========================================================
   RISE FUNDED — IMPORT MT5 REPORT
   Parses MT5 HTML and saves to Firestore
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
    updateDoc,
    addDoc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import { firebaseConfig } from "../js/firebase-config.js";


/* ---------- FIREBASE ---------- */
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);


/* ---------- STATE ---------- */
let currentUser    = null;
let allUsers       = [];
let allChallenges  = [];
let selectedAccount = null;
let currentFile    = null;
let parsedData     = null;


/* ---------- DOM ---------- */
const loading      = document.getElementById("loading");
const denied       = document.getElementById("denied");
const adminPanel   = document.getElementById("adminPanel");

const adminAvatar  = document.getElementById("adminAvatar");
const adminName    = document.getElementById("adminName");
const adminEmail   = document.getElementById("adminEmail");
const logoutBtn    = document.getElementById("logoutBtn");

const importAccountSelect = document.getElementById("importAccountSelect");
const uploadArea   = document.getElementById("uploadArea");
const fileInput    = document.getElementById("fileInput");
const uploadBtn    = document.getElementById("uploadBtn");
const fileInfo     = document.getElementById("fileInfo");
const fileName     = document.getElementById("fileName");
const fileSize     = document.getElementById("fileSize");
const fileRemove   = document.getElementById("fileRemove");

const previewCard  = document.getElementById("previewCard");
const importSummary = document.getElementById("importSummary");
const dailyList    = document.getElementById("dailyList");
const toggleDailyBtn = document.getElementById("toggleDailyBtn");
const importStatus = document.getElementById("importStatus");
const cancelImportBtn = document.getElementById("cancelImportBtn");
const saveImportBtn  = document.getElementById("saveImportBtn");

const errorModal   = document.getElementById("errorModal");
const errorModalClose = document.getElementById("errorModalClose");
const errorModalOk = document.getElementById("errorModalOk");
const errorMessage = document.getElementById("errorMessage");


/* =========================================================
   HELPERS
========================================================= */

function formatMoney(value) {
    const n = Number(value) || 0;
    const sign = n >= 0 ? "+" : "−";
    return sign + "$" + Math.abs(n).toFixed(2);
}

function formatMoneyAbs(value) {
    const n = Number(value) || 0;
    return "$" + n.toFixed(2);
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showImportStatus(message, isError = false) {
    importStatus.textContent = message;
    importStatus.className = "import-status show" + (isError ? " error" : "");

    setTimeout(() => {
        importStatus.classList.remove("show");
    }, 4000);
}

function showError(message) {
    errorMessage.textContent = message;
    errorModal.classList.add("open");
}

function closeErrorModal() {
    errorModal.classList.remove("open");
}


/* =========================================================
   LOAD CHALLENGES (همه‌ی کاربران)
========================================================= */

async function loadAllChallenges() {
    try {
        const usersSnap = await getDocs(collection(db, "users"));

        allUsers = usersSnap.docs.map(d => ({
            uid: d.id,
            ...d.data()
        }));

        allChallenges = [];

        for (const user of allUsers) {
            try {
                const chSnap = await getDocs(
                    collection(db, "users", user.uid, "challenges")
                );

                chSnap.docs.forEach(d => {
                    const data = d.data();

                    if (data.mtLogin && data.mtServer) {
                        allChallenges.push({
                            uid: user.uid,
                            challengeId: d.id,
                            userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User",
                            userEmail: user.email || "",
                            planName: data.planName || "—",
                            accountSize: data.accountSize || 0,
                            mtLogin: data.mtLogin,
                            mtServer: data.mtServer,
                            ...data
                        });
                    }
                });

            } catch (err) {
                console.warn(`Challenges for ${user.uid}:`, err);
            }
        }

        renderAccountOptions();

    } catch (err) {
        console.error("Load challenges error:", err);
        importAccountSelect.innerHTML = `<option value="">Error loading</option>`;
    }
}


function renderAccountOptions() {
    if (!allChallenges.length) {
        importAccountSelect.innerHTML = `
            <option value="">No active MT accounts found</option>
        `;
        return;
    }

    importAccountSelect.innerHTML = `
        <option value="">Select an account...</option>
        ${allChallenges.map(c => `
            <option value="${c.uid}|${c.challengeId}">
                ${escapeHTML(c.userName)} — ${escapeHTML(c.planName)} — $${(c.accountSize || 0).toLocaleString()} — MT ${escapeHTML(c.mtLogin)}
            </option>
        `).join("")}
    `;
}


/* =========================================================
   FILE HANDLING
========================================================= */

uploadArea.addEventListener("click", () => fileInput.click());
uploadBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
});

fileInput.addEventListener("change", (e) => {
    if (e.target.files.length) {
        handleFile(e.target.files[0]);
    }
});

uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragover");

    if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileRemove.addEventListener("click", (e) => {
    e.stopPropagation();
    resetFile();
});


function handleFile(file) {
    if (!file.name.match(/\.(html|htm)$/i)) {
        showError("Only HTML files are allowed. Please save your MT5 report as HTML.");
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showError("File is too large (max 5 MB).");
        return;
    }

    currentFile = file;

    fileName.textContent = file.name;
    fileSize.textContent = (file.size / 1024).toFixed(1) + " KB";

    fileInfo.style.display = "flex";
    previewCard.style.display = "none";

    parseFile(file);
}


function resetFile() {
    currentFile = null;
    parsedData = null;

    fileInput.value = "";
    fileInfo.style.display = "none";
    previewCard.style.display = "none";
}


/* =========================================================
   PARSE HTML
========================================================= */

async function parseFile(file) {
    try {
        const text = await file.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");

        /* =========================================
           استخراج Deals (نسخه‌ی اصلاح شده)
        ========================================= */

        const allTables = doc.querySelectorAll("table");

        const deals = [];

        let inDealsSection = false;

        for (const table of allTables) {
            const rows = table.querySelectorAll("tr");

            for (const row of rows) {
                const cells = row.querySelectorAll("td");
                const rowText = row.textContent;

                /* ✅ تشخیص شروع Deals: هدر با Time + Deal + Balance + Profit */
                if (
                    cells.length > 10 &&
                    rowText.includes("Time") &&
                    rowText.includes("Deal") &&
                    rowText.includes("Balance") &&
                    rowText.includes("Profit") &&
                    rowText.includes("Commission")
                ) {
                    inDealsSection = true;
                    continue;
                }

                /* ✅ تشخیص پایان Deals: هدر "Orders" */
                if (
                    inDealsSection &&
                    rowText.includes("Open Time") &&
                    rowText.includes("Order") &&
                    rowText.includes("State")
                ) {
                    inDealsSection = false;
                    continue;
                }

                /* ✅ تشخیص پایان نهایی با "Results" */
                if (
                    inDealsSection &&
                    rowText.includes("Total Net Profit")
                ) {
                    inDealsSection = false;
                    continue;
                }

                if (!inDealsSection) continue;

                /* فقط سطرهایی که دقیقاً حداقل ۱۴ سلول دارن */
                if (cells.length < 14) continue;

                const time = cells[0].textContent.trim();

                /* فقط سطرهایی که با تاریخ معتبر شروع می‌شن */
                if (!time.match(/^\d{4}\.\d{2}\.\d{2}/)) continue;

                const dealId      = cells[1].textContent.trim();
                const symbol      = cells[2].textContent.trim();
                const type        = cells[3].textContent.trim();
                const direction   = cells[4].textContent.trim();
                const volume      = cells[5].textContent.trim();
                const price       = cells[6].textContent.trim();
                const commission  = cells[9].textContent.trim();
                const swap        = cells[11].textContent.trim();
                const profit      = cells[12].textContent.trim();
                const balance     = cells[13].textContent.trim();

                deals.push({
                    time,
                    dealId,
                    symbol,
                    type,
                    direction,
                    volume: Number(volume) || 0,
                    price: Number(price) || 0,
                    commission: Number(commission) || 0,
                    swap: Number(swap) || 0,
                    profit: Number(profit) || 0,
                    balance: Number(balance) || 0
                });
            }
        }

        console.log(`✅ Found ${deals.length} deals`);

        if (!deals.length) {
            showError("No deals found in the file. Make sure you saved the 'Trade History Report' (not Summary) and it contains a 'Deals' section.");
            resetFile();
            return;
        }

        /* =========================================
           استخراج Results
        ========================================= */

        const allText = doc.body.textContent;

        const results = extractResults(allText, deals);

        /* =========================================
           محاسبه‌ی P&L روزانه
        ========================================= */

        const dailyData = calculateDailyData(deals);

        /* =========================================
           نتیجه نهایی
        ========================================= */

        parsedData = {
            deals,
            results,
            dailyData,
            fileName: file.name,
            parsedAt: new Date().toISOString()
        };

        renderPreview(parsedData);

    } catch (err) {
        console.error("Parse error:", err);
        showError("Failed to parse the file: " + err.message);
        resetFile();
    }
}


function extractResults(text, deals) {
    const results = {
        totalNetProfit: 0,
        grossProfit: 0,
        grossLoss: 0,
        profitFactor: 0,
        totalTrades: 0,
        profitTrades: 0,
        lossTrades: 0,
        winRate: 0,
        balanceDrawdownMax: 0,
        balanceDrawdownPct: 0,
        largestProfit: 0,
        largestLoss: 0,
        currentBalance: 0,
        currentEquity: 0
    };

    /* Total Net Profit */
    let m = text.match(/Total Net Profit:\s*([-\d.]+)/);
    if (m) results.totalNetProfit = Number(m[1]);

    /* Gross Profit */
    m = text.match(/Gross Profit:\s*([\d.]+)/);
    if (m) results.grossProfit = Number(m[1]);

    /* Gross Loss */
    m = text.match(/Gross Loss:\s*([-\d.]+)/);
    if (m) results.grossLoss = Number(m[1]);

    /* Profit Factor */
    m = text.match(/Profit Factor:\s*([\d.]+)/);
    if (m) results.profitFactor = Number(m[1]);

    /* Total Trades */
    m = text.match(/Total Trades:\s*(\d+)/);
    if (m) results.totalTrades = Number(m[1]);

    /* Profit Trades */
    m = text.match(/Profit Trades[^:]*:\s*(\d+)/);
    if (m) results.profitTrades = Number(m[1]);

    /* Loss Trades */
    m = text.match(/Loss Trades[^:]*:\s*(\d+)/);
    if (m) results.lossTrades = Number(m[1]);

    /* Drawdown Maximal */
    m = text.match(/Balance Drawdown Maximal:\s*([\d.]+)\s*\(([\d.]+)%\)/);
    if (m) {
        results.balanceDrawdownMax = Number(m[1]);
        results.balanceDrawdownPct = Number(m[2]);
    }

    /* Largest Profit */
    m = text.match(/Largest profit trade:\s*([\d.]+)/);
    if (m) results.largestProfit = Number(m[1]);

    /* Largest Loss */
    m = text.match(/Largest loss trade:\s*([-\d.]+)/);
    if (m) results.largestLoss = Number(m[1]);

    /* Balance */
    m = text.match(/Balance:\s*([\d.]+)/);
    if (m) results.currentBalance = Number(m[1]);

    /* Equity */
    m = text.match(/Equity:\s*([\d.]+)/);
    if (m) results.currentEquity = Number(m[1]);

    /* محاسبه Win Rate */
    if (results.totalTrades > 0) {
        results.winRate = (results.profitTrades / results.totalTrades) * 100;
    }

    /* اگه نبود، از deals محاسبه کن */
    if (!results.totalTrades && deals.length) {
        const closedDeals = deals.filter(d => d.direction === "out");
        results.totalTrades = closedDeals.length;
        results.profitTrades = closedDeals.filter(d => d.profit > 0).length;
        results.lossTrades = closedDeals.filter(d => d.profit < 0).length;
        results.winRate = results.totalTrades > 0
            ? (results.profitTrades / results.totalTrades) * 100
            : 0;
    }

    /* آخرین Balance */
    const balanceDeals = deals.filter(d => d.balance > 0);
    if (balanceDeals.length) {
        results.currentBalance = balanceDeals[balanceDeals.length - 1].balance;
        results.currentEquity = results.currentBalance;
    }

    return results;
}


function calculateDailyData(deals) {
    const dailyMap = {};

    deals.forEach(deal => {
        /* فقط معاملات خروج (بسته شدن پوزیشن) */
        if (deal.direction !== "out") return;

        const date = deal.time.substring(0, 10).replace(/\./g, "-");

        if (!dailyMap[date]) {
            dailyMap[date] = {
                date,
                pnl: 0,
                trades: 0,
                balance: 0,
                equity: 0,
                wins: 0,
                losses: 0
            };
        }

        dailyMap[date].pnl += deal.profit;
        dailyMap[date].trades += 1;

        if (deal.profit > 0) dailyMap[date].wins += 1;
        if (deal.profit < 0) dailyMap[date].losses += 1;

        if (deal.balance > 0) {
            dailyMap[date].balance = deal.balance;
            dailyMap[date].equity = deal.balance;
        }
    });

    const dailyArray = Object.values(dailyMap).sort(
        (a, b) => a.date.localeCompare(b.date)
    );

    return dailyArray;
}


/* =========================================================
   RENDER PREVIEW
========================================================= */

let dailyExpanded = false;

function renderPreview(data) {
    const r = data.results;
    const d = data.dailyData;

    importSummary.innerHTML = `
        <div class="import-stat">
            <span>Current Balance</span>
            <strong>${formatMoneyAbs(r.currentBalance)}</strong>
        </div>

        <div class="import-stat">
            <span>Current Equity</span>
            <strong>${formatMoneyAbs(r.currentEquity)}</strong>
        </div>

        <div class="import-stat ${r.totalNetProfit >= 0 ? "positive" : "negative"}">
            <span>Net P&L</span>
            <strong>${formatMoney(r.totalNetProfit)}</strong>
        </div>

        <div class="import-stat">
            <span>Total Trades</span>
            <strong>${r.totalTrades}</strong>
        </div>

        <div class="import-stat ${r.balanceDrawdownPct > 5 ? "negative" : ""}">
            <span>Max Drawdown</span>
            <strong>${r.balanceDrawdownPct.toFixed(2)}%</strong>
        </div>

        <div class="import-stat">
            <span>Win Rate</span>
            <strong>${r.winRate.toFixed(2)}%</strong>
        </div>
    `;

    renderDailyList(d, false);

    previewCard.style.display = "block";
}


function renderDailyList(dailyData, showAll) {
    const items = showAll ? dailyData : dailyData.slice(-10);

    dailyList.innerHTML = items.map(day => {
        const isPositive = day.pnl >= 0;

        return `
            <div class="import-daily-item">
                <div class="import-daily-date">
                    ${escapeHTML(day.date)}
                </div>

                <div class="import-daily-trades">
                    ${day.trades} trades
                </div>

                <div class="import-daily-pnl ${isPositive ? "positive" : "negative"}">
                    ${formatMoney(day.pnl)}
                </div>

                <div class="import-daily-balance">
                    ${formatMoneyAbs(day.balance)}
                </div>
            </div>
        `;
    }).join("");

    toggleDailyBtn.textContent = showAll ? "Show Less" : `Show All (${dailyData.length})`;
}


toggleDailyBtn.addEventListener("click", () => {
    dailyExpanded = !dailyExpanded;
    renderDailyList(parsedData.dailyData, dailyExpanded);
});


/* =========================================================
   SAVE TO FIRESTORE
========================================================= */

saveImportBtn.addEventListener("click", async () => {
    if (!selectedAccount) {
        showImportStatus("Please select an account first.", true);
        return;
    }

    if (!parsedData) {
        showImportStatus("No parsed data found.", true);
        return;
    }

    const [uid, challengeId] = selectedAccount;

    saveImportBtn.disabled = true;
    saveImportBtn.textContent = "Saving...";

    try {
        const r = parsedData.results;
        const d = parsedData.dailyData;

        const equityHistory = d.map(day => ({
            date: day.date,
            equity: day.equity || day.balance,
            balance: day.balance
        }));

        const dailyPnl = {};
        d.forEach(day => {
            dailyPnl[day.date] = {
                pnl: Number(day.pnl.toFixed(2)),
                trades: day.trades,
                wins: day.wins,
                losses: day.losses
            };
        });

        await updateDoc(
            doc(db, "users", uid, "challenges", challengeId),
            {
                balance: r.currentBalance,
                equity: r.currentEquity,
                profit: r.totalNetProfit,
                profitFactor: r.profitFactor,
                winRate: r.winRate,
                totalTrades: r.totalTrades,
                profitTrades: r.profitTrades,
                lossTrades: r.lossTrades,
                maxDrawdown: r.balanceDrawdownPct,
                maxDrawdownAbs: r.balanceDrawdownMax,
                largestProfit: r.largestProfit,
                largestLoss: r.largestLoss,

                equityHistory,
                dailyPnl,

                lastImportAt: serverTimestamp(),
                lastImportFile: parsedData.fileName,
                lastImportBy: currentUser.uid
            }
        );

        showImportStatus("✅ Data saved successfully!");

        setTimeout(() => {
            resetFile();
            importAccountSelect.value = "";
            selectedAccount = null;
        }, 2500);

    } catch (err) {
        console.error("Save error:", err);
        showImportStatus("Error: " + err.message, true);

    } finally {
        saveImportBtn.disabled = false;
        saveImportBtn.textContent = "✅ Save to Database";
    }
});


cancelImportBtn.addEventListener("click", () => {
    resetFile();
    showImportStatus("Cancelled.");
});


/* =========================================================
   ACCOUNT SELECT
========================================================= */

importAccountSelect.addEventListener("change", (e) => {
    const value = e.target.value;

    if (!value) {
        selectedAccount = null;
        return;
    }

    const [uid, challengeId] = value.split("|");

    selectedAccount = [uid, challengeId];

    const challenge = allChallenges.find(
        c => c.uid === uid && c.challengeId === challengeId
    );

    if (challenge) {
        console.log("Selected account:", challenge);
    }
});


/* =========================================================
   ERROR MODAL
========================================================= */

errorModalClose.addEventListener("click", closeErrorModal);
errorModalOk.addEventListener("click", closeErrorModal);

errorModal.addEventListener("click", (e) => {
    if (e.target === errorModal) closeErrorModal();
});


/* =========================================================
   LOGOUT
========================================================= */

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

    try {
        const adminSnap = await getDoc(doc(db, "admins", user.uid));

        if (!adminSnap.exists()) {
            loading.style.display = "none";
            denied.style.display = "flex";
            return;
        }
    } catch (err) {
        console.error("Admin check error:", err);
        loading.style.display = "none";
        denied.style.display = "flex";
        return;
    }

    adminEmail.textContent = user.email || "admin@rise-funded.com";
    adminName.textContent  = user.displayName || "Admin";
    adminAvatar.textContent = (user.email || "A").charAt(0).toUpperCase();

    await loadAllChallenges();

    loading.style.display = "none";
    adminPanel.style.display = "grid";
});