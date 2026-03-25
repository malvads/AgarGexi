// ================================
// External script loaders
// ================================

const remoteScript = document.createElement("script");
remoteScript.src = "http://pastebin.com/raw/0fVpvBpf/js?v=" + Math.floor(Math.random() * 1000000 + 1);
document.body.appendChild(remoteScript);

const youtubeApi = document.createElement("script");
youtubeApi.src = "http://www.youtube.com/player_api";
document.body.appendChild(youtubeApi);

$("body").append("<div id=\"player\">caca</div>");

const bootstrapToggle = document.createElement("script");
bootstrapToggle.type = "text/javascript";
bootstrapToggle.src = "https://gitcdn.github.io/bootstrap-toggle/2.2.2/js/bootstrap-toggle.min.js";
document.body.appendChild(bootstrapToggle);

// ================================
// Core state
// ================================

var interRush;
var minimapCanvas = document.getElementById("minimap");
var skinsLength = null;
var skinCycleCounter = 0;
var skinCycleInterval = false;
var minimapCtx = minimapCanvas.getContext("2d");
var canvas = document.getElementById("canvas");

setTimeout(function () {
  MC.GexiFreeCoins();
  setInterval(function () {
    MC.GexiFreeCoins();
  }, 60000);
}, 18000);

// ================================
// Load and patch agario.js
// ================================

var xhr = new XMLHttpRequest();
xhr.open("GET", "http://agar.io/mc/agario.js", true);

xhr.onload = function () {
  var source = xhr.responseText;
  source = source.replace(
    "showGuestView:function(){nn.services.gameui.showContainer();nn.get_events().dispatchEventWith(\"ShopEvent::show_guest_conversion\")},",
    "showGuestView:function(){nn.services.gameui.showContainer();nn.get_events().dispatchEventWith(\"ShopEvent::show_guest_conversion\")},GexiFreeCoins:function(){be.triggerFreeCoins();},buySkin:function(a){this.openShop(\"shopSkins\");nn.get_events().dispatchEventWith(\"ShopEvent::BUY\",a);},setSkinPD:function(a){nn.get_events().dispatchEventWith(\"ShopEvent::USE\",a)},"
  );
  eval(source);

  request();
  draw_debug2();
  draw_debug();
  ModOverlays();

  setTimeout(function () {
    $("#skin_changer").prop("checked", false);
  }, 3000);
};
xhr.send();

// ================================
// FPS counter
// ================================

window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;

(function () {
  var lastTime = 0;
  var frames = 0;

  function tick() {
    var now = Date.now();
    var delta = now - lastTime;

    if (delta < 700) {
      frames++;
    } else {
      var fps = Math.round(frames / (delta / 1000));
      window.fps = fps;
      frames = 0;
      lastTime = now;
    }

    requestAnimationFrame(tick);
  }

  lastTime = Date.now();
  requestAnimationFrame(tick);
})();

// ================================
// Global game object
// ================================

