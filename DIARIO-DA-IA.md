# DIARIO-DA-IA.md — Registro de Erros e Correções


---

### 1. Mutação Direta do Estado no Carrinho
* **O que a IA sugeriu:** Fazer `carrinho.push(novoItem)` para adicionar um produto.
* **Diagnóstico:** No React, o estado é imutável. Alterar o array diretamente não dispara a re-renderização da tela.
* **Correção:** Usar a sintaxe de espalhamento com imutabilidade: `setCarrinho([...carrinho, novoItem])`.

---

### 2. Requisições Excessivas na Busca (Sem Debounce)
* **O que a IA sugeriu:** Disparar o `fetch` da API a cada tecla digitada no campo de busca.
* **Diagnóstico:** Disparava dezenas de requisições desnecessárias para a API pública em poucos segundos, gerando lentidão.
* **Correção:** Criar um temporizador (`setTimeout`) com limite de 400ms para aguardar o usuário parar de digitar antes de buscar.

---

### 3. Erro 404 ao Recarregar Rotas Internas na Vercel (F5)
* **O que a IA sugeriu:** Apenas subir a aplicação para a Vercel com as rotas do `react-router-dom`.
* **Diagnóstico:** Ao dar F5 em `/produtos/1`, o servidor da Vercel procurava um arquivo físico e retornava erro 404 por se tratar de uma SPA.
* **Correção:** Criar o arquivo `vercel.json` na raiz configurando o *rewrite* para `index.html`.

---

### 4. Warning de Key Ausente na Listagem
* **O que a IA sugeriu:** Usar o índice do array (`index`) na propriedade `key` dos componentes salvos no `.map()`.
* **Diagnóstico:** Usar o índice causa bugs de renderização caso a ordem dos produtos mude com filtros ou ordenação.
* **Correção:** Substituir o `index` pelo ID único que vem da API (`produto.id`).

---

### 5. Loop Infinito no useEffect
* **O que a IA sugeriu:** Passar um objeto de filtros diretamente no array de dependências do `useEffect`.
* **Diagnóstico:** Como objetos mudam de referência a cada renderização, o `useEffect` entrava em loop infinito de buscas.
* **Correção:** Passar apenas valores primitivos (como a string da busca e o ID da categoria) no array de dependências.