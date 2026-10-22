/* =========================================================
   RISE FUNDED — MAIN ENTRY
========================================================= */

import { initCheckout } from "./checkout.js";
import { initUI } from "./ui.js";
import { initPromotions } from "./promotions.js";

document.addEventListener("DOMContentLoaded", () => {
    initCheckout();
    initUI();
    initPromotions();
});