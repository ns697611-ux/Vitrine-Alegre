/* =====================================================
   VITRINE ALEGRE
   HTML + CSS + JAVASCRIPT
   API: DummyJSON
===================================================== */


/* =====================================================
   CONFIGURAÇÕES
===================================================== */

const API = "https://dummyjson.com";
const COTACAO = 5.20;
const PRODUTOS_POR_PAGINA = 12;


/* =====================================================
   ESTADO
===================================================== */

let produtosAtuais = [];
let categorias = [];
let paginaAtual = 1;
let totalProdutos = 0;
let categoriaAtual = "todos";
let buscaAtual = "";
let ordenacaoAtual = "relevancia";
let produtoDetalhe = null;
let quantidadeDetalhe = 1;


/* =====================================================
   CARRINHO
===================================================== */

let carrinho = JSON.parse(
    localStorage.getItem("vitrine-carrinho")
) || [];


/* =====================================================
   FORMATAÇÃO DE MOEDA
===================================================== */

const dinheiro = new Intl.NumberFormat(
    "pt-BR",
    {
        style: "currency",
        currency: "BRL"
    }
);


/* =====================================================
   PREÇO FINAL
===================================================== */

function precoFinal(produto) {
    return (
        produto.price *
        (1 - produto.discountPercentage / 100)
    ) * COTACAO;
}


/* =====================================================
   PREÇO CHEIO
===================================================== */

function precoCheio(produto) {
    return produto.price * COTACAO;
}


/* =====================================================
   DESCONTO
===================================================== */

function valorDesconto(produto) {
    return (
        precoCheio(produto) -
        precoFinal(produto)
    );
}


/* =====================================================
   ESTRELAS
===================================================== */

function estrelas(nota) {
    const arredondado = Math.round(nota);
    let html = "";

    for (let i = 1; i <= 5; i++) {
        if (i <= arredondado) {
            html += "★";
        } else {
            html += `<span class="empty-star">★</span>`;
        }
    }

    return html;
}


/* =====================================================
   ATUALIZAR CONTADOR DO CARRINHO
===================================================== */

function atualizarContadorCarrinho() {
    const quantidade = carrinho.reduce(
        (total, item) => total + item.quantidade,
        0
    );

    const elemento = document.getElementById("cartCount");

    if (elemento) {
        elemento.textContent = quantidade;
    }
}


/* =====================================================
   SALVAR CARRINHO
===================================================== */

function salvarCarrinho() {
    localStorage.setItem(
        "vitrine-carrinho",
        JSON.stringify(carrinho)
    );

    atualizarContadorCarrinho();
}


/* =====================================================
   TOAST
===================================================== */

function mostrarToast(mensagem) {
    const antigo = document.querySelector(".toast");

    if (antigo) {
        antigo.remove();
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = mensagem;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2500);
}


/* =====================================================
   ADICIONAR AO CARRINHO
===================================================== */

function adicionarAoCarrinho(produto, quantidade = 1) {
    const existente = carrinho.find(
        item => item.id === produto.id
    );

    if (existente) {
        existente.quantidade += quantidade;
    } else {
        carrinho.push({
            id: produto.id,
            title: produto.title,
            price: produto.price,
            discountPercentage: produto.discountPercentage,
            category: produto.category,
            thumbnail: produto.thumbnail,
            quantidade: quantidade
        });
    }

    salvarCarrinho();
    mostrarToast(`${produto.title} foi adicionado ao carrinho`);
}


/* =====================================================
   REMOVER DO CARRINHO
===================================================== */

function removerDoCarrinho(id) {
    carrinho = carrinho.filter(
        item => item.id !== id
    );

    salvarCarrinho();
    renderCarrinho();
}


/* =====================================================
   ALTERAR QUANTIDADE
===================================================== */

function alterarQuantidade(id, valor) {
    const item = carrinho.find(
        produto => produto.id === id
    );

    if (!item) return;

    item.quantidade += valor;

    if (item.quantidade <= 0) {
        removerDoCarrinho(id);
        return;
    }

    salvarCarrinho();
    renderCarrinho();
}


