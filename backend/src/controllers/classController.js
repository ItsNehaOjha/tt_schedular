import ClassSection from '../models/ClassSection.js'

// Get all available class options for dropdowns
export const getClassOptions = async (req, res) => {
  try {
    // Get distinct values for dropdowns
    const years = await ClassSection.distinct('year')
    const branches = await ClassSection.distinct('branch')
    const sections = await ClassSection.distinct('section')

    // If no data exists, provide default options
    const defaultYears = ['1', '2', '3', '4']
    const defaultBranches = ['cse', 'ece', 'eee', 'mech', 'civil', 'it']
    const defaultSections = ['A', 'B', 'C', 'D']

    // Sort the arrays
    const sortedYears = years.length > 0 ? years.sort((a, b) => parseInt(a) - parseInt(b)) : defaultYears
    const sortedBranches = branches.length > 0 ? branches.sort() : defaultBranches
    const sortedSections = sections.length > 0 ? sections.sort() : defaultSections

    res.status(200).json({
      success: true,
      data: {
        years: sortedYears,
        branches: sortedBranches,
        sections: sortedSections
      }
    })
  } catch (error) {
    console.error('Error fetching class options:', error)
    // Return default options on error
    res.status(200).json({
      success: true,
      data: {
        years: ['1', '2', '3', '4'],
        branches: ['cse', 'ece', 'eee', 'mech', 'civil', 'it'],
        sections: ['A', 'B', 'C', 'D']
      }
    })
  }
}

// Get all classes
export const getAllClasses = async (req, res) => {
  try {
    const classes = await ClassSection.find()
      .populate('classTeacher', 'firstName lastName username')
      .sort({ year: 1, branch: 1, section: 1 })

    res.status(200).json({
      success: true,
      data: classes
    })
  } catch (error) {
    console.error('Error fetching classes:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch classes',
      error: error.message
    })
  }
}

// Get classes by filter
export const getClassesByFilter = async (req, res) => {
  try {
    const { year, branch, section } = req.query
    
    let filter = {}
    if (year) filter.year = year
    if (branch) filter.branch = branch
    if (section) filter.section = section

    const classes = await ClassSection.find(filter)
      .populate('classTeacher', 'firstName lastName username')
      .sort({ year: 1, branch: 1, section: 1 })

    res.status(200).json({
      success: true,
      data: classes
    })
  } catch (error) {
    console.error('Error fetching filtered classes:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch classes',
      error: error.message
    })
  }
}

// Get class by ID
export const getClassById = async (req, res) => {
  try {
    const { id } = req.params
    const classData = await ClassSection.findById(id)
      .populate('classTeacher', 'firstName lastName username')

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      })
    }

    res.status(200).json({
      success: true,
      data: classData
    })
  } catch (error) {
    console.error('Error fetching class:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class',
      error: error.message
    })
  }
}