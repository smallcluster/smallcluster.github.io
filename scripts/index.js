import { randrange, vec2 } from "./math.js";
import * as Verlet from "./verlet.js";
import * as Boids from "./boids.js";

// ------------------ INPUTS ------------------

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return new vec2((evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height);
}

// ------------------- TREE -------------------
class TreeParticle extends Verlet.Particle {
    constructor(pos, mass = 1) {
        super(pos, mass);
        this.startPos = pos.copy();
        this.pinForce = 1;
    }
    update(dt) {
        if (this.mass > 0) {
            let time = Date.now() / 1000;
            let windDir = new vec2(Math.sin(time), Math.cos(time / 2) * 0.25);
            this.acc.add(windDir.mult(75));
            this.acc.add(this.startPos.copy().sub(this.pos).mult(4 * this.pinForce));

            let vel = this.pos.copy().sub(this.oldPos);
            this.acc.sub(vel.mult(5)); // fake air drag
        }
        super.update(dt);
    }
    draw(ctx) { }
    displaceMouse(mouse) {
        let dir = this.pos.copy().sub(mouse);
        this.acc.add(dir.normalize().mult(10));
    }
    move(diff) {
        this.pos.add(diff);
        this.oldPos.add(diff);
        this.startPos.add(diff);
    }
    debugDraw(ctx){
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 4, 0, 2 * Math.PI);
        ctx.fill();
    }
};

class LeafParticle extends TreeParticle {
    constructor(pos, mass = 1) {
        super(pos, mass);
        if (Math.random() < 0.1)
            this.color = "hsl(" + (Math.random() * 20 + 100) + ", 100%, " + (Math.random() * 30 + 30) + "%)";
        else
            this.color = "hsl(" + (Math.random() * 10) + ", 100%, " + (Math.random() * 30 + 30) + "%)";
        this.r = Math.random() * 8 + 8;
    }
    update(dt) {
        super.update(dt);
    }
    draw(ctx) {
        super.draw(ctx);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.r, 0, 2 * Math.PI);
        ctx.fill();
    }
    displaceMouse(mouse) {
        let dir = this.pos.copy().sub(mouse);
        this.acc.add(dir.normalize().mult(200));
    }
};

class TreeBranch extends Verlet.Link {
    constructor(p1, p2, tickness) {
        super(p1, p2, null);
        this.tickness = tickness;
    }
    update(dt) {
        super.update(dt);
    }
    draw(ctx) {
        ctx.strokeStyle = "rgb(149, 87, 46)";
        ctx.lineWidth = this.tickness;
        ctx.beginPath();
        ctx.moveTo(this.p1.pos.x, this.p1.pos.y);
        ctx.lineTo(this.p2.pos.x, this.p2.pos.y);
        ctx.stroke();
    }

    debugDraw(ctx){
        ctx.strokeStyle = "limegreen";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.p1.pos.x, this.p1.pos.y);
        ctx.lineTo(this.p2.pos.x, this.p2.pos.y);
        ctx.stroke();
    }
};


class FallingLeaf extends Verlet.TimedParticle {
    constructor(pos, lifeTime, color, r, mass = 1) {
        super(pos, lifeTime, mass);
        this.color = color;
        this.sr = r;
        this.r = r;
    }
    update(dt) {
        let time = Date.now() / 1000;
        this.r = this.sr * (1.2 - this.time / this.lifeTime);
        this.acc.add(new vec2(0, 10)); // gravity 
        let windDir = new vec2(Math.sin(time), Math.cos(time / 2) * 0.25);
        this.acc.add(windDir.mult(8));
        let vel = this.pos.copy().sub(this.oldPos);
        this.acc.sub(vel.mult(2)); // fake air drag
        super.update(dt);
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.r, 0, 2 * Math.PI);
        ctx.fill();
    }

    displaceMouse(mouse) {
        let dir = this.pos.copy().sub(mouse);
        this.acc.add(dir.normalize().mult(200));
    }
    move(diff) {
        this.pos.add(diff);
        this.oldPos.add(diff);
    }

    debugDraw(ctx){
        ctx.fillStyle = "rgb(255, 0, 255)";
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 4, 0, 2 * Math.PI);
        ctx.fill();
    }

}

