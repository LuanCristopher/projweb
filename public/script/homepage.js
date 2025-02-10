async function verificarLogin(destino) {
    const response = await fetch('/api/check-login');
    const data = await response.json();

    if (data.loggedIn) {
        if (destino === 'perfil') {
            alert('Você já está logado!');
        } else {
            window.location.href = destino;
        }
    } else {
        window.location.href = '../html/login.html';
    }
}
