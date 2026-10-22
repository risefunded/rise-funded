/* =========================================================
   RISE FUNDED
   Firebase Authentication System
   Login + Register + Forgot Password
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
   Project: RISE FUNDED
========================================================= */

const firebaseConfig = {

    apiKey:
        "AIzaSyC0ecCQOl6gFEdXe34_xNIFdwcKiFziWfE",

    authDomain:
        "rise-funded.firebaseapp.com",

    projectId:
        "rise-funded",

    storageBucket:
        "rise-funded.firebasestorage.app",

    messagingSenderId:
        "409746033804",

    appId:
        "1:409746033804:web:71fa279d7cbd6b5816bfa9"
};


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);


/* =========================================================
   DOM HELPER
========================================================= */

const $ = (id) =>
    document.getElementById(id);


/* =========================================================
   MESSAGE SYSTEM
========================================================= */

function showError(message) {

    const errorBox =
        $("authError");

    const successBox =
        $("authSuccess");

    if (successBox) {

        successBox.classList.remove("show");

        successBox.textContent = "";
    }

    if (!errorBox) return;

    errorBox.textContent =
        message;

    errorBox.classList.add("show");

    errorBox.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


function showSuccess(message) {

    const errorBox =
        $("authError");

    const successBox =
        $("authSuccess");


    if (errorBox) {

        errorBox.classList.remove("show");

        errorBox.textContent = "";
    }


    if (!successBox) return;


    successBox.textContent =
        message;

    successBox.classList.add("show");
}


function clearMessages() {

    const errorBox =
        $("authError");

    const successBox =
        $("authSuccess");


    if (errorBox) {

        errorBox.classList.remove("show");

        errorBox.textContent = "";
    }


    if (successBox) {

        successBox.classList.remove("show");

        successBox.textContent = "";
    }
}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setLoading(button, loading) {

    if (!button) return;


    if (loading) {

        button.disabled = true;

        button.classList.add("loading");

    } else {

        button.disabled = false;

        button.classList.remove("loading");
    }
}


/* =========================================================
   FIREBASE ERROR TRANSLATION
========================================================= */

function firebaseErrorMessage(error) {

    const code =
        error?.code || "";


    const messages = {

        "auth/invalid-email":
            "Please enter a valid email address.",

        "auth/user-not-found":
            "No account was found with this email address.",

        "auth/wrong-password":
            "The email or password is incorrect.",

        "auth/invalid-credential":
            "The email or password is incorrect.",

        "auth/email-already-in-use":
            "An account with this email already exists.",

        "auth/weak-password":
            "Password is too weak. Please use at least 8 characters.",

        "auth/network-request-failed":
            "Network error. Please check your internet connection.",

        "auth/too-many-requests":
            "Too many attempts. Please wait and try again.",

        "auth/user-disabled":
            "This account has been disabled.",

        "auth/operation-not-allowed":
            "Email/password authentication is not enabled in Firebase.",

        "auth/requires-recent-login":
            "Please log in again and retry this action.",

        "auth/internal-error":
            "An internal Firebase error occurred. Please try again."
    };


    return (
        messages[code] ||
        "Something went wrong. Please try again."
    );
}


/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

document
    .querySelectorAll(".password-toggle")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const targetId =
                    button.dataset.target;

                const input =
                    document.getElementById(
                        targetId
                    );


                if (!input) return;


                if (
                    input.type ===
                    "password"
                ) {

                    input.type =
                        "text";

                } else {

                    input.type =
                        "password";
                }
            }
        );
    });


/* =========================================================
   PASSWORD STRENGTH
========================================================= */

const registerPassword =
    $("registerPassword");


if (registerPassword) {

    registerPassword.addEventListener(
        "input",
        () => {

            updatePasswordStrength(
                registerPassword.value
            );
        }
    );
}


