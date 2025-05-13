import { describe, it, expect, beforeEach, vi } from 'vitest'
import participantMutators from '../participantMutators'
import { Participant } from '@/replicache/models/index'

// mock de transacTtion replicache
let mockDB

beforeEach(() => {
    mockDB = new Map()

    // simulateur de transaction
    global.tx = {
        get: async (key) => mockDB.get(key),
        set: async (key, value) => mockDB.set(key, value),
        del: async (key) => mockDB.delete(key),
    }
})

describe('participantMutators', () => {
    it('create un participant', async () => {
        const id = 'p1'
        const tournamentId = 't1'
        const data = {
            firstName: 'Floflo',
            lastName: 'Guerlain',
            birthDate: '2003-01-01',
            clubName: 'Nancy',
            weight: 75,
            nationalityId: 'FR',
            genderId: '1',
            gradeId: '5',
        }

        await participantMutators.createParticipant(tx, { id, tournamentId, ...data })

        const stored = await tx.get(`participant/${id}`)
        expect(stored).toBeInstanceOf(Participant)
        expect(stored.firstName).toBe('Floflo')
        expect(stored.tournamentId).toBe('t1')
    })

    it('update un participant', async () => {
        const id = 'p2'
        const original = new Participant(id, 't2', 'Diane', 'Lalala', '1995-05-05', 'Club A', 65, 'DE', 'F', '2K')
        await tx.set(`participant/${id}`, original)

        await participantMutators.updateParticipant(tx, { id, weight: 70, clubName: 'Club B' })

        const updated = await tx.get(`participant/${id}`)
        expect(updated.weight).toBe(70)
        expect(updated.clubName).toBe('Club B')
        expect(updated.firstName).toBe('Diane')
    })

    it('delete un participant', async () => {
        const id = 'p3'
        await tx.set(`participant/${id}`, new Participant(id, 't3', 'Marc', 'Dupont', '1990-01-01', 'Dojo', 80, 'FR', 'M', '3K'))

        await participantMutators.deleteParticipant(tx, { id })

        const result = await tx.get(`participant/${id}`)
        expect(result).toBeUndefined()
    })

    it('elimine un participant', async () => {
        const id = 'p4'
        const p = new Participant(id, 't4', 'Lisa', 'Chan', '1999-03-12', 'Judo Club', 60, 'CN', 'F', '1D')
        await tx.set(`participant/${id}`, p)

        await participantMutators.eliminateParticipant(tx, { id })

        const eliminated = await tx.get(`participant/${id}`)
        expect(eliminated.isEliminated).toBe(true)
    })

    it('ne fait rien si on veut eliminer un participant inconnu', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
        await participantMutators.eliminateParticipant(tx, { id: 'inconnu' })
        expect(spy).toHaveBeenCalled()
        spy.mockRestore()
    })
})
