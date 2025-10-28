import {
  AlertSource,
  InsertAlertSchema,
  type InsertAlert,
} from '@alertdashboard/schemas'

/**
 * Generate a random fake alert for testing
 */
export function generateFakeAlert() {
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

  const source =
    Object.values(AlertSource)[
      Math.floor(Math.random() * Object.values(AlertSource).length)
    ]
  const city = cities[Math.floor(Math.random() * cities.length)]!
  const incidentType =
    incidentTypes[Math.floor(Math.random() * incidentTypes.length)]

  const baseLat = 37.7749 + (Math.random() - 0.5) * 2
  const baseLng = -122.4194 + (Math.random() - 0.5) * 2

  const alert: InsertAlert = {
    source,
    latitude: baseLat,
    longitude: baseLng,
    address: `${Math.floor(Math.random() * 9999)} Main St`,
    address2: `9${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')}`,
    city,
    state: 'CA',
    fullAddress: `${Math.floor(Math.random() * 9999)} Main St`,
    incidentType,
    dispatchId: `FAKE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    externalId: `FAKE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    units: [
      `Engine ${Math.floor(Math.random() * 20) + 1}`,
      `Medic ${Math.floor(Math.random() * 15) + 1}`,
    ],
  }
  const { data, error } = InsertAlertSchema.safeParse(alert)
  if (error) {
    throw new Error(`Failed to generate fake alert: ${error.message}`)
  }
  return data
}