function updatePasswordStrength(password) {

    const bars =
        document.querySelectorAll(
            ".strength-bars span"
        );

    const text =
        $("passwordStrengthText");


    if (
        !bars.length ||
        !text
    ) return;


    let score = 0;


    if (password.length >= 8)
        score++;


    if (password.length >= 12)
        score++;


    if (/[A-Z]/.test(password))
        score++;


    if (/[0-9]/.test(password))
        score++;


    if (/[^A-Za-z0-9]/.test(password))
        score++;


    const level =
        Math.min(
            4,
            Math.ceil(
                score * 4 / 5
            )
        );


    bars.forEach(
        (bar, index) => {

            bar.style.background =
                index < level
                    ? "var(--purple)"
                    : "rgba(255,255,255,0.08)";
        }
    );


    if (!password) {

        text.textContent =
            "Password strength";

    } else if (score <= 1) {

        text.textContent =
            "Very weak";

    } else if (score === 2) {

        text.textContent =
            "Weak";

    } else if (score === 3) {

        text.textContent =
            "Good";

    } else {

        text.textContent =
            "Strong";
    }
}


/* =========================================================
   USERNAME VALIDATION
========================================================= */

function isValidUsername(username) {

    return /^[a-zA-Z0-9_]{3,30}$/
        .test(username);
}


/* =========================================================
   REGISTER
========================================================= */

const registerForm =
    $("registerForm");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            clearMessages();


            const button =
                $("registerButton");


            /* ---------------------------------------------
               GET FORM VALUES
            --------------------------------------------- */

            const firstName =
                $("firstName")
                    .value
                    .trim();


            const lastName =
                $("lastName")
                    .value
                    .trim();


            const username =
                $("username")
                    .value
                    .trim()
                    .toLowerCase();


            const email =
                $("registerEmail")
                    .value
                    .trim()
                    .toLowerCase();


            const country =
                $("country")
                    .value
                    .trim();


            const phone =
                $("phone")
                    .value
                    .trim();


            const password =
                $("registerPassword")
                    .value;


            const confirmPassword =
                $("confirmPassword")
                    .value;


            const agreeTerms =
                $("agreeTerms")
                    .checked;


            const agreePrivacy =
                $("agreePrivacy")
                    .checked;


            /* ---------------------------------------------
               VALIDATION
            --------------------------------------------- */

            if (
                !firstName ||
                !lastName
            ) {

                showError(
                    "Please enter your first and last name."
                );

                return;
            }


            if (
                !isValidUsername(
                    username
                )
            ) {

                showError(
                    "Username must be 3–30 characters and may contain only letters, numbers and underscores."
                );

                return;
            }


            if (!email) {

                showError(
                    "Please enter your email address."
                );

                return;
            }


            if (!country) {

                showError(
                    "Please select your country."
                );

                return;
            }


            if (!phone) {

                showError(
                    "Please enter your phone number."
                );

                return;
            }


            if (
                password.length < 8
            ) {

                showError(
                    "Password must contain at least 8 characters."
                );

                return;
            }


            if (
                password !==
                confirmPassword
            ) {

                showError(
                    "Passwords do not match."
                );

                return;
            }


            if (!agreeTerms) {

                showError(
                    "You must agree to the Terms & Conditions."
                );

                return;
            }


            if (!agreePrivacy) {

                showError(
                    "You must agree to the Privacy Policy."
                );

                return;
            }


            /* ---------------------------------------------
               START LOADING
            --------------------------------------------- */

            setLoading(
                button,
                true
            );


            try {

                /* -----------------------------------------
                   CREATE FIREBASE AUTH ACCOUNT
                ----------------------------------------- */

                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                /* -----------------------------------------
                   SET DISPLAY NAME
                ----------------------------------------- */

                await updateProfile(
                    user,
                    {

                        displayName:
                            `${firstName} ${lastName}`
                    }
                );


                /* -----------------------------------------
                   SAVE USER PROFILE
                   Firestore → users → UID
                ----------------------------------------- */

                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {

                        uid:
                            user.uid,

                        firstName:
                            firstName,

                        lastName:
                            lastName,

                        username:
                            username,

                        email:
                            email,

                        country:
                            country,

                        phone:
                            phone,

                        role:
                            "trader",

                        status:
                            "active",

                        termsAccepted:
                            true,

                        privacyAccepted:
                            true,

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()
                    }
                );


                /* -----------------------------------------
                   SUCCESS
                ----------------------------------------- */

                showSuccess(
                    "Account created successfully. Redirecting to your dashboard..."
                );


                registerForm.reset();


                updatePasswordStrength("");


                /* -----------------------------------------
                   REDIRECT
                ----------------------------------------- */

                setTimeout(
                    () => {

                        window.location.href =
                            "../dashboard/dashboard.html";

                    },
                    1200
                );


            } catch (error) {

                console.error(
                    "RISE FUNDED registration error:",
                    error
                );


                showError(
                    firebaseErrorMessage(
                        error
                    )
                );


            } finally {

                setLoading(
                    button,
                    false
                );
            }

        }
    );
}


