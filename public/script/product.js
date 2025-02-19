// public/script/product.js
document.addEventListener("DOMContentLoaded", () => {
    let currentProductId = null;
  
    // Botão COMPRAR
    const buyButton = document.getElementById("buy-button");
    buyButton.addEventListener("click", async () => {
      if (!currentProductId) {
        alert("Nenhum produto selecionado!");
        return;
      }
      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: currentProductId })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao adicionar ao carrinho.");
        }
        alert("Produto adicionado ao carrinho com sucesso!");
      } catch (error) {
        alert("Falha ao adicionar ao carrinho: " + error.message);
      }
    });
  
    // Função para carregar detalhes de um produto
    async function loadProductDetails(productId) {
      try {
        const resp = await fetch(`/api/products/${productId}`);
        if (!resp.ok) {
          throw new Error("Produto não encontrado ou erro no servidor.");
        }
        const product = await resp.json();
        currentProductId = product.id; // salva globalmente
  
        // Preenche o painel superior
        document.getElementById("product-name").textContent = product.name;
        document.getElementById("product-description").textContent = product.description;
        document.getElementById("product-color").textContent = product.color;
        document.getElementById("product-brand").textContent = product.brand;
        document.getElementById("product-gender").textContent = product.gender;
        document.getElementById("product-color2").textContent = product.color;
        document.getElementById("product-brand2").textContent = product.brand;
        document.getElementById("product-gender2").textContent = product.gender;
        document.getElementById("product-price-pix").textContent = `R$ ${product.pricePix} no PIX`;
        document.getElementById("product-price-card").textContent = `ou R$ ${product.priceCard} em 10x sem juros`;
  
        // Imagens
        const mainImage = document.getElementById("main-image");
        const thumbnailsContainer = document.getElementById("thumbnails-container");
        thumbnailsContainer.innerHTML = "";
  
        if (product.images && product.images.length > 0) {
          mainImage.src = product.images[0];
          product.images.forEach((imgUrl, index) => {
            const thumbImg = document.createElement("img");
            thumbImg.src = imgUrl;
            thumbImg.alt = `Miniatura ${index + 1}`;
            thumbImg.style.cursor = "pointer";
            thumbImg.addEventListener("click", () => {
              mainImage.src = imgUrl;
            });
            thumbnailsContainer.appendChild(thumbImg);
          });
        } else {
          mainImage.src = "https://via.placeholder.com/300x300?text=Sem+Imagem";
        }
      } catch (error) {
        alert(error.message);
      }
    }
  
    // Tornar clicáveis os itens de "Produtos Similares"
    const similarProducts = document.querySelectorAll(".similar-products .product");
    similarProducts.forEach((prodDiv) => {
      prodDiv.addEventListener("click", () => {
        const pId = prodDiv.getAttribute("data-id");
        loadProductDetails(pId);
      });
    });
  
    // Se quiser carregar um produto por padrão ao abrir a página, descomente:
    // loadProductDetails("1");
  });
  