/* =====================================================
   NAVEGAÇÃO
===================================================== */

function navegar(rota) {
    if (rota === "/carrinho") {
        window.location.hash = "/carrinho";
    } else {
        window.location.hash = "/";
    }

    renderApp();
}


/* =====================================================
   OBTER ROTA
===================================================== */

function obterRota() {
    const hash = window.location.hash.replace("#", "");
    return hash || "/";
}


/* =====================================================
   INICIALIZAÇÃO
===================================================== */

document.addEventListener("DOMContentLoaded", iniciar);

async function iniciar() {
    atualizarContadorCarrinho();
    configurarBusca();

    window.addEventListener("hashchange", renderApp);

    await renderApp();
}


/* =====================================================
   RENDERIZAR APP
===================================================== */

async function renderApp() {
    const rota = obterRota();

    if (rota === "/") {
        await renderHome();
        return;
    }

    if (rota === "/carrinho") {
        renderCarrinho();
        return;
    }

    if (rota.startsWith("/produtos/")) {
        const id = rota.split("/")[2];
        await renderDetalhe(id);
        return;
    }

    render404();
}


/* =====================================================
   BUSCA
===================================================== */

let timeoutBusca;

function configurarBusca() {
    const input = document.getElementById("searchInput");
    if (!input) return;

    input.addEventListener("input", function () {
        clearTimeout(timeoutBusca);

        timeoutBusca = setTimeout(() => {
            const valor = input.value.trim();
            const params = new URLSearchParams(window.location.search);

            if (valor) {
                params.set("busca", valor);
            } else {
                params.delete("busca");
            }

            params.set("pagina", "1");

            window.history.pushState({}, "", "?" + params.toString());

            if (obterRota() === "/") {
                renderHome();
            }
        }, 450);
    });
}


/* =====================================================
   LER PARÂMETROS
===================================================== */

function lerParametros() {
    const params = new URLSearchParams(window.location.search);

    buscaAtual = params.get("busca") || "";
    categoriaAtual = params.get("categoria") || "todos";
    paginaAtual = parseInt(params.get("pagina")) || 1;
    ordenacaoAtual = params.get("ordenar") || "relevancia";

    const input = document.getElementById("searchInput");
    if (input) {
        input.value = buscaAtual;
    }
}


/* =====================================================
   BUSCAR CATEGORIAS
===================================================== */

async function carregarCategorias() {
    try {
        const resposta = await fetch(`${API}/products/category-list`);

        if (!resposta.ok) {
            throw new Error("Erro ao carregar categorias");
        }

        categorias = await resposta.json();
    } catch (erro) {
        categorias = [];
    }
}


/* =====================================================
   MONTAR URL DE PRODUTOS
===================================================== */

function montarURLProdutos() {
    let urlBase = `${API}/products`;

    if (buscaAtual) {
        urlBase = `${API}/products/search`;
    } else if (categoriaAtual !== "todos") {
        urlBase = `${API}/products/category/${encodeURIComponent(categoriaAtual)}`;
    }

    const params = new URLSearchParams();

    if (buscaAtual) {
        params.set("q", buscaAtual);
    }

    params.set("limit", PRODUTOS_POR_PAGINA);
    params.set("skip", (paginaAtual - 1) * PRODUTOS_POR_PAGINA);

    if (ordenacaoAtual === "preco-menor") {
        params.set("sortBy", "price");
        params.set("order", "asc");
    } else if (ordenacaoAtual === "preco-maior") {
        params.set("sortBy", "price");
        params.set("order", "desc");
    } else if (ordenacaoAtual === "nome") {
        params.set("sortBy", "title");
        params.set("order", "asc");
    }

    return `${urlBase}?${params.toString()}`;
}


/* =====================================================
   BUSCAR PRODUTOS
===================================================== */

