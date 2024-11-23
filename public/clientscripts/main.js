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





async function displayList() {
    try {
        const response = await fetch('/api/userlist');
        const userlist = await response.json();

        const container = document.getElementById('personallist');
        container.innerHTML = ''; // Clear the current list

        userlist.forEach((anime) => {
            const listItem = document.createElement('li');
            const animeDiv = document.createElement('div');
            animeDiv.classList.add('anime-item-container');

            // Anime Title
            const animeTitle = document.createElement('h3');
            animeTitle.textContent = anime.title;
            animeDiv.appendChild(animeTitle);

            // Progress Section
            const progressSection = document.createElement('div');
            progressSection.classList.add('progress-section');

            const currentLabel = document.createElement('label');
            currentLabel.textContent = 'Progress: ';
            progressSection.appendChild(currentLabel);

            const currentInput = document.createElement('input');
            currentInput.type = 'number';
            currentInput.min = 0;
            currentInput.max = anime.anime_episodes || 0;
            currentInput.value = anime.user_progress || 0; 
            currentInput.classList.add('progress-input');
            progressSection.appendChild(currentInput);

            const totalEpisodes = document.createElement('span');
            totalEpisodes.textContent = ` / ${anime.anime_episodes || 'N/A'}`;
            progressSection.appendChild(totalEpisodes);

            animeDiv.appendChild(progressSection);

            // Delete Button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('delete-button');


            //update progress
            
            currentInput.addEventListener('input', (event) => {
                const input = event.target;
                input.value = input.value.replace(/[^0-9]/g, `${anime.user_progress}`); // Remove anything that's not a digit (0-9)
            });
            
            currentInput.addEventListener('change', async (update) => {
                const newProgress = parseInt(update.target.value, 10);
                const animeId = anime.id;
                const epceiling = anime.anime_episodes;
            
                if (isNaN(newProgress) || newProgress < 0 || newProgress > epceiling) {
                    alert(`Please enter a number between 0 and ${epceiling}.`)
                    currentInput.value = `${anime.user_progress}`;
                    return;
                }
            
                try {
                    const response = await fetch('/api/updateprog', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ id: animeId, user_progress: newProgress }),
                    });
            
                    if (response.ok) {
                        console.log('Progress updated successfully!');
                    } else {
                        const errorData = await response.json();
                        console.error('Failed to update progress:', errorData.error);
                    }
                } catch (error) {
                    console.error('Error updating progress:', error);
                }

                displayList()
            });
            

            
            

            animeDiv.appendChild(deleteButton);


            listItem.appendChild(animeDiv);
            container.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error fetching user list:', error);
    }
}





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
             displayList();
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
displayList();