// script.js

// =========================[ Track Path Data ]=========================
const pathData = `
  m 279.77841,825.6875
c 0,0 -205.262634,-113.09942 -143.30114,-154.21932 150.125,-99.62841 233.37614,-182.87954 294.79091,-167.86704 61.41477,15.0125 348.01705,-165.1375 348.01705,-165.1375 0,0 30.025,-85.98069 73.69772,-84.61591 43.67273,1.36477 383.50115,-185.609091 383.50115,-185.609091
l 230.6466,77.792041 236.1057,107.81704 -117.3705,126.92387 -148.7602,88.71023 -171.9614,65.50909 -9.5534,150.125
c 0,0 167.8671,120.1 215.6341,131.01818 47.767,10.91818 94.1693,87.34546 94.1693,87.34546
l -94.1693,73.69772 -100.9932,60.05003 -262.0363,-106.4523 73.6977,-79.15682 -257.94206,-156.94886 -84.61591,-62.77955
c 0,0 -27.29546,-27.29545 -121.46478,1.36478 -94.16931,28.66022 -330.275,176.05568 -330.275,176.05568
l -103.72272,57.32045
z
`;

// =========================[ DOMContentLoaded Main ]=========================
window.addEventListener('DOMContentLoaded', () => {

  // #region ==== DOM ELEMENTS & STATE ====
  const carSvg = document.getElementById('car-svg');
  const infoBox = document.getElementById('info-box');
  const buttons = document.querySelectorAll('.track-btn');
  const trackContainer = document.getElementById('track-container');
  const trackImg = document.getElementById('track-bg');
  const infoSection = document.getElementById('info-section');

  let carX = 500, carY = 400;
  const carSize = 40;
  const keys = {};
  // #endregion

  // #region ==== TRACK CANVAS SETUP ====
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let trackReady = false;

  trackImg.onload = () => {
    canvas.width = trackImg.naturalWidth;
    canvas.height = trackImg.naturalHeight;
    ctx.drawImage(trackImg, 0, 0);
    trackReady = true;
  };
  if (trackImg.complete) {
    trackImg.onload();
  }
  // #endregion

  // #region ==== KEYBOARD CONTROLS ====
  document.addEventListener('keydown', e => {
    // Prevent car movement if typing in an input or textarea
    if (document.activeElement && (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA")) {
      return;
    }
    const key = e.key.toLowerCase();
    if ('wasd'.includes(key)) keys[key] = true;
    if (e.key === "ArrowUp") keys['w'] = true;
    if (e.key === "ArrowDown") keys['s'] = true;
    if (e.key === "ArrowLeft") keys['a'] = true;
    if (e.key === "ArrowRight") keys['d'] = true;
  });
  document.addEventListener('keyup', e => {
    // Prevent car movement if typing in an input or textarea
    if (document.activeElement && (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA")) {
      return;
    }
    const key = e.key.toLowerCase();
    if ('wasd'.includes(key)) keys[key] = false;
    if (e.key === "ArrowUp") keys['w'] = false;
    if (e.key === "ArrowDown") keys['s'] = false;
    if (e.key === "ArrowLeft") keys['a'] = false;
    if (e.key === "ArrowRight") keys['d'] = false;
  });
  // #endregion

  // #region ==== CAR PHYSICS & MOVEMENT ====
  let infoActive = false;

  function getCarBounds() {
    const width = trackContainer.offsetWidth;
    const height = trackContainer.offsetHeight + (infoActive ? infoSection.offsetHeight : 0);
    return {
      minX: 0,
      maxX: width - carSize,
      minY: 0,
      maxY: height - carSize
    };
  }

  function isOnTrackPixel() {
    if (!trackReady) return false;
    const displayWidth = trackContainer.offsetWidth;
    const displayHeight = trackContainer.offsetHeight;
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const imgX = Math.round(carX / displayWidth * imgWidth + carSize/2 / displayWidth * imgWidth);
    const imgY = Math.round(carY / displayHeight * imgHeight + carSize/2 / displayHeight * imgHeight);

    if (imgX < 0 || imgX >= imgWidth || imgY < 0 || imgY >= imgHeight) return false;

    const pixel = ctx.getImageData(imgX, imgY, 1, 1).data;
    if (pixel[0] < 40 && pixel[1] < 40 && pixel[2] < 40) return true;
    if (
      pixel[0] >= 40 && pixel[0] < 120 &&
      pixel[1] >= 40 && pixel[1] < 120 &&
      pixel[2] >= 40 && pixel[2] < 120
    ) return true;
    return false;
  }

  let velocityX = 0, velocityY = 0;
  const acceleration = 0.5;
  const friction = 0.08;
  let lastAngle = 90;

  function updateCar() {
    const maxSpeedNow = isOnTrackPixel() ? 10 : 4;
    let accelX = 0, accelY = 0;

    if (keys['w']) accelY -= 1;
    if (keys['s']) accelY += 1;
    if (keys['a']) accelX -= 1;
    if (keys['d']) accelX += 1;

    if (accelX !== 0 || accelY !== 0) {
      const len = Math.hypot(accelX, accelY);
      accelX /= len;
      accelY /= len;
      velocityX += accelX * acceleration;
      velocityY += accelY * acceleration;
    }

    const speed = Math.hypot(velocityX, velocityY);
    if (speed > maxSpeedNow) {
      velocityX = (velocityX / speed) * maxSpeedNow;
      velocityY = (velocityY / speed) * maxSpeedNow;
    }

    velocityX *= (1 - friction);
    velocityY *= (1 - friction);

    carX += velocityX;
    carY += velocityY;

    const carBounds = getCarBounds();
    carX = Math.max(carBounds.minX, Math.min(carBounds.maxX, carX));
    carY = Math.max(carBounds.minY, Math.min(carBounds.maxY, carY));

    carSvg.style.left = carX + 'px';
    carSvg.style.top = carY + 'px';

    if (Math.hypot(velocityX, velocityY) > 0.5) {
      lastAngle = Math.atan2(velocityY, velocityX) * 180 / Math.PI + 90;
    }
    carSvg.style.transform = `rotate(${lastAngle}deg)`;
  }
  // #endregion

  // #region ==== INFO SECTION & BUTTON HOVER ====
  let hoverTimer = null;
  let activeBtn = null;

  function checkCarOverButton() {
    let found = false;
    buttons.forEach(btn => {
      const btnRect = btn.getBoundingClientRect();
      const carRect = carSvg.getBoundingClientRect();
      const dist = Math.hypot(
        (carRect.left + 20) - (btnRect.left + 20),
        (carRect.top + 20) - (btnRect.top + 20)
      );
      if (dist < 40) {
        if (activeBtn !== btn) {
          clearTimeout(hoverTimer);
          hoverTimer = setTimeout(() => {
            let html = "";
            switch (btn.dataset.section) {
              case "home":
                html = `<div style="font-size:2em;">
    <h2 style="font-size:2.8em; margin-bottom:18px;">Welcome!</h2>
    <p style="margin-bottom:24px;">Explore my interactive portfolio by driving the car to each section or using the navigation bar above.</p>
    <div>
      <strong class="controls-label">CONTROLS</strong>
      <div class="controls-list" style="margin-top:14px; display: flex; flex-direction: column; gap: 10px;">
        <span><span class="keycap">W</span> Forward</span>
        <span><span class="keycap">S</span> Backward</span>
        <span><span class="keycap">D</span> Right</span>
        <span><span class="keycap">A</span> Left</span>
        <span style="font-size:0.95em; color: #888; margin-top:6px;">(Arrow keys also work!)</span>
      </div>
    </div>
  </div>`;
                break;
              
              case "about":
                html = `
<div class="about-flex-row">
  <div class="about-text">
    <h2>About Me</h2>
    <p>
      I'm <b>Jack Rogers</b>, attending USI in the fall as a Computer Science major and CIS minor.<br>
      I'm passionate about competitive racing and am actively pursuing my SCCA License.<br>
      I played Castle Baseball for 4 years and am a 4-time recipient of the Jamey Carroll Award (Heart and Hustle, voted by teammates).<br>
      I'm also part of the <b style="color:#ff9800;">Nextech CSForGood 2024 Team State Winners</b> – a statewide competition where student teams use computer science to solve real-world problems and make a positive impact in their communities.<br>
      Outside of coding, I enjoy <b>working out and staying active</b>, which helps me maintain focus and energy for my projects.<br>
      I also have a passion for <b>car photography</b>, capturing unique moments at the track and sharing the excitement of motorsports through my lens.
    </p>
  </div>
  <div class="about-image-grid">
    <div class="about-img-frame"><img src="Assets/car.JPG" alt="Car"></div>
    <div class="about-img-frame"><img src="Assets/award.jpg" alt="Award"></div>
    <div class="about-img-frame"><img src="Assets/princess1.jpg" alt="Princess 1"></div>
    <div class="about-img-frame"><img src="Assets/meChair.PNG" alt="Me in Chair"></div>
    <div class="about-img-frame"><img src="Assets/dugout.JPEG" alt="Dugout"></div>
    <div class="about-img-frame"><img src="Assets/pitching.JPEG" alt="Pitching"></div>
    <div class="about-img-frame"><img src="Assets/car2.JPG" alt="Car 2"></div>
    <div class="about-img-frame"><img src="Assets/tree.jpg" alt="Tree"></div>
    <div class="about-img-frame"><img src="Assets/princess2.jpg" alt="Princess 2"></div>
  </div>
</div>
`;
                break;
              case "skills":
                html = `
    <h2>Technical Skills</h2>
    <div class="skills-flex-row">
      <div class="logo-grid" id="skills-logo-grid">
        <div class="logo-row">
          <img src="Assets/JavaScriptLogo.png" alt="JavaScript" class="skill-logo" data-lang="JavaScript">
          <img src="Assets/cssLogo.png" alt="CSS" class="skill-logo" data-lang="CSS">
          <img src="Assets/htmlLogo.png" alt="HTML" class="skill-logo" data-lang="HTML">
        </div>
        <div class="logo-row">
          <img src="Assets/pythonLogo.png" alt="Python" class="skill-logo" data-lang="Python">
          <img src="Assets/javaLogo.png" alt="Java" class="skill-logo" data-lang="Java">
          <img src="Assets/phpLogo.png" alt="PHP" class="skill-logo" data-lang="PHP">
        </div>
        <div class="logo-row">
          <img src="Assets/CPlusPLusLogo.png" alt="C++" class="skill-logo" data-lang="C++">
          <img src="Assets/CSharpLogo.png" alt="C#" class="skill-logo" data-lang="C#">
          <img src="Assets/sqlLogo.png" alt="SQL" class="skill-logo" data-lang="SQL">
        </div>
        <div class="logo-row">
          <img src="Assets/vsLogo.png" alt="Visual Studio" class="skill-logo" data-lang="Visual Studio">
          <img src="Assets/vsCodeLogo.png" alt="VS Code" class="skill-logo" data-lang="VS Code">
          <img src="Assets/unityLogo.png" alt="Unity" class="skill-logo" data-lang="Unity">
        </div>
      </div>
      <div class="skills-info-col">
        <div id="skills-description" style="margin-top:24px;">
          <p>
            Here you'll find a showcase of the technical skills I've developed over time. Each icon represents a language, tool, or technology that I've learned through coursework, personal projects, or hands-on experience. Click on any skill to see how I acquired it and how I've applied it to real-world coding challenges and solutions.
          </p>
          <p style="font-weight:bold; margin-top:18px; color:#ff9800;">Click a language to get started.</p>
        </div>
      </div>
    </div>
  `;
                break;
              case "aspirations":
                html = `<h2>My Aspirations</h2><p>I aim to become a software engineer and contribute to impactful projects.</p>`;
                break;
              case "projects":
                html = `
    <h2>Completed CS Projects</h2>
    <div style="display: flex; align-items: flex-start; gap: 36px; margin-top: 24px;">
      <div class="project-description">
        <h3>Indiana Box Two Tracking Solution</h3>
        <p>
          A new Indiana law requires students to prove their employability skills to graduate. Our Box Two Management System offers a streamlined digital solution, enabling students to complete this requirement through a website and Windows application connected to a centralized database. This approach enhances efficiency and accessibility for all involved.
        </p>
        <ul>
          <li>Built with C#, SQL, HTML, and CSS</li>
          <li>Features both a web and Windows application</li>
          <li>Centralized database for easy management</li>
        </ul>
      </div>
      <div class="project-image-right">
        <img src="Assets/boxtwo.png" alt="Box Two Project Screenshot">
      </div>
    </div>
    <div style="display: flex; align-items: flex-start; gap: 36px; margin-top: 40px;">
      <div class="project-description">
        <h3>What Car Brand are You?</h3>
        <p>
          An interactive Buzzfeed-style quiz game that matches users to a car brand based on their answers. This project demonstrates my skills in JavaScript, HTML, and CSS, and focuses on user engagement and fun UI.
        </p>
        <a href="https://jack-rogers092923.github.io/int-u4-project-23-24-starter-code/" target="_blank" rel="noopener" style="color:#ff9800; font-weight:bold; text-decoration:underline; font-size:1.15em;">
          View on GitHub
        </a>
      </div>
      
    </div>
  `;
                break;
              case "special":
                html = `<h2>Special Topics</h2><p>Presentation or content on a special CS topic.</p>`;
                break;
              case "contact":
                html = `<h2>Contact Me</h2>
<form id="contact-form">
  <input type="text" placeholder="Your Name" required><br>
  <input type="email" placeholder="Your Email" required><br>
  <textarea placeholder="Your Message" required></textarea><br>
  <button type="submit">Send</button>
</form>
<div id="contact-success" style="display:none; margin-top:16px;">
  <p style="color:green;">Thank you for your message! I'll get back to you soon.</p>
</div>
<div style="display: flex; flex-direction: row; justify-content: center; gap: 48px; margin-top: 32px;">
  <div style="display: flex; align-items: center; gap: 12px;">
    <a href="https://www.linkedin.com/in/jackrogers-usi/" target="_blank" style="color:#0a66c2; font-weight:bold; text-decoration:none; font-size:1.2em;">LinkedIn</a>
    <a href="https://www.linkedin.com/in/jackrogers-usi/" target="_blank">
      <img src="Assets/linkedin.png" alt="LinkedIn" style="width:38px; height:38px;">
    </a>
  </div>
  <div style="display: flex; align-items: center; gap: 12px;">
    <a href="https://github.com/Jack-Rogers092923" target="_blank" style="color:#fff; font-weight:bold; text-decoration:none; font-size:1.2em;">GitHub</a>
    <a href="https://github.com/Jack-Rogers092923" target="_blank">
      <img src="Assets/github.png" alt="GitHub" style="width:38px; height:38px;">
    </a>
  </div>
</div>`;
                break;
              default:
                html = `<h2>${btn.dataset.info}</h2><p>Section coming soon!</p>`;
            }
            infoSection.innerHTML = html;
            infoSection.style.display = 'block';
            infoActive = true;
            infoSection.scrollIntoView({ behavior: 'smooth' });

            // --- Attach skill logo click handlers after rendering skills section ---
            if (btn.dataset.section === "skills") {
              const logos = infoSection.querySelectorAll('.skill-logo');
              const infoCol = infoSection.querySelector('.skills-info-col');
              // Define bar fill percentages for each language
              const skillLevels = {
                "Python": 100,
                "C#": 100,
                "JavaScript": 100,
                "VS Code": 100,
                "Visual Studio": 100,
                "PHP": 10,
                "SQL": 60,
                "Unity": 80,
                "CSS": 80,
                "HTML": 80,
                "C++": 40,
                "Java": 80
              };

              // Polished explanations for each skill
              const skillDescriptions = {
                "JavaScript": `<p>
      I was introduced to JavaScript in my CS1 class, where I gained foundational knowledge. I further developed my skills through self-directed learning while building our Nextech CSForGood competition website, and improved even more during the Nextech Catapult Program over the summer, applying JavaScript in real-world projects.
    </p>`,
                "CSS": `<p>
      I learned CSS alongside HTML and JavaScript in my CS1 class. My skills grew as I styled the Nextech CSForGood competition website and continued to improve during the Nextech Catapult Program, where I focused on creating visually appealing and responsive designs.
    </p>`,
                "HTML": `<p>
      I started learning HTML in my CS1 class and expanded my knowledge through personal projects and the Nextech CSForGood competition. My experience was further enhanced during the Nextech Catapult Program, where I built and structured web pages for real-world applications.
    </p>`,
                "Python": `<p>
      I learned Python in my CS2 class, using it for data analytics and exploring its capabilities with libraries such as Pygame. This experience allowed me to apply Python to practical problems and expand my understanding of its versatility.
    </p>`,
                "Java": `<p>
      I studied Java in my CS2 class, utilizing it for projects involving turtle graphics and basic implementations. I also compared Java’s processing speed to other languages I’ve learned, deepening my appreciation for its strengths and applications.
    </p>`,
                "PHP": `<p>
      I taught myself PHP to enable server-side data storage for the CSForGood website my team developed. This self-driven learning allowed me to integrate backend functionality into our web projects.
    </p>`,
                "C++": `<p>
      I am self-taught in C++, motivated by its reputation for high performance and its use in game engines like Unreal Engine. My exploration of C++ focused on understanding its speed and practical applications in software development.
    </p>`,
                "C#": `<p>
      I learned C# in my CS2 class and continued to advance my skills in CS3, making it one of my strongest programming languages. I applied C# extensively during the CSForGood event, developing an application for counselors to track students’ graduation requirements by integrating data from our web server.
    </p>`,
                "SQL": `<p>
      I self-taught SQL to facilitate seamless integration of web data into our C# application for the CSForGood project. This enabled efficient data management and retrieval across our software solutions.
    </p>`,
                "Visual Studio": `<p>
      I was introduced to Visual Studio in all of my CS courses, where I learned to develop applications using both Visual Basic and C#. This environment became my primary tool for building and debugging software throughout my coursework.
    </p>`,
                "VS Code": `<p>
      I used Visual Studio Code in my CS2 and CS3 classes for web development with HTML, CSS, and JavaScript, as well as for programming in Python and Java. Its versatility made it an essential part of my workflow for various projects.
    </p>`,
                "Unity": `<p>
      I began teaching myself Unity to gain experience in game development. Through self-study, I learned to use Unity’s interface and scripting capabilities with C#, allowing me to add interactivity and functionality to my own applications.
    </p>`
              };

              logos.forEach(logo => {
                logo.style.cursor = "pointer";
                logo.addEventListener('click', () => {
                  const lang = logo.getAttribute('data-lang');
                  const percent = skillLevels[lang] !== undefined ? skillLevels[lang] : 100;
                  infoCol.innerHTML = `
                    <div id="skill-info-bar" class="skill-info-bar">
                      <div class="skill-label-bar">
                        <span id="selected-lang">${lang}</span>
                        <div class="skill-progress">
                          <div class="skill-bar" style="width:${percent}%;"></div>
                        </div>
                      </div>
                    </div>
                    <div id="skills-description" style="margin-top:24px;">
                      ${skillDescriptions[lang] || `<p>This is where I'll explain how I learned <b>${lang}</b> and how I apply it to my coding knowledge.</p>`}
                    </div>
                  `;
                });
              });
            }
            // ---------------------------------------------------------------------
          }, 750);
          activeBtn = btn;
        }
        found = true;
      }
    });
    if (!found) {
      clearTimeout(hoverTimer);
      infoSection.style.display = 'none';
      infoActive = false;
      activeBtn = null;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  // #endregion

  // #region ==== NAVIGATION BUTTONS ====
  document.querySelectorAll('#main-nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.getAttribute('data-section');
      const targetBtn = document.querySelector(`.track-btn[data-section="${section}"]`);
      if (targetBtn) {
        const trackRect = trackContainer.getBoundingClientRect();
        const btnRect = targetBtn.getBoundingClientRect();
        carX = btnRect.left - trackRect.left + targetBtn.offsetWidth / 2 - carSize / 2;
        carY = btnRect.top - trackRect.top + targetBtn.offsetHeight / 2 - carSize / 2;
        velocityX = 0;
        velocityY = 0;
        carSvg.style.left = carX + 'px';
        carSvg.style.top = carY + 'px';
      }
    });
  });
  // #endregion

  // #region ==== THEME TOGGLE ====
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.checked = document.body.classList.contains('light-mode');
  themeToggle.addEventListener('change', () => {
    document.body.classList.toggle('light-mode', themeToggle.checked);
  });
  // #endregion

  // #region ==== PITBOARD TIMER & NAV NAME ====
  setTimeout(() => {
    const pitboard = document.getElementById('track-pitboard');
    if (pitboard) pitboard.style.display = 'none';
    const navName = document.getElementById('nav-name');
    if (navName) navName.style.display = 'block';
  }, 10000);
  // #endregion

  // #region ==== MAIN ANIMATION LOOP ====
  function animate() {
    updateCar();
    checkCarOverButton();
    requestAnimationFrame(animate);
  }
  animate();
  // #endregion

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      contactForm.style.display = 'none';
      document.getElementById('contact-success').style.display = 'block';
    });
  }
});

// =========================[ Section Show/Hide Utility ]=========================
function showSection(sectionId) {
  document.querySelectorAll('#info-section > section').forEach(sec => {
    sec.style.display = 'none';
  });
  document.getElementById(sectionId).style.display = 'block';
}

// Example: showSection('skills-section');