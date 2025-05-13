import { replicacheInstance as rep } from "@/replicache/replicache";
import { fictifMatchStore } from "@/replicache/stores/fictifMatchStore";

const DEFAULT_MATCH = {
    player1: { fullName: 'Joueur 1', nationalityId: 73, ippons: 0, keikokus: 0 },
    player2: { fullName: 'Joueur 2', nationalityId: 73, ippons: 0, keikokus: 0 },
    timer: { isRunning: false, currentTime: 180, additionalTime: -1 }
};

const service = {
    async initMatch(id) {
        return this.ensureMatch(id);
    },

    async ensureMatch(id) {
        let match = await fictifMatchStore.getById(id);
        if (!match) {
            await this.createFictifMatch(id, DEFAULT_MATCH);
            match = structuredClone(DEFAULT_MATCH);
        }
        return match;
    },

    async createFictifMatch(id, data = DEFAULT_MATCH) {
        await rep.mutate.createFictifMatch({ id, data });
        return structuredClone(data);
    },


    async updateFictifMatch(id, updates) {
        await rep.mutate.updateFictifMatch({ id, updates });
    },

    async updatePlayer(id, playerNumber, updates) {
        await this.updateFictifMatch(id, {
            [`player${playerNumber}`]: updates
        });
    },

    async updateScore(id, playerNumber, type, value) {
        await this.updatePlayer(id, playerNumber, { [type]: value });
    },

    async updateTimer(id, updates) {
        await this.updateFictifMatch(id, { timer: updates });
    },

    async startTimer(id) {
        await this.updateTimer(id, { isRunning: true });
    },

    async stopTimer(id) {
        await this.updateTimer(id, { isRunning: false });
    },

    async resetTimer(id) {
        await this.updateTimer(id, {
            isRunning: false,
            currentTime: 180,
            additionalTime: -1
        });
    },

    async adjustTime(id, seconds) {
        const match = await this.getFictifMatch(id);
        if (!match) return;

        const timer = { ...match.timer };
        if (timer.currentTime > 0) {
            timer.currentTime = Math.max(0, timer.currentTime + seconds);
        } else {
            timer.additionalTime = Math.max(0, (timer.additionalTime || 0) + seconds);
        }

        await this.updateTimer(id, timer);
    },

};

export const fictifMatchService = service;