async function buscarProdutos() {
    const url = montarURLProdutos();
    const resposta = await fetch(url);

    if (!resposta.ok) {
        throw new Error("Não foi possível carregar os produtos.");
    }

    return await resposta.json();
}


/* =====================================================
   HOME
===================================================== */

async function renderHome() {
    const app = document.getElementById("app");

    lerParametros();

    app.innerHTML = `
        <section class="category-bar">
            <div class="category-content" id="categories">
                <button class="category-button active">
                    Carregando...
                </button>
            </div>
        </section>

        <div class="container">
            <div id="productsArea" class="loading">
                <div class="spinner"></div>
                <p>Carregando produtos...</p>
            </div>
        </div>
    `;

    if (categorias.length === 0) {
        await carregarCategorias();
    }

    renderCategorias();

    try {
        const dados = await buscarProdutos();

        produtosAtuais = dados.products || [];
        totalProdutos = dados.total || 0;

        renderProdutos();
    } catch (erro) {
        renderErroProdutos();
    }
}


/* =====================================================
   CATEGORIAS
===================================================== */

function renderCategorias() {
    const container = document.getElementById("categories");
    if (!container) return;

    let html = `
        <button
            class="category-button ${categoriaAtual === "todos" ? "active" : ""}"
            onclick="selecionarCategoria('todos')"
        >
            Todas
        </button>
    `;

    categorias.slice(0, 8).forEach(categoria => {
        html += `
            <button
                class="category-button ${categoriaAtual === categoria ? "active" : ""}"
                onclick="selecionarCategoria('${categoria}')"
            >
                ${categoria}
            </button>
        `;
    });

    if (categorias.length > 8) {
        html += `
            <button
                class="category-button"
                onclick="mostrarTodasCategorias()"
            >
                +${categorias.length - 8}
            </button>
        `;
    }

    container.innerHTML = html;
}


/* =====================================================
   SELECIONAR CATEGORIA
===================================================== */

function selecionarCategoria(categoria) {
    const params = new URLSearchParams(window.location.search);

    categoriaAtual = categoria;
    paginaAtual = 1;

    if (categoria === "todos") {
        params.delete("categoria");
    } else {
        params.set("categoria", categoria);
    }

    params.set("pagina", "1");

    window.history.pushState({}, "", "?" + params.toString());
    renderHome();
}


/* =====================================================
   TODAS AS CATEGORIAS
===================================================== */

function mostrarTodasCategorias() {
    const container = document.getElementById("categories");
    if (!container) return;

    container.innerHTML = `
        <button
            class="category-button ${categoriaAtual === "todos" ? "active" : ""}"
            onclick="selecionarCategoria('todos')"
        >
            Todas
        </button>
        ${categorias.map(categoria => `
            <button
                class="category-button ${categoriaAtual === categoria ? "active" : ""}"
                onclick="selecionarCategoria('${categoria}')"
            >
                ${categoria}
            </button>
        `).join("")}
    `;
}


/* =====================================================
   RENDERIZAR PRODUTOS
===================================================== */

