require('dotenv').config()

const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

const port = process.env.PORT ?? 1606

app.set('views', './views')
app.set('view engine', 'pug')
app.use(express.static('public'))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())

// Swagger configuration options
const swaggerOptions = {
    swaggerDefinition: {
        openapi: "3.1.0",
        info: {
            title: 'Rest API Swagger Doc',
            description: 'API Documentation for api.student.management',
            version: '1.0.0',
            license: {
                name: "MIT",
                url: "https://spdx.org/licenses/MIT.html",
            },
            contact: {
                name: "Hiro",
                url: "https://github.com/jsFame/api.student.management.git",
                email: "laciferin@gmail.com",
            },
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Development server',
            },
        ],
    },
    apis: ["./routes/*.js",
        './models/**/*.js',],
};

// Swagger documentation setup
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/swagger', swaggerUI.serve, swaggerUI.setup(swaggerSpec, {
    explorer: true,
    customCssUrl:
        "https://cdn.jsdelivr.net/npm/swagger-ui-themes@3.0.0/themes/3.x/theme-newspaper.css",
}));

mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
    .then(() => {
    console.log('Connected to MongoDB Atlas.')
  })
  .catch((err) => {
    console.log('Error occurred connecting to MongoDB Atlas')
  })

const userRoute = require('./routes/user.route')
const classRoute = require('./routes/class.route')
const studentRoute = require('./routes/student.route')
const teacherRoute = require('./routes/teacher.route')
const mentorRoute = require('./routes/mentor.route')
const attendanceRoute = require('./routes/attendance.route')
const recordRoute = require('./routes/record.route')

app.use('/users', userRoute)
app.use('/classes', classRoute)
app.use('/students', studentRoute)
app.use('/teachers', teacherRoute)
app.use('/mentors', mentorRoute)
app.use('/attendances', attendanceRoute)
app.use('/records', recordRoute)


app.get('*', function (req, res) {
  res.status(404).json({ error: 'Not Found' })
})

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
})
