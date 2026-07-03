import { useWeather } from "@/providers/weather-provider";
import {
  WeatherAlert,
  WeatherAlertHeader,
  WeatherAlertFooter,
  WeatherAlertTags,
  WeatherAlertTimeRange,
  WeatherAlertTitle,
  WeatherAlertSeverity,
} from "./weather-alert-overlay";

/**
 * Large weather alert component for sidebar display on larger screens
 * Shows full weather alert details with expanded layout
 */
export function RenderWeatherAlerts() {
  const { weatherAlerts } = useWeather();

  if (weatherAlerts.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-0 left-0 hidden space-y-3 border-b p-1 lg:block">
      {weatherAlerts.map((alert, index) => (
        <WeatherAlert key={index} alert={alert} className="w-full">
          <WeatherAlertHeader>
            <WeatherAlertTitle />
            <WeatherAlertSeverity />
          </WeatherAlertHeader>
          <WeatherAlertTags />
          <WeatherAlertFooter className="mt-3">
            <WeatherAlertTimeRange format="short-24h" />
          </WeatherAlertFooter>
        </WeatherAlert>
      ))}
    </div>
  );
}
