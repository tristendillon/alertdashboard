import { InsertAlertSchema, type InsertAlert } from '@alertdashboard/schemas'

/**
 * Generate a random fake alert for testing
 */
export function generateFakeAlert(): InsertAlert {
  const titles = [
    'Structure Fire - Residential',
    'Medical Emergency - Cardiac Arrest',
    'Vehicle Accident - Multiple Injuries',
    'Wildfire - Spreading Rapidly',
    'Gas Leak - Commercial Building',
    'Water Rescue - River',
    'Hazmat Incident - Chemical Spill',
    'Building Collapse - Under Construction',
  ]

  const descriptions = [
    'Multiple units responding. Heavy smoke visible.',
    'CPR in progress. ETA 3 minutes.',
    'Multiple vehicles involved. Traffic blocked.',
    'Evacuations underway. Air support requested.',
    'Building evacuated. Gas company notified.',
    'Subject in distress. Swift water team dispatched.',
    'Perimeter established. Hazmat team en route.',
    'Search and rescue operations initiated.',
  ]

  const cities = [
    'San Francisco',
    'Los Angeles',
    'Seattle',
    'Portland',
    'Denver',
    'Phoenix',
  ]

  const incidentTypes = [
    'Fire',
    'Medical',
    'Traffic Collision',
    'Rescue',
    'Hazmat',
    'Other',
  ]

  const severities: Array<'low' | 'medium' | 'high' | 'critical'> = [
    'low',
    'medium',
    'high',
    'critical',
  ]

  const sources: Array<'firstdue' | 'active911'> = ['firstdue', 'active911']

  // Random selections
  const title = titles[Math.floor(Math.random() * titles.length)]!
  const description =
    descriptions[Math.floor(Math.random() * descriptions.length)]
  const city = cities[Math.floor(Math.random() * cities.length)]!
  const severity = severities[Math.floor(Math.random() * severities.length)]!
  const source = sources[Math.floor(Math.random() * sources.length)]!
  const incidentType =
    incidentTypes[Math.floor(Math.random() * incidentTypes.length)]

  // Random location near the city
  const baseLat = 37.7749 + (Math.random() - 0.5) * 2
  const baseLng = -122.4194 + (Math.random() - 0.5) * 2

  return InsertAlertSchema.parse({
    source,
    alertData: {
      title,
      description,
      severity,
      location: {
        latitude: baseLat,
        longitude: baseLng,
        city,
        state: 'CA',
        address: `${Math.floor(Math.random() * 9999)} Main St`,
        zip: `9${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, '0')}`,
      },
      incidentType,
      units: [
        `Engine ${Math.floor(Math.random() * 20) + 1}`,
        `Medic ${Math.floor(Math.random() * 15) + 1}`,
      ],
      rawData: {
        generated: true,
        timestamp: Date.now(),
      },
    },
    externalId: `FAKE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  })
}
