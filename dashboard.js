// dashboard.js

const API_BASE_URL = "http://localhost:8084";

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');

  if (!token) {
    // Redirect to login if no token
    window.location.href = "/login.html";
    return;
  }

  loadDashboard(token);
  setupLogout();
});

async function loadDashboard(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/userInfo`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const data = await response.json();

    // Populate business info card dynamically
    const businessInfoSection = document.querySelector('.business-info');
    businessInfoSection.innerHTML = `
      <h2>Your Business Info</h2>
      <p>Business Name: <strong>${data.businessName || 'N/A'}</strong></p>
      <p>Type: <strong>${data.type || 'N/A'}</strong></p>
      <p>Registered: <strong>${data.registered ? 'Yes' : 'No'}</strong></p>
    `;

  } catch (error) {
    console.error('Error loading dashboard:', error);
    alert('Session expired or error fetching data. Please login again.');
    logout();
  }
}

function setupLogout() {
  // Target logout link by text content (since no ID in your HTML)
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    if (link.textContent.trim().toLowerCase() === 'logout') {
      link.addEventListener('click', e => {
        e.preventDefault();
        logout();
      });
    }
  });
}

function logout() {
  localStorage.removeItem('authToken');
  window.location.href = '/login.html';
}
