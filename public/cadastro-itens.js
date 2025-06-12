// cadastro-itens.js

document.addEventListener("DOMContentLoaded", async () => {
    const BASE_URL = 'http://localhost:3000'; // URL base do seu JSON Server

    // Elementos do DOM
    const adminContent = document.getElementById('admin-content');
    const noAdminAccessMessage = document.getElementById('no-admin-access');
    const filmeForm = document.getElementById('filme-form');
    const filmeIdInput = document.getElementById('filme-id');
    const tituloInput = document.getElementById('titulo');
    const categoriaInput = document.getElementById('categoria');
    const descricaoInput = document.getElementById('descricao');
    const imagemInput = document.getElementById('imagem');
    const fundoInput = document.getElementById('fundo');
    const tempoInput = document.getElementById('tempo');
    const anoInput = document.getElementById('ano');
    const secaoSelect = document.getElementById('secao');
    const destaqueCheckbox = document.getElementById('destaque');
    const filmesTableBody = document.getElementById('filmes-table-body');
    const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');

    // Elementos do cabeçalho (para updateHeader)
    const linkFavoritos = document.getElementById("link-favoritos");
    const linkAuth = document.getElementById("link-auth");
    const linkCadastroItens = document.getElementById("link-cadastro-itens");

    // --- Funções de Autenticação (Copias EXATAS do app.js para consistência) ---
    function getCurrentUser() {
        try {
            const user = sessionStorage.getItem('currentUser');
            return user ? JSON.parse(user) : null;
        } catch (e) {
            console.error("Erro ao ler currentUser do sessionStorage:", e);
            return null;
        }
    }

    function saveCurrentUser(user) { /* Não usado diretamente aqui, mas manter por consistência */
        try {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
        } catch (e) {
            console.error("Erro ao salvar currentUser no sessionStorage:", e);
        }
    }

    function removeCurrentUser() {
        sessionStorage.removeItem('currentUser');
    }

    // --- Gerenciamento do Cabeçalho e Login/Logout (Copias EXATAS do app.js para consistência) ---
    function updateHeader() {
        const currentUser = getCurrentUser();

        if (linkFavoritos) linkFavoritos.classList.add('d-none');
        if (linkCadastroItens) linkCadastroItens.classList.add('d-none');

        if (linkAuth) {
            linkAuth.textContent = 'Login/Registrar';
            linkAuth.href = 'app_login/login.html';
            linkAuth.onclick = null;
        }

        if (currentUser) {
            if (linkFavoritos) linkFavoritos.classList.remove('d-none');
            
            if (linkAuth) {
                linkAuth.textContent = 'Logout';
                linkAuth.href = '#';
                linkAuth.onclick = handleLogout;
            }

            if (currentUser.isAdmin && linkCadastroItens) {
                linkCadastroItens.classList.remove('d-none');
            }
        }
    }

    function handleLogout(event) {
        event.preventDefault();
        if (confirm("Tem certeza que deseja sair?")) {
            removeCurrentUser();
            alert("Você foi desconectado.");
            window.location.href = 'app_login/login.html';
        }
    }

    // --- Lógica CRUD de Filmes ---

    // Gera um ID único para novos filmes (se JSON Server não gerar automaticamente)
    function generateUniqueId() {
        return Date.now().toString(); // Simplesmente um timestamp, para IDs como string
    }

    // Carrega e exibe os filmes na tabela
    async function loadFilmes() {
        try {
            const response = await fetch(`${BASE_URL}/filmes`);
            if (!response.ok) {
                throw new Error(`Erro ao buscar filmes: ${response.status}`);
            }
            const filmes = await response.json();
            
            filmesTableBody.innerHTML = ''; // Limpa a tabela antes de preencher

            if (filmes.length === 0) {
                filmesTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nenhum filme cadastrado.</td></tr>';
                return;
            }

            filmes.forEach(filme => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${filme.id}</td>
                    <td>${filme.titulo}</td>
                    <td>${filme.categoria || ''}</td>
                    <td>${filme.destaque ? '<i class="bi bi-check-circle-fill text-success"></i> Sim' : '<i class="bi bi-x-circle-fill text-danger"></i> Não'}</td>
                    <td>${filme.secao || ''}</td>
                    <td class="text-center">
                        <button class="btn btn-warning btn-sm me-2 btn-edit" data-id="${filme.id}"><i class="bi bi-pencil-fill"></i> Editar</button>
                        <button class="btn btn-danger btn-sm btn-delete" data-id="${filme.id}"><i class="bi bi-trash-fill"></i> Excluir</button>
                    </td>
                `;
                filmesTableBody.appendChild(row);
            });

            // Adiciona event listeners aos botões de editar e excluir
            document.querySelectorAll('.btn-edit').forEach(button => {
                button.addEventListener('click', (e) => editFilme(e.target.dataset.id));
            });
            document.querySelectorAll('.btn-delete').forEach(button => {
                button.addEventListener('click', (e) => deleteFilme(e.target.dataset.id));
            });

        } catch (error) {
            console.error('Erro ao carregar filmes para a tabela:', error);
            filmesTableBody.innerHTML = '<tr><td colspan="6" class="text-danger text-center">Erro ao carregar filmes.</td></tr>';
        }
    }

    // Salvar ou Atualizar filme
    filmeForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const filmeId = filmeIdInput.value;
        const newFilme = {
            titulo: tituloInput.value,
            categoria: categoriaInput.value,
            descricao: descricaoInput.value,
            imagem: imagemInput.value,
            fundo: fundoInput.value,
            tempo: tempoInput.value,
            ano: anoInput.value ? parseInt(anoInput.value) : null, // Converte para número
            secao: secaoSelect.value,
            destaque: destaqueCheckbox.checked
        };

        try {
            let response;
            if (filmeId) {
                // Atualizar filme existente
                response = await fetch(`${BASE_URL}/filmes/${filmeId}`, {
                    method: 'PUT', // PUT para substituir o recurso inteiro
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newFilme)
                });
            } else {
                // Adicionar novo filme
                newFilme.id = generateUniqueId(); // Gera um ID para o novo filme
                response = await fetch(`${BASE_URL}/filmes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newFilme)
                });
            }

            if (!response.ok) {
                throw new Error(`Erro ao salvar filme: ${response.status}`);
            }

            alert('Filme salvo com sucesso!');
            filmeForm.reset(); // Limpa o formulário
            filmeIdInput.value = ''; // Limpa o ID oculto
            btnCancelarEdicao.style.display = 'none'; // Oculta o botão de cancelar
            loadFilmes(); // Recarrega a tabela
        } catch (error) {
            console.error('Erro ao salvar filme:', error);
            alert('Não foi possível salvar o filme. Tente novamente.');
        }
    });

    // Preenche o formulário para edição
    async function editFilme(id) {
        try {
            const response = await fetch(`${BASE_URL}/filmes/${id}`);
            if (!response.ok) {
                throw new Error(`Filme não encontrado: ${response.status}`);
            }
            const filme = await response.json();

            filmeIdInput.value = filme.id;
            tituloInput.value = filme.titulo;
            categoriaInput.value = filme.categoria || '';
            descricaoInput.value = filme.descricao || '';
            imagemInput.value = filme.imagem || '';
            fundoInput.value = filme.fundo || '';
            tempoInput.value = filme.tempo || '';
            anoInput.value = filme.ano || '';
            secaoSelect.value = filme.secao || '';
            destaqueCheckbox.checked = filme.destaque || false;

            btnCancelarEdicao.style.display = 'inline-block'; // Mostra o botão de cancelar
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Rola para o topo do formulário
        } catch (error) {
            console.error('Erro ao buscar filme para edição:', error);
            alert('Não foi possível carregar o filme para edição.');
        }
    }

    // Cancelar edição
    btnCancelarEdicao.addEventListener('click', () => {
        filmeForm.reset();
        filmeIdInput.value = '';
        btnCancelarEdicao.style.display = 'none';
    });

    // Excluir filme
    async function deleteFilme(id) {
        if (!confirm('Tem certeza que deseja excluir este filme?')) {
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/filmes/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Erro ao excluir filme: ${response.status}`);
            }

            alert('Filme excluído com sucesso!');
            loadFilmes(); // Recarrega a tabela
        } catch (error) {
            console.error('Erro ao excluir filme:', error);
            alert('Não foi possível excluir o filme. Tente novamente.');
        }
    }


    // --- Inicialização da Página ---
    
    // Verifica a permissão do usuário ao carregar a página
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.isAdmin) {
        // Usuário não logado ou não é admin
        adminContent.classList.add('d-none'); // Esconde o conteúdo de admin
        noAdminAccessMessage.classList.remove('d-none'); // Mostra a mensagem de acesso negado
        // Esconde o link de cadastro de itens no cabeçalho também (se já não estiver oculto)
        if (linkCadastroItens) linkCadastroItens.classList.add('d-none');
    } else {
        // Usuário é admin, mostra o conteúdo
        adminContent.classList.remove('d-none');
        noAdminAccessMessage.classList.add('d-none');
        loadFilmes(); // Carrega os filmes para a tabela
    }

    updateHeader(); // Atualiza o cabeçalho
});