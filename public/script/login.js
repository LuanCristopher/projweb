document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
  
    // Login
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const emailCpf = document.getElementById("email-cpf").value;
      const senha = document.getElementById("senha").value;
      const loginData = { emailCpf, password: senha };
  
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginData)
        });
  
        if (!response.ok) {
          throw new Error("Falha no login. Verifique suas credenciais.");
        }
  
        const result = await response.json();
        alert("Login realizado com sucesso! Usuário: " + result.email);
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
      const registerData = { email, password, confirmPassword };
  
      try {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registerData)
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Falha ao registrar. Verifique os dados informados.");
        }
  
        const result = await response.json();
        alert("Cadastro realizado com sucesso! Bem-vindo(a), " + result.email);
        window.location.href = "/html/homepage.html";
      } catch (error) {
        alert("Erro ao cadastrar: " + error.message);
      }
    });
  });
  