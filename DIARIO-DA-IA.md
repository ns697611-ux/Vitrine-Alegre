Erro 1: Modificação direta do estado do React em vez do uso do setState.

Diagnóstico: A IA tentou fazer carrinho.push(produto) dentro de uma função.

Correção: Substituição por imutabilidade: setCarrinho([...carrinho, produto]).

Erro 2: Frequência excessiva de chamadas à API no campo de busca.

Diagnóstico: O efeito disparava a cada caractere digitado sem controle.

Correção: Implementação de um efeito com debounce de 400ms.

Erro 3: Desalinhamento nas rotas da Vercel ao recarregar a página.

Diagnóstico: Ausência do tratamento de roteamento do lado do servidor para SPA.

Correção: Adição do arquivo vercel.json com regra de rewrite.

Erro 4: Erro de chave única (key) na renderização de listas no React.

Diagnóstico: O componente mapeado utilizava o índice do array (index) em vez de um identificador único.

Correção: Utilização da propriedade produto.id retornada pela API.

Erro 5: Loop infinito no useEffect.

Diagnóstico: Objeto passado no array de dependências sem memorização (useMemo/useCallback).

Correção: Ajuste no array de dependências para monitorar apenas os valores primitivos necessários.
