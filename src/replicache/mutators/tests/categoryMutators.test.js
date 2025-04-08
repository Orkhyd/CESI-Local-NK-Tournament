import { describe, it, expect, beforeEach, vi } from 'vitest';
import categoryMutators from '../categoryMutators';
import { Category } from '/src/replicache/models/index.js';

describe('categoryMutators', () => {
    let tx;

    // simulatiion d une transaction replicache avec une map mémoire
    beforeEach(() => {
        const store = new Map();

        tx = {
            set: vi.fn((key, value) => store.set(key, value)),
            get: vi.fn((key) => Promise.resolve(store.get(key))),
            del: vi.fn((key) => store.delete(key)),
        };
    });

    // données de base pour une caté"gorie
    const baseCategoryData = {
        id: 'cb57fc02-5baa-472e-90e3-571ed6ce2b70',
        tournamentId: '49f3a0ed-ee05-49f1-8424-c8dbce486208',
        name: 'cat1',
        genderId: 1,
        typeId: 2,
        ageCategoryIds: [7, 6],
        minGradeId: 4,
        maxGradeId: 6,
        weightRange: [0, 98],
    };

    // test : création d une catégorie
    it('doit créer une catégorie et l enregistrer dans la base', async () => {
        await categoryMutators.createCategory(tx, baseCategoryData);

        expect(tx.set).toHaveBeenCalledTimes(1);
        expect(tx.set).toHaveBeenCalledWith(
            `category/${baseCategoryData.id}`,
            new Category(
                baseCategoryData.id,
                baseCategoryData.tournamentId,
                baseCategoryData.name,
                baseCategoryData.genderId,
                baseCategoryData.typeId,
                baseCategoryData.ageCategoryIds,
                baseCategoryData.minGradeId,
                baseCategoryData.maxGradeId,
                baseCategoryData.weightRange
            )
        );
    });

    // test : mise a jour d une catégorie existante
    it('doit mettre a jour les champs d une catégorie existante', async () => {
        await categoryMutators.createCategory(tx, baseCategoryData);

        await categoryMutators.updateCategory(tx, {
            id: baseCategoryData.id,
            name: 'cat1 updated',
            maxGradeId: 7,
            idWinner: 'player-1',
        });

        const updated = await tx.get(`category/${baseCategoryData.id}`);

        expect(updated.name).toBe('cat1 updated');
        expect(updated.maxGradeId).toBe(7);
        expect(updated.idWinner).toBe('player-1');
    });

    // test : suppression d une catégorie
    it('doit supprimer une catégorie de la base', async () => {
        await categoryMutators.createCategory(tx, baseCategoryData);
        await categoryMutators.deleteCategory(tx, { id: baseCategoryData.id });

        expect(tx.del).toHaveBeenCalledWith(`category/${baseCategoryData.id}`);
    });

    // test : ne rien faire si la catégorie n existe pas
    it('ne doit rien faire si la catégorie a mettre a jour n existe pas', async () => {
        await categoryMutators.updateCategory(tx, {
            id: 'non-existing-id',
            name: 'should not exist',
        });

        expect(tx.set).not.toHaveBeenCalled();
    });
});
