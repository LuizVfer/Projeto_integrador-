const API_URL = 'http://localhost:3000';
var carrinhoVisivel = false;
let produtos = [];
let currentPage = 1;

function getProductsPerPage() {
  return window.innerWidth > 850 ? 12 : 8; // 12 produtos para telas grandes, 8 para telas menores
}

document.addEventListener('DOMContentLoaded', ready);

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function showToast(message, type = 'error') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    console.error('Contêiner de toast não encontrado.');
    return;
  }
  const toast = document.createElement('div');
  toast.classList.add('toast', type);
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function atualizarStatusLoja() {
  fetch(`${API_URL}/api/status-loja`)
    .then(response => {
      if (!response.ok) throw new Error(`Erro ao obter status da loja: ${response.status}`);
      return response.json();
    })
    .then(data => {
      const statusElement = document.getElementById('status');
      const horarioElement = document.getElementById('horario');
      horarioElement.textContent = `Horário de Funcionamento: ${data.horario.abertura} - ${data.horario.fechamento}`;
      statusElement.textContent = data.aberto ? 'Aberto' : 'Fechado';
      statusElement.style.color = data.aberto ? '#00ff00' : '#ff0000';
      controlarInteracoesCarrinho(data.aberto);
    })
    .catch(error => {
      console.error('Erro ao obter status da loja:', error);
      const statusElement = document.getElementById('status');
      statusElement.textContent = 'Erro ao verificar';
      statusElement.style.color = '#ff0000';
      controlarInteracoesCarrinho(false);
    });
}

function controlarInteracoesCarrinho(estaAberto) {
  const botoesCarrinho = document.querySelectorAll('.botao-item');
  const btnPagar = document.querySelector('.btn-pagar');
  const mensagemCarrinho = document.getElementById('mensagem-carrinho');

  if (!estaAberto) {
    botoesCarrinho.forEach(botao => {
      botao.disabled = true;
      botao.style.opacity = '0.5';
      botao.style.cursor = 'not-allowed';
    });
    if (btnPagar) {
      btnPagar.disabled = true;
      btnPagar.style.opacity = '0.5';
      btnPagar.style.cursor = 'not-allowed';
    }
    if (!mensagemCarrinho) {
      const mensagem = document.createElement('p');
      mensagem.id = 'mensagem-carrinho';
      mensagem.textContent = 'A loja está fechada. Não é possível adicionar itens ao carrinho ou finalizar pedidos.';
      mensagem.style.color = '#ff0000';
      mensagem.style.fontWeight = 'bold';
      document.querySelector('.container-itens').appendChild(mensagem);
    }
  } else {
    botoesCarrinho.forEach(botao => {
      botao.disabled = false;
      botao.style.opacity = '1';
      botao.style.cursor = 'pointer';
    });
    if (btnPagar) {
      btnPagar.disabled = false;
      btnPagar.style.opacity = '1';
      btnPagar.style.cursor = 'pointer';
    }
    if (mensagemCarrinho) {
      mensagemCarrinho.remove();
    }
  }
}

function ready() {
  setupMenu();
  const btnPagar = document.querySelector('.btn-pagar');
  if (btnPagar) {
    btnPagar.addEventListener('click', pagarClicked);
  } else {
    console.error('Botão de pagar não encontrado.');
  }
  const buscaInput = document.getElementById('busca-produto');
  const filtroSelect = document.getElementById('filtro-categoria');
  const btnBuscar = document.getElementById('btn-buscar');

  if (buscaInput && filtroSelect && btnBuscar) {
    btnBuscar.addEventListener('click', filtrarProdutos);
    buscaInput.addEventListener('input', debounce(filtrarProdutos, 300));
    filtroSelect.addEventListener('change', filtrarProdutos);
  } else {
    console.error('Campos de busca ou botão de busca não encontrados.');
  }
  carregarProdutos();
  carregarCarrinhoDoLocalStorage();
  displayUserGreeting();
  verificarAdmin();
  atualizarStatusLoja();
  setInterval(atualizarStatusLoja, 60000);
  setupMobileCart();
  window.addEventListener('resize', () => {
    currentPage = 1; // Reseta para a primeira página ao redimensionar
    renderizarProdutos(produtos);
    setupPagination();
  });
}

