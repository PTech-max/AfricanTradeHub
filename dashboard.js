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
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errText}`);
    }

    userData = await response.json();

    if (!userData.businessUrl || userData.businessUrl.trim() === "") {
      alert("Business URL is required to view your profile.");
      return;
    }

    document.querySelector(".logo-small")?.setAttribute("src", userData.logoUrl || "default-logo.png");
    const companyNameEl = document.querySelector(".company-name");
    if (companyNameEl) companyNameEl.textContent = userData.businessName || "No Business Name";

  } catch (error) {
    console.error("Error loading business info:", error);
    alert(`Unable to load business information:\n${error.message}`);
    return;
  }

  function clearDisplayedInfo() {
    const profileInfo = document.getElementById("profileInfo");
    if (profileInfo) profileInfo.style.display = "none";

    const main = document.querySelector("main.content-area");
    if (!main) return;

    const welcomeH2 = main.querySelector(".welcome-message");
    if (welcomeH2) welcomeH2.style.display = "block";

    const marketplaceContainer = main.querySelector(".marketplace-container");
    if (marketplaceContainer) marketplaceContainer.remove();
  }

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

  async function displayMarketplaceCards() {
  clearDisplayedInfo();

  const main = document.querySelector("main.content-area");
  if (!main) return;

  // Remove previous container if it exists
  const existingContainer = document.querySelector(".marketplace-container");
  if (existingContainer) existingContainer.remove();

  // Remove existing search bar if it exists
  const existingSearch = document.querySelector(".marketplace-search");
  if (existingSearch) existingSearch.remove();

  // Create search bar
  const searchWrapper = document.createElement("div");
  searchWrapper.className = "marketplace-search";
  searchWrapper.style.display = "flex";
  searchWrapper.style.gap = "10px";
  searchWrapper.style.margin = "20px";
  searchWrapper.style.alignItems = "center";

  const input = document.createElement("input");
  input.type = "text";
  input.id = "searchInput";
  input.placeholder = "Search by type or country...";
  input.style.padding = "8px";
  input.style.fontSize = "16px";
  input.style.flex = "1";

  const button = document.createElement("button");
  button.textContent = "Search";
  button.style.padding = "8px 12px";
  button.style.fontSize = "16px";

  button.onclick = () => displayMarketplaceCards(); // recall same function with filter

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      displayMarketplaceCards(); // also trigger on Enter key
    }
  });

  searchWrapper.appendChild(input);
  searchWrapper.appendChild(button);
  main.appendChild(searchWrapper);

  // Get search term
  const searchTerm = input.value.trim().toLowerCase();

  // Create container for cards
  const container = document.createElement("div");
  container.className = "marketplace-container";
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "30px";
  container.style.padding = "20px";
  main.appendChild(container);

  try {
    const response = await fetch('http://localhost:8080/api/marketplace');
    if (!response.ok) {
      throw new Error(`Failed to fetch marketplace data: ${response.status}`);
    }

    const businesses = await response.json();

    // Filter if search term exists
    const filteredBusinesses = businesses.filter(business => {
      const typeMatch = business.businessType?.toLowerCase().includes(searchTerm);
      const countryMatch = business.country?.toLowerCase().includes(searchTerm);
      return typeMatch || countryMatch;
    });

    if (!filteredBusinesses.length) {
      container.innerHTML = `<p>No businesses found for "${searchTerm}".</p>`;
      return;
    }

    // First 5 cards
    const firstFive = filteredBusinesses.slice(0, 5);
    const remaining = filteredBusinesses.slice(5);

    const topRow = document.createElement("div");
    topRow.style.display = "flex";
    topRow.style.flexWrap = "wrap";
    topRow.style.justifyContent = "space-between";
    topRow.style.gap = "20px";

    firstFive.forEach(business => {
      const card = createBusinessCard(business);
      card.style.flex = "1 1 calc(20% - 20px)";
      card.style.minWidth = "200px";
      topRow.appendChild(card);
    });

    container.appendChild(topRow);

    if (remaining.length) {
      const verticalWrapper = document.createElement("div");
      verticalWrapper.style.display = "flex";
      verticalWrapper.style.flexDirection = "column";
      verticalWrapper.style.gap = "20px";

      remaining.forEach(business => {
        const card = createBusinessCard(business);
        verticalWrapper.appendChild(card);
      });

      container.appendChild(verticalWrapper);
    }

  } catch (error) {
    container.innerHTML = `<p style="color: red;">Error loading businesses: ${error.message}</p>`;
    console.error(error);
  }
}


  function createBusinessCard(business) {
    const card = document.createElement("div");
    card.className = "card";
    card.style.background = "white";
    card.style.padding = "20px";
    card.style.borderRadius = "12px";
    card.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
    card.style.marginBottom = "10px";
    card.style.transition = "transform 0.2s ease";
    card.style.cursor = "pointer";

    card.addEventListener("mouseover", () => card.style.transform = "scale(1.02)");
    card.addEventListener("mouseout", () => card.style.transform = "scale(1)");

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

    return card;
  }

  document.getElementById("marketplaceBtn")?.addEventListener("click", () => {
    displayMarketplaceCards();
  });

  const otherButtons = document.querySelectorAll(".sidebar-links button:not(#myProfileBtn):not(#marketplaceBtn)");
  otherButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      clearDisplayedInfo();
    });
  });
});
