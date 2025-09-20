const BASE_URL = 'http://localhost:8080';

document.querySelector('form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const form = e.target;

  // Step 1: Validate email
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

  // Step 2: Validate password
  const password = form.password.value.trim();
  if (!password) {
    alert("Password is required.");
    return;
  }
  // Password: 8-12 chars, 1 uppercase, 3 lowercase, 1 special (#,@,.,$), 2 numbers minimum
  const passwordRegex = /^(?=.*[A-Z])(?=(?:.*[a-z]){3,})(?=.*[#@.$])(?=(?:.*\d){2,}).{8,12}$/;
  if (!passwordRegex.test(password)) {
    alert("Password must be 8-12 characters long, contain at least 1 uppercase letter, 3 lowercase letters, 1 special character (#, @, ., $), and at least 2 numbers.");
    return;
  }

  // Step 3: Validate required business fields
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

  // Prepare data to send
  const data = {
    businessName: form.businessName.value.trim(),
    businessNumber: form.businessNumber.value.trim(),
    alternativeBusinessNumber: form.alternativeBusinessNumber.value.trim() || null,
    regNumber: form.regNumber.value.trim(),
    businessType: form.businessType.value,
    country: form.country.value,
    businessUrl: businessUrl,
    email: email,
    password: password,
    memberInfo: form.memberInfo.value.trim()
  };

try {
  const response = await fetch(`${BASE_URL}/addUser`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    let errorMsg = 'Unknown error';
    if (contentType.includes('application/json')) {
      const errorData = await response.json();
      errorMsg = errorData.message || errorMsg;
    } else {
      const text = await response.text();
      errorMsg = text || errorMsg;
    }
    alert(`Registration failed: ${errorMsg}`);
    return;
  }

  alert('Registration successful!');
  form.reset();
  resetPasswordRequirements();

  // Redirect to login page
  window.location.href = '/login.html'; // Adjust the path to your actual login page

} catch (error) {
  alert(`Error: ${error.message}`);
}
});

// Password strength logic

const passwordInput = document.querySelector('input[name="password"]');
const strengthText = document.getElementById('password-strength');

const reqLength = document.getElementById('req-length');
const reqUppercase = document.getElementById('req-uppercase');
const reqLowercase = document.getElementById('req-lowercase');
const reqSpecial = document.getElementById('req-special');
const reqNumbers = document.getElementById('req-numbers');

passwordInput.addEventListener('input', () => {
  const value = passwordInput.value;

  // Check length 8-12
  const lengthValid = value.length >= 8 && value.length <= 12;
  reqLength.style.color = lengthValid ? 'green' : 'red';

  // Check uppercase count >= 1
  const uppercaseValid = (value.match(/[A-Z]/g) || []).length >= 1;
  reqUppercase.style.color = uppercaseValid ? 'green' : 'red';

  // Check lowercase count >= 3
  const lowercaseValid = (value.match(/[a-z]/g) || []).length >= 3;
  reqLowercase.style.color = lowercaseValid ? 'green' : 'red';

  // Check special char count >= 1 (#,@,.,$)
  const specialValid = (value.match(/[#@.$]/g) || []).length >= 1;
  reqSpecial.style.color = specialValid ? 'green' : 'red';

  // Check numbers count >= 2
  const numbersValid = (value.match(/\d/g) || []).length >= 2;
  reqNumbers.style.color = numbersValid ? 'green' : 'red';

  // Calculate strength score
  let score = 0;
  if (lengthValid) score++;
  if (uppercaseValid) score++;
  if (lowercaseValid) score++;
  if (specialValid) score++;
  if (numbersValid) score++;

  let strength = '';
  let color = '';

  switch (score) {
    case 5:
      strength = 'Strong';
      color = 'green';
      break;
    case 3:
    case 4:
      strength = 'Medium';
      color = 'orange';
      break;
    case 1:
    case 2:
      strength = 'Weak';
      color = 'red';
      break;
    default:
      strength = '';
      color = 'black';
  }

  strengthText.textContent = strength ? `Password Strength: ${strength}` : '';
  strengthText.style.color = color;
});

function resetPasswordRequirements() {
  reqLength.style.color = 'red';
  reqUppercase.style.color = 'red';
  reqLowercase.style.color = 'red';
  reqSpecial.style.color = 'red';
  reqNumbers.style.color = 'red';
  strengthText.textContent = '';
}