function setupMobileCart() {
  const mobileCartToggle = document.getElementById('mobile-cart-toggle');
  const carrinho = document.querySelector('.carrinho');
  if (!mobileCartToggle || !carrinho) {
    console.error('Botão de carrinho móvel ou carrinho não encontrado.');
    return;
  }

  const overlay = document.createElement('div');
  overlay.classList.add('carrinho-overlay');
  document.body.appendChild(overlay);

  mobileCartToggle.addEventListener('click', () => {
    carrinho.classList.add('active');
    overlay.classList.add('active');
    carrinhoVisivel = true;
  });

  overlay.addEventListener('click', () => {
    carrinho.classList.remove('active');
    overlay.classList.remove('active');
    carrinhoVisivel = false;
  });

  const headerCarrinho = carrinho.querySelector('.header-carrinho');
  if (headerCarrinho) {
    const closeButton = document.createElement('button');
    closeButton.classList.add('close-cart');
    closeButton.innerHTML = '<i class="fa-solid fa-times"></i>';
    headerCarrinho.appendChild(closeButton);
    closeButton.addEventListener('click', () => {
      carrinho.classList.remove('active');
      overlay.classList.remove('active');
      carrinhoVisivel = false;
    });
  }

  atualizarBadgeCarrinho();
}

function atualizarBadgeCarrinho() {
  const badge = document.querySelector('.cart-badge');
  if (!badge) return;
  const carrinhoItens = document.querySelectorAll('.carrinho-item');
  const totalItens = Array.from(carrinhoItens).reduce((sum, item) => {
    return sum + parseInt(item.querySelector('.carrinho-item-quantidade').value);
  }, 0);
  badge.textContent = totalItens;
}

function setupMenu() {
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const menuLinks = sidebar.querySelectorAll('a[data-section]');

  if (menuToggle && sidebar && overlay) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }

  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.getAttribute('data-section');
      menuLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      if (section === 'catalogo') {
        window.location.href = './catalogo.html';
      } else if (section === 'perfil') {
        window.location.href = './perfil.html';
      } else if (section === 'pedidos') {
        window.location.href = './pedidos.html';
      } else if (section === 'logout') {
        localStorage.clear();
        window.location.href = './login.html';
      } else if (section === 'admin') {
        window.location.href = './adminPerfil.html';
      }
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  });
}

function verificarAdmin() {
  const token = localStorage.getItem('token');
  if (!token) {
    return;
  }
  fetch(`${API_URL}/api/verificar-admin`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(`Erro na requisição: ${response.status} - ${err.message}`);
        });
      }
      return response.json();
    })
    .then(data => {
      const isAdmin = data.role === 'admin';
      if (isAdmin) {
        const adminLink = document.getElementById('admin-link');
        if (adminLink) {
          adminLink.style.display = 'block';
        } else {
          console.error('Elemento admin-link não encontrado no DOM.');
        }
      }
    })
    .catch(error => {
      console.error('Erro ao verificar admin:', error);
    });
}

function displayUserGreeting() {
  const username = localStorage.getItem('username');
  const greetingElement = document.getElementById('userGreeting');
  if (username && greetingElement) {
    greetingElement.textContent = `Olá, ${username}`;
  } else if (greetingElement) {
    greetingElement.textContent = 'Olá, Visitante';
  }
}

function getUserId() {
  return localStorage.getItem('user_id');
}

function carregarProdutos() {
  fetch(`${API_URL}/produtos`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      produtos = data;
      renderizarProdutos(produtos);
      setupPagination();
    })
    .catch(error => {
      console.error('Erro ao carregar produtos:', error);
      const containerItens = document.getElementById('container-itens');
      containerItens.innerHTML = '<p>Erro ao carregar produtos. Tente novamente mais tarde.</p>';
    });
}