function renderProdutos() {
    const area = document.getElementById("productsArea");
    if (!area) return;

    if (produtosAtuais.length === 0) {
        area.innerHTML = `
            <div class="state">
                <div class="state-icon">🔎</div>
                <h2>Nenhum produto encontrado</h2>
                <p>Não encontramos produtos para os filtros escolhidos.</p>
            </div>
        `;
        return;
    }

    let cards = "";

    produtosAtuais.forEach(produto => {
        const preco = precoFinal(produto);
        const cheio = precoCheio(produto);
        const desconto = Math.round(produto.discountPercentage);

        cards += `
            <article class="product-card">
                <div class="product-image" onclick="abrirProduto(${produto.id})">
                    ${desconto >= 5 ? `<span class="discount-badge">-${desconto}%</span>` : ""}
                    <img src="${produto.thumbnail}" alt="${produto.title}" loading="lazy">
                </div>

                <div class="product-info">
                    <span class="product-category">${produto.category}</span>
                    <h3 class="product-title" onclick="abrirProduto(${produto.id})">
                        ${produto.title}
                    </h3>

                    <div class="rating">
                        <span class="stars">${estrelas(produto.rating)}</span>
                        <span class="rating-number">${produto.rating.toFixed(2)}</span>
                    </div>

                    <div class="old-price">${dinheiro.format(cheio)}</div>
                    <div class="final-price">${dinheiro.format(preco)}</div>

                    <button
                        class="add-button"
                        onclick='adicionarAoCarrinho(${JSON.stringify(produto).replace(/'/g, "&apos;")})'
                    >
                        Adicionar
                    </button>
                </div>
            </article>
        `;
    });

    const paginas = Math.ceil(totalProdutos / PRODUTOS_POR_PAGINA);

    area.innerHTML = `
        <div class="products-toolbar">
            <div class="results-count">
                <strong>${totalProdutos} produtos</strong> · página ${paginaAtual} de ${paginas}
            </div>

            <select class="sort-select" onchange="alterarOrdenacao(this.value)">
                <option value="relevancia" ${ordenacaoAtual === "relevancia" ? "selected" : ""}>Ordenar: Relevância</option>
                <option value="preco-menor" ${ordenacaoAtual === "preco-menor" ? "selected" : ""}>Menor preço</option>
                <option value="preco-maior" ${ordenacaoAtual === "preco-maior" ? "selected" : ""}>Maior preço</option>
                <option value="nome" ${ordenacaoAtual === "nome" ? "selected" : ""}>Nome</option>
            </select>
        </div>

        <div class="products-grid">${cards}</div>

        ${renderPaginacao(paginas)}
    `;
}


/* =====================================================
   PAGINAÇÃO
===================================================== */

function renderPaginacao(totalPaginas) {
    if (totalPaginas <= 1) return "";

    let html = `
        <div class="pagination">
            <button
                class="page-button"
                ${paginaAtual === 1 ? "disabled" : ""}
                onclick="mudarPagina(${paginaAtual - 1})"
            >
                ‹
            </button>
    `;

    const inicio = Math.max(1, paginaAtual - 2);
    const fim = Math.min(totalPaginas, inicio + 4);

    for (let i = inicio; i <= fim; i++) {
        html += `
            <button
                class="page-button ${i === paginaAtual ? "active" : ""}"
                onclick="mudarPagina(${i})"
            >
                ${i}
            </button>
        `;
    }

    if (fim < totalPaginas) {
        html += `
            <span>...</span>
            <button class="page-button" onclick="mudarPagina(${totalPaginas})">
                ${totalPaginas}
            </button>
        `;
    }

    html += `
            <button
                class="page-button"
                ${paginaAtual === totalPaginas ? "disabled" : ""}
                onclick="mudarPagina(${paginaAtual + 1})"
            >
                ›
            </button>
        </div>
    `;

    return html;
}


/* =====================================================
   MUDAR PÁGINA
===================================================== */

function mudarPagina(pagina) {
    if (pagina < 1) return;

    const totalPaginas = Math.ceil(totalProdutos / PRODUTOS_POR_PAGINA);
    if (pagina > totalPaginas) return;

    const params = new URLSearchParams(window.location.search);
    params.set("pagina", pagina);

    window.history.pushState({}, "", "?" + params.toString());

    window.scrollTo({ top: 0, behavior: "smooth" });
    renderHome();
}


/* =====================================================
   ORDENAR
===================================================== */

function alterarOrdenacao(valor) {
    const params = new URLSearchParams(window.location.search);

    params.set("ordenar", valor);
    params.set("pagina", "1");

    window.history.pushState({}, "", "?" + params.toString());
    renderHome();
}


/* =====================================================
   ERRO
===================================================== */