/* =========================================================
   LOGIN
========================================================= */

const loginForm =
    $("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            clearMessages();


            const button =
                $("loginButton");


            const email =
                $("loginEmail")
                    .value
                    .trim()
                    .toLowerCase();


            const password =
                $("loginPassword")
                    .value;


            const remember =
                $("rememberMe")
                    ? $("rememberMe").checked
                    : true;


            /* ---------------------------------------------
               VALIDATION
            --------------------------------------------- */

            if (!email) {

                showError(
                    "Please enter your email address."
                );

                return;
            }


            if (!password) {

                showError(
                    "Please enter your password."
                );

                return;
            }


            setLoading(
                button,
                true
            );


            try {

                /* -----------------------------------------
                   REMEMBER ME
                ----------------------------------------- */

                await setPersistence(
                    auth,
                    remember
                        ? browserLocalPersistence
                        : browserSessionPersistence
                );


                /* -----------------------------------------
                   SIGN IN
                ----------------------------------------- */

                const userCredential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                console.log(
                    "RISE FUNDED user logged in:",
                    user.uid
                );


                /* -----------------------------------------
                   SUCCESS
                ----------------------------------------- */

                showSuccess(
                    "Login successful. Redirecting..."
                );


                /* -----------------------------------------
                   DASHBOARD REDIRECT
                ----------------------------------------- */

                setTimeout(
                    () => {

                        window.location.href =
                            "../dashboard/dashboard.html";

                    },
                    700
                );


            } catch (error) {

                console.error(
                    "RISE FUNDED login error:",
                    error
                );


                showError(
                    firebaseErrorMessage(
                        error
                    )
                );


            } finally {

                setLoading(
                    button,
                    false
                );
            }

        }
    );
}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

const forgotPassword =
    $("forgotPassword");


if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();

            clearMessages();


            const emailInput =
                $("loginEmail");


            if (!emailInput)
                return;


            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();


            if (!email) {

                showError(
                    "Enter your email address first, then click Forgot password."
                );

                emailInput.focus();

                return;
            }


            try {

                await sendPasswordResetEmail(
                    auth,
                    email
                );


                showSuccess(
                    "Password reset email sent. Please check your inbox."
                );


            } catch (error) {

                console.error(
                    "RISE FUNDED password reset error:",
                    error
                );


                showError(
                    firebaseErrorMessage(
                        error
                    )
                );
            }

        }
    );
}


/* =========================================================
   PAGE SHOW RESET
========================================================= */

window.addEventListener(
    "pageshow",
    () => {

        document
            .querySelectorAll(
                ".primary-button"
            )
            .forEach(
                button => {

                    button.disabled =
                        false;

                    button.classList.remove(
                        "loading"
                    );
                }
            );
    }
);


/* =========================================================
   INITIALIZATION LOG
========================================================= */

console.log(
    "RISE FUNDED Authentication initialized successfully."
);

console.log(
    "Firebase Project:",
    firebaseConfig.projectId
);