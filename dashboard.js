document.addEventListener("DOMContentLoaded", async function () {
  // 1. Check payment status from URL
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get("payment");

  // 2. Save payment status in localStorage for persistence
  if (paymentStatus === "approved") {
    localStorage.setItem("paymentConfirmed", "true");

    // Optional: Remove query param from URL without reloading the page
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // 3. Check payment confirmed flag from localStorage (after setting)
  const isPaymentConfirmed = localStorage.getItem("paymentConfirmed") === "true";

  // --- Load user email and business info ---
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
  const BASE_URL = "http://localhost:8080"; // Adjust your API base URL here

  try {
    const response = await fetch(`${BASE_URL}/api/user/business-info?email=${encodeURIComponent(email)}`);
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

  // --- Utility function to clear displayed content ---
  function clearDisplayedInfo() {
    const profileInfo = document.getElementById("profileInfo");
    if (profileInfo) profileInfo.style.display = "none";

    const uploadSection = document.getElementById("uploadDocumentsSection");
    if (uploadSection) uploadSection.style.display = "none";

    const viewSection = document.getElementById("viewDocumentsSection");
    if (viewSection) viewSection.style.display = "none";

    const main = document.querySelector("main.content-area");
    if (!main) return;

    const welcomeH2 = main.querySelector(".welcome-message");
    if (welcomeH2) welcomeH2.style.display = "block";

    // Removed marketplace container and search bar removals (no marketplace anymore)
  }

  // --- Event Listeners ---

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

  // Removed marketplaceBtn listener (no marketplace)

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

  // Removed displayMarketplaceCards and createBusinessCard functions

  // Other sidebar buttons clear content
  const otherButtons = document.querySelectorAll(".sidebar-links button:not(#myProfileBtn):not(#uploadDocsBtn):not(#viewDocsBtn)");
  otherButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      clearDisplayedInfo();
    });
  });

  // Removed auto-show marketplace code
});