function renderErroProdutos() {
    const area = document.getElementById("productsArea");

    area.innerHTML = `
        <div class="state">
            <div class="state-icon">⚠️</div>
            <h2>Não foi possível carregar os produtos</h2>
            <p>Ocorreu um problema ao consultar a API. Verifique sua conexão e tente novamente.</p>
            <button class="retry-button" onclick="renderHome()">
                Tentar novamente
            </button>
        </div>
    `;
}


/* =====================================================
   ABRIR PRODUTO
===================================================== */

function abrirProduto(id) {
    window.location.hash = `/produtos/${id}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
    renderApp();
}


/* =====================================================
   DETALHE
===================================================== */

async function renderDetalhe(id) {
    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="container">
            <div class="breadcrumb">Carregando produto...</div>
            <div class="loading">
                <div class="spinner"></div>
                <p>Carregando produto...</p>
            </div>
        </div>
    `;

    try {
        const resposta = await fetch(`${API}/products/${id}`);

        if (!resposta.ok) {
            throw new Error("Produto não encontrado");
        }

        produtoDetalhe = await resposta.json();
        quantidadeDetalhe = 1;

        renderDetalheProduto();
        await carregarProdutosRelacionados(produtoDetalhe.category, produtoDetalhe.id);

    } catch (erro) {
        app.innerHTML = `
            <div class="container">
                <div class="breadcrumb">
                    <a href="#/">Início</a> › Produto
                </div>
                <div class="state">
                    <div class="state-icon">⚠️</div>
                    <h2>Produto não encontrado</h2>
                    <p>Não foi possível carregar este produto.</p>
                    <button class="retry-button" onclick="window.location.hash='/'">
                        Voltar para a vitrine
                    </button>
                </div>
            </div>
        `;
    }
}


/* =====================================================
   RENDER DETALHE
===================================================== */