function renderizarProdutos(lista) {
  const containerItens = document.getElementById('container-itens');
  if (!containerItens) {
    console.error('Container de itens não encontrado.');
    return;
  }
  containerItens.innerHTML = '';
  const fragment = document.createDocumentFragment();

  const productsPerPage = getProductsPerPage();
  const start = (currentPage - 1) * productsPerPage;
  const end = start + productsPerPage;
  const paginatedProducts = lista.slice(start, end);

  paginatedProducts.forEach(produto => {
    const item = document.createElement('div');
    item.classList.add('item');
    const precoFormatado = parseFloat(produto.preco).toFixed(2).replace('.', ',');
    const estoque = produto.quantidade_estoque || 0;

    item.innerHTML = `
      <span class="titulo-item">${produto.titulo}</span>
      <img src="/Uploads/${produto.imagem}" alt="" class="img-item">
      <span class="preco-item">R$ ${precoFormatado}</span>
      <span class="estoque-item ${estoque === 0 ? 'out-of-stock' : ''}">Estoque: ${estoque}</span>
      <button class="botao-item" ${estoque === 0 ? 'disabled' : ''}>${estoque === 0 ? 'Indisponível' : 'Adicionar ao Carrinho'}</button>
    `;

    if (estoque > 0) {
      item.querySelector('.botao-item').addEventListener('click', () => adicionarAoCarrinhoClicked(produto));
    }
    fragment.appendChild(item);
  });

  containerItens.appendChild(fragment);
  atualizarStatusLoja();
}

function setupPagination() {
  const paginationContainer = document.getElementById('pagination');
  if (!paginationContainer) {
    console.error('Container de paginação não encontrado.');
    return;
  }
  paginationContainer.innerHTML = '';
  const productsPerPage = getProductsPerPage();
  const totalPages = Math.ceil(produtos.length / productsPerPage);

  const prevButton = document.createElement('button');
  prevButton.textContent = 'Anterior';
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderizarProdutos(produtos);
      setupPagination();
    }
  });
  paginationContainer.appendChild(prevButton);

  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement('button');
    pageButton.textContent = i;
    if (i === currentPage) {
      pageButton.classList.add('active');
    }
    pageButton.addEventListener('click', () => {
      currentPage = i;
      renderizarProdutos(produtos);
      setupPagination();
    });
    paginationContainer.appendChild(pageButton);
  }

  const nextButton = document.createElement('button');
  nextButton.textContent = 'Próxima';
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderizarProdutos(produtos);
      setupPagination();
    }
  });
  paginationContainer.appendChild(nextButton);
}

function filtrarProdutos() {
  const buscaInput = document.getElementById('busca-produto');
  const filtroSelect = document.getElementById('filtro-categoria');
  if (!buscaInput || !filtroSelect) {
    console.error('Campos de busca não encontrados.');
    return;
  }
  const termoBusca = buscaInput.value.toLowerCase();
  const categoriaSelecionada = filtroSelect.value;

  const produtosFiltrados = produtos.filter(produto => {
    const nomeIncluiTermo = produto.titulo.toLowerCase().includes(termoBusca);
    const categoriaCorreta = categoriaSelecionada ? produto.categoria === categoriaSelecionada : true;
    return nomeIncluiTermo && categoriaCorreta;
  });

  currentPage = 1; // Reseta para a primeira página ao filtrar
  renderizarProdutos(produtosFiltrados);
  setupPagination();
}

function adicionarAoCarrinhoClicked(produto) {
  fetch(`${API_URL}/api/status-loja`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro ao verificar status da loja: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data.aberto) {
        showToast('A loja está fechada. Não é possível adicionar itens ao carrinho.', 'error');
        return;
      }
      var titulo = produto.titulo;
      var preco = produto.preco;
      var imagemSrc = produto.imagem;
      var id = produto.produto_id;
      var estoque = produto.quantidade_estoque || 0;

      if (estoque === 0) {
        showToast('Produto indisponível no estoque.', 'error');
        return;
      }

      if (verificarItemNoCarrinho(id)) {
        showToast('O item já está no carrinho', 'error');
        return;
      }

      adicionarItemAoCarrinho(titulo, preco, imagemSrc, id, estoque);
      atualizarBadgeCarrinho();
      if (window.innerWidth > 53.125 * 16) {
        exibirCarrinho();
      }
    })
    .catch(error => {
      console.error('Erro ao verificar status da loja:', error);
      showToast('Erro ao verificar status da loja. Tente novamente.', 'error');
    });
}

