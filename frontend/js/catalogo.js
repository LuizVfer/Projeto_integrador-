const API_URL = 'http://localhost:3000';
var carrinhoVisivel = false;
let produtos = [];

document.addEventListener('DOMContentLoaded', ready);

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function ready() {
  setupMenu(); // Configurar o menu hambúrguer
  const btnPagar = document.querySelector('.btn-pagar');
  btnPagar.addEventListener('click', pagarClicked);
  const buscaInput = document.getElementById('busca-produto');
  const filtroSelect = document.getElementById('filtro-categoria');
  const btnBuscar = document.getElementById('btn-buscar');

  if (buscaInput && filtroSelect && btnBuscar) {
    btnBuscar.addEventListener('click', filtrarProdutos);
    buscaInput.addEventListener('input', debounce(filtrarProdutos, 300));
    filtroSelect.addEventListener('change', filtrarProdutos);
  } else {
    console.error("Campos de busca ou botão de busca não encontrados.");
  }
  carregarProdutos();
  carregarCarrinhoDoLocalStorage();
  displayUserGreeting();
  verificarAdmin(); // Verificar se o usuário é admin
}

function setupMenu() {
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const menuLinks = sidebar.querySelectorAll('a[data-section]');

  menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
  });

  overlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
  });

  menuLinks.forEach(link => {
      link.addEventListener('click', (e) => {
          e.preventDefault();
          const section = link.getAttribute('data-section');
          menuLinks.forEach(l => l.classList.remove('active')); // Remove active de todos
          link.classList.add('active'); // Adiciona ao clicado
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
              window.location.href = './AdminDashboard.html';
          }
          sidebar.classList.remove('active');
          overlay.classList.remove('active');
      });
  });
}

function verificarAdmin() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('Nenhum token encontrado no localStorage. Usuário não logado.');
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
      } else {
        console.log('Usuário não é administrador. Role:', data.role);
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
  fetch(`${API_URL}/produtos`) // Já retorna apenas produtos ativos
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      produtos = data;
      renderizarProdutos(produtos);
    })
    .catch(error => {
      console.error('Erro ao carregar produtos:', error);
      const containerItens = document.getElementById('container-itens');
      containerItens.innerHTML = '<p>Erro ao carregar produtos. Tente novamente mais tarde.</p>';
    });
}

function renderizarProdutos(lista) {
  const containerItens = document.getElementById('container-itens');
  containerItens.innerHTML = '';
  const fragment = document.createDocumentFragment();

  lista.forEach(produto => {
    const item = document.createElement('div');
    item.classList.add('item');
    const precoFormatado = parseFloat(produto.preco).toFixed(2).replace('.', ',');

    item.innerHTML = `
      <span class="titulo-item">${produto.titulo}</span>
      <img src="/uploads/${produto.imagem}" alt="" class="img-item">
      <span class="preco-item">R$ ${precoFormatado}</span>
      <button class="botao-item">Adicionar ao Carrinho</button>
    `;

    item.querySelector('.botao-item').addEventListener('click', () => adicionarAoCarrinhoClicked(produto));
    fragment.appendChild(item);
  });

  containerItens.appendChild(fragment);
}

function filtrarProdutos() {
  const termoBusca = document.getElementById('busca-produto').value.toLowerCase();
  const categoriaSelecionada = document.getElementById('filtro-categoria').value;

  const produtosFiltrados = produtos.filter(produto => {
    const nomeIncluiTermo = produto.titulo.toLowerCase().includes(termoBusca);
    const categoriaCorreta = categoriaSelecionada ? produto.categoria === categoriaSelecionada : true;
    return nomeIncluiTermo && categoriaCorreta;
  });

  renderizarProdutos(produtosFiltrados);
}

function adicionarAoCarrinhoClicked(produto) {
  var titulo = produto.titulo;
  var preco = produto.preco;
  var imagemSrc = produto.imagem;
  var id = produto.produto_id;

  if (verificarItemNoCarrinho(id)) {
    alert("O item já está no carrinho");
    return;
  }

  adicionarItemAoCarrinho(titulo, preco, imagemSrc, id);
  exibirCarrinho();
}

function verificarItemNoCarrinho(produto_id) {
  if (!produto_id) {
    console.error("ID do produto não definido:", produto_id);
    return false;
  }

  var carrinhoItens = document.getElementsByClassName('carrinho-itens')[0];
  var carrinhoItensArray = Array.from(carrinhoItens.getElementsByClassName('carrinho-item'));

  return carrinhoItensArray.some(item => item.getAttribute('data-produto-id') === produto_id.toString());
}

