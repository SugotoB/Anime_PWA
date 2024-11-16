const menubutton = document.getElementById('buttonicon');
const sidebar = document.getElementsByClassName('sidebar')[0];

menubutton.addEventListener('click', function() {
    sidebar.classList.toggle('active');
});



let currentPage = 1;
let UserQuery = '';

async function fetchAnimeData(query = '', rating = 'PG') {
    UserQuery = query || UserQuery;
    const url = query
        ? `https://api.jikan.moe/v4/anime?q=${query}&page=${currentPage}&rating=${rating}` 
        : `https://api.jikan.moe/v4/anime?page=${currentPage}&rating=${rating}`;
    const response = await fetch(url);
    const data = await response.json();
    displayAnime(data.data);
    beforebutton.disabled = currentPage<=1;
    nextbutton.disabled = data.pagination.has_next_page === false;
};



const nextbutton = document.getElementById('next');
const beforebutton = document.getElementById('before');

nextbutton.addEventListener('click', function() {
    currentPage++;  
    fetchAnimeData(UserQuery); 
});

beforebutton.addEventListener('click', function() {
    if (currentPage > 1) {
        currentPage--;  
        fetchAnimeData(UserQuery); 
    }
});