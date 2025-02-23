
document.addEventListener("DOMContentLoaded", async () => {
  // Atualiza o número de itens
  const badge = document.getElementById("cart-badge");
  if (!badge) return; 

  try {
    const resp = await fetch("/api/cart", { method: "GET" });
    if (resp.ok) {
      const cartItems = await resp.json();
      const count = cartItems.length;
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = "flex";
      } else {
        badge.textContent = "";
        badge.style.display = "none";
      }
    } else {
      badge.textContent = "";
      badge.style.display = "none";
    }
  } catch (err) {
    console.error("Erro ao buscar carrinho:", err);
    badge.textContent = "";
    badge.style.display = "none";
  }
});

// Atualiza o tooltip do ícone de login com o e-mail logado
document.addEventListener("DOMContentLoaded", () => {
  const email = localStorage.getItem("loggedEmail");
  if (email) {
    const loginLink = document.querySelector(".login-icon");
    if (loginLink) {
      loginLink.title = `Logado como ${email}`;
    }
  }
});