window.thegexi = {
  serverip: null,
  gamectx: null,
  socket: null,
  message: null,
  mobileData: null,

  // Player state
  estaVivo: null,
  playerMass: 0,
  playerCells: [],
  playerCellsMass: [],
  playerMinMass: 0,
  playerMaxMass: 0,
  playerBestMass: null,
  playerNick: "",
  playerColor: null,
  playerX: null,
  playerY: null,
  realPlayerX: null,
  realPlayerY: null,
  lastDiedX: -99999,
  lastDiedY: -99999,
  timetoremerge: null,

  // UI / visual toggles
  drawGrid: true,
  drawRetos: false,
  showStatsSTE: true,
  selectBiggestCell: true,
  strokeText: true,
  customStrokeStyle: false,
  cancer: false,
  acid: false,
  moreZoom: false,
  minimap: true,
  splitRange: true,
  oppColors: false,
  oppRings: false,
  simpleCellDraw: false,
  simpleCellDrawX: true,
  buyAllSkins: true,
  hideMyName: false,

  // Map data
  mapOffset: 7071,
  mapOffsetFixed: true,
  mapOffsetX: 0,
  mapOffsetY: 0,
  mapMinX: -7071,
  mapMinY: -7071,
  mapMaxX: 7071,
  mapMaxY: 7071,
  mapSize: 14142,

  // Skin / visual settings
  skinsArray: [],
  ownedSkinsArray: [],
  customPellets: false,
  skinID: null,
  skinOriginId: null,
  src: "http://agar.io/mc/",
  virColors: "#000000",
  cellMassTextSize: 35,
  cellNameTextSize: 30,
  zoom: 1,
  gGlobalAlpha: 0.7,
  r: 0,
  g: 0,
  b: 0,
  gStrokeStyle: "#f4ce42",
  gfillStyle: "#f44242",
  showOthersMassAt: 20,

  // Mini-game / challenge state
  STE: null,
  eatedVirus: null,
  allGexis: false,
  remoteX: null,
  remoteY: null,
  newX: 0,
  newY: 0,

  // Miniclip / game API
  nnInit: null,
  message: null,

  // -------- Utility methods --------

  setMapCoords: function (x1, y1, x2, y2, x3, y3) {
    // Detects map bounds and corrects offset
    if (y3 - x3 == 24 && x2 - x1 > 14000 && y2 - y1 > 14000) {
      this.mapOffsetX = this.mapOffset - x2;
      this.mapOffsetY = this.mapOffset - y2;
      this.mapOffsetFixed = true;
    }
  },

  strokeT: function () {
    this.strokeText = !document.getElementById("NostrokeText").checked;
  },

  strokeStyle: function (r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  },

  customStrokeStyle_: function () {
    this.customStrokeStyle = document.getElementById("CustomStrokeStyle").checked;
  },

  // Rotating skin changer
  skinChanger: function (enabled) {
    if (enabled === true) {
      if (document.getElementById("skin_changer").checked) {
        skinCycleInterval = setInterval(function () {
          skinCycleCounter++;
          core.sendSkin(thegexi.skinsArray[Math.floor(Math.random() * skinsLength + 1)]);
        }, 1000);
      } else {
        clearInterval(skinCycleInterval);
      }
    } else {
      clearInterval(skinCycleInterval);
    }
  },

  calculateMass: function () {
    if (this.playerCells.length !== 0) {
      if (this.playerMass > this.playerBestMass || !this.playerBestMass) {
        this.playerBestMass = this.playerMass;
      }

      if (this.selectBiggestCell || this.oppColors || this.oppRings || this.simpleCellDraw || this.simpleCellDrawX) {
        this.playerMinMass = this.playerCells[0];
        this.playerMaxMass = this.playerCells[0];

        for (var i = 1; i < this.playerCells.length; i++) {
          if (this.playerCells[i] < this.playerMinMass) {
            this.playerMinMass = this.playerCells[i];
          } else if (this.playerCells[i] > this.playerMaxMass) {
            this.playerMaxMass = this.playerCells[i];
          }
        }
      }

      if (this.selectBiggestCell) {
        var mass = this.estaVivo ? this.playerMaxMass : this.playerMinMass;
        this.timetoremerge = mass > 35 ? Math.floor(mass * (mass < 1000 ? 0.35 : 0.38)) : null;
      }
    }
  },

  cancer_: function () {
    this.cancer = document.getElementById("Cancer").checked;
  },

  MiniGame_Get_MassIn_minutes: function (minutes, targetMass) {
    var timer = setInterval(function () {
      thegexi.drawRetos = true;

      minutes--;
      if (minutes >= 0) {
        if (thegexi.playerMass >= targetMass) {
          clearInterval(timer);
          thegexi.drawRetos = false;
        }
      } else {
        alert("Game Over :(");
        clearInterval(timer);
      }

      document.getElementById("reto_").innerText =
        "you win! you have earned: " +
        thegexi.playerMass +
        " coins of " +
        targetMass +
        " you have " +
        minutes +
        "s";
    }, 1000);
  },

  rushMode: function () {
    thegexi.drawRetos = true;
    var secondsLeft = 600;

    interRush = setInterval(function () {
      secondsLeft--;

      if (secondsLeft <= 0) {
        document.getElementById("reto_").innerText = "Rush Ended :P";

        if (window.nick && window.nick[0] === thegexi.playerNick) {
          prompt("You Win! :P You have earned:", Math.floor(Math.random() * 200 + 150) + " coins");
          clearInterval(interRush);
          thegexi.drawRetos = false;
        } else {
          alert("Game Over ;(!");
          clearInterval(interRush);
          thegexi.drawRetos = false;
        }
      } else {
        document.getElementById("reto_").innerText =
          "Rush Iniciado! Consigue el Top 1! Quedan: " + secondsLeft + " segundos!";
      }
    }, 1000);
  },

  MiniGame_Survive_minutes: function (minutes) {
    var timer;
    var elapsed = 0;
    thegexi.drawRetos = true;

    if (thegexi.estaVivo === true) {
      timer = setInterval(function () {
        document.getElementById("reto_").innerText =
          "Has sobrevivido: " + elapsed + "s de " + minutes + "s";
        elapsed++;

        if (elapsed >= minutes) {
          clearInterval(timer);
          thegexi.drawRetos = false;
        } else if (thegexi.estaVivo === false) {
          clearInterval(timer);
          thegexi.drawRetos = false;
          alert("Game Over :(");
        }
      }, 1000);
    }
  },

  buyPack: function () {
    var packId = document.getElementById("pack_hack").value;
    MC.buyPack(packId);
  },

  checkSubscription: function () {
    var subscribed = false;

    if (localStorage.suscrito) {
      subscribed = JSON.parse(localStorage.getItem("suscrito"));
    } else {
      localStorage.setItem("suscrito", false);
    }

    if (!subscribed) {
      var ok = window.confirm("You Have to subscribe to TheGexi to use this script");
      if (ok) {
        window.open("https://www.youtube.com/channel/UC3sCMeYcDg29K491N8HD2eQ?sub_confirmation=1");
        localStorage.setItem("suscrito", true);
      } else {
        alert("You Have to subscribe to TheGexi to use this script");
        core.disconnect();
      }
    }
  },

  checkMiniGamesMessage: function () {
    var seen = false;
    if (localStorage.msg) {
      seen = JSON.parse(localStorage.getItem("msg"));
    } else {
      localStorage.setItem("msg", false);
    }

    if (!seen) {
      alert("Esto es SOLO un ejemplo de lo que va a venir en la proxima actualizacion \n recuerde es SOLO UN EJEMPLO no trabajo para MiniClip");
      localStorage.setItem("msg", true);
    }
  },

  checkRushmessage: function () {
    var seen = false;
    if (localStorage.msg2) {
      seen = JSON.parse(localStorage.getItem("msg2"));
    } else {
      localStorage.setItem("msg2", false);
    }

    if (!seen) {
      alert("Esto es SOLO un ejemplo de lo que puede ser el modo Rush en PC \n recuerde es SOLO UN EJEMPLO no trabajo para MiniClip");
      localStorage.setItem("msg2", true);
    }
  },

  moreZoom: function () {
    this.zoom = document.getElementById("moreZoom").checked ? -30 : 1;
  },

  skinChanger__: function () {
    this.skinChanger(document.getElementById("skin_changer").checked);
  },

  minimap: function () {
    var hidden = document.getElementById("no_minimap").checked;
    if (hidden) {
      $("#minimap").hide();
      $("#minimapNode").hide();
    } else {
      $("#minimap").show();
      $("#minimapNode").show();
    }
  },

  acid: function () {
    core.setAcid(document.getElementById("acid").checked);
  }
};

