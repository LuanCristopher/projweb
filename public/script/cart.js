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

    const cartItems = await resp.json();

    if (cartItems.length === 0) {
      cartItemsSection.innerHTML = "<p>Seu carrinho está vazio.</p>";
      return;
    }

    let subtotal = 0;

    // 2) Para cada item do carrinho, buscar o produto associado
    for (const item of cartItems) {
      // item.id => ID da linha na tabela 'cart'
      // item.productId => ID do produto
      const productResp = await fetch(`/api/products/${item.productId}`);
      if (!productResp.ok) {
        // Se der erro ao buscar o produto, apenas ignore
        continue;
      }
      const product = await productResp.json();

      // Cria o elemento visual
      const cartItemDiv = document.createElement("div");
      cartItemDiv.classList.add("cart-item");

      // Imagem do produto
      const img = document.createElement("img");
      img.src = (product.images && product.images.length > 0)
        ? product.images[0]
        : "https://via.placeholder.com/100?text=Sem+Imagem";
      img.alt = product.name;
      cartItemDiv.appendChild(img);

      // Div de informações (nome, cor, marca, controles)
      const infoDiv = document.createElement("div");
      infoDiv.classList.add("item-info");

      const pName = document.createElement("p");
      pName.textContent = product.name;
      infoDiv.appendChild(pName);

      const pColor = document.createElement("p");
      pColor.textContent = `Cor: ${product.color}`;
      infoDiv.appendChild(pColor);

      const pBrand = document.createElement("p");
      pBrand.textContent = `Marca: ${product.brand}`;
      infoDiv.appendChild(pBrand);

      // Controles de quantidade (exemplo)
      const itemControls = document.createElement("div");
      itemControls.classList.add("item-controls");
      const minusBtn = document.createElement("button");
      minusBtn.textContent = "-";
      const qtySpan = document.createElement("span");
      qtySpan.textContent = "1"; // Exemplo fixo
      const plusBtn = document.createElement("button");
      plusBtn.textContent = "+";
      itemControls.appendChild(minusBtn);
      itemControls.appendChild(qtySpan);
      itemControls.appendChild(plusBtn);
      infoDiv.appendChild(itemControls);

      cartItemDiv.appendChild(infoDiv);

      // Div de preços e botão remover
      const priceDiv = document.createElement("div");
      priceDiv.classList.add("item-price");

      const pPix = document.createElement("p");
      pPix.textContent = `R$ ${product.pricePix} no PIX`;
      priceDiv.appendChild(pPix);

      const pCard = document.createElement("p");
      pCard.textContent = `ou R$ ${product.priceCard} em 10x no cartão (sem juros)`;
      priceDiv.appendChild(pCard);

      // Botão remover (🗑️)
      const removeBtn = document.createElement("button");
      removeBtn.classList.add("remove");
      removeBtn.textContent = "🗑️";

      removeBtn.addEventListener("click", async () => {
        // Ao clicar, remove do carrinho via DELETE /api/cart/:id
        try {
          const deleteResp = await fetch(`/api/cart/${item.id}`, {
            method: "DELETE"
          });
          if (!deleteResp.ok) {
            const errData = await deleteResp.json();
            throw new Error(errData.error || "Erro ao remover item do carrinho.");
          } else {
            // Lê JSON de sucesso
            const successData = await deleteResp.json();
            alert(successData.message);
            location.reload();
          }
        } catch (error) {
          alert(error.message);
        }
      });
      priceDiv.appendChild(removeBtn);

      cartItemDiv.appendChild(priceDiv);

      cartItemsSection.appendChild(cartItemDiv);

      // Soma ao subtotal
      subtotal += product.pricePix;
    }

    // 3) Atualiza subtotal e total
    subtotalPriceEl.textContent = `R$ ${subtotal.toFixed(2)}`;
    totalPriceEl.innerHTML = `
      R$ ${subtotal.toFixed(2)} NO PIX
      <span class="total-subtext">ou R$ ${(subtotal + 50).toFixed(2)} em 10x no cartão (sem juros)</span>
    `;
  } catch (error) {
    cartItemsSection.innerHTML = `<p>Erro: ${error.message}</p>`;
  }
});
