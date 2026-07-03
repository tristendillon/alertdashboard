import Image from "next/image";
import { Clock } from "./clock";
import { DismissButton } from "./dismiss-button";
import { TurnoutTimer } from "./turnout-timer";
import { WeatherHours } from "./weather-hours";

interface HeaderProps {
  isIframe: boolean;
}

export function Header({ isIframe }: HeaderProps) {
  if (isIframe) {
    return (
      <div className="absolute top-6 right-0 z-50">
        <DismissButton />
      </div>
    );
  }
  return (
    <nav className="bg-background flex h-32 w-screen items-center pr-10">
      <div className="hidden min-w-28 items-center gap-4 p-4 sm:flex md:w-full md:max-w-[30%]">
        <Image
          src="/logos/logo_256.png"
          alt="MFD Alerts"
          width={98}
          height={98}
          className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24"
        />
        <h1 className="text-primary hidden text-center text-lg font-bold tracking-wider uppercase lg:block lg:text-2xl">
          Manhattan <br />
          Fire Department
        </h1>
      </div>
      <div className="flex h-full w-full items-center gap-4 pl-4 text-lg font-semibold">
        <WeatherHours />
        <TurnoutTimer />
        <DismissButton />
        <div className="hidden flex-1 items-center justify-end xl:flex">
          <Clock />
        </div>
      </div>
    </nav>
  );
}
