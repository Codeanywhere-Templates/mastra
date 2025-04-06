# Local Recommendations Agent with Memory

This Mastra agent provides personalized recommendations for places to visit based on your geolocation, current weather conditions, and personal preferences. It remembers your previous interactions to provide increasingly personalized recommendations over time.

## Features

- **Geolocation-based**: Get recommendations for places near your current location
- **Weather-aware**: Recommendations consider current weather conditions (suggesting indoor activities when it's raining, etc.)
- **Preference-based**: Filter recommendations by category (museums, parks, restaurants, etc.) and indoor/outdoor preference
- **Memory-enabled**: The agent remembers your preferences and previous interactions to provide more personalized recommendations over time

## Available Categories

The agent can recommend attractions in the following categories:

- museum: Art galleries, history museums, science centers, etc.
- park: Public parks, gardens, urban green spaces
- restaurant: Dining establishments of all types
- cafe: Coffee shops, tea houses, casual eateries
- shopping: Retail areas, markets, malls
- historical: Historic sites, monuments, landmarks
- entertainment: Theaters, cinemas, performance venues
- outdoor: Hiking trails, nature reserves, outdoor activities
- sports: Sports venues, recreational facilities
- cultural: Cultural centers, theaters, performance spaces
- nightlife: Bars, clubs, evening entertainment
- family: Family-friendly attractions, playgrounds
- beach: Beaches, coastal areas
- nature: Natural attractions, parks, gardens
- viewpoint: Scenic viewpoints, observation decks

## Memory System

The agent uses Mastra's memory system to maintain context across conversations:

- **Thread ID**: Identifies a specific conversation thread
- **Resource ID**: Identifies the user or entity involved in the conversation

By providing the same thread and resource IDs across multiple interactions, the agent can:

1. Remember your preferences
2. Refer to previous recommendations
3. Provide more personalized suggestions over time
4. Avoid recommending places you've already visited or expressed disinterest in

## Usage

### Command Line Interface

Run the CLI to interact with the agent:

```bash
ts-node src/examples/localRecommendationsCLI.ts
```

The CLI will prompt you for:

1. Your location
2. Indoor/outdoor preference
3. Categories of interest
4. Number of recommendations

The CLI maintains a persistent conversation thread, so the agent will remember your previous interactions.

### Programmatic Usage

You can also use the agent programmatically:

```typescript
import { mastra } from "./src/mastra";

// Create a persistent thread and resource ID for this conversation
const threadId = "travel_recommendations_thread";
const resourceId = "user_123";

// Get recommendations
const result = await mastra.workflows.localRecommendationsWorkflow.trigger({
  location: "New York",
  indoor: true, // Optional: true for indoor, false for outdoor
  categories: ["museum", "restaurant"], // Optional: categories of interest
  maxResults: 5, // Optional: number of recommendations (1-10)
  threadId, // For maintaining conversation context
  resourceId, // For user identification
});

console.log(result.recommendations);
```

## Example Conversation

Here's an example of how the agent's memory works:

1. **First interaction**:

   ```
   User: I'm in New York and looking for museums
   Agent: Here are some great museums in New York: Metropolitan Museum of Art, MoMA, and American Museum of Natural History...
   ```

2. **Second interaction**:

   ```
   User: What about restaurants?
   Agent: Based on your interest in museums in New York, you might enjoy these restaurants near cultural attractions: Katz's Delicatessen near the Tenement Museum, The Modern at MoMA, and...
   ```

3. **Third interaction**:
   ```
   User: I'm going to Paris next week
   Agent: I see you're interested in museums and restaurants. In Paris, you might enjoy the Louvre Museum, Musée d'Orsay, and Centre Pompidou. For dining, Le Jules Verne at the Eiffel Tower and Café de Flore are excellent choices...
   ```

The agent remembers your preferences and adapts its recommendations accordingly.
