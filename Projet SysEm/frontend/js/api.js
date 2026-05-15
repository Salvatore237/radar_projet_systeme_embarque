const API = {
    async fetchUsers() {
        const res = await fetch('/api/users');
        console.log("Utilisateurs récupérées:", res.json());
        return await res.json();
    },
    async fetchInfractions() {
        const res = await fetch('http://localhost:3000/historique/Historique');
        console.log("Infractions récupérées:", res);
        return await res.json();
    },
    // api.js
    updateInfractionsStatus: async (id, newStatus) => {
        const response = await fetch(`http://localhost:3000/infractions/update-status/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        return response.ok;
    }
    ,
    async connectDevice(config) {
        console.log("Connexion au radar...", config);
        return { success: true };
    }
};
