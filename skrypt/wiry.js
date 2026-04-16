// ================== GRA 1: WIRY ==================
let wirAnim; 
let isRunning = false;
const ctx = document.getElementById('wirCanvas').getContext('2d');
const W = 400, H = 400, bounds = 2.9, dt = 0.04, eps = 0.08, targetRadius = 0.18;
const A = { x: -2.5, y: -2.0 }, B = { x: 2.3, y: 2.0 };
let particle = { x: A.x, y: A.y }; 
let traj = []; 
let pathLength = 0;

const vortices = [
    { x: -1.4, y: 0.0, color: "blue", el: "v1" }, 
    { x: 0.0, y: 1.4, color: "green", el: "v2" }, 
    { x: 1.4, y: -1.0, color: "orange", el: "v3" }
];

const toPixX = (x) => ((x + 3) / 6) * W;
const toPixY = (y) => H - ((y + 3) / 6) * H;

function openWiry() { 
    showScreen('screen-wir'); 
    stopWir(); 
    particle = { x: A.x, y: A.y }; 
    traj = []; 
    pathLength = 0; 
    drawWir(); 
}

function startWir() { 
    stopWir(); 
    particle = { x: A.x, y: A.y }; 
    traj = []; 
    pathLength = 0; 
    isRunning = true; 
    animateWir(); 
}

function stopWir() { 
    isRunning = false; 
    if (wirAnim) cancelAnimationFrame(wirAnim); 
}

function getVelocity(x, y) {
    let u = 0, v = 0;
    vortices.forEach(vt => {
        let strength = parseFloat(document.getElementById(vt.el).value), dx = x - vt.x, dy = y - vt.y;
        let r2 = dx*dx + dy*dy + eps; 
        u += -strength * dy / r2; 
        v +=  strength * dx / r2;
    });
    return { u, v };
}

function drawWir() {
    ctx.clearRect(0, 0, W, H); 
    ctx.strokeStyle = "rgba(0, 100, 200, 0.3)"; 
    ctx.lineWidth = 1.5;
    const step = 6 / 15;
    for(let gx = -3; gx <= 3; gx += step) {
        for(let gy = -3; gy <= 3; gy += step) {
            let { u, v } = getVelocity(gx, gy); 
            let mag = Math.sqrt(u*u + v*v);
            if(mag > 3) { u = (u/mag)*3; v = (v/mag)*3; }
            const scale = 0.15, px1 = toPixX(gx), py1 = toPixY(gy), px2 = toPixX(gx + u * scale), py2 = toPixY(gy + v * scale);
            ctx.beginPath(); ctx.moveTo(px1, py1); ctx.lineTo(px2, py2);
            const angle = Math.atan2(py2 - py1, px2 - px1);
            ctx.lineTo(px2 - 4 * Math.cos(angle - Math.PI/6), py2 - 4 * Math.sin(angle - Math.PI/6)); 
            ctx.moveTo(px2, py2); 
            ctx.lineTo(px2 - 4 * Math.cos(angle + Math.PI/6), py2 - 4 * Math.sin(angle + Math.PI/6)); 
            ctx.stroke();
        }
    }
    ctx.beginPath(); ctx.arc(toPixX(B.x), toPixY(B.y), targetRadius * (W/6), 0, Math.PI * 2); 
    ctx.fillStyle = "rgba(128, 0, 128, 0.3)"; ctx.fill(); 
    ctx.fillStyle = "purple"; ctx.fillText("B", toPixX(B.x)-4, toPixY(B.y)+4);
    
    ctx.beginPath(); ctx.arc(toPixX(A.x), toPixY(A.y), 6, 0, Math.PI * 2); 
    ctx.fillStyle = "black"; ctx.fill(); 
    ctx.fillText("A", toPixX(A.x)-4, toPixY(A.y)+15);
    
    vortices.forEach(v => { 
        ctx.beginPath(); ctx.arc(toPixX(v.x), toPixY(v.y), 7, 0, Math.PI * 2); 
        ctx.fillStyle = v.color; ctx.fill(); 
    });
    
    if (traj.length > 1) { 
        ctx.beginPath(); ctx.moveTo(toPixX(traj[0].x), toPixY(traj[0].y)); 
        for(let i=1; i<traj.length; i++) ctx.lineTo(toPixX(traj[i].x), toPixY(traj[i].y)); 
        ctx.strokeStyle = "red"; ctx.lineWidth = 2; ctx.stroke(); 
    }
    
    ctx.beginPath(); ctx.arc(toPixX(particle.x), toPixY(particle.y), 6, 0, Math.PI * 2); 
    ctx.fillStyle = "red"; ctx.fill();
}

function animateWir() {
    if (!isRunning) return;
    let { u, v } = getVelocity(particle.x, particle.y);
    let nx = particle.x + u * dt, ny = particle.y + v * dt;
    if(Math.abs(nx) > bounds) nx = Math.sign(nx) * bounds; 
    if(Math.abs(ny) > bounds) ny = Math.sign(ny) * bounds;
    
    pathLength += Math.sqrt(Math.pow(nx - particle.x, 2) + Math.pow(ny - particle.y, 2));
    particle.x = nx; particle.y = ny; 
    traj.push({x: nx, y: ny});
    drawWir();
    
    if (Math.sqrt(Math.pow(particle.x - B.x, 2) + Math.pow(particle.y - B.y, 2)) < targetRadius) {
        isRunning = false; 
        setTimeout(() => saveScore("WIRY", `${pathLength.toFixed(1)} PKT`, pathLength), 300); 
        return;
    }
    wirAnim = requestAnimationFrame(animateWir);
}

// Inicjalizacja tła na starcie
drawWir();