import { vec2 } from "./math.js";

class Boid {
    constructor(pos, dir, minSpeed, maxSpeed) {
        var startSpeed = (minSpeed + maxSpeed) / 2;
        this.pos = pos.copy();
        this.dir = dir.copy();
        this.velocity = this.dir.copy().mult(startSpeed);
        this.acceleration = new vec2(0,0);
        // rules parametters
        this.numFlockmate = 0;
        this.centerOfFlockmate = new vec2(0, 0);
        this.flockHeading = new vec2(0, 0);
        this.avoidanceHeading = new vec2(0, 0);
    }
    isBoidVisible(boid, radius, perceptionAngle) {
        var dd = boid.pos.copy().sub(this.pos);
        var dot = dd.copy().normalize().dot(this.dir);
        return dd.magsq() <= radius * radius && dot >= Math.cos(perceptionAngle);
    }
    updateBoidVelocity(dt, minSpeed, maxSpeed, alignWeight, cohesionWeight, separateWeight, maxSteerForce) {
        if (this.numFlockmate != 0) {
            var alignementForce = this.steerTowards(this.flockHeading.copy().div(this.numFlockmate), maxSteerForce, maxSpeed).mult(alignWeight);
            var cohesionForce = this.steerTowards(this.centerOfFlockmate.copy().div(this.numFlockmate).sub(this.pos), maxSteerForce, maxSpeed).mult(cohesionWeight);
            var separationForce = this.steerTowards(this.avoidanceHeading.copy().div(this.numFlockmate), maxSteerForce, maxSpeed).mult(separateWeight);
            this.acceleration.add(alignementForce).add(cohesionForce).add(separationForce);
        }
        this.velocity.add(this.acceleration.copy().mult(dt)).clampMag(minSpeed, maxSpeed);
        this.dir = this.velocity.copy().normalize();
        this.acceleration = new vec2(0, 0);
        // reset parametters
        this.numFlockmate = 0;
        this.centerOfFlockmate = new vec2(0, 0);
        this.flockHeading = new vec2(0, 0);
        this.avoidanceHeading = new vec2(0, 0);
    }
    updateBoidPosition(dt) { this.pos.add(this.velocity.copy().mult(dt)); }
    steerTowards(vector, maxSteerForce, maxSpeed) { return vector.copy().setMag(maxSpeed).sub(this.velocity).clampMag(0, maxSteerForce); }
}

class World {
    constructor(dt, settings, width, height) {
        this.dt = dt;
        this.boids = [];
        this.settings = settings;
        this.width = width;
        this.height = height;
    }
    moveBoids(dt) {
        this.boids.forEach(b => {
            b.updateBoidVelocity(this.dt, this.settings.minSpeed, this.settings.maxSpeed,
                this.settings.alignWeight, this.settings.cohesionWeight,
                this.settings.separateWeight, this.settings.maxSteerForce);
            b.updateBoidPosition(dt);
        });
    }
    warpWorld() {
        this.boids.forEach(b => {
            if (b.pos.x <= 0)
                b.pos.x = this.width;
            else if (b.pos.x >= this.width)
                b.pos.x = 0;
            if (b.pos.y <= 0)
                b.pos.y = this.height;
            else if (b.pos.y >= this.height)
                b.pos.y = 0;
        });
    }
    boidsInterract() {
        for (let i = 0; i < this.boids.length; i++) {
            var b1 = this.boids[i];
            for (let j = 0; j < this.boids.length; j++) {
                if (i == j)
                    continue;
                var b2 = this.boids[j];
                if (b1.isBoidVisible(b2, this.settings.visionRadius, this.settings.perceptionAngle)) {
                    b1.numFlockmate += 1;
                    b1.flockHeading.add(b2.dir);
                    b1.centerOfFlockmate.add(b2.pos);
                    var offset = b1.pos.copy().sub(b2.pos);
                    b1.avoidanceHeading.add(offset.normalize());
                }
            }
        }
    }
    update(dt) {
        this.boidsInterract();
        this.moveBoids(dt);
        this.warpWorld();
    }
};

const defaultSettings = {
    minSpeed: 10,
    maxSpeed: 300,
    maxSteerForce: 200,
    alignWeight: 1.0,
    cohesionWeight: 0.5,
    separateWeight: 1.0,
    visionRadius: 96,
    perceptionAngle: 132 * Math.PI / 180.0
};

export { Boid, World, defaultSettings};