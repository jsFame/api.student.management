const mongoose = require('mongoose')

const teacherSchema = mongoose.Schema({
  exp: {
    type: Number,
  },
  subjectName: {
    type: String,
    enum: ['MATH', 'ENGLISH', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'HISTORY'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
})

module.exports = mongoose.model('Teacher', teacherSchema)
