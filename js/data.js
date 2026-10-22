/* =========================================================
   RISE FUNDED — DATA (ES Module)
========================================================= */

/* ---------- CHALLENGE PLANS ---------- */
export const plans = {
    oneStep: {
        label: "1 STEP EVALUATION",
        shortLabel: "1 STEP",
        description:
            "A streamlined one-step evaluation with a 10% target, 10% overall drawdown and 4% daily drawdown.",
        prices: {
            5000: 34,
            10000: 69,
            25000: 139,
            50000: 269,
            100000: 479
        },
        profitTarget: "10%",
        maxDrawdown: "10%",
        dailyDrawdown: "4%",
        profitSplit: "80%",
        minDays: "3",
        leverage: "1:100"
    },

    standard: {
        label: "2 STEP STANDARD",
        shortLabel: "2 STEP STANDARD",
        description:
            "A balanced two-stage evaluation with 8% and 5% targets and a 12% overall drawdown.",
        prices: {
            5000: 29,
            10000: 59,
            25000: 119,
            50000: 229,
            100000: 419
        },
        profitTarget: "8% + 5%",
        maxDrawdown: "12%",
        dailyDrawdown: "5%",
        profitSplit: "80%",
        minDays: "3 / Phase",
        leverage: "1:100"
    },

    pro: {
        label: "2 STEP PRO",
        shortLabel: "2 STEP PRO",
        description:
            "A professional two-stage model with tighter risk parameters and a clear route toward funded capital.",
        prices: {
            5000: 35,
            10000: 65,
            25000: 129,
            50000: 249,
            100000: 449
        },
        profitTarget: "6% + 6%",
        maxDrawdown: "6%",
        dailyDrawdown: "3%",
        profitSplit: "90%",
        minDays: "2 / Phase",
        leverage: "1:100"
    },

    instant: {
        label: "INSTANT FUNDING",
        shortLabel: "INSTANT",
        description:
            "Skip the evaluation and start directly with an instant funded account model.",
        prices: {
            5000: 79,
            10000: 139,
            25000: 269,
            50000: 449,
            100000: 799
        },
        profitTarget: "None",
        maxDrawdown: "5% Trailing",
        dailyDrawdown: "3%",
        profitSplit: "95%",
        minDays: "—",
        leverage: "1:100"
    }
};


/* ---------- DISCOUNT CODES ---------- */
export const discountCodes = {
    "RISE10": {
        type: "percent",
        value: 10,
        label: "10% discount"
    },
    "RF5": {
        type: "percent",
        value: 5,
        label: "5% discount"
    }
};


/* ---------- PAYOUT OPTIONS ---------- */
export const payoutOptions = {
    weekly: {
        label: "Weekly",
        split: "65%",
        extraFee: false
    },
    biweekly: {
        label: "Bi-Weekly",
        split: "80%",
        extraFee: false
    },
    monthly: {
        label: "Monthly",
        split: "90%",
        extraFee: false
    },
    ondemand: {
        label: "On Demand",
        split: "95%",
        extraFee: true
    }
};


/* ---------- TRADER PAYOUT SHOWCASE ---------- */
export const traderPayouts = [
    {
        initials: "AA",
        name: "Ahmad Amiri",
        country: "🇦🇫 Afghanistan",
        amount: "$2,480",
        account: "$25K ACCOUNT",
        split: "90% SPLIT"
    },
    {
        initials: "MH",
        name: "Muhammad Hamza",
        country: "🇵🇰 Pakistan",
        amount: "$3,175",
        account: "$50K ACCOUNT",
        split: "90% SPLIT"
    },
    {
        initials: "AS",
        name: "Aarav Sharma",
        country: "🇮🇳 India",
        amount: "$1,920",
        account: "$25K ACCOUNT",
        split: "80% SPLIT"
    },
    {
        initials: "AR",
        name: "Amir Rezaei",
        country: "🇮🇷 Iran",
        amount: "$4,260",
        account: "$50K ACCOUNT",
        split: "90% SPLIT"
    },
    {
        initials: "NA",
        name: "Nguyễn Minh Anh",
        country: "🇻🇳 Vietnam",
        amount: "$2,735",
        account: "$25K ACCOUNT",
        split: "90% SPLIT"
    },
    {
        initials: "RH",
        name: "Rahim Hossain",
        country: "🇧🇩 Bangladesh",
        amount: "$1,640",
        account: "$10K ACCOUNT",
        split: "80% SPLIT"
    }
];