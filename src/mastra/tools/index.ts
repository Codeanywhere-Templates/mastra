import { createTool } from "@mastra/core/tools";
import { z } from "zod";

interface GeocodingResponse {
  results: {
    latitude: number;
    longitude: number;
    name: string;
  }[];
}
interface WeatherResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    weather_code: number;
  };
}

interface ForecastResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_mean: number[];
    weathercode: number[];
  };
}

// Activity categories for recommendations
const activityCategories = [
  "outdoor_recreation",
  "indoor_entertainment",
  "cultural",
  "dining",
  "shopping",
  "sports",
  "family_friendly",
  "nightlife",
  "relaxation",
  "educational",
] as const;

export const weatherTool = createTool({
  id: "get-weather",
  description: "Get current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("City name"),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    feelsLike: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    windGust: z.number(),
    conditions: z.string(),
    location: z.string(),
  }),
  execute: async ({ context }) => {
    return await getWeather(context.location);
  },
});

// Tool for recommending activities based on location, type, and date
export const activitiesRecommendationTool = createTool({
  id: "recommend-activities",
  description:
    "Get activity recommendations based on location, activity type, and date",
  inputSchema: z.object({
    location: z.string().describe("City or location name"),
    activityType: z
      .enum(activityCategories)
      .describe("Type of activity to recommend"),
    date: z
      .string()
      .optional()
      .describe("Date in YYYY-MM-DD format (optional, defaults to today)"),
    maxResults: z
      .number()
      .min(1)
      .max(10)
      .optional()
      .describe("Maximum number of recommendations to return (1-10)"),
  }),
  outputSchema: z.object({
    forecast: z.union([
      z.object({
        date: z.string(),
        maxTemp: z.number(),
        minTemp: z.number(),
        precipitationChance: z.number(),
        condition: z.string(),
        location: z.string(),
      }),
      z.array(
        z.object({
          date: z.string(),
          maxTemp: z.number(),
          minTemp: z.number(),
          precipitationChance: z.number(),
          condition: z.string(),
          location: z.string(),
        })
      ),
    ]),
    activityType: z.string(),
    maxResults: z.number(),
  }),
  execute: async ({ context }) => {
    return await suggestActivities(
      context.location,
      context.activityType,
      context.date,
      context.maxResults
    );
  },
});

const getWeather = async (location: string) => {
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const geocodingResponse = await fetch(geocodingUrl);
  const geocodingData = (await geocodingResponse.json()) as GeocodingResponse;

  if (!geocodingData.results?.[0]) {
    throw new Error(`Location '${location}' not found`);
  }

  const { latitude, longitude, name } = geocodingData.results[0];

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;

  const response = await fetch(weatherUrl);
  const data = (await response.json()) as WeatherResponse;

  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windGust: data.current.wind_gusts_10m,
    conditions: getWeatherCondition(data.current.weather_code),
    location: name,
  };
};

function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return conditions[code] || "Unknown";
}

// Function to get weather forecast for a specific date
const getWeatherForecast = async (location: string, date?: string) => {
  // First get location coordinates
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const geocodingResponse = await fetch(geocodingUrl);
  const geocodingData = (await geocodingResponse.json()) as GeocodingResponse;

  if (!geocodingData.results?.[0]) {
    throw new Error(`Location '${location}' not found`);
  }

  const { latitude, longitude, name } = geocodingData.results[0];

  // Get forecast data
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_mean,weathercode&timezone=auto`;
  const response = await fetch(weatherUrl);
  const data = (await response.json()) as ForecastResponse;

  // If no specific date is provided, return the forecast for the next 7 days
  if (!date) {
    return data.daily.time.map((forecastDate, index) => ({
      date: forecastDate,
      maxTemp: data.daily.temperature_2m_max[index],
      minTemp: data.daily.temperature_2m_min[index],
      precipitationChance: data.daily.precipitation_probability_mean[index],
      condition: getWeatherCondition(data.daily.weathercode[index]),
      location: name,
    }));
  }

  // Find the forecast for the specific date
  const dateIndex = data.daily.time.findIndex((d) => d === date);
  if (dateIndex === -1) {
    throw new Error(`No forecast available for date: ${date}`);
  }

  return {
    date: data.daily.time[dateIndex],
    maxTemp: data.daily.temperature_2m_max[dateIndex],
    minTemp: data.daily.temperature_2m_min[dateIndex],
    precipitationChance: data.daily.precipitation_probability_mean[dateIndex],
    condition: getWeatherCondition(data.daily.weathercode[dateIndex]),
    location: name,
  };
};

// Function to suggest activities based on weather, location, and preferences
const suggestActivities = async (
  location: string,
  activityType: string,
  date?: string,
  maxResults: number = 5
) => {
  // Get weather forecast for the specified date or today
  const forecast = await getWeatherForecast(location, date);

  // Return the forecast and activity type for the agent to process
  return {
    forecast,
    activityType,
    maxResults,
  };
};
