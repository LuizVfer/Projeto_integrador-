document.addEventListener('DOMContentLoaded', () => {
    const btnGerarRelatorios = document.getElementById('gerar-relatorios');
    const btnExportarPdf = document.getElementById('exportar-pdf');
    const dataInicioInput = document.getElementById('relatorio-data-inicio');
    const dataFimInput = document.getElementById('relatorio-data-fim');

    if (!btnGerarRelatorios) {
        console.warn('Botão gerar-relatorios não encontrado');
        return;
    }
    if (!btnExportarPdf) {
        console.warn('Botão exportar-pdf não encontrado');
        return;
    }
    if (!dataInicioInput) {
        console.warn('Input relatorio-data-inicio não encontrado');
        return;
    }
    if (!dataFimInput) {
        console.warn('Input relatorio-data-fim não encontrado');
        return;
    }

    btnGerarRelatorios.addEventListener('click', gerarRelatorios);
    btnExportarPdf.addEventListener('click', exportarPdfRelatorios);

    dataInicioInput.addEventListener('change', () => { });
    dataFimInput.addEventListener('change', () => { });
});

// Função para exibir notificações toast
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

async function gerarRelatorios() {
    const periodo = document.getElementById('relatorio-periodo').value;
    const dataInicio = document.getElementById('relatorio-data-inicio').value;
    const dataFim = document.getElementById('relatorio-data-fim').value;
    const categoria = document.getElementById('relatorio-categoria').value;
    const status = document.getElementById('filtro-status').value;
    const valorMin = document.getElementById('filtro-valor-min').value;

    if (!dataInicio || !dataFim) {
        showToast('Por favor, selecione as datas de início e fim.', 'error');
        return;
    }

    if (new Date(dataFim) < new Date(dataInicio)) {
        showToast('A data de fim deve ser posterior à data de início.', 'error');
        return;
    }

    try {
        // Construir URL para vendas com filtros avançados
        let vendasUrl = `${API_URL}/relatorios/vendas?periodo=${periodo}&dataInicio=${dataInicio}&dataFim=${dataFim}`;
        if (status) vendasUrl += `&status=${status}`;
        if (valorMin) vendasUrl += `&valorMin=${valorMin}`;

        const vendasResponse = await fetch(vendasUrl, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (!vendasResponse.ok) throw new Error('Erro na requisição de vendas');
        const vendas = await vendasResponse.json();
        exibirVendas(vendas);

        const produtosResponse = await fetch(`${API_URL}/relatorios/produtos?dataInicio=${dataInicio}&dataFim=${dataFim}${categoria ? `&categoria=${categoria}` : ''}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (!produtosResponse.ok) throw new Error('Erro na requisição de produtos');
        const produtos = await produtosResponse.json();
        exibirProdutos(produtos);

        const usuariosResponse = await fetch(`${API_URL}/relatorios/usuarios?dataInicio=${dataInicio}&dataFim=${dataFim}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (!usuariosResponse.ok) throw new Error('Erro na requisição de usuários');
        const usuarios = await usuariosResponse.json();
        exibirUsuarios(usuarios);

        const categoriasResponse = await fetch(`${API_URL}/relatorios/categorias?dataInicio=${dataInicio}&dataFim=${dataFim}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (!categoriasResponse.ok) throw new Error('Erro na requisição de categorias');
        const categorias = await categoriasResponse.json();

        exibirCategorias(categorias);

        const taxaResponse = await fetch(`${API_URL}/relatorios/taxa-cancelamento?dataInicio=${dataInicio}&dataFim=${dataFim}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (!taxaResponse.ok) throw new Error('Erro na requisição de taxa');
        const taxa = await taxaResponse.json();
        exibirTaxaCancelamento(taxa);
        showToast('Relatórios gerados com sucesso!', 'success');
    } catch (err) {
        console.error('Erro ao gerar relatórios:', err);
        showToast('Erro ao gerar relatórios: ' + err.message, 'error');
    }
}

function exibirVendas(vendas) {
    const tabela = document.getElementById('vendas-tabela');
    tabela.innerHTML = '';
    if (!vendas || vendas.length === 0) {
        tabela.innerHTML = '<tr><td colspan="3">Nenhum dado disponível.</td></tr>';
        return;
    }
    vendas.forEach(venda => {
        const valorTotal = Number(venda.valor_total);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${venda.data}</td>
            <td>${venda.total_pedidos}</td>
            <td>R$ ${isNaN(valorTotal) ? '0.00' : valorTotal.toFixed(2)}</td>
        `;
        tabela.appendChild(tr);
    });
}

function exibirProdutos(produtos) {
    const tabela = document.getElementById('produtos-tabela');
    tabela.innerHTML = '';
    if (!produtos || produtos.length === 0) {
        tabela.innerHTML = '<tr><td colspan="4">Nenhum dado disponível.</td></tr>';
        return;
    }
    produtos.forEach(produto => {
        const valorTotal = Number(produto.valor_total);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${produto.titulo}</td>
            <td>${produto.categoria}</td>
            <td>${produto.quantidade_vendida}</td>
            <td>R$ ${isNaN(valorTotal) ? '0.00' : valorTotal.toFixed(2)}</td>
        `;
        tabela.appendChild(tr);
    });
}

function exibirUsuarios(usuarios) {
    const tabela = document.getElementById('usuarios-tabela');
    tabela.innerHTML = '';
    if (!usuarios || usuarios.length === 0) {
        tabela.innerHTML = '<tr><td colspan="3">Nenhum dado disponível.</td></tr>';
        return;
    }
    usuarios.forEach(usuario => {
        const valorTotal = Number(usuario.valor_total);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${usuario.nome || usuario.username}</td>
            <td>${usuario.total_pedidos}</td>
            <td>R$ ${isNaN(valorTotal) ? '0.00' : valorTotal.toFixed(2)}</td>
        `;
        tabela.appendChild(tr);
    });
}

function exibirCategorias(categorias) {
    const tabela = document.getElementById('categorias-tabela');
    tabela.innerHTML = '';
    if (!categorias || categorias.length === 0) {
        tabela.innerHTML = '<tr><td colspan="4">Nenhum dado disponível.</td></tr>';
        return;
    }
    categorias.forEach(categoria => {
        const valorTotal = Number(categoria.valor_total);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${categoria.categoria}</td>
            <td>${categoria.total_pedidos}</td>
            <td>${categoria.total_itens}</td>
            <td>R$ ${isNaN(valorTotal) ? '0.00' : valorTotal.toFixed(2)}</td>
        `;
        tabela.appendChild(tr);
    });
}

function exibirTaxaCancelamento(taxa) {
    const text = document.getElementById('taxa-text');
    if (!taxa || taxa.taxa_cancelamento == null || taxa.total_pedidos == null || taxa.pedidos_cancelados == null) {
        text.innerHTML = 'Nenhum dado de cancelamento disponível para o período selecionado.';
        return;
    }
    const taxaCancelamento = Number(taxa.taxa_cancelamento);
    const pedidosCancelados = Number(taxa.pedidos_cancelados);
    text.innerHTML = `
        Taxa de Cancelamento: ${isNaN(taxaCancelamento) ? '0.00' : taxaCancelamento.toFixed(2)}%<br>
        Total de Pedidos: ${taxa.total_pedidos}<br>
        Pedidos Cancelados: ${isNaN(pedidosCancelados) ? '0' : pedidosCancelados}
    `;
}

function exportarPdfRelatorios() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        console.error('Biblioteca jsPDF não carregada.');
        showToast('Erro: biblioteca jsPDF não carregada.', 'error');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 10;

    const vendasTabela = document.getElementById('vendas-tabela');
    const produtosTabela = document.getElementById('produtos-tabela');
    const usuariosTabela = document.getElementById('usuarios-tabela');
    const categoriasTabela = document.getElementById('categorias-tabela');
    const taxaText = document.getElementById('taxa-text');

    if (!vendasTabela || !produtosTabela || !usuariosTabela || !categoriasTabela || !taxaText) {
        console.error('Elementos necessários para exportação não encontrados.');
        showToast('Erro: elementos necessários para exportação não encontrados.', 'error');
        return;
    }

    // Adicionar logo
    const logo = '../../images/logo_2.jpg'; // Substitua pelo caminho do seu logo
    const logoWidth = 40; // Largura do logo em mm
    const logoHeight = 40; // Altura do logo em mm
    const pageWidth = doc.internal.pageSize.getWidth();
    const xPosition = (pageWidth - logoWidth) / 2; // Centralizar o logo

    try {
        doc.addImage(logo, 'JPG', xPosition, y, logoWidth, logoHeight);
        y += logoHeight + 10;
    } catch (err) {
        console.warn('Erro ao carregar logo:', err);
        showToast('Aviso: não foi possível carregar o logo no PDF.', 'warning');
        y += 10;
    }

    // Título
    doc.setFontSize(16);
    doc.text('Relatórios Administrativos', 10, y);
    y += 10;

    // Vendas
    doc.setFontSize(12);
    doc.text('Vendas por Período', 10, y);
    y += 5;
    const vendasRows = Array.from(vendasTabela.querySelectorAll('tbody tr')).map(tr => {
        const cols = tr.querySelectorAll('td');
        return [cols[0].textContent, cols[1].textContent, cols[2].textContent];
    });
    if (vendasRows.length > 0) {
        doc.autoTable({
            startY: y,
            head: [['Data', 'Total de Pedidos', 'Valor Total (R$)']],
            body: vendasRows
        });
        y = doc.lastAutoTable.finalY + 10;
    } else {
        doc.text('Nenhum dado disponível.', 10, y);
        y += 10;
    }

    // Produtos
    doc.text('Produtos Mais Vendidos', 10, y);
    y += 5;
    const produtosRows = Array.from(produtosTabela.querySelectorAll('tbody tr')).map(tr => {
        const cols = tr.querySelectorAll('td');
        return [cols[0].textContent, cols[1].textContent, cols[2].textContent, cols[3].textContent];
    });
    if (produtosRows.length > 0) {
        doc.autoTable({
            startY: y,
            head: [['Produto', 'Categoria', 'Quantidade Vendida', 'Valor Total (R$)']],
            body: produtosRows
        });
        y = doc.lastAutoTable.finalY + 10;
    } else {
        doc.text('Nenhum dado disponível.', 10, y);
        y += 10;
    }

    // Usuários
    doc.text('Usuários que Mais Compraram', 10, y);
    y += 5;
    const usuariosRows = Array.from(usuariosTabela.querySelectorAll('tbody tr')).map(tr => {
        const cols = tr.querySelectorAll('td');
        return [cols[0].textContent, cols[1].textContent, cols[2].textContent];
    });
    if (usuariosRows.length > 0) {
        doc.autoTable({
            startY: y,
            head: [['Usuário', 'Total de Pedidos', 'Valor Total (R$)']],
            body: usuariosRows
        });
        y = doc.lastAutoTable.finalY + 10;
    } else {
        doc.text('Nenhum dado disponível.', 10, y);
        y += 10;
    }

    // Categorias
    doc.text('Desempenho por Categoria', 10, y);
    y += 5;
    const categoriasRows = Array.from(categoriasTabela.querySelectorAll('tbody tr')).map(tr => {
        const cols = tr.querySelectorAll('td');
        return [cols[0].textContent, cols[1].textContent, cols[2].textContent, cols[3].textContent];
    });
    if (categoriasRows.length > 0) {
        doc.autoTable({
            startY: y,
            head: [['Categoria', 'Total de Pedidos', 'Total de Itens', 'Valor Total (R$)']],
            body: categoriasRows
        });
        y = doc.lastAutoTable.finalY + 10;
    } else {
        doc.text('Nenhum dado disponível.', 10, y);
        y += 10;
    }

    // Taxa de Cancelamento
    doc.text('Taxa de Cancelamento', 10, y);
    y += 5;
    const taxaTextContent = taxaText.innerHTML.replace(/<br>/g, '\n');
    doc.text(taxaTextContent, 10, y);

    // Salvar o PDF
    try {
        doc.save('relatorios.pdf');
        showToast('Relatórios exportados para PDF com sucesso!', 'success');
    } catch (err) {
        console.error('Erro ao exportar PDF:', err);
        showToast('Erro ao exportar relatórios para PDF.', 'error');
    }
}