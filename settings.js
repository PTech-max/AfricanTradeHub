document.addEventListener("DOMContentLoaded", () => {
  // Sections
  const settingsSection = document.getElementById("settingsSection");
  const profileSection = document.getElementById("profileInfo");
  const uploadDocumentsSection = document.getElementById("uploadDocumentsSection");
  const viewDocumentsSection = document.getElementById("viewDocumentsSection");
  const paymentMethodsSection = document.getElementById("paymentMethodsSection");

  // Sidebar Buttons
  const settingsBtn = document.getElementById("settingsBtn");
  const profileBtn = document.getElementById("myProfileBtn");
  const uploadDocsBtn = document.getElementById("uploadDocsBtn");
  const viewDocsBtn = document.getElementById("viewDocsBtn");
  const paymentMethodBtn = document.getElementById("paymentMethodBtn");
  const marketplaceBtn = document.getElementById("marketplaceBtn");

  // Notification Elements
  const notificationsBtn = document.getElementById("notificationsBtn");
  const notificationBadge = document.getElementById("notificationBadge");
  const mainNotification = document.getElementById("mainNotification");

  // Messages & Forms
  const changePasswordForm = document.getElementById("changePasswordForm");
  const passwordChangeMessage = document.getElementById("passwordChangeMessage");
  const deleteAccountBtn = document.getElementById("deleteAccountBtn");
  const deleteAccountMessage = document.getElementById("deleteAccountMessage");

  // Get user email from localStorage
  const userEmail = localStorage.getItem("userEmail");

  // Helper: Hide all main content sections
  function hideAllSections() {
    [settingsSection, profileSection, uploadDocumentsSection, viewDocumentsSection, paymentMethodsSection].forEach(
      (section) => {
        if (section) section.style.display = "none";
      }
    );
    // Also hide notification message when switching sections
    hideNotification();
  }

  // Helper: Show only one section
  function showSection(section) {
    hideAllSections();
    if (section) section.style.display = "block";
  }

  // Notification helpers
  function showNotification(message) {
    if (!mainNotification) return;
    mainNotification.textContent = message;
    mainNotification.style.display = "block";
    notificationsBtn.setAttribute("aria-expanded", "true");
    notificationBadge.style.display = "none"; // Clear badge when viewed
  }

  function hideNotification() {
    if (!mainNotification) return;
    mainNotification.style.display = "none";
    notificationsBtn.setAttribute("aria-expanded", "false");
  }

  // Example: Fetch notifications and update badge (simulate here)
  function fetchNotifications() {
    // Simulated notification fetch
    // Replace with actual fetch calls in production
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate unread notifications count & message
        resolve({
          unreadCount: 3,
          message: "You have 3 new notifications!",
        });
      }, 500);
    });
  }

  // Update notification badge UI
  async function updateNotificationBadge() {
    try {
      const data = await fetchNotifications();
      if (data.unreadCount && data.unreadCount > 0) {
        notificationBadge.style.display = "inline-block";
        notificationBadge.textContent = data.unreadCount;
      } else {
        notificationBadge.style.display = "none";
      }
      // Store latest notification message to show on click
      notificationsBtn.dataset.notificationMessage = data.message || "";
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      notificationBadge.style.display = "none";
    }
  }

  // Sidebar navigation event listeners
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      showSection(settingsSection);
    });
  }

  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      showSection(profileSection);
    });
  }

  if (uploadDocsBtn) {
    uploadDocsBtn.addEventListener("click", () => {
      showSection(uploadDocumentsSection);
    });
  }

  if (viewDocsBtn) {
    viewDocsBtn.addEventListener("click", () => {
      showSection(viewDocumentsSection);
    });
  }

  if (paymentMethodBtn) {
    paymentMethodBtn.addEventListener("click", () => {
      showSection(paymentMethodsSection);
    });
  }

  if (marketplaceBtn) {
    marketplaceBtn.addEventListener("click", () => {
      hideAllSections();
      // Add marketplace logic here if needed
    });
  }

  // Notifications button click toggle notification message display
  if (notificationsBtn) {
    notificationsBtn.addEventListener("click", () => {
      if (mainNotification.style.display === "block") {
        hideNotification();
      } else {
        const message = notificationsBtn.dataset.notificationMessage || "No new notifications.";
        showNotification(message);
      }
      // When notifications show, hide other sections
      if (mainNotification.style.display === "block") {
        hideAllSections();
      }
    });
  }

  // -------- Password Change Logic --------
  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      passwordChangeMessage.textContent = "";
      passwordChangeMessage.style.color = "";

      const currentPassword = document.getElementById("currentPassword").value.trim();
      const newPassword = document.getElementById("newPassword").value.trim();
      const confirmNewPassword = document.getElementById("confirmNewPassword").value.trim();

      if (!currentPassword || !newPassword || !confirmNewPassword) {
        passwordChangeMessage.textContent = "Please fill in all fields.";
        passwordChangeMessage.style.color = "red";
        return;
      }

      if (newPassword !== confirmNewPassword) {
        passwordChangeMessage.textContent = "New passwords do not match.";
        passwordChangeMessage.style.color = "red";
        return;
      }

      // Disable form inputs while processing
      Array.from(changePasswordForm.elements).forEach((el) => (el.disabled = true));
      passwordChangeMessage.textContent = "Updating password...";
      passwordChangeMessage.style.color = "black";

      try {
        const res = await fetch("http://localhost:8080/api/user/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail, currentPassword, newPassword }),
        });

        const data = await res.json();

        if (res.ok) {
          passwordChangeMessage.textContent = "Password updated successfully.";
          passwordChangeMessage.style.color = "green";
          changePasswordForm.reset();
        } else {
          passwordChangeMessage.textContent = data.message || "Password update failed.";
          passwordChangeMessage.style.color = "red";
        }
      } catch (err) {
        console.error(err);
        passwordChangeMessage.textContent = "An error occurred while updating password.";
        passwordChangeMessage.style.color = "red";
      } finally {
        Array.from(changePasswordForm.elements).forEach((el) => (el.disabled = false));
      }
    });
  }

  // -------- Account Deletion Logic --------
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", async () => {
      const confirmDelete = confirm("Are you sure you want to delete your account? This action is irreversible.");
      if (!confirmDelete) return;

      deleteAccountMessage.textContent = "Deleting account...";
      deleteAccountMessage.style.color = "black";
      deleteAccountBtn.disabled = true;

      try {
        const res = await fetch("http://localhost:8080/api/user/delete-account", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail }),
        });

        const data = await res.json();

        if (res.ok) {
          deleteAccountMessage.textContent = "Account deleted successfully. Redirecting...";
          deleteAccountMessage.style.color = "green";
          setTimeout(() => {
            localStorage.clear();
            window.location.href = "index.html";
          }, 2000);
        } else {
          deleteAccountMessage.textContent = data.message || "Failed to delete account.";
          deleteAccountMessage.style.color = "red";
          deleteAccountBtn.disabled = false;
        }
      } catch (err) {
        console.error(err);
        deleteAccountMessage.textContent = "An error occurred while deleting account.";
        deleteAccountMessage.style.color = "red";
        deleteAccountBtn.disabled = false;
      }
    });
  }

  // Initial load actions
  hideAllSections();
  updateNotificationBadge();

  // Optional: refresh notification badge periodically (e.g., every 60 seconds)
  setInterval(updateNotificationBadge, 60000);
});
