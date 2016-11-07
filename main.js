(function () {


    var Game = function (canvasId) {
        var canvas = document.getElementById(canvasId); // canvas dom elementini seçiyoruz
        var screen = canvas.getContext('2d'); // 2 boyutlu çizim için gerekli ayarlamayı yapıyoruz

        // çizim yapılacak canvas ın boyutunu implemente ediyoruz
        var gameSize = {
            x: canvas.width,
            y: canvas.height
        }

        this.bodies = createInvaders(this).concat(new Player(this, gameSize));
        //console.log(this.bodies);

        var self = this;
        loadSound("shoot1.wav", function (shootSound) {
            self.shootSound = shootSound;
            
            var tick = function () {
                self.update(); // ilk önce kendini güncellemesini söylüyoruz
                self.draw(screen, gameSize); // güncellenen veriler ile tekrar çizimini sağlıyoruz
                requestAnimationFrame(tick); // sürekli olarak fonksiyonun kendini çağırıyoruz
            }

            tick();
        });
    }

    // Game fonksiyonuna yeni yetenekler ekliyoruz
    Game.prototype = {
        update: function () {

            var bodies = this.bodies;
            var notCollidingWithAnything = function (b1) {
                return bodies.filter(function (b2) {
                    return colliding(b1, b2);
                }).length === 0;
            }

            this.bodies = this.bodies.filter(notCollidingWithAnything);

            // Tüm nesneleri güncelliyoruz
            for (var i = 0; i < this.bodies.length; i++) {
                this.bodies[i].update();
            }
        },
        // Tüm nesneleri ekrana çiziyoruz
        draw: function (screen, gameSize) {
            // Her çizimden önce ekranı tamamen temizliyoruz
            screen.clearRect(0, 0, gameSize.x, gameSize.y);

            for (var i = 0; i < this.bodies.length; i++) {
                drawRect(screen, this.bodies[i]);
            }
        },

        addBody: function (body) {
            this.bodies.push(body);
        },
        invaderBelow: function (invader) {
            return this.bodies.filter(function (b) {
                return b instanceof Invader &&
                    b.center.y > invader.center.y &&
                    b.center.x - invader.center.x < invader.size.x;
            }).length > 0;
        }
    }

    // Oyuncu yapılandırması
    var Player = function (game, gameSize) {
        console.log("Player created");
        this.game = game;

        // Oyuncunun boyutunu ayarlıyoruz
        this.size = {
            x: 30,
            y: 30
        };

        // Oyuncunun konumunu ayarlıyoruz
        this.center = {
            x: gameSize.x / 2, // x ekseninde ortala
            y: gameSize.y - this.size.y // y ekseninde el alt kısma çizim yap
        }

        // Oyuncu için tuş dinlemesi yapıyoruz
        this.keyboarder = new Keyboarder();
    }

    Player.prototype = {
        update: function () {
            if (this.keyboarder.isDown(this.keyboarder.KEYS.LEFT)) {
                this.center.x -= 2; // <- basıldığında Oyuncuyu sola hareket ettiriyoruz
            } else if (this.keyboarder.isDown(this.keyboarder.KEYS.RIGHT)) {
                this.center.x += 2; // -> basıldığında Oyuncuyu sağa hareket ettiriyoruz
            } else if (this.keyboarder.isDown(this.keyboarder.KEYS.SPACE)) {

                console.log(this.siz)

                var bullet = new Bullet({
                    x: this.center.x,
                    y: this.center.y - this.size.x / 2
                }, {
                    x: 0,
                    y: -8 // iki mermi arasındaki mesafe
                });
                console.log(bullet)
                this.game.addBody(bullet);
                this.game.shootSound.load();
                this.game.shootSound.play();
            }

        }
    }


    // Mermi yapılandırması
    var Bullet = function (center, velocity) {
        console.log("Bullet created");

        // Merminin boyutunu ayarlıyoruz
        this.size = {
            x: 3,
            y: 3
        };

        this.center = center;
        this.velocity = velocity;
    }

    Bullet.prototype = {
        update: function () {
            this.center.x += this.velocity.x;
            this.center.y += this.velocity.y;
        }
    }


    // İşgalci yapılandırması
    var Invader = function (game, center) {

        this.game = game;

        this.size = {
            x: 15,
            y: 15
        };

        this.center = center;
        this.patrolX = 0;
        this.speedX = 0.6;
    }

    Invader.prototype = {
        update: function () {
            //console.log(this.patrolX)
            // Hedef noktalarının 0 noktasında veya 100px noktasında geldiğinde
            // tam tersi yöne doğru hareket edilmesi sağlanıyor
            if (this.patrolX < 0 || this.patrolX > 100) {
                this.speedX = -this.speedX;
            }

            this.center.x += this.speedX;
            this.patrolX += this.speedX;

            if (Math.random() > 0.995 && !this.game.invaderBelow(this)) {

                var bullet = new Bullet({
                    x: this.center.x,
                    y: this.center.y + this.size.x / 2
                }, {
                    x: Math.random() - 0.5,
                    y: 2 // iki mermi arasındaki mesafe
                });
                this.game.addBody(bullet);
            }
        }
    }

    // Hedef noktaları oluşturuluyor
    var createInvaders = function (game) {
        console.log("Invaders created");
        var invaders = [];
        for (var i = 0; i < 24; i++) {
            var x = 30 + (i % 8) * 30;
            var y = 30 + (i % 3) * 30;

            invaders.push(
                new Invader(game, {
                    x: x,
                    y: y
                }))
        }
        return invaders;
    }

    // Çizin işlemi için ayrı fonksiyon tanımlıyoruz
    // Gerekli parametreleri vererek çizim işlemi sağlıyoruz
    // screen = 2d canvas ekranı
    // body = Player
    var drawRect = function (screen, body) {
        screen.fillRect(
            body.center.x - body.size.x / 2,
            body.center.y - body.size.y / 2,
            body.size.x,
            body.size.y
        )
    }

    // Tuş kontrolü için yapılandırma
    var Keyboarder = function () {
        var keyState = {};

        window.onkeydown = function (e) {
            keyState[e.keyCode] = true;
        }

        window.onkeyup = function (e) {
            keyState[e.keyCode] = false;
        }

        this.isDown = function (keyCode) {
            return keyState[keyCode] === true;
        }

        this.KEYS = {
            LEFT: 37, // <-
            RIGHT: 39, // ->
            SPACE: 32 // space
        }
    }


    var colliding = function (b1, b2) {
        return !(b1 === b2 ||
            b1.center.x + b1.size.x / 2 < b2.center.x - b2.size.x / 2 ||
            b1.center.y + b1.size.y / 2 < b2.center.y - b2.size.y / 2 ||
            b1.center.x - b1.size.x / 2 > b2.center.x + b2.size.x / 2 ||
            b1.center.y - b1.size.y / 2 > b2.center.y + b2.size.y / 2);
    }


    var loadSound = function (url, callback) {
        var loaded = function () {
            callback(sound);
            sound.removeEventListener('canplaythrough', loaded);
        }

        var sound = new Audio(url);
        sound.addEventListener('canplaythrough', loaded);
        sound.load();
    }

    // Pencere yüklendiğinde oyunu başlatıyoruz
    window.onload = function () {
        new Game("screen");
    };

})();