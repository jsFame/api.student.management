const StudentModel = require('../models/student.model')
const UserModel = require('../models/user.model')
const StudentRecordModel = require('../models/student-record.model')
const AttendanceModel = require('../models/attendance.model')
const sha256 = require('sha256') // hash password


module.exports = {
  //========================================================= GET STUDENTS, OR LOW LEVEL QUERY ===================================================//
  get: async (req, res) => {
    let students
    let studentsQueried
    let studentTransform
    const query = req.query || {}
    try {
      studentsQueried = await StudentModel.find(query)
        .lean()
        .populate({
          path: 'userId listClass',
          select:
            'firstName lastName fullName date_of_birth gender email timetable grade className',
          populate: {
            path: 'teacherId mentorId',
            populate: {
              path: 'userId',
              select: 'firstName lastName fullName date_of_birth gender email',
            },
          },
        })
    } catch (err) {
      return res.status(201).json({ error: err })
    }
    // JSON BEAUTIFY
    students = studentsQueried.map((student) => {
      student.userId._id = undefined
      if (student.listClass.length > 0) {
        student.listClass.map((item) => {
          if (item.teacherId) {
            item.teacherId = { ...item.teacherId.userId, ...item.teacherId }
            item.mentorId = { ...item.mentorId.userId, ...item.mentorId }
            item.teacherId.userId = undefined
            item.mentorId.userId = undefined
            item.teacherId._id = undefined
            item.teacherId.__v = undefined
            if (item.mentorId) {
              item.mentorId._id = undefined
              item.mentorId.__v = undefined
            }
          }
          return item
        })
      }
      studentTransform = { ...student.userId, ...student }
      studentTransform.userId = undefined

      return studentTransform
    })
    return res.json(students)
  },
  //========================================================= CREATE NEW STUDENT ============================================================/
  post: async (req, res) => {
    // STUDENT AND MENTOR AT THE SAME TIME CASE?
    var matchedUser = await UserModel.findById(req.params.id)
    let user = new UserModel({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      fullName: req.body.lastName + ' ' + req.body.firstName,
      date_of_birth: req.body.date_of_birth,
      gender: req.body.gender,
      email: req.body.email,
      role: req.body.role,
      username: req.body.username,
      password: req.body.password && sha256(req.body.password),
    })
    try {
      await user.save()
    } catch (err) {
      return res.status(201).json({ error: err })
    }
    // ROLE VALIDATION
    if (matchedUser.role !== 'STUDENT') {
      return res.status(201).json({ error: "User's role is not STUDENT" })
    }
    // CREATE AN ARRAY OF CLASSES WHICH STUDENT TAKE PART IN
    let listClass = []
    if (req.body.classId) {
      if (req.body.classId.length >= 2 && typeof req.body.classId !== 'string') {
        for (var c of req.body.classId) {
          listClass.push(c)
        }
      } else {
        listClass.push(req.body.classId)
      }
    }
    // CREATE NEW STUDENT
    var newStudent = new StudentModel({
      school: req.body.school,
      grade: req.body.grade,
      userId: req.params.id,
      status: 'active',
      studentPhone: req.body.studentPhone,
      parentPhone: req.body.parentPhone,
      parentName: req.body.parentName,
      listClass: listClass,
    })
    try {
      await newStudent.save()
    } catch (err) {
      return res.status(201).json({ error: err })
    }
    return res.json({ newStudent })
  },
  //========================================================== EDIT STUDENT INFORMATION =======================================================//
  put: async (req, res) => {
    let student
    try {
      student = await StudentModel.findById(req.params.id)
      if (!student) throw 'Student Not Found'
    } catch (err) {
      return res.status(201).json({ error: err })
    }
    // EDIT ARRAY OF CLASS
    var listClass = []
    if (req.body.classId) {
      if (req.body.classId.length >= 2 && typeof req.body.classId !== 'string') {
        for (var c of req.body.classId) {
          listClass.push(c)
        }
      } else {
        listClass.push(req.body.classId)
      }
    }
    try {
      if (req.body.school) {
        student.school = req.body.school
      }
      if (req.body.grade) {
        student.grade = req.body.grade
      }
      if (req.body.status) {
        student.status = req.body.status
      }
      if (req.body.studentPhone) {
        student.studentPhone = req.body.studentPhone
      }
      if (req.body.parentPhone) {
        student.parentPhone = req.body.parentPhone
      }
      if (req.body.parentName) {
        student.parentName = req.body.parentName
      }
      if (req.body.classId) {
        student.listClass = listClass
      }
      await student.save()
    } catch (err) {
      return res.status(201).json({ error: err })
    }
    return res.json(student)
  },
  //========================================================= DELETE STUDENT ==============================================================//
  delete: async (req, res) => {
    try {
      await StudentModel.findById(req.params.id, null, async (err, student) => {
        if (err || !student) throw 'Student Not Found'
        await UserModel.findByIdAndDelete(student.userId)
        student.remove()
      })
    } catch (err) {
      res.status(201).json({ error: err })
    }
    return res.json({ result: 'deleted successfully' })
  },
  //========================================================= VIEW STUDENT ==============================================================//
  studentView: async (req, res) => {
    let student
    let studentRecords
    let studentAttendances
    let queriedAttendances
    // QUERY STUDENT INFO
    try {
      student = await StudentModel.findById(req.params.id)
        .lean()
        .populate({
          path: 'userId listClass',
          select:
            'firstName lastName fullName date_of_birth gender email timetable grade className',
          populate: {
            path: 'teacherId mentorId',
            populate: {
              path: 'userId',
              select: 'firstName lastName fullName date_of_birth gender email',
            },
          },
        })
      // JSON BEAUTIFY
      student.userId._id = undefined
      if (student.listClass.length > 0) {
        student.listClass.map((item) => {
          if (item.teacherId) {
            item.teacherId = { ...item.teacherId.userId, ...item.teacherId }
            item.mentorId = { ...item.mentorId.userId, ...item.mentorId }
            item.teacherId.userId = undefined
            item.mentorId.userId = undefined
            item.teacherId._id = undefined
            item.teacherId.__v = undefined
            if (item.mentorId) {
              item.mentorId._id = undefined
              item.mentorId.__v = undefined
            }
          }
          return item
        })
      }
      student = { ...student.userId, ...student }
      student.userId = undefined
    } catch (error) {
      return res.status(201).json({ error: error })
    }
    try {
      // ATTENDANCES
      queriedAttendances = await AttendanceModel.find({ studentId: req.params.id })
        .lean()
        .populate({
          path: 'classId',
          select: 'teacherId mentorId className grade subjectName timetable',
          populate: {
            path: 'teacherId mentorId',
            populate: {
              path: 'userId',
              select: 'firstName lastName fullName date_of_birth gender email',
            },
          },
        })
      // JSON BEAUTIFY
      studentAttendances = queriedAttendances.map((item) => {
        if (item.classId.teacherId) {
          item.classId.teacherId = {
            ...item.classId.teacherId.userId,
            ...item.classId.teacherId,
          }
          item.classId.teacherId.userId = undefined
          item.classId.teacherId._id = undefined
          item.classId.teacherId.__v = undefined
          if (item.classId.mentorId) {
            item.classId.mentorId = {
              ...item.classId.mentorId.userId,
              ...item.classId.mentorId,
            }
            item.classId.mentorId._id = undefined
            item.classId.mentorId.__v = undefined
            item.classId.mentorId.userId = undefined
            item.__v = undefined
          }
          item.studentId = undefined
        }
        return item
      })
      // RECORDS
      studentRecords = await StudentRecordModel.find({
        studentId: req.params.id,
      })
        .lean()
        .populate('recordId')
    } catch (err) {
      return res.status(201).json({ error: err })
    }
    return res.json({
      student: student,
      studentRecords: studentRecords,
      studentAttendances: studentAttendances,
    })
  },
  postUserAndStudent: async (req, res) => {
    var fullName = req.body.lastName + ' ' + req.body.firstName
    var password = fullName.split(' ').join('').toLowerCase()
    let username
    if (req.body.studentPhone) {
      username = req.body.studentPhone
    }
    if (req.body.parentPhone && !req.body.studentPhone) {
      username = req.body.parentPhone
    }
    let user = new UserModel({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      fullName: fullName,
      date_of_birth: req.body.date_of_birth,
      gender: req.body.gender,
      email: req.body.email,
      username: username,
      role: 'STUDENT',
      password: password && sha256(password),
    })
    try {
      await user.save()
    } catch (err) {
      return res.status(201).json({ error: err })
    }
    // CREATE AN ARRAY OF CLASSES WHICH STUDENT TAKE PART IN
    let listClass = []
    if (req.body.classId) {
      if (req.body.classId.length >= 2 && typeof req.body.classId !== 'string') {
        for (var c of req.body.classId) {
          listClass.push(c)
        }
      } else {
        listClass.push(req.body.classId)
      }
    }
    // CREATE NEW STUDENT
    var newStudent = new StudentModel({
      school: req.body.school,
      grade: req.body.grade,
      userId: user._id,
      status: 'active',
      studentPhone: req.body.studentPhone,
      parentPhone: req.body.parentPhone,
      parentName: req.body.parentName,
      listClass: listClass,
    })
    try {
      await newStudent.save()
    } catch (err) {
      return res.status(201).json({ error: err })
    }
    user.password = undefined
    user.__v = undefined
    newStudent.userId = undefined
    newStudent.__v = undefined
    return res.json({ newUser: user, newStudent: newStudent })
  },
}
