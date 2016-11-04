
var game = new Phaser.Game(800,600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render });
//TODO: create second game window

/*----variables----*/
var player;
var cursors;

var bullet;
var bullets;
var bulletTime = 0;

var stars;
var score = 0;
var scoreText;
var winText;

function preload() {
    //all image files are in 'assets' folder
    game.load.image('universe', 'assets/universe.png');
    game.load.image('bullet', 'assets/bullets.png');
    game.load.image('ship', 'assets/ship.png');
    game.load.image('star', 'assets/star.png');

}


function create() {     //TODO: duplicate for player 2

    //  This will run in Canvas mode, so let's gain a little speed and display
    game.renderer.clearBeforeRender = false;
    game.renderer.roundPixels = true;

    //  We need arcade physics
    game.physics.startSystem(Phaser.Physics.ARCADE);

    //  A spacey background
    game.add.tileSprite(-100,-100,900,700,'universe');

    //  Our ships bullets
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;

    //  All 40 of them
    bullets.createMultiple(40, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 0.5);

    //  Our player ship
    player = game.add.sprite(game.world.centerX, game.world.centerY + 200, 'ship');
    player.anchor.set(0.5);

    //  and its physics settings
    game.physics.enable(player, Phaser.Physics.ARCADE);

    player.body.drag.set(500);
    player.body.maxVelocity.set(1000);

    //  Game input
    cursors = game.input.keyboard.createCursorKeys();
    game.input.keyboard.addKeyCapture([ Phaser.Keyboard.Z ]);

    stars = game.add.group();
    stars.enableBody = true;
    stars.physicsBodyType = Phaser.Physics.ARCADE;

    createStars();
    
    scoreText = game.add.text(0,550,'Score:',{font: '32px Arial',fill: '#fff'});
    winText = game.add.text(game.world.centerX-50, game.world.centerY, 'You Win!', {font: '32px Arial',fill: '#fff'});
    winText.visible = false;  

}

function update() { //TODO: listen for server commands and do these same things for player 2 rather than from client commands
    game.physics.arcade.overlap(bullets,stars,collisionHandler,null,this);

    if (cursors.up.isDown)
    {
        game.physics.arcade.accelerationFromRotation(player.rotation, 200, player.body.acceleration);
    }
    else
    {
        player.body.acceleration.set(0);
    }

    if (cursors.left.isDown)
    {
        player.body.angularVelocity = -300;
    }
    else if (cursors.right.isDown)
    {
        player.body.angularVelocity = 300;
    }
    else
    {
        player.body.angularVelocity = 0;
    }

    if (game.input.keyboard.isDown(Phaser.Keyboard.Z))
    {
        fireBullet();
    }

    screenWrap(player);

    bullets.forEachExists(screenWrap, this);

     scoreText.text = 'Score:' + score;

    if(score == 3000) {     //TODO: instead of points have it display number stars
        winText.visible = true;
        scoreText.visible = false;
    }

}

function fireBullet () {    //TODO: same as above, make another function that does this except for using server commands to update screen 2

    if (game.time.now > bulletTime)
    {
        bullet = bullets.getFirstExists(false);

        if (bullet)
        {
            bullet.reset(player.body.x + 16, player.body.y + 16);
            bullet.lifespan = 2000;
            bullet.rotation = player.rotation;
            game.physics.arcade.velocityFromRotation(player.rotation, 400, bullet.body.velocity);
            bulletTime = game.time.now + 50;
        }
    }

}

function screenWrap (player) {  

    if (player.x < 0)
    {
        player.x = game.width;
    }
    else if (player.x > game.width)
    {
        player.x = 0;
    }

    if (player.y < 0)
    {
        player.y = game.height;
    }
    else if (player.y > game.height)
    {
        player.y = 0;
    }

}

//TODO: screen wrap for player 2

function render() {
}

function createStars(){     //TODO: make stars move randomly, starting with 1
    for (var y = 0; y < 4; y++){
        for (var x = 0; x < 10; x++){
            var star = stars.create(x*48, y*50, 'star');
            star.anchor.setTo (0.5,0.5);
        }
    }

    stars.x = 100;
    stars.y = 50;

    var tween = game.add.tween(stars).to({x:200},2000,Phaser.Easing.Linear.None,true,0,1000,true);

    tween.onLoop.add(descend,this);
}

function descend(){
    stars.y ==10;
}

function collisionHandler(bullet, star){    //TODO: make destroying stars increase powerup count, also make score display # of stars
    bullet.kill();
    star.kill();

    score += 100;
}
//TODO: add collision handling for player & star
