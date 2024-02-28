import Fastify from 'fastify'
import { getDb } from './db.js'

const fastify = Fastify({})
const isTestEnv = process.env.NODE_ENV === 'test'

if (!isTestEnv && !process.env.DB_NAME) {
    console.error('[error*****]: please, pass DB_NAME env before running it!')
    process.exit(1)
}

const { dbClient, collections: { dbUsers } } = await getDb()

fastify.get('/customers', async (request, reply) => {
    const users = await dbUsers
        .find({})
        .project({ _id: 0 })
        .sort({ name: 1 })
        .toArray()

    return reply.code(200).send(users)
})

fastify.post('/customers', {
    schema: {
        body: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
            }
        },
        response: {
            200: {
                type: 'string',
            },
        }
    },

}, async (request, reply) => {
    const user = request.body
    await dbUsers.insertOne(user)
    return reply.code(201).send(`user ${user.name} created!`)
})

fastify.addHook('onClose', async () => {
    console.log('server closed!')
    return dbClient.close()
})


if (!isTestEnv) {
    const serverInfo = await fastify.listen({
        port: process.env.PORT || 9999,
        host: '::',
    })

    console.log(`server is running at ${serverInfo}`)
}

export const server = fastify