function renderDetalheProduto() {
    const p = produtoDetalhe;
    const app = document.getElementById("app");

    const preco = precoFinal(p);
    const cheio = precoCheio(p);
    const desconto = Math.round(p.discountPercentage);
    const economia = valorDesconto(p);
    const imagens = p.images && p.images.length ? p.images : [p.thumbnail];
    const reviews = p.reviews || [];
    const tresReviews = reviews.slice(0, 3);

    app.innerHTML = `
        <div class="container">
            <div class="breadcrumb">
                <a href="#/">Início</a>
                <span> › </span>
                <span>${p.category}</span>
                <span> › </span>
                <strong>${p.title}</strong>
            </div>

            <section class="product-detail">
                <!-- GALERIA -->
                <div>
                    <div class="gallery-main">
                        <img id="mainProductImage" src="${imagens[0]}" alt="${p.title}">
                    </div>

                    <div class="gallery-thumbnails">
                        ${imagens.map((imagem, index) => `
                            <button
                                class="thumbnail ${index === 0 ? "active" : ""}"
                                onclick="trocarImagem('${imagem}', this)"
                            >
                                <img src="${imagem}" alt="${p.title}">
                            </button>
                        `).join("")}
                    </div>
                </div>

                <!-- COMPRA -->
                <div>
                    <span class="detail-category">${p.category}</span>
                    <h1 class="detail-title">${p.title}</h1>
                    <p class="detail-brand">
                        Marca: ${p.brand || "Não informado"} · SKU: ${p.sku || "N/A"}
                    </p>

                    <div class="detail-rating">
                        <span class="stars">${estrelas(p.rating)}</span>
                        <span>${p.rating.toFixed(2)}</span>
                        <span>· ${reviews.length} avaliações</span>
                    </div>

                    <hr class="detail-divider">

                    <div>
                        <span class="detail-old-price">${dinheiro.format(cheio)}</span>
                        <span class="saving">economize ${dinheiro.format(economia)}</span>
                    </div>

                    <div class="detail-price">
                        <strong>${dinheiro.format(preco)}</strong>
                        ${desconto >= 5 ? `<span class="detail-discount">-${desconto}%</span>` : ""}
                    </div>

                    <p class="installments">
                        em até 12x de ${dinheiro.format(preco / 12)} sem juros
                    </p>

                    <p class="stock">
                        ● ${p.stock} em estoque · In Stock
                    </p>

                    <div class="purchase-row">
                        <div class="quantity">
                            <button onclick="alterarQuantidadeDetalhe(-1)">−</button>
                            <span id="detailQuantity">1</span>
                            <button onclick="alterarQuantidadeDetalhe(1)">+</button>
                        </div>

                        <button class="buy-button" onclick="adicionarDetalheAoCarrinho()">
                            Adicionar ao carrinho
                        </button>
                    </div>

                    <div class="info-pills">
                        <div class="info-pill">
                            <span>Envio</span>
                            <strong>${p.shippingInformation || "Padrão"}</strong>
                        </div>

                        <div class="info-pill">
                            <span>Garantia</span>
                            <strong>${p.warrantyInformation || "Sem garantia"}</strong>
                        </div>

                        <div class="info-pill">
                            <span>Devolução</span>
                            <strong>${p.returnPolicy || "30 dias"}</strong>
                        </div>
                    </div>
                </div>
            </section>

            <!-- DESCRIÇÃO -->
            <div class="detail-sections">
                <section class="detail-section">
                    <h2>Descrição</h2>
                    <div class="description-box">
                        <p>${p.description}</p>
                        <div class="tags">
                            ${p.tags ? p.tags.map(tag => `#${tag}`).join(" ") : ""}
                        </div>
                    </div>
                </section>

                <section class="detail-section">
                    <h2>Especificações</h2>
                    <div class="specifications">
                        <div class="spec-row">
                            <span>Peso</span>
                            <strong>${p.weight || "N/A"} kg</strong>
                        </div>

                        <div class="spec-row">
                            <span>Dimensões</span>
                            <strong>
                                ${p.dimensions ? `${p.dimensions.width} × ${p.dimensions.height} × ${p.dimensions.depth} cm` : "N/A"}
                            </strong>
                        </div>

                        <div class="spec-row">
                            <span>Estoque</span>
                            <strong>${p.stock} unidades</strong>
                        </div>

                        <div class="spec-row">
                            <span>Pedido mínimo</span>
                            <strong>${p.minimumOrderQuantity || 1} unidades</strong>
                        </div>
                    </div>
                </section>
            </div>

            <!-- AVALIAÇÕES -->
            <section class="reviews">
                <h2>Avaliações (${reviews.length})</h2>

                <div class="reviews-grid">
                    ${tresReviews.length ? tresReviews.map(review => `
                        <article class="review-card">
                            <div class="review-header">
                                <div class="reviewer-avatar">
                                    ${review.reviewerName ? review.reviewerName.charAt(0).toUpperCase() : "U"}
                                </div>
                                <div>
                                    <div class="reviewer-name">${review.reviewerName}</div>
                                    <div class="stars">${estrelas(review.rating)}</div>
                                </div>
                                <span class="review-date">${formatarData(review.date)}</span>
                            </div>
                            <p class="review-comment">${review.comment}</p>
                        </article>
                    `).join("") : `
                        <div class="state">
                            <p>Este produto ainda não possui avaliações.</p>
                        </div>
                    `}
                </div>
            </section>

            <!-- PRODUTOS RELACIONADOS -->
            <section class="related-products" style="margin-bottom: 50px;">
                <h2 style="color: var(--primary); font-size: 19px; margin-bottom: 13px;">Produtos Relacionados</h2>
                <div id="relatedProductsGrid" class="products-grid">
                    <p style="color: var(--secondary);">Carregando recomendações...</p>
                </div>
            </section>
        </div>
    `;
}


/* =====================================================
   CARREGAR PRODUTOS RELACIONADOS
===================================================== */

async function carregarProdutosRelacionados(categoria, idAtual) {
    const gridContainer = document.getElementById("relatedProductsGrid");
    if (!gridContainer) return;

    try {
        const resposta = await fetch(`${API}/products/category/${encodeURIComponent(categoria)}?limit=5`);
        if (!resposta.ok) return;

        const dados = await resposta.json();
        
        const recomendados = (dados.products || []).filter(item => item.id !== idAtual).slice(0, 4);

        if (recomendados.length === 0) {
            gridContainer.parentElement.style.display = "none";
            return;
        }

        let cards = "";

        recomendados.forEach(produto => {
            const preco = precoFinal(produto);
            const cheio = precoCheio(produto);
            const desconto = Math.round(produto.discountPercentage);

            cards += `
                <article class="product-card">
                    <div class="product-image" onclick="abrirProduto(${produto.id})">
                        ${desconto >= 5 ? `<span class="discount-badge">-${desconto}%</span>` : ""}
                        <img src="${produto.thumbnail}" alt="${produto.title}" loading="lazy">
                    </div>

                    <div class="product-info">
                        <span class="product-category">${produto.category}</span>
                        <h3 class="product-title" onclick="abrirProduto(${produto.id})">
                            ${produto.title}
                        </h3>

                        <div class="rating">
                            <span class="stars">${estrelas(produto.rating)}</span>
                            <span class="rating-number">${produto.rating.toFixed(2)}</span>
                        </div>

                        <div class="old-price">${dinheiro.format(cheio)}</div>
                        <div class="final-price">${dinheiro.format(preco)}</div>

                        <button
                            class="add-button"
                            onclick='adicionarAoCarrinho(${JSON.stringify(produto).replace(/'/g, "&apos;")})'
                        >
                            Adicionar
                        </button>
                    </div>
                </article>
            `;
        });

        gridContainer.innerHTML = cards;

    } catch (erro) {
        if (gridContainer && gridContainer.parentElement) {
            gridContainer.parentElement.style.display = "none";
        }
    }
}


/* =====================================================
   TROCAR IMAGEM
===================================================== */

function trocarImagem(imagem, botao) {
    const principal = document.getElementById("mainProductImage");
    if (principal) principal.src = imagem;

    document.querySelectorAll(".thumbnail").forEach(item => {
        item.classList.remove("active");
    });

    botao.classList.add("active");
}


/* =====================================================
   QUANTIDADE DO DETALHE
===================================================== */

function alterarQuantidadeDetalhe(valor) {
    quantidadeDetalhe += valor;

    if (quantidadeDetalhe < 1) {
        quantidadeDetalhe = 1;
    }

    if (produtoDetalhe && quantidadeDetalhe > produtoDetalhe.stock) {
        quantidadeDetalhe = produtoDetalhe.stock;
    }

    const elemento = document.getElementById("detailQuantity");
    if (elemento) {
        elemento.textContent = quantidadeDetalhe;
    }
}


/* =====================================================
   ADICIONAR DETALHE
===================================================== */

function adicionarDetalheAoCarrinho() {
    adicionarAoCarrinho(produtoDetalhe, quantidadeDetalhe);
}


/* =====================================================
   FORMATAR DATA
===================================================== */

function formatarData(data) {
    if (!data) return "";
    const d = new Date(data);
    return d.toLocaleDateString("pt-BR");
}


/* =====================================================
   CARRINHO
===================================================== */

function renderCarrinho() {
    const app = document.getElementById("app");

    atualizarContadorCarrinho();

    if (carrinho.length === 0) {
        app.innerHTML = `
            <div class="container cart-page">
                <div class="cart-title-row">
                    <h1 class="cart-title">Seu carrinho</h1>
                </div>

                <div class="empty-cart">
                    <div class="empty-cart-icon">🛒</div>
                    <h2>Seu carrinho está vazio</h2>
                    <p>Adicione produtos para continuar comprando.</p>
                    <a href="#/">Continuar comprando</a>
                </div>
            </div>
        `;
        return;
    }

    let subtotal = 0;
    let descontos = 0;
    let quantidadeTotal = 0;

    carrinho.forEach(item => {
        const cheio = item.price * COTACAO;
        const final = precoFinal(item);

        subtotal += cheio * item.quantidade;
        descontos += (cheio - final) * item.quantidade;
        quantidadeTotal += item.quantidade;
    });

    const frete = 0;
    const total = subtotal - descontos + frete;

    let itensHTML = "";

    carrinho.forEach(item => {
        const final = precoFinal(item);
        const linha = final * item.quantidade;

        itensHTML += `
            <article class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.thumbnail}" alt="${item.title}">
                </div>

                <div>
                    <span class="cart-item-category">${item.category}</span>
                    <h3 class="cart-item-title">${item.title}</h3>
                    <span class="unit-price">${dinheiro.format(final)} cada</span>
                </div>

                <div class="cart-quantity">
                    <button onclick="alterarQuantidade(${item.id}, -1)">−</button>
                    <span>${item.quantidade}</span>
                    <button onclick="alterarQuantidade(${item.id}, 1)">+</button>
                </div>

                <div class="line-total">${dinheiro.format(linha)}</div>

                <button
                    class="remove-button"
                    onclick="removerDoCarrinho(${item.id})"
                    title="Remover"
                >
                    ×
                </button>
            </article>
        `;
    });

    app.innerHTML = `
        <div class="container cart-page">
            <div class="cart-title-row">
                <h1 class="cart-title">
                    Seu carrinho
                    <small>
                        ${new Set(carrinho.map(item => item.id)).size} produtos ·
                        ${quantidadeTotal} unidades
                    </small>
                </h1>

                <a href="#/" class="continue-shopping">
                    Continuar comprando ›
                </a>
            </div>

            <div class="cart-layout">
                <section class="cart-items">
                    ${itensHTML}
                </section>

                <aside class="order-summary">
                    <h2>Resumo do pedido</h2>

                    <div class="summary-row">
                        <span>Subtotal (${quantidadeTotal} itens)</span>
                        <span>${dinheiro.format(subtotal)}</span>
                    </div>

                    <div class="summary-row summary-discount">
                        <span>Descontos</span>
                        <span>- ${dinheiro.format(descontos)}</span>
                    </div>

                    <div class="summary-row summary-shipping">
                        <span>Frete</span>
                        <span>Grátis</span>
                    </div>

                    <div class="summary-total">
                        <span>Total</span>
                        <strong>${dinheiro.format(total)}</strong>
                    </div>

                    <p class="summary-installments">
                        em 12x de ${dinheiro.format(total / 12)}
                    </p>

                    <button class="checkout-button" onclick="finalizarCompra()">
                        Finalizar compra
                    </button>
                </aside>
            </div>
        </div>
    `;
}


/* =====================================================
   FINALIZAR COMPRA
===================================================== */

function finalizarCompra() {
    if (carrinho.length === 0) {
        mostrarToast("Seu carrinho está vazio.");
        return;
    }

    alert(
        "Compra finalizada com sucesso!\n\n" +
        "Esta é uma simulação acadêmica. " +
        "Nenhum pagamento real foi realizado."
    );

    carrinho = [];
    salvarCarrinho();
    renderCarrinho();
}


/* =====================================================
   404
===================================================== */

function render404() {
    const app = document.getElementById("app");

    app.innerHTML = `
        <div class="container">
            <div class="not-found">
                <h1>404</h1>
                <h2>Página não encontrada</h2>
                <p>O endereço que você tentou acessar não existe.</p>
                <button class="retry-button" onclick="window.location.hash='/'">
                    Voltar para a vitrine
                </button>
            </div>
        </div>
    `;
}


/* =====================================================
   MENU MOBILE
===================================================== */

function toggleMobileMenu() {
    const categories = document.querySelector(".category-bar");
    if (!categories) return;

    categories.classList.toggle("mobile-visible");
}


/* =====================================================
   ATUALIZAR AO VOLTAR NO NAVEGADOR
===================================================== */

window.addEventListener("popstate", () => {
    renderApp();
});


/* =====================================================
   ATUALIZAÇÃO FINAL
===================================================== */

atualizarContadorCarrinho();