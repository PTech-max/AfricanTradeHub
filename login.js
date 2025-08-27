async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMessage = document.getElementById("error-message");

  // Clear previous error
  errorMessage.textContent = "";

  if (!email || !password) {
    errorMessage.textContent = "Please enter both email and password.";
    return;
  }

  const loginData = { email, password };

  const baseUrl = "http://localhost:8080/loginUser";

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        errorMessage.textContent = "Invalid email or password.";
      } else {
        errorMessage.textContent = "Login failed. Please try again.";
      }
      return;
    }

    const result = await response.json();

    if (result && result.success) {
      errorMessage.textContent = "";
      alert("Login successful! Redirecting to dashboard...");
      localStorage.setItem("userEmail", email);
      localStorage.setItem("authToken", "dummy-token"); // Replace with real token if available
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1500);
    } else {
      errorMessage.textContent = "Login failed! Please check your credentials.";
    }
  } catch (error) {
    console.error("Error occurred during login:", error);
    errorMessage.textContent = "Server is unreachable. Please check your connection.";
  }
}
