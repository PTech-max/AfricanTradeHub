const BASE_URL = 'http://localhost:8080';

document.querySelector('form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const form = e.target;

    // Step 1: Get and validate email
    let email = form.email?.value.trim();
    if (!email) {
        email = prompt("Please enter your email:");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    // Step 2: Get and validate password
    let password = form.password?.value.trim();
    if (!password) {
        password = prompt("Please enter your password:");
    }

    if (!password || password.length < 4) {
        alert("Password is required and must be at least 4 characters.");
        return;
    }

    // Step 3: Validate required business form fields
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

    // Step 4: Optional URL validation
    const businessUrl = form.businessUrl?.value.trim() || null;
    if (businessUrl && !/^https?:\/\/.+/.test(businessUrl)) {
        alert("Please enter a valid URL starting with http:// or https://");
        return;
    }

    try {
        // Step 5: Upload logo
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

        // Step 6: Upload documents
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

        // Step 7: Submit registration
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
            businessUrl: businessUrl,
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

        alert("The registration was successful and the confirmation has been sent to the entered email.");

        localStorage.setItem("userEmail", email);

        form.reset();

        setTimeout(() => {
            window.location.assign('/login.html');
        }, 2000);

    } catch (error) {
        alert('Error: ' + error.message);
        console.error(error);
    }
});
