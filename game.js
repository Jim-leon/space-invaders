document.addEventListener('DOMContentLoaded', () => {
   const gp = navigator.getGamepads()[0];
   
   // Game state
   let invaders,
      level = 1,
      phase = 1,
      dir = "ltr",
      delay = 10,
      screenright = 578,
      screenheight = 620,
      pad,
      ship_hit,
      timeout,
      shot,
      invtop,
      invheight,
      invwidth,
      invleft,
      sign,
      mute = false,
      hiscore = 500,
      vol = 0.5,
      missileposY = 0,
      missileposX = 0,
      tankpos = 100,
      player = 0,
      playerNo = 1,
      tank,
      missile,
      space_ship,
      invadersTimeout,
      timer,
      rand,
      currentPos,
      td,
      aud,
      invcount;
   
   const score = [];
   score[1] = 0;
   score[2] = 0;

   set_sounds();
   set_css();
   draw_screen();
   
   if (invaders) {
      get_coordinates();
      invcount = checkInvaders();
   }

   window.addEventListener('resize', () => {
      get_coordinates();
   });

   const keys = {};

   document.addEventListener('keydown', (e) => {
      keys[e.which] = true;
      processKeys(keys);
   });

   document.addEventListener('keyup', (e) => {
      delete keys[e.which];
   });

   const startScreen = () => {
      const html = `
    <div class='intro-text'>
      PLAY<br>
      SPACE&nbsp;&nbsp;&nbsp;&nbsp;INVADERS<br>
      * SCORE&nbsp;&nbsp;&nbsp;&nbsp;ADVANCE&nbsp;&nbsp;&nbsp;&nbsp;TABLE *<br>
      <div class='space-invader space-ship on'></div>= ? MYSTERY<br>
      <div class='space-invader t1'></div>= 30 POINTS<br>
      <div class='space-invader m1'></div>= 20 POINTS<br>
      <div class='space-invader b1'></div>= 10 POINTS<br><br>
      PUSH<br>
      1&nbsp;&nbsp;&nbsp;OR&nbsp;&nbsp;&nbsp;&nbsp;2&nbsp;&nbsp;&nbsp;&nbsp;PLAYERS&nbsp;&nbsp;&nbsp;&nbsp;BUTTON
    </div>
  `;
      document.querySelector('.container').insertAdjacentHTML('beforeend', html);
   };

   const processKeys = (keys) => {
      if (keys["49"] || keys["50"]) {
         playGame(keys["49"] ? 1 : 2);
      }
      if (keys["37"]) move_left();
      if (keys["39"]) move_right();
      if (keys["17"] && !shot) shoot_missile();
      if (keys["81"]) mute = !mute;
      if (keys["109"]) vol = Math.max(0, vol - 0.05);
      if (keys["107"]) vol = Math.min(1, vol + 0.05);
   };

   const playGame = (plyr) => {
      const introText = document.querySelector('.intro-text');
      if (introText) introText.style.display = 'none';
      
      player = 1;
      playerNo = plyr;
      draw_screen();
      
      window.setInterval(() => {
         if (shot) {
            move_missile();
         }
         move_spaceship();
      }, 10);

      timer = delay;

      const myFunction = () => {
         move_invaders();
         timer = delay * invcount;
         invadersTimeout = setTimeout(myFunction, timer);
      };
      setTimeout(myFunction, timer);
   };

   const gamepad = () => {
      if (gp.buttons[3].pressed) {
         shoot_missile();
      }
      if (gp.axes[0] === -1) {
         move_left();
      }
      if (gp.axes[0] === 1) {
         move_right();
      }
   };

   const move_left = () => {
      if (tankpos > pad) {
         tankpos -= 5;
         tank.style.left = `${tankpos}px`;
      }
   };

   const move_right = () => {
      if (tankpos < screenright - pad - 44) {
         tankpos += 5;
         tank.style.left = `${tankpos}px`;
      }
   };

   const shoot_missile = () => {
      shot = true;
      missileposX = tankpos + 22;
      const tankWrapper = document.querySelector('.tank-wrapper');
      missileposY = parseInt(getComputedStyle(tankWrapper).top);
      play_sound("shoot");
      missile.style.top = `${missileposY}px`;
      missile.style.left = `${missileposX}px`;
      missile.style.display = 'inline-block';
   };

   const getOffset = (el) => {
      const rect = el.getBoundingClientRect();
      return {
         left: rect.left + window.scrollX,
         top: rect.top + window.scrollY
      };
   };

   const checkcollision = (div1, div2) => {
      const rect1 = div1.getBoundingClientRect();
      const rect2 = div2.getBoundingClientRect();
      
      return !(rect1.bottom < rect2.top || 
               rect1.top > rect2.bottom || 
               rect1.right < rect2.left || 
               rect1.left > rect2.right);
   };

   const trimTable = () => {
      const invadersEl = document.querySelector('#invaders');
      if (!invadersEl) return;
      
      const table = invadersEl.querySelector('table');
      if (!table) return;
      
      // Check bottom row
      const rows = table.querySelectorAll('tr');
      const btmRow = rows[rows.length - 1];
      const divs = btmRow.querySelectorAll('div');
      const emptyDivs = btmRow.querySelectorAll('div.empty');
      
      if (divs.length === emptyDivs.length) {
         btmRow.remove();
      }

      // Check left column
      let check = true;
      const allRows = table.querySelectorAll('tr');
      allRows.forEach(row => {
         const firstCell = row.querySelector('td:first-child');
         if (firstCell && !firstCell.querySelector('div').classList.contains('empty')) {
            check = false;
         }
      });

      if (check) {
         allRows.forEach(row => {
            const firstCell = row.querySelector('td:first-child');
            if (firstCell) firstCell.remove();
         });
         const firstTd = table.querySelector('td');
         if (firstTd) {
            const tdWidth = firstTd.offsetWidth;
            const currentLeft = invadersEl.offsetLeft;
            invadersEl.style.left = `${currentLeft + tdWidth}px`;
         }
      }

      // Check right column
      check = true;
      const allRows2 = table.querySelectorAll('tr');
      allRows2.forEach(row => {
         const lastCell = row.querySelector('td:last-child');
         if (lastCell && !lastCell.querySelector('div').classList.contains('empty')) {
            check = false;
         }
      });

      if (check) {
         allRows2.forEach(row => {
            const lastCell = row.querySelector('td:last-child');
            if (lastCell) lastCell.remove();
         });
      }
   };

   const move_spaceship = () => {
      if (!ship_hit) {
         const isHidden = getComputedStyle(space_ship).display === 'none';
         if (isHidden) {
            rand = Math.round(Math.random() * 500) + 1;
            if (rand < 2) {
               space_ship.style.display = 'inline-block';
            }
         } else {
            play_sound("ship1");
            currentPos = parseInt(getComputedStyle(space_ship).left);
            currentPos += 1;
            space_ship.style.left = `${currentPos}px`;
            if (currentPos > screenright - 10) {
               space_ship.style.display = 'none';
               space_ship.style.left = "-50px";
            }
         }
      }
   };

   const move_missile = () => {
      missileposY -= 5;
      missile.style.top = `${missileposY}px`;
      
      if (checkcollision(missile, invaders)) {
         const spaceInvaders = invaders.querySelectorAll('.space-invader:not(.empty)');
         spaceInvaders.forEach(invader => {
            if (checkcollision(invader, missile)) {
               play_sound("kill");
               td = invader.parentElement;
               td.innerHTML = '<div class="space-invader explosion"></div>';
               shot = false;
               missile.style.display = 'none';
               update_score(player, invader);
               
               setTimeout(() => {
                  td.innerHTML = '<div class="space-invader empty"></div>';
                  trimTable();
                  trimTable();
                  trimTable();
               }, 100);
               
               if (invcount === 0) {
                  end_game();
                  return false;
               }
            }
         });
      }
      
      const missileHidden = getComputedStyle(missile).display === 'none';
      if (!missileHidden && checkcollision(missile, space_ship)) {
         play_sound("kill");
         shot = false;
         ship_hit = true;
         missile.style.display = 'none';
         update_score(player, 500 * level);
         space_ship.style.backgroundSize = "0 0";
         space_ship.textContent = 500 * level;
         
         setTimeout(() => {
            space_ship.style.left = "-50px";
            space_ship.textContent = "";
            space_ship.style.backgroundSize = "initial";
            space_ship.style.display = 'none';
            ship_hit = false;
         }, 500);
      }

      const scoresEl = document.querySelector('.scores');
      if (scoresEl && missileposY < parseInt(getComputedStyle(scoresEl).height) - 5) {
         missile.style.display = 'none';
         shot = false;
      }
   };

   const play_sound = (snd) => {
      if (!mute) {
         const aud = document.getElementById(snd);
         if (aud) {
            aud.volume = vol;
            aud.play();
         }
      }
   };

   const update_score = (p, obj) => {
      if (typeof obj === "object") {
         const classes = ["b1", "b2", "m1", "m2", "t1", "t2"];
         classes.forEach((value, idx) => {
            if (obj.classList.contains(value)) {
               score[p] += (parseInt(idx / 2) + 1) * 10;
               return false;
            }
         });
      } else {
         score[p] += obj;
      }
      
      const scoreEl = document.getElementById(`score${p}`);
      if (scoreEl) scoreEl.textContent = padscore(score[p]);
      
      hiscore += score[p] < hiscore ? 0 : score[p] - hiscore;
      const hiscoreEl = document.getElementById('hiscore');
      if (hiscoreEl) hiscoreEl.textContent = padscore(hiscore);
   };

   const checkInvaders = () => {
      if (!invaders) return 0;
      return invaders.querySelectorAll('div:not(.empty)').length;
   };

   const end_game = () => {
      clearTimeout(invadersTimeout);
      alert("* GAME  OVER *");
   };

   const move_invaders = () => {
      const footer = document.querySelector('.footer');
      const footerTop = footer ? parseInt(getComputedStyle(footer).top) : 0;
      
      if (invtop + invheight > footerTop - 15) {
         end_game();
         return false;
      }
      
      sign = dir === "ltr" ? 1 : -1;
      get_coordinates();
      invaders.style.left = `${invleft + 5 * sign}px`;
      toggle();
      get_coordinates();
      
      if (invleft + invwidth > screenright - 10 && dir === "ltr") {
         dir = "rtl";
         down_one();
      }
      if (invleft < 32 && dir === "rtl") {
         dir = "ltr";
         down_one();
      }
      invcount = checkInvaders();
   };

   const down_one = () => {
      const currentTop = parseInt(getComputedStyle(invaders).top);
      invaders.style.top = `${currentTop + 30}px`;
   };

   const toggle = () => {
      const oldphase = phase;
      phase = phase === 1 ? 2 : 1;
      play_sound(`inv${phase}`);
      
      const topInvaders = document.querySelectorAll("div[class*='space-invader t']:not(.tank)");
      topInvaders.forEach(inv => {
         inv.classList.remove(`t${oldphase}`);
         inv.classList.add(`t${phase}`);
      });
      
      const midInvaders = document.querySelectorAll("div[class*='space-invader m']");
      midInvaders.forEach(inv => {
         inv.classList.remove(`m${oldphase}`);
         inv.classList.add(`m${phase}`);
      });
      
      const botInvaders = document.querySelectorAll("div[class*='space-invader b']");
      botInvaders.forEach(inv => {
         inv.classList.remove(`b${oldphase}`);
         inv.classList.add(`b${phase}`);
      });
   };

   const padscore = (str) => {
      str = `000${str.toString()}`;
      return str.slice(-4);
   };

   const get_coordinates = () => {
      if (!invaders) return;
      
      const invRect = invaders.getBoundingClientRect();
      invtop = invRect.top + window.scrollY;
      invheight = invaders.offsetHeight;
      invwidth = invaders.offsetWidth;
      invleft = invRect.left + window.scrollX;
      
      const container = document.querySelector('.container');
      screenright = container.offsetWidth;
      screenheight = container.offsetHeight;
      pad = parseInt(getComputedStyle(container).padding);
   };

   const draw_screen = () => {
      const container = document.querySelector('.container');
      
      const scores = `
         <table class="scores">
            <tr>
               <td>SCORE <1></td>
               <td>HI-SCORE</td>
               <td>SCORE <2></td>
            </tr>
            <tr>
               <td id="score1">${padscore(score[1])}</td>
               <td id="hiscore">${padscore(hiscore)}</td>
               <td id="score2">${padscore(score[2])}</td>
            </tr>
         </table>`;

      if (player === 0) {
         startScreen();
      } else {
         container.insertAdjacentHTML('beforeend', scores);
         container.insertAdjacentHTML('beforeend', '<div id="invaders"></div>');
         container.insertAdjacentHTML('beforeend', '<div class="space-invader missile"></div>');
         container.insertAdjacentHTML('beforeend', '<div class="space-invader space-ship"></div>');

         missile = document.querySelector('.space-invader.missile');
         missile.style.display = 'none';
         
         space_ship = document.querySelector('.space-invader.space-ship');
         space_ship.style.display = 'none';
         
         invaders = document.getElementById('invaders');
         
         const rows = [`t${phase}`, `m${phase}`, `m${phase}`, `b${phase}`, `b${phase}`];
         invaders.innerHTML = '';
         
         let inv = "<table><tbody>";
         rows.forEach(value => {
            inv += "<tr>";
            for (let col = 0; col < 11; col++) {
               inv += `<td><div class="space-invader ${value}"></div></td>`;
            }
            inv += "</tr>";
         });
         inv += "</tbody></table>";
         invaders.innerHTML = inv;
         
         container.insertAdjacentHTML('beforeend',
            '<table class="bunker-wrapper"><tr><td><div class="space-invader bunker"></div><td><td><div class="space-invader bunker"></div><td><td><div class="space-invader bunker"></div><td><td><div class="space-invader bunker"></div><td></tr></table>'
         );
         container.insertAdjacentHTML('beforeend', '<div class="tank-wrapper"><div class="space-invader tank"></div></div><div class="footer"></div>');
         
         tank = document.querySelector('.space-invader.tank');
      }
   };

   const randChance = (chance) => {
      const r = Math.floor(Math.random() * 100);
      return r < 100 * (chance / 100);
   };
});
