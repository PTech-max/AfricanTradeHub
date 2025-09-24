document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const paymentBtn = document.getElementById("paymentMethodBtn");
  const paymentSection = document.getElementById("paymentMethodsSection");
  const paymentTotal = document.getElementById("paymentTotal");
  const billingRadios = document.querySelectorAll("input[name='billingCycle']");
  const tabs = document.querySelectorAll(".tabs .tab");
  const paypalForm = document.getElementById("paypalForm");
  const paymentMessage = document.getElementById("paymentMessage");

  const otherButtons = document.querySelectorAll(
    ".sidebar-links button:not(#paymentMethodBtn)"
  );

  // Helper to hide all main sections and reset UI state
  function clearDisplayedInfo() {
    const sections = [
      "profileInfo",
      "uploadDocumentsSection",
      "paymentMethodsSection"
    ];

    sections.forEach(id => {
      const section = document.getElementById(id);
      if (section) section.style.display = "none";
    });

    if (paypalForm) paypalForm.style.display = "none";

    tabs.forEach(t => t.classList.remove("active"));

    if (paymentMessage) {
      paymentMessage.textContent = "";
      paymentMessage.style.color = "";
    }

    const welcomeMsg = document.querySelector(".welcome-message");
    if (welcomeMsg) welcomeMsg.style.display = "block";

    const marketplaceContainer = document.querySelector(".marketplace-container");
    if (marketplaceContainer) marketplaceContainer.remove();
    const marketplaceSearch = document.querySelector(".marketplace-search");
    if (marketplaceSearch) marketplaceSearch.remove();
  }

  // Clear display on sidebar buttons except payment button
  otherButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      clearDisplayedInfo();
    });
  });

  // Show payment section when payment method button clicked
  paymentBtn?.addEventListener("click", () => {
    clearDisplayedInfo();
    if (paymentSection) {
      paymentSection.style.display = "block";
      // Show the PayPal form by default and select first tab
      if (paypalForm) paypalForm.style.display = "block";
      tabs.forEach(t => t.classList.remove("active"));
      tabs[0]?.classList.add("active"); // first tab active
      const welcomeMsg = document.querySelector(".welcome-message");
      if (welcomeMsg) welcomeMsg.style.display = "none";
    }
  });

  // Update payment total text on billing cycle change
  billingRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      const value = parseFloat(radio.value);
      if (!isNaN(value)) {
        let totalText = "";
        if (value === 49.95) totalText = "$49.95 USD / year";
        else if (value === 19.95) totalText = "$19.95 USD / quarter";
        else if (value === 9.95) totalText = "$9.95 USD / month";
        if (paymentTotal) paymentTotal.textContent = totalText;
      }
    });
  });

  // Tab click to toggle between payment forms
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      if (!paymentSection) return;

      if (paypalForm) paypalForm.style.display = "none";

      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const target = tab.getAttribute("data-target");
      if (target === "paypalForm" && paypalForm) {
        paypalForm.style.display = "block";
        if (paymentMessage) {
          paymentMessage.style.color = "black";
          paymentMessage.textContent = "You selected PayPal.";
        }
      }
    });
  });

  // Map amount to subscription type string used by backend
  function getSubscriptionTypeByAmount(amount) {
    switch (amount) {
      case 9.95:
        return "monthly";
      case 19.95:
        return "quarterly";
      case 49.95:
        return "annual";
      default:
        return null;
    }
  }

  // PayPal payment button click handler
  const paypalBtn = paypalForm?.querySelector("button");
  paypalBtn?.addEventListener("click", async () => {
    if (!paymentMessage) return;

    const selectedRadio = document.querySelector("input[name='billingCycle']:checked");
    const amount = parseFloat(selectedRadio?.value);

    if (isNaN(amount) || amount <= 0) {
      paymentMessage.style.color = "red";
      paymentMessage.textContent = "Please select a valid billing option.";
      return;
    }

    // Get userEmail from localStorage
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      paymentMessage.style.color = "red";
      paymentMessage.textContent = "User email not found. Please login first.";
      return;
    }

    // Get subscription type string for backend
    const subscriptionType = getSubscriptionTypeByAmount(amount);
    if (!subscriptionType) {
      paymentMessage.style.color = "red";
      paymentMessage.textContent = "Invalid subscription type.";
      return;
    }

    paypalBtn.disabled = true;
    paymentMessage.style.color = "green";
    paymentMessage.textContent = "Redirecting to PayPal...";

    try {
      // Build URL with required params
      const params = new URLSearchParams({
        amount: amount.toString(),
        subscriptionType,
        userEmail,
      });

      const response = await fetch(
        `http://localhost:8080/api/paypal/create-payment?${params.toString()}`,
        { method: "POST" }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to initiate PayPal payment.");
      }

      // The backend returns a plain text URL
      const approvalUrl = await response.text();

      // Redirect user to PayPal approval page
      window.location.href = approvalUrl;

    } catch (error) {
      paymentMessage.style.color = "red";
      paymentMessage.textContent = `Error: ${error.message}`;
      console.error("PayPal payment error:", error);
      paypalBtn.disabled = false;
    }
  });

  // Initially hide all payment forms and sections
  clearDisplayedInfo();
});
