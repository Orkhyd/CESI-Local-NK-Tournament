import { describe, it, expect, beforeEach, vi } from 'vitest'
import matchMutators from '../matchMutators.js'
import { Match } from '@/replicache/models/Match.js'

describe('matchMutators', () => {
    let tx

    // avant chaquue test on prepare un faux store
    beforeEach(() => {
        const store = new Map()

        tx = {
            set: vi.fn((key, value) => store.set(key, value)),
            get: vi.fn((key) => Promise.resolve(store.get(key))),
            del: vi.fn((key) => store.delete(key)),
        }
    })

    // donnees de base d un match
    const baseMatchData = {
        idMatch: 'match-1',
        idMatchType: 1,
        idRound: 'round-1',
        idPool: 'pool-1',
        idPlayer1: 'player-1',
        idPlayer2: 'player-2',
        idPreviousMatch1: null,
        idPreviousMatch2: null,
        ipponsPlayer1: 2,
        ipponsPlayer2: 1,
        keikokusPlayer1: 0,
        keikokusPlayer2: 1,
        idWinner: 'player-1'
    }

    it('createMatch doit enregistrer un nouveau match avec toute les infos', async () => {
        await matchMutators.createMatch(tx, baseMatchData)

        expect(tx.set).toHaveBeenCalledTimes(1)

        const expectedMatch = new Match(
            baseMatchData.idMatch,
            baseMatchData.idMatchType,
            baseMatchData.idRound,
            baseMatchData.idPool,
            baseMatchData.idPlayer1,
            baseMatchData.idPlayer2,
            baseMatchData.idPreviousMatch1,
            baseMatchData.idPreviousMatch2,
            baseMatchData.ipponsPlayer1,
            baseMatchData.ipponsPlayer2,
            baseMatchData.keikokusPlayer1,
            baseMatchData.keikokusPlayer2,
            baseMatchData.idWinner
        )

        const saved = tx.set.mock.calls[0][1]

        expect(saved.idMatch).toBe(baseMatchData.idMatch)
        expect(saved.idPlayer1).toBe(baseMatchData.idPlayer1)
        expect(saved.idPlayer2).toBe(baseMatchData.idPlayer2)
        expect(saved.ipponsPlayer1).toBe(baseMatchData.ipponsPlayer1)
        expect(saved.idWinner).toBe(baseMatchData.idWinner)
        expect(saved.createdAt).toBeDefined()

    })

    it('updateMatch doit modif les champs existants du match', async () => {
        await matchMutators.createMatch(tx, baseMatchData)

        await matchMutators.updateMatch(tx, {
            idMatch: baseMatchData.idMatch,
            ipponsPlayer1: 3,
            idWinner: 'player-2'
        })

        const updated = await tx.get(`match/${baseMatchData.idMatch}`)

        expect(updated.ipponsPlayer1).toBe(3)
        expect(updated.idWinner).toBe('player-2')
    })

    it('switchPlayers doit echanger les deux joueurs du match', async () => {
        await matchMutators.createMatch(tx, baseMatchData)

        await matchMutators.switchPlayers(tx, { idMatch: baseMatchData.idMatch })

        const updated = await tx.get(`match/${baseMatchData.idMatch}`)

        expect(updated.idPlayer1).toBe(baseMatchData.idPlayer2)
        expect(updated.idPlayer2).toBe(baseMatchData.idPlayer1)
    })

    it('deleteMatch doit supp le match du store', async () => {
        await matchMutators.createMatch(tx, baseMatchData)

        await matchMutators.deleteMatch(tx, { idMatch: baseMatchData.idMatch })

        expect(tx.del).toHaveBeenCalledWith(`match/${baseMatchData.idMatch}`)
    })

    it('updateTimer doit modifier les valeurs du chronomeetre  du match', async () => {
        await matchMutators.createMatch(tx, baseMatchData)

        await matchMutators.updateTimer(tx, {
            idMatch: baseMatchData.idMatch,
            isRunning: true,
            currentTime: 120,
            additionalTime: 10
        })

        const updated = await tx.get(`match/${baseMatchData.idMatch}`)

        expect(updated.timer.isRunning).toBe(true)
        expect(updated.timer.currentTime).toBe(120)
        expect(updated.timer.additionalTime).toBe(10)
    })

    it('updateMatch doit ignorer si le match nexiste pas', async () => {
        await matchMutators.updateMatch(tx, {
            idMatch: 'inexistant',
            ipponsPlayer1: 99
        })

        expect(tx.set).not.toHaveBeenCalled()
    })

    it('switchPlayers doit ignorer si le match nexiste pas', async () => {
        await matchMutators.switchPlayers(tx, { idMatch: 'inexistant' })

        expect(tx.set).not.toHaveBeenCalled()
    })

    it('updateTimer doit ignorer si le match nexiste pas', async () => {
        await matchMutators.updateTimer(tx, {
            idMatch: 'inexistant',
            currentTime: 50
        })

        expect(tx.set).not.toHaveBeenCalled()
    })
})