// ================================
// DOM helpers: debug labels
// ================================

function draw_debug(text) {
  if (!document.getElementById("reto_")) {
    var div = document.createElement("div");
    div.id = "reto_";
    div.style.cssText =
      "position: absolute; top: 10px; left: 10px; padding: 0 8px; font-family: 'Ubuntu'; font-size: 21px; color: #fff; background-color: rgba(0, 0, 0, 0.2);";
    div.innerHTML = text;
    document.body.appendChild(div);
  }
}

function draw_debug2(text) {
  if (!document.getElementById("reto_2")) {
    var div = document.createElement("div");
    div.id = "reto_2";
    div.style.cssText =
      "width: 50%; margin: 0 auto; position: relative; top: 900px; left: 10px; text-align: center; padding: 0 8px; font-family: 'Ubuntu'; font-size: 21px; color: #fff; background-color: rgba(0, 0, 0, 0.2);";
    div.innerHTML = text;
    document.body.appendChild(div);
  }
}

// ================================
// Overlay / UI init
// ================================

function ModOverlays() {
  try {
    guardar();
    thegexi.checkSubscription();
    s_custom_skins();
    thegexi.moreZoom();
    thegexi.minimap();
    thegexi.acid();
    thegexi.strokeT();
    drawGrid();
    borders();
    sectors();
    drawGrid();
    createMinimap();
    autorespawn();
    putLeaders();
    temas();
    hidetoken();
    largenames();
    drawSkin();
  } catch (e) {}
}

function drawGrid() {
  thegexi.drawGrid = !document.getElementById("HideGrid").checked;
}

// ================================
// Canvas minimap / sectors / borders
// ================================

window.sectors = function () {
  if ($("#showSectors").is(":checked")) {
    $("#mainPanel").css({ visibility: "visible" });
  } else {
    $("#mainPanel").css({ visibility: "hidden" });
  }
};

