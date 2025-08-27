const BASE_URL = 'http://localhost:8080';

document.querySelector('form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const form = e.target;

    // Extract email and password
    let email = form.email?.value || prompt("Please enter your email:");
    const password = form.password?.value || prompt("Please enter your password:");

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    // Validate required fields
    if (!form.businessName.value.trim()) {
        alert("Business Name is required.");
        return;
    }
    if (!form.businessNumber.value.trim()) {
        alert("Business Number is required.");
        return;
    }
    if (!form.regNumber.value.trim()) {
        alert("Registration Number is required.");
        return;
    }
    if (!form.businessType.value) {
        alert("Please select a Business Type.");
        return;
    }
    if (!form.country.value) {
        alert("Please select a Country.");
        return;
    }
    if (!form.memberInfo.value.trim()) {
        alert("Member Information is required.");
        return;
    }

    try {
        // 1. Upload logo if selected
        let logoId = null;
        if (form.logo?.files.length > 0) {
            const logoFile = form.logo.files[0];
            const logoForm = new FormData();
            logoForm.append('file', logoFile);
            logoForm.append('email', email);
            logoForm.append('isBusinessLogo', 'true');

            const logoRes = await fetch(`${BASE_URL}/upload`, {
                method: 'POST',
                body: logoForm
            });

            if (!logoRes.ok) throw new Error('Logo upload failed');

            const logoData = await logoRes.json();
            logoId = logoData.id;
        }

        // 2. Upload documents if any
        let documentIds = [];
        if (form.documents?.files.length > 0) {
            for (const docFile of form.documents.files) {
                const docForm = new FormData();
                docForm.append('file', docFile);
                docForm.append('email', email);
                docForm.append('isBusinessLogo', 'false');

                const docRes = await fetch(`${BASE_URL}/upload`, {
                    method: 'POST',
                    body: docForm
                });

                if (!docRes.ok) throw new Error(`Failed to upload document: ${docFile.name}`);

                const docData = await docRes.json();
                documentIds.push(docData.id);
            }
        }

        // 3. Register user with form data and uploaded file IDs
        const userData = {
            businessName: form.businessName.value.trim(),
            businessNumber: form.businessNumber.value.trim(),
            alternativeBusinessNumber: form.alternativeBusinessNumber.value.trim() || null,
            regNumber: form.regNumber.value.trim(),
            businessType: form.businessType.value,
            country: form.country.value,
            memberInfo: form.memberInfo.value.trim(),
            email: email,
            password: password,
            logoAttachmentId: logoId,
            documentAttachmentIds: documentIds,
        };

        const userRes = await fetch(`${BASE_URL}/addUser`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });

        if (!userRes.ok) {
            const errText = await userRes.text();
            throw new Error(`User registration failed: ${errText}`);
        }

        // Show success alert
        alert("The registration was successful and the confirmation has been sent to the entered email.");


        // Save email to localStorage
        localStorage.setItem("userEmail", email);

        // Clear form
        form.reset();

        // Redirect after 2 seconds
        setTimeout(() => {
            window.location.assign('/login.html');
        }, 2000);

    } catch (error) {
        alert('Error: ' + error.message);
    }
});