function verificarItemNoCarrinho(produto_id) {
  if (!produto_id) {
    console.error('ID do produto não definido:', produto_id);
    return false;
  }

  var carrinhoItens = document.getElementsByClassName('carrinho-itens')[0];
  if (!carrinhoItens) {
    console.error('Container de itens do carrinho não encontrado.');
    return false;
  }
  var carrinhoItensArray = Array.from(carrinhoItens.getElementsByClassName('carrinho-item'));

  return carrinhoItensArray.some(item => item.getAttribute('data-produto-id') === produto_id.toString());
}

function exibirCarrinho() {
  carrinhoVisivel = true;
  var carrinho = document.getElementsByClassName('carrinho')[0];
  if (carrinho) {
    carrinho.classList.add('active');
    const overlay = document.querySelector('.carrinho-overlay');
    if (overlay && window.innerWidth <= 53.125 * 16) {
      overlay.classList.add('active');
    }
  }
}

function adicionarItemAoCarrinho(titulo, preco, imagemSrc, produto_id, estoque) {
  var itensCarrinho = document.getElementsByClassName('carrinho-itens')[0];
  if (!itensCarrinho) {
    console.error('Container de itens do carrinho não encontrado.');
    showToast('Erro ao adicionar item ao carrinho.', 'error');
    return;
  }
  var precoNumerico = parseFloat(preco);
  if (isNaN(precoNumerico)) {
    console.error('Preço inválido:', preco);
    showToast('Preço inválido para o item.', 'error');
    return;
  }

  var item = document.createElement('div');
  item.classList.add('carrinho-item');
  item.setAttribute('data-produto-id', produto_id);
  item.setAttribute('data-estoque', estoque);

  item.innerHTML = `
    <img src="/Uploads/${imagemSrc}" width="80px" alt="">
    <div class="carrinho-item-detalhes">
      <span class="carrinho-item-titulo">${titulo}</span>
      <div class="seletor-quantidade">
        <i class="fa-solid fa-minus subtrair-quantidade"></i>
        <input type="number" value="1" class="carrinho-item-quantidade" min="1" max="${estoque}">
        <i class="fa-solid fa-plus adicionar-quantidade"></i>
      </div>
      <span class="carrinho-item-preco">R$ ${precoNumerico.toFixed(2).replace('.', ',')}</span>
    </div>
    <button class="btn-remover">
      <i class="fa-solid fa-trash"></i>
    </button>
  `;

  itensCarrinho.append(item);

  item.getElementsByClassName('btn-remover')[0].addEventListener('click', removerItemCarrinho);
  item.getElementsByClassName('adicionar-quantidade')[0].addEventListener('click', adicionarQuantidade);
  item.getElementsByClassName('subtrair-quantidade')[0].addEventListener('click', subtrairQuantidade);

  var inputQuantidade = item.getElementsByClassName('carrinho-item-quantidade')[0];
  inputQuantidade.addEventListener('blur', (event) => {
    let valor = parseInt(event.target.value);
    const maxEstoque = parseInt(event.target.closest('.carrinho-item').getAttribute('data-estoque'));
    if (isNaN(valor) || valor < 1) {
      event.target.value = 1;
      showToast('Quantidade mínima é 1.', 'error');
    } else if (valor > maxEstoque) {
      event.target.value = maxEstoque;
      showToast(`Quantidade máxima disponível é ${maxEstoque}.`, 'error');
    }
    atualizarTotalCarrinho();
    salvarCarrinhoNoLocalStorage();
    atualizarBadgeCarrinho();
  });

  atualizarTotalCarrinho();
  salvarCarrinhoNoLocalStorage();
}

function salvarCarrinhoNoLocalStorage() {
  const userId = getUserId();
  if (!userId) return;
  const chaveCarrinho = `carrinho_${userId}`;
  const carrinhoItens = Array.from(document.getElementsByClassName('carrinho-item')).map(item => ({
    produto_id: item.getAttribute('data-produto-id'),
    titulo: item.querySelector('.carrinho-item-titulo').innerText,
    preco: parseFloat(item.querySelector('.carrinho-item-preco').innerText.replace('R$ ', '').replace(',', '.')),
    quantidade: parseInt(item.querySelector('.carrinho-item-quantidade').value),
    imagem: item.querySelector('img').src.split('/').pop(),
    estoque: parseInt(item.getAttribute('data-estoque'))
  }));
  localStorage.setItem(chaveCarrinho, JSON.stringify(carrinhoItens));
  atualizarBadgeCarrinho();
}

