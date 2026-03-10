document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("star-container");
  const scoreDisplay = document.getElementById("score-display");
  const instruction = document.getElementById("instruction-text");
  const scoreBoard = document.querySelector(".score-board");
  const overlay = document.querySelector(".magic-overlay");
  
  const sequenceContainer = document.getElementById("constellation-sequence");
  const linesSvg = document.getElementById("constellation-lines");

  const TARGET_SCORE = 10;
  let score = 0;
  let gameActive = true;
  let activeStars = [];
  let caughtPoints = []; // Stores {x, y} of where stars were caught
  let spawnInterval;

  // Star Types
  const starTypes = ['type-gold', 'type-blue', 'type-pink'];

  // Start the game loop
  startGame();

  function startGame() {
    // Hide instructions after a few seconds
    setTimeout(() => {
      instruction.classList.add('fade-out');
    }, 4000);

    // Spawn stars periodically
    spawnInterval = setInterval(() => {
      if (gameActive) spawnStar();
    }, 800);

    // Animation loop for falling
    requestAnimationFrame(updateStars);
  }

  function spawnStar() {
    // Create element
    const starArea = document.createElement("div");
    starArea.className = "falling-star";
    
    // Pick random type
    const type = starTypes[Math.floor(Math.random() * starTypes.length)];
    starArea.classList.add(type);

    const graphic = document.createElement("div");
    graphic.className = "star-graphic";
    starArea.appendChild(graphic);

    // Initial position
    const size = 40; // hit box size
    const startX = Math.random() * (window.innerWidth - size);
    const startY = -size; // Start above screen
    
    // Random speed
    const speed = 1.5 + Math.random() * 2; // Pixels per frame
    
    // Drift (horizontal sway)
    const driftMax = (Math.random() - 0.5) * 2; // -1 to 1
    const driftSpd = 0.02 + Math.random() * 0.03;
    const driftOff = Math.random() * Math.PI * 2;

    starArea.style.left = `${startX}px`;
    starArea.style.top = `${startY}px`;

    // Define star object logic
    const starObj = {
      el: starArea,
      x: startX,
      y: startY,
      speed: speed,
      swayX: startX,
      driftMax: driftMax,
      driftSpd: driftSpd,
      driftOff: driftOff,
      time: 0,
      active: true,
      typeClass: type
    };

    // Click / Touch event
    const catchHandler = (e) => {
      e.preventDefault(); // Prevents double firing on mobile
      if (!starObj.active || !gameActive) return;
      catchStar(starObj, e.clientX, e.clientY);
    };

    // Use pointerdown for responsive tapping
    starArea.addEventListener("pointerdown", catchHandler);

    container.appendChild(starArea);
    activeStars.push(starObj);
  }

  function updateStars() {
    if (!gameActive) return;

    for (let i = activeStars.length - 1; i >= 0; i--) {
      const star = activeStars[i];
      if (!star.active) {
        activeStars.splice(i, 1);
        continue;
      }

      // Update position
      star.y += star.speed;
      star.time += star.driftSpd;
      
      // Calculate horizontal sway
      const sway = Math.sin(star.time + star.driftOff) * (star.driftMax * 50);
      const currentX = star.x + sway;
      
      // Constrain X to screen bounds
      const safeX = Math.max(0, Math.min(window.innerWidth - 40, currentX));

      star.el.style.transform = `translate(${safeX - star.x}px, ${star.y}px)`;

      // Remove if off screen bottom
      if (star.y > window.innerHeight) {
        star.el.remove();
        star.active = false;
        activeStars.splice(i, 1);
      }
    }

    if (gameActive) {
      requestAnimationFrame(updateStars);
    }
  }

  function catchStar(starObj, clientX, clientY) {
    starObj.active = false;
    
    // Remove from DOM immediately
    starObj.el.remove();

    // The visually caught coordinates (accounting for CSS transform)
    // By getting clientX/Y from the event, we know exactly where they tapped
    // But if event coords are missing (somehow), fallback to calculated position
    const catchX = clientX || (starObj.x + Math.sin(starObj.time + starObj.driftOff) * (starObj.driftMax * 50) + 20);
    const catchY = clientY || (starObj.y + 20);

    createParticles(catchX, catchY, starObj.typeClass);
    
    // Save points for constellation
    if (score < TARGET_SCORE) {
       // Leave a glowing point behind
       const pointEl = document.createElement("div");
       pointEl.className = "caught-point";
       pointEl.style.left = `${catchX}px`;
       pointEl.style.top = `${catchY}px`;
       
       // Use specific color for glow
       const colorMap = {
           'type-gold': '#f4c653',
           'type-blue': '#64c8ff',
           'type-pink': '#ffb6c1'
       };
       pointEl.style.boxShadow = `0 0 10px #fff, 0 0 20px ${colorMap[starObj.typeClass]}`;
       
       container.appendChild(pointEl);
       caughtPoints.push({ x: catchX, y: catchY });
    }

    updateScore();
  }

  function createParticles(x, y, typeClass) {
    const numParticles = 8;
    const colorMap = {
        'type-gold': '#f4c653',
        'type-blue': '#64c8ff',
        'type-pink': '#ffb6c1'
    };
    const pColor = colorMap[typeClass] || '#fff';

    for (let i = 0; i < numParticles; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      p.style.backgroundColor = pColor;
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;

      // Random direction and distance
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 40; // 30-70px
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;

      p.style.setProperty('--tx', `${tx}px`);
      p.style.setProperty('--ty', `${ty}px`);

      container.appendChild(p);

      // Cleanup
      setTimeout(() => p.remove(), 600);
    }
  }

  function updateScore() {
    score++;
    scoreDisplay.textContent = `${score} / ${TARGET_SCORE}`;

    // Pop animation on scoreboard
    scoreBoard.style.transform = 'scale(1.1)';
    setTimeout(() => {
        if(scoreBoard) scoreBoard.style.transform = 'scale(1)';
    }, 150);

    if (score >= TARGET_SCORE && gameActive) {
      triggerWin();
    }
  }

  function triggerWin() {
    gameActive = false;
    clearInterval(spawnInterval);
    
    // Clean up remaining falling stars
    activeStars.forEach(s => s.el.remove());
    activeStars = [];

    // UI Updates
    scoreBoard.classList.add("complete");
    scoreDisplay.textContent = "Complete";
    overlay.classList.add("win-state");

    // Start constellation drawing
    sequenceContainer.classList.remove("hidden");
    drawConstellation();
  }

  function drawConstellation() {
    // We need at least 2 points to draw lines
    if (caughtPoints.length < 2) return;

    // Draw lines sequentially between the points
    for (let i = 0; i < caughtPoints.length - 1; i++) {
        const pt1 = caughtPoints[i];
        const pt2 = caughtPoints[i+1];
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', pt1.x);
        line.setAttribute('y1', pt1.y);
        line.setAttribute('x2', pt2.x);
        line.setAttribute('y2', pt2.y);
        line.classList.add('constellation-line');
        
        // Calculate length for SVG dash animation
        const length = Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
        line.style.strokeDasharray = length;
        line.style.strokeDashoffset = length;
        
        // CSS Animation for drawing the line
        // Delay each line by 0.3s * index
        line.style.transition = `stroke-dashoffset 0.8s ease ${i * 0.3}s`;
        
        linesSvg.appendChild(line);
        
        // Trigger reflow then start animation
        setTimeout(() => {
            line.style.strokeDashoffset = '0';
        }, 50);
    }
  }
});
