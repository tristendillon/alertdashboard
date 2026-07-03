import { v } from 'convex/values'
import {
  CurrentWeather,
  ActiveWeatherAlerts,
  WeatherDays,
  WeatherHours,
  WeatherDetail,
} from './schema'
import { type QueryCtx, query } from './_generated/server'
import { authedOrThrowMutation } from '../lib/auth'
import type { Id } from './_generated/dataModel'

export const createWeatherDetails = authedOrThrowMutation({
  args: {
    details: v.array(WeatherDetail.table.validator),
  },
  handler: async (ctx, args) => {
    const { details } = args
    const existingDetails = await ctx.db.query('weatherDetails').collect()
    const existingDetailsMap = new Map(
      existingDetails.map((detail) => [detail.detailId, detail])
    )
    for (const detail of details) {
      if (existingDetailsMap.has(detail.detailId)) {
        await ctx.db.patch(existingDetailsMap.get(detail.detailId)!._id, detail)
      } else {
        await ctx.db.insert('weatherDetails', detail)
      }
    }
    return details
  },
})

export const getWeatherDetails = query({
  handler: async (ctx) => {
    const weatherDetails = await ctx.db.query('weatherDetails').collect()
    return weatherDetails
  },
})

export const deleteWeatherDataWithoutIds = authedOrThrowMutation({
  args: {},
  handler: async (ctx) => {
    const weatherHours = await ctx.db.query('weatherHours').collect()
    const weatherDays = await ctx.db.query('weatherDays').collect()
    const currentWeather = await ctx.db.query('currentWeather').first()
    const activeWeatherAlerts = await ctx.db
      .query('activeWeatherAlerts')
      .collect()
    for (const hour of weatherHours) {
      await ctx.db.delete(hour._id)
    }
    for (const day of weatherDays) {
      await ctx.db.delete(day._id)
    }
    if (currentWeather) {
      await ctx.db.delete(currentWeather._id)
    }
    for (const alert of activeWeatherAlerts) {
      await ctx.db.delete(alert._id)
    }
  },
})

export const deleteWeatherData = authedOrThrowMutation({
  args: {
    ids: v.array(
      v.union(
        v.id('weatherHours'),
        v.id('weatherDays'),
        v.id('currentWeather'),
        v.id('activeWeatherAlerts')
      )
    ),
  },
  handler: async (ctx, args) => {
    const { ids } = args
    for (const id of ids) {
      await ctx.db.delete(id)
    }
  },
})

export const createWeather = authedOrThrowMutation({
  args: {
    hours: v.array(WeatherHours.table.validator),
    days: v.array(WeatherDays.table.validator),
    current: CurrentWeather.table.validator,
    alerts: v.array(ActiveWeatherAlerts.table.validator),
  },
  handler: async (ctx, args) => {
    const { hours, days, current, alerts } = args
    const hoursIds: Id<'weatherHours'>[] = []
    for (const hour of hours) {
      const hourId = await ctx.db.insert('weatherHours', hour)
      hoursIds.push(hourId)
    }
    const daysIds: Id<'weatherDays'>[] = []
    for (const day of days) {
      const dayId = await ctx.db.insert('weatherDays', day)
      daysIds.push(dayId)
    }
    const currentWeatherId = await ctx.db.insert('currentWeather', current)
    const alertsIds: Id<'activeWeatherAlerts'>[] = []
    for (const alert of alerts) {
      const alertId = await ctx.db.insert('activeWeatherAlerts', alert)
      alertsIds.push(alertId)
    }
    return {
      hours: hoursIds,
      days: daysIds,
      current: currentWeatherId,
      alerts: alertsIds,
    }
  },
})

export const getCurrentWeather = query({
  handler: async (ctx) => {
    const currentWeather = await ctx.db.query('currentWeather').first()
    return currentWeather
  },
})

const GetWeatherDetails = async (ctx: QueryCtx, detailIds: number[]) => {
  const details = await Promise.all(
    detailIds.map((detailId) => {
      const detail = ctx.db
        .query('weatherDetails')
        .withIndex('by_detailId', (q) => q.eq('detailId', detailId))
        .first()
      return detail
    })
  )
  return details
}

/**
 * Get weather data for a specific date
 * @param date Unix timestamp in seconds
 * @returns Weather data for the specified date
 */
const GetWeatherByDate = async (ctx: QueryCtx, date: number) => {
  const dateObj = new Date(date * 1000)
  const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0))
  const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999))
  const weatherDays = await ctx.db.query('weatherDays').collect()
  const realWeatherDays = weatherDays.filter((day) => {
    const dayObj = new Date(day.dt * 1000)
    return dayObj >= startOfDay && dayObj <= endOfDay
  })
  const day = realWeatherDays[0]
  if (!day) {
    return {
      days: [],
      hours: [],
      current: null,
    }
  }
  const details = await GetWeatherDetails(ctx, day.weather)
  const joinedDay = {
    ...day,
    weather: details,
  }
  return joinedDay
}

const GetWeatherHoursByDateRange = async (
  ctx: QueryCtx,
  start: number,
  end: number
) => {
  const startDate = new Date(start * 1000)
  const endDate = new Date(end * 1000)
  const weatherHours = await ctx.db
    .query('weatherHours')
    .withIndex('by_dt', (q) =>
      q.gte('dt', startDate.getTime()).lte('dt', endDate.getTime())
    )
    .collect()
  return weatherHours
}

export const getWeatherByDate = query({
  args: {
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const { date } = args
    return await GetWeatherByDate(ctx, date)
  },
})

export const getTodaysWeather = query({
  handler: async (ctx) => {
    const currentDate = new Date()
    return await GetWeatherByDate(ctx, currentDate.getTime() / 1000)
  },
})

export const getWeatherForecast = query({
  args: {
    date: v.number(),
    hours: v.number(),
  },
  handler: async (ctx, args) => {
    const { date, hours } = args
    const alerts = await ctx.db.query('activeWeatherAlerts').collect()
    const currentWeather = await ctx.db.query('currentWeather').first()
    const weatherHours = await GetWeatherHoursByDateRange(
      ctx,
      date,
      date + hours * 60 * 60
    )
    const value = {
      hours: weatherHours,
      current: currentWeather,
      alerts: alerts,
    }
    return value
  },
})
