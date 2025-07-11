document.addEventListener('DOMContentLoaded', () => {
    const perfilContent = document.getElementById('perfil-content');
    if (!perfilContent) {
        console.error('Elemento perfil-content não encontrado no DOM');
        showToast('Erro: contêiner de perfil não encontrado.', 'error');
        return;
    }
    carregarPerfil();
});

// Recupera o token de autenticação do localStorage
function getToken() {
    const token = localStorage.getItem('token');
    if (!token || typeof token !== 'string' || token.trim() === '') {
        console.error('Token inválido ou não encontrado.');
        return null;
    }
    return token;
}

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

// Formata uma data para exibição (ex.: 31/12/2023)
function formatarDataParaExibicao(data) {
    if (!data) return 'Não informado';
    try {
        const date = new Date(data);
        if (isNaN(date.getTime())) return 'Não informado';
        return date.toLocaleDateString('pt-BR');
    } catch {
        return 'Não informado';
    }
}

// Formata uma data para input HTML (ex.: 2023-12-31)
function formatarDataParaInput(data) {
    if (!data) return '';
    try {
        const date = new Date(data);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    } catch {
        return '';
    }
}

// Formata e valida um CPF (ex.: 123.456.789-01)
function formatarCPF(cpf) {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    if (!/^\d{11}$/.test(cleaned)) return '';
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Carrega e exibe as informações do perfil do administrador
function carregarPerfil() {
    const token = getToken();
    if (!token) {
        showToast('Sessão expirada. Redirecionando para login...', 'error');
        window.location.href = '../html/login.html';
        return;
    }

    fetch(`${API_URL}/perfil`, {
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
            const perfilContent = document.getElementById('perfil-content');
            if (!perfilContent) {
                console.error('Elemento perfil-content não encontrado após requisição');
                showToast('Erro: contêiner de perfil não encontrado.', 'error');
                return;
            }

            perfilContent.innerHTML = `
                <div class="perfil-card">
                    <h3><i class="fa-solid fa-user"></i> Perfil do Administrador</h3>
                    <button class="editar-perfil-btn" id="editar-perfil-btn" aria-label="Editar perfil">Editar Perfil</button>
                    <ul class="perfil-info" id="perfil-info">
                        <li data-field="nome"><i class="fa-solid fa-id-card"></i> <strong>Nome:</strong> <span>${data.perfil?.nome || 'Não informado'}</span></li>
                        <li data-field="email"><i class="fa-solid fa-envelope"></i> <strong>Email:</strong> <span>${data.email || 'Não informado'}</span></li>
                        <li data-field="cpf"><i class="fa-solid fa-address-card"></i> <strong>CPF:</strong> <span>${data.perfil?.cpf || 'Não informado'}</span></li>
                        <li data-field="data_nascimento"><i class="fa-solid fa-calendar-alt"></i> <strong>Data de Nascimento:</strong> <span>${formatarDataParaExibicao(data.perfil?.data_nascimento)}</span></li>
                        <li data-field="nome_rua"><i class="fa-solid fa-road"></i> <strong>Rua:</strong> <span>${data.perfil?.nome_rua || 'Não informado'}</span></li>
                        <li data-field="numero_casa"><i class="fa-solid fa-home"></i> <strong>Número:</strong> <span>${data.perfil?.numero_casa || 'Não informado'}</span></li>
                        <li data-field="bairro"><i class="fa-solid fa-map"></i> <strong>Bairro:</strong> <span>${data.perfil?.bairro || 'Não informado'}</span></li>
                        <li data-field="cidade"><i class="fa-solid fa-city"></i> <strong>Cidade:</strong> <span>${data.perfil?.cidade || 'Não informado'}</span></li>
                        <li data-field="UF"><i class="fa-solid fa-flag"></i> <strong>UF:</strong> <span>${data.perfil?.UF || 'Não informado'}</span></li>
                        <li data-field="contato1"><i class="fa-solid fa-phone"></i> <strong>Contato 1:</strong> <span>${data.perfil?.contato1 || 'Não informado'}</span></li>
                        <li data-field="contato2"><i class="fa-solid fa-mobile-alt"></i> <strong>Contato 2:</strong> <span>${data.perfil?.contato2 || 'Não informado'}</span></li>
                    </ul>
                    <button class="salvar-perfil-btn" id="salvar-perfil-btn" aria-label="Salvar alterações do perfil" style="display: none;">Salvar Alterações</button>
                </div>
            `;

            showToast('Perfil carregado com sucesso!', 'success');

            const editarBtn = document.getElementById('editar-perfil-btn');
            const salvarBtn = document.getElementById('salvar-perfil-btn');
            const perfilInfo = document.getElementById('perfil-info');

            if (!editarBtn || !salvarBtn || !perfilInfo) {
                console.error('Elementos do perfil não encontrados:', {
                    editarBtn: !!editarBtn,
                    salvarBtn: !!salvarBtn,
                    perfilInfo: !!perfilInfo
                });
                showToast('Erro: elementos do perfil não encontrados.', 'error');
                return;
            }

            editarBtn.addEventListener('click', () => {
                const isEditing = editarBtn.textContent === 'Editar Perfil';
                if (isEditing) {
                    perfilInfo.querySelectorAll('li').forEach(li => {
                        const field = li.getAttribute('data-field');
                        const span = li.querySelector('span');
                        let value = span.textContent === 'Não informado' ? '' : span.textContent;
                        const inputType = field === 'email' ? 'email' : field === 'data_nascimento' ? 'date' : field === 'numero_casa' ? 'number' : 'text';

                        if (field === 'data_nascimento') {
                            value = formatarDataParaInput(data.perfil?.data_nascimento);
                        }

                        li.innerHTML = `
                            <i class="fa-solid fa-${field === 'nome' ? 'id-card' : field === 'email' ? 'envelope' : field === 'cpf' ? 'address-card' : field === 'data_nascimento' ? 'calendar-alt' : field === 'nome_rua' ? 'road' : field === 'numero_casa' ? 'home' : field === 'bairro' ? 'map' : field === 'cidade' ? 'city' : field === 'UF' ? 'flag' : field === 'contato1' ? 'phone' : 'mobile-alt'}"></i>
                            <strong>${li.querySelector('strong').textContent}</strong>
                            <input type="${inputType}" value="${value}" data-original="${span.textContent}" aria-label="${li.querySelector('strong').textContent}">
                        `;
                    });
                    editarBtn.textContent = 'Cancelar';
                    salvarBtn.style.display = 'block';
                } else {
                    perfilInfo.querySelectorAll('li').forEach(li => {
                        const field = li.getAttribute('data-field');
                        const input = li.querySelector('input');
                        const originalValue = input.getAttribute('data-original') || 'Não informado';
                        const displayValue = field === 'data_nascimento' ? formatarDataParaExibicao(originalValue) : originalValue;
                        li.innerHTML = `
                            <i class="fa-solid fa-${field === 'nome' ? 'id-card' : field === 'email' ? 'envelope' : field === 'cpf' ? 'address-card' : field === 'data_nascimento' ? 'calendar-alt' : field === 'nome_rua' ? 'road' : field === 'numero_casa' ? 'home' : field === 'bairro' ? 'map' : field === 'cidade' ? 'city' : field === 'UF' ? 'flag' : field === 'contato1' ? 'phone' : 'mobile-alt'}"></i>
                            <strong>${li.querySelector('strong').textContent}</strong>
                            <span>${displayValue}</span>
                        `;
                    });
                    editarBtn.textContent = 'Editar Perfil';
                    salvarBtn.style.display = 'none';
                    showToast('Edição cancelada.', 'info');
                }
            });

            salvarBtn.addEventListener('click', () => {
                const updatedData = {
                    nome: perfilInfo.querySelector('li[data-field="nome"] input')?.value.trim() || '',
                    email: perfilInfo.querySelector('li[data-field="email"] input')?.value.trim() || '',
                    cpf: formatarCPF(perfilInfo.querySelector('li[data-field="cpf"] input')?.value.trim() || ''),
                    data_nascimento: perfilInfo.querySelector('li[data-field="data_nascimento"] input')?.value || '',
                    nome_rua: perfilInfo.querySelector('li[data-field="nome_rua"] input')?.value.trim() || '',
                    numero_casa: parseInt(perfilInfo.querySelector('li[data-field="numero_casa"] input')?.value) || 0,
                    bairro: perfilInfo.querySelector('li[data-field="bairro"] input')?.value.trim() || '',
                    cidade: perfilInfo.querySelector('li[data-field="cidade"] input')?.value.trim() || '',
                    UF: perfilInfo.querySelector('li[data-field="UF"] input')?.value.trim().toUpperCase() || '',
                    contato1: perfilInfo.querySelector('li[data-field="contato1"] input')?.value.trim() || '',
                    contato2: perfilInfo.querySelector('li[data-field="contato2"] input')?.value.trim() || '',
                };

                // Validações
                if (!updatedData.nome) {
                    showToast('Nome é obrigatório.', 'error');
                    return;
                }
                if (!updatedData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedData.email)) {
                    showToast('Email inválido.', 'error');
                    return;
                }
                if (!updatedData.cpf || !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(updatedData.cpf)) {
                    showToast('CPF inválido. Deve ter 11 dígitos no formato XXX.XXX.XXX-XX.', 'error');
                    return;
                }
                if (!updatedData.data_nascimento || isNaN(new Date(updatedData.data_nascimento).getTime())) {
                    showToast('Data de nascimento inválida.', 'error');
                    return;
                }
                if (new Date(updatedData.data_nascimento) >= new Date()) {
                    showToast('Data de nascimento não pode ser futura.', 'error');
                    return;
                }
                if (!updatedData.nome_rua || !updatedData.bairro || !updatedData.cidade || !updatedData.UF) {
                    showToast('Endereço completo (rua, bairro, cidade e UF) é obrigatório.', 'error');
                    return;
                }
                if (!/^[A-Z]{2}$/.test(updatedData.UF)) {
                    showToast('UF inválido. Deve ter 2 letras (ex.: SP).', 'error');
                    return;
                }
                if (!updatedData.contato1 || !/^\d{10,11}$/.test(updatedData.contato1.replace(/\D/g, ''))) {
                    showToast('Contato 1 inválido. Deve ter 10 ou 11 dígitos.', 'error');
                    return;
                }
                if (updatedData.contato2 && !/^\d{10,11}$/.test(updatedData.contato2.replace(/\D/g, ''))) {
                    showToast('Contato 2 inválido. Deve ter 10 ou 11 dígitos.', 'error');
                    return;
                }

                fetch(`${API_URL}/perfil`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedData)
                })
                    .then(response => {
                        if (!response.ok) {
                            if (response.status === 401 || response.status === 403) {
                                throw new Error('Sessão inválida. Faça login novamente.');
                            }
                            throw new Error(`Erro ao atualizar perfil: ${response.status} ${response.statusText}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.message && data.message.includes('Erro')) {
                            throw new Error(data.message);
                        }
                        showToast('Perfil atualizado com sucesso!', 'success');
                        carregarPerfil();
                    })
                    .catch(error => {
                        console.error('Erro ao atualizar perfil:', error);
                        showToast(`Erro ao atualizar perfil: ${error.message}`, 'error');
                        if (error.message.includes('Sessão inválida')) {
                            window.location.href = '../html/login.html';
                        }
                        carregarPerfil();
                    });
            });
        })
        .catch(error => {
            console.error('Erro ao carregar perfil:', error);
            const perfilContent = document.getElementById('perfil-content');
            if (perfilContent) {
                perfilContent.innerHTML = `<p>Erro ao carregar perfil: ${error.message}</p>`;
            }
            showToast(`Erro ao carregar perfil: ${error.message}`, 'error');
            if (error.message.includes('Sessão inválida')) {
                window.location.href = '../html/login.html';
            }
        });
}