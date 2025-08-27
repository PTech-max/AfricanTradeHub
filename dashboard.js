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

    // Update sidebar logo and company name always visible
    document.querySelector(".logo-small")?.setAttribute("src", userData.logoUrl || "default-logo.png");
    document.querySelector(".company-name").textContent = userData.businessName || "No Business Name";

  } catch (error) {
    console.error("Error loading business info:", error);
    alert(`Unable to load business information:\n${error.message}`);
  }

  // Helper function to clear displayed info
  function clearDisplayedInfo() {
    // Hide profile info container
    document.getElementById("profileInfo").style.display = "none";

    // Show welcome header again (if hidden)
    const main = document.querySelector("main.content-area");
    if (main.firstElementChild && main.firstElementChild.tagName === "H2") {
      main.firstElementChild.style.display = "block";
    }
    if (main.querySelector("p")) {
      main.querySelector("p").style.display = "block";
    }
  }

  // Show profile info in main content when My Profile button clicked
  document.getElementById("myProfileBtn").addEventListener("click", () => {
    if (!userData) {
      alert("Business information is not loaded yet.");
      return;
    }

    clearDisplayedInfo(); // clear any existing displayed info

    // Populate the profile info container
    document.getElementById("profileBusinessName").textContent = userData.businessName || "N/A";
    document.getElementById("profileEmail").textContent = userData.email || "N/A";
    document.getElementById("profileRegNumber").textContent = userData.regNumber || "N/A";
    document.getElementById("profileBusinessNumber").textContent = userData.businessNumber || "N/A";
    document.getElementById("profileAltBusinessNumber").textContent = userData.alternativeBusinessNumber || "N/A";
    document.getElementById("profileCountry").textContent = userData.country || "N/A";
    document.getElementById("profileBusinessType").textContent = userData.businessType || "N/A";

    // Show the profile info container and hide welcome text
    document.getElementById("profileInfo").style.display = "block";

    const main = document.querySelector("main.content-area");
    if (main.firstElementChild.tagName === "H2") {
      main.firstElementChild.style.display = "none";
    }
    if (main.querySelector("p")) {
      main.querySelector("p").style.display = "none";
    }
  });

  // Example for other sidebar buttons to clear displayed info on click
  // You can extend this to all buttons as needed:
  const otherButtons = document.querySelectorAll(".sidebar-links button:not(#myProfileBtn)");
  otherButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      clearDisplayedInfo();
      // You can add code here to show content related to other buttons if needed
    });
  });

});
