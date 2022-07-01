class Render {
    constructor(ctx){
        this.ctx = ctx;
    }

    clear(){};
    clearColor(r,g,b,a){};

    fill(r,g,b,a){};
    stroke(r,g,b,a){};
    noFill(){};
    noStroke(){};
    strokeWeight(weight){};

    // shapes
    rect(x,y,w,h){};
    line(x1,x2,y1,y2){};
    ellipse(x,y,w,h){};

    // main loop
    draw(){
        requestAnimationFrame(this.draw());
    };
};

export {Render};