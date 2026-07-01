let currentPokemonId = 1;
        const pokemonCache = {};

        // DOM Elements
        const searchInput = document.getElementById('search-input');
        const clearBtn = document.getElementById('clear-btn');
        const searchBtn = document.getElementById('search-btn');
        const pokeID = document.getElementById('poke-id');
        const pokeName = document.getElementById('poke-name');
        const pokeImg = document.getElementById('poke-img');
        const typesContainer = document.getElementById('poke-types');
        const pokeHeight = document.getElementById('poke-height');
        const pokeWeight = document.getElementById('poke-weight');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const evoBtn = document.getElementById('evo-btn');
        const evoContainer = document.getElementById('evo-chain-container');
        const modal = document.getElementById('evo-modal');
        const closeModal = document.getElementById('close-modal');
        
        
        


        // Fetch and Render Pokémon Core Data

        async function fetchPokemon(idOrName) {
            try {
                const key = idOrName.toString().toLowerCase().trim();

                if (pokemonCache[key]){
                    const data = pokemonCache[key];
                    currentPokemonId = data.id;
                    renderCard(data);
                    return;
                }
                const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${key}`);
                if (!response.ok) throw new Error('Pokemon not found');
                const data = await response.json();

                pokemonCache[key] = data;
                pokemonCache[data.id] = data;
                
                currentPokemonId = data.id; // Update tracking ID
                renderCard(data);
            } catch (error) {
                alert('Pokémon not found! Please check the spelling or ID.');
            }
        }

        function renderCard(data) {
            pokeName.textContent = data.name;
            pokeID.textContent = `#${data.id.toString().padStart(3, '0')}`;
            pokeHeight.textContent = `${data.height / 10} m`;
            pokeWeight.textContent = `${data.weight / 10} kg`;
        
            
            // Image fallback chain
            pokeImg.src = data.sprites.other['official-artwork'].front_default || data.sprites.front_default;
            

            // Types
            typesContainer.innerHTML = '';
            data.types.forEach(t => {
                const badge = document.createElement('span');
                badge.classList.add('type-badge', t.type.name);
                badge.textContent = t.type.name;
                typesContainer.appendChild(badge);
            });
        }

        // Fetch Evolution Tree Data
        async function fetchEvolutionTree() {
            try {
                // Step 1: Fetch Pokémon species to find evolution chain URL
                const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${currentPokemonId}/`);
                const speciesData = await speciesRes.json();
                
                // Step 2: Fetch actual evolution chain
                const evoRes = await fetch(speciesData.evolution_chain.url);
                const evoData = await evoRes.json();

                
                evoContainer.innerHTML = ''; // Clear prior content

                // Traverse the evolution data object
                let currentEvo = evoData.chain;
                
                while (currentEvo) {
                    const name = currentEvo.species.name;
                    // Get Id via URL split to grab thumbnail quickly
                    const urlParts = currentEvo.species.url.split('/');
                    const id = urlParts[urlParts.length - 2];
                    const imgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

                    // Create element node
                    const node = document.createElement('div');
                    node.classList.add('evo-node');

                    const img = document.createElement('img');
                    img.src = imgUrl;
                    img.alt = name;

                    const text = document.createElement('p');
                    text.textContent = name;

                    node.appendChild(img);
                    node.appendChild(text);


                    // Clicking an element in evolution tree instantly navigates to them
                    node.addEventListener('click', () => {
                        fetchPokemon(name);
                        modal.style.display = 'none';
                    });

                    evoContainer.appendChild(node);

                    // Check if next evolution exists
                    if (currentEvo.evolves_to && currentEvo.evolves_to.length > 0) {
                        const arrow = document.createElement('div');
                        arrow.classList.add('arrow');
                        arrow.textContent = '➔';
                        evoContainer.appendChild(arrow);
                        
                        // Defaulting to the primary branching path for simplicity
                        currentEvo = currentEvo.evolves_to[0]; 
                    } else {
                        currentEvo = null;
                    }
                }

                modal.style.display = 'flex';
            } catch (error) {
                console.error("Error building evolution tree:", error);
                alert("Could not load evolution tree details.");
            }
        }

        // Event Listeners
        searchBtn.addEventListener('click', () => {
            if (searchInput.value) fetchPokemon(searchInput.value);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && searchInput.value) fetchPokemon(searchInput.value);
        });

        searchInput.addEventListener('input', () => {
            if (searchInput.value.trim().length > 0){
                clearBtn.style.display = 'block';
            } else {
                clearBtn.style.display = 'none';
            }
        });

        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            searchInput.focus(); // Keep focus on the field for easy re-typing
        });

        prevBtn.addEventListener('click', () => {
            if (currentPokemonId > 1) fetchPokemon(currentPokemonId - 1);
        });

        nextBtn.addEventListener('click', () => {
            fetchPokemon(currentPokemonId + 1);
        });

        evoBtn.addEventListener('click', fetchEvolutionTree);
        closeModal.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

        // Initialize on page load (Starts with Bulbasaur)
        fetchPokemon(currentPokemonId);