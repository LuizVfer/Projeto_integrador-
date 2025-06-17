// js/profile.js
function carregarPerfil() {
    const token = getToken();
    fetch(`${API_URL}/perfil`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(response => response.json())
        .then(data => {
            const perfilContent = document.getElementById('perfil-content');
            perfilContent.innerHTML = `
            <div class="perfil-card">
                <h3><i class="fa-solid fa-user"></i> Perfil do Administrador</h3>
                <button class="editar-perfil-btn" id="editar-perfil-btn" aria-label="Editar perfil">Editar Perfil</button>
                <ul class="perfil-info" id="perfil-info">
                    <li data-field="nome"><i class="fa-solid fa-id-card"></i> <strong>Nome:</strong> <span>${data.perfil.nome || 'Não informado'}</span></li>
                    <li data-field="email"><i class="fa-solid fa-envelope"></i> <strong>Email:</strong> <span>${data.email || 'Não informado'}</span></li>
                    <li data-field="cpf"><i class="fa-solid fa-address-card"></i> <strong>CPF:</strong> <span>${data.perfil.cpf || 'Não informado'}</span></li>
                    <li data-field="data_nascimento"><i class="fa-solid fa-calendar-alt"></i> <strong>Data de Nascimento:</strong> <span>${formatarDataParaExibicao(data.perfil.data_nascimento)}</span></li>
                    <li data-field="nome_rua"><i class="fa-solid fa-road"></i> <strong>Rua:</strong> <span>${data.perfil.nome_rua || 'Não informado'}</span></li>
                    <li data-field="numero_casa"><i class="fa-solid fa-home"></i> <strong>Número:</strong> <span>${data.perfil.numero_casa || 'Não informado'}</span></li>
                    <li data-field="bairro"><i class="fa-solid fa-map"></i> <strong>Bairro:</strong> <span>${data.perfil.bairro || 'Não informado'}</span></li>
                    <li data-field="cidade"><i class="fa-solid fa-city"></i> <strong>Cidade:</strong> <span>${data.perfil.cidade || 'Não informado'}</span></li>
                    <li data-field="UF"><i class="fa-solid fa-flag"></i> <strong>UF:</strong> <span>${data.perfil.UF || 'Não informado'}</span></li>
                    <li data-field="contato1"><i class="fa-solid fa-phone"></i> <strong>Contato 1:</strong> <span>${data.perfil.contato1 || 'Não informado'}</span></li>
                    <li data-field="contato2"><i class="fa-solid fa-mobile-alt"></i> <strong>Contato 2:</strong> <span>${data.perfil.contato2 || 'Não informado'}</span></li>
                </ul>
                <button class="salvar-perfil-btn" id="salvar-perfil-btn" aria-label="Salvar alterações do perfil">Salvar Alterações</button>
            </div>
        `;

            const editarBtn = document.getElementById('editar-perfil-btn');
            const salvarBtn = document.getElementById('salvar-perfil-btn');
            const perfilInfo = document.getElementById('perfil-info');

            editarBtn.addEventListener('click', () => {
                const isEditing = editarBtn.textContent === 'Editar Perfil';
                if (isEditing) {
                    perfilInfo.querySelectorAll('li').forEach(li => {
                        const field = li.getAttribute('data-field');
                        const span = li.querySelector('span');
                        let value = span.textContent === 'Não informado' ? '' : span.textContent;
                        const inputType = field === 'email' ? 'email' : field === 'data_nascimento' ? 'date' : field === 'numero_casa' ? 'number' : 'text';

                        if (field === 'data_nascimento') {
                            value = formatarDataParaInput(data.perfil.data_nascimento);
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
                }
            });

            salvarBtn.addEventListener('click', () => {
                const updatedData = {
                    nome: perfilInfo.querySelector('li[data-field="nome"] input')?.value || '',
                    email: perfilInfo.querySelector('li[data-field="email"] input')?.value || '',
                    cpf: formatarCPF(perfilInfo.querySelector('li[data-field="cpf"] input')?.value || ''),
                    data_nascimento: perfilInfo.querySelector('li[data-field="data_nascimento"] input')?.value || '',
                    nome_rua: perfilInfo.querySelector('li[data-field="nome_rua"] input')?.value || '',
                    numero_casa: perfilInfo.querySelector('li[data-field="numero_casa"] input')?.value || 0,
                    bairro: perfilInfo.querySelector('li[data-field="bairro"] input')?.value || '',
                    cidade: perfilInfo.querySelector('li[data-field="cidade"] input')?.value || '',
                    UF: perfilInfo.querySelector('li[data-field="UF"] input')?.value || '',
                    contato1: perfilInfo.querySelector('li[data-field="contato1"] input')?.value || '',
                    contato2: perfilInfo.querySelector('li[data-field="contato2"] input')?.value || '',
                };

                if (!updatedData.cpf) {
                    alert('CPF é obrigatório');
                    return;
                }
                if (!updatedData.data_nascimento) {
                    alert('Data de nascimento é obrigatória');
                    return;
                }
                if (!updatedData.nome_rua || !updatedData.bairro || !updatedData.cidade || !updatedData.UF) {
                    alert('Endereço completo (rua, bairro, cidade e UF) é obrigatório');
                    return;
                }
                if (!updatedData.contato1) {
                    alert('Contato 1 é obrigatório');
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
                    .then(response => response.json())
                    .then(data => {
                        if (data.message.includes('Erro')) throw new Error(data.message);
                        alert('Perfil atualizado com sucesso!');
                        carregarPerfil();
                    })
                    .catch(error => {
                        console.error('Erro ao atualizar perfil:', error);
                        alert(`Erro ao atualizar perfil: ${error.message}`);
                        carregarPerfil();
                    });
            });
        })
        .catch(error => {
            console.error('Erro ao carregar perfil:', error);
            document.getElementById('perfil-content').innerHTML = '<p>Erro ao carregar perfil.</p>';
        });
}