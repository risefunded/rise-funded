/* =========================================================
   RISE FUNDED — FIREBASE CONFIG (مشترک)
   این فایل رو همه‌ی صفحات import می‌کنن
========================================================= */

export const firebaseConfig = {
    apiKey: "AIzaSyC0ecCQOl6gFEdXe34_xNIFdwcKiFziWfE",
    authDomain: "rise-funded.firebaseapp.com",
    projectId: "rise-funded",
    storageBucket: "rise-funded.firebasestorage.app",
    messagingSenderId: "409746033804",
    appId: "1:409746033804:web:71fa279d7cbd6b5816bfa9"
};

// آدرس ولت‌های کریپتو (برای پرداخت)
export const wallets = {
    USDT_TRC20: {
        network: "TRC20",
        networkName: "Tron (TRC20)",
        coin: "USDT",
        address: "TJqcyAogcBzHQKc21DQmnjZZKCAZZpT6gG",
        explorer: "https://tronscan.org/#/transaction/",
        minConfirm: 1,
        color: "#e60000" // قرمز ترون
    },
    USDT_BEP20: {
        network: "BEP20",
        networkName: "BNB Smart Chain (BEP20)",
        coin: "USDT",
        address: "0x58F5a42557f8e86Ca44a2A9A7411Da0CD8AF70c4",
        explorer: "https://bscscan.com/tx/",
        minConfirm: 5,
        color: "#f0b90b" // طلایی BSC
    },
    USDT_ERC20: {
        network: "ERC20",
        networkName: "Ethereum (ERC20)",
        coin: "USDT",
        address: "0x58F5a42557f8e86Ca44a2A9A7411Da0CD8AF70c4",
        explorer: "https://etherscan.io/tx/",
        minConfirm: 12,
        color: "#627eea" // آبی اتریوم
    }
};