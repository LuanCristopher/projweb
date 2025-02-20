const http = require("http");
const fs = require("fs");
const path = require("path");

// ======= BANCO DE DADOS EM MEMÓRIA =======
let users = [];  // [{ email, password, token }]
let products = [
  {
    id: "1",
    name: "Bermuda Biker",
    description: "Bermuda Biker feminina, ideal para treinos e uso casual.",
    pricePix: 80.0,
    priceCard: 90.0,
    color: "Preto",
    brand: "Genérica",
    gender: "Feminino",
    images: [
      "../fotos-geral/fotos-product/bermuda-biker.webp"
    ]
  },
  {
    id: "2",
    name: "Calça Legging",
    description: "Calça legging para atividades físicas, com tecido confortável.",
    pricePix: 120.0,
    priceCard: 135.0,
    color: "Rosa",
    brand: "Nike",
    gender: "Feminino",
    images: [
      "../fotos-geral/fotos-product/calca-leggin.webp"
    ]
  },
  {
    id: "3",
    name: "Camiseta Adidas",
    description: "Camiseta leve e confortável para o dia a dia.",
    pricePix: 100.0,
    priceCard: 110.0,
    color: "Azul",
    brand: "Adidas",
    gender: "Unissex",
    images: [
      "../fotos-geral/fotos-product/camiseta-adidas.webp"
    ]
  },
  {
    id: "4",
    name: "Regata Diadora",
    description: "Regata Diadora básica, perfeita para corridas e exercícios.",
    pricePix: 90.0,
    priceCard: 100.0,
    color: "Preto",
    brand: "Diadora",
    gender: "Feminino",
    images: [
      "../fotos-geral/fotos-product/regata-diadora.webp"
    ]
  },
  {
    id: "5",
    name: "Regata Fila Transfer - Preta",
    description: "Blusa feminina em malha de viscose com elastano.",
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
    id: "6",
    name: "Regata Malwee",
    description: "Regata Malwee para uso casual.",
    pricePix: 70.0,
    priceCard: 80.0,
    color: "Branca",
    brand: "Malwee",
    gender: "Feminino",
    images: [
      "../fotos-geral/fotos-product/regata-malwee.webp"
    ]
  }
  // Adicione mais se quiser
];

// Carrinho em memória (exemplo simples)
let cart = []; // [{ productId }]

// ======= FUNÇÕES AUXILIARES =======
function generateToken() {
  return Math.random().toString(36).substring(2);
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    cookies[name] = rest.join("=");
  });
  return cookies;
}

function isUserLogged(req) {
  const cookieHeader = req.headers.cookie;
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies.session;
  if (!sessionToken) return false;

  const userFound = users.find((u) => u.token === sessionToken);
  return !!userFound;
}

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

  // 2) Login (POST /api/login)
  else if (url === "/api/login" && method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const { emailCpf, password } = JSON.parse(body);
        const userFound = users.find((u) => u.email === emailCpf && u.password === password);
        if (!userFound) {
          res.writeHead(401, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Credenciais inválidas." }));
        }

        const token = generateToken();
        userFound.token = token;

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

  // 5) Carrinho - Adicionar item (POST /api/cart)
  else if (url === "/api/cart" && method === "POST") {
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
        cart.push({ productId });
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Item adicionado ao carrinho." }));
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Dados inválidos." }));
      }
    });
  }

  // 6) Carrinho - Listar itens (GET /api/cart)
  else if (url === "/api/cart" && method === "GET") {
    if (!isUserLogged(req)) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Não autorizado. Faça login." }));
    }
    // Retorna array cart
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(cart));
  }

  // ========== BLOQUEAR PÁGINAS (product.html e cart.html) SE NÃO LOGADO ==========
  else if (
    url.startsWith("/html/product.html") ||
    url.startsWith("/html/cart.html")
  ) {
    // 1) Se não estiver logado, redireciona para login
    if (!isUserLogged(req)) {
      res.writeHead(302, { Location: "/html/login.html" });
      return res.end();
    }

    // 2) Remove query string para achar o arquivo físico
    //    ex: "/html/product.html?id=2" -> "/html/product.html"
    const basePath = url.split("?")[0];
    let filePath = path.join(__dirname, "public", basePath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Página não encontrada.");
      }
      serveStaticFile(res, filePath);
    });
  }

  // ========== SERVIÇO DE ARQUIVOS ESTÁTICOS (HTML, CSS, JS, IMAGENS) ==========
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
