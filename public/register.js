async function Register(event) {
    event.preventDefault();

    const username = document.getElementById('Username').value;
    const password = document.getElementById('Password').value;
    const email = document.getElementById('Email').value;
    const profilePicture = document.getElementById('ProfilePicture').files[0];

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    formData.append('email', email);
    formData.append('profilePicture', profilePicture);

    const response = await fetch('/register', {
        method: 'POST',
        body: formData
    });

    const result = await response.json();
    alert(result.message);
}
const registerButton = document.getElementById('registerButton').addEventListener('click', Register);