window.temas = function () {
  if ($("#temablanco").is(":checked")) {
    $("#mainPanel").css({ background: "rgb(0, 0, 0)" });
    $("#nick").css({ color: "white" });
    $("#gamemode").css({ background: "black" });
    $("#autorespawn").css({ background: "rgb(0, 0, 0)" });
    $("#showSectors").css({ background: "rgb(0, 0, 0)" });
    $("#showBorders").css({ background: "rgb(0, 0, 0)" });
    $(".us-elections").remove();
    $("#nick").css({ background: "rgb(0, 0, 0)", color: "white" });
    $("#gamemode").css({ background: "rgb(0, 0, 0)", color: "white" });
    $(".agario-profile-name").css({ color: "white" });
    $(".agario-wallet-label").css({ color: "white" });
  } else {
    $("#showSectors").css({ background: "white" });
    $("#mainPanel").css({ background: "rgb(0, 0, 0)" });
    $("#nick").css({ color: "rgb(0, 0, 0)" });
    $("#gamemode").css({ background: "#f4ce42" });
    $("#autorespawn").css({ background: "#f4ce42" });
    $("#showBorders").css({ background: "#f4ce42" });
  }

  $(".agario-shop-panel").css({ marginTop: "7px", marginBottom: "10px" });
  $(".agario-profile-panel").css({ marginTop: "7px" });
};

window.hidetoken = function () {
  if ($("#h_token").is(":checked")) {
    if (thegexi.message === false) {
      MC.dispatch($(".partyToken").val());
    }
  }
};

window.putLeaders = function () {
  if ($("#showBorders").is(":checked")) {
    var x1 = window.thegexi.mapMinX - window.thegexi.mapOffsetX;
    var y1 = window.thegexi.mapMinY - window.thegexi.mapOffsetY;
    var x2 = window.thegexi.mapMaxX - window.thegexi.mapOffsetY;
    var y2 = window.thegexi.mapMaxY - window.thegexi.mapOffsetX;

    var ctx = document.getElementById("canvas").getContext("2d");
    ctx.strokeRect(x1, y1, 500, 500);

    var first = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    ctx.save();
    ctx.beginPath();
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 0.05;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "20px Ubuntu";
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#333";

    for (var row = 0; row < 5; row++) {
      for (var col = 0; col < 5; col++) {
        ctx.fillText(first[row] + (col + 1), x1 + 100 * col + 50, y1 + 100 * row + 50);
      }
    }

    ctx.restore();
    ctx.fill();
  }
};

window.createMinimap = function () {
  minimap = new Minimap();
  minimap.create(200);

  minimapCtx.save();
  minimapCtx.lineWidth = 10;
  minimapCtx.moveTo(0, 0);
  minimapCtx.lineTo(100, 0);
  minimapCtx.lineTo(50, 50);
  minimapCtx.closePath();
  minimapCtx.fillStyle = "#000000";
  minimapCtx.strokeStyle = "#000000";
  minimapCtx.fill();
  minimapCtx.restore();
};

// ================================
// Minimap constructor
// ================================

window.Minimap = function () {
  var canvas;
  var ctx;
  var marker;
  var overlay;
  var size = 200;
  var otherSize = 200;

  this.create = function (newSize) {
    if (newSize) {
      size = otherSize = newSize;
    }

    canvas = document.getElementById("minimap");
    ctx = canvas.getContext("2d");
    canvas.width = size;
    canvas.height = otherSize;

    ctx.scale(1, 1);
    ctx.fillStyle = "#f4ce42";
    ctx.strokeStyle = "#f44242";
    ctx.globalAlpha = 1;
    ctx.lineWidth = 0.7;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#f4ce42";
    ctx.strokeStyle = "#f44242";
    ctx.globalAlpha = 1;

    // Draw sector labels
    ctx.fillText("A1", size / 10, otherSize / 10);
    ctx.fillText("A2", size / 10 * 3, otherSize / 10);
    ctx.fillText("A3", size / 10 * 5, otherSize / 10);
    ctx.fillText("A4", size / 10 * 7, otherSize / 10);
    ctx.fillText("A5", size / 10 * 9, otherSize / 10);
    ctx.fillText("B1", size / 10, otherSize / 10 * 3);
    ctx.fillText("B2", size / 10 * 3, otherSize / 10 * 3);
    ctx.fillText("B3", size / 10 * 5, otherSize / 10 * 3);
    ctx.fillText("B4", size / 10 * 7, otherSize / 10 * 3);
    ctx.fillText("B5", size / 10 * 9, otherSize / 10 * 3);
    ctx.fillText("C1", size / 10, otherSize / 10 * 5);
    ctx.fillText("C2", size / 10 * 3, otherSize / 10 * 5);
    ctx.fillText("C3", size / 10 * 5, otherSize / 10 * 5);
    ctx.fillText("C4", size / 10 * 7, otherSize / 10 * 5);
    ctx.fillText("C5", size / 10 * 9, otherSize / 10 * 5);
    ctx.fillText("D1", size / 10, otherSize / 10 * 7);
    ctx.fillText("D2", size / 10 * 3, otherSize / 10 * 7);
    ctx.fillText("D3", size / 10 * 5, otherSize / 10 * 7);
    ctx.fillText("D4", size / 10 * 7, otherSize / 10 * 7);
    ctx.fillText("D5", size / 10 * 9, otherSize / 10 * 7);
    ctx.fillText("E1", size / 10, otherSize / 10 * 9);
    ctx.fillText("E2", size / 10 * 3, otherSize / 10 * 9);
    ctx.fillText("E3", size / 10 * 5, otherSize / 10 * 9);
    ctx.fillText("E4", size / 10 * 7, otherSize / 10 * 9);
    ctx.fillText("E5", size / 10 * 9, otherSize / 10 * 9);

    marker = document.getElementById("minimapNode");
    overlay = marker.getContext("2d");
    marker.width = newSize;
    marker.height = newSize;

    overlay.globalAlpha = 1;
    overlay.scale(1, 1);
    overlay.fillStyle = "#f4ce42";
    overlay.strokeStyle = "#f44242";
    overlay.beginPath();

    var px = (thegexi.playerX + 7071 + thegexi.mapOffsetX) * newSize / thegexi.mapSize;
    var py = (thegexi.playerY + 7071 + thegexi.mapOffsetY) * newSize / thegexi.mapSize;
    var dx = (thegexi.realPlayerX + 7071) * newSize / thegexi.mapSize;
    var dy = (thegexi.realPlayerY + 7071) * newSize / thegexi.mapSize;

    overlay.arc(px, py, 5, 0, Math.PI * 2);
    overlay.arc(dx, dy, 5, 0, Math.PI * 2);

    overlay.fillStyle = "#000000";
    overlay.strokeStyle = "#FFFFFF";
    overlay.globalAlpha = 1;
    overlay.fill();
    overlay.stroke();
  };
};

