var game = new Phaser.Game(1280, 700, Phaser.AUTO, 'select_ship', { preload: preload, create: create,update : update });

function preload() {

    game.load.spritesheet('button', 'assets/ship.png', 193, 71);
    game.load.spritesheet('button2', 'assets/ship2.png', 193, 71);
    game.load.spritesheet('button3', 'assets/ship3.png', 193, 71);
    game.load.spritesheet('button4', 'assets/ship4.png', 193, 71);
    game.load.spritesheet('menu', 'assets/BACK_TO_MENU.png', 193, 71);
    game.load.image('background','assets/universe.png');
    game.load.spritesheet('up', 'assets/up.png', 45, 42);
    game.load.spritesheet('down', 'assets/down.png', 45, 46);
    game.load.spritesheet('resume', 'assets/resume.png', 45, 46);
    game.load.spritesheet('pause', 'assets/pause.png', 45, 46);

}

var button;
var button2;
var button3;
var button4;
var background;

function create() {

    game.stage.backgroundColor = '#FF3333';

    background = game.add.tileSprite(0, 0, 1280, 700, 'background');
    																				//0:out , 1:over, 2:down
    button = game.add.button(game.world.centerX - -150, 400, 'button', actionOnClick, this, 2, 1, 0);
    button2 = game.add.button(game.world.centerX - -50, 392, 'button2', actionOnClick, this, 2, 1, 0);
    button3 = game.add.button(game.world.centerX - 50, 392, 'button3', actionOnClick, this, 2, 1, 0);
    button4 = game.add.button(game.world.centerX - 150, 392, 'button4', actionOnClick, this, 2, 1, 0);
    button5 = game.add.button(game.world.centerX - 110, 500, 'menu', OnClickToMenu, this, 2, 1, 0);
   
    up_button = game.add.button(game.world.centerX - 503, 100, 'up', actionOnClickUp, this, 1, 2, 0);
    down_button = game.add.button(game.world.centerX - 503, 200, 'down', actionOnClickDown, this, 1, 2, 0);
    resume_button = game.add.button(game.world.centerX - 530, 150, 'resume', actionOnClickResume, this, 2, 1);
    pause_button = game.add.button(game.world.centerX - 470, 150, 'pause', actionOnClickPause, this, 2, 1);
   
    button.anchor.setTo(0.5, 0.5);    
    button2.anchor.setTo(0.5, 0.5);    
    button3.anchor.setTo(0.5, 0.5);    
    button4.anchor.setTo(0.5, 0.5); 

}

function update() {
     button.angle += 1;
     button2.angle += 1;
     button3.angle += 1;
     button4.angle += 1;
}


function actionOnClick () {
	
	$("#screens" ).show();			
	$( "#select_screens").hide();	
   // background.visible =! background.visible;

}

function OnClickToMenu (){
    $(".menu" ).show();
    $( "#select_screens").hide();
}

//to change volume
function actionOnClickUp () {

    music.volume += 0.1;

}

function actionOnClickDown () {

    music.volume -= 0.1;

}

function actionOnClickResume () {
    
    music.resume();
}

function actionOnClickPause () {
    
    music.pause();
}

