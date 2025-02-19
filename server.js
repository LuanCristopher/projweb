const http = require("http");
const fs = require("fs");
const path = require("path");

// Nosso "banco de dados" em memória
// Cada usuário terá { email, password, token? }
let users = [];

// Função auxiliar para servir arquivos estáticos
function serveStaticFile(res, filePath) {
  const extname = path.extname(filePath);
  let contentType = "text/html";

  switch (extname) {
    case ".js":
      contentType = "application/javascript";
      break;
    case ".css":
      contentType = "text/css";
      break;
    case ".png":
      contentType = "image/png";
      break;
    case ".jpg":
    case ".jpeg":
      contentType = "image/jpeg";
      break;
    case ".webp":
      contentType = "image/webp";
      break;
    case ".svg":
      contentType = "image/svg+xml";
      break;
    case ".json":
      contentType = "application/json";
      break;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Arquivo não encontrado.");
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
}

// Função para gerar um token de sessão simples
function generateToken() {
  // Exemplo simples: string aleatória
  return Math.random().toString(36).substring(2);
}

// Função para extrair cookies de um cabeçalho "Cookie"
function parseCookies(cookieHeader) {
  // Exemplo básico: "chave=valor; outraChave=valor2"
  // Dividimos por ";" e depois separamos chave=valor
  const cookies = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    cookies[name] = rest.join("=");
  });
  return cookies;
}

const server = http.createServer((req, res) => {
  const url = req.url;
  const method = req.method;

  // --- ROTA: Cadastro ---
  if (url === "/api/register" && method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { email, password, confirmPassword } = JSON.parse(body);
        if (password !== confirmPassword) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "As senhas não correspondem." }));
        }

        const userExists = users.find((u) => u.email === email);
        if (userExists) {
          res.writeHead(409, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "E-mail já cadastrado." }));
        }

        const newUser = { email, password };
        users.push(newUser);

        res.writeHead(201, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(newUser));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Dados inválidos." }));
      }
    });
  }

  // --- ROTA: Login ---
  else if (url === "/api/login" && method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { emailCpf, password } = JSON.parse(body);

        // Busca um usuário com email == emailCpf e password == password
        const userFound = users.find((u) => u.email === emailCpf && u.password === password);
        if (!userFound) {
          res.writeHead(401, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Credenciais inválidas." }));
        }

        // Gera um token de sessão e salva no usuário
        const token = generateToken();
        userFound.token = token;

        // Define o cookie de sessão
        // HttpOnly para evitar acesso via JavaScript (mais seguro)
        // Path=/ para que ele seja enviado em qualquer rota
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Set-Cookie": `session=${token}; HttpOnly; Path=/;`
        });
        return res.end(JSON.stringify({ email: userFound.email, message: "Login realizado com sucesso." }));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Dados inválidos." }));
      }
    });
  }

  // --- SERVIR ARQUIVOS ESTÁTICOS ---
  else {
    // Mapeia para a pasta public
    let filePath = path.join(__dirname, "public", url);

    // Se for "/", vai para homepage
    if (url === "/") {
      filePath = path.join(__dirname, "public", "html", "homepage.html");
    }

    // Verifica se o usuário está tentando acessar cart.html ou product.html
    // Se sim, checamos o cookie de sessão
    if (url === "/html/cart.html" || url === "/html/product.html") {
      const cookieHeader = req.headers.cookie; 
      const cookies = parseCookies(cookieHeader);
      const sessionToken = cookies.session; // "session" é o nome do cookie que definimos

      // Verifica se há um usuário com esse token
      const userLogged = users.find((u) => u.token === sessionToken);
      if (!userLogged) {
        // Bloqueia o acesso ou redireciona
        res.writeHead(302, { Location: "/html/login.html" });
        return res.end();
      }
      // Se achou, continua e serve o arquivo normalmente
    }

    // Tenta ler o arquivo
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Página não encontrada.");
      }
      serveStaticFile(res, filePath);
    });
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
