document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("login-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const inputEmail = document.getElementById("email").value;
    const inputPassword = document.getElementById("password").value;

    const savedEmail = localStorage.getItem("userEmail");
    const savedPassword = localStorage.getItem("userPassword");
    const savedUsername = localStorage.getItem("userName");

    if (inputEmail === savedEmail && inputPassword === savedPassword) {
      // ✅ Save login state and username
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("loggedInUser", savedUsername);

      // ✅ Now redirect
      window.location.href = "index.html";
    } else {
      alert("Invalid email or password");
    }
  });
});
