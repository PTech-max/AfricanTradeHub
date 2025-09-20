const BASE_URL = 'http://localhost:8080';

document.querySelector('form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const form = e.target;

    // Step 1: Get and validate email
    const email = form.email.value.trim();
    if (!email) {
        alert("Email is required.");
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    // Step 2: Get and validate password
    const password = form.password.value.trim();
    if (!password) {
        alert("Password is required.");
        return;
    }
    // Password must have uppercase, lowercase, @, and number
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[@])(?=.*\d).+$/;
    if (!passwordRegex.test(password)) {
        alert("Password must contain at least one uppercase letter, one lowercase letter, one '@' symbol, and one number.");
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
        // Step 5: Prepare registration data
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
            businessUrl: businessUrl
        };

        // Step 6: Submit registration
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
