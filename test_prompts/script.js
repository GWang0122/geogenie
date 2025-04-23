function initMap() {
  // Check if Leaflet is available
  if (typeof L === "undefined") {
    console.error("Leaflet library (L) is not loaded!");
    return;
  }

  // Initialize the map centered on South America
  var map = L.map("map", {
    minZoom: 3,
    maxZoom: 14,
  }).setView([-23.5475, -46.63611], 3);

  //disable panning
  map.dragging.disable()

  // Add OpenStreetMap tiles
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 14,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  // Create game controls and score display
  createGameControls(map);
  createScoreDisplay(map);
  
  // Initially show title screen and hide controls
  hideGameControls();
  showTitleScreen();

  // List of cities with country, city, latitude, longitude
  
  //regular cities
  const cities = [
    ["Brazil", "Sao Paulo", -23.5475, -46.63611],
    ["Mexico", "Mexico City", 19.42847, -99.12766],
    ["United States", "New York City", 40.71427, -74.00597],
    ["Peru", "Lima", -12.04318, -77.02824],
    ["Colombia", "Bogota", 4.60971, -74.08175],
    ["Brazil", "Rio de Janeiro", -22.90642, -43.18223],
    ["Chile", "Santiago", -33.45694, -70.64827],
    ["United States", "Los Angeles", 34.05223, -118.24368],
    ["Venezuela", "Caracas", 10.48801, -66.87919],
    ["Argentina", "Buenos Aires", -34.61315, -58.37723],
    ["Ecuador", "Quito", -0.22985, -78.52495],
    ["Ecuador", "Guayaquil", -2.19616, -79.88621],
    ["Brazil", "Belo Horizonte", -19.92083, -43.93778],
    ["Brazil", "Salvador", -12.97563, -38.49096],
    ["United States", "Chicago", 41.85003, -87.65005],
    ["Canada", "Toronto", 43.70643, -79.39864],
    ["Brazil", "Fortaleza", -3.71722, -38.54306],
    ["Colombia", "Cali", 3.43722, -76.5225],
    ["United States", "Houston", 29.76328, -95.36327],
  ];
  

  //difficult cities
  /*
  const cities = [
    ["Venezuela", "Maracaibo", 10.66663, -71.61245],
    ["Brazil", "Manaus", -3.10194, -60.025],
    ["Brazil", "Brasilia", -15.77972, -47.92972],
    ["Dominican Republic", "Santo Domingo", 18.47186, -69.89232],
    ["Cuba", "Havana", 23.13302, -82.38304],
    ["Bolivia", "La Paz", -16.5, -68.15],
    ["Colombia", "Medellin", 6.25184, -75.56359],
    ["Brazil", "Curitiba", -25.42778, -49.27306],
    ["Mexico", "Tijuana", 32.5027, -117.00371],
    ["Bolivia", "Santa Cruz", -17.78629, -63.18117],
    ["Canada", "Montreal", 45.50884, -73.58781],
    ["Venezuela", "Maracay", 10.23535, -67.59113],
    ["Mexico", "Leon", 21.12908, -101.67374],
    ["Mexico", "Puebla", 19.03793, -98.20346],
    ["Brazil", "Recife", -8.05389, -34.88111],
    ["United States", "Phoenix", 33.44838, -112.07404],
  ];
  */
  var score = 0;
  var round = 1;
  var points = 0;
  var time_left = 30;
  var current_city = null;
  var player_guessed = false;
  var llava_analysis = null;
  var selected_cities = [];

  // Function to get a random city that hasn't been selected yet
  function getRandomCity() {
    const availableCities = cities.filter((_, index) => !selected_cities.includes(index));
    if (availableCities.length === 0) {
      // If all cities have been used, reset the selection
      selected_cities = [];
      return getRandomCity();
    }
    const randomIndex = Math.floor(Math.random() * availableCities.length);
    const cityIndex = cities.indexOf(availableCities[randomIndex]);
    selected_cities.push(cityIndex);
    return {
      success: true,
      city: availableCities[randomIndex][1],
      country: availableCities[randomIndex][0],
      latitude: availableCities[randomIndex][2],
      longitude: availableCities[randomIndex][3]
    };
  }

  // Function to capture the map as an image
  async function captureMapImage() {
    return new Promise((resolve) => {
      // Create a temporary canvas
      const canvas = document.createElement('canvas');
      const mapContainer = document.getElementById('map');
      canvas.width = mapContainer.offsetWidth;
      canvas.height = mapContainer.offsetHeight;
      
      // Get the map container's position
      const rect = mapContainer.getBoundingClientRect();
      
      // Use html2canvas to capture the map
      html2canvas(mapContainer, {
        useCORS: true,
        allowTaint: true,
        width: canvas.width,
        height: canvas.height,
        x: rect.left,
        y: rect.top,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight
      }).then(canvas => {
        // Convert canvas to blob
        canvas.toBlob(blob => {
          resolve(blob);
        }, 'image/png');
      });
    });
  }

  // Function to update the score display
  function updateScoreDisplay() {
    const scoreElement = document.querySelector('.score-control');
    if (scoreElement) {
      scoreElement.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px;">Geo-Genie: The Geography Game</div>
        <div>Score: ${score}</div>
        <div>Round: ${round}</div>
      `;
    }
  }

  // Function to get LLaVA's analysis
  async function getLLaVAAnalysis() {
    try {
      // Capture the map image
      const mapImage = await captureMapImage();
      
      // Create form data
      const formData = new FormData();
      formData.append('file', mapImage, 'map.png');
      
      // Send to backend
      const response = await fetch('http://localhost:8000/analyze-map', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        return data.analyses;
      }
      throw new Error('Failed to get LLaVA analysis');
    } catch (error) {
      console.error('Error getting LLaVA analysis:', error);
      return null;
    }
  }

  // Function to start a new round
  async function startNewRound() {
    console.log("Starting new round...");
    
    current_city = getRandomCity();
    if (!current_city) {
        alert('Failed to get a new city. Please try again.');
        return;
    }

    // Center map on the new city
    map.setView([current_city.latitude, current_city.longitude], 10);
    
    // Reset game state
    player_guessed = false;
    llava_analysis = null;
    time_left = 30;
    updateTimer();
    updateGameState();
    updateScoreDisplay();

    // Start the jeopardy music
    const jeopardyMusic = document.getElementById('jeopardyMusic');
    if (jeopardyMusic) {
        console.log("Playing music for new round");
        jeopardyMusic.volume = 0.5;
        jeopardyMusic.currentTime = 0;
        
        // Try to play the music
        const playPromise = jeopardyMusic.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                console.log("Music started playing for new round");
            }).catch(error => {
                console.log("Error playing music for new round:", error);
            });
        }
    }
  }

  // Function to update the timer display
  function updateTimer() {
    const timerElement = document.getElementById('timer');
    if (timerElement) {
      timerElement.textContent = `Time left: ${time_left}s`;
    }
  }

  // Function to update the game state display
  function updateGameState() {
    const gameStateElement = document.getElementById('gameState');
    if (gameStateElement) {
      let stateText = '';
      if (!player_guessed) {
        stateText = 'Your turn to guess!';
      } else if (!llava_analysis) {
        stateText = 'Waiting for LLaVA to analyze...';
      } else {
        stateText = 'Round complete!';
      }
      gameStateElement.textContent = stateText;
    }
  }

  // Function to create game controls
  function createGameControls(map) {
    var gameControl = L.control({position: 'bottomleft'});
    gameControl.onAdd = function(map) {
      var div = L.DomUtil.create('div', 'game-control');
      div.style.backgroundColor = 'white';
      div.style.padding = '10px';
      div.style.borderRadius = '5px';
      div.style.boxShadow = '0 0 5px rgba(0,0,0,0.2)';
      div.style.fontFamily = 'Arial, sans-serif';
      div.style.maxWidth = '300px';
      div.style.wordWrap = 'break-word';
      
      var questionText = L.DomUtil.create('div', 'question-text', div);
      questionText.innerHTML = 'Which country is the city central to this map located in?';
      questionText.style.marginBottom = '10px';
      questionText.style.fontWeight = 'bold';

      var gameState = L.DomUtil.create('div', 'game-state', div);
      gameState.id = 'gameState';
      gameState.style.marginBottom = '10px';
      gameState.style.fontWeight = 'bold';

      var timerDisplay = L.DomUtil.create('div', 'timer-display', div);
      timerDisplay.id = 'timer';
      timerDisplay.style.marginBottom = '10px';
      timerDisplay.style.fontWeight = 'bold';

      var answerInput = L.DomUtil.create('input', 'answer-input', div);
      answerInput.type = 'text';
      answerInput.placeholder = 'Enter your answer here...';
      answerInput.style.width = '100%';
      answerInput.style.padding = '8px';
      answerInput.style.marginBottom = '10px';
      answerInput.style.border = '1px solid #ccc';
      answerInput.style.borderRadius = '4px';
      answerInput.style.boxSizing = 'border-box';

      var answerDisplay = L.DomUtil.create('div', 'answer-display', div);
      answerDisplay.style.marginTop = '10px';
      answerDisplay.style.padding = '8px';
      answerDisplay.style.backgroundColor = '#f5f5f5';
      answerDisplay.style.borderRadius = '4px';
      answerDisplay.style.minHeight = '20px';
      answerDisplay.style.fontStyle = 'italic';
      answerDisplay.style.color = '#666';

      var teleportToCityDisplay = L.DomUtil.create('input', 'teleport-display', div);
      teleportToCityDisplay.type = 'text';
      teleportToCityDisplay.placeholder = 'To get more info, enter a city to teleport to...';
      teleportToCityDisplay.style.width = '100%';
      teleportToCityDisplay.style.marginTop = '10px';
      teleportToCityDisplay.style.padding = '8px';
      teleportToCityDisplay.style.marginBottom = '10px';
      teleportToCityDisplay.style.border = '1px solid #ccc';
      teleportToCityDisplay.style.borderRadius = '4px';
      teleportToCityDisplay.style.boxSizing = 'border-box';

      teleportToCityDisplay.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          var userAnswer = teleportToCityDisplay.value.trim();
          teleportToCityDisplay.value = '';
          if (!cities.some(city => city[1].toLowerCase() === userAnswer.toLowerCase())) {
            teleportToCityDisplay.placeholder = userAnswer + ' does not match any city in database, please re-type exact spelling'; 
          }
          else {
            teleportToCityDisplay.value = cities[selected_cities[selected_cities.length - 1]][1];
            answerDisplay.textContent = 'Press enter above to teleport back to the round\'s target city';
            let teleportToCityIdx = cities.findIndex(city => city[1].toLowerCase() === userAnswer.toLowerCase());
            map.setView([cities[teleportToCityIdx][2], cities[teleportToCityIdx][3]], 10);
          }
        }
      });

      var llavaDisplay = L.DomUtil.create('div', 'llava-display', div);
      llavaDisplay.style.marginTop = '10px';
      llavaDisplay.style.padding = '8px';
      llavaDisplay.style.backgroundColor = '#e3f2fd';
      llavaDisplay.style.borderRadius = '4px';
      llavaDisplay.style.minHeight = '20px';
      llavaDisplay.style.fontStyle = 'italic';
      llavaDisplay.style.color = '#0d47a1';
      llavaDisplay.style.whiteSpace = 'pre-wrap';
      llavaDisplay.style.maxHeight = '200px';
      llavaDisplay.style.overflowY = 'auto';

      // Create tabs container
      var tabsContainer = L.DomUtil.create('div', 'tabs-container', llavaDisplay);
      tabsContainer.style.display = 'flex';
      tabsContainer.style.marginBottom = '10px';
      tabsContainer.style.borderBottom = '1px solid #ccc';

      // Create content container
      var contentContainer = L.DomUtil.create('div', 'content-container', llavaDisplay);
      contentContainer.style.padding = '10px';

      // Function to create tabs and content
      function createTabsAndContent(analyses) {
        // Clear existing tabs and content
        tabsContainer.innerHTML = '';
        contentContainer.innerHTML = '';

        analyses.forEach((analysis, index) => {
          // Create tab
          var tab = L.DomUtil.create('button', 'tab-button', tabsContainer);
          tab.textContent = `Prompt ${index + 1}`;
          tab.style.padding = '8px 12px';
          tab.style.marginRight = '5px';
          tab.style.border = 'none';
          tab.style.backgroundColor = '#e3f2fd';
          tab.style.cursor = 'pointer';
          tab.style.borderRadius = '4px';

          // Create content div
          var content = L.DomUtil.create('div', 'tab-content', contentContainer);
          content.textContent = analysis.response;
          content.style.display = index === 0 ? 'block' : 'none';

          // Add click event to tab
          L.DomEvent.on(tab, 'click', function() {
            // Hide all content
            Array.from(contentContainer.children).forEach(c => c.style.display = 'none');
            // Show selected content
            content.style.display = 'block';
            // Update tab styles
            Array.from(tabsContainer.children).forEach(t => t.style.backgroundColor = '#e3f2fd');
            tab.style.backgroundColor = '#bbdefb';
          });

          // Style first tab as active
          if (index === 0) {
            tab.style.backgroundColor = '#bbdefb';
          }
        });
      }

      answerInput.addEventListener('keypress', async function(e) {
        if (e.key === 'Enter' && current_city && !player_guessed) {
          var userAnswer = answerInput.value.trim();
          if (userAnswer.toLowerCase() === current_city.country.toLowerCase()) {
            points = Math.ceil(time_left/10);
            answerDisplay.textContent = `Correct! ${points} points awarded for answering with ${time_left} seconds left!`;
            score += points;
            updateScoreDisplay();
          } else {
            points = 0;
            answerDisplay.textContent = 'Incorrect';
          }
          answerInput.value = '';
          player_guessed = true;
          updateGameState();
          
          // Stop the jeopardy music
          const jeopardyMusic = document.getElementById('jeopardyMusic');
          jeopardyMusic.pause();
          jeopardyMusic.currentTime = 0;
          
          // Get LLaVA's analysis
          llavaDisplay.textContent = 'LLaVA is analyzing the map...';
          const analyses = await getLLaVAAnalysis();
          createTabsAndContent(analyses);
          updateGameState();
        }
      });

      var nextRoundButton = L.DomUtil.create('button', 'next-round-button', div);
      nextRoundButton.innerHTML = 'Next Round';
      nextRoundButton.style.padding = '8px 16px';
      nextRoundButton.style.backgroundColor = '#2196F3';
      nextRoundButton.style.color = 'white';
      nextRoundButton.style.border = 'none';
      nextRoundButton.style.borderRadius = '4px';
      nextRoundButton.style.cursor = 'pointer';
      nextRoundButton.style.marginTop = '10px';

      L.DomEvent.on(nextRoundButton, 'click', async function() {
        round++;
        updateScoreDisplay();
        
        if (round > 10) {
          // Hide game controls during end game screen
          hideGameControls();
          
          map.setView([-0.22985, -78.52495], 1);

          // Stop the jeopardy music
          const jeopardyMusic = document.getElementById('jeopardyMusic');
          jeopardyMusic.pause();
          jeopardyMusic.currentTime = 0;

          // Draw the missing lines for rounds 9 and 10
          if (selected_cities.length >= 10) {
            // Line for round 9 (between city 8 and 9)
            let city8Idx = selected_cities[7];
            let city9Idx = selected_cities[8];
            let city8Coords = [cities[city8Idx][3], cities[city8Idx][2]];
            let city9Coords = [cities[city9Idx][3], cities[city9Idx][2]];

            // Line for round 10 (between city 9 and 10)
            let city10Idx = selected_cities[9];
            let city10Coords = [cities[city10Idx][3], cities[city10Idx][2]];

            var myColors = [
              "#ec7063",
              "#f5b041",
              "#f4d03f",
              "#52be80",
              "#45b39d",
              "#5dade2",
              "#5499c7",
              "#a569bd",
              "#d98880",
              "#dc7633",
              "#ff7800",
            ];

            // Draw line for round 9
            var round9Lines = {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: {
                    type: "LineString",
                    coordinates: [city8Coords, city9Coords],
                  },
                  properties: {},
                },
              ],
            };

            var round9Style = {
              color: myColors[8],
              weight: 5,
              opacity: 0.65,
            };

            L.geoJSON(round9Lines, {
              style: round9Style,
            }).addTo(map);

            // Draw line for round 10
            var round10Lines = {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: {
                    type: "LineString",
                    coordinates: [city9Coords, city10Coords],
                  },
                  properties: {},
                },
              ],
            };

            var round10Style = {
              color: myColors[9],
              weight: 5,
              opacity: 0.65,
            };

            L.geoJSON(round10Lines, {
              style: round10Style,
            }).addTo(map);
          }

          var gameOverDiv = L.DomUtil.create('div', 'game-over-div', map.getContainer());
          gameOverDiv.style.position = 'absolute';
          gameOverDiv.style.top = '60%';
          gameOverDiv.style.left = '80%';
          gameOverDiv.style.transform = 'translate(-50%, -50%)';
          gameOverDiv.style.backgroundColor = 'white';
          gameOverDiv.style.padding = '20px';
          gameOverDiv.style.borderRadius = '10px';
          gameOverDiv.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
          gameOverDiv.style.textAlign = 'center';
          gameOverDiv.style.zIndex = '1000';

          var gameOverText = L.DomUtil.create('h2', 'game-over-text', gameOverDiv);
          gameOverText.textContent = 'Game Over!';
          gameOverText.style.marginBottom = '20px';

          var finalScore = L.DomUtil.create('p', 'final-score', gameOverDiv);
          finalScore.textContent = `Your Score: ${score}`;
          finalScore.style.marginBottom = '10px';

          var aiScore = L.DomUtil.create('p', 'ai-score', gameOverDiv);
          aiScore.textContent = 'AI Model Score: Coming Soon';
          aiScore.style.marginBottom = '20px';

          var newGameButton = L.DomUtil.create('button', 'new-game-button', gameOverDiv);
          newGameButton.innerHTML = 'Reset Game';
          newGameButton.style.padding = '8px 16px';
          newGameButton.style.backgroundColor = '#2196F3';
          newGameButton.style.color = 'white';
          newGameButton.style.border = 'none';
          newGameButton.style.borderRadius = '4px';
          newGameButton.style.cursor = 'pointer';

          L.DomEvent.on(newGameButton, 'click', function() {
              gameOverDiv.remove();
              score = 0;
              round = 1;
              selected_cities = [];
              window.scoreDisplay.reset();
              showGameControls(); // Show controls when starting new game
              startNewRound();
          });

          map.getContainer().appendChild(gameOverDiv);
          return;
        }

        // Start the new round first
        await startNewRound();

        // Draw line between previous and current city after we have the new city
        if (round > 2) {
          //let currentCityIdx = selected_cities[selected_cities.length - 1];
          let previousCityIdx = selected_cities[selected_cities.length - 2];
          let prevprevCityIdx = selected_cities[selected_cities.length - 3];

          //let currentCoords = [cities[currentCityIdx][3], cities[currentCityIdx][2]];
          let previousCoords = [cities[previousCityIdx][3], cities[previousCityIdx][2]];
          let prevprevCoords = [cities[prevprevCityIdx][3], cities[prevprevCityIdx][2]];

          var myColors = [
            "#ec7063",
            "#f5b041",
            "#f4d03f",
            "#52be80",
            "#45b39d",
            "#5dade2",
            "#5499c7",
            "#a569bd",
            "#d98880",
            "#dc7633",
            "#ff7800",
          ];
        
          var myLines = {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "LineString",
                  coordinates: [
                    previousCoords,
                    prevprevCoords, 
                  ],
                },
                properties: {},
              },
            ],
          };
        
          var myStyle = {
            color: myColors[round - 1],
            weight: 5,
            opacity: 0.65,
          };
        
          L.geoJSON(myLines, {
            style: myStyle,
          }).addTo(map);
        }
      });

      return div;
    };
    gameControl.addTo(map);
  }

  // Function to create score display
  function createScoreDisplay(map) {
    var scoreControl = L.control({ position: "topright" });
    scoreControl.onAdd = function(map) {
      var div = L.DomUtil.create('div', 'score-control');
      div.style.backgroundColor = 'white';
      div.style.padding = '10px';
      div.style.borderRadius = '5px';
      div.style.boxShadow = '0 0 5px rgba(0,0,0,0.2)';
      div.style.fontFamily = 'Arial, sans-serif';
      
      function updateDisplay() {
        div.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 5px;">Geo-Genie: The Geography Game</div>
          <div>Score: ${score}</div>
          <div>Round: ${round}</div>
        `;
      }

      // Initial display
      updateDisplay();
      
      // Make the div accessible globally
      window.scoreDisplay = {
        updateScore: function(points) {
          score += points;
          updateDisplay();
        },
        nextRound: function() {
          round++;
          updateDisplay();
        },
        reset: function() {
          score = 0;
          round = 1;
          updateDisplay();
        }
      };
      
      return div;
    };
    scoreControl.addTo(map);
  }

  // Start the first round
  startNewRound();

  // Timer functionality
  setInterval(async function() {
    if (time_left > 0) {
      time_left--;
      updateTimer();
      if (time_left === 0 && !player_guessed) { 
        // Stop the jeopardy music
        const jeopardyMusic = document.getElementById('jeopardyMusic');
        jeopardyMusic.pause();
        jeopardyMusic.currentTime = 0;
        
        // If time runs out and player hasn't guessed, show LLaVA analysis
        llavaDisplay.textContent = 'LLaVA is analyzing the map...';
        const analyses = await getLLaVAAnalysis();
        createTabsAndContent(analyses);
        player_guessed = true;
        updateGameState();
      }
    }
  }, 1000);
}

