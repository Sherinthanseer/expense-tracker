function logout() {
  // Remove login-related data
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("loggedInUser");   ;

  alert("You have been logged out.");
  window.location.href = "login.html";
}





