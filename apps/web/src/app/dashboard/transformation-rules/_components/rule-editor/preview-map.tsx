"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { MapPin, MapPinOff, Move } from "lucide-react";
import type { FieldTransformationConfig } from "@sizeupdashboard/convex/src/lib/transform/core.ts";
import type {
  DispatchWithType,
  TransformedDispatch,
} from "@sizeupdashboard/convex/src/api/schema.ts";

const hasMapsKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

const RealPreviewMap = dynamic(
  () => import("./preview-map-google").then((m) => m.RealPreviewMap),
  { ssr: false },
);

const GROUP_COLORS: Record<string, string> = {
  fire: "oklch(0.58 0.21 27)",
  medical: "oklch(0.55 0.14 250)",
  mva: "oklch(0.68 0.14 75)",
  law: "oklch(0.45 0.12 281)",
  hazmat: "oklch(0.6 0.16 140)",
  rescue: "oklch(0.6 0.15 200)",
};

export interface PreviewMapProps {
  original: DispatchWithType;
  transformed: TransformedDispatch;
  configs: FieldTransformationConfig[];
}

export function maxOffsetMeters(configs: FieldTransformationConfig[]): number {
  let maxOff = 0;
  for (const c of configs) {
    if (c.strategy === "random_offset" && c.field.startsWith("location.")) {
      const mx = Math.abs(Number(c.params.maxOffset ?? 0));
      if (mx > maxOff) maxOff = mx;
    }
  }
  return Math.round(maxOff * 111000);
}

export function PreviewMap({ original, transformed, configs }: PreviewMapProps) {
  const locationRemoved = transformed.location === undefined;
  const group = original.group ?? original.dispatchGroup;
  const color = GROUP_COLORS[group] ?? "var(--primary)";
  const meters = useMemo(() => maxOffsetMeters(configs), [configs]);

  if (hasMapsKey && !locationRemoved) {
    return (
      <RealPreviewMap
        original={original}
        transformed={transformed}
        meters={meters}
      />
    );
  }

  return (
    <SchematicMap
      original={original}
      transformed={transformed}
      color={color}
      meters={meters}
      locationRemoved={locationRemoved}
    />
  );
}

const SCHEMATIC_STYLE = `
.pm-map{--pm-bg:oklch(0.955 0.005 248);--pm-line:oklch(0.89 0.008 248);--pm-road:oklch(0.82 0.012 248);--pm-offset:oklch(0.55 0.14 250);}
.dark .pm-map{--pm-bg:oklch(0.21 0.045 285);--pm-line:oklch(0.27 0.06 283);--pm-road:oklch(0.33 0.07 282);--pm-offset:oklch(0.72 0.13 250);}
`;

const SPAN = 0.004;
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

function SchematicMap({
  original,
  transformed,
  color,
  meters,
  locationRemoved,
}: {
  original: DispatchWithType;
  transformed: TransformedDispatch;
  color: string;
  meters: number;
  locationRemoved: boolean;
}) {
  const origin = original.location;
  const px = (lng: number) => 50 + ((lng - origin.lng) / SPAN) * 50;
  const py = (lat: number) => 50 - ((lat - origin.lat) / SPAN) * 50;

  const dest = transformed.location;
  const moved =
    dest !== undefined &&
    (dest.lat !== origin.lat || dest.lng !== origin.lng);

  const radiusDiameterPct = Math.min(48, (meters / 111000 / SPAN) * 50) * 2;

  return (
    <div className="pm-map relative min-h-[210px] flex-1 overflow-hidden rounded-lg border">
      <style>{SCHEMATIC_STYLE}</style>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(var(--pm-line) 1px, transparent 1px) 0 0 / 26px 26px, linear-gradient(90deg, var(--pm-line) 1px, transparent 1px) 0 0 / 26px 26px, var(--pm-bg)",
        }}
      />
      {/* faux roads */}
      <div
        className="absolute"
        style={{
          background: "var(--pm-road)",
          left: "-10%",
          right: "-10%",
          height: "7px",
          top: "58%",
          transform: "rotate(-4deg)",
        }}
      />
      <div
        className="absolute"
        style={{
          background: "var(--pm-road)",
          top: "-10%",
          bottom: "-10%",
          width: "5px",
          left: "34%",
          transform: "rotate(7deg)",
        }}
      />

      {locationRemoved ? (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "color-mix(in oklch, var(--pm-bg) 55%, transparent)" }}
        >
          <span className="text-destructive bg-card inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold shadow-sm">
            <MapPinOff className="size-3" />
            Removed — will not appear on the public map
          </span>
        </div>
      ) : (
        dest && (
          <>
            {moved && radiusDiameterPct > 0 ? (
              <div
                className="absolute rounded-full border-[1.5px] border-dashed"
                style={{
                  left: `${px(origin.lng)}%`,
                  top: `${py(origin.lat)}%`,
                  width: `${radiusDiameterPct}%`,
                  aspectRatio: "1",
                  transform: "translate(-50%, -50%)",
                  borderColor:
                    "color-mix(in oklch, var(--pm-offset) 65%, transparent)",
                  background:
                    "color-mix(in oklch, var(--pm-offset) 6%, transparent)",
                }}
              />
            ) : null}
            {moved ? (
              <div
                className="border-muted-foreground absolute size-3 rounded-full border-2"
                style={{
                  left: `${px(origin.lng)}%`,
                  top: `${py(origin.lat)}%`,
                  transform: "translate(-50%, -50%)",
                  opacity: 0.8,
                }}
                title="True location — never shown publicly"
              />
            ) : null}
            <div
              className="absolute"
              style={{
                left: `${clamp(px(dest.lng), 6, 94)}%`,
                top: `${clamp(py(dest.lat), 12, 88)}%`,
                transform: "translate(-50%, -92%)",
                color,
              }}
            >
              <MapPin className="size-6 fill-current" strokeWidth={1.5} />
            </div>
            {moved && meters > 0 ? (
              <div className="bg-card absolute bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold whitespace-nowrap shadow-sm">
                <Move
                  className="size-3"
                  style={{ color: "var(--pm-offset)" }}
                />
                pin lands anywhere within ~{meters} m
              </div>
            ) : null}
          </>
        )
      )}
    </div>
  );
}
