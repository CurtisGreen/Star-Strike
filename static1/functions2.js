

function startGame2(){  //Called afterwards to ensure game is fully loaded

game2 = new Phaser.Game(648, 600, Phaser.CANVAS, 'phaser-example2', { preload: preload, create: create, update: update, render: render });


/*----variables----*/
var userId = 2;
var player;
var cursors;

var bullet;
var bullets;
var bulletTime = 0;

var stars;
var score = 0;
var scoreText;
var winText;

var count = 0;

function preload() {
    //all image files are in 'assets' folder
    game2.load.image('universe', 'assets/universe.png');
    game2.load.image('bullet', 'assets/bullets.png');
    game2.load.image('ship', 'assets/ship.png');
    game2.load.image('star', 'assets/star.png');

}


function create() {     //Called when object is created, creates player 2, the one the server controls

    socket.on('onconnected', function(msg){ //get user's unique id
        console.log('onconnected: user id = '+ msg.id);
        userId = msg.id;
    });
	
	 socket.on('update', function(msg) {  //Updates p2 from server
        //console.log(msg.id);
        if (msg.id != userId){
            player.x = msg.x;
            player.y = msg.y;
            player.rotation = msg.rotation;
            if (msg.fire){
                fireBullet();
            }
        }
    });
	
	socket.on('stars', function(msg){
		if (msg.id != userId && score < 20){
			createStars(msg);
		}
	});
	
	socket.on('double', function(msg){
		console.log('deletion '+ msg.id + ' ' + userId);
		if (msg.check && msg.id != userId && score < 20){
			stars.children[msg.index].kill();
			score = msg.score;
		}
	});
	
    //  This will run in Canvas mode, so let's gain a little speed and display
    game2.renderer.clearBeforeRender = false;
    game2.renderer.roundPixels = true;

    //  We need arcade physics
    game2.physics.startSystem(Phaser.Physics.ARCADE);

	// Lower player 2's fps so the game doesn't seize up
    game2.desiredFPS = 1;

    //  A spacey background
    game2.add.tileSprite(-100,-100,900,700,'universe');

    //  Our ships bullets
    bullets = game2.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;

    //  All 40 of them
    bullets.createMultiple(40, 'bullet');
    bullets.setAll('anchor.x', 0.5);
    bullets.setAll('anchor.y', 0.5);

    //  Our player ship
    player = game2.add.sprite(game2.world.centerX, game2.world.centerY + 200, 'ship');
    player.anchor.set(0.5);

    //  and its physics settings
    game2.physics.enable(player, Phaser.Physics.ARCADE);

    player.body.drag.set(500);
    player.body.maxVelocity.set(1000);

    //  Game input
    cursors = game2.input.keyboard.createCursorKeys();
    game2.input.keyboard.addKeyCapture([ Phaser.Keyboard.Z ]);
	
    stars = game2.add.group();
    stars.enableBody = true;
    stars.physicsBodyType = Phaser.Physics.ARCADE;
    
    scoreText = game2.add.text(0,550,'Score:',{font: '32px Arial',fill: '#fff'});
    winText = game2.add.text(game2.world.centerX, game2.world.centerY, 'You Win!', {font: '32px Arial',fill: '#fff'});
    winText.visible = false;  
	loseText = game2.add.text(game2.world.centerX, game2.world.centerY, 'Second Place!', {font: '32px Arial',fill: '#fff'});
    loseText.visible = false; 

}

function update() {	//Called repeatedly to update the game state
    game2.physics.arcade.overlap(bullets,stars,collisionHandler,null,this);
	game2.physics.arcade.overlap(player,stars,collisionHandler,null,this);
	
    screenWrap(player);

    bullets.forEachExists(screenWrap, this);

     scoreText.text = 'Stars:' + score;

    if(score >= 20) {     //TODO: show only victory/defeat for the client (player1)
        loseText.visible = true;
        scoreText.visible = false;
    }

}

function fireBullet () {    //TODO: change to use server rather than new bullet

    if (game2.time.now > bulletTime)
    {
        bullet = bullets.getFirstExists(false);

        if (bullet)
        {
            bullet.reset(player.body.x + 16, player.body.y + 16);
            bullet.lifespan = 1500;
            bullet.rotation = player.rotation;
            game2.physics.arcade.velocityFromRotation(player.rotation, 400, bullet.body.velocity);
            bulletTime = game2.time.now + 200;
        }
    }

}

function screenWrap (player) {  

    if (player.x < 0)
    {
        player.x = game2.width;
    }
    else if (player.x > game2.width)
    {
        player.x = 0;
    }

    if (player.y < 0)
    {
        player.y = game2.height;
    }
    else if (player.y > game2.height)
    {
        player.y = 0;
    }

}

function render() {
}

function createStars(msg){     //TODO: make stars move randomly, starting with 1, also check for wall boundaries
	
	var star = stars.create(msg.x, msg.y, 'star');
	star.anchor.setTo (.5,.5);
	score = msg.score;
    var tween = game2.add.tween(star).to({x:(msg.vx),y: (msg.vy) },2000,Phaser.Easing.Linear.None,true,0,1000,true);

    tween.onLoop.add(descend,this);
}

function descend(){
    stars.y ==10;
}

function collisionHandler(bullet, star){    //TODO: make destroying stars increase powerup count, also make score display # of stars
    bullet.kill();
    star.kill();

    score--;
}
function collisionHandler(player, star){    //TODO: make destroying stars increase powerup count, also make score display # of stars
    player.kill();
    star.kill();

    score--;
}
}
startGame2();

/////////////////////////////////////////////////








