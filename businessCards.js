document.addEventListener("DOMContentLoaded", async function () {
  const BASE_URL = "http://localhost:8080"; // Adjust your API base URL here

  // 1. Check payment status from URL
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get("payment");

  // 2. Save payment status in localStorage for persistence
  if (paymentStatus === "approved") {
    localStorage.setItem("paymentConfirmed", "true");
    // Remove query param without reload
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Utility to fetch user data by email
  async function fetchUserData(email) {
    try {
      const res = await fetch(`${BASE_URL}/api/user/business-info?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server responded with ${res.status}: ${errText}`);
      }
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Error fetching user data:", error);
      alert(`Unable to load business information:\n${error.message}`);
      return null;
    }
  }

  // New: Check subscription status from backend
  async function checkSubscriptionStatus(email) {
    try {
      const res = await fetch(`${BASE_URL}/api/paypal/subscription-status?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Subscription check failed with status ${res.status}: ${errText}`);
      }
      const data = await res.json();
      // data: {active: boolean, message: string, subscriptionType: string, paymentDate: string}
      return data;
    } catch (error) {
      console.error("Error checking subscription status:", error);
      alert(`Unable to verify subscription status:\n${error.message}`);
      return { active: false, message: "Subscription check failed" };
    }
  }

  // Load or ask for user email
  let email = localStorage.getItem("userEmail");
  if (!email) {
    email = prompt("Enter your registered email:");
    if (email) localStorage.setItem("userEmail", email);
    else {
      alert("Email is required to load your business info.");
      return;
    }
  }

  // Load user data
  let userData = await fetchUserData(email);
  if (!userData) return;

  // If payment just confirmed, reload user data to get fresh subscription info
  if (localStorage.getItem("paymentConfirmed") === "true") {
    userData = await fetchUserData(email);
    if (!userData) return;
    localStorage.removeItem("paymentConfirmed"); // Clear flag after refresh
  }

  // Set logo and company name
  document.querySelector(".logo-small")?.setAttribute("src", userData.logoUrl || "default-logo.png");
  const companyNameEl = document.querySelector(".company-name");
  if (companyNameEl) companyNameEl.textContent = userData.businessName || "No Business Name";

  // --- Utility function to clear displayed content ---
  function clearDisplayedInfo() {
    const idsToHide = ["profileInfo", "uploadDocumentsSection", "viewDocumentsSection"];
    idsToHide.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });

    const main = document.querySelector("main.content-area");
    if (!main) return;

    const welcomeH2 = main.querySelector(".welcome-message");
    if (welcomeH2) welcomeH2.style.display = "block";

    const marketplaceContainer = main.querySelector(".marketplace-container");
    if (marketplaceContainer) marketplaceContainer.remove();

    const existingSearch = main.querySelector(".marketplace-search");
    if (existingSearch) existingSearch.remove();

    const expiryMsg = main.querySelector(".subscription-expiry-message");
    if (expiryMsg) expiryMsg.remove();
  }

  // --- Subscription check function with logging (still keep for fallback, not used now) ---
  function isSubscriptionActive(subscriptionType, paymentDateStr) {
    if (!subscriptionType || !paymentDateStr) {
      console.log("Subscription or payment date missing");
      return false;
    }

    const paymentDate = new Date(paymentDateStr);
    if (isNaN(paymentDate)) {
      console.log("Invalid payment date:", paymentDateStr);
      return false;
    }

    const now = new Date();
    let expiryDate = new Date(paymentDate);

    switch (subscriptionType.toLowerCase()) {
      case "one_month":
      case "one month":
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        break;
      case "quarterly":
        expiryDate.setMonth(expiryDate.getMonth() + 3);
        break;
      case "annually":
      case "annual":
      case "yearly":
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        break;
      default:
        console.log("Unknown subscription type:", subscriptionType);
        return false;
    }

    console.log(`Now: ${now.toISOString()}, Expiry: ${expiryDate.toISOString()}`);

    return now < expiryDate;
  }

  // --- Event listeners and UI logic ---

  // Profile Button
  document.getElementById("myProfileBtn")?.addEventListener("click", () => {
    if (!userData) {
      alert("Business information is not loaded yet.");
      return;
    }

    clearDisplayedInfo();

    document.getElementById("profileBusinessName").textContent = userData.businessName || "N/A";
    document.getElementById("profileEmail").textContent = userData.email || "N/A";
    document.getElementById("profileRegNumber").textContent = userData.regNumber || "N/A";
    document.getElementById("profileBusinessNumber").textContent = userData.businessNumber || "N/A";
    document.getElementById("profileAltBusinessNumber").textContent = userData.alternativeBusinessNumber || "N/A";
    document.getElementById("profileCountry").textContent = userData.country || "N/A";
    document.getElementById("profileBusinessType").textContent = userData.businessType || "N/A";

    const businessUrlElem = document.getElementById("profileBusinessUrl");
    if (businessUrlElem) {
      businessUrlElem.innerHTML = `<a href="${userData.businessUrl}" target="_blank" rel="noopener noreferrer">${userData.businessUrl}</a>`;
    }

    document.getElementById("profileInfo").style.display = "block";

    const welcomeH2 = document.querySelector(".welcome-message");
    if (welcomeH2) welcomeH2.style.display = "none";
  });

  // Upload Documents Button
  const uploadBtn = document.getElementById("uploadDocsBtn");
  const uploadSection = document.getElementById("uploadDocumentsSection");
  uploadBtn?.addEventListener("click", () => {
    clearDisplayedInfo();
    uploadSection.style.display = "block";
  });

  // Upload form submission
  document.getElementById('uploadDocsForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = localStorage.getItem("userEmail");
    if (!email) {
      alert("User not logged in.");
      return;
    }

    const logoFile = document.getElementById("logoUploadInput").files[0];
    const generalFiles = document.getElementById("docUploadInput").files;

    const status = document.getElementById("uploadStatus");
    status.innerHTML = "";

    try {
      // Upload logo
      if (logoFile) {
        const logoForm = new FormData();
        logoForm.append('file', logoFile);
        logoForm.append('email', email);
        logoForm.append('isBusinessLogo', 'true');

        const logoRes = await fetch(`${BASE_URL}/upload`, {
          method: 'POST',
          body: logoForm,
        });

        if (!logoRes.ok) throw new Error('Logo upload failed.');
        const logoData = await logoRes.json();
        status.innerHTML += `<p>✅ Logo uploaded. ID: ${logoData.id}</p>`;
      }

      // Upload general documents
      if (generalFiles.length > 0) {
        for (const doc of generalFiles) {
          const docForm = new FormData();
          docForm.append('file', doc);
          docForm.append('email', email);
          docForm.append('isBusinessLogo', 'false');

          const docRes = await fetch(`${BASE_URL}/upload`, {
            method: 'POST',
            body: docForm,
          });

          if (!docRes.ok) throw new Error(`Document upload failed: ${doc.name}`);
          const docData = await docRes.json();
          status.innerHTML += `<p>📄 Document "${doc.name}" uploaded. ID: ${docData.id}</p>`;
        }
      }

      alert("All uploads completed successfully.");
      document.getElementById("uploadDocsForm").reset();

    } catch (err) {
      console.error(err);
      status.innerHTML += `<p style="color:red;">Error: ${err.message}</p>`;
    }
  });

  // Other sidebar buttons clear content
  const otherButtons = document.querySelectorAll(".sidebar-links button:not(#myProfileBtn):not(#uploadDocsBtn):not(#viewDocsBtn):not(#marketplaceBtn)");
  otherButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      clearDisplayedInfo();
    });
  });

  // Marketplace Button with subscription check (using backend)
  document.getElementById("marketplaceBtn")?.addEventListener("click", async () => {
    if (!userData) {
      alert("Business information is not loaded yet.");
      return;
    }

    // Check subscription status from backend
    const subscriptionStatus = await checkSubscriptionStatus(email);

    console.log("Subscription status from backend:", subscriptionStatus);

    if (!subscriptionStatus.active) {
      clearDisplayedInfo();

      const main = document.querySelector("main.content-area");
      if (main) {
        const msg = document.createElement("p");
        msg.className = "subscription-expiry-message";
        msg.style.color = "red";
        msg.style.fontWeight = "bold";
        msg.style.margin = "20px";
        msg.textContent = subscriptionStatus.message || "⚠️ Your subscription has expired. Please renew your subscription to access the marketplace.";
        main.appendChild(msg);
      }

      alert(subscriptionStatus.message || "⚠️ Your subscription has expired. Please renew your subscription to access the marketplace.");
      return;
    }

    // Subscription active, display marketplace
    displayMarketplaceCards();
  });

  // --- Marketplace rendering function ---
  async function displayMarketplaceCards() {
    clearDisplayedInfo();

    const main = document.querySelector("main.content-area");
    if (!main) return;

    const container = document.createElement("div");
    container.className = "marketplace-container";

    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search businesses...";
    searchInput.className = "marketplace-search";
    searchInput.style.marginBottom = "15px";
    searchInput.style.padding = "8px";
    searchInput.style.width = "100%";
    container.appendChild(searchInput);

    const cardsDiv = document.createElement("div");
    cardsDiv.className = "marketplace-cards";
    container.appendChild(cardsDiv);

    main.appendChild(container);

    try {
      const res = await fetch(`${BASE_URL}/api/marketplace`);
      if (!res.ok) throw new Error(`Marketplace fetch failed with status ${res.status}`);
      const businesses = await res.json();

      function renderCards(filtered) {
        cardsDiv.innerHTML = "";
        if (filtered.length === 0) {
          cardsDiv.innerHTML = "<p>No businesses found.</p>";
          return;
        }
        filtered.forEach(business => {
          const card = new BusinessCard(business).createElement();
          cardsDiv.appendChild(card);
        });
      }

      renderCards(businesses);

      searchInput.addEventListener("input", () => {
        const term = searchInput.value.trim().toLowerCase();
        if (term === "") {
          renderCards(businesses);
          return;
        }
        const filtered = businesses.filter(b =>
          (b.businessName && b.businessName.toLowerCase().includes(term)) ||
          (b.businessType && b.businessType.toLowerCase().includes(term)) ||
          (b.country && b.country.toLowerCase().includes(term))
        );
        renderCards(filtered);
      });

    } catch (error) {
      console.error("Error loading marketplace businesses:", error);
      cardsDiv.innerHTML = `<p style="color:red;">Unable to load marketplace businesses: ${error.message}</p>`;
    }

    const welcomeH2 = document.querySelector(".welcome-message");
    if (welcomeH2) welcomeH2.style.display = "none";
  }

  // --- BusinessCard Class ---
  class BusinessCard {
    constructor(business) {
      this.business = business;
    }

    createElement() {
      const card = document.createElement("div");
      card.className = "business-card";
      card.style.border = "1px solid #ccc";
      card.style.borderRadius = "6px";
      card.style.padding = "12px";
      card.style.margin = "8px";
      card.style.width = "250px";
      card.style.boxShadow = "2px 2px 8px rgba(0,0,0,0.1)";
      card.style.backgroundColor = "#fff";

      const logo = document.createElement("img");
      logo.src = this.business.logoUrl || "default-logo.png";
      logo.alt = this.business.businessName + " logo";
      logo.style.width = "100%";
      logo.style.height = "150px";
      logo.style.objectFit = "contain";
      logo.style.marginBottom = "10px";
      card.appendChild(logo);

      const name = document.createElement("h3");
      name.textContent = this.business.businessName || "Unnamed Business";
      name.style.margin = "0 0 6px 0";
      card.appendChild(name);

      const type = document.createElement("p");
      type.textContent = `Type: ${this.business.businessType || "N/A"}`;
      type.style.margin = "0 0 4px 0";
      card.appendChild(type);

      const country = document.createElement("p");
      country.textContent = `Country: ${this.business.country || "N/A"}`;
      country.style.margin = "0 0 4px 0";
      card.appendChild(country);

      const websiteLink = document.createElement("a");
      websiteLink.href = this.business.businessUrl || "#";
      websiteLink.textContent = this.business.businessUrl ? "Visit Website" : "";
      websiteLink.target = "_blank";
      websiteLink.rel = "noopener noreferrer";
      websiteLink.style.color = "#007BFF";
      websiteLink.style.textDecoration = "none";
      card.appendChild(websiteLink);

      return card;
    }
  }

});
