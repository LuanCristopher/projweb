const http = require("http");
const fs = require("fs");
const path = require("path");
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// ======= CONFIGURAÇÃO DO BANCO DE DADOS =======
let db;

async function initializeDatabase() {
    db = await open({
        filename: './banco.db',
        driver: sqlite3.Database,
    });

    // Cria as tabelas se não existirem
    await db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT,
            token TEXT
        )
    `);

    await db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            description TEXT,
            pricePix REAL,
            priceCard REAL,
            color TEXT,
            brand TEXT,
            gender TEXT,
            images TEXT
        )
    `);

    await db.run(`
        CREATE TABLE IF NOT EXISTS cart (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            product_id INTEGER,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        )
    `);

    console.log("Banco de dados inicializado e tabelas criadas.");
}

initializeDatabase();

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

async function isUserLogged(req) {
    const cookieHeader = req.headers.cookie;
    const cookies = parseCookies(cookieHeader);
    const sessionToken = cookies.session;
    if (!sessionToken) return false;

    const user = await db.get("SELECT * FROM users WHERE token = ?", [sessionToken]);
    return !!user;
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

    // ========== ROTAS DE API ==========

    // 1) Cadastro (POST /api/register)
    if (url === "/api/register" && method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", async () => {
            try {
                const { email, password, confirmPassword } = JSON.parse(body);

                if (password !== confirmPassword) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ error: "As senhas não correspondem." }));
                }

                const userExists = await db.get("SELECT * FROM users WHERE email = ?", [email]);
                if (userExists) {
                    res.writeHead(409, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ error: "E-mail já cadastrado." }));
                }

                await db.run("INSERT INTO users (email, password) VALUES (?, ?)", [email, password]);

                res.writeHead(201, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ email, message: "Cadastro realizado com sucesso." }));
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
        req.on("end", async () => {
            try {
                const { emailCpf, password } = JSON.parse(body);
                const user = await db.get("SELECT * FROM users WHERE email = ? AND password = ?", [emailCpf, password]);

                if (!user) {
                    res.writeHead(401, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ error: "Credenciais inválidas." }));
                }

                const token = generateToken();
                await db.run("UPDATE users SET token = ? WHERE id = ?", [token, user.id]);

                res.writeHead(200, {
                    "Content-Type": "application/json",
                    "Set-Cookie": `session=${token}; HttpOnly; Path=/;`
                });
                return res.end(JSON.stringify({ email: user.email, message: "Login realizado com sucesso." }));
            } catch (error) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "Dados inválidos." }));
            }
        });
    }

    // 3) Listar todos os produtos (GET /api/products)
    else if (method === "GET" && url === "/api/products") {
        try {
            const products = await db.all("SELECT * FROM products");
            
            // Converte a string de imagens para array
            const formattedProducts = products.map(product => ({
    ...product,
    images: product.images ? product.images.split(',') : [] // Converte a string em array
}));

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify(formattedProducts));
        } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Erro ao buscar produtos." }));
        }
    }

    // 4) Buscar produto por ID (GET /api/products/:id)
    else if (method === "GET" && url.startsWith("/api/products/")) {
        const parts = url.split("/");
        const productId = parts[parts.length - 1];
        try {
            const product = await db.get("SELECT * FROM products WHERE id = ?", [productId]);
            if (!product) {
                res.writeHead(404, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "Produto não encontrado." }));
            }

            // Converte a string de imagens para array
            product.images = product.images ? product.images.split(',') : [];

            res.writeHead(200, { "Content-Type": "application/json" });
            return res.end(JSON.stringify(product));
        } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ error: "Erro ao buscar produto." }));
        }
    }

    // 5) Carrinho - Adicionar item (POST /api/cart)
    else if (url === "/api/cart" && method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", async () => {
            try {
                // Verifica se o usuário está logado
                const cookies = parseCookies(req.headers.cookie);
                const sessionToken = cookies.session;
                console.log("Token de sessão recebido:", sessionToken); // Log do token

                if (!sessionToken) {
                    res.writeHead(401, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ error: "Token de sessão ausente. Faça login." }));
                }

                const user = await db.get("SELECT * FROM users WHERE token = ?", [sessionToken]);
                console.log("Usuário encontrado:", user); // Log do usuário

                if (!user) {
                    res.writeHead(401, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ error: "Token de sessão inválido. Faça login." }));
                }

                // Extrai o productId do corpo da requisição
                const { productId } = JSON.parse(body);
                console.log("ProductId recebido:", productId); // Log do productId

                // Verifica se o produto existe
                const product = await db.get("SELECT * FROM products WHERE id = ?", [productId]);
                if (!product) {
                    res.writeHead(404, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ error: "Produto não encontrado." }));
                }

                // Adiciona o produto ao carrinho
                await db.run("INSERT INTO cart (user_id, product_id) VALUES (?, ?)", [user.id, productId]);

                res.writeHead(200, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ message: "Item adicionado ao carrinho." }));
            } catch (error) {
                console.error("Erro ao adicionar ao carrinho:", error); // Log do erro
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "Dados inválidos." }));
            }
        });
    }

    // Rota para listar itens do carrinho (GET /api/cart)
else if (url === "/api/cart" && method === "GET") {
    if (!isUserLogged(req)) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Não autorizado. Faça login." }));
    }
    try {
        // Obtém o usuário logado
        const cookies = parseCookies(req.headers.cookie);
        const sessionToken = cookies.session;
        const user = await db.get("SELECT * FROM users WHERE token = ?", [sessionToken]);

        // Busca os itens do carrinho do usuário
        const cartItems = await db.all(`
            SELECT cart.id as cartId, products.* 
            FROM cart
            INNER JOIN products ON cart.product_id = products.id
            WHERE cart.user_id = ?
        `, [user.id]);

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(cartItems));
    } catch (error) {
        console.error("Erro ao buscar carrinho:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Erro ao buscar carrinho." }));
    }
}

    // Rota para remover item do carrinho (DELETE /api/cart/:cartId)
else if (method === "DELETE" && url.startsWith("/api/cart/")) {
    const parts = url.split("/");
    const cartId = parts[parts.length - 1];
    try {
        await db.run("DELETE FROM cart WHERE id = ?", [cartId]);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Item removido do carrinho." }));
    } catch (error) {
        console.error("Erro ao remover item do carrinho:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Erro ao remover item do carrinho." }));
    }
}

    // ========== BLOQUEAR PÁGINAS (product.html e cart.html) SE NÃO LOGADO ==========
    else if (
        url.startsWith("/html/product.html") ||
        url.startsWith("/html/cart.html")
    ) {
        if (!isUserLogged(req)) {
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

    // ========== SERVIÇO DE ARQUIVOS ESTÁTICOS (HTML, CSS, JS, IMAGENS) ==========
    else {
        let filePath = path.join(__dirname, "public", url);
    
        // Se for a raiz ("/"), redireciona para a homepage
        if (url === "/") {
            filePath = path.join(__dirname, "public", "html", "homepage.html");
        }
    
        // Verifica se o arquivo existe
        fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
                res.writeHead(404, { "Content-Type": "text/plain" });
                return res.end("Arquivo não encontrado.");
            }
            serveStaticFile(res, filePath);
        });
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});