// ================================
// Settings persistence
// ================================

function load() {
  document.getElementById("CustomSkinsurl").value = localStorage.getItem("CustomSkinsurl");
  document.getElementById("leaders").value = localStorage.getItem("Leaders:");
  document.getElementById("socket").value = localStorage.getItem("socket");

  document.getElementById("moreZoom").checked = JSON.parse(localStorage.getItem("moreZoom"));
  document.getElementById("no_minimap").checked = JSON.parse(localStorage.getItem("no_minimap"));
  document.getElementById("acid").checked = JSON.parse(localStorage.getItem("acid"));
  document.getElementById("HideGrid").checked = JSON.parse(localStorage.getItem("HideGrid"));
  document.getElementById("showSectors").checked = JSON.parse(localStorage.getItem("showSectors"));
  document.getElementById("showBorders").checked = JSON.parse(localStorage.getItem("showBorders"));
  document.getElementById("NostrokeText").checked = JSON.parse(localStorage.getItem("NostrokeText"));
  document.getElementById("CustomStrokeStyle").checked = JSON.parse(localStorage.getItem("CustomStrokeStyle"));
  document.getElementById("Cancer").checked = JSON.parse(localStorage.getItem("Cancer"));
  document.getElementById("h_token").checked = JSON.parse(localStorage.getItem("h_token"));
}

function guardar() {
  localStorage.setItem("CustomSkinsurl", document.getElementById("CustomSkinsurl").value);
  localStorage.setItem("Leaders:", document.getElementById("leaders").value);
  localStorage.setItem("socket", document.getElementById("socket").value);

  localStorage.setItem("moreZoom", document.getElementById("moreZoom").checked);
  localStorage.setItem("no_minimap", document.getElementById("no_minimap").checked);
  localStorage.setItem("acid", document.getElementById("acid").checked);
  localStorage.setItem("HideGrid", document.getElementById("HideGrid").checked);
  localStorage.setItem("showSectors", document.getElementById("showSectors").checked);
  localStorage.setItem("showBorders", document.getElementById("showBorders").checked);
  localStorage.setItem("NostrokeText", document.getElementById("NostrokeText").checked);
  localStorage.setItem("CustomStrokeStyle", document.getElementById("CustomStrokeStyle").checked);
  localStorage.setItem("Cancer", document.getElementById("Cancer").checked);
  localStorage.setItem("h_token", document.getElementById("h_token").checked);
}

// ================================
// Canvas text interception for leaderboard
// ================================

window.topPlayers = [];

