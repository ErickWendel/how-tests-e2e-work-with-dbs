import { describe, beforeEach, before, after, it } from 'node:test'
import { deepStrictEqual } from 'node:assert'
import { runSeed } from '../config/seed.js'
import { users } from '../config/users.js'

describe('API Workflow', () => {
    let _testServer
    let _testServerAddress

    function createCustomer(customer) {
        return _testServer.inject({
            method: 'POST',
            url: `${_testServerAddress}/customers`,
            payload: customer,
        })
    }

    function getCustomers() {
        return _testServer.inject({
            method: 'GET',
            url: `${_testServerAddress}/customers`,
        })
    }

    async function validateUsersListOrderedByName(usersSent) {
        const res = await getCustomers()
        const statusCode = res.statusCode
        const result = await res.json()
        const expectSortedByName = usersSent.sort((a, b) => a.name.localeCompare(b.name))
        deepStrictEqual(statusCode, 200)
        deepStrictEqual(result, expectSortedByName)
    }

    before(async () => {
        const { server } = await import('../src/index.js')
        _testServer = server

        _testServerAddress = await server.listen();
    })

    beforeEach(async () => {
        return runSeed()
    })

    after(async () => _testServer.close())

    describe('POST /customers', () => {
        it('should create customer', async (context) => {

            const input = {
                name: 'Xuxa da Silva',
                phone: '123456789',
            }

            const expected = `user ${input.name} created!`

            const { body } = await createCustomer(input)
            deepStrictEqual(body, expected)

            await validateUsersListOrderedByName([...users, input])
        })
    })

    describe(`GET /customers`, () => {
        it('should retrieve only initial users', async () => {
            return validateUsersListOrderedByName(users)
        })

        it('given 5 different customers it should have valid list', async (context) => {

            const customers = [
                {
                    name: 'Erick Wendel',
                    phone: '123456789',
                },
                {
                    name: 'Ana Neri',
                    phone: '123456789',
                },
                {
                    name: 'Shrek de Souza',
                    phone: '123456789',
                },
                {
                    name: 'Nemo de Oliveira',
                    phone: '123456789',
                },
                {
                    name: 'Buzz da Rocha',
                    phone: '123456789',
                },

            ]
            await Promise.all(
                customers.map(customer => createCustomer(customer))
            )

            await validateUsersListOrderedByName(users.concat(customers))
        })
    })
})