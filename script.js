// створення картки товару
function createCard(product) {
  return `
    <div class="product">
        <img src="${product.image}" alt="${product.title}">
        <h4>${product.title}</h4>
        <p class="price">${product.price} ₴</p>
        <button onclick="addToCart('${product.title}')">🛒</button>
    </div>
  `;
}

// завантаження товарів з JSON
async function loadProducts() {
  const response = await fetch("./data/posts.json");
  const products = await response.json();

  const container = document.querySelector(".products");

  container.innerHTML = products
    .map(product => createCard(product))
    .join("");
}

// простий кошик
let cartCount = 0;

function addToCart(title) {
  cartCount++;
  alert("Додано в кошик: " + title);
}

// запуск
loadProducts();і