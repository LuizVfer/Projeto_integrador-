// js/orders.js
function setupFiltrosPedidos() {
    const filtroStatus = document.getElementById('filtro-status');
    const filtroNomeCliente = document.getElementById('filtro-nome-cliente');
    const filtroDataInicio = document.getElementById('filtro-data-inicio');
    const filtroDataFim = document.getElementById('filtro-data-fim');
    const filtroValorMinimo = document.getElementById('filtro-valor-minimo');
    const filtroValorMaximo = document.getElementById('filtro-valor-maximo');
    const btnLimparFiltros = document.getElementById('limpar-filtros');

    const aplicarFiltros = () => {
        const filters = {
            status: filtroStatus.value,
            nomeCliente: filtroNomeCliente.value.trim(),
            dataInicio: filtroDataInicio.value,
            dataFim: filtroDataFim.value,
            valorMinimo: filtroValorMinimo.value ? parseFloat(filtroValorMinimo.value) : null,
            valorMaximo: filtroValorMaximo.value ? parseFloat(filtroValorMaximo.value) : null,
        };
        carregarPedidos(filters);
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
        carregarPedidos();
    });
}

function carregarPedidos(filters = {}) {
    const token = getToken();

    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.nomeCliente) queryParams.append('nomeCliente', filters.nomeCliente);
    if (filters.dataInicio) queryParams.append('dataInicio', filters.dataInicio);
    if (filters.dataFim) queryParams.append('dataFim', filters.dataFim);
    if (filters.valorMinimo) queryParams.append('valorMinimo', filters.valorMinimo);
    if (filters.valorMaximo) queryParams.append('valorMaximo', filters.valorMaximo);

    fetch(`${API_URL}/api/pedidos?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(response => response.json())
        .then(data => {
            const pedidosContent = document.getElementById('pedidos-content');
            pedidosContent.innerHTML = data.length > 0 ? data.map(pedido => {
                const valorTotal = pedido.valor_total != null && !isNaN(pedido.valor_total)
                    ? parseFloat(pedido.valor_total).toFixed(2).replace('.', ',')
                    : 'Indisponível';

                return `
                <div class="pedido-card" data-pedido-id="${pedido.pedido_id}">
                    <h3><i class="fa-solid fa-shopping-cart"></i> Pedido #${pedido.pedido_id}</h3>
                    <ul class="pedido-info">
                        <li><i class="fa-solid fa-user"></i> <strong>Nome:</strong> ${pedido.usuario_nome || 'Não informado'}</li>
                        <li><i class="fa-solid fa-address-card"></i> <strong>CPF:</strong> ${pedido.usuario_cpf || 'Não informado'}</li>
                        <li><i class="fa-solid fa-calendar-alt"></i> <strong>Data:</strong> ${new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</li>
                        <li><i class="fa-solid fa-hourglass-half"></i> <strong>Status:</strong>
                            <select class="status-select" data-pedido-id="${pedido.pedido_id}" value="${pedido.processo_pedido}">
                                <option value="aguardando" ${pedido.processo_pedido === 'aguardando' ? 'selected' : ''}>Aguardando</option>
                                <option value="concluido" ${pedido.processo_pedido === 'concluido' ? 'selected' : ''}>Concluído</option>
                                <option value="cancelado" ${pedido.processo_pedido === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                            </select>
                        </li>
                        <li><i class="fa-solid fa-money-bill"></i> <strong>Total:</strong> R$ ${valorTotal}</li>
                        <li><i class="fa-solid fa-box-open"></i> <strong>Itens:</strong>
                            <ul class="itens-lista">
                                ${pedido.itens.map(item => `
                                    <li>
                                        ${item.quantidade}x ${item.produto_nome || 'Produto desconhecido'} 
                                        (R$ ${item.produto_preco != null ? parseFloat(item.produto_preco).toFixed(2).replace('.', ',') : 'Indisponível'})
                                    </li>
                                `).join('')}
                            </ul>
                        </li>
                    </ul>
                </div>
            `;
            }).join('') : '<p>Nenhum pedido encontrado com os filtros aplicados.</p>';

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
            document.getElementById('pedidos-content').innerHTML = '<p>Erro ao carregar pedidos.</p>';
        });
}

function atualizarStatusPedido(pedidoId, novoStatus) {
    const token = getToken();
    fetch(`${API_URL}/api/pedidos/${pedidoId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ processo_pedido: novoStatus })
    })
        .then(response => {
            if (!response.ok) throw new Error('Erro ao atualizar status do pedido');
            return response.json();
        })
        .then(data => {
            alert(`Status do pedido #${pedidoId} atualizado para "${novoStatus}" com sucesso!`);
        })
        .catch(error => {
            console.error('Erro ao atualizar status:', error);
            alert('Erro ao atualizar status do pedido.');
            carregarPedidos();
        });
}