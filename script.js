// ===== LOCAL STORAGE =====
function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function currentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function logout() {
  localStorage.removeItem("currentUser");
}

// ===== SIGNUP =====
function signup(name, email, password) {
  const users = getUsers();
  const exists = users.find(user => user.email === email);

  if (exists) {
    return { success: false, message: "Email вже існує" };
  }

  const user = {
    id: Date.now(),
    name,
    email,
    password
  };

  users.push(user);
  saveUsers(users);

  return { success: true };
}

// ===== MODAL =====
function openModal() {
  document.getElementById("authModal").style.display = "block";
}

function closeModal() {
  document.getElementById("authModal").style.display = "none";
}

// ===== HANDLE SIGNUP =====
function handleSignup() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const result = signup(name, email, password);
  const msg = document.getElementById("message");

  if (result.success) {
    msg.style.color = "green";
    msg.innerText = "Реєстрація успішна ✅";
  } else {
    msg.style.color = "red";
    msg.innerText = result.message;
  }
}

// ===== CART =====
function addToCart(product) {
  alert("Додано в кошик: " + product);
}