// Runs when the document has been loaded.
document.addEventListener("DOMContentLoaded", ()=> {
    //Selects loginForm element from the html file and searches for login id.
    const loginForm = document.querySelector("#login"); 
    // Searches for createAccount ID from the html file.
    const createAccountForm = document.querySelector("#createAccount");

    //Attaches and eventlistener to the ID "linkCreateAccount"
    document.querySelector("#linkCreateAccount").addEventListener("click", e => {
        //Preventing Default action
        e.preventDefault();
        //Assignging form--hidden to the login page.
        loginForm.classList.add("form--hidden");
        // Removing form--hidden from the createAccount page.
        createAccountForm.classList.remove("form--hidden");
    });

    document.querySelector("#linkLogin").addEventListener("click", e => {
        //Preventing Default action.
        e.preventDefault();
        //Removing form--hidden from the login page.
        loginForm.classList.remove("form--hidden");
        //Assigning form--hidden to the createAccount page.
        createAccountForm.classList.add("form--hidden");
    });
});
