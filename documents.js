document.addEventListener("DOMContentLoaded", () => {
  const viewDocsBtn = document.getElementById("viewDocsBtn");
  const viewSection = document.getElementById("viewDocumentsSection");
  const docsList = document.getElementById("documentsList");
  const mainContent = document.querySelector("main.content-area");

  // Assuming other sections are siblings of viewDocumentsSection inside mainContent
  // Collect other sections to hide when showing docs
  const otherSections = [...mainContent.children].filter(el => el !== viewSection);

  viewDocsBtn?.addEventListener("click", async () => {
    if (!mainContent) {
      alert("Main content area not found.");
      return;
    }

    // If viewSection is already visible and docsList has content, do nothing
    if (viewSection.style.display === "block" && docsList.innerHTML.trim() !== "") {
      return;
    }

    // Hide other sections
    otherSections.forEach(section => {
      section.style.display = "none";
    });

    // Show view documents section and clear previous documents list
    viewSection.style.display = "block";
    docsList.innerHTML = "";

    const email = localStorage.getItem("userEmail");
    if (!email) {
      alert("User email not found. Please log in again.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/documents/by-email?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to fetch documents: ${err}`);
      }

      const documents = await res.json();

      if (documents.length === 0) {
        docsList.innerHTML = `<p>No documents uploaded yet.</p>`;
        return;
      }

      // Create Table
      const table = document.createElement("table");
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      table.innerHTML = `
        <thead>
          <tr>
            <th style="border: 1px solid #ccc; padding: 8px;">File Name</th>
            <th style="border: 1px solid #ccc; padding: 8px;">File Type</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Download Link</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;

      const tbody = table.querySelector("tbody");

      documents.forEach(doc => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td style="border: 1px solid #ccc; padding: 8px;">${doc.fileName}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${doc.fileType}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">
            <a href="${doc.downloadURL}" target="_blank" rel="noopener noreferrer">Download</a>
          </td>
        `;

        tbody.appendChild(row);
      });

      docsList.appendChild(table);

    } catch (err) {
      console.error("Error fetching documents:", err);
      docsList.innerHTML = `<p style="color:red;">Error loading documents: ${err.message}</p>`;
    }
  });
});
