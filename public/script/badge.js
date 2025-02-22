// badge.js
document.addEventListener("DOMContentLoaded", async () => {
    // Tenta achar o elemento do badge
    const badge = document.getElementById("cart-badge");
    if (!badge) return; // Se não tiver o badge na página, sai.
  
    try {
      const resp = await fetch("/api/cart", { method: "GET" });
      if (resp.ok) {
        // Se estiver logado e rota ok, pegamos os itens
        const cartItems = await resp.json();
        const count = cartItems.length;
        if (count > 0) {
          badge.textContent = count;
          badge.style.display = "flex"; // Aparece a bolinha
        } else {
          badge.style.display = "none"; // Se zero itens, some
        }
      } else {
        // Se der 401 (não logado) ou outro erro, escondemos o badge
        badge.style.display = "none";
      }
    } catch (error) {
      // Em caso de erro (ex: não logado), ocultar badge
      console.log("Erro ao buscar carrinho:", error);
      badge.style.display = "none";
    }
  });
  