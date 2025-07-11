document.addEventListener('DOMContentLoaded', () => {
    const pedidosContent = document.getElementById('pedidos-content');
    if (!pedidosContent) {
        console.error('Elemento pedidos-content não encontrado no DOM');
        return;
    }
    carregarPedidos({ page: 1, limit: 9 }); // Limite fixado em 9
    setupFiltrosPedidos();
});

// Exibe notificações toast para feedback do usuário
function showToast(message, type = 'error') {
    if (!message || typeof message !== 'string' || message.trim() === '') {
        console.error('Mensagem de toast inválida ou vazia.');
        return;
    }

    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        console.error('Contêiner de toast não encontrado.');
        return;
    }

    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    toast.textContent = message.trim();
    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Recupera o token de autenticação do localStorage
function getToken() {
    const token = localStorage.getItem('token');
    if (!token || typeof token !== 'string' || token.trim() === '') {
        console.error('Token inválido ou não encontrado.');
        return null;
    }
    return token;
}

// Armazena os filtros atuais globalmente para manter estado durante paginação
let filtrosAtuais = { page: 1, limit: 9 };

// Configura os filtros de pesquisa de pedidos
function setupFiltrosPedidos() {
    const filtroStatus = document.getElementById('filtro-status');
    const filtroNomeCliente = document.getElementById('filtro-nome-cliente');
    const filtroDataInicio = document.getElementById('filtro-data-inicio');
    const filtroDataFim = document.getElementById('filtro-data-fim');
    const filtroValorMinimo = document.getElementById('filtro-valor-minimo');
    const filtroValorMaximo = document.getElementById('filtro-valor-maximo');
    const btnLimparFiltros = document.getElementById('limpar-filtros');

    if (!filtroStatus || !filtroNomeCliente || !filtroDataInicio || !filtroDataFim || 
        !filtroValorMinimo || !filtroValorMaximo || !btnLimparFiltros) {
        console.error('Elementos de filtro não encontrados:', {
            filtroStatus: !!filtroStatus,
            filtroNomeCliente: !!filtroNomeCliente,
            filtroDataInicio: !!filtroDataInicio,
            filtroDataFim: !!filtroDataFim,
            filtroValorMinimo: !!filtroValorMinimo,
            filtroValorMaximo: !!filtroValorMaximo,
            btnLimparFiltros: !!btnLimparFiltros
        });
        return;
    }

    const aplicarFiltros = () => {
        const valorMinimo = filtroValorMinimo.value ? parseFloat(filtroValorMinimo.value) : null;
        const valorMaximo = filtroValorMaximo.value ? parseFloat(filtroValorMaximo.value) : null;
        const dataInicio = filtroDataInicio.value ? new Date(filtroDataInicio.value) : null;
        const dataFim = filtroDataFim.value ? new Date(filtroDataFim.value) : null;

        if (valorMinimo !== null && (isNaN(valorMinimo) || valorMinimo < 0)) {
            showToast('O valor mínimo deve ser um número positivo.', 'error');
            return;
        }
        if (valorMaximo !== null && (isNaN(valorMaximo) || valorMaximo < 0)) {
            showToast('O valor máximo deve ser um número positivo.', 'error');
            return;
        }
        if (valorMinimo !== null && valorMaximo !== null && valorMinimo > valorMaximo) {
            showToast('O valor mínimo não pode ser maior que o valor máximo.', 'error');
            return;
        }
        if (dataInicio && dataFim && dataInicio > dataFim) {
            showToast('A data inicial não pode ser posterior à data final.', 'error');
            return;
        }

        // Atualizar filtros globais - sempre resetar para página 1 quando filtros mudam
        filtrosAtuais = {
            status: filtroStatus.value,
            nomeCliente: filtroNomeCliente.value.trim(),
            dataInicio: filtroDataInicio.value,
            dataFim: filtroDataFim.value,
            valorMinimo,
            valorMaximo,
            page: 1, // Sempre voltar para a primeira página
            limit: 9 // Limite fixado em 9
        };

        carregarPedidos(filtrosAtuais);
    };

    filtroStatus.addEventListener('change', aplicarFiltros);
    filtroNomeCliente.addEventListener('input', aplicarFiltros);
    filtroDataInicio.addEventListener('change', aplicarFiltros);
    filtroDataFim.addEventListener('change', aplicarFiltros);
    filtroValorMinimo.addEventListener('input', aplicarFiltros);
    filtroValorMaximo.addEventListener('input', aplicarFiltros);

    btnLimparFiltros.addEventListener('click', () => {
        filtroStatus.value = '';
        filtroNomeCliente.value = '';
        filtroDataInicio.value = '';
        filtroDataFim.value = '';
        filtroValorMinimo.value = '';
        filtroValorMaximo.value = '';
        
        // Resetar filtros globais
        filtrosAtuais = { page: 1, limit: 9 };
        carregarPedidos(filtrosAtuais);
        showToast('Filtros limpos com sucesso!', 'success');
    });
}

