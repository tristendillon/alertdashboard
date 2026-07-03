"use client";

import React, {
  createContext,
  useContext,
  type ReactNode,
  useMemo,
} from "react";
import { useQuery } from "@/hooks/use-query";
import { api } from "@sizeupdashboard/convex/src/api/_generated/api.js";
import {
  type ActiveWeatherAlert,
  type CurrentWeatherWithDetails,
  type WeatherHourWithDetails,
  type WeatherDetail,
} from "@/lib/types";

interface WeatherContextType {
  weatherHours: WeatherHourWithDetails[];
  currentWeather: CurrentWeatherWithDetails | null;
  weatherAlerts: ActiveWeatherAlert[];
  isLoading: boolean;
  error: Error | null;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

interface WeatherProviderProps {
  children: ReactNode;
}

// const sampleAlerts = [
//   {
//     senderName: "National Weather Service",
//     event: "Tornado Warning",
//     start: Date.now(),
//     end: Date.now() + 2 * 60 * 60 * 1000,
//     description:
//       "A tornado warning has been issued for the immediate area. Take shelter immediately in a sturdy building.",
//     tags: ["Severe", "Immediate Action"],
//   },
//   {
//     senderName: "NWS Storm Prediction Center",
//     event: "Severe Thunderstorm Watch",
//     start: Date.now() - 30 * 60 * 1000,
//     end: Date.now() + 4 * 60 * 60 * 1000,
//     description:
//       "Conditions are favorable for severe thunderstorms with large hail and damaging winds.",
//     tags: ["Watch", "Hail", "High Winds"],
//   },
//   {
//     senderName: "Local Emergency Management",
//     event: "Fire Ban in Effect",
//     start: Date.now() - 24 * 60 * 60 * 1000,
//     end: Date.now() + 7 * 24 * 60 * 60 * 1000,
//     description:
//       "Due to dry conditions and high fire danger, all outdoor burning is prohibited.",
//     tags: ["Fire Safety", "Outdoor Burning"],
//   },
// ];

// Any type that contains an array of weather detail ids

const mapWeatherDetail = (
  data: number[],
  weatherDetails: WeatherDetail[],
): WeatherDetail[] => {
  return data
    .map((detail) => weatherDetails.find((dt) => dt.detailId === detail))
    .filter((dt) => dt !== undefined);
};
export const WeatherProvider: React.FC<WeatherProviderProps> = ({
  children,
}) => {
  const today = useMemo(() => new Date(), []);
  const {
    data: forecast,
    isPending: forecastPending,
    error: forecastError,
  } = useQuery(api.weather.getWeatherForecast, {
    hours: 3,
    date: today.getTime() / 1000,
  });
  const {
    data: weatherDetails,
    isPending: weatherDetailsPending,
    error: weatherDetailsError,
  } = useQuery(api.weather.getWeatherDetails);

  const mappedWeatherHours = forecast?.hours.map(({ weather, ...rest }) => ({
    ...rest,
    weather: mapWeatherDetail(weather, weatherDetails ?? []),
  }));

  const mappedCurrentWeather = forecast?.current
    ? {
        ...forecast.current,
        weather: mapWeatherDetail(
          forecast.current.weather,
          weatherDetails ?? [],
        ),
      }
    : null;

  const value: WeatherContextType = {
    weatherHours: mappedWeatherHours ?? [],
    currentWeather: mappedCurrentWeather ?? null,
    weatherAlerts: forecast?.alerts ?? [],
    // weatherAlerts: sampleAlerts,
    isLoading: forecastPending || weatherDetailsPending,
    error: forecastError ?? weatherDetailsError ?? null,
  };
  return (
    <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
  );
};

export const useWeather = (): WeatherContextType => {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error("useWeather must be used within a WeatherProvider");
  }
  return context;
};
