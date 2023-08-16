const mongoose = require('mongoose')

const recordSchema = mongoose.Schema({
  name: {
    type: String,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  },
  type: {
    type: String,
    enum: ['EXERCISE', 'HOMEWORK', 15, 50, 90, 120],
    required: true,
  },
  date: {
    type: Date,
  },
  note: {
    type: String,
  },
})

module.exports = mongoose.model('Record', recordSchema)