class Tree extends Verlet.Body {
    constructor(pos) {
        super();
        this.leaves = [];
        this.backLeaves = [];
        this.frontLeaves = [];
        const buildTree = (p, n, length, angle, lc, dangle, startN) => {
            if (n == 0) return;
            let dir = new vec2(Math.cos(angle), Math.sin(angle));
            let pos = p.pos.copy().add(dir.mult(length));
            let p2;
            if (n == 1) {
                p2 = new LeafParticle(pos, 2 * Math.sqrt(n / 9));
                this.leaves.push(p2);
            }
            else
                p2 = new TreeParticle(pos, 2 * Math.sqrt(n / 9));

            p2.pinForce = Math.sqrt(n / 9) + 0.1;

            this.particles.push(p2);
            let l = new TreeBranch(p, p2, n / startN * 20);
            this.links.push(l);
            let len = length * lc + Math.random() * 15;
            let an1 = angle + dangle + Math.random() / 3;
            let an2 = angle - dangle - Math.random() / 3;
            buildTree(p2, n - 1, len, an1, lc, dangle, startN);
            buildTree(p2, n - 1, len, an2, lc, dangle, startN);
        }
        let startParticle = new TreeParticle(pos, 0);
        this.particles.push(startParticle)
        buildTree(startParticle, 9, 250, -Math.PI / 2, 0.5, Math.PI / 10, 9);
    }

    update() {
        // remove dead falling leaves
        const removeBack = [];
        for (let i = 0; i < this.backLeaves.length; i++) {
            if (!this.backLeaves[i].alive) {
                removeBack.push(i);
            }
        }
        for (let i = 0; i < removeBack.length; i++) {
            this.backLeaves.splice(removeBack[i], 1);
        }
        const removeFront = [];
        for (let i = 0; i < this.frontLeaves.length; i++) {
            if (!this.frontLeaves[i].alive) {
                removeFront.push(i);
            }
        }
        for (let i = 0; i < removeFront.length; i++) {
            this.frontLeaves.splice(removeFront[i], 1);
        }

        // create falling leaves
        this.leaves.forEach(p => {
            if (Math.random() < 0.0002) {
                let leaf = new FallingLeaf(p.pos.copy(), 3.5, p.color, p.r, 2 + Math.random());
                if (Math.random() < 0.5)
                    this.backLeaves.push(leaf);
                else
                    this.frontLeaves.push(leaf);
                this.particles.push(leaf);
            }
        });
    }
    draw(ctx) {
        this.backLeaves.forEach(p => {
            p.draw(ctx);
        });

        this.links.forEach(l => {
            l.draw(ctx);
        });

        this.frontLeaves.forEach(p => {
            p.draw(ctx);
        });

        this.leaves.forEach(p => {
            p.draw(ctx);
        });
    }

    debugDraw(ctx){
        this.particles.forEach(p => {
            p.debugDraw(ctx);
        });

        this.links.forEach(l => {
            l.debugDraw(ctx);
        });
    }

    displaceMouse(mouse) {
        // Displace tree on mouse mouve
        for (let i = 0; i < this.particles.length; i++) {
            let p = this.particles[i];
            if (p.mass <= 0)
                continue;
            let dir = p.pos.copy().sub(mouse);
            if (dir.magsq() < 70 * 70) {
                p.displaceMouse(mouse);
            }
        }
    }

    move(diff) {
        this.particles.forEach(p => {
            p.move(diff);
        });
    }
};


// --------------- BIRDS ---------------

class Bird extends Boids.Boid {
    constructor(pos, dir, minSpeed, maxSpeed, scale = 1, world) {
        super(pos, dir, minSpeed, maxSpeed);
        this.scale = scale
        this.world = world;
    }
    draw(ctx, img) {
        ctx.setTransform(this.scale, 0, 0, this.scale, this.pos.x, this.pos.y); // sets scale and origin
        ctx.rotate(Math.atan2(this.dir.y, this.dir.x)+Math.PI);
        ctx.drawImage(img, -30, -30);
    }

    updateBoidVelocity(dt, minSpeed, maxSpeed, alignWeight, cohesionWeight, separateWeight, maxSteerForce){
        let centerForce = (new vec2(0, this.world.height/2-this.pos.y)).mult(0.25);
        this.acceleration.add(centerForce.clampMag(0, maxSpeed));

        this.acceleration.add(new vec2(-20, 0));
        super.updateBoidVelocity(dt, minSpeed, maxSpeed, alignWeight, cohesionWeight, separateWeight, maxSteerForce);
    }

    displaceMouse(mouse){
        let dir = this.pos.copy().sub(mouse);
        let d = dir.mag();
        dir.normalize();
        this.force = this.steerTowards(dir, this.world.settings.maxSteerForce, this.world.settings.maxSpeed);
        this.acceleration.add(this.force.mult(400/d).clampMag(this.world.settings.maxSteerForce));
    }
}

class BirdFlock extends Boids.World {
    constructor(dt, settings, width, height) {
        super(dt, settings, width, height);
        this.backBirds = [];
        this.frontBirds = [];

        for (let i = 0; i < 25; i++) {
            let dir = new vec2(-1, randrange(-1, 1));
            let pos = new vec2(Math.random() * this.width, Math.random() * this.height/4 + this.height/2);
            dir.normalize();
            let b;
            
            if (Math.random() < 0.5){
                b = new Bird(pos, dir.copy(), this.settings.minSpeed, this.settings.maxSpeed, randrange(0.25, 0.4), this);
                this.backBirds.push(b);
            }
            else{
                b = new Bird(pos, dir.copy(), this.settings.minSpeed, this.settings.maxSpeed, randrange(0.5, 0.7), this);
                this.frontBirds.push(b);
            }
            this.boids.push(b);
        }
    }

