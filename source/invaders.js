import { Invader } from './invader';

export class Invaders {
    game;
    invaders;
    score = 0;

    constructor(game, userId) {
        this.game = game;
        this.userId = userId;

        this.invaders = game.add.group();
        this.invaders.enableBody = true;
        this.invaders.physicsBodyType = Phaser.Physics.ARCADE;
    }

    createInvader(playerX, playerY) {
        const { x, y } = this.chooseSpawn(playerX, playerY);
        const invader = new Invader(this.game, this.userId, playerX, playerY);
        this.score++;

        // Send new invader info to server
        socket.emit('invaders', {
            id: this.userId,
            x: x,
            y: y,
            vx: invader.vx,
            vy: invader.vy,
            score: this.score,
        });
    }

    chooseSpawn(playerX, playerY) {
        // This loop verifies the invader will not spawn too close to the user
        // Randomize invader position
        while (true) {
            const x = this.game.world.randomX;
            const y = this.game.world.randomY;

            if (
                (x > playerX + 20 || x < playerX - 20) &&
                (y > playerY + 20 || y < playerY - 20)
            ) {
                return { x, y };
            }
        }
    }

    get(i) {
        return this.invaders.children[i];
    }

    getPosArr() {
        return this.invaders.children.map((invader) => ({ x: invader.x, y: invader.y }));
    }

    killAll() {
        this.invaders.callAll('kill');
    }
}
