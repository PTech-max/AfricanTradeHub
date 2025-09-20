// payment.js
document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const paymentBtn = document.getElementById("paymentMethodBtn");
  const paymentSection = document.getElementById("paymentMethodsSection");
  const paymentTotal = document.getElementById("paymentTotal");
  const billingRadios = document.querySelectorAll("input[name='billingCycle']");

  const tabs = document.querySelectorAll(".tabs .tab");
  const cardForm = document.getElementById("cardForm");
  const paypalForm = document.getElementById("paypalForm");
  const paymentMessage = document.getElementById("paymentMessage");

  // Sidebar or other buttons that should hide payment forms
  const otherButtons = document.querySelectorAll(
    ".sidebar-links button:not(#paymentMethodBtn)"
  );

  // Unified function to hide everything
  function clearDisplayedInfo() {
    const sections = [
      "profileInfo",
      "uploadDocumentsSection",
      //"viewDocumentsSection",
      "paymentMethodsSection"
    ];

    sections.forEach(id => {
      const section = document.getElementById(id);
      if (section) section.style.display = "none";
    });

    // Hide payment forms
    if (cardForm) cardForm.style.display = "none";
    if (paypalForm) paypalForm.style.display = "none";

    // Clear tabs
    tabs.forEach(t => t.classList.remove("active"));

    // Reset payment message
    if (paymentMessage) paymentMessage.textContent = "";

    // Show welcome if exists
    const welcomeMsg = document.querySelector(".welcome-message");
    if (welcomeMsg) welcomeMsg.style.display = "block";

    // Remove marketplace containers/search if exist
    const marketplaceContainer = document.querySelector(".marketplace-container");
    if (marketplaceContainer) marketplaceContainer.remove();
    const marketplaceSearch = document.querySelector(".marketplace-search");
    if (marketplaceSearch) marketplaceSearch.remove();
  }

  // Hide payment forms if any other button is clicked
  otherButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      clearDisplayedInfo();
    });
  });

  // Show payment section only when payment button is clicked
  paymentBtn?.addEventListener("click", () => {
    clearDisplayedInfo();
    if (paymentSection) paymentSection.style.display = "block";
  });

  // Update total display when billing cycle changes
  billingRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      const value = parseFloat(radio.value);
      if (!isNaN(value)) {
        let totalText = "";
        if (value === 49.95) totalText = "$49.95 USD / year";
        else if (value === 19.95) totalText = "$19.95 USD / quarter";
        else if (value === 9.95) totalText = "$9.95 USD / month";
        paymentTotal.textContent = totalText;
      }
    });
  });

  // Tabs click logic
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      if (!paymentSection) return;

      // Hide both forms first
      if (cardForm) cardForm.style.display = "none";
      if (paypalForm) paypalForm.style.display = "none";

      // Set active tab
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      // Show the selected form
      const target = tab.getAttribute("data-target");
      if (target === "paypalForm" && paypalForm) {
        paypalForm.style.display = "block";
        if (paymentMessage) paymentMessage.textContent = "You selected PayPal.";
      } else if (target === "cardForm" && cardForm) {
        cardForm.style.display = "block";
        if (paymentMessage) paymentMessage.textContent = "";
      }
    });
  });

  // Card payment submission
  cardForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!paymentMessage) return;

    const selectedRadio = document.querySelector("input[name='billingCycle']:checked");
    const amount = parseFloat(selectedRadio?.value);

    if (isNaN(amount) || amount <= 0) {
      paymentMessage.style.color = "red";
      paymentMessage.textContent = "Please select a valid billing option.";
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8080/api/payments/card?amount=" + encodeURIComponent(amount),
        { method: "POST" }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create payment");
      }

      paymentMessage.style.color = "green";
      paymentMessage.textContent = "Payment successful!";
    } catch (error) {
      paymentMessage.style.color = "red";
      paymentMessage.textContent = `Error: ${error.message}`;
      console.error("Card payment error:", error);
    }
  });
// PayPal button click
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

  // Disable button while processing
  paypalBtn.disabled = true;
  paymentMessage.style.color = "green";
  paymentMessage.textContent = "Redirecting to PayPal...";

  try {
    // Call backend to create PayPal payment
    const response = await fetch(`http://localhost:8080/api/paypal/create-payment?amount=${encodeURIComponent(amount)}`, {
      method: "POST"
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to initiate PayPal payment.");
    }

    const approvalUrl = await response.text(); // backend returns PayPal approval link as plain text

    // Redirect user to PayPal approval page
    window.location.href = approvalUrl;

  } catch (error) {
    paymentMessage.style.color = "red";
    paymentMessage.textContent = `Error: ${error.message}`;
    console.error("PayPal payment error:", error);
    paypalBtn.disabled = false; // Re-enable button on error
  }
});


  // Initially hide all payment forms
  clearDisplayedInfo();
});
