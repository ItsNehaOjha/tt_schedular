import Timetable from '../../models/Timetable.js'
import { asyncHandler } from '../../utils/errorHandler.js'

export const getTimetableStats = asyncHandler(async (req, res, next) => {
  const stats = await Timetable.aggregate([
    {
      $group: {
        _id: null,
        totalTimetables: { $sum: 1 },
        publishedTimetables: { $sum: { $cond: [{ $eq: ['$isPublished', true] }, 1, 0] } },
        draftTimetables: { $sum: { $cond: [{ $eq: ['$isPublished', false] }, 1, 0] } }
      }
    }
  ])

  const branchStats = await Timetable.aggregate([{ $group: { _id: '$branch', count: { $sum: 1 } } }])

  res.status(200).json({
    success: true,
    data: {
      overview: stats[0] || { totalTimetables: 0, publishedTimetables: 0, draftTimetables: 0 },
      branchStats
    }
  })
})
