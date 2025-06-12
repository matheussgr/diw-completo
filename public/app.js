// app.js

document.addEventListener("DOMContentLoaded", () => {
    // --- Configurações Iniciais ---
    const BASE_URL = 'http://localhost:3000'; // URL base do seu JSON Server

    // Elementos do DOM para manipulação
    const filmesContainers = [
        document.getElementById("filmes-container-1"),
        document.getElementById("filmes-container-2"),
        document.getElementById("filmes-container-3")
    ];
    const searchInput = document.getElementById("search-input");
    const searchForm = document.getElementById("search-form");

    // Elementos do cabeçalho
    const linkFavoritos = document.getElementById("link-favoritos");
    const linkAuth = document.getElementById("link-auth");
    const linkCadastroItens = document.getElementById("link-cadastro-itens");

    // Elementos de título e carrossel para controlar a visibilidade na busca
    const destaquesTituloContainer = document.getElementById("destaques-titulo-container");
    const carouselDestaques = document.getElementById("carouselDestaques");
    const tituloLancamentos = document.getElementById("titulo-lancamentos");
    const tituloRecomendados = document.getElementById("titulo-recomendados");
    const tituloValeAPena = document.getElementById("titulo-vale-a-pena");

    let allFilmes = []; // Armazenará todos os filmes para a funcionalidade de pesquisa
    let myChartInstance; // Variável para armazenar a instância do Chart.js

    // --- Funções de Autenticação e Perfil de Usuário ---

    // Obtém o usuário logado do sessionStorage
    function getCurrentUser() {
        try {
            const user = sessionStorage.getItem('currentUser');
            return user ? JSON.parse(user) : null;
        } catch (e) {
            console.error("Erro ao ler currentUser do sessionStorage:", e);
            return null;
        }
    }

    // Salva o usuário logado no sessionStorage
    function saveCurrentUser(user) {
        try {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
        } catch (e) {
            console.error("Erro ao salvar currentUser no sessionStorage:", e);
        }
    }

    // Remove o usuário do sessionStorage (logout)
    function removeCurrentUser() {
        sessionStorage.removeItem('currentUser');
    }

    // Atualiza o status de favorito de um filme para o usuário logado
    async function updateFavoriteStatus(filmeId, isFavorite) {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            alert("Você precisa estar logado para favoritar um filme!");
            window.location.href = 'app_login/login.html'; // Redireciona para a página de login
            return;
        }

        // Garante que favoritos seja um array para evitar erros e converte para Set de Strings para consistência de ID
        let userFavorites = new Set(currentUser.favoritos ? currentUser.favoritos.map(String) : []); 

        if (isFavorite) {
            userFavorites.add(filmeId);
        } else {
            userFavorites.delete(filmeId);
        }

        const updatedFavorites = Array.from(userFavorites);

        try {
            // Requisição PATCH para atualizar apenas o campo 'favoritos' do usuário no JSON Server
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
            saveCurrentUser(updatedUser); // Atualiza o usuário no sessionStorage com os novos favoritos
            renderFilmes(allFilmes); // Re-renderiza os filmes para atualizar os ícones de coração
        } catch (error) {
            console.error('Erro ao atualizar favoritos:', error);
            alert('Não foi possível atualizar seus favoritos. Tente novamente.');
        }
    }

    // --- Gerenciamento do Cabeçalho e Login/Logout ---

    // Atualiza a visibilidade dos links do cabeçalho com base no status de login
    function updateHeader() {
        const currentUser = getCurrentUser();

        // Oculta links por padrão e define o estado de não logado
        if (linkFavoritos) linkFavoritos.classList.add('d-none');
        if (linkCadastroItens) linkCadastroItens.classList.add('d-none');

        if (linkAuth) {
            linkAuth.textContent = 'Login/Registrar';
            linkAuth.href = 'app_login/login.html'; // Caminho para a página de login
            linkAuth.onclick = null; // Remove handler de logout se não estiver logado
        }

        if (currentUser) {
            // Usuário logado
            if (linkFavoritos) linkFavoritos.classList.remove('d-none'); // Mostra o link de favoritos
            
            if (linkAuth) {
                linkAuth.textContent = 'Logout'; // Altera o texto para Logout
                linkAuth.href = '#'; // Define href como '#' para ser tratado pelo JS
                linkAuth.onclick = handleLogout; // Adiciona listener para logout
            }

            // Verifica se o usuário é administrador
            if (currentUser.isAdmin && linkCadastroItens) {
                linkCadastroItens.classList.remove('d-none'); // Mostra o link de cadastro se for admin
            }
        }
    }

    // Lida com a ação de logout
    function handleLogout(event) {
        event.preventDefault(); // Impede o comportamento padrão do link
        if (confirm("Tem certeza que deseja sair?")) {
            removeCurrentUser(); // Remove o usuário da sessão
            alert("Você foi desconectado.");
            window.location.href = 'app_login/login.html'; // Redireciona para a página de login
        }
    }

    // --- Renderização de Filmes (Cards e Carrossel) ---

    // Cria o HTML de um card de filme
    function createFilmeCard(filme, currentUser, userFavorites) {
        let card = document.createElement("div");
        card.classList.add("col-6", "col-md-3", "lista-filmes-item", "mb-4");

        const isFavorite = currentUser && userFavorites.has(filme.id); // Verifica se é favorito apenas se logado
        const favoriteIconClass = isFavorite ? 'bi-heart-fill text-danger' : 'bi-heart'; // Coração preenchido/vazado
        
        // O botão de favorito só aparece se o usuário estiver logado
        // E AGORA ESTÁ POSICIONADO NO CANTO SUPERIOR DIREITO DA IMAGEM
        const favoriteButtonHtml = currentUser ?
            `<button class="btn btn-sm favorite-btn position-absolute top-0 end-0 m-2" data-filme-id="${filme.id}" data-is-favorite="${isFavorite}" style="background-color: rgba(0,0,0,0.5); border-radius: 50%;">
                <i class="bi ${favoriteIconClass} fs-5"></i>
            </button>` : '';

        card.innerHTML = `
            <div class="card bg-dark text-white h-100 position-relative"> 
                <img src="${filme.imagem}" class="card-img-top lista-filmes-item-imagem" alt="${filme.titulo}" style="height: 450px; object-fit: cover;">
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

    // Renderiza os filmes nos containers apropriados (cards)
    function renderFilmes(filmesToDisplay) {
        const currentUser = getCurrentUser();
        // userFavorites deve ser um Set para buscas rápidas. Mapeia para String para consistência.
        const userFavorites = new Set(currentUser && currentUser.favoritos ? currentUser.favoritos.map(String) : []); 

        filmesContainers.forEach(container => {
            if (container) container.innerHTML = ''; // Limpa os containers antes de re-renderizar
        });

        // Adaptação para a busca: se houver termo de busca, todos os resultados vão para o primeiro container
        if (searchInput && searchInput.value.trim() !== "") {
            filmesToDisplay.forEach((filme) => {
                const card = createFilmeCard(filme, currentUser, userFavorites);
                if (filmesContainers[0]) filmesContainers[0].appendChild(card);
            });
            // Limpa os outros containers, pois a busca unifica os resultados
            if (filmesContainers[1]) filmesContainers[1].innerHTML = '';
            if (filmesContainers[2]) filmesContainers[2].innerHTML = '';
        } else {
            // Se não houver termo de busca, distribui os filmes por seção
            filmesToDisplay.forEach((filme) => {
                const card = createFilmeCard(filme, currentUser, userFavorites);
                let targetContainer;
                // Os nomes das seções devem ser EXATAMENTE como no db.json
                if (filme.secao === "Lançamentos") {
                    targetContainer = filmesContainers[0];
                } else if (filme.secao === "Recomendados pra você") {
                    targetContainer = filmesContainers[1];
                } else if (filme.secao === "Vale a pena assistir") {
                    targetContainer = filmesContainers[2];
                }

                if (targetContainer) {
                    targetContainer.appendChild(card);
                }
            });
        }

        // Adicionar event listeners aos botões de favorito após a renderização
        document.querySelectorAll('.favorite-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                // Certifica-se que o ID do filme seja do tipo correto (string) para comparação
                const filmeId = event.currentTarget.dataset.filmeId; 
                const isCurrentlyFavorite = event.currentTarget.dataset.isFavorite === 'true';
                
                await updateFavoriteStatus(filmeId, !isCurrentlyFavorite);
            });
        });
    }

    // Busca e exibe todos os filmes (para a seção de cards)
    async function fetchFilmes() {
        try {
            const response = await fetch(`${BASE_URL}/filmes`);
            if (!response.ok) {
                throw new Error(`Erro na requisição dos filmes: ${response.status}`);
            }
            allFilmes = await response.json();
            renderFilmes(allFilmes); // Renderiza todos inicialmente
        }
        catch (error) {
            console.error('Ocorreu um erro ao buscar os filmes:', error);
            filmesContainers.forEach(container => {
                if (container) container.innerHTML = '<p class="text-danger">Erro ao carregar filmes. Verifique o JSON Server.</p>';
            });
        }
    }

    // Busca e exibe os filmes em destaque (para o carrossel)
    async function fetchDestaques() {
        const carouselInner = document.getElementById('carousel-inner-container');
        const carouselIndicators = document.getElementById('carousel-indicators-container');

        try {
            const response = await fetch(`${BASE_URL}/filmes?destaque=true`); // Filtra por filmes com destaque=true
            if (!response.ok) {
                throw new Error(`Erro na requisição dos destaques: ${response.status}`);
            }
            const destaques = await response.json();

            if (destaques.length === 0) {
                if (carouselInner) carouselInner.innerHTML = '<p class="text-white text-center">Nenhum destaque encontrado.</p>';
                return;
            }

            if (carouselInner) carouselInner.innerHTML = '';
            if (carouselIndicators) carouselIndicators.innerHTML = '';

            destaques.forEach((filme, index) => {
                // Criar indicador
                const indicator = document.createElement('button');
                indicator.setAttribute('type', 'button');
                indicator.setAttribute('data-bs-target', '#carouselDestaques');
                indicator.setAttribute('data-bs-slide-to', index);
                indicator.setAttribute('aria-label', `Slide ${index + 1}`);
                if (index === 0) {
                    indicator.classList.add('active');
                    indicator.setAttribute('aria-current', 'true');
                }
                if (carouselIndicators) carouselIndicators.appendChild(indicator);

                // Criar item do carrossel
                const carouselItem = document.createElement('div');
                carouselItem.classList.add('carousel-item');
                if (index === 0) {
                    carouselItem.classList.add('active');
                }

                carouselItem.innerHTML = `
                    <a href="detalhes.html?id=${filme.id}" class="text-decoration-none d-block">
                        <img src="${filme.fundo}" class="d-block w-100 carousel-image" alt="${filme.titulo}" style="height: 500px; object-fit: cover;">
                        <div class="carousel-caption d-none d-md-block">
                            <h5>${filme.titulo}</h5>
                            <p>${filme.descricao.substring(0, 150)}...</p> </div>
                    </a>
                `;
                if (carouselInner) carouselInner.appendChild(carouselItem);
            });

        } catch (error) {
            console.error('Ocorreu um erro ao buscar os destaques:', error);
            if (carouselInner) carouselInner.innerHTML = '<p class="text-danger text-center">Erro ao carregar destaques.</p>';
        }
    }

    // --- Funcionalidade de Pesquisa ---

    if (searchForm) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            performSearch();
        });
        // Opcional: Adicionar evento 'input' para pesquisa em tempo real
        searchInput.addEventListener('input', () => {
             // Pequeno delay para nao sobrecarregar em cada letra digitada
            setTimeout(performSearch, 300); 
        });
    }

    function performSearch() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
        let filteredFilmes = [];

        if (searchTerm === "") {
            filteredFilmes = allFilmes; // Se o campo está vazio, mostra todos
            // Exibe as seções e o carrossel novamente
            if (destaquesTituloContainer) destaquesTituloContainer.classList.remove('d-none');
            if (carouselDestaques) carouselDestaques.classList.remove('d-none');
            if (tituloLancamentos) tituloLancamentos.classList.remove('d-none');
            if (tituloRecomendados) tituloRecomendados.classList.remove('d-none');
            if (tituloValeAPena) tituloValeAPena.classList.remove('d-none');
            
            // Garante que o container do gráfico esteja visível
            const graficoContainer = document.querySelector('#graficoCategorias').closest('.container');
            if (graficoContainer) graficoContainer.classList.remove('d-none');

            // Re-renderiza os filmes nas suas seções originais
            renderFilmes(allFilmes); 
            fetchDestaques(); // Recarrega o carrossel se necessário
            renderGraficoCategorias(); // Garante que o gráfico seja re-exibido
        } else {
            // Filtra por título, descrição ou categoria
            filteredFilmes = allFilmes.filter(filme =>
                filme.titulo.toLowerCase().includes(searchTerm) ||
                (filme.descricao && filme.descricao.toLowerCase().includes(searchTerm)) ||
                (filme.categoria && filme.categoria.toLowerCase().includes(searchTerm))
            );
            
            // Oculta as seções, o carrossel E O GRÁFICO
            if (destaquesTituloContainer) destaquesTituloContainer.classList.add('d-none');
            if (carouselDestaques) carouselDestaques.classList.add('d-none');
            if (tituloLancamentos) tituloLancamentos.classList.add('d-none');
            if (tituloRecomendados) tituloRecomendados.classList.add('d-none');
            if (tituloValeAPena) tituloValeAPena.classList.add('d-none');
            
            // Oculta a seção do gráfico
            const graficoContainer = document.querySelector('#graficoCategorias').closest('.container');
            if (graficoContainer) graficoContainer.classList.add('d-none');

            // Renderiza os filmes filtrados no primeiro container
            renderFilmes(filteredFilmes); 
        }
    }

    // --- Funcionalidade de Gráfico de Categorias ---
    async function renderGraficoCategorias() {
        try {
            const response = await fetch(`${BASE_URL}/filmes`);
            if (!response.ok) {
                throw new Error(`Erro na requisição dos filmes para o gráfico: ${response.status}`);
            }
            const filmes = await response.json();

            const categorias = {};

            // Conta a quantidade de filmes por categoria
            filmes.forEach(filme => {
                const genero = filme.categoria || "Desconhecido"; // Usa 'categoria' do seu db.json
                categorias[genero] = (categorias[genero] || 0) + 1;
            });

            const labels = Object.keys(categorias);
            const dados = Object.values(categorias);

            const ctx = document.getElementById('graficoCategorias'); // Pega o elemento canvas
            if (!ctx) { 
                console.warn("Elemento canvas com ID 'graficoCategorias' não encontrado.");
                return;
            }

            // Destrói o gráfico existente se houver
            if (myChartInstance) { 
                myChartInstance.destroy();
            }

            // Garante que o container do gráfico esteja visível (caso tenha sido ocultado pela busca)
            const graficoContainer = ctx.closest('.container');
            if (graficoContainer) graficoContainer.classList.remove('d-none');

            // Recriar o gradiente com as cores do gráfico original (azul)
            const chartCtx = ctx.getContext('2d');
            const gradient = chartCtx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(0, 123, 255, 0.9)'); // Azul mais forte
            gradient.addColorStop(1, 'rgba(0, 123, 255, 0.4)'); // Azul mais claro

            myChartInstance = new Chart(chartCtx, { // Armazena a instância
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Quantidade de Filmes por Categoria', // Rótulo original
                        data: dados,
                        backgroundColor: gradient, // Usando o gradiente azul
                        borderColor: 'transparent', // Sem borda, como no original
                        borderRadius: 10,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, 
                    plugins: {
                        legend: {
                            display: false 
                        },
                        title: {
                            display: true,
                            text: 'Distribuição de Filmes por Categoria', // Título original
                            color: '#ffffff', // Cor branca para o título, como no original
                            font: {
                                size: 18, // Tamanho original
                                family: 'Arial', 
                                weight: 'bold'
                            },
                            padding: {
                                top: 10,
                                bottom: 30
                            }
                        },
                        tooltip: {
                            backgroundColor: '#333', // Fundo mais escuro para o tooltip
                            titleColor: '#fff', // Título do tooltip branco
                            bodyColor: '#fff', // Corpo do tooltip branco
                            borderColor: '#555', // Borda do tooltip cinza
                            borderWidth: 1
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#ffffff' // Cor dos labels do eixo X branco
                            },
                            grid: {
                                display: false 
                            },
                            title: { 
                                display: false, // O original não tinha título nos eixos
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: '#ffffff', // Cor dos labels do eixo Y branco
                                stepSize: 1 
                            },
                            grid: {
                                color: 'rgba(255,255,255,0.1)' 
                            },
                            title: { 
                                display: false, // O original não tinha título nos eixos
                            }
                        }
                    },
                    animation: {
                        duration: 1500,
                        easing: 'easeOutBounce'
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao gerar o gráfico de categorias:', error);
            const chartContainer = document.querySelector('#graficoCategorias').parentElement;
            if (chartContainer) {
                chartContainer.innerHTML = '<p class="text-danger text-center">Erro ao carregar o gráfico. Verifique seus dados.</p>';
            }
        }
    }


    // --- Inicialização da Página ---

    updateHeader(); // Atualiza o cabeçalho (login/logout, favoritos, admin)
    fetchFilmes(); // Busca e exibe todos os filmes nos cards
    fetchDestaques(); // Busca e exibe os filmes no carrossel
    renderGraficoCategorias(); // CHAMA O GRÁFICO AQUI!
});