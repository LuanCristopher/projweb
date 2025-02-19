const http = require("http");
const fs = require("fs");
const path = require("path");

// ======= BANCO DE DADOS EM MEMÓRIA =======
let users = [];  // [{ email, password, token }]

// Três produtos de exemplo:
let products = [
  {
    id: "1",
    name: "Regata Fila Transfer Feminina - Preto",
    description: "Blusa feminina em malha de viscose com elastano. Modelagem slim fit, sem manga.",
    pricePix: 120.0,
    priceCard: 135.0,
    color: "Preto",
    brand: "Fila",
    gender: "Feminino",
    images: [
      "../fotos-geral/fotos-product/regata-fila-transfer-1.webp",
      "../fotos-geral/fotos-product/regata-fila-transfer-2.webp",
      "../fotos-geral/fotos-product/regata-fila-transfer-3.webp"
    ]
  },
  {
    id: "2",
    name: "Camiseta Adidas Masculina - Azul",
    description: "Camiseta leve e confortável, ideal para treinos e uso diário.",
    pricePix: 100.0,
    priceCard: 110.0,
    color: "Azul",
    brand: "Adidas",
    gender: "Masculino",
    images: [
      "../fotos-geral/fotos-product/camiseta-adidas.webp"
    ]
  },
  {
    id: "3",
    name: "Calça Legging Nike Feminina - Rosa",
    description: "Calça Nike com tecido leve e respirável, perfeita para atividades físicas.",
    pricePix: 150.0,
    priceCard: 170.0,
    color: "Rosa",
    brand: "Nike",
    gender: "Feminino",
    images: [
      "../fotos-geral/fotos-product/calca-leggin.webp"
    ]
  }
];

// Carrinho em memória (para fins de exemplo)
let cart = []; // [{ productId }, { productId }...]

// ======= FUNÇÕES AUXILIARES =======

// Gera um token simples para sessão
function generateToken() {
  return Math.random().toString(36).substring(2);
}

// Lê cookies do cabeçalho "Cookie"
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    cookies[name] = rest.join("=");
  });
  return cookies;
}

// Verifica se o usuário está logado (se tem um token válido)
function isUserLogged(req) {
  const cookieHeader = req.headers.cookie;
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies.session;
  if (!sessionToken) return false;

  // Se algum user tiver user.token === sessionToken, está logado
  const userFound = users.find((u) => u.token === sessionToken);
  return !!userFound;
}

// Serve arquivos estáticos (HTML, CSS, JS, Imagens, etc.)
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

// ======= CRIAÇÃO DO SERVIDOR =======
const server = http.createServer((req, res) => {
  const url = req.url;
  const method = req.method;

  // ========== ROTAS DE API ==========

  // 1) Cadastro (POST /api/register)
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

        // Verifica se já existe um usuário com esse email
        const userExists = users.find((u) => u.email === email);
        if (userExists) {
          res.writeHead(409, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "E-mail já cadastrado." }));
        }

        // Cria o novo usuário
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

  // 2) Login (POST /api/login)
  else if (url === "/api/login" && method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { emailCpf, password } = JSON.parse(body);
        // Busca o usuário
        const userFound = users.find((u) => u.email === emailCpf && u.password === password);
        if (!userFound) {
          res.writeHead(401, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Credenciais inválidas." }));
        }

        // Gera token de sessão e salva no user
        const token = generateToken();
        userFound.token = token;

        // Envia o cookie
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

  // 3) Listar todos os produtos (GET /api/products)
  else if (method === "GET" && url === "/api/products") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(products));
  }

  // 4) Buscar produto por ID (GET /api/products/:id)
  else if (method === "GET" && url.startsWith("/api/products/")) {
    const parts = url.split("/");
    const productId = parts[parts.length - 1];
    const product = products.find((p) => p.id === productId);

    if (!product) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Produto não encontrado." }));
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(product));
  }

  // 5) Adicionar item ao carrinho (POST /api/cart)
  else if (url === "/api/cart" && method === "POST") {
    // Exige login
    if (!isUserLogged(req)) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Não autorizado. Faça login." }));
    }

    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { productId } = JSON.parse(body);
        const product = products.find((p) => p.id === productId);
        if (!product) {
          res.writeHead(404, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Produto não encontrado." }));
        }
        // Adiciona no array cart
        cart.push({ productId });
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Item adicionado ao carrinho." }));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Dados inválidos." }));
      }
    });
  }

  // ========== BLOQUEAR PÁGINAS SE NÃO LOGADO ==========
  else if (
    (url === "/html/cart.html" || url.startsWith("/html/cart.html?")) ||
    (url === "/html/product.html" || url.startsWith("/html/product.html?"))
  ) {
    if (!isUserLogged(req)) {
      res.writeHead(302, { Location: "/html/login.html" });
      return res.end();
    }
    // Se estiver logado, servir arquivo
    let filePath = path.join(__dirname, "public", url);
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Página não encontrada.");
      }
      serveStaticFile(res, filePath);
    });
  }

  // ========== SERVIÇO DE ARQUIVOS ESTÁTICOS ==========
  else {
    let filePath = path.join(__dirname, "public", url);

    // Se for "/", manda pra homepage
    if (url === "/") {
      filePath = path.join(__dirname, "public", "html", "homepage.html");
    }

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
