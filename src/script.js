// Defining Validation Conditions
var emailValidation = "fail";
var nickValidation = "fail";
var passwordValidation = "fail";
var isConfirmed = false;

var loginEmailValidation = "fail";
var loginPasswordValidation = "fail";

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
    // Defining the email sequence
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Returns true if input matches regex pattern.
    return regex.test(String(email).toLowerCase());
}

const isValidPassword = password => {
    // Defining password sequence
    const regex = /^(?=.*[A-Z])(?=.*\d)(?!.*\s).{8,}$/;
    return regex.test(String(password));
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
    nickname.addEventListener("input", e => {
        // Clears the input when the user triggers this event. 
        clearInputError(nickname);
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


    // Event listener for when an input field is altered.
    signupEmail.addEventListener("input", e => {
        // Clears the input when the user triggers this event. 
        clearInputError(signupEmail);
    });

    const signupPassword = document.querySelector("#signupPassword");

    signupPassword.addEventListener("blur", e => {
        // Get the value of the password input field
        const passwordValue = signupPassword.value.trim();

        // Validation condition
        if (passwordValue === '' || !isValidPassword(passwordValue)) {
            setInputError(signupPassword, "Please ensure your password has 1 capital letter, no spaces, 1 number and at least 8 characters long.");
            passwordValidation = "fail";
        } else {
            // If validation conditions are correct, this condition is considered a pass.
            passwordValidation = "pass";
        }
    });


    // Event listener for when an input field is altered.
    signupPassword.addEventListener("input", e => {
        // Clears the input when the user triggers this event. 
        clearInputError(signupPassword);
    });

    const confirmPassword = document.querySelector("#confirmPassword");

    confirmPassword.addEventListener("blur", e => {
        // Get the value of the password input field
        const confirmation = confirmPassword.value.trim();
        const passwordValue = signupPassword.value.trim();

        // Validation condition
        if (confirmation !== passwordValue) { // Compare with passwordValue
            setInputError(confirmPassword, "Passwords don't match.");
            isConfirmed = false;
        } else {
            // If validation conditions are correct, this condition is considered a pass.
            isConfirmed = true;
        }
    });

    // Event listener for when an input field is altered.
    confirmPassword.addEventListener("input", e => {
        // Clears the input when the user triggers this event. 
        clearInputError(confirmPassword);
    });

    // Login email validation:
    const loginEmail = document.querySelector("#loginEmail")
    loginEmail.addEventListener("blur", e => {
        // Get the value of the email input
        const loginEmailValue = loginEmail.value.trim(); // Trim whitespace from the input value

        // Validation condition
        if (loginEmailValue === '' || !isValidEmail(loginEmailValue)) {
            setInputError(loginEmail, "Please enter a valid email address.");
            loginEmailValidation = "fail";
        } else {
            // If validation conditions are correct, this condition is considered a pass.
            loginEmailValidation = "pass";
        }
    });

    loginEmail.addEventListener("input", e => {
        clearInputError(loginEmail);
    });

    // Login password validation:
    const loginPassword = document.querySelector("#loginPassword");
    loginPassword.addEventListener("blur", e => {
        // Trimming white spaces from the password DOM element:
        const loginPasswordValue = loginPassword.value.trim();

        // Validaiton condition:
        if (loginPasswordValue === '' || !isValidPassword(loginPasswordValue)) {
            setInputError(loginPassword, "Please ensure your password has 1 capital letter, no spaces, 1 number and at least 8 characters long.")
        } else {
            loginPasswordValidation = "pass";
        }
    });

    loginPassword.addEventListener("input", e => {
        clearInputError(loginPassword);
    });

    // When user presses on the login's continue button
    const loginSubmit = document.querySelector("#loginSubmit");
    loginSubmit.addEventListener("click", e => {
        e.preventDefault();
        // If user has passed validation:
        if (loginEmailValidation === "pass" && loginPasswordValidation === "pass") {
            console.log('User has passed validation');

            const loginPasswordValue = loginPassword.value.trim();

            // Wrapping everything as an object to send to server
            const toSend = {
                loginEmail: loginEmail.value,
                loginPassword: loginPasswordValue // Remove .value here, as loginPasswordValue is already a value
            };

           
        fetch('http://localhost:3000/loginData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(toSend)
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Network response was not ok');
        })
        .then(data => {
            // If server returns a success signal:
            if (data.message === "Login successful") {
                // Store email and nickname locally
                localStorage.setItem('email', data.email);
                localStorage.setItem('nickname', data.nickname);

                // Sending referral signal.
                window.location.href = 'main.html';
            }
        })
        .catch(error => {
            console.error(error);
        });
    }
});




    const continueButton = document.querySelector("#continueButton");
    continueButton.addEventListener("click", e => {
        e.preventDefault();
        // If all fields are valid...
        if (emailValidation === "pass" && nickValidation === "pass" && passwordValidation === "pass" && isConfirmed === true) {
            console.log('The user has passed validation.');
            const passwordValue = signupPassword.value.trim();

            // Object containing user data.
            const toSend = {
                nickname: nickname.value,
                signupEmail: signupEmail.value,
                passwordValue: passwordValue
            };

            // Sending to server
            fetch('http://localhost:3000/userData', {
                method: 'POST',
                headers: {
                    // Specifying what sort of data is being sent
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(toSend)
            })
                .then(response => {
                    // If HTTP response code is in between 200 - 299...
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error('Network response was not ok');

                })
                .then(data => {
                    alert(data.message);
                })
                .catch(error => {
                    console.error(error)
                });
            
        } else {
            // Fail condition
            alert('Please ensure all fields are correct before submitting.')
        }


    });

})