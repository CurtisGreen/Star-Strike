export class Invader {
    game;
    invader;
    vx = 0;
    vy = 0;

    constructor(game, x, y, invaders) {
        this.game = game;

        // Create invader
        this.invader = invaders.create(x, y, 'invader');
        this.invader.anchor.setTo(0.5, 0.5);

        let tween = this.game.add.tween(this.invader); // TODO: maybe not necessary
        const minSpeed = -100,
            maxSpeed = 100;

        // Randomize invader movement
        this.game.time.events.loop(
            750,
            () => {
                const calcPosition = (pos) => {
                    const sign = Math.random() < 0.5 ? -1 : 1;
                    const offset = Math.random() * (maxSpeed - minSpeed + 1) - minSpeed;
                    return sign * offset + pos;
                };

                // Create new position to move to
                this.vx = calcPosition(x);
                this.vy = calcPosition(y);

                // Don't move if it moves outside the screen
                if (
                    this.vx > this.game.width + 50 ||
                    this.vx < -50 ||
                    this.vy > this.game.height + 50 ||
                    this.vy < -50
                ) {
                    this.vx = this.invader.x;
                    this.vy = this.invader.y;
                }

                this.game.add
                    .tween(this.invader)
                    .to(
                        { x: this.vx, y: this.vy },
                        1750,
                        Phaser.Easing.Quadratic.InOut,
                        true,
                        0,
                        1000,
                        true
                    );
            },
            this
        );
    }
}
