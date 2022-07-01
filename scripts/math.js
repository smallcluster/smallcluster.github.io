class vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    copy() {
        return new vec2(this.x, this.y);
    }
    magsq() {
        return this.x * this.x + this.y * this.y;
    }
    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalize() {
        let length = this.mag();
        if (length == 0)
            return this;
        this.x /= length;
        this.y /= length;
        return this;
    }
    add(other) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }
    sub(other) {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }
    mult(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }
    div(s) {
        this.x /= s;
        this.y /= s;
        return this;
    }
    dot(other) {
        return this.x * other.x + this.y * other.y;
    }
    dist(other) {
        return other.copy().sub(this).mag();
    }
    distsq(other) {
        return other.copy().sub(this).magsq();
    }
    setMag(val) { 
        return this.normalize().mult(val);
    }
    clampMag(min, max) {
        var mag = this.mag();
        if (mag > max)
            mag = max;
        else if (mag < min)
            mag = min;
        return this.setMag(mag);
    }
};

function randrange(min, max) { return min + Math.random() * (max - min); }

export { vec2, randrange };