// Carrega a lista de pedidos do servidor
function carregarPedidos(filters = { page: 1, limit: 9 }) {
    const token = getToken();
    if (!token) {
        showToast('Sessão expirada. Redirecionando para login...', 'error');
        window.location.href = '../html/login.html';
        return;
    }

    // Atualizar filtros atuais
    filtrosAtuais = { ...filtrosAtuais, ...filters };

    const queryParams = new URLSearchParams();
    if (filtrosAtuais.status) queryParams.append('status', filtrosAtuais.status);
    if (filtrosAtuais.nomeCliente) queryParams.append('nomeCliente', filtrosAtuais.nomeCliente);
    if (filtrosAtuais.dataInicio) queryParams.append('dataInicio', filtrosAtuais.dataInicio);
    if (filtrosAtuais.dataFim) queryParams.append('dataFim', filtrosAtuais.dataFim);
    if (filtrosAtuais.valorMinimo) queryParams.append('valorMinimo', filtrosAtuais.valorMinimo);
    if (filtrosAtuais.valorMaximo) queryParams.append('valorMaximo', filtrosAtuais.valorMaximo);
    queryParams.append('page', filtrosAtuais.page);
    queryParams.append('limit', filtrosAtuais.limit);

    fetch(`${API_URL}/api/pedidos?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Sessão inválida. Faça login novamente.');
                }
                throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            const pedidosContent = document.getElementById('pedidos-content');
            const mainContent = document.querySelector('main');
            if (!pedidosContent || !mainContent) {
                console.error('Elemento pedidos-content ou main não encontrado após requisição');
                showToast('Erro: contêiner de pedidos não encontrado.', 'error');
                return;
            }

            pedidosContent.innerHTML = data.pedidos.length > 0 ? data.pedidos.map(pedido => {
                const valorTotal = pedido.valor_total != null && !isNaN(pedido.valor_total)
                    ? parseFloat(pedido.valor_total).toFixed(2).replace('.', ',')
                    : 'Indisponível';
                const endereco = pedido.endereco
                    ? `${pedido.endereco.nome_rua}, ${pedido.endereco.numero_casa}, ${pedido.endereco.bairro}, ${pedido.endereco.cidade} - ${pedido.endereco.UF}`
                    : 'Nenhum endereço cadastrado';

                return `
                    <div class="pedido-card" data-pedido-id="${pedido.pedido_id}">
                        <h3><i class="fa-solid fa-shopping-cart"></i> Pedido #${pedido.pedido_id}</h3>
                        <ul class="pedido-info">
                            <li><i class="fa-solid fa-user"></i> <strong>Nome:</strong> ${pedido.usuario_nome || 'Não informado'}</li>
                            <li><i class="fa-solid fa-address-card"></i> <strong>CPF:</strong> ${pedido.usuario_cpf || 'Não informado'}</li>
                            <li><i class="fa-solid fa-home"></i> <strong>Endereço:</strong> ${endereco}</li>
                            <li><i class="fa-solid fa-calendar-alt"></i> <strong>Data:</strong> ${pedido.data_pedido ? new Date(pedido.data_pedido).toLocaleDateString('pt-BR') : 'Não informado'}</li>
                            <li><i class="fa-solid fa-hourglass-half"></i> <strong>Status:</strong>
                                <select class="status-select" data-pedido-id="${pedido.pedido_id}" value="${pedido.processo_pedido || ''}">
                                    <option value="aguardando" ${pedido.processo_pedido === 'aguardando' ? 'selected' : ''}>Aguardando</option>
                                    <option value="concluido" ${pedido.processo_pedido === 'concluido' ? 'selected' : ''}>Concluído</option>
                                    <option value="cancelado" ${pedido.processo_pedido === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                                </select>
                            </li>
                            <li><i class="fa-solid fa-money-bill"></i> <strong>Total:</strong> R$ ${valorTotal}</li>
                            <li><i class="fa-solid fa-box-open"></i> <strong>Itens:</strong>
                                <ul class="itens-lista">
                                    ${pedido.itens && Array.isArray(pedido.itens) ? pedido.itens.map(item => `
                                        <li>
                                            ${item.quantidade || 0}x ${item.produto_nome || 'Produto desconhecido'} 
                                            (R$ ${item.produto_preco != null ? parseFloat(item.produto_preco).toFixed(2).replace('.', ',') : 'Indisponível'})
                                        </li>
                                    `).join('') : '<li>Nenhum item disponível</li>'}
                                </ul>
                            </li>
                        </ul>
                    </div>
                `;
            }).join('') : '<p>Nenhum pedido encontrado com os filtros aplicados.</p>';

            // Remover contêiner de paginação anterior, se existir
            const paginacaoAntiga = document.querySelector('.paginacao');
            if (paginacaoAntiga) paginacaoAntiga.remove();

            // Adicionar novo contêiner de paginação diretamente no main
            const paginacaoContainer = document.createElement('div');
            paginacaoContainer.className = 'paginacao';
            paginacaoContainer.innerHTML = `
                <button id="pagina-anterior" ${data.page <= 1 ? 'disabled' : ''}>Anterior</button>
                <span>Página ${data.page} de ${data.totalPages} (Total: ${data.total} pedidos)</span>
                <button id="proxima-pagina" ${data.page >= data.totalPages ? 'disabled' : ''}>Próxima</button>
            `;
            mainContent.appendChild(paginacaoContainer);

            // Adicionar eventos aos botões de paginação
            document.getElementById('pagina-anterior')?.addEventListener('click', () => {
                if (data.page > 1) {
                    carregarPedidos({ ...filtrosAtuais, page: data.page - 1 });
                }
            });
            document.getElementById('proxima-pagina')?.addEventListener('click', () => {
                if (data.page < data.totalPages) {
                    carregarPedidos({ ...filtrosAtuais, page: data.page + 1 });
                }
            });

            // Associa eventos aos seletores de status
            document.querySelectorAll('.status-select').forEach(select => {
                select.value = select.getAttribute('value');
                select.addEventListener('change', (e) => {
                    const pedidoId = e.target.getAttribute('data-pedido-id');
                    const novoStatus = e.target.value;
                    e.target.setAttribute('value', novoStatus);
                    atualizarStatusPedido(pedidoId, novoStatus);
                });
            });
        })
        .catch(error => {
            console.error('Erro ao carregar pedidos:', error);
            const pedidosContent = document.getElementById('pedidos-content');
            if (pedidosContent) {
                pedidosContent.innerHTML = `<p>Erro ao carregar pedidos: ${error.message}</p>`;
            }
            showToast(`Erro ao carregar pedidos: ${error.message}`, 'error');
        });
}

// Atualiza o status de um pedido no servidor
function atualizarStatusPedido(pedidoId, novoStatus) {
    const statusValidos = ['aguardando', 'concluido', 'cancelado'];
    if (!statusValidos.includes(novoStatus)) {
        showToast('Status inválido selecionado.', 'error');
        carregarPedidos(filtrosAtuais);
        return;
    }

    const token = getToken();
    if (!token) {
        showToast('Sessão expirada. Redirecionando para login...', 'error');
        window.location.href = '../html/login.html';
        return;
    }

    fetch(`${API_URL}/api/pedidos/${pedidoId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ processo_pedido: novoStatus })
    })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Sessão inválida. Faça login novamente.');
                }
                throw new Error(`Erro ao atualizar status: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            showToast(`Status do pedido #${pedidoId} atualizado para "${novoStatus}" com sucesso!`, 'success');
            // Recarregar a página atual mantendo os filtros
            carregarPedidos(filtrosAtuais);
        })
        .catch(error => {
            console.error('Erro ao atualizar status:', error);
            showToast(`Erro ao atualizar status do pedido: ${error.message}`, 'error');
            carregarPedidos(filtrosAtuais);
        });
}