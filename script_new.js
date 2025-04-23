function initMap() {
  // Check if Leaflet is available
  if (typeof L === "undefined") {
    console.error("Leaflet library (L) is not loaded!");
    return;
  }
  // Initialize the map centered on Britain
  var map = L.map("map", {
    minZoom: 3,
    maxZoom: 14,
  }).setView([-23.5475, -46.63611], 3);

  map.dragging.disable();

  // Add OpenStreetMap tiles
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 14,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  // List of lists with country, element 1, city element 2
  // latitude element 3, longitude element 4
  var cities_america = [
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
    ["United States", "Brooklyn", 40.6501, -73.94958],
    ["Ecuador", "Guayaquil", -2.19616, -79.88621],
    ["Brazil", "Belo Horizonte", -19.92083, -43.93778],
    ["Brazil", "Salvador", -12.97563, -38.49096],
    ["United States", "Chicago", 41.85003, -87.65005],
    ["Canada", "Toronto", 43.70643, -79.39864],
    ["Brazil", "Fortaleza", -3.71722, -38.54306],
    ["Colombia", "Cali", 3.43722, -76.5225],
    ["United States", "Houston", 29.76328, -95.36327],
  ];
  // Function to get a random city from cities_america
  function getRandomCity(selectedCitiesIdx) {
    const randomIndex = Math.floor(Math.random() * cities_america.length);
    if (selectedCitiesIdx.includes(randomIndex)) {
      return getRandomCity(selectedCitiesIdx);
    }
    return randomIndex;
  }

  var current_cityIdx = 0;
  function playNewGame() {
    const rounds = 10;
    const selectedCities = [];
    
    for (let i = 0; i < rounds+1; i++) {
      const cityIdx = getRandomCity(selectedCities);
      selectedCities.push(cityIdx);
    }

    current_cityIdx = playRound(selectedCities);
    
    return selectedCities;
  }

  function playRound(selectedCities) {
    cityIdx = selectedCities.pop();
    
    const city = cities_america[cityIdx];
    map.setView([city[2], city[3]], 10);
    // Create a marker for the city
    const marker = L.marker([city[2], city[3]]).addTo(map);
    //marker.bindPopup(`${city[1]}`);

    return cityIdx;
  }
  
  // Start the game
  var gameCities = playNewGame();

  var score = 0;
  var round = 0;
  var points = 0;
  var time_left = 30;

  var gameControl = L.control({position: 'bottomleft'});
  gameControl.onAdd = function(map) {
    var div = L.DomUtil.create('div', 'game-control');
    div.style.backgroundColor = 'white';
    div.style.padding = '10px';
    div.style.borderRadius = '5px';
    div.style.boxShadow = '0 0 5px rgba(0,0,0,0.2)';
    div.style.fontFamily = 'Arial, sans-serif';
    
    var questionText = L.DomUtil.create('div', 'question-text', div);
    questionText.innerHTML = 'What is the country of the city in the middle of the map?';
    questionText.style.marginBottom = '10px';
    questionText.style.fontWeight = 'bold';

    var answerInput = L.DomUtil.create('input', 'answer-input', div);
    answerInput.type = 'text';
    answerInput.placeholder = 'Enter your answer here...';
    answerInput.style.width = '100%';
    answerInput.style.padding = '8px';
    answerInput.style.marginBottom = '10px';
    answerInput.style.border = '1px solid #ccc';
    answerInput.style.borderRadius = '4px';
    answerInput.style.boxSizing = 'border-box';

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
        if (!cities_america.some(city => city[1].toLowerCase() === userAnswer.toLowerCase())) {
          teleportToCityDisplay.placeholder = userAnswer +' does not match any city in database, please re-type exact spelling'; 
        }
        else {
          teleportToCityDisplay.value = cities_america[current_cityIdx][1];
          answerDisplay.textContent = 'Press enter above to teleport back to the round\'s target city';
          let teleportToCityIdx = cities_america.findIndex(city => city[1].toLowerCase() === userAnswer.toLowerCase());
          map.setView([cities_america[teleportToCityIdx][2], cities_america[teleportToCityIdx][3]], 10);
        }
      }
    });

    var answerDisplay = L.DomUtil.create('div', 'answer-display', div);
    answerDisplay.style.marginTop = '10px';
    answerDisplay.style.padding = '8px';
    answerDisplay.style.backgroundColor = '#f5f5f5';
    answerDisplay.style.borderRadius = '4px';
    answerDisplay.style.minHeight = '20px';
    answerDisplay.style.fontStyle = 'italic';
    answerDisplay.style.color = '#666';

    answerInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        var userAnswer = answerInput.value.trim();
        answerDisplay.textContent = Math.round(time_left/10);
        if (!cities_america.some(city => city[0].toLowerCase() === userAnswer.toLowerCase())) {
          answerDisplay.textContent = userAnswer +' does not match any country in database, please re-type exact spelling'; 
          points = 0;
        }
        else if (cities_america[current_cityIdx][0].toLowerCase() === userAnswer.toLowerCase()) {
          answerDisplay.textContent = 'Correct! ' + Math.ceil(time_left/10) + ' points awarded for answering with ' + time_left + ' seconds left!';
          points = Math.ceil(time_left/10);
        }
        else {
          answerDisplay.textContent = 'Incorrect';
          points = 0;
        }
        answerInput.value = ''; // Clear the input after submission
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
    nextRoundButton.style.marginLeft = '10px';

    L.DomEvent.on(nextRoundButton, 'click', function() {
      window.scoreDisplay.updateScore(points);
      window.scoreDisplay.nextRound();
      let currentCity = gameCities[round];
      let previousCity = gameCities[round-1];
      let currentCoords = [currentCity[3], currentCity[2]];
      let previousCoords = [previousCity[3], previousCity[2]];

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
                 currentCoords, 
               ],
             },
             properties: {},
           },
        ],
      };
    
      var myStyle = {
        color: myColors[round],
        weight: 5,
        opacity: 0.65,
      };
    
      L.geoJSON(myLines, {
        style: myStyle,
      }).addTo(map);

      if (round > 10) {
        map.setView([-0.22985, -78.52495], 1);

        var gameOverDiv = L.DomUtil.create('div', 'game-over-div', map.getContainer());
        gameOverDiv.style.position = 'absolute';
        gameOverDiv.style.top = '50%';
        gameOverDiv.style.left = '50%';
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
          window.scoreDisplay.reset();
        });

        map.getContainer().appendChild(gameOverDiv);
      }

      current_cityIdx = playRound(gameCities);
      time_left = 30;
      //nextRoundButton.disabled = true;
      //nextRoundButton.style.backgroundColor = '#ccc';
      current_round = round;
      var timer = setInterval(function() {
        time_left--;
        nextRoundButton.innerHTML = `Next Round (${time_left}s)`;
        
        if (round != current_round) {
          clearInterval(timer);
        }
        if (time_left <= 0) {
          time_left = 0;
          clearInterval(timer);
          nextRoundButton.innerHTML = 'Next Round';
          nextRoundButton.disabled = false;
          nextRoundButton.style.backgroundColor = '#2196F3';
          //playRound();
        }
      }, 1000);
    });


    return div;
  };
  gameControl.addTo(map);

  var scoreControl = L.control({ position: "topright" });
  scoreControl.onAdd = function(map) {
    var div = L.DomUtil.create('div', 'score-control');
    div.style.backgroundColor = 'white';
    div.style.padding = '10px';
    div.style.borderRadius = '5px';
    div.style.boxShadow = '0 0 5px rgba(0,0,0,0.2)';
    div.style.fontFamily = 'Arial, sans-serif';
    div.style.marginBottom = '20px'; // Add some margin from the bottom
    
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
        round = 0;
        updateDisplay();
      }
    };
  
  var newGameButton = L.DomUtil.create('button', 'play-button', div);
  newGameButton.innerHTML = 'Play Game';
  newGameButton.style.padding = '8px 16px';
  newGameButton.style.backgroundColor = '#4CAF50';
  newGameButton.style.color = 'white';
  newGameButton.style.border = 'none';
  newGameButton.style.borderRadius = '4px';
  newGameButton.style.cursor = 'pointer';
  
  L.DomEvent.on(newGameButton, 'click', function() {
    gameCities = playNewGame();
    window.scoreDisplay.reset();
  });
      
  function updateDisplay() {
    div.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">Geo-Genie - America's Edition</div>
      <div>Score: ${score}</div>
      <div>Round: ${round}</div>
    `;
    div.appendChild(newGameButton);
  }

  // Initial display
  updateDisplay();
      
  return div;
  };
  scoreControl.addTo(map);


  var debugControl = L.control({position: 'bottomright'});
  debugControl.onAdd = function(map) {
    var div = L.DomUtil.create('div', 'debug-control');
    div.style.backgroundColor = 'white';
    div.style.padding = '10px';
    div.style.borderRadius = '5px';
    div.style.boxShadow = '0 0 5px rgba(0,0,0,0.2)';
    div.style.fontFamily = 'Arial, sans-serif';
    div.style.maxHeight = '200px';
    div.style.overflowY = 'auto';
    
    var debugTitle = L.DomUtil.create('div', 'debug-title', div);
    debugTitle.innerHTML = 'Debug Info - Game Cities';
    debugTitle.style.fontWeight = 'bold';
    debugTitle.style.marginBottom = '5px';
    
    var debugContent = L.DomUtil.create('div', 'debug-content', div);
    debugContent.style.fontSize = '12px';
    
    gameCities.forEach((cityIdx, index) => {
      const city = cities_america[cityIdx];
      var cityInfo = L.DomUtil.create('div', 'city-info', debugContent);
      cityInfo.innerHTML = `${index + 1}. ${city[1]}, ${city[0]}`;
      cityInfo.style.marginBottom = '2px';
    });
    
    return div;
  };
  debugControl.addTo(map);


  //Function to handle the click event
  // var popup = L.popup();
  // function onMapClick(e) {
  //   popup
  //     .setLatLng(e.latlng)
  //     .setContent("You clicked the map at " + e.latlng.toString())
  //     .openOn(map);
  // }

  // map.on("click", onMapClick);

  

  function onEachFeature(feature, layer) {
    if (feature.properties && feature.properties.popupContent) {
      layer.bindPopup(feature.properties.popupContent);
    }
  }

  let latFormatted = cities_america[0][2] + "°, " + cities_america[0][3] + "°";
  var geojsonFeature = {
    type: "Feature",
    properties: {
      name: "Sao Paulo",
      amenity: "city",
      popupContent: "First city coordinates: " + latFormatted,
    },
    geometry: {
      type: "Point",
      coordinates: [-46.63611, -23.5475],
    },
  };

  //L.geoJSON(geojsonFeature, {
  //  onEachFeature: onEachFeature,
  //}).addTo(map);
  
}

// Initialize the map when the page loads
document.addEventListener("DOMContentLoaded", initMap);
