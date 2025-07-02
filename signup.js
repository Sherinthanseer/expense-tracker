document.getElementById("signup-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // Store all values
  localStorage.setItem("userName", username);
  localStorage.setItem("userEmail", email);
  localStorage.setItem("userPassword", password);

  alert("Account created successfully!");
  window.location.href = "login.html";
});
