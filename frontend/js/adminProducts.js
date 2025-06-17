let produtos = [];

function getToken() {
  return localStorage.getItem("token"); // Ajuste conforme sua implementação
}

function carregarProdutos() {
  const token = getToken();
  if (!token) {
    alert("Você precisa estar logado como administrador.");
    window.location.href = "../html/login.html";
    return;
  }

  fetch(`${API_URL}/produtos/admin`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((text) => {
          throw new Error(`Erro ${response.status}: ${text}`);
        });
      }
      return response.json();
    })
    .then((data) => {
      produtos = data;
      renderizarProdutos(produtos);
    })
    .catch((error) => {
      console.error("Erro ao carregar produtos:", error);
      document.getElementById(
        "container-itens"
      ).innerHTML = `<p>Erro ao carregar produtos: ${error.message}</p>`;
    });
}

function renderizarProdutos(lista) {
  const termoBusca = document
    .getElementById("busca-produto")
    .value.toLowerCase();
  const categoriaSelecionada =
    document.getElementById("filtro-categoria").value;
  const statusSelecionado = document.getElementById(
    "filtro-status-produto"
  ).value;

  const produtosFiltrados = lista.filter((produto) => {
    const nomeIncluiTermo = produto.titulo.toLowerCase().includes(termoBusca);
    const categoriaCorreta = categoriaSelecionada
      ? produto.categoria === categoriaSelecionada
      : true;
    const statusCorreto =
      statusSelecionado === ""
        ? true
        : produto.ativo === parseInt(statusSelecionado);
    return nomeIncluiTermo && categoriaCorreta && statusCorreto;
  });

  const containerItens = document.getElementById("container-itens");
  containerItens.innerHTML = "";
  const fragment = document.createDocumentFragment();

  produtosFiltrados.forEach((produto) => {
    const item = document.createElement("div");
    item.classList.add("item");
    item.setAttribute("data-produto-id", produto.produto_id);
    const precoFormatado = parseFloat(produto.preco)
      .toFixed(2)
      .replace(".", ",");

    item.innerHTML = `
  <span class="titulo-item">${produto.titulo}</span>
  <img src="/Uploads/${produto.imagem}" alt="${
      produto.titulo
    }" class="img-item">
  <span class="preco-item">R$ ${precoFormatado}</span>
  <span class="status-item">${produto.ativo ? "Ativo" : "Desativado"}</span>
  <button class="botao-item-alterar">Alterar</button>
  <button class="botao-item-status ${
    produto.ativo ? "botao-ativo" : "botao-inativo"
  }">
    ${produto.ativo ? "Desativar" : "Ativar"}
  </button>
`;

    item
      .querySelector(".botao-item-alterar")
      .addEventListener("click", () => editarProduto(produto));
    item
      .querySelector(".botao-item-status")
      .addEventListener("click", () =>
        alterarStatusProduto(produto.produto_id, produto.ativo)
      );
    fragment.appendChild(item);
  });

  containerItens.appendChild(fragment);
}

function filtrarProdutos() {
  renderizarProdutos(produtos);
}

function alterarStatusProduto(id, ativo) {
  const token = getToken();
  if (!token) {
    alert("Você precisa estar logado.");
    return;
  }

  if (
    confirm(
      `Tem certeza que deseja ${ativo ? "desativar" : "ativar"} este produto?`
    )
  ) {
    fetch(`${API_URL}/produtos/${id}/status`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ativo: ativo ? 0 : 1 }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => {
            throw new Error(
              err.message || `Erro ${response.status}: ${response.statusText}`
            );
          });
        }
        return response.json();
      })
      .then((data) => {
        alert(
          data.message ||
            `Produto ${ativo ? "desativado" : "ativado"} com sucesso!`
        );
        carregarProdutos();
      })
      .catch((error) => {
        console.error("Erro ao alterar status do produto:", error);
        alert(`Erro ao alterar status do produto: ${error.message}`);
      });
  }
}

