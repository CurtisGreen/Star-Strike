

function startGame2(){  //Called afterwards to ensure game is fully loaded

game2 = new Phaser.Game(648, 600, Phaser.CANVAS, 'player_2', { preload: preload, create: create, update: update, render: render });

/*----variables----*/
var userId = 2;
var player;
var cursors;
var bullet;
var bullets;
var bulletTime = 0;
var explosion;
var invaders;
var score = 0;
var health = 3;
var scoreText;
var healthText;
var ammoText;
var ammo = 10;
var ammoImage;
var liveImage;
var shipCollideInvader = false;
var invader;
var offset = 0; //The index can be offset depending on which client connects first
var explosions;
var count = 0;

function preload() {
    //all image files are in 'assets' folder
    game2.load.image('universe', 'assets/universe.png');
    game2.load.image('bullet', 'assets/bullets.png');
    game2.load.image('ship', 'assets/ship.png');
    game2.load.image('invader', 'assets/invader.png');
    game2.load.spritesheet('explode', 'assets/explode.png', 128, 128);
    game2.load.image('ammo', 'assets/ammo.png');
    game2.load.image('live_image','assets/i_live.png');

}


function create() {     //Called when object is created, creates player 2, the one the server controls
    //Set up socket functions
    socket.on('onconnected', function(msg){ //get user's unique id
        console.log('onconnected: user id = '+ msg.id);
        userId = msg.id;
        socket.emit('initialize', { //Tell the client it's finished connecting
          id: userId,
        });            
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
            
            var i;
            for (i in msg.invArray){
                //console.log('i = '+ i);
                if (invaders.children[i]){
                    //console.log('updating children');
                    invaders.children[i].x = msg.invArray[i].x;
                    invaders.children[i].y = msg.invArray[i].y;
                }
            }
        }
    });

	socket.on('double', function(msg){ //Deletes that have been destroyed by p2
		if (msg.check && msg.id != userId && score < 20){
            //console.log ('child index = ' + msg.index);
            if (!invaders.children[msg.index]){
                console.log ('implemented offset');
                offset = 1;
            }
			invaders.children[msg.index-offset].kill();
			score = msg.score;
		}
	});

    socket.on('bulletExplosion', function(msg){ //it make the animation of explosion when bullet hits invador
        if ( msg.id != userId){
            if(msg.shipCollideInvader){
                var explosion = explosions.getFirstExists(false);
				if (invaders.children[msg.index]){
					explosion.reset(invaders.children[msg.index].x, invaders.children[msg.index].y);
					explosion.play('explode', 30, false, true);
					invaders.children[msg.index].kill();
				}
            }
        }
    });

    socket.on('health', function(msg){  //Updates p2's health
        if ( msg.id != userId){
            health = msg.health;
            liveImage.getFirstAlive().kill();
            if(msg.shipCollideInvader){
                var explosion = explosions.getFirstExists(false);
                explosion.reset(player.x, player.y);
                explosion.play('explode', 30, false, true);
                invaders.children[msg.index].kill(); 
             }
        }
    });

    socket.on('ammo', function(msg){    //Updates p2's ammo
        if ( msg.check && msg.id != userId){
            //console.log( "CHECKING ammo" + msg.id + "!=" + userId);
            ammo = msg.ammo;
			if (ammoImage.getFirstAlive()){
				ammoImage.getFirstAlive().kill();
			}
            if(ammo <= 0  ){
                ammoImage.callAll('revive');
            }
        }
    });

	socket.on('defeat', function(msg){ //Updates whether or not p2 is dead
		if (msg.id != userId){
			player.kill();

            setTimeout(function(){  //Wait 3 seconds before starting next round
                player.health = 3;  //Reset health, ammo, images and invaders
                ammo = 10;
                score = 0;
                player.revive();
                invaders.callAll('kill');
                liveImage.callAll('revive');
                ammoImage.callAll('revive');
            }, 3000);
		}
        else if (msg.id == userId){

            setTimeout(function(){  //Wait 3 seconds before starting next round
                player.health = 3;  //Reset health, ammo, images and invaders
                ammo = 10;
                score = 0;
                invaders.callAll('kill');
                liveImage.callAll('revive');
                ammoImage.callAll('revive');
            }, 3000);
        }
	});

    socket.on('invaders', function(msg){   //Copies p2's stars to the secondary screen
        //console.log ('userid = ' + userId + ' msg id = ' +msg.id);
        if (msg.id != userId && score < 20 ){
            createStars(msg);
        }
    });

    //  Verify initialization
    socket.on('initialize', function(msg){ 
        if (msg.id != userId){
            if (invaders.children[0]){
                invaders.children[0].kill();
            }
            score--;
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
    game2.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR]);
	
    //  create invaders objects
    invaders = game2.add.group();
    invaders.enableBody = true;
    invaders.physicsBodyType = Phaser.Physics.ARCADE;
    
    //  On screen text
    scoreText = game2.add.text(0,0,'Score:',{font: '20px Coiny',fill: ' #7FBF7F'});
    healthText = game2.add.text(0,570,'Lives',{font: '15px Coiny',fill: ' #00cc00'});
    ammoText = game2.add.text(585,570,'Ammo',{font: '15px Coiny',fill: ' #cc0000'});

    //explosion
    explosions = game2.add.group();
    explosions.createMultiple(30, 'explode');
    explosions.forEach(setupInvader, this);

    //creates ammo on screen
    ammoImage = game2.add.group();
    for (var i = 0; i < ammo; i++) {
        var allammo = ammoImage.create(605, game2.world.height - 120+ (10 * i), 'ammo');
        allammo.anchor.setTo(0.5, 0.5);
        allammo.angle = 0;
    }

    //creates lives on screen
    liveImage = game2.add.group();
    for (var i = 0; i < health; i++) {
        var lives = liveImage.create(20, game2.world.height - 50 + (10 * i), 'live_image');
        lives.anchor.setTo(0.5, 0.5);
        lives.angle = 0;
    }
}

//sets up the explosion on the invader
function setupInvader (invader) {
    invader.anchor.x = 0.5;
    invader.anchor.y = 0.5;
    invader.animations.add('explode');
}

//Called repeatedly to update the game state
function update() {	
    screenWrap(player);
    scoreText.text = 'Invaders:' + score;
}

 //Fires when p2 presses space bar
function fireBullet () {   

    if (game2.time.now > bulletTime)
    {
        bullet = bullets.getFirstExists(false);

        if (bullet)
        {
            bullet.reset(player.body.x + 16, player.body.y + 16);
            bullet.lifespan = 1500;
            bullet.rotation = player.rotation;
            game2.physics.arcade.velocityFromRotation(player.rotation, 400, bullet.body.velocity);
            bulletTime = game2.time.now + 200;  //Limit how many lasers will be fired per second
        }
    }
}

function screenWrap (player) {  //Player can move from one side to the other

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

function render(){
}

function createStars(msg){     //Stars spawn in a random location and move at a random speed between 2 points
	//TODO: improve star movement (not just moving back and forth)
	invader = invaders.create(msg.x, msg.y, 'invader');
	invader.anchor.setTo (.5,.5);
	score = msg.score;
    var tween = game2.add.tween(invader).to({x:(msg.vx),y: (msg.vy) },2000,Phaser.Easing.Linear.None,true,0,1000,true);
    tween.onLoop.add(descend,this);
}

function createStars(msg){     //Stars spawn in a random location and move at a random speed between 2 points
	//TODO: improve star movement (not just moving back and forth)
	invader = invaders.create(msg.x, msg.y, 'invader');
	invader.anchor.setTo (.5,.5);
	score = msg.score;
    //var tween = game2.add.tween(invader).to({x:(msg.vx),y: (msg.vy) },2000,Phaser.Easing.Linear.None,true,0,1000,true);
    //tween.onLoop.add(descend,this);

}

function descend(){
    invaders.y ==10;
}

function shutdown() {
	 bulletTime = 0;
	 invaders.callAll('kill');
	 score = 0;
	 health = 3;
	 ammo = 10;
	 shipCollideInvader = false;
	 offset = 0; //The index can be offset depending on which client connects first
	 count = 0;
}
}
startGame();
startGame2();

///////////////////END//////////////////////////////








