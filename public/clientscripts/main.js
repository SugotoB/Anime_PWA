// global variables
let currentPage = 1;
let UserQuery = '';
let currentUser = null;
let lastVisiblePage = 1; // Track the last page from API

// Check authentication status
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = '/login.html';
            return false;
        }
        
        currentUser = data.user;
        updateUserDisplay();
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login.html';
        return false;
    }
}

// Update user display
function updateUserDisplay() {
    const usernameDisplay = document.getElementById('username-display');
    const listDisplay  = document.getElementById('username_list_display');
    if (usernameDisplay && currentUser && listDisplay) {
        usernameDisplay.textContent = `Welcome, ${currentUser.username}!`;
        listDisplay.textContent = `${currentUser.username}'s AniLog`
    }
}


// User menu functionality
function initUserMenu() {
    const menuBtn = document.getElementById('user-menu-btn');
    const dropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const deleteAccountBtn = document.getElementById('delete-account-btn');

    if (menuBtn && dropdown) {
        menuBtn.addEventListener('click', () => {
            dropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', handleDeleteAccount);
    }
}

// Handle logout
async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            window.location.href = '/login.html';
        } else {
            console.error('Logout failed');
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Handle delete account
async function handleDeleteAccount() {
    const confirmation = confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your anime data.');
    
    if (!confirmation) {
        return;
    }

    const finalConfirmation = confirm('This is your final warning. All your data will be permanently deleted. Are you absolutely sure?');
    
    if (!finalConfirmation) {
        return;
    }

    try {
        const response = await fetch('/api/auth/delete-account', {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            alert('Account deleted successfully');
            window.location.href = '/signup.html';
        } else {
            const data = await response.json();
            alert('Failed to delete account: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Delete account error:', error);
        alert('Failed to delete account. Please try again.');
    }
}

// Utility to show/hide loading spinner
function showLoadingSpinner(show) {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) spinner.style.display = show ? 'flex' : 'none';
}

// Update current page indicator and back button state
function updateCurrentPageIndicator() {
    const currentPageSpan = document.getElementById('current-page');
    if (currentPageSpan) {
        currentPageSpan.textContent = `Page ${currentPage}`;
    }
    // Update back button state
    if (currentPage === 1) {
        beforebutton.classList.add('disabled');
        beforebutton.disabled = true;
    } else {
        beforebutton.classList.remove('disabled');
        beforebutton.disabled = false;
    }
    // Update next button state
    if (currentPage >= lastVisiblePage) {
        nextbutton.classList.add('disabled');
        nextbutton.disabled = true;
    } else {
        nextbutton.classList.remove('disabled');
        nextbutton.disabled = false;
    }
}

// Function to fetch anime data
async function fetchAnimeData(query = '', rating = '') {
    UserQuery = query || UserQuery;
    showLoadingSpinner(true);
    beforebutton.disabled = true;
    nextbutton.disabled = true;
    const url = query
        ? `https://api.jikan.moe/v4/anime?q=${query}&page=${currentPage}&sfw&rating=${rating}`
        : `https://api.jikan.moe/v4/anime?page=${currentPage}&sfw&rating=${rating}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`network response error: ${response.status}`);
        const data = await response.json();
        // Store last page from API response
        if (data.pagination && data.pagination.last_visible_page) {
            lastVisiblePage = data.pagination.last_visible_page;
        } else {
            lastVisiblePage = 1;
        }
        const filteredData = data.data.filter(anime => anime.episodes !== null);
        displayAnime(filteredData);
    } catch (error) {
        console.error('Fetch failed:', error);
    } finally {
        showLoadingSpinner(false);
        beforebutton.disabled = currentPage <= 1;
        // Disable next button if on last page
        if (currentPage >= lastVisiblePage) {
            nextbutton.classList.add('disabled');
            nextbutton.disabled = true;
        } else {
            nextbutton.classList.remove('disabled');
            nextbutton.disabled = false;
        }
        updateCurrentPageIndicator();
    }
}

// next and before buttons, increments page number and reloads the anime, taking into account any user queries
const nextbutton = document.getElementById('next');
const beforebutton = document.getElementById('before');

// Update nextbutton and beforebutton click handlers to call updateCurrentPageIndicator
nextbutton.addEventListener('click', function() {
    if (currentPage < lastVisiblePage) {
        currentPage++;
        fetchAnimeData(UserQuery);
        updateCurrentPageIndicator();
    }
});

beforebutton.addEventListener('click', function() {
    if (currentPage > 1) {
        currentPage--;
        fetchAnimeData(UserQuery);
        updateCurrentPageIndicator();
    }
});

// function for displaying the anime
async function displayList() {
    try {
        const response = await fetch('/api/userlist', {
            credentials: 'include'
        }); // waits for api fetch
        
        const userlist = await response.json(); // waits for conversion of data into json format

        const container = document.getElementById('personallist'); 
        container.innerHTML = ''; // Clear the current list

        userlist.forEach((anime) => {
            const listItem = document.createElement('li');
            const animeDiv = document.createElement('div');
            animeDiv.classList.add('anime-item-container');

            // Anime Title
            const animeTitle = document.createElement('h3');
            animeTitle.classList.add('animeTitle');
            animeTitle.textContent = anime.title;
            animeDiv.appendChild(animeTitle);

            // Progress Section
            const progressSection = document.createElement('div');
            progressSection.classList.add('progress-section');

            const currentLabel = document.createElement('label');
            currentLabel.setAttribute('for', `progress-input-${anime.id}`); // Set the 'for' attribute for accessibility
            currentLabel.textContent = 'Progress: ';
            progressSection.appendChild(currentLabel);

            const currentInput = document.createElement('input');
            currentInput.type = 'number';
            currentInput.min = 0;
            currentInput.max = anime.anime_episodes || 0; // sets to 0 if the former value is falsey
            currentInput.value = anime.user_progress || 0; // sets to 0 if former value is falsey
            currentInput.classList.add('progress-input');
            currentInput.id = `progress-input-${anime.id}`; // Set unique id for each input
            progressSection.appendChild(currentInput);

            const totalEpisodes = document.createElement('span');
            totalEpisodes.textContent = ` / ${anime.anime_episodes || 'N/A'}`; // shows anime episodes from database, return N/A if falsey
            progressSection.appendChild(totalEpisodes);

            animeDiv.appendChild(progressSection);

            // Delete Button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('delete-button');

            deleteButton.addEventListener('click', async () => {
                const confirmation = confirm(`Do you want to delete "${anime.title}" from your list?`);
                if (!confirmation) return;
            
                try {
                    const response = await fetch('/api/deleteanime', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ id: anime.id }),
                        credentials: 'include'
                    });
            
                    if (response.ok) {
                        container.removeChild(listItem);
                        console.log('Anime deleted successfully!');
                    } else {
                        const errorData = await response.json();
                        console.error('Failed to delete anime:', errorData.error);
                    }
                } catch (error) {
                    console.error('Error deleting anime:', error);
                }
            });
            
            // update progress
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
                        credentials: 'include'
                    });
            
                    if (response.ok) {
                        window.alert('Progress updated successfully!');
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

    if(Object.keys(animes).length === 0){
        listContainer.innerHTML = 'We could not find any anime matching your search.'
        return;
    }
    animes.forEach(anime => {
        const animeItem = document.createElement('li');
        animeItem.classList.add('anime-item');
        const animeCard = document.createElement('div');
        animeCard.classList.add('anime-card');
        const animeImage = document.createElement('img');
        const animeEps = document.createElement('p');
        const pathofimage = anime.images.jpg.image_url;
        animeEps.textContent = `episodes: ${anime.episodes}`;
        animeImage.src = pathofimage;
        animeImage.alt = anime.title;
        animeImage.classList.add('anime-image');
        animeCard.appendChild(animeImage);
        const animeTitle = document.createElement('h3');
        animeTitle.textContent = anime.title;
        animeCard.appendChild(animeTitle);
        animeCard.appendChild(animeEps);
        // Add rating under episodes
        const animeRating = document.createElement('p');
        animeRating.textContent = `Rating: ${anime.rating || 'N/A'}`;
        animeRating.classList.add('anime-rating');
        animeCard.appendChild(animeRating);
        const descriptionButton = document.createElement('button');
        descriptionButton.textContent = 'View Description';
        descriptionButton.classList.add('description-button');
        descriptionButton.addEventListener('click', () => {
            openDescriptionPopup(anime.synopsis, anime.title);
        });
        animeCard.appendChild(descriptionButton);
        // Add button full width at bottom
        const addbutton = document.createElement('button');
        addbutton.innerText = 'Add';
        addbutton.classList.add('addbutton', 'fullwidth');
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
                    anime_id: anime.mal_id,
                }),
                credentials: 'include'
            })
                .then(async response => {
                    if (!response.ok) {
                        return response.json().then(data => {
                            throw new Error(data.error || 'Failed to add anime');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    alert('Anime added successfully!');
                    console.log('Added:', data);
                })
                .catch(error => {
                    alert(error.message);
                    console.error('Error adding anime:', error);
                })
                .finally(() => {
                    addbutton.disabled = false;
                    displayList();
                });
        });
        animeCard.appendChild(addbutton);
        animeItem.appendChild(animeCard);
        listContainer.appendChild(animeItem);
    });
}

function openDescriptionPopup(description, title) {
    const popup = document.createElement('div');
    popup.classList.add('popup');
    const popupContent = document.createElement('div');
    popupContent.classList.add('popup-content');
    // Add title at the top
    const popupTitle = document.createElement('h2');
    popupTitle.classList.add('popup-title');
    popupTitle.textContent = title || 'Description';
    popupContent.appendChild(popupTitle);
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.classList.add('popup-close');
    closeButton.addEventListener('click', () => {
        document.body.removeChild(popup);
    });
    const popupText = document.createElement('p');
    popupText.textContent = description || 'No description available.';
    popupContent.appendChild(popupText);
    popupContent.appendChild(closeButton);
    popup.appendChild(popupContent);
    document.body.appendChild(popup);
}

document.querySelector('.search-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const query = document.querySelector('.search-form input').value; //established the query value taken from .search-form class
    fetchAnimeData(query); 
    currentPage = 1;
});

document.addEventListener('DOMContentLoaded', async function(){
    // Check authentication first
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
        return;
    }
    // Initialize user menu
    initUserMenu();
    // Load data
    fetchAnimeData();
    displayList();
    updateCurrentPageIndicator();
});