async function login(event) {
    event.preventDefault();

    const email = document.getElementById('Email').value;
    const password = document.getElementById('Password').value;

    const response = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    if (response.ok) {
        alert(result.message);
        window.location.href = '/home'; // Redirect to home page or dashboard after successful login
    } else {
        alert(result.message);
    }
}

const loginButton = document.getElementById('loginButton').addEventListener('click', login);