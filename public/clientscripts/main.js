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




function displayAnime(animes) {
    const listContainer = document.getElementById('animelist');
    listContainer.innerHTML = ''; 
    
    animes.forEach(anime => {
        const animeItem = document.createElement('li');
        animeItem.classList.add('anime-item');

        const animeCard = document.createElement('div');
        animeCard.classList.add('anime-card');
        
        const animeImage = document.createElement('img');

        animeImage.src = anime.images.jpg.image_url;
        animeImage.alt = anime.title;
        animeImage.classList.add('anime-image');
        animeCard.appendChild(animeImage);
        
        const animeTitle = document.createElement('h3');
        animeTitle.textContent = anime.title;
        animeCard.appendChild(animeTitle);
        
        const descriptionButton = document.createElement('button');
        descriptionButton.textContent = 'View Description';
        descriptionButton.classList.add('description-button');


        const addbutton = document.createElement('button');
        addbutton.classList.add('addbutton');

        addbutton.addEventListener('click', () => {
            addbutton.disabled = true;
        
            fetch('/api/addinganime', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: anime.title,
                    description: anime.synopsis,
                    anime_episodes: anime.episodes,
                }),
            })
            .then(response => response.json())
            .then(data => {
                alert('Added!');
                console.log('Added:', data);
            })
            .catch(error => {
                console.error('Error adding anime:', error);
            })
            .finally(() => {
                addbutton.disabled = false;
            });
        });
        


        descriptionButton.addEventListener('click', () => {
            openDescriptionPopup(anime.synopsis);
        });

        animeCard.appendChild(addbutton);
        animeCard.appendChild(descriptionButton);
        animeItem.appendChild(animeCard);
        listContainer.appendChild(animeItem);
        

    });
}

function openDescriptionPopup(description) {
    const popup = document.createElement('div');
    popup.classList.add('popup');
    
    const popupContent = document.createElement('div');
    popupContent.classList.add('popup-content');
    
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.classList.add('popup-close');
    
    closeButton.addEventListener('click', () => {
        document.body.removeChild(popup);
    });
    
    const popupText = document.createElement('p');
    popupText.textContent = description || 'No results found.';
    
    popupContent.appendChild(closeButton);
    popupContent.appendChild(popupText);
    popup.appendChild(popupContent);
      
    document.body.appendChild(popup);
}






document.querySelector('.search-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const query = document.querySelector('.search-form input').value;
    fetchAnimeData(query); 
    currentPage = 1;
});


fetchAnimeData();