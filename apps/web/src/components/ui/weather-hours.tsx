"use client";

import type {
  CurrentWeatherWithDetails,
  WeatherHourWithDetails,
} from "@/lib/types";
import { useWeather } from "@/providers/weather-provider";
import { timeStampFormatter } from "@/utils/timestamp";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils/ui";

const getWeatherIconUrl = (icon: string) => {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
};

const getWindDirection = (degrees: number) => {
  if (degrees === undefined) return "N/A";
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return directions[Math.round(degrees / 22.5) % 16];
};

interface WeatherHourProps {
  weather: WeatherHourWithDetails | CurrentWeatherWithDetails;
}

function WeatherHour({ weather }: WeatherHourProps) {
  const formatDate = timeStampFormatter("short-24h");
  return (
    <div className="flex min-w-[120px] flex-col items-center">
      <div className="text-primary/70 text-xs">{formatDate(weather.dt)}</div>

      <div className="bg-primary mb-1 flex h-7 w-7 items-center justify-center rounded-full">
        <Image
          src={getWeatherIconUrl(weather.weather[0].icon)}
          alt={weather.weather[0].description}
          width={24}
          height={24}
          className="h-6 w-6"
        />
      </div>
      <div className="mb text-lg font-bold">{Math.round(weather.temp)}°</div>
      <div className="text-xs capitalize">{weather.weather[0]?.main}</div>
      <div className="text-muted-foreground text-center text-xs">
        <div>Humid: {weather.humidity}%</div>
        {weather.windSpeed !== undefined && (
          <div>
            Wind: {Math.round(weather.windSpeed)} mph{" "}
            {getWindDirection(weather.windDeg ?? 0)}
          </div>
        )}
      </div>
    </div>
  );
}

interface MobileWeatherCardProps {
  currentWeather: CurrentWeatherWithDetails;
  weatherHours: WeatherHourWithDetails[];
}

function MobileWeatherCard({
  currentWeather,
  weatherHours,
}: MobileWeatherCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="cursor-pointer">
          <div className="flex items-center justify-between">
            <h3 className="text-sm">Weather</h3>
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                isOpen && "rotate-90",
              )}
            />
          </div>

          <div className="flex items-center space-x-4">
            <Image
              src={getWeatherIconUrl(currentWeather.weather[0].icon)}
              alt={currentWeather.weather[0].description}
              width={48}
              height={48}
              className="h-12 w-12"
            />
            <div className="flex-1">
              <div className="text-lg font-bold">
                {Math.round(currentWeather.temp)}°
              </div>
              <div className="text-xs capitalize opacity-80">
                {currentWeather.weather[0].description}
              </div>
            </div>
          </div>

          <div className="mt-2 text-center text-xs opacity-60">
            Tap to view forecast
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-80">
        <div className="grid grid-cols-2 gap-4">
          <WeatherHour weather={currentWeather} />
          {weatherHours.slice(0, 4).map((weather) => (
            <WeatherHour key={weather.dt} weather={weather} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function WeatherHours() {
  const { currentWeather, weatherHours, isLoading } = useWeather();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading weather data...</div>
      </div>
    );
  }

  if (!currentWeather) {
    return null;
  }

  const forecastHours = weatherHours.slice(0, 4);

  return (
    <>
      {/* Desktop/Tablet View - Hidden on mobile */}
      <div className="hidden items-center gap-4 md:flex">
        {/* Today - Current Weather */}
        {currentWeather && <WeatherHour weather={currentWeather} />}
        {/* Forecast Days */}
        {forecastHours.map((weather) => (
          <WeatherHour key={weather.dt} weather={weather} />
        ))}
      </div>

      {/* Mobile View - Hidden on tablet and up */}
      <div className="md:hidden">
        <MobileWeatherCard
          currentWeather={currentWeather}
          weatherHours={weatherHours}
        />
      </div>
    </>
  );
}