    move(diff){
        this.boids.forEach(b => {
            b.pos.add(diff);
        });
    }

    drawBack(ctx, img) {
        this.backBirds.forEach(b => {
            b.draw(ctx, img);
        });
    }
    drawFront(ctx, img) {
        this.frontBirds.forEach(b => {
            b.draw(ctx, img);
        });
    }

    debugDraw(ctx) {
        this.boids.forEach(b => {
            ctx.setTransform(1, 0, 0, 1, b.pos.x, b.pos.y); // sets scale and origin
            ctx.rotate(Math.atan2(b.dir.y, b.dir.x));
            ctx.strokeStyle = "rgb(255, 0, 255)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(1.2 * this.settings.visionRadius, 0);
            ctx.stroke();
            ctx.fillStyle = "rgba(0, 255, 255, 0.05)";
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, this.settings.visionRadius, -this.settings.perceptionAngle, this.settings.perceptionAngle, false);
            ctx.fill();

            ctx.setTransform(16, 0, 0, 16, b.pos.x, b.pos.y);
            ctx.rotate(Math.atan2(b.dir.y, b.dir.x));
            ctx.fillStyle = "rgb(0, 100, 255)";
            var path=new Path2D();
            ctx.moveTo(0,0);
            path.moveTo(1, 0);
            path.lineTo(-0.5, -Math.sqrt(3.0) / 4.0);
            path.lineTo(-0.5, Math.sqrt(3.0) / 4.0);
            path.lineTo(1,0);
            ctx.fill(path);

        });
    }

    displaceMouse(mouse){
        this.boids.forEach(b => {
            let dir = b.pos.copy().sub(mouse);
            if (dir.magsq() < 200 * 200) {
                b.displaceMouse(mouse);
            }
        });
    }
};


// --------------- MAIN ---------------

function main() {
    // canvas init
    const canvas = document.getElementById("tree_canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Physics init
    const dt = 1.0 / 60.0;
    const world = new Verlet.World(dt, 5);
    const tree = new Tree(new vec2(canvas.width / 2, canvas.height));
    world.addBody(tree);

    // mouse events
    let mouse = new vec2(0, 0);
    let oldMouse = new vec2(0, 0);
    window.addEventListener("mousemove", event => { mouse = getMousePos(canvas, event); });
    window.addEventListener("mousedown", event => { mouse = getMousePos(canvas, event); });
    window.addEventListener("mouseup", event => { mouse = getMousePos(canvas, event); });
    window.addEventListener("click", event => { mouse = getMousePos(canvas, event); });

    let birds;
    let birdImageReady = false;

    // easter egg
    let debug = false;
    let me = document.getElementById("me");

    me.onclick = () => {
        debug = ! debug;

        let theme = document.getElementById("theme");
        let ground = document.getElementById("ground");

        if(debug){
            theme.setAttribute('href', 'styles/first_page_easteregg.css');
            me.src = "images/moi_easteregg.png";
            ground.src = "images/ground_easteregg.svg";
            
        } else {
            theme.setAttribute('href', 'styles/first_page.css');
            me.src = "images/moi.png";
            ground.src = "images/ground.svg";
        }
    }

    // resize events
    window.addEventListener("resize", event => {
        let dx = window.innerWidth / 2 - canvas.width / 2;
        let dy = window.innerHeight - canvas.height;
        let diff = new vec2(dx, dy)
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        tree.move(diff);
        if(birdImageReady){
            birds.width = canvas.width;
            birds.height = canvas.height;
            //birds.move(diff);
        }
    });

    
    // Load birds image
    var imgBird = new Image();
    imgBird.onload = function () {
        birds = new BirdFlock(dt, Boids.defaultSettings, canvas.width, canvas.height);
        birdImageReady = true;
    };
    imgBird.src = '../images/bird.png';

    // Main loop
    const loop = () => {
        if (mouse.x != oldMouse.x || mouse.y != mouse.y) {
            tree.displaceMouse(mouse);
            if(birdImageReady)
                birds.displaceMouse(mouse);
            oldMouse = mouse.copy();
        }

        world.update();
        tree.update();

        if (birdImageReady) {
            birds.update(dt);
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if(debug){
            if(birdImageReady){
                birds.debugDraw(ctx);
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                tree.debugDraw(ctx);
            }
        } else {
            if (birdImageReady)
            birds.drawBack(ctx, imgBird);
        
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            tree.draw(ctx);

            if (birdImageReady)
                birds.drawFront(ctx, imgBird);
        }

        requestAnimationFrame(loop);
    };
    loop();
}

window.addEventListener('load', main);

