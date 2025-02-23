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
    let totalCard = 0;

    // 2) Para cada item do carrinho, buscar o produto associado
    for (const item of cartItems) {
      const productResp = await fetch(`/api/products/${item.productId}`);
      if (!productResp.ok) {
        continue; // Se der erro ao buscar o produto, apenas ignore
      }
      const product = await productResp.json();

      // Cria o elemento visual para o item do carrinho
      const cartItemElement = document.createElement("div");
      cartItemElement.classList.add("cart-item");

      // Imagem do produto
      const img = document.createElement("img");
      img.src = (product.images && product.images.length > 0)
        ? product.images[0]
        : "https://via.placeholder.com/100?text=Sem+Imagem";
      img.alt = product.name;
      cartItemElement.appendChild(img);

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

      // Controles de quantidade
      const itemControls = document.createElement("div");
      itemControls.classList.add("item-controls");

      const minusBtn = document.createElement("button");
      minusBtn.textContent = "-";
      minusBtn.addEventListener("click", async () => {
        if (item.quantity > 1) {
          await updateCartItemQuantity(item.id, item.quantity - 1);
        } else {
          await removeCartItem(item.id);
        }
      });

      const qtySpan = document.createElement("span");
      qtySpan.textContent = item.quantity; // Quantidade do item no carrinho

      const plusBtn = document.createElement("button");
      plusBtn.textContent = "+";
      plusBtn.addEventListener("click", async () => {
        await updateCartItemQuantity(item.id, item.quantity + 1);
      });

      itemControls.appendChild(minusBtn);
      itemControls.appendChild(qtySpan);
      itemControls.appendChild(plusBtn);
      infoDiv.appendChild(itemControls);

      cartItemElement.appendChild(infoDiv);

      // Div de preços e botão remover
      const priceDiv = document.createElement("div");
      priceDiv.classList.add("item-price");

      const pPix = document.createElement("p");
      pPix.textContent = `R$ ${product.pricePix} no PIX`;
      priceDiv.appendChild(pPix);

      const pCard = document.createElement("p");
      pCard.textContent = `ou R$ ${product.priceCard} em 10x no cartão`;
      priceDiv.appendChild(pCard);

      // Botão remover (🗑️)
      const removeBtn = document.createElement("button");
      removeBtn.classList.add("remove");
      removeBtn.textContent = "🗑️";

      removeBtn.addEventListener("click", async () => {
        try {
          const deleteResp = await fetch(`/api/cart/${item.id}`, {
            method: "DELETE"
          });
          if (!deleteResp.ok) {
            const errData = await deleteResp.json();
            throw new Error(errData.error || "Erro ao remover item do carrinho.");
          } else {
            const successData = await deleteResp.json();
            alert(successData.message);
            location.reload();
          }
        } catch (error) {
          alert(error.message);
        }
      });

      priceDiv.appendChild(removeBtn);
      cartItemElement.appendChild(priceDiv);

      cartItemsSection.appendChild(cartItemElement);

      // Soma ao subtotal
      subtotal += product.pricePix * item.quantity;
      totalCard += product.priceCard * item.quantity;
    }

    // 3) Atualiza subtotal e total
    subtotalPriceEl.textContent = `R$ ${subtotal.toFixed(2)}`;
    totalPriceEl.innerHTML = `
      R$ ${subtotal.toFixed(2)} NO PIX
      <span class="total-subtext">ou R$ ${totalCard.toFixed(2)} em 10x no cartão</span>
    `;
  } catch (error) {
    cartItemsSection.innerHTML = `<p>Erro: ${error.message}</p>`;
  }
});

// Função para atualizar a quantidade de um item no carrinho
async function updateCartItemQuantity(cartItemId, quantity) {
  try {
    const response = await fetch(`/api/cart/${cartItemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity })
    });
    if (!response.ok) {
      throw new Error("Erro ao atualizar quantidade.");
    }
    location.reload();
  } catch (error) {
    alert(error.message);
  }
}

// Função para remover um item do carrinho
async function removeCartItem(cartItemId) {
  try {
    const response = await fetch(`/api/cart/${cartItemId}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      throw new Error("Erro ao remover item.");
    }
    location.reload();
  } catch (error) {
    alert(error.message);
  }
}