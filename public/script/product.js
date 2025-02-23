// public/script/product.js
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  let currentProductId = null;

  const addToCartBtn = document.getElementById("add-to-cart-btn");
  const continueBtn = document.getElementById("continue-btn");

  addToCartBtn.addEventListener("click", async () => {
      if (!currentProductId) {
          alert("Nenhum produto selecionado!");
          return;
      }
      try {
          console.log("Adicionando produto ao carrinho:", currentProductId); // Log do productId
          const response = await fetch("/api/cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId: currentProductId })
          });
          if (!response.ok) {
              const errData = await response.json();
              throw new Error(errData.error || "Erro ao adicionar ao carrinho.");
          }
          alert("Produto adicionado ao carrinho com sucesso!");
      } catch (error) {
          console.error("Erro ao adicionar ao carrinho:", error); // Log do erro
          alert("Falha ao adicionar ao carrinho: " + error.message);
      }
  });

  continueBtn.addEventListener("click", () => {
      window.location.href = "/html/cart.html";
  });

  async function loadProductDetails(id) {
      try {
          const resp = await fetch(`/api/products/${id}`);
          if (!resp.ok) {
              throw new Error("Produto não encontrado ou erro no servidor.");
          }
          const product = await resp.json();
          currentProductId = product.id;

          // Preenche os detalhes do produto na página
          document.getElementById("product-name").textContent = product.name;
          document.getElementById("product-description").textContent = product.description;
          document.getElementById("product-color").textContent = product.color;
          document.getElementById("product-brand").textContent = product.brand;
          document.getElementById("product-gender").textContent = product.gender;
          document.getElementById("product-price-pix").textContent = `R$ ${product.pricePix} no PIX`;
          document.getElementById("product-price-card").textContent = `ou R$ ${product.priceCard} em 10x sem juros`;

          const mainImage = document.getElementById("main-image");
          const thumbsContainer = document.getElementById("thumbnails-container");
          thumbsContainer.innerHTML = "";

          if (product.images && product.images.length > 0) {
              mainImage.src = product.images[0];
              product.images.forEach((imgUrl) => {
                  const thumb = document.createElement("img");
                  thumb.src = imgUrl;
                  thumb.style.cursor = "pointer";
                  thumb.addEventListener("click", () => {
                      mainImage.src = imgUrl;
                  });
                  thumbsContainer.appendChild(thumb);
              });
          } else {
              mainImage.src = "https://via.placeholder.com/300x300?text=Sem+Imagem";
          }
      } catch (error) {
          alert(error.message);
          window.location.href = "/html/homepage.html";
      }
  }

  if (productId) {
      loadProductDetails(productId);
  } else {
      alert("Nenhum produto especificado!");
      window.location.href = "/html/homepage.html";
  }
});