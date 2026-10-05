const { useState, useEffect } = React;

// =====================================================
// UTILITÁRIOS E FORMATADORES
// =====================================================
const dinheiro = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function precoFinal(item) {
  if (item && item.discountPercentage) {
    return item.price * (1 - item.discountPercentage / 100);
  }
  return item ? item.price : 0;
}

// =====================================================
// COMPONENTE: NOTIFICAÇÃO TOAST
// =====================================================
function Toast({ mensagem }) {
  if (!mensagem) return null;
  return (
    <div className="toast">
      <span>✅</span> {mensagem}
    </div>
  );
}

// =====================================================
// COMPONENTE: CARD DO PRODUTO (REUTILIZÁVEL)
// =====================================================
function CardProduto({ prod, abrirProduto, adicionarAoCarrinho, alternarFavorito, eFavorito }) {
  const preco = precoFinal(prod);
  const isFav = eFavorito(prod.id);

  return (
    <div className="product-card" style={{ position: "relative" }}>
      <button
        className={`fav-button ${isFav ? "active" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          alternarFavorito(prod);
        }}
        title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      >
        {isFav ? "❤️" : "🤍"}
      </button>

      <div onClick={() => abrirProduto(prod.id)} style={{ cursor: "pointer" }}>
        <img src={prod.thumbnail} alt={prod.title} />
        <span className="product-category">{prod.category}</span>
        <h3>{prod.title}</h3>
        <div className="product-price">{dinheiro.format(preco)}</div>
      </div>
      
      <button
        className="buy-button"
        onClick={(e) => {
          e.stopPropagation();
          adicionarAoCarrinho(prod, 1);
        }}
      >
        Adicionar ao Carrinho
      </button>
    </div>
  );
}

// =====================================================
// COMPONENTE: VITRINE / LISTA DE PRODUTOS
// =====================================================
function Vitrine({
  produtos,
  carregando,
  erro,
  abrirProduto,
  adicionarAoCarrinho,
  alternarFavorito,
  eFavorito,
  categoriaAtiva,
  setCategoriaAtiva,
  categorias,
  setBusca
}) {
  if (carregando) {
    return (
      <div className="container">
        <div className="state">
          <div className="state-icon">⏳</div>
          <h2>Carregando produtos...</h2>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="container">
        <div className="state">
          <div className="state-icon">⚠️</div>
          <h2>Erro ao carregar produtos</h2>
          <p>{erro}</p>
        </div>
      </div>
    );
  }

  const selecionarCategoria = (slug) => {
    setCategoriaAtiva(slug);
    setBusca("");
    const inputBusca = document.getElementById("searchInput");
    if (inputBusca) inputBusca.value = "";
  };

  return (
    <div className="container">
      {/* Barra de Categorias */}
      {categorias.length > 0 && (
        <div className="categories-bar">
          <button
            className={`category-chip ${categoriaAtiva === "" ? "active" : ""}`}
            onClick={() => selecionarCategoria("")}
          >
            Todas
          </button>
          {categorias.map((cat) => {
            const slug = typeof cat === "object" ? cat.slug : cat;
            const nome = typeof cat === "object" ? cat.name : cat;
            return (
              <button
                key={slug}
                className={`category-chip ${categoriaAtiva === slug ? "active" : ""}`}
                onClick={() => selecionarCategoria(slug)}
              >
                {nome}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid de Produtos */}
      {produtos.length === 0 ? (
        <div className="state">
          <div className="state-icon">🔍</div>
          <h2>Nenhum produto encontrado</h2>
          <p>Tente buscar por outro termo ou selecione uma categoria diferente.</p>
        </div>
      ) : (
        <div className="products-grid">
          {produtos.map((prod) => (
            <CardProduto
              key={prod.id}
              prod={prod}
              abrirProduto={abrirProduto}
              adicionarAoCarrinho={adicionarAoCarrinho}
              alternarFavorito={alternarFavorito}
              eFavorito={eFavorito}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// COMPONENTE: PÁGINA DE FAVORITOS
// =====================================================
function Favoritos({ favoritos, abrirProduto, adicionarAoCarrinho, alternarFavorito, eFavorito, navegar }) {
  if (favoritos.length === 0) {
    return (
      <div className="container">
        <div className="breadcrumb">
          <a href="#/" onClick={(e) => { e.preventDefault(); navegar("/"); }}>Início</a> › Favoritos
        </div>
        <div className="state">
          <div className="state-icon">❤️</div>
          <h2>Sua lista de favoritos está vazia</h2>
          <p>Explore nossos produtos e marque seus itens preferidos!</p>
          <button className="retry-button" onClick={() => navegar("/")}>
            Ver Produtos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="breadcrumb">
        <a href="#/" onClick={(e) => { e.preventDefault(); navegar("/"); }}>Início</a> › <strong>Meus Favoritos ({favoritos.length})</strong>
      </div>

      <div className="products-grid">
        {favoritos.map((prod) => (
          <CardProduto
            key={prod.id}
            prod={prod}
            abrirProduto={abrirProduto}
            adicionarAoCarrinho={adicionarAoCarrinho}
            alternarFavorito={alternarFavorito}
            eFavorito={eFavorito}
          />
        ))}
      </div>
    </div>
  );
}

// =====================================================
// COMPONENTE: DETALHE DO PRODUTO
// =====================================================
function DetalheProduto({ produto, adicionarAoCarrinho, alternarFavorito, eFavorito, navegar, abrirProduto }) {
  const [quantidade, setQuantidade] = useState(1);
  const [imagemAtiva, setImagemAtiva] = useState(produto?.thumbnail || "");
  const [relacionados, setRelacionados] = useState([]);

  useEffect(() => {
    if (produto?.thumbnail) {
      setImagemAtiva(produto.thumbnail);
      setQuantidade(1);
    }

    if (produto?.category) {
      fetch(`https://dummyjson.com/products/category/${produto.category}`)
        .then((res) => res.json())
        .then((data) => {
          const filtrados = (data.products || []).filter((item) => item.id !== produto.id);
          setRelacionados(filtrados.slice(0, 4));
        })
        .catch((err) => console.error("Erro ao carregar produtos relacionados:", err));
    }
  }, [produto]);

  if (!produto) return null;

  const alterarQuantidade = (valor) => {
    setQuantidade((prev) => Math.max(1, prev + valor));
  };

  const preco = precoFinal(produto);
  const isFav = eFavorito(produto.id);

  return (
    <div className="container">
      <div className="breadcrumb">
        <a href="#/" onClick={(e) => { e.preventDefault(); navegar("/"); }}>Início</a> ›{" "}
        <span className="product-category" style={{ display: "inline" }}>{produto.category}</span> ›{" "}
        <strong>{produto.title}</strong>
      </div>

      <div className="product-detail-layout">
        <div className="product-gallery">
          <img src={imagemAtiva} alt={produto.title} className="main-image" />
          <div className="thumbnail-list">
            {produto.images?.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt=""
                className={`thumbnail-item ${imagemAtiva === img ? "active" : ""}`}
                onClick={() => setImagemAtiva(img)}
              />
            ))}
          </div>
        </div>

        <div className="product-info-detail">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>{produto.title}</h2>
            <button
              className={`fav-button ${isFav ? "active" : ""}`}
              onClick={() => alternarFavorito(produto)}
              style={{ position: "static" }}
            >
              {isFav ? "❤️" : "🤍"}
            </button>
          </div>
          <p className="description">{produto.description}</p>
          <div className="price-tag">{dinheiro.format(preco)}</div>

          <div className="detail-actions">
            <div className="quantity">
              <button onClick={() => alterarQuantidade(-1)}>−</button>
              <span>{quantidade}</span>
              <button onClick={() => alterarQuantidade(1)}>+</button>
            </div>
            <button
              className="buy-button"
              onClick={() => adicionarAoCarrinho(produto, quantidade)}
            >
              Adicionar ao Carrinho
            </button>
          </div>
        </div>
      </div>

      {relacionados.length > 0 && (
        <div style={{ marginTop: "50px", marginBottom: "30px" }}>
          <h2 style={{ color: "var(--primary)", fontSize: "22px", marginBottom: "20px" }}>
            Quem viu este produto também se interessou por:
          </h2>
          <div className="products-grid">
            {relacionados.map((rel) => (
              <CardProduto
                key={rel.id}
                prod={rel}
                abrirProduto={abrirProduto}
                adicionarAoCarrinho={adicionarAoCarrinho}
                alternarFavorito={alternarFavorito}
                eFavorito={eFavorito}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// COMPONENTE: CARRINHO DE COMPRAS
// =====================================================
function Carrinho({ carrinho, setCarrinho, navegar, abrirProduto }) {
  const alterarQuantidade = (id, valor) => {
    setCarrinho((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const novaQtd = item.quantidade + valor;
          return novaQtd > 0 ? { ...item, quantidade: novaQtd } : item;
        }
        return item;
      })
    );
  };

  const removerDoCarrinho = (id) => {
    setCarrinho((prev) => prev.filter((item) => item.id !== id));
  };

  const finalizarCompra = () => {
    setCarrinho([]);
    navegar("/sucesso");
  };

  if (carrinho.length === 0) {
    return (
      <div className="container">
        <div className="breadcrumb">
          <a href="#/" onClick={(e) => { e.preventDefault(); navegar("/"); }}>Início</a> › Carrinho
        </div>
        <div className="state">
          <div className="state-icon">🛒</div>
          <h2>Seu carrinho está vazio</h2>
          <p>Navegue pela loja e adicione alguns produtos!</p>
          <button className="retry-button" onClick={() => navegar("/")}>
            Ir às compras
          </button>
        </div>
      </div>
    );
  }

  const subtotal = carrinho.reduce(
    (acc, item) => acc + precoFinal(item) * item.quantidade,
    0
  );

  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <div className="container">
      <div className="breadcrumb">
        <a href="#/" onClick={(e) => { e.preventDefault(); navegar("/"); }}>Início</a> › <strong>Carrinho</strong>
      </div>

      <div className="cart-layout">
        <div className="cart-items-list">
          <h2>Itens no Carrinho ({totalItens})</h2>
          {carrinho.map((item) => {
            const preco = precoFinal(item);
            const totalItem = preco * item.quantidade;

            return (
              <div key={item.id} className="cart-item">
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="cart-item-image"
                />

                <div className="cart-item-info">
                  <span className="product-category">{item.category}</span>
                  <h3
                    className="cart-item-title"
                    onClick={() => abrirProduto(item.id)}
                  >
                    {item.title}
                  </h3>
                  <div className="cart-item-price">
                    {dinheiro.format(preco)} un.
                  </div>
                </div>

                <div className="quantity">
                  <button onClick={() => alterarQuantidade(item.id, -1)}>
                    −
                  </button>
                  <span>{item.quantidade}</span>
                  <button onClick={() => alterarQuantidade(item.id, 1)}>
                    +
                  </button>
                </div>

                <div className="cart-item-total">
                  {dinheiro.format(totalItem)}
                </div>

                <button
                  className="remove-button"
                  onClick={() => removerDoCarrinho(item.id)}
                  title="Remover produto"
                >
                  🗑️
                </button>
              </div>
            );
          })}
        </div>

        <aside className="cart-summary">
          <h2>Resumo do Pedido</h2>

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{dinheiro.format(subtotal)}</strong>
          </div>

          <div className="summary-row">
            <span>Frete</span>
            <strong style={{ color: "var(--success)" }}>Grátis</strong>
          </div>

          <div className="summary-row total">
            <span>Total</span>
            <strong>{dinheiro.format(subtotal)}</strong>
          </div>

          <button className="buy-button" onClick={finalizarCompra}>
            Finalizar Compra
          </button>

          <button className="continue-button" onClick={() => navegar("/")}>
            Continuar Comprando
          </button>
        </aside>
      </div>
    </div>
  );
}

// =====================================================
// PÁGINAS AUXILIARES
// =====================================================
function Sucesso({ navegar }) {
  return (
    <div className="container">
      <div className="state">
        <div className="state-icon">🎉</div>
        <h2>Compra realizada com sucesso!</h2>
        <p>Obrigado por comprar na Vitrine Alegre.</p>
        <button className="retry-button" onClick={() => navegar("/")}>
          Voltar para a página inicial
        </button>
      </div>
    </div>
  );
}

function NotFound({ navegar }) {
  return (
    <div className="container">
      <div className="state">
        <div className="state-icon">404</div>
        <h2>Página não encontrada</h2>
        <p>A rota que você tentou acessar não existe.</p>
        <button className="retry-button" onClick={() => navegar("/")}>
          Voltar ao início
        </button>
      </div>
    </div>
  );
}

// =====================================================
// COMPONENTE PRINCIPAL (APP)
// =====================================================
function App() {
  const [rota, setRota] = useState("/");
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState("");
  const [busca, setBusca] = useState("");
  const [produtoDetalhe, setProdutoDetalhe] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

  // Estado do Carrinho persistido no localStorage
  const [carrinho, setCarrinho] = useState(() => {
    const salvo = localStorage.getItem("carrinho");
    return salvo ? JSON.parse(salvo) : [];
  });

  // Estado dos Favoritos persistido no localStorage
  const [favoritos, setFavoritos] = useState(() => {
    const salvo = localStorage.getItem("favoritos");
    return salvo ? JSON.parse(salvo) : [];
  });

  const mostrarToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg("");
    }, 3000);
  };

  // Sincronizar Carrinho
  useEffect(() => {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    const cartCountEl = document.getElementById("cartCount");
    if (cartCountEl) {
      cartCountEl.textContent = carrinho.reduce((acc, i) => acc + i.quantidade, 0);
    }
  }, [carrinho]);

  // Sincronizar Favoritos
  useEffect(() => {
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    const favCountEl = document.getElementById("favCount");
    if (favCountEl) {
      favCountEl.textContent = favoritos.length;
    }
  }, [favoritos]);

  // Alternar Favorito
  const alternarFavorito = (produto) => {
    setFavoritos((prev) => {
      const existe = prev.some((item) => item.id === produto.id);
      if (existe) {
        mostrarToast(`"${produto.title}" removido dos favoritos.`);
        return prev.filter((item) => item.id !== produto.id);
      } else {
        mostrarToast(`"${produto.title}" adicionado aos favoritos!`);
        return [...prev, produto];
      }
    });
  };

  const eFavorito = (id) => favoritos.some((item) => item.id === id);

  // Carregar Categorias
  useEffect(() => {
    fetch("https://dummyjson.com/products/categories")
      .then((res) => res.json())
      .then((data) => setCategorias(data))
      .catch((err) => console.error("Erro ao carregar categorias:", err));
  }, []);

  // Carregar Produtos da API
  useEffect(() => {
    setCarregando(true);
    let url = "https://dummyjson.com/products";

    if (busca.trim() !== "") {
      url = `https://dummyjson.com/products/search?q=${encodeURIComponent(busca)}`;
    } else if (categoriaAtiva !== "") {
      url = `https://dummyjson.com/products/category/${categoriaAtiva}`;
    }

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao buscar produtos");
        return res.json();
      })
      .then((data) => {
        setProdutos(data.products || []);
        setCarregando(false);
      })
      .catch((err) => {
        setErro(err.message);
        setCarregando(false);
      });
  }, [busca, categoriaAtiva]);

  // Sincronizar busca do HTML
  useEffect(() => {
    const inputBusca = document.getElementById("searchInput");
    if (inputBusca) {
      const handleInput = (e) => {
        setBusca(e.target.value);
        if (categoriaAtiva !== "") setCategoriaAtiva("");
        if (rota !== "/") setRota("/");
      };
      inputBusca.addEventListener("input", handleInput);
      return () => inputBusca.removeEventListener("input", handleInput);
    }
  }, [rota, categoriaAtiva]);

  const navegar = (novaRota) => {
    setRota(novaRota);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.navegar = navegar;

  const abrirProduto = (id) => {
    setCarregando(true);
    fetch(`https://dummyjson.com/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProdutoDetalhe(data);
        setCarregando(false);
        navegar("/produto");
      })
      .catch((err) => {
        console.error("Erro ao buscar detalhes do produto:", err);
        setCarregando(false);
      });
  };

  const adicionarAoCarrinho = (produto, quantidade) => {
    setCarrinho((prev) => {
      const existe = prev.find((item) => item.id === produto.id);
      if (existe) {
        return prev.map((item) =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item
        );
      }
      return [...prev, { ...produto, quantidade }];
    });

    mostrarToast(`"${produto.title}" foi adicionado ao carrinho!`);
  };

  return (
    <>
      <Toast mensagem={toastMsg} />

      {rota === "/" && (
        <Vitrine
          produtos={produtos}
          carregando={carregando}
          erro={erro}
          abrirProduto={abrirProduto}
          adicionarAoCarrinho={adicionarAoCarrinho}
          alternarFavorito={alternarFavorito}
          eFavorito={eFavorito}
          categoriaAtiva={categoriaAtiva}
          setCategoriaAtiva={setCategoriaAtiva}
          categorias={categorias}
          setBusca={setBusca}
        />
      )}

      {rota === "/favoritos" && (
        <Favoritos
          favoritos={favoritos}
          abrirProduto={abrirProduto}
          adicionarAoCarrinho={adicionarAoCarrinho}
          alternarFavorito={alternarFavorito}
          eFavorito={eFavorito}
          navegar={navegar}
        />
      )}

      {rota === "/carrinho" && (
        <Carrinho
          carrinho={carrinho}
          setCarrinho={setCarrinho}
          navegar={navegar}
          abrirProduto={abrirProduto}
        />
      )}

      {rota === "/produto" && (
        <DetalheProduto
          produto={produtoDetalhe}
          adicionarAoCarrinho={adicionarAoCarrinho}
          alternarFavorito={alternarFavorito}
          eFavorito={eFavorito}
          navegar={navegar}
          abrirProduto={abrirProduto}
        />
      )}

      {rota === "/sucesso" && <Sucesso navegar={navegar} />}

      {!["/", "/favoritos", "/carrinho", "/produto", "/sucesso"].includes(rota) && (
        <NotFound navegar={navegar} />
      )}
    </>
  );
}

// Menu Mobile Global
window.toggleMobileMenu = function () {
  const headerActions = document.querySelector(".header-actions");
  if (headerActions) {
    headerActions.classList.toggle("mobile-open");
  }
};

// Renderizar React
const rootElement = document.getElementById("app");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
}