function exibirCarrinho() {
  carrinhoVisivel = true;
  var carrinho = document.getElementsByClassName('carrinho')[0];
  carrinho.classList.add('active');
}

function adicionarItemAoCarrinho(titulo, preco, imagemSrc, produto_id) {
  var itensCarrinho = document.getElementsByClassName('carrinho-itens')[0];
  var precoNumerico = parseFloat(preco);
  if (isNaN(precoNumerico)) {
    console.error("Preço inválido:", preco);
    return;
  }

  var item = document.createElement('div');
  item.classList.add('carrinho-item');
  item.setAttribute('data-produto-id', produto_id);

  item.innerHTML = `
    <img src="/uploads/${imagemSrc}" width="80px" alt="">
    <div class="carrinho-item-detalhes">
      <span class="carrinho-item-titulo">${titulo}</span>
      <div class="seletor-quantidade">
        <i class="fa-solid fa-minus subtrair-quantidade"></i>
        <input type="number" value="1" class="carrinho-item-quantidade" min="1">
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
    if (isNaN(valor) || valor < 1) {
      event.target.value = 1;
    }
    atualizarTotalCarrinho();
    salvarCarrinhoNoLocalStorage();
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
  }));
  localStorage.setItem(chaveCarrinho, JSON.stringify(carrinhoItens));
}

function carregarCarrinhoDoLocalStorage() {
  const userId = getUserId();
  const chaveCarrinho = userId ? `carrinho_${userId}` : 'carrinho_temp';
  const carrinhoSalvo = JSON.parse(localStorage.getItem(chaveCarrinho)) || [];
  carrinhoSalvo.forEach(item => {
    adicionarItemAoCarrinho(item.titulo, item.preco, item.imagem, item.produto_id);
    const ultimoItem = document.getElementsByClassName('carrinho-item')[document.getElementsByClassName('carrinho-item').length - 1];
    ultimoItem.querySelector('.carrinho-item-quantidade').value = item.quantidade;
  });
  atualizarTotalCarrinho();
  if (carrinhoSalvo.length > 0) {
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
  ocultarCarrinho();
}

function ocultarCarrinho() {
  var carrinhoItens = document.getElementsByClassName('carrinho-itens')[0];
  if (carrinhoItens && carrinhoItens.childElementCount === 0) {
      var carrinho = document.getElementsByClassName('carrinho')[0];
      carrinho.classList.remove('active');
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
  document.getElementsByClassName('carrinho-preco-total')[0].innerText = 'R$ ' + total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pagarClicked() {
  const carrinhoItens = document.getElementsByClassName('carrinho-item');
  if (carrinhoItens.length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }

  const user_id = localStorage.getItem('user_id');
  const token = localStorage.getItem('token');
  if (!user_id) {
    alert("Você precisa estar logado para finalizar a compra!");
    return;
  }

  const itens = Array.from(carrinhoItens).map(item => ({
    produto_id: item.getAttribute('data-produto-id'),
    quantidade: parseInt(item.querySelector('.carrinho-item-quantidade').value),
  }));

  fetch(`${API_URL}/api/pedidos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id, itens }),
  })
    .then(response => {
      if (!response.ok) throw new Error(`Erro ao finalizar pedido: ${response.status}`);
      return response.json();
    })
    .then(data => {
      alert(`Compra realizada com sucesso! Pedido #${data.pedido_id} - Total: R$ ${data.valor_total.toFixed(2).replace('.', ',')}`);
      const chaveCarrinho = `carrinho_${user_id}`;
      localStorage.removeItem(chaveCarrinho);
      document.querySelector('.carrinho-itens').innerHTML = '';
      atualizarTotalCarrinho();
      ocultarCarrinho();
    })
    .catch(error => {
      console.error('Erro ao finalizar pedido:', error);
      alert("Erro ao finalizar pedido. Tente novamente.");
    });
}

function adicionarQuantidade(event) {
  var buttonClicked = event.target;
  var seletor = buttonClicked.parentElement;
  var quantidadeAtual = parseInt(seletor.getElementsByClassName('carrinho-item-quantidade')[0].value);
  quantidadeAtual++;
  seletor.getElementsByClassName('carrinho-item-quantidade')[0].value = quantidadeAtual;
  atualizarTotalCarrinho();
  salvarCarrinhoNoLocalStorage();
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
  }
}