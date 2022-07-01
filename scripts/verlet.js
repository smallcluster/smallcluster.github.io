import {vec2} from "./math.js";

class Particle {
    constructor(pos, mass = 1) {
        this.pos = pos.copy();
        this.oldPos = pos.copy();
        this.acc = new vec2(0,0);
        this.mass = mass;
        this.alive = true;
    }
    update(dt) {
        if(this.mass > 0){
            let tmp = this.pos.copy();
            this.pos.mult(2).sub(this.oldPos).add(this.acc.div(this.mass).mult(dt));
            this.oldPos = tmp;
            this.acc = new vec2(0,0);
        }
    }
};

class TimedParticle extends Particle{
    constructor(pos, lifeTime, mass = 1){
        super(pos, mass);
        this.time = 0;
        this.lifeTime = lifeTime;
    }
    update(dt){
        this.time += dt;
        if(this.time < this.lifeTime){
            super.update(dt);
        } else {
            this.alive = false;
            this.time = this.lifeTime;
        }
    }
};

class Link {
    constructor(p1, p2, length = null){
        this.p1 = p1;
        this.p2 = p2;
        if(length == null)
            this.length = this.p2.pos.copy().sub(this.p1.pos).mag();
        else
            this.length = length;
    }
    update(dt) {
        if (this.p1.mass <= 0 && this.p2.mass <= 0)
            return;
        let move = this.p2.pos.copy().sub(this.p1.pos);
        let d = move.mag();
        move.mult(d-this.length).div(d);
        if (this.p1.mass <= 0) {
            this.p2.pos.sub(move);
        } else if (this.p2.mass <= 0) {
            this.p1.pos.add(move);
        } else {
            let totalMass = this.p1.mass + this.p2.mass;
            this.p1.pos.add(move.copy().mult(this.p2.mass / totalMass));
            this.p2.pos.sub(move.copy().mult(this.p1.mass / totalMass));
        }
    }
};

class Body {
    constructor(){
        this.particles = [];
        this.links = [];
    }
};

class World{
    constructor(dt, n){
        this.bodies = [];
        this.n = n;
        this.dt = dt;
    }

    update(){

        // update particles
        this.bodies.forEach(b => {
            // timedParticles
            const toRemove = [];
            for(let i=0; i < b.particles.length; i++){
                const p = b.particles[i];
                p.update(this.dt);
                if(!p.alive)
                    toRemove.push(i);
            }
            for(let i=0; i < toRemove.length; i++){
                b.particles.splice(toRemove[i], 1);
            }
        });

        // update links
        for (let i = 0; i < this.n; i++) {
            this.bodies.forEach(b => {
                b.links.forEach(l => {
                    l.update(this.dt);
                });
            });
        }
    }
    addBody(b){
        this.bodies.push(b);
    }
};

export {Particle, TimedParticle, Link, Body, World};