function carregarCarrinhoDoLocalStorage() {
  const userId = getUserId();
  const chaveCarrinho = userId ? `carrinho_${userId}` : 'carrinho_temp';
  const carrinhoSalvo = JSON.parse(localStorage.getItem(chaveCarrinho)) || [];
  carrinhoSalvo.forEach(item => {
    const produto = produtos.find(p => p.produto_id === item.produto_id);
    const estoque = produto ? produto.quantidade_estoque : item.estoque || 0;
    if (estoque === 0) {
      showToast(`O item ${item.titulo} não está mais disponível em estoque e será removido do carrinho.`, 'error');
      return;
    }
    if (item.quantidade > estoque) {
      showToast(`A quantidade de ${item.titulo} foi ajustada para o estoque disponível (${estoque}).`, 'error');
      item.quantidade = estoque;
    }
    adicionarItemAoCarrinho(item.titulo, item.preco, item.imagem, item.produto_id, estoque);
    const ultimoItem = document.getElementsByClassName('carrinho-item')[document.getElementsByClassName('carrinho-item').length - 1];
    ultimoItem.querySelector('.carrinho-item-quantidade').value = item.quantidade;
  });
  atualizarTotalCarrinho();
  atualizarBadgeCarrinho();
  if (carrinhoSalvo.length > 0 && window.innerWidth > 53.125 * 16) {
    exibirCarrinho();
  }
}

function removerItemCarrinho(event) {
  var buttonClicked = event.target;
  var item = buttonClicked.closest('.carrinho-item');
  if (item) {
    item.remove();
  }
  atualizarTotalCarrinho();
  salvarCarrinhoNoLocalStorage();
  atualizarBadgeCarrinho();
  ocultarCarrinho();
}

function ocultarCarrinho() {
  var carrinhoItens = document.getElementsByClassName('carrinho-itens')[0];
  if (carrinhoItens && carrinhoItens.childElementCount === 0) {
    var carrinho = document.getElementsByClassName('carrinho')[0];
    var overlay = document.querySelector('.carrinho-overlay');
    carrinho.classList.remove('active');
    if (overlay) {
      overlay.classList.remove('active');
    }
    carrinhoVisivel = false;
  }
}

function atualizarTotalCarrinho() {
  var carrinhoItens = document.getElementsByClassName('carrinho-item');
  var total = 0;

  for (var i = 0; i < carrinhoItens.length; i++) {
    var item = carrinhoItens[i];
    var precoElemento = item.getElementsByClassName('carrinho-item-preco')[0].innerText;
    var preco = parseFloat(precoElemento.replace('R$', '').replace(',', '.'));
    var quantidadeItem = item.getElementsByClassName('carrinho-item-quantidade')[0].value;
    total += preco * quantidadeItem;
  }

  total = Math.round(total * 100) / 100;
  document.getElementsByClassName('carrinho-preco-total')[0].innerText = 'R$ ' + total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return total;
}

function fetchPerfil() {
  const token = localStorage.getItem('token');
  if (!token) {
    return Promise.reject(new Error('Usuário não logado'));
  }
  return fetch(`${API_URL}/perfil`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(`Erro ao buscar perfil: ${err.message}`);
        });
      }
      return response.json();
    });
}

