document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/loginUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          email: username,
          password: password
        })
      });

      if (!response.ok) {
        alert("Login request failed.");
        return;
      }

      const success = await response.json();

      if (success === true) {
        alert("Login successful!");

        // Since your backend returns only true/false, just set a dummy token
        localStorage.setItem('authToken', 'loggedIn');

        window.location.href = "dashboard.html";
      } else {
        alert("Invalid username or password.");
      }

    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred. Please try again later.");
    }
  });
});
