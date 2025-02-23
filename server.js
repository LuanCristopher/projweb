const http = require("http");
const fs = require("fs");
const path = require("path");
const db = require("./db"); // Importa o módulo de conexão com o SQLite

// ======= FUNÇÕES AUXILIARES =======

function generateToken() {
  return Math.random().toString(36).substring(2);
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach(cookie => {
    const [name, ...rest] = cookie.trim().split("=");
    cookies[name] = rest.join("=");
  });
  return cookies;
}

// Função que retorna uma Promise com os dados do usuário logado ou null
function getLoggedUser(req) {
  const cookieHeader = req.headers.cookie;
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies.session;
  return new Promise((resolve, reject) => {
    if (!sessionToken) {
      resolve(null);
    } else {
      db.get("SELECT * FROM users WHERE token = ?", [sessionToken], (err, row) => {
        if (err || !row) resolve(null);
        else resolve(row);
      });
    }
  });
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
const server = http.createServer(async (req, res) => {
  const url = req.url;
  const method = req.method;
  const user = await getLoggedUser(req);
  const logged = !!user;

  // 1) Cadastro (POST /api/register)
  if (url === "/api/register" && method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const { email, password, confirmPassword } = JSON.parse(body);
        if (password !== confirmPassword) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "As senhas não correspondem." }));
        }
        const stmt = db.prepare("INSERT INTO users (email, password) VALUES (?, ?)");
        stmt.run(email, password, function(err) {
          if (err) {
            res.writeHead(409, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "E-mail já cadastrado." }));
          }
          res.writeHead(201, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ id: this.lastID, email }));
        });
        stmt.finalize();
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Dados inválidos." }));
      }
    });
  }
  
  // 2) Login (POST /api/login)
  else if (url === "/api/login" && method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const { emailCpf, password } = JSON.parse(body);
        db.get("SELECT * FROM users WHERE email = ? AND password = ?", [emailCpf, password], (err, row) => {
          if (err || !row) {
            res.writeHead(401, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Credenciais inválidas." }));
          }
          const token = generateToken();
          db.run("UPDATE users SET token = ? WHERE id = ?", [token, row.id], function(err2) {
            if (err2) {
              res.writeHead(500, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Erro no login." }));
            }
            res.writeHead(200, {
              "Content-Type": "application/json",
              "Set-Cookie": `session=${token}; HttpOnly; Path=/;`
            });
            return res.end(JSON.stringify({ email: row.email, message: "Login realizado com sucesso." }));
          });
        });
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Dados inválidos." }));
      }
    });
  }
  
  // 3) Listar todos os produtos (GET /api/products)
  else if (method === "GET" && url === "/api/products") {
    db.all("SELECT * FROM products", (err, rows) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Erro ao buscar produtos." }));
      }
      const prods = rows.map(row => ({ ...row, images: JSON.parse(row.images) }));
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(prods));
    });
  }
  
  // 4) Buscar produto por ID (GET /api/products/:id)
  else if (method === "GET" && url.startsWith("/api/products/")) {
    const parts = url.split("/");
    const productId = parts[parts.length - 1];
    db.get("SELECT * FROM products WHERE id = ?", [productId], (err, row) => {
      if (err || !row) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Produto não encontrado." }));
      }
      row.images = JSON.parse(row.images);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(row));
    });
  }
  
  // 5) Carrinho - Adicionar item (POST /api/cart)
  else if (url === "/api/cart" && method === "POST") {
    if (!logged) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Não autorizado. Faça login." }));
    }
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const { productId } = JSON.parse(body);
        // Agora usamos o id do usuário logado
        db.run("INSERT INTO cart (userId, productId, quantity) VALUES (?, ?, ?)", [user.id, productId, 1], function(err) {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Erro ao adicionar ao carrinho." }));
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Item adicionado ao carrinho." }));
        });
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Dados inválidos." }));
      }
    });
  }
  
  // 6) Carrinho - Listar itens (GET /api/cart)
  else if (url === "/api/cart" && method === "GET") {
    if (!logged) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Não autorizado. Faça login." }));
    }
    db.all("SELECT * FROM cart WHERE userId = ?", [user.id], (err, rows) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Erro ao buscar carrinho." }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(rows));
    });
  }
  
  // 7) Carrinho - Remover item (DELETE /api/cart/:id)
  else if (method === "DELETE" && url.startsWith("/api/cart/")) {
    if (!logged) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Não autorizado. Faça login." }));
    }
    const parts = url.split("/");
    const cartItemId = parts[parts.length - 1];
    db.run("DELETE FROM cart WHERE id = ? AND userId = ?", [cartItemId, user.id], function(err) {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Erro ao remover item do carrinho." }));
      }
      if (this.changes === 0) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Item não encontrado no carrinho." }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Item removido do carrinho com sucesso." }));
    });
  }
  
  // 8) Carrinho - Atualizar quantidade (PUT /api/cart/:id)
  else if (method === "PUT" && url.startsWith("/api/cart/")) {
    if (!logged) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Não autorizado. Faça login." }));
    }
    const parts = url.split("/");
    const cartItemId = parts[parts.length - 1];
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const { quantity } = JSON.parse(body);
        db.run("UPDATE cart SET quantity = ? WHERE id = ? AND userId = ?", [quantity, cartItemId, user.id], function(err) {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Erro ao atualizar quantidade." }));
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Quantidade atualizada com sucesso." }));
        });
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Dados inválidos." }));
      }
    });
  }
  
  // 9) Ticket de Ajuda (POST /api/ticket)
  else if (url === "/api/ticket" && method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      try {
        const { name, email, message } = JSON.parse(body);
        if (!name || !email || !message) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Todos os campos são obrigatórios." }));
        }
        db.run("INSERT INTO tickets (name, email, message) VALUES (?, ?, ?)", [name, email, message], function(err) {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Erro ao enviar ticket." }));
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ message: "Ticket enviado com sucesso." }));
        });
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Erro ao enviar ticket." }));
      }
    });
  }
  
  // 10) Logout (GET /api/logout)
  else if (url === "/api/logout" && method === "GET") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Set-Cookie": "session=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
    });
    return res.end(JSON.stringify({ message: "Logout realizado com sucesso." }));
  }
  
  // BLOQUEAR PÁGINAS (product.html e cart.html) SE NÃO LOGADO
  else if (url.startsWith("/html/product.html") || url.startsWith("/html/cart.html")) {
    if (!logged) {
      res.writeHead(302, { Location: "/html/login.html" });
      return res.end();
    }
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
  
  // SERVIÇO DE ARQUIVOS ESTÁTICOS (HTML, CSS, JS, IMAGENS)
  else {
    let filePath = path.join(__dirname, "public", url);
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