function createConfirmationPopup(itens, perfil, total) {
  const popup = document.createElement('div');
  popup.classList.add('confirmation-popup');
  popup.innerHTML = `
    <div class="popup-content">
      <h2>Confirmação do Pedido</h2>
      <h3>Itens do Carrinho</h3>
      <div class="itens-lista">
        ${itens.map(item => `
          <div class="item-resumo">
            <span>${item.titulo}</span>
            <span>Quantidade: ${item.quantidade}</span>
            <span>R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
          </div>
        `).join('')}
      </div>
      <p class="total-pedido"><strong>Total do Pedido:</strong> R$ ${total.toFixed(2).replace('.', ',')}</p>
      <h3>Endereço de Entrega</h3>
      <div id="endereco-container">
        ${perfil && perfil.perfil && perfil.perfil.nome_rua ? `
          <p><strong>Endereço Cadastrado:</strong> ${perfil.perfil.nome_rua}, ${perfil.perfil.numero_casa}, ${perfil.perfil.bairro}, ${perfil.perfil.cidade} - ${perfil.perfil.UF}</p>
          <label><input type="radio" name="endereco" value="cadastrado" checked> Usar endereço cadastrado</label>
          <label><input type="radio" name="endereco" value="novo"> Usar outro endereço</label>
        ` : `
          <p>Nenhum endereço cadastrado.</p>
          <label><input type="radio" name="endereco" value="novo" checked> Cadastrar novo endereço</label>
        `}
      </div>
      <div id="novo-endereco" style="display: ${perfil && perfil.perfil && perfil.perfil.nome_rua ? 'none' : 'block'};">
        <h4>Novo Endereço</h4>
        <input type="text" id="nome_rua" placeholder="Rua" required>
        <input type="number" id="numero_casa" placeholder="Número" min="1" required>
        <input type="text" id="bairro" placeholder="Bairro" required>
        <input type="text" id="cidade" placeholder="Cidade" required>
        <input type="text" id="uf" placeholder="UF (2 letras)" maxlength="2" required>
      </div>
      <div class="popup-buttons">
        <button id="confirmar-pedido">Confirmar Pedido</button>
        <button id="cancelar-pedido">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);

  const enderecoRadios = popup.querySelectorAll('input[name="endereco"]');
  const novoEnderecoDiv = popup.querySelector('#novo-endereco');
  enderecoRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      novoEnderecoDiv.style.display = radio.value === 'novo' ? 'block' : 'none';
    });
  });

  popup.querySelector('#cancelar-pedido').addEventListener('click', () => {
    popup.remove();
  });

  popup.querySelector('#confirmar-pedido').addEventListener('click', () => {
    const enderecoSelecionado = popup.querySelector('input[name="endereco"]:checked')?.value;
    let enderecoData = {};
    if (enderecoSelecionado === 'novo') {
      const nome_rua = popup.querySelector('#nome_rua').value.trim();
      const numero_casa = popup.querySelector('#numero_casa').value;
      const bairro = popup.querySelector('#bairro').value.trim();
      const cidade = popup.querySelector('#cidade').value.trim();
      const uf = popup.querySelector('#uf').value.trim().toUpperCase();

      if (!nome_rua || !numero_casa || !bairro || !cidade || !uf) {
        showToast('Por favor, preencha todos os campos do novo endereço.', 'error');
        return;
      }
      if (!/^\d+$/.test(numero_casa) || parseInt(numero_casa) <= 0) {
        showToast('Número da residência deve ser um número inteiro positivo.', 'error');
        return;
      }
      if (!/^[A-Z]{2}$/.test(uf)) {
        showToast('UF deve conter exatamente 2 letras maiúsculas.', 'error');
        return;
      }
      enderecoData = { nome_rua, numero_casa, bairro, cidade, UF: uf };
    } else if (perfil && perfil.perfil && perfil.perfil.nome_rua) {
      enderecoData = {
        nome_rua: perfil.perfil.nome_rua,
        numero_casa: perfil.perfil.numero_casa,
        bairro: perfil.perfil.bairro,
        cidade: perfil.perfil.cidade,
        UF: perfil.perfil.UF
      };
    } else {
      showToast('Nenhum endereço disponível. Preencha um novo endereço.', 'error');
      return;
    }
    confirmarPedido(itens, enderecoData, total);
    popup.remove();
  });
}

function confirmarPedido(itens, enderecoData, total) {
  const user_id = localStorage.getItem('user_id');
  const token = localStorage.getItem('token');
  fetch(`${API_URL}/api/pedidos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id, itens, endereco: enderecoData }),
  })
    .then(response => {
      if (!response.ok) throw new Error(`Erro ao finalizar pedido: ${response.status}`);
      return response.json();
    })
    .then(data => {
      showToast(`Compra realizada com sucesso! Pedido #${data.pedido_id} - Total: R$ ${data.valor_total.toFixed(2).replace('.', ',')}`, 'success');
      const chaveCarrinho = `carrinho_${user_id}`;
      localStorage.removeItem(chaveCarrinho);
      document.querySelector('.carrinho-itens').innerHTML = '';
      atualizarTotalCarrinho();
      atualizarBadgeCarrinho();
      ocultarCarrinho();
      const itensFormatados = itens.map(item => {
        const precoTotalItem = (item.preco * item.quantidade).toFixed(2).replace('.', ',');
        return `- ${item.quantidade}x ${item.titulo} (R$ ${precoTotalItem})`;
      }).join('\n');
      const enderecoFormatado = `${enderecoData.nome_rua}, ${enderecoData.numero_casa}, ${enderecoData.bairro}, ${enderecoData.cidade} - ${enderecoData.UF}`;
      const mensagem = `Olá, vim pelo site do QRUP, fiz o pedido desses itens:\n${itensFormatados}\nPara o endereço: ${enderecoFormatado}\nNo valor de: R$ ${total.toFixed(2).replace('.', ',')}`;
      const mensagemCodificada = encodeURIComponent(mensagem);
      const whatsappLink = `https://wa.me/+5567992181941?text=${mensagemCodificada}`;
      window.location.href = whatsappLink;
    })
    .catch(error => {
      console.error('Erro ao finalizar pedido:', error);
      showToast('Erro ao finalizar pedido. Tente novamente.', 'error');
    });
}

