const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');

        try {
            const response = await fetch('http://localhost:3000/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Redirection si succès
                window.location.href = 'dashboard.html';
            } else {
                // Message d'erreur si échec
                errorMessage.innerText = result.message || "Erreur d'authentification";
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            errorMessage.innerText = "Impossible de contacter le serveur.";
        }
    });
}

async function displayInfractions() {
    const list = document.getElementById('infraction-list');
    if (!list) return;
    const data = await API.fetchInfractions();
    list.innerHTML = data.map(inf => `
        <div class="infraction-item" style="border-left: 5px solid ${inf.status === 'Traité' ? '#28a745' : '#dc3545'}; cursor: pointer;"
            onclick="location.href='details.html?id=${inf.inf_id}'">
            <div class="infraction-main">
                <div class="radar-icon"><img src="../media/sedan.png" class="inf-icon" alt=""></div>
                <div class="infraction-details">
                    <h4>ID Capture: ${inf.inf_id}</h4>
                    <div class="date-container">
                        <span class="date-only">${new Date(inf.date).toLocaleDateString()}</span><br>
                        <span class="time-only">${new Date(inf.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            </div>
            <div class="infraction-speed">
                <span class="speed-value" style="color: ${inf.status === 'Traité' ? '#28a745' : '#dc3545'};">${inf.vitesse} cm/s</span>
                <span class="speed-label">${inf.status}</span>
            </div>
            <button class="btn-select">Détails</button>
        </div>
    `).join('');
}

async function loadInfractionDetails() {
    // 1. Récupérer l'ID dans l'URL (ex: ?id=842)
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) return;

    // 2. Chercher les données (soit via une nouvelle fonction API, soit en filtrant la liste)
    const infractions = await API.fetchInfractions();
    const data = infractions.find(inf => inf.inf_id == id);

    //Gestion du statut
    const statusElement = document.getElementById('det-status');
    if (statusElement) {
        statusElement.innerText = data.status; // 'Traité' ou 'En attente'

        // Style dynamique selon le statut
        if (data.status === 'Traité') {
            document.getElementById('traiter').disabled = true;
            statusElement.style.background = '#28a745'; // Vert
            statusElement.style.color = '#fff';
        } else {
            statusElement.style.background = '#dc3545'; // Rouge
            statusElement.style.color = '#fff';
        }
    }

    if (data) {
        // 3. Mettre à jour le HTML
        document.getElementById('det-id').innerText = data.inf_id;
        document.getElementById('det-vitesse').innerText = `${data.vitesse} cm/s`;
        document.getElementById('det-date').innerText = `${new Date(data.date).toLocaleDateString()}`;
        document.getElementById('det-heure').innerText = `${new Date(data.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        // Optionnel : Changer la couleur si c'est déjà traité
        const speedElement = document.getElementById('det-vitesse');
        speedElement.style.color = (data.status === 'Traité') ? '#28a745' : '#dc3545';

        const vehicle_img = document.getElementById('vehicle-display');
        if (!vehicle_img) return;

        vehicle_img.innerHTML = `
            <div class="analysis-container">
                <div class="radar-sweep"></div>
                <div class="scan-line"></div>
                
                <!-- Coins de ciblage (Corners) -->
                <div class="target-corner top-left"></div>
                <div class="target-corner top-right"></div>
                <div class="target-corner bottom-left"></div>
                <div class="target-corner bottom-right"></div>

                <img src="${data.image}" alt="Infraction Capture" class="infraction-img">
                
                <div class="plate-overlay">
                    <span class="plate-label">PLAQUE DÉTECTÉE</span>
                    <span class="plate-number">${data.plaque || 'ANALYSE...'}</span>
                </div>
            </div>
        `;

    }
}

//Mise a jours statut d'une infraction
async function handleUpdateStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const btnTraiter = document.getElementById('traiter');

    if (!id || !btnTraiter) return;

    // On écoute le clic sur le bouton
    btnTraiter.addEventListener('click', async () => {
        try {
            // On désactive le bouton pour éviter les doubles clics
            btnTraiter.disabled = true;
            btnTraiter.innerText = "Mise à jour...";

            // On appelle l'API en passant l'ID et le nouveau statut
            const success = await API.updateInfractionsStatus(id, 'Traité');

            if (success) {
                alert("L'infraction a été marquée comme traitée !");
                // On recharge la page pour voir les changements (badge vert, bouton désactivé)
                window.location.reload();
            } else {
                alert("Erreur lors de la mise à jour.");
                btnTraiter.disabled = false;
                btnTraiter.innerText = "Traiter l'infraction";
            }
        } catch (error) {
            console.error("Erreur interface:", error);
            btnTraiter.disabled = false;
        }
    });
}
// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Si on est sur la page liste
    if (document.getElementById('infraction-list')) {
        displayInfractions();
    }

    // Si on est sur la page détails
    if (document.getElementById('det-id')) {
        loadInfractionDetails();
    }

    if (document.getElementById('traiter')) {
        handleUpdateStatus();
    }
});
