import { describe, it, expect, vi } from 'vitest'
import tournamentMutators from '@/replicache/mutators/tournamentMutators'

// groupe de test pour les mutators de tournooi
describe('tournament mutators', () => {
    // test pour la crea d un tournoi
    it('doit appeler tx.set avec la bonne cle et les bonnes donnees pour createtournament', async () => {
        // creer un faux objet transaction
        const tx = { set: vi.fn() }
        // payload de test
        const payload = {
            id: 't1',
            name: 'tournoi test',
            address: 'adresse test',
            startDate: '2023-01-01'
        }
        // appelé le mutator createtournament en passant la transaction et le payload
        await tournamentMutators.createTournament(tx, payload)
        // verif que tx.set est appelee avec la cle correcte et un objet contenant les donnees attendues
        expect(tx.set).toHaveBeenCalledWith(`tournament/${payload.id}`, expect.any(Object))
    })

    // test pour la supp d un tournoi
    it('doit appeler tx.del avec la bonne cle pour deletetournament', async () => {
        const tx = { del: vi.fn() }
        const payload = { id: 't1' }
        await tournamentMutators.deleteTournament(tx, payload)
        expect(tx.del).toHaveBeenCalledWith(`tournament/${payload.id}`)
    })

    // test pour le chg d etat d un tournoi
    it('doit mettre a jour le tournoi avec le nouvel etat pour togglestate', async () => {
        const tournamentExist = { id: 't1', started: false, name: 'tournoi test' }
        const tx = {
            get: vi.fn().mockResolvedValue(tournamentExist),
            set: vi.fn()
        }
        const payload = { id: 't1', started: true }
        await tournamentMutators.toggleState(tx, payload)
        expect(tx.get).toHaveBeenCalledWith(`tournament/${payload.id}`)
        expect(tx.set).toHaveBeenCalledWith(`tournament/${payload.id}`, { ...tournamentExist, started: true })
    })
})
