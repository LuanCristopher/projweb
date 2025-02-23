
document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logout-button");
    if (!logoutButton) return;
  
    logoutButton.addEventListener("click", async (event) => {
      event.preventDefault();
      try {
        const response = await fetch("/api/logout", { method: "GET" });
        if (!response.ok) {
          throw new Error("Erro ao fazer logout.");
        }
        // Remove o e-mail do localStorage
        localStorage.removeItem("loggedEmail");
        alert("Logout realizado com sucesso.");
        window.location.href = "/html/login.html";
      } catch (error) {
        alert(error.message);
      }
    });
  });
  