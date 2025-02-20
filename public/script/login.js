// public/script/login.js
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  // Login
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const emailCpf = document.getElementById("email-cpf").value;
    const senha = document.getElementById("senha").value;

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailCpf, password: senha })
      });
      if (!response.ok) {
        throw new Error("Falha no login. Verifique suas credenciais.");
      }
      const data = await response.json();
      alert(`Login realizado com sucesso! Usuário: ${data.email}`);
      window.location.href = "/html/homepage.html";
    } catch (error) {
      alert("Erro ao fazer login: " + error.message);
    }
  });

  // Cadastro
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("new-email").value;
    const password = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Falha ao cadastrar.");
      }
      const data = await response.json();
      alert(`Cadastro realizado com sucesso! Bem-vindo(a), ${data.email}`);
      window.location.href = "/html/login.html";
    } catch (error) {
      alert("Erro ao cadastrar: " + error.message);
    }
  });
});
