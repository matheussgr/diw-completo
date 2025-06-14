

document.addEventListener("DOMContentLoaded", async () => {
    const BASE_URL = 'http://localhost:3000';

    const favoritosContainer = document.getElementById('favoritos-container');
    const noFavoritesMessage = document.getElementById('no-favorites-message');


    const linkFavoritos = document.getElementById("link-favoritos");
    const linkAuth = document.getElementById("link-auth");
    const linkCadastroItens = document.getElementById("link-cadastro-itens");




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
            alert("Você precisa estar logado para gerenciar seus favoritos!");
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
            renderFavoritos();
        } catch (error) {
            console.error('Erro ao atualizar favoritos:', error);
            alert('Não foi possível atualizar seus favoritos. Tente novamente.');
        }
    }


    function createFilmeCard(filme, currentUserFavorites) {
        let card = document.createElement("div");
        card.classList.add("col-6", "col-md-3", "mb-4");

        const isFavorite = currentUserFavorites.has(filme.id);
        const favoriteIconClass = isFavorite ? 'bi-heart-fill text-danger' : 'bi-heart';



        const favoriteButtonHtml = `
            <button class="btn btn-sm favorite-btn position-absolute top-0 end-0 m-2" data-filme-id="${filme.id}" data-is-favorite="${isFavorite}" style="background-color: rgba(0,0,0,0.5); border-radius: 50%;">
                <i class="bi ${favoriteIconClass} fs-5"></i>
            </button>
        `;

        card.innerHTML = `
            <div class="card bg-dark text-white h-100 position-relative"> 
                <img src="${filme.imagem}" class="card-img-top" alt="${filme.titulo}" style="height: 300px; object-fit: cover;"> 
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


    async function renderFavoritos() {
        const currentUser = getCurrentUser();


        if (!currentUser || !currentUser.id) {

            alert("Você precisa estar logado para ver seus favoritos.");
            window.location.href = 'app_login/login.html';
            return;
        }

        const userFavoriteIds = new Set(currentUser.favoritos ? currentUser.favoritos.map(String) : []);


        favoritosContainer.innerHTML = '';
        noFavoritesMessage.classList.add('d-none');
        if (userFavoriteIds.size === 0) {
            noFavoritesMessage.classList.remove('d-none');
            return;
        }


        try {

            const response = await fetch(`${BASE_URL}/filmes`);
            if (!response.ok) {
                throw new Error(`Erro ao buscar filmes: ${response.status}`);
            }
            const allFilmes = await response.json();


            const filmesFavoritos = allFilmes.filter(filme => userFavoriteIds.has(filme.id));

            if (filmesFavoritos.length === 0) {
                noFavoritesMessage.classList.remove('d-none');
                return;
            }


            filmesFavoritos.forEach(filme => {
                const card = createFilmeCard(filme, userFavoriteIds);
                favoritosContainer.appendChild(card);
            });


            document.querySelectorAll('.favorite-btn').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const filmeId = event.currentTarget.dataset.filmeId;
                    const isCurrentlyFavorite = event.currentTarget.dataset.isFavorite === 'true';


                    await updateFavoriteStatus(filmeId, !isCurrentlyFavorite);
                });
            });

        } catch (error) {
            console.error('Erro ao carregar filmes favoritos:', error);
            favoritosContainer.innerHTML = '<p class="text-danger text-center">Erro ao carregar seus filmes favoritos. Verifique o JSON Server.</p>';
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



    updateHeader();
    renderFavoritos();
});