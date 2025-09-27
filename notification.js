window.addEventListener("DOMContentLoaded", () => {
  const badge = document.getElementById("notificationBadge");
  const btn = document.getElementById("notificationsBtn");
  const mainNotification = document.getElementById("mainNotification");

  // Initial states
  badge.style.display = "none";
  mainNotification.style.display = "none";
  btn.setAttribute("aria-expanded", "false");

  let subscriptionData = null; // to store the subscription info

  // Show notification message and badge
  function showBadgeIfNeeded() {
    if (!subscriptionData) return;
    
    const isActive = subscriptionData.active === true || subscriptionData.active === "true";
    const days = Number(subscriptionData.daysRemaining);

    if (!isActive || (days <= 2 && days >= 0)) {
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
  }

  // Function to get notification message to show on click
  function getNotificationMessage() {
    if (!subscriptionData) return "No subscription data available.";

    const isActive = subscriptionData.active === true || subscriptionData.active === "true";
    const days = Number(subscriptionData.daysRemaining);

    if (!isActive) {
      return `⏰ ${subscriptionData.message || "Your subscription has expired. Please renew to stay visible in the marketplace!"}`;
    } else {
      return `✅ Subscription is active. Days remaining: ${days} day${days === 1 ? "" : "s"}.`;
    }
  }

  // Toggle notification visibility on button click
  btn.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent event bubbling to document

    const isVisible = mainNotification.style.display === "block";

    if (isVisible) {
      mainNotification.style.display = "none";
      btn.setAttribute("aria-expanded", "false");
    } else {
      // Always update message when showing
      mainNotification.textContent = getNotificationMessage();
      mainNotification.style.display = "block";
      btn.setAttribute("aria-expanded", "true");
      mainNotification.focus?.();
    }
  });

  // Close notification if clicking outside button or notification
  document.addEventListener("click", (e) => {
    if (!btn.contains(e.target) && !mainNotification.contains(e.target)) {
      mainNotification.style.display = "none";
      btn.setAttribute("aria-expanded", "false");
    }
  });

  // Fetch subscription status and update notification accordingly
  async function checkSubscriptionAndNotify(userEmail) {
    try {
      const response = await fetch(`http://localhost:8080/api/paypal/subscription-status?email=${encodeURIComponent(userEmail)}`);
      const data = await response.json();

      subscriptionData = data;

      showBadgeIfNeeded();

      // If notification is visible, update text live
      if (mainNotification.style.display === "block") {
        mainNotification.textContent = getNotificationMessage();
      }

    } catch (error) {
      console.error("Error checking subscription status:", error);
      badge.style.display = "none";
      mainNotification.style.display = "none";
      btn.setAttribute("aria-expanded", "false");
    }
  }

  const loggedInUserEmail = localStorage.getItem("userEmail");
  if (!loggedInUserEmail) {
    console.warn("User email not found in localStorage.");
    return;
  }

  checkSubscriptionAndNotify(loggedInUserEmail);
  setInterval(() => checkSubscriptionAndNotify(loggedInUserEmail), 3600000); // check every hour
});
