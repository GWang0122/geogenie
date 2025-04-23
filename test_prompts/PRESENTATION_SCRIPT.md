# Geo-Genie Presentation Script

## Introduction
"Good [morning/afternoon/evening] everyone. Today, I'm excited to present Geo-Genie, an innovative geography game that combines human intelligence with AI analysis. This project demonstrates how we can use large language and vision models to create engaging educational experiences."

## Project Overview
"Geo-Genie is an interactive geography game where players identify cities and countries based on map views. What makes it unique is that it uses the LLaVA model - that's Large Language and Vision Assistant - to provide multiple AI perspectives on geographical locations. This allows players to not only test their knowledge but also learn from the AI's analysis."

## Key Features
"Let me walk you through the key features:
1. We have an interactive map interface built with Leaflet.js
2. A time-based scoring system that rewards quick thinking
3. Multiple AI prompt variations to test different aspects of the model's understanding
4. A tabbed interface that lets players compare different AI responses
5. Visual tracking of visited cities with colorful connecting lines
6. And background music to enhance the gaming experience"

## Technical Architecture
"Now, let's look at how it all works technically. The system has two main components:

First, the backend built with FastAPI that:
- Hosts the LLaVA model for image analysis
- Processes map images and returns AI analyses
- Uses 4-bit quantization to make the model more efficient

And second, the frontend built with vanilla JavaScript and Leaflet.js that:
- Provides the interactive map interface
- Handles game logic and scoring
- Displays AI responses in an easy-to-compare format"

## Game Flow
"Let me demonstrate how the game works:
1. The game starts with a map centered on South America
2. Each round, a random city is selected
3. Players have 30 seconds to identify the country
4. Points are awarded based on how quickly they answer
5. After each round, the AI provides multiple analyses of the location
6. The game continues for 10 rounds, tracking progress with colorful lines"

## AI Analysis System
"What makes Geo-Genie particularly interesting is its use of multiple prompt variations. Instead of just one AI response, we get several different perspectives. For example:
- Basic identification prompts
- Geographical feature analysis prompts
- Contextual analysis prompts

This allows us to see how different ways of asking the same question can lead to different insights from the AI."

## Scoring System
"The scoring system is designed to reward quick thinking:
- Players get more points for faster answers
- The formula is simple: points = ceiling(time_left/10)
- This means you can get up to 3 points per round if you're quick
- But even if you take your time, you'll still get at least 1 point"

## Future Improvements
"Looking ahead, we have several exciting improvements planned:
1. Adding difficulty levels to challenge different skill levels
2. Implementing multiplayer functionality
3. Expanding the city database
4. Adding more geographical features
5. Implementing model performance tracking
6. Adding user statistics and achievements"

## Conclusion
"In conclusion, Geo-Genie demonstrates how we can combine:
- Interactive web technologies
- Advanced AI models
- Educational content
- And engaging gameplay

To create a unique learning experience that's both fun and informative. The project shows the potential of using AI not just as a tool, but as a teaching assistant that can provide multiple perspectives on the same problem."

## Q&A
"Thank you for your attention. I'd be happy to answer any questions you might have about:
- The technical implementation
- The AI model's performance
- Future development plans
- Or any other aspect of the project" 