function pagarClicked() {
  fetch(`${API_URL}/api/status-loja`)
    .then(response => {
      if (!response.ok) throw new Error(`Erro ao verificar status da loja: ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (!data.aberto) {
        showToast('A loja está fechada. Não é possível finalizar pedidos agora.', 'error');
        return;
      }
      const carrinhoItens = document.getElementsByClassName('carrinho-item');
      if (carrinhoItens.length === 0) {
        showToast('Seu carrinho está vazio!', 'error');
        return;
      }

      const user_id = localStorage.getItem('user_id');
      if (!user_id) {
        showToast('Você precisa estar logado para finalizar a compra!', 'error');
        return;
      }

      const itens = Array.from(carrinhoItens).map(item => ({
        produto_id: item.getAttribute('data-produto-id'),
        quantidade: parseInt(item.querySelector('.carrinho-item-quantidade').value),
        titulo: item.querySelector('.carrinho-item-titulo').innerText,
        preco: parseFloat(item.querySelector('.carrinho-item-preco').innerText.replace('R$ ', '').replace(',', '.')),
      }));

      const total = atualizarTotalCarrinho();

      fetchPerfil()
        .then(perfil => {
          createConfirmationPopup(itens, perfil, total);
        })
        .catch(error => {
          console.error('Erro ao buscar perfil:', error);
          createConfirmationPopup(itens, null, total);
        });
    })
    .catch(error => {
      console.error('Erro ao verificar status da loja:', error);
      showToast('Erro ao verificar status da loja. Tente novamente.', 'error');
    });
}

function adicionarQuantidade(event) {
  var buttonClicked = event.target;
  var seletor = buttonClicked.parentElement;
  var quantidadeAtual = parseInt(seletor.getElementsByClassName('carrinho-item-quantidade')[0].value);
  var item = seletor.closest('.carrinho-item');
  var maxEstoque = parseInt(item.getAttribute('data-estoque'));
  if (quantidadeAtual >= maxEstoque) {
    showToast(`Quantidade máxima disponível é ${maxEstoque}.`, 'error');
    return;
  }
  quantidadeAtual++;
  seletor.getElementsByClassName('carrinho-item-quantidade')[0].value = quantidadeAtual;
  atualizarTotalCarrinho();
  salvarCarrinhoNoLocalStorage();
  atualizarBadgeCarrinho();
}

function subtrairQuantidade(event) {
  var buttonClicked = event.target;
  var seletor = buttonClicked.parentElement;
  var quantidadeAtual = parseInt(seletor.getElementsByClassName('carrinho-item-quantidade')[0].value);
  if (quantidadeAtual > 1) {
    quantidadeAtual--;
    seletor.getElementsByClassName('carrinho-item-quantidade')[0].value = quantidadeAtual;
    atualizarTotalCarrinho();
    salvarCarrinhoNoLocalStorage();
    atualizarBadgeCarrinho();
  }
}

function changeFontSize(action) {
  const body = document.body;
  let currentSize = parseFloat(window.getComputedStyle(body).fontSize);

  if (action === 'increase') {
    body.style.fontSize = `${currentSize + 2}px`;
  } else if (action === 'decrease') {
    body.style.fontSize = `${currentSize - 2}px`;
  } else if (action === 'normal') {
    body.style.fontSize = '16px';
  }
}