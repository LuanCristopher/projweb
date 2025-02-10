async function fazerLogin(event) {
    event.preventDefault();
    const usuario = document.getElementById('usuario').value;

    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario })
    });

    const data = await response.json();
    if (data.success) {
        alert('Login realizado com sucesso!');
        window.location.href = '../html/homepage.html';
    } else {
        alert('Erro no login');
    }
}