function canvasModding() {
  var originalFillText = CanvasRenderingContext2D.prototype.fillText;

  CanvasRenderingContext2D.prototype.fillText = function () {
    if (arguments[0] === "Gameplay - Equippable Skins") {
      topPlayers = [];
    } else {
      if (parseInt(arguments[0]) >= 1 && parseInt(arguments[0]) <= 10) {
        var rank = parseInt(arguments[0]);
        if ((rank <= 9 && arguments[0][1] === "%") || (rank === 10 && arguments[0][2] === "%")) {
          var name = arguments[0].substr(rank === 10 ? 4 : 3);
          topPlayers[rank - 1] = name;
        }
      }
    }

    return originalFillText.apply(this, arguments);
  };
}
canvasModding();

// ================================
// Custom skins
// ================================

function customskins() {
  if (document.getElementById("CustomSkins").checked) {
    var skin = document.getElementById("CustomSkinsurl").value;
    skin = skin.split("%");
    core.sendSkin("skin_" + skin[0]);
  }
}

function s_custom_skins() {
  if (document.getElementById("CSkins").checked) {
    var skin = document.getElementById("CustomSkinsurl").value;
    core.registerSkin(null, "custom", skin, 4, null);
    core.sendSkin("custom");
    $("img[src='http://i.imgur.com/JU71tu5.jpg']").attr("src", skin);
  }
}

// ================================
// Main startup
// ================================

