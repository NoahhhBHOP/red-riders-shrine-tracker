class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 2 + 1;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = (Math.random() * 20) + 1;
        this.distance = 100;
        this.alpha = Math.random() * 0.5 + 0.3;
        this.speed = Math.random() * 0.5;
        this.directionX = (Math.random() - 0.5) * 0.2;
        this.directionY = (Math.random() - 0.5) * 0.2;
    }

    draw(ctx) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 51, 51, 0.5)';
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = `rgba(255, 51, 51, ${this.alpha})`;
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }

    update(mouse) {
        // Constant movement
        this.x += this.directionX;
        this.y += this.directionY;

        // Bounce off edges
        if (this.x < 0 || this.x > window.innerWidth) this.directionX *= -1;
        if (this.y < 0 || this.y > window.innerHeight) this.directionY *= -1;

        // Mouse interaction
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;

        const maxDistance = 150;
        let force = (maxDistance - distance) / maxDistance;
        if (force < 0) force = 0;

        let directionX = (forceDirectionX * force * this.density) * -1;
        let directionY = (forceDirectionY * force * this.density) * -1;

        if (distance < maxDistance) {
            this.x += directionX;
            this.y += directionY;
            this.alpha = Math.min(0.8, this.alpha + 0.1);
        } else {
            this.alpha = Math.max(0.3, this.alpha - 0.02);
        }
    }
}

class ParticleEffect {
    constructor() {
        this.canvas = document.getElementById('backgroundCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = {
            x: undefined,
            y: undefined
        };
        
        this.init();
        this.animate();
    }

    init() {
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.x;
            this.mouse.y = e.y;
        });

        window.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.mouse.x = e.touches[0].clientX;
            this.mouse.y = e.touches[0].clientY;
        });

        window.addEventListener('mouseleave', () => {
            this.mouse.x = undefined;
            this.mouse.y = undefined;
        });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        this.createParticles();
    }

    createParticles() {
        this.particles = [];
        const numberOfParticles = (this.canvas.width * this.canvas.height) / 10000;
        
        for (let i = 0; i < numberOfParticles; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            this.particles.push(new Particle(x, y));
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            particle.update(this.mouse);
            particle.draw(this.ctx);
        });

        requestAnimationFrame(() => this.animate());
    }
}

window.addEventListener('load', () => {
    new ParticleEffect();
}); 