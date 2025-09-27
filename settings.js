document.addEventListener("DOMContentLoaded", () => {
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsSection = document.getElementById("settingsSection");

  const otherSections = [
    "profileInfo",
    "uploadDocumentsSection",
    "viewDocumentsSection",
    "paymentMethodsSection",
    "mainNotification"
  ];

  // Toggle Settings view
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      settingsSection.style.display = "block";

      // Hide other sections
      otherSections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
      });
    });
  }

  const changePasswordForm = document.getElementById("changePasswordForm");
  const passwordChangeMessage = document.getElementById("passwordChangeMessage");

  const deleteAccountBtn = document.getElementById("deleteAccountBtn");
  const deleteAccountMessage = document.getElementById("deleteAccountMessage");

  // Get email of logged-in user from localStorage
  const userEmail = localStorage.getItem("userEmail");

  // Handle password change with API call
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

      // Disable inputs and show loading
      Array.from(changePasswordForm.elements).forEach(el => el.disabled = true);
      passwordChangeMessage.textContent = "Updating password...";
      passwordChangeMessage.style.color = "black";

      try {
        const res = await fetch("http://localhost:8080/api/user/change-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include', // Include cookies or tokens as needed
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
        Array.from(changePasswordForm.elements).forEach(el => el.disabled = false);
      }
    });
  }

  // Handle account deletion with API call
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
          credentials: 'include', // Include cookies or tokens as needed
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
});