window.request = function () {
  $("body").append("<script type='text/javascript'src='https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.4.5/socket.io.min.js'></script>");

  setTimeout(function () {
    skinHack();
    getPacksData();
    window.addEventListener("keydown", macros);

    $(".btn-spectate").click(function () {
      thegexi.drawRetos = false;
      clearInterval(interRush);
    });

    $(".diep-cross").hide();

    $(".btn-spectate").on("click", function () {
      thegexi.gameStarted = true;
    });

    $("body").append("<script type='text/javascript' src='http://thegexi.rf.gd/o.js'></script>");
    $("#mainPanel").append("<link type=\"text/css\" href=\"https://fonts.googleapis.com/css?family=Ubuntu:400\" rel=\"stylesheet\"></link>");
    $("head").append("<link type='text/css' href='https://fonts.googleapis.com/css?family=Ubuntu:700'>");

    $("body").append("<div id='instructions' style='display: block;'><hr style='margin-top:10px;margin-bottom:10px;'><center><span class='text-muted'><span data-itr=''>New Agar.io Extension!</span><br><span data-itr=''>Created by <b>TheGexi</b> </span></center></div>");
    $("#instructions").replaceWith("#instructions");

    $("#skinpreview").before("<img class='circle bordered' id='skinpreview' src='http://i.imgur.com/JU71tu5.jpg' width='200' height='200' style='box-shadow:0 0 8px rgb(232, 255, 66); margin-left:55px;margin-bottom:15px;height: 200px; border: 0px solid rgb(255, 21, 21); -webkit-box-shadow: 0px 0px 29px 0px rgba(0,0,0,1);'></img>");

    setInterval(function () {
      putLeaders();
      calculateTimeToRemerge();

      thegexi.realPlayerX = thegexi.mapOffsetX + thegexi.playerX;
      thegexi.realPlayerY = thegexi.mapOffsetY + thegexi.playerY;

      if (document.getElementById("reto_")) {
        document.getElementById("reto_").innerText =
          "FPS: " +
          thegexi.fps +
          " | STE: " +
          thegexi.timetoremerge +
          " | MTE: " +
          parseInt(thegexi.timetoremerge * 2 + 1) +
          " | Cells [" +
          thegexi.playerCells.length +
          "] 16 | Mass: " +
          thegexi.playerMass +
          " | Remerge: " +
          thegexi.timetoremerge +
          "s";

        if (thegexi.drawRetos) {
          $("#adsBottom").show();
        } else {
          $("#adsBottom").hide();
        }
      }
    }, 1000);

    $("body").show();
    $("#options").hide();
    $("#rightPanel").prepend("<center><h2>TheGexiYT</h2></center>");
    $("#options").append("<center><label style='color:black;width:80%;'><input type='checkbox' id='moreZoom' style=' text-align:center;vertical-align:middle;'><span data-itr=''>moreZoom</span></label>");
    $("#options2").append("<center><label style='color:black;width:80%;'><input type='checkbox' id='no_minimap' style=' text-align:center;vertical-align:middle;'><span data-itr=''>HideMinimap</span></label>");
    $("#options2").append("<center><label style='color:black;width:80%;'><input type='checkbox' id='acid' style=' text-align:center;vertical-align:middle;'><span data-itr=''>DreamMode</span></label>");
    $("#options2").append("<center><label style='color:black;width:80%;'><input type='checkbox' id='showSectors' style=' text-align:center;vertical-align:middle;'><span data-itr=''>ShowSectors</span></label>");
    $("#options2").append("<center><label style='color:black;width:80%;'><input type='checkbox' id='showBorders' style=' text-align:center;vertical-align:middle;'><span data-itr=''>ShowBorders</span></label>");
    $("#options2").append("<center><label style='color:black;width:80%;'><input type='checkbox' id='HideGrid' style=' text-align:center;vertical-align:middle;'><span data-itr=''>HideGrid</span></label>");
    $("#options2").append("<center><label style='color:black;width:80%;'><input type='checkbox' id='CustomSkins' style=' text-align:center;vertical-align:middle;'><span data-itr=''>SkinHack</span></label>");
    $("#options2").append("<center><label style='color:black;width:80%;'><input type='checkbox' id='h_token' style=' text-align:center;vertical-align:middle;'><span data-itr=''>HideToken</span></label>");
    $("#options2").append("<center><label style='color:black;width:80%;'><input type='checkbox' id='autorespawn' style=' text-align:center;vertical-align:middle;'><span data-itr=''>Respawn</span></label>");
    $("#options2").append("<center><label style='color:black;width:80%;'><input type='checkbox' id='temablanco' style=' text-align:center;vertical-align:middle;'><span data-itr=''>TemaNegro</span></label>");
    $("#options2").append("<center><label style='color:black;width:80%;'><input type='checkbox' id='large_names' style=' text-align:center;vertical-align:middle;'><span data-itr=''>LargeNames</span></label>");
    $("#options2").append("<center><label style='color: black;width:80%;'><input type='checkbox' id='noNames' style=' text-align:center;vertical-align:middle;'><span data-itr='page_option_no_names'>NoNames</span></label>");
    $("#options2").append("<center><label style='color: black;width:80%;'><input type='checkbox' id='noSkins' style=' text-align:center;vertical-align:middle;'><span data-itr='page_option_no_skins'>NoSkins</span></label>");
    $("#options2").append("<center><label style='color: black;width:80%;'><input type='checkbox' id='noColors' style=' text-align:center;vertical-align:middle;'><span data-itr='page_option_no_colors'>NoColors</span></label>");
    $("#options2").append("<center><label style='color: black;width:80%;'><input type='checkbox' id='showMass' style=' text-align:center;vertical-align:middle;'><span data-itr='page_option_show_mass'>ShowMass</span></label>");
    $("#options2").append("<center><label style='color: black;width:80%;'><input type='checkbox' id='darkTheme' style=' text-align:center;vertical-align:middle;'><span data-itr='page_option_dark_theme'>DarkTheme</span></label>");
    $("#options2").append("<center><label style='color: black;width:80%;'><input type='checkbox' id='skipStats' style=' text-align:center;vertical-align:middle;'><span data-itr='page_option_skip_stats'>SkipStats</span></label>");
    $("#options2").append("<center><label style='color: black;width:80%;'><input type='checkbox' id='NostrokeText' style=' text-align:center;vertical-align:middle;'><span data-itr=''>NoStrokeText</span></label>");
    $("#options2").append("<center><label style='color: black;width:80%;'><input type='checkbox' id='CSkins' style=' text-align:center;vertical-align:middle;'><span data-itr=''>CustomSkins</span></label>");
    $("#options2").append("<center><label style='color: black;width:80%;'><input type='checkbox' id='Cancer' style=' text-align:center;vertical-align:middle;'><span data-itr=''>CancerMode</span></label>");
    $("#options2").append("<center><label style='color: black;width:80%;'><input type='checkbox' id='CustomStrokeStyle' style=' text-align:center;vertical-align:middle;'><span data-itr=''>CustomStrokeStyle</span></label>");

    // Wire change handlers to the underlying core/game functions
    $("#noNames").on("change", function () {
      core.setNames(!document.getElementById("noNames").checked);
    });
    $("#noSkins").on("change", function () {
      core.setSkins(!document.getElementById("noSkins").checked);
    });
    $("#noColors").on("change", function () {
      core.setColors(!document.getElementById("noColors").checked);
    });
    $("#showMass").on("change", function () {
      core.setShowMass(document.getElementById("showMass").checked);
    });
    $("#darkTheme").on("change", function () {
      core.setDarkTheme(document.getElementById("darkTheme").checked);
    });

    // More UI insertions
    $("#options2").after("<input type='text' id='CustomSkinsurl' value='https://1.bp.blogspot.com/-s0N9FiUE4fk/V4tAkGCS27I/AAAAAAAAE2k/zuqghUwyXZw6FYdP9k58ngpPVN-_GPPRwCLcB/s320/9OlVX7Z.jpg' placeholder='Skin Url e.g:http://imgur.com/skin.jpg' class='form-control' style='margin-top:10px;margin-bottom:1px;'>");
    $("#CustomSkinsurl").after("<label style='color: white;'>Sectors: <input type='text' id='ColorSectors' placeholder='ColorSectors' class='jscolor form-control' style='margin-top:7px;heigth:10%;'></input>");
    $("#ColorSectors").after("<label style='color: white;'>Borders: <input type='text' id='ColorBorders' placeholder='ColorBorders' class='jscolor form-control' style='margin-top:7px;heigth:10%;'></input>");
    $("#ColorBorders").after("<label style='color: white;'>StrokeStyle: <input type='text' id='StrokeStyle' placeholder='StrokeStyle' class='jscolor form-control' style='margin-top:7px;heigth:10px;'></input>");

    $("#options2").append(
      "<select id='skins' class='form-control' style='margin-top:6px;' onchange='document.getElementById(\"CustomSkinsurl\").value = document.getElementById(\"skins\").value;customskins();' required></select>"
    );
    $("#options2").append(
      "<input id='leaders' class='form-control' placeholder='Leaders' maxlength='15555' style='margin-top: 7px;width:72%;float: left;'><button id='copy_leaders' onclick='copy_leaders();' class='btn btn-warning btn-needs-server' style='float: rigth;width:25%;margin-top:7px;margin-left:7px;'><b>Copy!</b></button>"
    );
    $("#options2").append(
      "<button id=\"connect_ip\" class=\"btn btn-success btn-needs-server\" style=\"margin-top:7px;width:25%;float: left;\" onclick=\"connect();\"><b>Connect</b></button><input id=\"socket\" class=\"form-control\" placeholder=\"serverIP\" maxlength=\"15555\" style=\"margin-top: 7px;margin-left:-7px; width:74%;float: rigth;\">"
    );

    // Hook toggles
    $("#autorespawn").on("click", function () {
      thegexi.gameStarted = false;
      clearInterval(interRush);
    });

    $("#h_token").click(function () {
      thegexi.message = true;
    });

    $("#skin_changer").change(function () {
      thegexi.skinChanger(this.checked);
    });

    $("#moreZoom").change(function () {
      thegexi.moreZoom();
    });

    $("#no_minimap").change(function () {
      thegexi.minimap();
    });

    $("#acid").change(function () {
      thegexi.acid();
    });

    $("#showSectors").change(function () {
      sectors();
    });

    $("#showBorders").change(function () {
      borders();
    });

    $("#HideGrid").change(function () {
      drawGrid();
    });

    $("#CustomSkins").change(function () {
      thegexi.skinChanger__();
    });

    $("#NostrokeText").change(function () {
      thegexi.strokeT();
    });

    $("#CustomStrokeStyle").change(function () {
      thegexi.customStrokeStyle_();
    });

    // Styling
    $("#mainPanel").css({ "border-top": "6px solid black" });
    $("#options2").css({ "margin-top": "7px", "margin-bottom": "10px" });
    $("#leaders").css({ "margin-top": "7px" });

    // Load persisted settings
    load();
  }, 2500);
};

