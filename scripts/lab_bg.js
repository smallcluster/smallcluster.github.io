import { randrange, vec2 } from "./math.js";

class Particle {
    constructor(pos, color){
        this.pos = pos;
        this.vel = new vec2(randrange(-1,1), randrange(-1,1));
        this.vel.normalize().mult(randrange(32, 128));
        this.color = color;
    }

    draw(ctx, r){
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, r, 0, 2 * Math.PI);
        ctx.fill();
    }

    update(dt){
        this.pos.add(this.vel.copy().mult(dt));
    }

    warp(width, height){
        if(this.pos.x < 0)
            this.pos.x = width;
        else if(this.pos.x > width)
            this.pos.x = 0;

        if(this.pos.y < 0)
            this.pos.y = height;
        else if(this.pos.y > height)
            this.pos.y = 0;
    }
}

function reisze(canvas){
    var rect = canvas.getBoundingClientRect();
    var w = rect.right - rect.left;
    var h = rect.bottom - rect.top;
    if(w != canvas.width || h != canvas.height){
        canvas.width = w;
        canvas.height = h;
    }
}

function main(){
    // canvas init
    const canvas = document.getElementById("canvas-lab");
    const ctx = canvas.getContext("2d");
    reisze(canvas);
    const dt = 1.0 / 60.0;

    // Init
    const particles = [];
    for(let i=0; i < 50; i++){
        let r = Math.floor(randrange(150, 255));
        let g = Math.floor(randrange(150, 255));
        let b = Math.floor(randrange(250, 255));
        let color = "rgb("+r+","+g+","+b+")";
        let pos = new vec2(randrange(0, canvas.width), randrange(0, canvas.height))
        particles.push(new Particle(pos, color));
    }

    // Main loop
    const loop = () => {
        reisze(canvas);
        particles.forEach(p => {
            p.update(dt);
            p.warp(canvas.width, canvas.height);
        });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.draw(ctx, 8);
        });
        
        for(let i=0; i < particles.length; i++){
            for(let j=i+1; j< particles.length; j++){
                let p1 = particles[i];
                let p2 = particles[j];
                var d = p2.pos.distsq(p1.pos);
                if (d < 100*100){
                    ctx.strokeStyle = p1.color;
                    ctx.lineWidth = 2 * d / (100*100);
                    ctx.beginPath();
                    ctx.moveTo(p1.pos.x, p1.pos.y);
                    ctx.lineTo(p2.pos.x, p2.pos.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(loop);
    };
    loop();
}

window.addEventListener('load', main);