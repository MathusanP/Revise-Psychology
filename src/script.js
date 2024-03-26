var emailValidation = "fail";
var nickValidation = "fail";
var passwordValidation = "fail";
var isConfirmed = false;

function setFormMessage(formElement, type, message) {
    const messageElement = formElement.querySelector(".form__message");

    messageElement.textContent = message;
    messageElement.classList.remove("form__message--success", "form__message--error");
    messageElement.classList.add(`form__message--${type}`)
}

function setInputError(inputElement, message) {
    inputElement.classList.add("form__input--error");
    inputElement.parentElement.querySelector(".form__input-error-message").textContent = message;
}

// Runs when the document has been loaded.
function clearInputError(inputElement) {
    inputElement.classList.remove("form__input--error");
    inputElement.parentElement.querySelector(".form__input-error-message").textContent = "";
}

const isValidEmail = email => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(String(email).toLowerCase());
}

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.querySelector("#login");
    const createAccountForm = document.querySelector("#createAccount");

    document.querySelector("#linkCreateAccount").addEventListener("click", e => {
        e.preventDefault();
        loginForm.classList.add("form--hidden");
        createAccountForm.classList.remove("form--hidden");
    });

    document.querySelector("#linkLogin").addEventListener("click", e => {
        e.preventDefault();
        loginForm.classList.remove("form--hidden");
        createAccountForm.classList.add("form--hidden");
    });

    loginForm.addEventListener("submit", e => {
        e.preventDefault();
        // Example placeholder for specific logic
        setFormMessage(loginForm, "error", "Invalid credentials.");
    });

    document.querySelectorAll(".form__input").forEach(inputElement => {
        inputElement.addEventListener("blur", e => {
            if (e.target.id === "signupEmail" && e.target.value.length > 0 && e.target.value.length < 10 || e.target.value == "") {
                setInputError(inputElement, "Email must be at least 10 characters in length");
                emailValidation = "fail";
            } else {
                emailValidation = "pass";
            }
        });

        inputElement.addEventListener("input", e => {
            clearInputError(inputElement);
        });
    });

    const continueButton = document.querySelector("#continueButton");
    continueButton.addEventListener("click", e => {
        e.preventDefault();
        console.log(emailValidation); // Log the value of emailValidation when the continue button is clicked
    });
});
