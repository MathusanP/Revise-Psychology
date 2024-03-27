// Defining Validation Conditions
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
    // Selecting nickname.
    const nickname = document.querySelector("#nickname");

    // Attaching an event listener for when the user is not present to the input field. 
    nickname.addEventListener("blur", e => {
        // Validation condition
        if (e.target.value.length > 10 || (e.target.id === "nickname" && e.target.value === "")) {
            setInputError(nickname, "Nickname must be below 10 characters in length");
            nickValidation = "fail";
        } else {
            // If validation conditions are correct, this condition is considered a pass.
            nickValidation = "pass";
        }
    });

    // Event listener for when an input field is altered.
    inputElement.addEventListener("input", e => {
        // Clears the input when the user triggers this event. 
        clearInputError(inputElement);
    });

    const signupEmail = document.querySelector("#signupEmail");

    signupEmail.addEventListener("blur", e => {
        // Get the value of the email input
        const emailValue = signupEmail.value.trim(); // Trim whitespace from the input value

        // Validation condition
        if (emailValue === '' || !isValidEmail(emailValue)) {
            setInputError(signupEmail, "Please enter a valid email address.");
            emailValidation = "fail";
        } else {
            // If validation conditions are correct, this condition is considered a pass.
            emailValidation = "pass";
        }
    });


    const continueButton = document.querySelector("#continueButton");
    continueButton.addEventListener("click", e => {
        e.preventDefault();
        console.log(emailValidation); // Log the value of emailValidation when the continue button is clicked
    });
});
