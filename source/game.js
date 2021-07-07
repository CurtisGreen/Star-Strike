export class Game {
    game;
    userId = 0;

    constructor(userId) {
        this.game = new Phaser.Game(648, 600, Phaser.CANVAS, 'player ' + userId, {
            preload: this.preload,
            create: this.create,
            update: this.update,
            render: this.render,
        });
        this.userId = userId;
    }

    preload() {
        this.game.load.image('universe', 'assets/universe.png');
        this.game.load.image('bullet', 'assets/bullets.png');
        this.game.load.image('ship', 'assets/ship2.png');
        this.game.load.image('invader', 'assets/invader.png');
        this.game.load.spritesheet('explode', 'assets/explode.png', 128, 128);
        this.game.load.image('ammo', 'assets/ammo.png');
        this.game.load.image('live_image', 'assets/i_live.png');

        this.game.load.audio('destroyed', 'assets/explosion.mp3');
        this.game.load.audio('blaster', 'assets/blaster.mp3');
        this.game.load.audio('ship_damage', 'assets/space_ship_destroyed.mp3');
        this.game.load.audio('boden', 'assets/time_attack.mp3');
    }

    create() {}

    update() {}

    render() {}
}
