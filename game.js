$(document).ready(function() {
    var gp = navigator.getGamepads()[0];
    var invaders,
        level = 1,
        phase = 1,
        dir = 'ltr',
        delay = 10,
        screenright = 578,
        screenheight = 620,
        pad,
        ship_hit, timeout, shot, invtop, invheight, invwidth, invleft, sign, mute = false,
        hiscore = 500,
        vol = 0.5,
        missileposY = 0,
        tankpos = 100,

        player = 0,
        playerNo = 1,
        tank,
        score = [];
    score[1] = 0;
    score[2] = 0;

    set_sounds();
    set_css();
    draw_screen();
    if (invaders) {
        get_coordinates();
        var invcount = checkInvaders();
    }

    $(window).resize(function() {
        get_coordinates();
    });

    var keys = {};

    $(document).keydown(function(e) {
        keys[e.which] = true;
        processKeys(keys);
    });

    $(document).keyup(function(e) {
        delete keys[e.which];
    });

    // alert("HALT");

    // playGame();

    function startScreen() {
        $(".container").append("<div class='intro-text'>PLAY<br>SPACE&nbsp;&nbsp;&nbsp;&nbsp;INVADERS<br>* SCORE&nbsp;&nbsp;&nbsp;&nbsp;ADVANCE&nbsp;&nbsp;&nbsp;&nbsp;TABLE *<br><div class='space-invader space-ship on'></div>= ? MYSTERY<br><div class='space-invader t1'></div>= 30 POINTS<br><div class='space-invader m1'></div>= 20 POINTS<br><div class='space-invader b1'></div>= 10 POINTS<br><br>PUSH<br>1&nbsp;&nbsp;&nbsp;OR&nbsp;&nbsp;&nbsp;&nbsp;2&nbsp;&nbsp;&nbsp;&nbsp;PLAYERS&nbsp;&nbsp;&nbsp;&nbsp;BUTTON</div>");
    }

    function processKeys(keys) {
        if (keys) {
            $.each(keys, function(index, item) {
                switch (index) {
                    case '49':
                    case '50':
                        playGame(index - 48);
                        break;
                    case '37':
                        move_left();
                        break;
                    case '39':
                        move_right();
                        break;
                    case '17':
                        if (!shot) { // fire
                            shoot_missile();
                        }
                        break;
                    case '81':
                        mute = !mute;
                        break;
                    case '109':
                        if (vol > 0) { // Vol down
                            vol -= 0.05;
                        }
                        break;
                    case '107':
                        if (vol < 1) { // Vol up
                            vol += 0.05;
                        }
                        break;
                }
            });
        }
    }

    function playGame(plyr) {
        $('.intro-text').hide();
        player = 1;
        playerNo = plyr;
        draw_screen()
        window.setInterval(function() {
            if (shot) {
                move_missile();
            }
            move_spaceship();
        }, 10);

        timer = delay;

        var myFunction = function() {
            move_invaders();
            timer = delay * invcount;
            invadersTimeout = setTimeout(myFunction, timer);
        }
        setTimeout(myFunction, timer);     
    }

    function gamepad() {
        if (gp.buttons[3].pressed) {
            shoot_missile();
        }
        if (gp.axes[0] == -1) {
            move_left();
        }
        if (gp.axes[0] == 1) {
            move_right();
        }
    }

    function move_left() {
        if (tankpos > pad) { // left
            tankpos -= 5;
            tank.css('left', tankpos + 'px');
        }
    }

    function move_right() {
        if (tankpos < (screenright - pad - 44)) { // right
            tankpos += 5;
            tank.css('left', tankpos + 'px');
        }
    }

    function shoot_missile() {
        shot = true;
        missileposX = tankpos + 22;
        missileposY = parseInt($('.tank-wrapper').css('top'));
        play_sound('shoot');
        missile.css('top', missileposY + 'px');
        missile.css('left', missileposX + 'px');
        missile.show();
    }

    function checkcollision(div1, div2) {
        var x1 = div1.offset().left, y1 = div1.offset().top,
            h1 = div1.outerHeight(true), w1 = div1.outerWidth(true),
            x2 = div2.offset().left, y2 = div2.offset().top,
            h2 = div2.outerHeight(true), w2 = div2.outerWidth(true),
            b1 = y1 + h1, r1 = x1 + w1, b2 = y2 + h2, r2 = x2 + w2;
        return !(b1 < y2 || y1 > b2 || r1 < x2 || x1 > r2);
    }

    function trimTable() {
        // Check bottom row
        var btmRow = $("#invaders table tr:last-child");
        var width = btmRow.find("div").length;
        var empty = btmRow.find("div.empty").length;
        if (empty == width) { btmRow.remove(); }

        // Check left column row
        var check = true;
        $("#invaders table tr td:first-child").each(function() {
            if (!$(this).find("div").hasClass("empty")) {
                check = false;
                return false;
            }
        });

        if (check) {
            $("#invaders table tr td:first-child").each(function() {
                $(this).empty().remove();
            });
            var left = ($("#invaders").position().left + $("#invaders table td").width()) + 'px';
            $("#invaders").css('left', left);
        }

        // // Check right column row
        check = true;
        $("#invaders table tr td:last-child").each(function() {
            if (!$(this).find("div").hasClass("empty")) {
                check = false;
                return false;
            }
        });

        if (check) {
            $("#invaders table tr td:last-child").each(function() {
                $(this).empty().remove();
            });
        }
    }

    function move_spaceship() {
        if (!ship_hit) {
            if (space_ship.is(":hidden")) {
                rand =  Math.round(Math.random() * 500) + 1
                if (rand<2) {
                    space_ship.show();
                }
            } else {
                play_sound('ship1');
                currentPos = parseInt(space_ship.css('left'));
                currentPos += 1;
                space_ship.css('left', currentPos);
                if (currentPos > (screenright - 10)) {
                    space_ship.hide();
                    space_ship.css('left', '-50px');
                }
            }
        }
    }

    function move_missile() {
        missileposY -= 5;
        missile.css('top', missileposY + 'px');
        if (checkcollision(missile, invaders)) {
            $('#invaders .space-invader:not(".empty")').each(function() {
                if (checkcollision($(this), missile)) {
                    play_sound('kill');
                    td = $(this).parent('td');
                    td.html('<div class="space-invader explosion"></div>');
                    shot = false;
                    missile.hide();
                    update_score(player, $(this));
                    $(this).delay(100).queue(function() {
                        td.html('<div class="space-invader empty"></div>');
                        trimTable();
                        trimTable();
                        trimTable();
                        $(this).dequeue();
                    });
                    if (invcount == 0) {
                        end_game();
                        return false;
                    }
                }
            });
        }
        if (!missile.is(":hidden") && checkcollision(missile, space_ship)) {
            play_sound('kill');
            shot = false;
            ship_hit = true;
            missile.hide();
            update_score(player, 500*level);
            space_ship.css('background-size', '0 0');
            space_ship.text(500*level);
            space_ship.delay(500).queue(function() {
                space_ship.css('left', '-50px')
                space_ship.text('');
                space_ship.css('background-size', 'initial');
                space_ship.dequeue();
                space_ship.hide();
                ship_hit = false;
            }); 
        }

        if (missileposY < (parseInt($('.scores').height()) - 5)) {
            missile.hide();
            shot = false;
        }
    }

    function play_sound(snd) {
        if (!mute) {
            var aud = $('#' + snd)[0];
            $('#' + snd).prop("volume", vol);
            aud.play();
        }
    }

    function update_score(p, obj) {
        if (typeof obj == 'object') {
            $.each(['b1','b2','m1','m2','t1','t2'], function(idx, value) {
                if (obj.hasClass(value)) {
                    score[p] += (parseInt(idx / 2) + 1) * 10;
                    return false;
                }
            });
        } else {
            score[p] += obj; 
        }
        $('#score' + p).text(padscore(score[p]));
        hiscore += (score[p] < hiscore) ? 0 : (score[p] - hiscore);
        $('#hiscore').text(padscore(hiscore));
    }

    function checkInvaders() {
        return invaders.children('table').children('tbody').children('tr').children('td').children('div:not(".empty")').length;
    }

    function end_game() {
        clearTimeout(invadersTimeout);
        alert("* GAME  OVER *")

    }

    function move_invaders() {
        if ((invtop + invheight) > (parseInt($('.footer').css('top')) - 15)) {
            end_game();
            return false;
        }
        sign = (dir == 'ltr') ? 1 : -1;
        get_coordinates();
        invaders.css('left', invleft + (5 * sign) + 'px');
        toggle();
        get_coordinates();
        if ((invleft + invwidth) > (screenright - 10) && dir == 'ltr') {
            dir = 'rtl';
            down_one();
        }
        if (invleft < 32 && dir == 'rtl') {
            dir = 'ltr';
            down_one();
        }
        invcount = checkInvaders();
    }

    function down_one() {
        invaders.css('top', (parseInt(invaders.css('top')) + 30) + 'px');
    }

    function toggle() {
        var oldphase = phase;
        phase = (phase == 1) ? 2 : 1;
        play_sound('inv' + phase);
        $("div[class*='space-invader t']:not('.tank')").removeClass('t' + oldphase).addClass('t' + phase);
        $("div[class*='space-invader m']").removeClass('m' + oldphase).addClass('m' + phase);
        $("div[class*='space-invader b']").removeClass('b' + oldphase).addClass('b' + phase);
    }

    function padscore(str) {
        str = "000" + str.toString();
        return str.slice(-4);
    }

    function get_coordinates() {
        invtop = invaders.position().top;
        invheight = parseInt(invaders.height());
        invwidth = parseInt(invaders.width());
        invleft = invaders.position().left;
        screenright = $('.container').width();
        screenheight = $('.container').height();
        pad = parseInt($('.container').css('padding'));
    }

    function draw_screen() {

        var scores = '<table class="scores"><tr><td>SCORE <1></td><td>HI-SCORE</td><td>SCORE <2></td></tr><tr><td id="score1">' + padscore(score[1]) + '</td><td id="hiscore">' + padscore(hiscore) + '</td><td id="score2">' + padscore(score[2]) + '</td><tr></table>';
        
        if (player == 0) {
            startScreen();
        } else {
            $('.container').append(scores);
            $('.container').append('<div id="invaders"></div>');
            $('.container').append('<div class="space-invader missile"></div>');
            $('.container').append('<div class="space-invader space-ship"></div>');

            missile = $('.space-invader.missile').hide(),
            space_ship = $('.space-invader.space-ship').hide(),
            invaders = $('#invaders');
            var rows = ['t' + phase, 'm' + phase, 'm' + phase, 'b' + phase, 'b' + phase];
            invaders.empty();
            var inv = '<table><tbody>';
            $.each(rows, function(key, value) {
                inv += '<tr>';
                for (col = 0; col < 11; col++) {
                    inv += '<td><div class="space-invader ' + value + '"></div></td>';
                }
                inv += '</tr>';
            });
            inv += '</tbody></table>';
            invaders.html(inv);
            $('.container').append('<table class="bunker-wrapper"><tr><td><div class="space-invader bunker"></div><td><td><div class="space-invader bunker"></div><td><td><div class="space-invader bunker"></div><td><td><div class="space-invader bunker"></div><td></tr></table>');
            $('.container').append('<div class="tank-wrapper"><div class="space-invader tank"></div></div><div class="footer"></div>');
            tank = $('.space-invader.tank');
        }
    }

    function rand(chance) {
        var r = Math.floor(Math.random() * 100);
        return (r < 100 * (chance / 100));
    }

});