document.addEventListener("DOMContentLoaded", async function () {
    const BASE_URL = 'http://localhost:3000';
    const telaDetalhes = document.getElementById('tela');
    const params = new URLSearchParams(location.search);
    const filmeId = parseInt(params.get('id'));

    // Elementos do cabeçalho (AJUSTADOS para o novo HTML sem ícones duplicados)
    const linkFavoritos = document.getElementById("link-favoritos");
    const linkAuth = document.getElementById("link-auth");
    const linkCadastroItens = document.getElementById("link-cadastro-itens");

    // --- Funções de Autenticação e Perfil de Usuário ---
    function getCurrentUser() {
        try {
            const user = sessionStorage.getItem('currentUser');
            return user ? JSON.parse(user) : null;
        } catch (e) {
            console.error("Erro ao ler currentUser do sessionStorage:", e);
            return null;
        }
    }

    function saveCurrentUser(user) {
        try {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
        } catch (e) {
            console.error("Erro ao salvar currentUser no sessionStorage:", e);
        }
    }

    function removeCurrentUser() {
        sessionStorage.removeItem('currentUser');
    }

    async function updateFavoriteStatus(targetFilmeId, isFavorite) {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            alert("Você precisa estar logado para favoritar um filme!");
            // Ajustado caminho relativo para a página de login
            window.location.href = './app_login/login.html'; 
            return;
        }

        // Garante que favoritos seja um array para evitar erros
        let userFavorites = new Set(currentUser.favoritos ? currentUser.favoritos : []);

        if (isFavorite) {
            userFavorites.add(targetFilmeId);
        } else {
            userFavorites.delete(targetFilmeId);
        }

        const updatedFavorites = Array.from(userFavorites);

        try {
            // **IMPORTANTE**: Usando /usuarios/ para corresponder ao seu db.json
            const response = await fetch(`${BASE_URL}/usuarios/${currentUser.id}`, { 
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ favoritos: updatedFavorites })
            });

            if (!response.ok) {
                throw new Error(`Erro ao atualizar favoritos: ${response.status}`);
            }

            const updatedUser = await response.json();
            saveCurrentUser(updatedUser); // Atualiza o usuário no sessionStorage
            renderFilmeDetails(await fetchFilmeDetails(targetFilmeId)); // Re-renderiza para atualizar o ícone
        } catch (error) {
            console.error('Erro ao atualizar favoritos:', error);
            alert('Não foi possível atualizar seus favoritos. Tente novamente.');
        }
    }

    // --- Gerenciamento do Cabeçalho (AJUSTADO para o novo HTML) ---
    function updateHeader() {
        const currentUser = getCurrentUser();

        // Oculta todos por padrão e define o estado de não logado
        if (linkFavoritos) linkFavoritos.classList.add('d-none');
        if (linkCadastroItens) linkCadastroItens.classList.add('d-none');
        
        if (linkAuth) {
            linkAuth.textContent = 'Login/Registrar';
            linkAuth.href = './app_login/login.html'; // Ajustado caminho relativo
            linkAuth.onclick = null; // Garante que não haja handler de logout se não estiver logado
        }

        if (currentUser) {
            // Usuário logado
            if (linkFavoritos) linkFavoritos.classList.remove('d-none'); // Mostra o link de favoritos
            
            if (linkAuth) {
                linkAuth.textContent = 'Logout'; // Altera o texto para Logout
                linkAuth.href = '#'; // Define href como '#' para ser tratado pelo JS
                linkAuth.onclick = handleLogout; // Adiciona listener para logout
            }

            if (currentUser.isAdmin && linkCadastroItens) {
                linkCadastroItens.classList.remove('d-none'); // Mostra o link de cadastro se for admin
            }
        }
        // Se não houver currentUser, os elementos permanecem ocultos ou no estado inicial
    }

    function handleLogout(event) {
        event.preventDefault();
        if (confirm("Tem certeza que deseja sair?")) {
            removeCurrentUser();
            updateHeader();
            alert("Você foi desconectado.");
            window.location.reload(); 
        }
    }

    // --- Funções de Busca e Renderização dos Detalhes do Filme ---

    async function fetchFilmeDetails(id) {
        try {
            const response = await fetch(`${BASE_URL}/filmes/${id}`);
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Ocorreu um erro ao buscar os detalhes do filme:', error);
            if (telaDetalhes) telaDetalhes.innerHTML = '<h1 class="text-center text-danger">Erro ao Carregar Detalhes do Filme</h1>';
            return null;
        }
    }

    function renderFilmeDetails(filme) {
        if (!filme) {
            if (telaDetalhes) telaDetalhes.innerHTML = '<h1 class="text-center text-danger">Filme Não Encontrado</h1>';
            return;
        }

        const currentUser = getCurrentUser();
        // Garante que currentUser.favoritos é um array, mesmo que null/undefined
        const isFavorite = currentUser && Array.isArray(currentUser.favoritos) && currentUser.favoritos.includes(filme.id);
        const favoriteIconClass = isFavorite ? 'bi-heart-fill text-danger' : 'bi-heart'; // Coração preenchido/vermelho ou vazado
        const favoriteButtonHtml = currentUser ?
            `<button id="favorite-detail-btn" class="btn btn-warning mb-2" data-filme-id="${filme.id}" data-is-favorite="${isFavorite}">
                Favoritar <i class="bi ${favoriteIconClass}"></i>
            </button>` : ''; // Botão de favorito só aparece se logado


        if (telaDetalhes) {
            telaDetalhes.innerHTML = `
                <section class="hero" style="background: url('${filme.fundo}') no-repeat center; background-size: cover;">
                    <div style="position:absolute; inset:0; background:rgba(0,0,0,0.7); z-index:0;"></div>
                    <div class="container hero-content position-relative z-1 text-white py-5">
                        <div class="row justify-content-center align-items-center mt-5">
                            <div class="col-md-4 mb-4 text-center">
                                <img src="${filme.imagem}" alt="${filme.titulo}" class="img-fluid rounded shadow">
                            </div>
                            <div class="col-md-6 mb-4 ps-md-5">
                                <h1 class="movie-title text-white fw-bold">${filme.titulo}</h1>
                                <p class="text-warning fw-bold fs-5">${filme.categoria} | ${filme.tempo} | ${filme.ano}</p>
                                <p class="text-light" style="text-align: justify;">${filme.descricao}</p>
                                <div class="actions text-center mt-4">
                                    ${favoriteButtonHtml}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            `;
        }

        // Adicionar event listener ao botão de favorito
        if (currentUser) {
            const favoriteBtn = document.getElementById('favorite-detail-btn');
            if (favoriteBtn) {
                favoriteBtn.addEventListener('click', async (event) => {
                    const isCurrentlyFavorite = event.currentTarget.dataset.isFavorite === 'true';
                    await updateFavoriteStatus(filme.id, !isCurrentlyFavorite);
                });
            }
        }
    }

    // --- Inicialização da página de Detalhes ---

    updateHeader(); // Atualiza o cabeçalho ao carregar a página de detalhes

    if (filmeId) {
        const filme = await fetchFilmeDetails(filmeId);
        renderFilmeDetails(filme);
    } else {
        if (telaDetalhes) telaDetalhes.innerHTML = '<h1 class="text-center text-danger">ID do Filme Inválido</h1>';
    }
});