function adicionarProduto(event) {
  event.preventDefault();
  const token = getToken();
  if (!token) {
    alert("Você precisa estar logado.");
    window.location.href = "../html/login.html";
    return;
  }

  const formData = new FormData();
  formData.append("titulo", document.getElementById("titulo").value.trim());
  formData.append("preco", document.getElementById("preco").value);
  formData.append("categoria", document.getElementById("categoria").value);
  formData.append("imagem", document.getElementById("imagem").files[0]);

  fetch(`${API_URL}/produtos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
    .then((response) => {
      if (!response.ok) throw new Error("Erro ao cadastrar produto");
      return response.json();
    })
    .then(() => {
      alert("Produto cadastrado com sucesso!");
      document.getElementById("form-adicionar-produto").reset();
      carregarProdutos();
    })
    .catch((error) => {
      console.error("Erro ao cadastrar produto:", error);
      alert("Erro ao cadastrar produto.");
    });
}

function editarProduto(produto) {
  const modal = document.createElement("div");
  modal.classList.add("modal");
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Alterar Produto</h2>
      <label>Nome do Produto:</label>
      <input type="text" id="novoTitulo" value="${produto.titulo}" required>
      <label>Preço:</label>
      <input type="number" id="novoPreco" step="0.01" value="${
        produto.preco
      }" required>
      <label>Imagem:</label>
      <input type="file" id="novaImagem">
      <label>Categoria:</label>
      <select id="novaCategoria">
        <option value="">Selecione a categoria</option>
        <option value="bebidas" ${
          produto.categoria === "bebidas" ? "selected" : ""
        }>Bebidas</option>
        <option value="alimentos" ${
          produto.categoria === "alimentos" ? "selected" : ""
        }>Alimentos</option>
        <option value="outros" ${
          produto.categoria === "outros" ? "selected" : ""
        }>Outros</option>
      </select>
      <button class="salvarAlteracao" id="salvarAlteracao">Salvar</button>
      <button class="cancelarAlteracao" id="cancelarAlteracao">Cancelar</button>
    </div>
  `;

  document.body.appendChild(modal);
  document
    .getElementById("salvarAlteracao")
    .addEventListener("click", () =>
      salvarAlteracaoProduto(produto.produto_id, modal)
    );
  document
    .getElementById("cancelarAlteracao")
    .addEventListener("click", () => fecharModal(modal));
}

function salvarAlteracaoProduto(id, modal) {
  const token = getToken();
  const formData = new FormData();
  formData.append("titulo", document.getElementById("novoTitulo").value);
  formData.append("preco", document.getElementById("novoPreco").value);
  formData.append("categoria", document.getElementById("novaCategoria").value);
  const novaImagem = document.getElementById("novaImagem").files[0];
  if (novaImagem) formData.append("imagem", novaImagem);

  fetch(`${API_URL}/produtos/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
    .then((response) => {
      if (!response.ok) throw new Error("Erro ao atualizar produto");
      return response.json();
    })
    .then(() => {
      alert("Produto atualizado com sucesso!");
      fecharModal(modal);
      carregarProdutos();
    })
    .catch((error) => {
      console.error("Erro ao atualizar produto:", error);
      alert("Erro ao atualizar produto.");
    });
}

function fecharModal(modal) {
  document.body.removeChild(modal);
}

document.addEventListener("DOMContentLoaded", () => {
  carregarProdutos();

  const buscaProduto = document.getElementById("busca-produto");
  if (buscaProduto) {
    buscaProduto.addEventListener("input", () => {
      filtrarProdutos();
    });
  } else {
    console.error("Elemento busca-produto não encontrado");
  }

  const filtroCategoria = document.getElementById("filtro-categoria");
  if (filtroCategoria) {
    filtroCategoria.addEventListener("change", () => {
      filtrarProdutos();
    });
  } else {
    console.error("Elemento filtro-categoria não encontrado");
  }

  const filtroStatus = document.getElementById("filtro-status-produto");
  if (filtroStatus) {
    filtroStatus.addEventListener("change", () => {
      filtrarProdutos();
    });
  } else {
    console.error("Elemento filtro-status-produto não encontrado");
  }

  const formAdicionar = document.getElementById("form-adicionar-produto");
  if (formAdicionar) {
    formAdicionar.addEventListener("submit", adicionarProduto);
  } else {
    console.error("Elemento form-adicionar-produto não encontrado");
  }
});
