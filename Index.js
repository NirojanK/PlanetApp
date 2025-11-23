const canvas = document.getElementById('space');
        const ctx = canvas.getContext('2d', { alpha: false });
        let DPR = Math.max(1, window.devicePixelRatio || 1);

        function resize() {
            DPR = Math.max(1, window.devicePixelRatio || 1);
            canvas.width = Math.floor(canvas.clientWidth * DPR);
            canvas.height = Math.floor(canvas.clientHeight * DPR);
            ctx.setTransform(DPR,0,0,DPR,0,0);
        }
        window.addEventListener('resize', resize);
        // initial size
        canvas.style.width = 'auto';
        canvas.style.height = '100%';
        resize();

        const center = () => ({ x: canvas.width / DPR / 2, y: canvas.height / DPR / 2 });

        // planet model: {id,name,diam,color,orbitRadius,speedDegreesPerSec,angleRad}
        let planets = [];
        let lastTs = performance.now();

        // Add a couple of defaults
        addPlanetModel({ name:'Mercury', diam:8, orbitRadius:60, speed:47, color:'#bdbdbd' });
        addPlanetModel({ name:'Earth', diam:18, orbitRadius:120, speed:29.8, color:'#2a6fdd' });
        addPlanetModel({ name:'Mars', diam:12, orbitRadius:170, speed:24.1, color:'#c1440e' });

        function addPlanetModel({name='Planet', diam=12, orbitRadius=100, speed=20, color='#fff'}) {
            planets.push({
                id: Math.random().toString(36).slice(2,9),
                name, diam: Number(diam), orbitRadius: Number(orbitRadius),
                speed: Number(speed), color,
                angle: Math.random() * Math.PI * 2
            });
            updateList();
        }

        function updateList() {
            const list = document.getElementById('planetList');
            list.innerHTML = '';
            planets.forEach(p => {
                const div = document.createElement('div');
                div.className = 'planet-item';
                div.innerHTML = `<span style="display:flex;gap:8px;align-items:center">
                    <span style="width:12px;height:12px;background:${p.color};border-radius:50%;display:inline-block"></span>
                    <strong>${p.name}</strong> <small style="color:#666;margin-left:6px">${Math.round(p.orbitRadius)}px</small>
                </span>`;
                const btn = document.createElement('button');
                btn.className = 'small-btn';
                btn.textContent = 'Remove';
                btn.onclick = () => { planets = planets.filter(x => x.id !== p.id); updateList(); };
                div.appendChild(btn);
                list.appendChild(div);
            });
        }

        // drawing
        function drawSun(cx, cy) {
            const r = 22;
            const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, r*2);
            g.addColorStop(0, '#fff7cc'); g.addColorStop(0.35, '#ffe38a'); g.addColorStop(1, '#ffb347');
            ctx.beginPath(); ctx.fillStyle = g; ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
        }

        function drawOrbit(cx, cy, radius) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 1;
            ctx.arc(cx, cy, radius, 0, Math.PI*2);
            ctx.stroke();
        }

        function drawPlanet(p, cx, cy) {
            const x = cx + Math.cos(p.angle) * p.orbitRadius;
            const y = cy + Math.sin(p.angle) * p.orbitRadius;
            // shadow
            ctx.beginPath();
            ctx.fillStyle = 'rgba(0,0,0,0.18)';
            ctx.ellipse(x+2, y+2, p.diam*0.55, p.diam*0.33, 0, 0, Math.PI*2);
            ctx.fill();
            // planet
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.arc(x, y, Math.max(1, p.diam/2), 0, Math.PI*2);
            ctx.fill();
            // name
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.font = '11px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(p.name, x, y - p.diam/2 - 8);
            // store screen pos for hit-testing
            p._screenX = x; p._screenY = y; p._screenR = p.diam/2;
        }

        function animate(ts) {
            const dt = (ts - lastTs) / 1000 || 0;
            lastTs = ts;
            // update angles
            planets.forEach(p => {
                p.angle += (p.speed * Math.PI/180) * dt; // degrees/sec -> rad/sec
            });

            // clear
            ctx.fillStyle = '#000';
            ctx.fillRect(0,0,canvas.width / DPR, canvas.height / DPR);

            const c = center();
            // orbits
            planets.forEach(p => drawOrbit(c.x, c.y, p.orbitRadius));
            // sun
            drawSun(c.x, c.y);
            // planets
            planets.forEach(p => drawPlanet(p, c.x, c.y));

            requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);

        // form
        document.getElementById('addBtn').addEventListener('click', () => {
            const name = document.getElementById('name').value || 'Planet';
            const diam = Number(document.getElementById('diam').value) || 12;
            const orbit = Number(document.getElementById('orbit').value) || 100;
            const speed = Number(document.getElementById('speed').value) || 20;
            const color = document.getElementById('color').value || '#fff';
            addPlanetModel({ name, diam, orbitRadius: orbit, speed, color });
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            planets = []; updateList();
        });

        // hit test to remove on click
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left);
            const y = (e.clientY - rect.top);
            // find topmost planet under cursor
            for (let i = planets.length - 1; i >= 0; i--) {
                const p = planets[i];
                if (!p._screenX) continue;
                const dx = x - p._screenX;
                const dy = y - p._screenY;
                if (dx*dx + dy*dy <= (p._screenR + 4)*(p._screenR + 4)) {
                    planets.splice(i,1);
                    updateList();
                    return;
                }
            }
        });

        // initial resize to set proper canvas pixel size
        setTimeout(resize, 50);