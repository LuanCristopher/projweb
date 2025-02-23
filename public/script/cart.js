// public/script/cart.js
document.addEventListener("DOMContentLoaded", async () => {
  const cartItemsSection = document.getElementById("cart-items");
  const subtotalPriceEl = document.getElementById("subtotal-price");
  const totalPriceEl = document.getElementById("total-price");
  const continueShoppingBtn = document.getElementById("continue-shopping");

  continueShoppingBtn.addEventListener("click", () => {
      window.location.href = "/html/homepage.html";
  });

  try {
      // 1) Pega os itens do carrinho
      const resp = await fetch("/api/cart", { method: "GET" });
      if (!resp.ok) {
          throw new Error("Erro ao carregar carrinho.");
      }
      const cartItems = await resp.json(); // Ex: [{ cartId, id, name, description, pricePix, priceCard, color, brand, gender, images }]

      if (cartItems.length === 0) {
          cartItemsSection.innerHTML = "<p>Seu carrinho está vazio.</p>";
          return;
      }

      let subtotal = 0;

      // 2) Para cada item do carrinho, exibe o produto
      for (const item of cartItems) {
          const cartItemDiv = document.createElement("div");
          cartItemDiv.classList.add("cart-item");

          const img = document.createElement("img");
          img.src = (item.images && item.images.length > 0)
               ? item.images[0] // Pega a primeira imagem do array
               : "https://via.placeholder.com/100?text=Sem+Imagem"; // Imagem padrão se não houver imagens
          img.alt = item.name;
          cartItemDiv.appendChild(img);

          const infoDiv = document.createElement("div");
          infoDiv.classList.add("item-info");

          const pName = document.createElement("p");
          pName.textContent = item.name;
          infoDiv.appendChild(pName);

          const pColor = document.createElement("p");
          pColor.textContent = `Cor: ${item.color}`;
          infoDiv.appendChild(pColor);

          const pBrand = document.createElement("p");
          pBrand.textContent = `Marca: ${item.brand}`;
          infoDiv.appendChild(pBrand);

          const itemControls = document.createElement("div");
          itemControls.classList.add("item-controls");
          const minusBtn = document.createElement("button");
          minusBtn.textContent = "-";
          const qtySpan = document.createElement("span");
          qtySpan.textContent = "1";
          const plusBtn = document.createElement("button");
          plusBtn.textContent = "+";
          itemControls.appendChild(minusBtn);
          itemControls.appendChild(qtySpan);
          itemControls.appendChild(plusBtn);
          infoDiv.appendChild(itemControls);

          cartItemDiv.appendChild(infoDiv);

          const priceDiv = document.createElement("div");
          priceDiv.classList.add("item-price");

          const pPix = document.createElement("p");
          pPix.textContent = `R$ ${item.pricePix} no PIX`;
          priceDiv.appendChild(pPix);

          const pCard = document.createElement("p");
          pCard.textContent = `ou R$ ${item.priceCard} em 10x no cartão (sem juros)`;
          priceDiv.appendChild(pCard);

          // Botão remover
          const removeBtn = document.createElement("button");
          removeBtn.classList.add("remove");
          removeBtn.textContent = "🗑️";
          removeBtn.addEventListener("click", async () => {
              try {
                  const response = await fetch(`/api/cart/${item.cartId}`, {
                      method: "DELETE",
                  });
                  if (!response.ok) {
                      throw new Error("Erro ao remover item do carrinho.");
                  }
                  window.location.reload(); // Recarrega a página após remover o item
              } catch (error) {
                  alert("Erro ao remover item: " + error.message);
              }
          });
          priceDiv.appendChild(removeBtn);

          cartItemDiv.appendChild(priceDiv);

          cartItemsSection.appendChild(cartItemDiv);

          // Soma ao subtotal
          subtotal += item.pricePix;
      }

      // 3) Atualiza subtotal e total
      subtotalPriceEl.textContent = `R$ ${subtotal.toFixed(2)}`;
      totalPriceEl.innerHTML = `
          R$ ${subtotal.toFixed(2)} NO PIX
          <span class="total-subtext">ou R$ ${(subtotal + 50).toFixed(2)} em 10x no cartão (sem juros)</span>
      `;
  } catch (error) {
      console.error("Erro ao carregar carrinho:", error);
      cartItemsSection.innerHTML = `<p>Erro: ${error.message}</p>`;
  }
});