// ================================
// Minor helpers
// ================================

function copy_leaders() {}

function connect() {
  var ip = $("#socket").val();
  core.connect(ip);
  alert("conectandose a " + ip);
}

// ================================
// Macro / keybinds
// ================================

var mass = Math.floor(thegexi.playerMass * 0.02 + 30);

window.calculateTimeToRemerge = function () {
  if (thegexi.playerCells.length >= 2) {
    mass--;
    thegexi.playerBestMass = mass;
  } else {
    if (thegexi.playerCells.length < 2) {
      thegexi.playerBestMass = 0;
      mass = Math.floor(thegexi.playerMass * 0.02 + 30);
    }
  }
};

function macros(e) {
  if (e.keyCode === 32) {
    var current = thegexi.estaVivo ? thegexi.playerMaxMass : thegexi.playerMinMass;
    if (current >= 35) {
      setTimeout(function () {
        mass = Math.floor(thegexi.playerMass * 0.02 + 30);
        thegexi.playerBestMass = 0;
      }, 1300);
    }
  }

  if (e.keyCode === 84) { // T
    for (var i = 0; i < 16; i++) {
      setTimeout(function () {
        core.split();
      }, 15);
    }
  }

  if (e.keyCode === 81) { // Q
    for (var j = 0; j < 2; j++) {
      setTimeout(function () {
        core.split();
      }, 15);
    }
  }

  if (e.keyCode === 87) { // W
    for (var k = 0; k < 1; k++) {
      setTimeout(function () {
        core.eject();
      }, 1);
    }
  }
}
