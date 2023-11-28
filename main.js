const express = require('express')
const moment = require('moment')
const bodyParser = require('body-parser')
const knex = require('./database/knex')


const app = express()
const port = 4000
app.use(bodyParser.json())

app.get('/', async (req, res) => {
    try {
        const { params, errors } = validateQueryParams(req.query)
        if (errors.length > 0) {
            return res.status(400).json({ errors: errors.join(',\n') })
        }

        const visitedStudents = knex('lesson_students').where('lesson_id', knex.ref('lessons.id')).andWhere('visit', true).count('*').as('visitCount')
        const totalStudents = knex('lesson_students').where('lesson_id', knex.ref('lessons.id')).leftJoin('students', 'students.id', 'lesson_students.student_id').select('name').as('studentName').first()
        let query = knex
            .select('lessons.*',
                visitedStudents,
                totalStudents
            )
            .from('lessons')
            .orderBy('lessons.id')
            .groupBy('lessons.id', 'lessons.date', 'lessons.title', 'lessons.status');
        for (const [k, v] of Object.entries(params)) {
            if (k === 'lessonsPerPage' || k === 'page') {
                continue
            }
            let table = k
            if (k === 'visitCount') {
                table = 'count(lesson_students.id)'
            }
            if (k === 'teacherIds') {
                query.whereIn('lesson_teachers.teacher_id', v)
            }
            if (v.min && v.max) {
                query.whereBetween(table, [v.min, v.max])
                continue
            }
            query.where(table, v)
        }
        const [totalCount, data] = await Promise.all([query.clone().count(), query.limit(params.lessonsPerPage).offset( (params.page - 1) * params.lessonsPerPage)]) 
        
        res.status(200).json({ data })
    } catch (err) {
        console.log(err)
        res.status(400).json({ message: err.severity })
    }

})

app.post('/lessons', (req, res) => {
    res.status(201).json({ ids: [] })
})

app.listen(port, () => {
    console.log('server starting at http://localhost:' + port)
})

const validateQueryParams = (params) => {
    const out = {
        params: {
            page: 1,
            lessonsPerPage: 5
        },
        errors: []
    }
    if (params.date) {
        const dates = params.date.split(',')
        const dateFormat = 'YYYY-MM-DD'
        let isValidDates = true
        if (dates.length > 3) {
            out.errors.push('dates должен быть не больше 2 значений')
        }
        for (const date of dates) {
            if (moment(dates[0], dateFormat, true).isValid() === true) {
                continue
            }
            out.errors.push('dates должен быть в формате "YYYY-MM-DD"')
            isValidDates = false
            break;
        }
        if (isValidDates) {
            if (dates.length == 1) {
                out.params['date'] = dates[0]
            }
            if (dates.length == 2) {
                if (dates[1] < dates[0]) {
                    out.errors.push('dates первый параметр должен быть меньше второго')
                }
                if (dates[0] == dates[1]) {
                    out.params['date'] = dates[0]
                } else {
                    out.params['date'] = {
                        min: dates[0],
                        max: dates[1]
                    }
                }
            }
        }
    }
    if (params.status) {
        const status = params.status
        if (status == 1 || status == 0) {
            out.lessons['status'] = status
        } else {
            out.errors.push('Статус должен быть 1 или 0')
        }
    }
    if (params.teacherIds) {
        const teacherIds = params.teacherIds.split(',')
        out.params.teachers['ids'] = []
        for (const teacherId of teacherIds) {
            if (teacherId > 0) {
                out.params.teachers['teacherIds'].push(teacherId)
                continue;
            }
            out.errors.push('teacherIds должен быть больше 0')
            break;
        }
    }
    if (params.studentsCount) {
        const studentsCount = params.studentsCount.split(',')
        if (studentsCount.length > 3) {
            out.errors.push('studentsCount должен быть не больше 2 значений')
        }
        if (studentsCount.length == 1) {
            out.params['visitCount'] = studentsCount[0]
        }
        if (studentsCount.length == 2) {
            if (studentsCount[1] < studentsCount[0]) {
                out.errors.push('studentsCount первый параметр должен быть меньше второго')
            }
            if (studentsCount[0] == studentsCount[1]) {
                out.params['visitCount'] = studentsCount[0]
            } else {
                out.params['visitCount'] = {
                    min: studentsCount[0],
                    max: studentsCount[1]
                }
            }
        }
    }
    if (params.page) {
        const page = params.page
        if (page > 0) {
            out.lessons.page = page
        } else {
            out.errors.push('Номер страницы должен быть больше 0')
        }
    }
    if (params.lessonsPerPage) {
        const lessonsPerPage = params.lessonsPerPage
        if (lessonsPerPage > 0) {
            out.lessons.lessonsPerPage = lessonsPerPage
        } else {
            out.errors.push('Кол-во lessonsPerPage должно быть больше 0')
        }
    }
    return out
}