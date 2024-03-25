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
    const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
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

    // Loop through each input element and attach event listener
    loginForm.querySelectorAll(".form__input").forEach(inputElement => {
        inputElement.addEventListener("input", e => {
            e.preventDefault();
            if (inputElement.type === "email") {
                // Clear error if email is now valid or the field is empty (to allow starting over)
                if (isValidEmail(inputElement.value) || inputElement.value === "") {
                    clearInputError(inputElement);
                } else {
                    setInputError(inputElement, "Please enter a valid email address.");
                }
            } else {
                // For non-email inputs, just clear the error
                clearInputError(inputElement);
            }
        });
    });
});
