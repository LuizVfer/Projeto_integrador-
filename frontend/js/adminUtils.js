// js/utils.js
function getToken() {
    return localStorage.getItem('token');
}

function formatarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return cpf;
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

function formatarDataParaInput(data) {
    if (!data || data === 'Não informado') return '';
    const date = new Date(data);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatarDataParaExibicao(data) {
    if (!data || data === 'Não informado') return 'Não informado';
    return new Date(data).toLocaleDateString('pt-BR');
}