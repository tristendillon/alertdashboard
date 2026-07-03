export function CleanUnits(units: string[]): string[] {
  return units.filter((unit) => {
    const upper = unit.toUpperCase();

    // Remove if it contains "RCFD" or "OFC"
    if (upper.includes("RCFD") || upper.includes("OFC")) {
      return false;
    }

    // Remove if it's purely a number or parses to a number (not NaN)
    const parsed = parseFloat(unit);
    if (!isNaN(parsed)) {
      return false;
    }

    return true;
  });
}
