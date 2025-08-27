document.addEventListener("DOMContentLoaded", async function () {
  let email = localStorage.getItem("userEmail");

  if (!email) {
    email = prompt("Enter your registered email:");
    if (email) {
      localStorage.setItem("userEmail", email);
    } else {
      alert("Email is required to load your business info.");
      return;
    }
  }

  console.log("User email from localStorage:", email);

  let userData = null;

  try {
    const response = await fetch(`http://localhost:8080/api/user/business-info?email=${encodeURIComponent(email)}`);
    console.log("Response status:", response.status, response.statusText);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server responded with ${response.status} — ${errText}`);
    }

    userData = await response.json();

    document.querySelector(".logo-small")?.setAttribute("src", userData.logoUrl || "default-logo.png");
    const companyNameEl = document.querySelector(".company-name");
    if (companyNameEl) companyNameEl.textContent = userData.businessName || "No Business Name";

  } catch (error) {
    console.error("Error loading business info:", error);
    alert(`Unable to load business information:\n${error.message}`);
  }

  function clearDisplayedInfo() {
    const profileInfo = document.getElementById("profileInfo");
    if (profileInfo) profileInfo.style.display = "none";

    const main = document.querySelector("main.content-area");
    if (!main) {
      console.error("Main content area not found!");
      return;
    }

    // Show welcome message again
    const welcomeH2 = main.querySelector(".welcome-message");
    if (welcomeH2) welcomeH2.style.display = "block";

    const welcomePara = main.querySelector("p.welcome-para");
    if (welcomePara) {
      welcomePara.style.display = "block";
    }

    // Remove marketplace container if it exists
    const marketplaceContainer = main.querySelector(".marketplace-container");
    if (marketplaceContainer) marketplaceContainer.remove();
  }

  document.getElementById("myProfileBtn")?.addEventListener("click", () => {
    if (!userData) {
      alert("Business information is not loaded yet.");
      return;
    }

    if (!userData.businessUrl || userData.businessUrl.trim() === "") {
      alert("Business URL is required to view your profile.");
      return;
    }

    clearDisplayedInfo();

    // Populate profile fields
    ddocument.getElementById("profileBusinessName").textContent = userData.businessName || "N/A";
    document.getElementById("profileEmail").textContent = userData.email || "N/A";
    document.getElementById("profileRegNumber").textContent = userData.regNumber || "N/A";
    document.getElementById("profileBusinessNumber").textContent = userData.businessNumber || "N/A";
    document.getElementById("profileAltBusinessNumber").textContent = userData.alternativeBusinessNumber || "N/A";
    document.getElementById("profileCountry").textContent = userData.country || "N/A";
    document.getElementById("profileBusinessType").textContent = userData.businessType || "N/A";
    document.getElementById("profileBusinessUrl").textContent = userData.businessUrl || "N/A";


    document.getElementById("profileInfo").style.display = "block";

    // Hide welcome
    const welcomeH2 = document.querySelector(".welcome-message");
    if (welcomeH2) welcomeH2.style.display = "none";
    const welcomePara = document.querySelector("p.welcome-para");
    if (welcomePara) welcomePara.style.display = "none";
  });

  async function displayMarketplaceCards() {
    clearDisplayedInfo();

    const main = document.querySelector("main.content-area");
    if (!main) {
      alert("Main content area not found!");
      return;
    }

    const container = document.createElement("div");
    container.className = "marketplace-container";
    container.style.display = "grid";
    container.style.gridTemplateColumns = "repeat(auto-fit, minmax(250px, 1fr))";
    container.style.gap = "20px";
    container.style.padding = "20px";

    main.appendChild(container);

    try {
      const response = await fetch('http://localhost:8080/api/marketplace');
      console.log("Marketplace response status:", response.status);
      if (!response.ok) {
        throw new Error(`Failed to fetch marketplace data: ${response.status}`);
      }
      const businesses = await response.json();
      console.log("Fetched businesses:", businesses);

      if (!businesses.length) {
        container.innerHTML = "<p>No businesses found.</p>";
        return;
      }

      businesses.forEach(business => {
        const card = document.createElement("div");
        card.className = "card";
        card.style.background = "white";
        card.style.padding = "20px";
        card.style.borderRadius = "12px";
        card.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";

        card.innerHTML = `
          <img src="${business.logoUrl || 'default-logo.png'}" alt="${business.businessName} Logo"
            style="width: 100%; max-height: 150px; object-fit: contain; border-radius: 8px; margin-bottom: 10px;" />
          <h3>${business.businessName}</h3>
          <p><strong>Business Number:</strong> ${business.businessNumber || "N/A"}</p>
          <p><strong>Type:</strong> ${business.businessType || "N/A"}</p>
          <p><strong>Country:</strong> ${business.country || "N/A"}</p>
          ${business.businessUrl ? `<p><strong>Website:</strong> <a href="${business.businessUrl}" target="_blank" rel="noopener noreferrer">${business.businessUrl}</a></p>` : ''}
          <button style="margin-top: 10px; background-color: #0a3d62; color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer;">Contact Business</button>
        `;

        container.appendChild(card);
      });

    } catch (error) {
      container.innerHTML = `<p style="color: red;">Error loading businesses: ${error.message}</p>`;
      console.error(error);
    }
  }

  const marketplaceBtn = document.getElementById("marketplaceBtn");
  if (marketplaceBtn) {
    marketplaceBtn.addEventListener("click", () => {
      displayMarketplaceCards();
    });
  } else {
    console.warn("#marketplaceBtn button not found!");
  }

  const otherButtons = document.querySelectorAll(".sidebar-links button:not(#myProfileBtn):not(#marketplaceBtn)");
  otherButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      clearDisplayedInfo();
    });
  });
});
