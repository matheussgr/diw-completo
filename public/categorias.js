// categorias.js

document.addEventListener("DOMContentLoaded", async () => {
    const BASE_URL = 'http://localhost:3000'; // Mesma URL do seu JSON Server

    const categoryButtonsContainer = document.getElementById('category-buttons-container');
    const filteredMoviesContainer = document.getElementById('filtered-movies-container');
    const noMoviesInCategoryMessage = document.getElementById('no-movies-in-category-message');

    let allFilmes = []; // Para armazenar todos os filmes e facilitar a filtragem

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

    // --- Funções de Favorito (Copias EXATAS do app.js para consistência) ---
    async function updateFavoriteStatus(filmeId, isFavorite) {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            alert("Você precisa estar logado para favoritar um filme!");
            window.location.href = 'app_login/login.html';
            return;
        }

        let userFavorites = new Set(currentUser.favoritos ? currentUser.favoritos.map(String) : []); 

        if (isFavorite) {
            userFavorites.add(filmeId);
        } else {
            userFavorites.delete(filmeId);
        }

        const updatedFavorites = Array.from(userFavorites);

        try {
            const response = await fetch(`${BASE_URL}/usuarios/${currentUser.id}`, { 
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ favoritos: updatedFavorites })
            });

            if (!response.ok) {
                throw new Error(`Erro ao atualizar favoritos: ${response.status}`);
            }

            const updatedUser = await response.json();
            saveCurrentUser(updatedUser); 
            // Re-renderiza os filmes da categoria atual para atualizar o ícone
            const activeCategoryButton = document.querySelector('.category-button.active');
            if (activeCategoryButton) {
                filterMoviesByCategory(activeCategoryButton.textContent);
            } else {
                displayAllMovies(); // Se nenhuma categoria estiver ativa, exibe todos (padrão)
            }
        } catch (error) {
            console.error('Erro ao atualizar favoritos:', error);
            alert('Não foi possível atualizar seus favoritos. Tente novamente.');
        }
    }

    // --- Criação do Card de Filme (Copia EXATA do app.js) ---
    function createFilmeCard(filme, currentUser, userFavorites) {
        let card = document.createElement("div");
        card.classList.add("col-6", "col-md-3", "mb-4"); // Note: removed lista-filmes-item, if it only relates to Home

        const isFavorite = currentUser && userFavorites.has(filme.id);
        const favoriteIconClass = isFavorite ? 'bi-heart-fill text-danger' : 'bi-heart';
        
        const favoriteButtonHtml = currentUser ?
            `<button class="btn btn-sm favorite-btn position-absolute top-0 end-0 m-2" data-filme-id="${filme.id}" data-is-favorite="${isFavorite}" style="background-color: rgba(0,0,0,0.5); border-radius: 50%;">
                <i class="bi ${favoriteIconClass} fs-5"></i>
            </button>` : '';

        card.innerHTML = `
            <div class="card bg-dark text-white h-100 position-relative"> 
                <img src="${filme.imagem}" class="card-img-top" alt="${filme.titulo}" style="height: 350px; object-fit: cover;"> 
                ${favoriteButtonHtml} 
                <div class="card-body d-flex flex-column justify-content-between text-center">
                    <h5 class="card-title">${filme.titulo}</h5>
                    <div>
                        <button class="btn btn-warning mb-2">
                            <a href="detalhes.html?id=${filme.id}" class="text-white text-decoration-none">Saiba Mais</a>
                        </button>
                    </div>
                </div>
            </div>
        `;
        return card;
    }


    // --- Lógica da Página de Categorias ---

    // Carrega todas as categorias e cria os botões
    async function loadCategoriesAndButtons() {
        try {
            const response = await fetch(`${BASE_URL}/filmes`);
            if (!response.ok) {
                throw new Error(`Erro ao buscar filmes para categorias: ${response.status}`);
            }
            allFilmes = await response.json(); // Salva todos os filmes

            const categories = new Set();
            allFilmes.forEach(filme => {
                if (filme.categoria) {
                    categories.add(filme.categoria.trim());
                }
            });

            // Adiciona um botão "Todos"
            const allButton = document.createElement('button');
            allButton.classList.add('category-button', 'active'); // 'Todos' começa ativo
            allButton.textContent = 'Todos';
            allButton.addEventListener('click', () => {
                setActiveCategoryButton(allButton);
                displayAllMovies();
            });
            categoryButtonsContainer.appendChild(allButton);


            Array.from(categories).sort().forEach(category => {
                const button = document.createElement('button');
                button.classList.add('category-button');
                button.textContent = category;
                button.addEventListener('click', () => {
                    setActiveCategoryButton(button);
                    filterMoviesByCategory(category);
                });
                categoryButtonsContainer.appendChild(button);
            });

            // Exibe todos os filmes por padrão ao carregar a página
            displayAllMovies();

        } catch (error) {
            console.error('Erro ao carregar categorias e filmes:', error);
            categoryButtonsContainer.innerHTML = '<p class="text-danger">Não foi possível carregar as categorias.</p>';
            filteredMoviesContainer.innerHTML = '<p class="text-danger text-center">Não foi possível carregar os filmes.</p>';
        }
    }

    // Define qual botão de categoria está ativo
    function setActiveCategoryButton(activeButton) {
        document.querySelectorAll('.category-button').forEach(button => {
            button.classList.remove('active');
        });
        activeButton.classList.add('active');
    }

    // Exibe todos os filmes
    function displayAllMovies() {
        renderMovies(allFilmes);
    }

    // Filtra e exibe filmes por categoria
    function filterMoviesByCategory(category) {
        const filteredFilmes = allFilmes.filter(filme => 
            filme.categoria && filme.categoria.trim().toLowerCase() === category.toLowerCase()
        );
        renderMovies(filteredFilmes);
    }

    // Renderiza os filmes em filteredMoviesContainer
    function renderMovies(moviesToDisplay) {
        const currentUser = getCurrentUser();
        const userFavorites = new Set(currentUser && currentUser.favoritos ? currentUser.favoritos.map(String) : []);

        filteredMoviesContainer.innerHTML = ''; // Limpa antes de renderizar
        noMoviesInCategoryMessage.classList.add('d-none'); // Oculta a mensagem de sem filmes

        if (moviesToDisplay.length === 0) {
            noMoviesInCategoryMessage.classList.remove('d-none');
            return;
        }

        moviesToDisplay.forEach(filme => {
            const card = createFilmeCard(filme, currentUser, userFavorites);
            filteredMoviesContainer.appendChild(card);
        });

        // Adicionar event listeners aos botões de favorito após a renderização
        document.querySelectorAll('.favorite-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const filmeId = event.currentTarget.dataset.filmeId;
                const isCurrentlyFavorite = event.currentTarget.dataset.isFavorite === 'true';
                await updateFavoriteStatus(filmeId, !isCurrentlyFavorite);
            });
        });
    }


    // --- Inicialização da Página ---
    updateHeader(); // Atualiza o cabeçalho
    loadCategoriesAndButtons(); // Carrega as categorias e exibe os filmes
});