
document.addEventListener("DOMContentLoaded", async () => {
    const productsListSection = document.getElementById("products-list");
  
    try {
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error("Falha ao carregar produtos.");
      }
      const products = await response.json();
  
      productsListSection.innerHTML = "";
  
      products.forEach((prod) => {
        const productDiv = document.createElement("div");
        productDiv.classList.add("product");
  
        const imgContainer = document.createElement("div");
        imgContainer.classList.add("image-container");
        const img = document.createElement("img");
        img.src = (prod.images && prod.images.length > 0) ? prod.images[0] : "https://via.placeholder.com/150?text=Sem+Imagem";
        img.alt = prod.name;
        imgContainer.appendChild(img);
        productDiv.appendChild(imgContainer);
  
        const title = document.createElement("h3");
        title.textContent = prod.name;
        productDiv.appendChild(title);
  
        const price = document.createElement("p");
        price.textContent = `R$ ${prod.pricePix} no PIX`;
        productDiv.appendChild(price);
  
        // Ao clicar no card -> product.html?id=...
        productDiv.addEventListener("click", () => {
          window.location.href = `/html/product.html?id=${prod.id}`;
        });
  
        productsListSection.appendChild(productDiv);
      });
    } catch (error) {
      console.error(error);
      productsListSection.innerHTML = "<p>Erro ao carregar produtos.</p>";
    }
  });
  