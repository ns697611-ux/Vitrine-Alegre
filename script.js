import React, { useState, useEffect } from "react";

/* =====================================================
   UTILITÁRIOS E FORMATADORES
===================================================== */
const dinheiro = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function precoFinal(item) {
  if (item.discountPercentage) {
    return item.price * (1 - item.discountPercentage / 100);
  }
  return item.price;
}

function formatarData(dataIso) {
  if (!dataIso) return "";
  const data = new Date(dataIso);
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/* =====================================================
   COMPONENTE: DETALHE DO PRODUTO
===================================================== */
function DetalheProduto({ produto, adicionarAoCarrinho, navegar }) {
  const [quantidade, setQuantidade] = useState(1);
  const [imagemAtiva, setImagemAtiva] = useState(produto?.thumbnail || "");

  useEffect(() => {
    if (produto?.thumbnail) {
      setImagemAtiva(produto.thumbnail);
    }
  }, [produto]);

  if (!produto) return null;

  const alterarQuantidade = (valor) => {
    setQuantidade((prev) => Math.max(1, prev + valor));
  };

  const preco = precoFinal(produto);

  return (
    <div className="container">
      <div className="breadcrumb">
        <a href="#/" onClick={(e) => { e.preventDefault(); navegar("/"); }}>Início</a> ›{" "}
        <span className="product-category">{produto.category}</span> ›{" "}
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
          <h2>{produto.title}</h2>
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
    </div>
  );
}

/* =====================================================
   COMPONENTE: CARRINHO DE COMPRAS
===================================================== */
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
            <strong style={{ color: "#2e7d32" }}>Grátis</strong>
          </div>

          <hr className="detail-divider" />

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

/* =====================================================
   PÁGINAS AUXILIARES (SUCESSO E 404)
===================================================== */
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

/* =====================================================
   COMPONENTE PRINCIPAL (APP)
===================================================== */
export default function App() {
  const [rota, setRota] = useState("/");
  const [produtoDetalheId, setProdutoDetalheId] = useState(null);
  const [produtoDetalhe, setProdutoDetalhe] = useState(null);

  // Inicializa o carrinho com dados do localStorage
  const [carrinho, setCarrinho] = useState(() => {
    const salvo = localStorage.getItem("carrinho");
    return salvo ? JSON.parse(salvo) : [];
  });

  // Salva no localStorage sempre que o carrinho muda
  useEffect(() => {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
  }, [carrinho]);

  const navegar = (novaRota) => {
    setRota(novaRota);
  };

  const abrirProduto = (id) => {
    setProdutoDetalheId(id);
    // Exemplo simulado de busca de produto. Substitua por um fetch real caso necessário:
    // fetch(`https://dummyjson.com/products/${id}`).then(res => res.json()).then(data => setProdutoDetalhe(data));
    navegar("/produto");
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
    navegar("/carrinho");
  };

  return (
    <div id="app">
      <header className="header">
        <h1 onClick={() => navegar("/")} style={{ cursor: "pointer" }}>
          Vitrine Alegre
        </h1>
        <button className="cart-badge" onClick={() => navegar("/carrinho")}>
          🛒 {carrinho.reduce((acc, i) => acc + i.quantidade, 0)}
        </button>
      </header>

      {/* Roteamento simples via estado */}
      {rota === "/" && (
        <div className="container">
          <h2>Página Inicial</h2>
          <p>Selecione um produto ou acesse seu carrinho.</p>
          <button className="buy-button" onClick={() => navegar("/carrinho")}>
            Ver Carrinho
          </button>
        </div>
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
          navegar={navegar}
        />
      )}

      {rota === "/sucesso" && <Sucesso navegar={navegar} />}

      {["/", "/carrinho", "/produto", "/sucesso"].includes(rota) === false && (
        <NotFound navegar={navegar} />
      )}
    </div>
  );
}
