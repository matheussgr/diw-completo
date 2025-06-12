// app_login/login-page.js
document.addEventListener("DOMContentLoaded", () => {
    const BASE_URL = 'http://localhost:3000'; // Ajuste conforme a URL do seu JSON Server

    // Função para exibir mensagens na página
    function displayMessage(msg) {
        alert(msg); // Por simplicidade, usando alert. Você pode usar um elemento HTML.
    }

    // Função para gerar códigos randômicos (UUID)
    function generateUUID() {
        var d = new Date().getTime();
        var d2 = (performance && performance.now && (performance.now() * 1000)) || 0;
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16;
            if (d > 0) {
                r = (d + r) % 16 | 0;
                d = Math.floor(d / 16);
            } else {
                r = (d2 + r) % 16 | 0;
                d2 = Math.floor(d2 / 16);
            }
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    // Função para carregar o usuário corrente do sessionStorage
    function getCurrentUser() {
        try {
            const user = sessionStorage.getItem('currentUser'); // Padronizado para 'currentUser'
            return user ? JSON.parse(user) : null;
        } catch (e) {
            console.error("Erro ao ler currentUser do sessionStorage:", e);
            return null;
        }
    }

    // Função para salvar o usuário corrente no sessionStorage
    function saveCurrentUser(user) {
        try {
            sessionStorage.setItem('currentUser', JSON.stringify(user)); // Padronizado para 'currentUser'
        } catch (e) {
            console.error("Erro ao salvar currentUser no sessionStorage:", e);
        }
    }

    // Função para apagar o usuário corrente do sessionStorage (logout)
    function removeCurrentUser() {
        sessionStorage.removeItem('currentUser'); // Padronizado para 'currentUser'
    }

    // --- Funções de Login e Cadastro ---

    async function processaFormLogin(event) {
        event.preventDefault(); // Cancela a submissão padrão do formulário

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${BASE_URL}/usuarios?login=${username}&senha=${password}`);
            const users = await response.json();

            if (users.length > 0) {
                // Usuário encontrado
                const user = users[0];
                saveCurrentUser(user); // Salva o usuário no sessionStorage
                alert(`Bem-vindo, ${user.nome || user.login}!`);
                window.location.href = '../index.html'; // Redireciona para a home (um nível acima)
            } else {
                alert('Usuário ou senha incorretos.');
            }
        } catch (error) {
            console.error('Erro ao tentar fazer login:', error);
            alert('Erro ao tentar fazer login. Tente novamente.');
        }
    }

    async function salvaNovoUsuario(event) {
        event.preventDefault(); // Cancela a submissão padrão do formulário

        const login = document.getElementById('txt_login').value;
        const nome = document.getElementById('txt_nome').value;
        const email = document.getElementById('txt_email').value;
        const senha = document.getElementById('txt_senha').value;
        const senha2 = document.getElementById('txt_senha2').value;

        if (senha !== senha2) {
            alert('As senhas informadas não conferem.');
            return;
        }

        try {
            // Verifica se o login já existe
            const checkUserResponse = await fetch(`${BASE_URL}/usuarios?login=${login}`);
            const existingUsers = await checkUserResponse.json();
            if (existingUsers.length > 0) {
                alert('Este nome de usuário já está em uso. Por favor, escolha outro.');
                return;
            }

            // Cria um objeto de usuario para o novo usuario
            const newUser = {
                id: generateUUID(), // Gerar UUID para o ID
                login: login,
                senha: senha,
                nome: nome,
                email: email,
                isAdmin: false, // Novos usuários não são administradores por padrão
                favoritos: [] // Inicializa array de favoritos vazio
            };

            const response = await fetch(`${BASE_URL}/usuarios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newUser),
            });

            if (!response.ok) {
                throw new Error(`Erro ao cadastrar usuário: ${response.status}`);
            }

            const data = await response.json();
            console.log('Usuário cadastrado:', data);
            alert('Usuário salvo com sucesso. Agora você pode fazer login.');

            // Fechar o modal de cadastro após o sucesso
            const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
            if (registerModal) {
                registerModal.hide();
            }

            // Limpa os campos do formulário de cadastro
            document.getElementById('register-form').reset();

        } catch (error) {
            console.error('Erro ao cadastrar usuário:', error);
            alert('Não foi possível cadastrar o usuário. Tente novamente.');
        }
    }

    // --- Event Listeners ---

    // Formulário de Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', processaFormLogin);
    }

    // Botão Salvar do Modal de Cadastro
    const btnSalvar = document.getElementById('btn_salvar');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', salvaNovoUsuario);
    }
});