// ====== ДАНІ ======
let allProducts = [];
let filteredProducts = [];
let cart = [];

// ====== PRODUCTS ======
function createCard(product) {
  return `
    <div class="product">
        <img src="${product.image}">
        <h4>${product.title}</h4>
        <p class="price">${product.price} ₴</p>
        <button onclick="addToCart('${product.title}', ${product.price})">🛒</button>
    </div>
  `;
}

async function loadProducts() {
  const res = await fetch("./data/posts.json");
  allProducts = await res.json();
  filteredProducts = allProducts;

  renderProducts(filteredProducts);
}

function renderProducts(products) {
  document.querySelector(".products").innerHTML =
    products.map(createCard).join("");
}

// ====== SEARCH ======
function searchProducts() {
  const value = document.querySelector(".search-box input").value.toLowerCase();

  const result = filteredProducts.filter(p =>
    p.title.toLowerCase().includes(value)
  );

  renderProducts(result);
}

// ====== CATEGORY ======
function filterCategory(category) {

  if(category === "all"){
    filteredProducts = allProducts;
  } else {
    filteredProducts = allProducts.filter(p =>
      p.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  renderProducts(filteredProducts);
}

// ====== CART ======
function addToCart(title, price) {
  cart.push({title, price});
  updateCart();

  alert("Додано: " + title);
}

function updateCart(){
  document.querySelector(".right span:last-child").innerHTML =
    `🛒 ${cart.length}`;
}

// ====== MODAL ======
function openModal(){
  document.getElementById("authModal").style.display = "flex";
}

function closeModal(){
  document.getElementById("authModal").style.display = "none";
}

// ====== USERS ======
function getUsers(){
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users){
  localStorage.setItem("users", JSON.stringify(users));
}

// ====== SIGNUP ======
function handleSignup(){
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if(!name || !email || !password){
    document.getElementById("message").textContent = "Заповни всі поля!";
    return;
  }

  const users = getUsers();

  const exists = users.find(u => u.email === email);

  if(exists){
    document.getElementById("message").textContent = "Користувач вже існує!";
    return;
  }

  const newUser = {
    name,
    email,
    password,
    role: "client"
  };

  users.push(newUser);
  saveUsers(users);

  localStorage.setItem("currentUser", JSON.stringify(newUser));

  document.getElementById("message").textContent = "Успішно!";

  updateUserUI();

  setTimeout(closeModal, 1000);
}

// ====== LOGIN STATUS ======
function getCurrentUser(){
  return JSON.parse(localStorage.getItem("currentUser"));
}

// ====== UI USER ======
function updateUserUI(){
  const user = getCurrentUser();

  const btn = document.querySelector(".auth-btn");

  if(user){
    btn.textContent = user.name;
    btn.onclick = logout;
  } else {
    btn.textContent = "Реєстрація";
    btn.onclick = openModal;
  }
}

// ====== LOGOUT ======
function logout(){
  localStorage.removeItem("currentUser");
  updateUserUI();
}

// ====== ADMIN PANEL ======
function showAdminPanel(){
  const user = getCurrentUser();

  if(!user || user.role !== "admin") return;

  const users = getUsers();

  let html = "<h2>Адмін панель</h2>";

  users.forEach(u => {
    html += `<p>${u.name} | ${u.email}</p>`;
  });

  document.querySelector("main").insertAdjacentHTML("afterbegin", html);
}

// ====== INIT ======
function init(){
  loadProducts();
  updateUserUI();
  showAdminPanel();
}

init();