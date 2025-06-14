

document.addEventListener("DOMContentLoaded", () => {

    const BASE_URL = 'http://localhost:3000';


    const filmesContainers = [
        document.getElementById("filmes-container-1"),
        document.getElementById("filmes-container-2"),
        document.getElementById("filmes-container-3")
    ];
    const searchInput = document.getElementById("search-input");
    const searchForm = document.getElementById("search-form");


    const linkFavoritos = document.getElementById("link-favoritos");
    const linkAuth = document.getElementById("link-auth");
    const linkCadastroItens = document.getElementById("link-cadastro-itens");


    const destaquesTituloContainer = document.getElementById("destaques-titulo-container");
    const carouselDestaques = document.getElementById("carouselDestaques");
    const tituloLancamentos = document.getElementById("titulo-lancamentos");
    const tituloRecomendados = document.getElementById("titulo-recomendados");
    const tituloValeAPena = document.getElementById("titulo-vale-a-pena");

    let allFilmes = [];
    let myChartInstance;




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
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ favoritos: updatedFavorites })
            });

            if (!response.ok) {
                throw new Error(`Erro ao atualizar favoritos: ${response.status}`);
            }

            const updatedUser = await response.json();
            saveCurrentUser(updatedUser);
            renderFilmes(allFilmes);
        } catch (error) {
            console.error('Erro ao atualizar favoritos:', error);
            alert('Não foi possível atualizar seus favoritos. Tente novamente.');
        }
    }



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




    function createFilmeCard(filme, currentUser, userFavorites) {
        let card = document.createElement("div");
        card.classList.add("col-6", "col-md-3", "lista-filmes-item", "mb-4");

        const isFavorite = currentUser && userFavorites.has(filme.id);
        const favoriteIconClass = isFavorite ? 'bi-heart-fill text-danger' : 'bi-heart';


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


    function renderFilmes(filmesToDisplay) {
        const currentUser = getCurrentUser();

        const userFavorites = new Set(currentUser && currentUser.favoritos ? currentUser.favoritos.map(String) : []);

        filmesContainers.forEach(container => {
            if (container) container.innerHTML = '';
        });


        if (searchInput && searchInput.value.trim() !== "") {
            filmesToDisplay.forEach((filme) => {
                const card = createFilmeCard(filme, currentUser, userFavorites);
                if (filmesContainers[0]) filmesContainers[0].appendChild(card);
            });

            if (filmesContainers[1]) filmesContainers[1].innerHTML = '';
            if (filmesContainers[2]) filmesContainers[2].innerHTML = '';
        } else {

            filmesToDisplay.forEach((filme) => {
                const card = createFilmeCard(filme, currentUser, userFavorites);
                let targetContainer;

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


        document.querySelectorAll('.favorite-btn').forEach(button => {
            button.addEventListener('click', async (event) => {

                const filmeId = event.currentTarget.dataset.filmeId;
                const isCurrentlyFavorite = event.currentTarget.dataset.isFavorite === 'true';

                await updateFavoriteStatus(filmeId, !isCurrentlyFavorite);
            });
        });
    }


    async function fetchFilmes() {
        try {
            const response = await fetch(`${BASE_URL}/filmes`);
            if (!response.ok) {
                throw new Error(`Erro na requisição dos filmes: ${response.status}`);
            }
            allFilmes = await response.json();
            renderFilmes(allFilmes);
        }
        catch (error) {
            console.error('Ocorreu um erro ao buscar os filmes:', error);
            filmesContainers.forEach(container => {
                if (container) container.innerHTML = '<p class="text-danger">Erro ao carregar filmes. Verifique o JSON Server.</p>';
            });
        }
    }


    async function fetchDestaques() {
        const carouselInner = document.getElementById('carousel-inner-container');
        const carouselIndicators = document.getElementById('carousel-indicators-container');

        try {
            const response = await fetch(`${BASE_URL}/filmes?destaque=true`);
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



    if (searchForm) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            performSearch();
        });

        searchInput.addEventListener('input', () => {

            setTimeout(performSearch, 300);
        });
    }

    function performSearch() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
        let filteredFilmes = [];

        if (searchTerm === "") {
            filteredFilmes = allFilmes;

            if (destaquesTituloContainer) destaquesTituloContainer.classList.remove('d-none');
            if (carouselDestaques) carouselDestaques.classList.remove('d-none');
            if (tituloLancamentos) tituloLancamentos.classList.remove('d-none');
            if (tituloRecomendados) tituloRecomendados.classList.remove('d-none');
            if (tituloValeAPena) tituloValeAPena.classList.remove('d-none');


            const graficoContainer = document.querySelector('#graficoCategorias').closest('.container');
            if (graficoContainer) graficoContainer.classList.remove('d-none');


            renderFilmes(allFilmes);
            fetchDestaques();
            renderGraficoCategorias();
        } else {

            filteredFilmes = allFilmes.filter(filme =>
                filme.titulo.toLowerCase().includes(searchTerm) ||
                (filme.descricao && filme.descricao.toLowerCase().includes(searchTerm)) ||
                (filme.categoria && filme.categoria.toLowerCase().includes(searchTerm))
            );


            if (destaquesTituloContainer) destaquesTituloContainer.classList.add('d-none');
            if (carouselDestaques) carouselDestaques.classList.add('d-none');
            if (tituloLancamentos) tituloLancamentos.classList.add('d-none');
            if (tituloRecomendados) tituloRecomendados.classList.add('d-none');
            if (tituloValeAPena) tituloValeAPena.classList.add('d-none');


            const graficoContainer = document.querySelector('#graficoCategorias').closest('.container');
            if (graficoContainer) graficoContainer.classList.add('d-none');


            renderFilmes(filteredFilmes);
        }
    }


    async function renderGraficoCategorias() {
        try {
            const response = await fetch(`${BASE_URL}/filmes`);
            if (!response.ok) {
                throw new Error(`Erro na requisição dos filmes para o gráfico: ${response.status}`);
            }
            const filmes = await response.json();

            const categorias = {};


            filmes.forEach(filme => {
                const genero = filme.categoria || "Desconhecido";
                categorias[genero] = (categorias[genero] || 0) + 1;
            });

            const labels = Object.keys(categorias);
            const dados = Object.values(categorias);

            const ctx = document.getElementById('graficoCategorias');
            if (!ctx) {
                console.warn("Elemento canvas com ID 'graficoCategorias' não encontrado.");
                return;
            }


            if (myChartInstance) {
                myChartInstance.destroy();
            }


            const graficoContainer = ctx.closest('.container');
            if (graficoContainer) graficoContainer.classList.remove('d-none');


            const chartCtx = ctx.getContext('2d');
            const gradient = chartCtx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(0, 123, 255, 0.9)');
            gradient.addColorStop(1, 'rgba(0, 123, 255, 0.4)');

            myChartInstance = new Chart(chartCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Quantidade de Filmes por Categoria',
                        data: dados,
                        backgroundColor: gradient,
                        borderColor: 'transparent',
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
                            text: 'Distribuição de Filmes por Categoria',
                            color: '#ffffff',
                            font: {
                                size: 18,
                                family: 'Arial',
                                weight: 'bold'
                            },
                            padding: {
                                top: 10,
                                bottom: 30
                            }
                        },
                        tooltip: {
                            backgroundColor: '#333',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            borderColor: '#555',
                            borderWidth: 1
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#ffffff'
                            },
                            grid: {
                                display: false
                            },
                            title: {
                                display: false,
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: '#ffffff',
                                stepSize: 1
                            },
                            grid: {
                                color: 'rgba(255,255,255,0.1)'
                            },
                            title: {
                                display: false,
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




    updateHeader();
    fetchFilmes();
    fetchDestaques();
    renderGraficoCategorias();
});