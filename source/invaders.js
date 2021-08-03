import { Invader } from './invader.js';

export class Invaders {
    game;
    invaders;
    p1 = true;

    constructor(game, userId, p1) {
        this.game = game;
        this.userId = userId;
        this.p1 = p1;

        this.invaders = game.add.group();
        this.invaders.enableBody = true;
        this.invaders.physicsBodyType = Phaser.Physics.ARCADE;
    }

    createInvader(playerX, playerY) {
        const { x, y } = this.chooseSpawn(playerX, playerY);
        console.log('creating invader at', x, y, 'vs', playerX, playerY);
        const invader = new Invader(this.game, playerX, playerY, this.invaders);

        // Send new invader info to server
        if (this.p1) {
            socket.emit('invaders', {
                id: this.userId,
                x: x,
                y: y,
                vx: invader.vx,
                vy: invader.vy,
                score: this.getCount(),
            });
        }
    }

    chooseSpawn(playerX, playerY) {
        // This loop verifies the invader will not spawn too close to the user
        // Randomize invader position
        while (true) {
            const x = this.game.world.randomX;
            const y = this.game.world.randomY;
            const minDistance = 50;

            if (
                (x > playerX + minDistance || x < playerX - minDistance) &&
                (y > playerY + minDistance || y < playerY - minDistance)
            ) {
                return { x, y };
            }
        }
    }

    // Update invador positions
    update(invArray) {
        for (const i in invArray) {
            if (this.invaders.children[i]) {
                this.invaders.children[i].x = invArray[i].x;
                this.invaders.children[i].y = invArray[i].y;
            }
        }
    }

    get(i) {
        return this.invaders.children[i];
    }

    getCount() {
        return this.invaders.countLiving();
    }

    getPosArr() {
        return this.invaders.children.map((invader) => ({ x: invader.x, y: invader.y }));
    }

    kill(index) {
        this.invaders.children[index].kill();
    }

    killAll() {
        this.invaders.callAll('kill');
    }

    reset(playerX, playerY) {
        this.killAll();
        this.createInvader(playerX, playerY);
    }
}
