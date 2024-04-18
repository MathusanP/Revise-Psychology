// Declaring global variables
let answered = false;
let toSend;
let topicID;

// Function to fetch questions:
function fetchQuestion(toSend) {
    // Promise for data retrieval from server:
    return new Promise((resolve, reject) => {
        // Fetching question contents
        fetch('http://localhost:3000/sessionData', {
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
            console.log(data);
            // Saving question data to local storage
            localStorage.setItem('questionData', JSON.stringify(data));
            window.location.href = "revise.html"; // Redirect to revise.html
            // Resolve the Promise when data is successfully set
            resolve(); 
        })
        .catch(error => {
            console.error('There has been an error:', error);
            // Reject the Promise if there's an error
            reject(error); 
        });
    });
}

    

document.addEventListener('DOMContentLoaded', function () {
    // Selecting all the buttons:
    const buttons = document.querySelectorAll('.btn');

    // Looping through all the buttons to see if they were clicked or not:
    buttons.forEach(button => {
        // If a button has been clicked:
        button.addEventListener('click', function (event) {
            // Log the clicked button
            console.log(`User has clicked ${event.target.id}`)

            const topic = event.target.id

            // Wrapping everything into an object:

            var toSend = {
                topic: topic
            }
            // Using a POST request to send the variable to the user.
            fetchQuestion(toSend)
        })
    })

    // Looping through all the buttons for the click state:
    const optionButtons = document.querySelectorAll('.option')
    const explanationDiv = document.getElementById('explanation')

    optionButtons.forEach(button => {
        button.addEventListener('click', function (event) {
            
            //Looping through all the buttons and fetching their css styles
            optionButtons.forEach(b => b.style.backgroundColour = "");

            // Fetching explanation box (currently hidden):
            document.getElementById('explanation').style.display = 'none';

            // Get the selected option
            const selectedOption = event.target.textContent.trim();
            console.log('Selected option:', selectedOption);

            const questionData = JSON.parse(localStorage.getItem('questionData'));
            // Send the selected option to the server
            fetch('http://localhost:3000/submitAnswer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    selectedOption,
                    questionId: questionData.question_id
                })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    // Response from the server:
                    if (data.isCorrect) {
                        answered = true;
                        event.target.style.backgroundColor = 'green';
                        // If the question is wrong:
                    } else {
                        answered = true;
                        event.target.style.backgroundColor = 'red';
                        document.getElementById(data.correctAnswer).style.backgroundColor = 'green';

                        const explanationDiv = document.getElementById('explanation')

                        explanationDiv.textContent = `${data.reason}`
                        explanationDiv.style.display = 'block';
                    }
                })
                .catch(error => {
                    console.error('Fetch error:', error);
                });
        });
    });

    // Get the "Mark" button
    const nextbtn = document.getElementById('next-btn');

    // Inside the 'nextbtn' event listener
    nextbtn.addEventListener('click', function() {
        // Check if any option is selected
        if (!answered) {
            alert('Please select an option before marking.');
            return;
        } else {
            if (localStorage.getItem('questionData') !== null) {
                if (!toSend) {
                    toSend = {};
                }
                toSend.topic = JSON.parse(localStorage.getItem('questionData')).topic;
                console.log(toSend)
                localStorage.removeItem('questionData');
                fetchQuestion(toSend)
                .then(() => {
                    optionButtons.forEach(b => {
                        b.disabled = false;
                        b.style.backgroundColor = "#e0e0e0"
                    });
                    explanationDiv.style.display = 'none'
                })
                .catch(error => {
                    console.error('Error fetching question:', error);
                });
            } else {
                console.error('Could not find requested item in local storage')
            }
        }
    });
})