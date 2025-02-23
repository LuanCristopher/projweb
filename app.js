// seed.js
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Dados dos produtos
const products = [
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
];

async function seedDatabase() {
    // Abre a conexão com o banco de dados
    const db = await open({
        filename: './banco.db', // Nome do arquivo do banco de dados
        driver: sqlite3.Database,
    });

    try {
        // Insere cada produto no banco de dados
        for (const product of products) {
            const imagesString = product.images.join(','); // Converte o array de imagens para uma string separada por vírgulas

            await db.run(
                `INSERT INTO products (id, name, description, pricePix, priceCard, color, brand, gender, images)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [product.id, product.name, product.description, product.pricePix, product.priceCard, product.color, product.brand, product.gender, imagesString]
            );

            console.log(`Produto "${product.name}" inserido com sucesso!`);
        }
    } catch (error) {
        console.error("Erro ao inserir produtos:", error);
    } finally {
        // Fecha a conexão com o banco de dados
        await db.close();
    }
}

// Executa a função para popular o banco de dados
seedDatabase();