function hideGameControls() {
  const gameControl = document.querySelector('.game-control');
  const scoreControl = document.querySelector('.score-control');
  if (gameControl) gameControl.style.display = 'none';
  if (scoreControl) scoreControl.style.display = 'none';
}

function showGameControls() {
  const gameControl = document.querySelector('.game-control');
  const scoreControl = document.querySelector('.score-control');
  if (gameControl) gameControl.style.display = 'block';
  if (scoreControl) scoreControl.style.display = 'block';
}

function showTitleScreen() {
    console.log("Showing title screen...");
    
    // Create title screen div
    var titleScreen = L.DomUtil.create('div', 'title-screen', document.body);
    titleScreen.style.position = 'fixed';
    titleScreen.style.top = '50%';
    titleScreen.style.left = '50%';
    titleScreen.style.transform = 'translate(-50%, -50%)';
    titleScreen.style.backgroundColor = 'white';
    titleScreen.style.padding = '30px';
    titleScreen.style.borderRadius = '15px';
    titleScreen.style.boxShadow = '0 0 20px rgba(0,0,0,0.3)';
    titleScreen.style.textAlign = 'center';
    titleScreen.style.zIndex = '1000';
    titleScreen.style.width = '400px';

    // Add title
    var title = L.DomUtil.create('h1', 'game-title', titleScreen);
    title.textContent = 'Geo-Genie';
    title.style.fontSize = '48px';
    title.style.marginBottom = '20px';
    title.style.color = '#2196F3';

    // Add subtitle
    var subtitle = L.DomUtil.create('h2', 'game-subtitle', titleScreen);
    subtitle.textContent = 'The Geography Game';
    subtitle.style.fontSize = '24px';
    subtitle.style.marginBottom = '30px';
    subtitle.style.color = '#666';

    // Add start button
    var startButton = L.DomUtil.create('button', 'start-button', titleScreen);
    startButton.textContent = 'Start Game';
    startButton.style.padding = '15px 30px';
    startButton.style.fontSize = '20px';
    startButton.style.backgroundColor = '#2196F3';
    startButton.style.color = 'white';
    startButton.style.border = 'none';
    startButton.style.borderRadius = '8px';
    startButton.style.cursor = 'pointer';
    startButton.style.marginBottom = '20px';

    // Add instructions
    var instructions = L.DomUtil.create('div', 'instructions', titleScreen);
    instructions.innerHTML = `
        <h3>How to Play:</h3>
        <p>1. You'll be shown a map centered on a city</p>
        <p>2. Guess which country the city is in</p>
        <p>3. Type your answer and press Enter</p>
        <p>4. Score points based on how quickly you answer</p>
        <p>5. Play 10 rounds to complete the game!</p>
    `;
    instructions.style.textAlign = 'left';
    instructions.style.marginBottom = '20px';

    // Start game when button is clicked
    L.DomEvent.on(startButton, 'click', function() {
        console.log("Start button clicked");
        
        // Start the music first
        const jeopardyMusic = document.getElementById('jeopardyMusic');
        if (jeopardyMusic) {
            console.log("Found jeopardy music element");
            jeopardyMusic.volume = 0.5;
            jeopardyMusic.currentTime = 0;
            jeopardyMusic.play().catch(error => {
                console.log("Error playing music:", error);
            });
        }
        
        // Remove title screen and show controls
        titleScreen.remove();
        showGameControls();
        startNewRound();
    });
}

// Initialize the map when the page loads
window.onload = function() {
  console.log("Window loaded, initializing map...");
  initMap();
};
