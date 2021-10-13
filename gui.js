HTMLElement.prototype.isDecendant = function(parent)	{
	if (this == parent)	{
		return true;
	}
	else {
		let thisParent = this;
		while((thisParent = thisParent.parentNode) != null)	{
			if (thisParent == parent)	{
				return true;
			}
		}
		return false;
	}
}

let Gui = function(el)  {

  //PROPERTIES

  this.el = el;
  this.mainMenu = el.querySelector("#main-menu");
  this.nicknameInput = el.querySelector("input#nickname");
  this.settingsWindow = el.querySelector("#settings-shadow");
  this.gameUI = el.querySelector("#game-ui");
  this.inGameMenu = el.querySelector("#in-game-menu-shadow");
  this.massCounter = this.gameUI.querySelector("#mass > .data-field");
  this.gameControls = this.gameUI.querySelector("#container-game-controls");

  this.joystick = {
    base: this.gameUI.querySelector("#joystick-base"),
    handle: this.gameUI.querySelector("#joystick"),
  };
  this.joystick.radius = this.joystick.base.offsetWidth / 2;

  //BUTTONS

  this.buttons = {
    split: this.gameUI.querySelector("#split"),
    eject: this.gameUI.querySelector("#eject"),

    play: {
      el: el.querySelector("button#play"),
      click: function()  {
        if (typeof game != "object" || game.paused) {
          game = new Game();
		  game.player.nickname = gui.nicknameInput.value;
          game.initialize();
        }
        gui.switchVisibility("mainMenu", "hide");
        if ("ontouchstart" in document.documentElement)  {
          switchFullscreen("open");
        }
        setTimeout(function()  {
          setFocus({target: gui.getContainer(gui.gameUI)});
        }, 10);
      }
    },

    openSettings: {
      el: el.querySelector("#open-settings1"),
      click: function()  {
        gui.switchVisibility("settingsWindow", "show");
      }
    },

    openSettingsInGame:  {
      el: el.querySelector("#in-game-open-settings"),
      click: function()  {
        gui.switchVisibility("settingsWindow", "show");
      }
    },

    closeSettings:  {
      el: el.querySelector("#close-settings"),
      click: function()  {
        gui.switchVisibility("settingsWindow", "hide");
      }
    },

    openInGameMenu:  {
      el: el.querySelector("#open-in-game-menu"),
      click: function()  {
		if (typeof game == "object")	{
			setMousePos(game.canvas.styleWidth / 2, game.canvas.styleHeight / 2);
		}
        gui.switchVisibility("inGameMenu");
		if (!gui.inGameMenu.classList.contains("visible")) {
			document.activeElement.blur();
			setTimeout(function()  {setFocus({target: gui.getContainer(gui.gameUI)});}, 30);
		}
      }
    },

	returnToGame:	{
		el: el.querySelector("#return-to-game"),
		click: function()	{
			document.activeElement.blur();
			setTimeout(function()  {setFocus({target: gui.getContainer(gui.gameUI)});}, 30);
			gui.switchVisibility("inGameMenu", "hide");
		}
	},

    switchFullScreen:  {
      el: el.querySelector("#switch-fullscreen"),
      click: function()  {
        switchFullscreen("switch");
      }
    },

    exitGame:  {
      el: el.querySelector("#exit-game"),
      click: function()  {
		game.pause();
		gui.switchVisibility("mainMenu", "show");
		gui.switchVisibility("inGameMenu", "hide");
		this.el.blur();
		focusedElement = gui.mainMenu;
      }
    }
  };

  //CHECKBOXES

  this.checkboxes = {
    darkmode: {
      label: el.querySelector("#enable-dark-mode-label"),
      box: el.querySelector("input#enable-dark-mode"),
      click: function()  {
        gui.darkMode = this.box.checked;
        if (this.box.checked)  {
          el.classList.add("dark-mode");
        } else  {
          el.classList.remove("dark-mode");
        }
      }
    },
  };

  //METHODS

  this.resize = function(width = window.innerWidth, height = window.innerHeight)  {
    this.el.style.width = (this.width = width) + "px";
    this.el.style.height = (this.height = height) + "px";
  };

 	this.switchVisibility = function(element, command = "switch")  {
		if (typeof element == "string")	{
			element = this[element];
		}
		if (command == "switch") {
		  command = element.classList.contains("visible") ? "hide" : "show";
		}
		if (command == "show")  {
		  element.classList.add("visible");
		}  else  {
		  element.classList.remove("visible");
		}
  };

  this.getContainer = function(element)  {
    return element.getElementsByClassName("relative-container")[0];
  };

  this.resize();
}

let gui = new Gui(document.getElementById("gui"));



//GUI EVENTS

let focusedElement;
let setFocus = function(event) {
  focusedElement = event.target;
}
document.addEventListener("click", setFocus);


gui.el.addEventListener("click", function(event)  {
  if (button = Object.keys(gui.buttons).find(button => gui.buttons[button].el == event.target))  {
    gui.buttons[button].click();
  }
  else if ((checkbox = Object.keys(gui.checkboxes).find(
    checkbox => event.path.find(
      el => el == gui.checkboxes[checkbox].label
    ) + 1
  )) && event.target.nodeName == "INPUT")  {
    gui.checkboxes[checkbox].click();
  }
});



//GAME CONTROL


let setMousePos = function(clientX, clientY)  {
	if (gameObjInitialized)  {
		game.setMousePosition(
			clientX * game.canvas.width / game.canvas.styleWidth,
			clientY * game.canvas.height / game.canvas.styleHeight);
	}
}

gui.gameUI.addEventListener("mousemove", function(event) {
  if (event.target == gui.getContainer(gui.gameUI))  {
    setMousePos(event.clientX, event.clientY);
  }
});

//KEYBOARD

document.addEventListener("keypress", function(event) {
	if (focusedElement == gui.getContainer(gui.gameUI))  {
		if (event.key == " ") {
			game.player.split();
		}
		else if (event.key == "w" || event.key == "W")  {
			game.player.ejectMass();
		}
	}
});

document.addEventListener("keyup", function(event)  {
	if (event.key == "Escape" && !gui.mainMenu.classList.contains("visible"))	{
		if (gui.settingsWindow.classList.contains("visible"))	{
			gui.switchVisibility("settingsWindow", "hide");
		}	else {
			gui.buttons.openInGameMenu.click();
		}
	}
});

//MOVE JOYSTICK FUNCTION

let moveJoystick = function(x, y)  {
  let relativeX = x - gui.joystick.x;
  let relativeY = y - gui.joystick.y;
  let distance = Math.sqrt(Math.pow(relativeX, 2) + Math.pow(relativeY, 2));
  distance = Math.max(1, distance);
  let xFactor = relativeX / distance;
  let yFactor = relativeY / distance;
  let fixedDistance = Math.min(distance, gui.joystick.radius);
  let left = xFactor * fixedDistance;
  let top = yFactor * fixedDistance;
  gui.joystick.handle.style.left = left + "px";
  gui.joystick.handle.style.top = top + "px";
  let avgSize = (canvas.styleWidth + canvas.styleHeight) / 2;
  setMousePos(canvas.styleWidth / 2 + left * avgSize / 40,
              canvas.styleHeight / 2 + top * avgSize / 40);
}

//SHOW AND SET MOBILE BUTTONS IF TOUCH IS IN DOCUMENT

if ("ontouchstart" in document.documentElement)  {
  gui.switchVisibility("gameControls", "show");
  gui.buttons.openInGameMenu.el.style.display = "";

  gui.gameUI.addEventListener("touchstart", function(event) {
    if (event.target == gui.getContainer(gui.gameUI))  {
      event.preventDefault();
      gui.joystick.x = event.touches[0].clientX;
      gui.joystick.y = event.touches[0].clientY;
      gui.joystick.base.style.left = gui.joystick.x + "px";
      gui.joystick.base.style.top = gui.joystick.y + "px";
      gui.joystick.base.classList.add("visible");
      moveJoystick(event.touches[0].clientX, event.touches[0].clientY);
    }
  });
  gui.gameUI.addEventListener("touchmove", function(event) {
    if (event.target == gui.getContainer(gui.gameUI))  {
      moveJoystick(event.touches[0].clientX, event.touches[0].clientY);
    }
  });
  gui.gameUI.addEventListener("touchend", function(event)  {
    if (event.target == gui.getContainer(gui.gameUI))  {
      if (event.touches.length == 0)  {
        gui.joystick.base.classList.remove("visible");
        setMousePos(canvas.styleWidth / 2, canvas.styleHeight / 2);
      }
    }
  });
  gui.buttons.split.addEventListener("touchstart", function()  {
    gui.buttons.split.classList.add("touching");
    game.player.split();
  });
  gui.buttons.eject.addEventListener("touchstart", function()  {
    gui.buttons.eject.classList.add("touching");
    game.player.ejectMass();
  })
  gui.buttons.split.addEventListener("touchend", function()  {
    gui.buttons.split.classList.remove("touching");
  });
  gui.buttons.eject.addEventListener("touchend", function()  {
    gui.buttons.eject.classList.remove("touching");
  })
}


//WINDOW RESIZE

window.addEventListener("resize", function()  {
	let rePositionMouse = false;
	if (typeof game == "object"
		&& game.mouse.x == game.canvas.width / 2
		&& game.mouse.y == game.canvas.height / 2)	{
		rePositionMouse = true;
	}
	canvas.resize();
	gui.resize();

	if (rePositionMouse)	{
		setMousePos(game.canvas.styleWidth / 2, game.canvas.styleHeight / 2);
	}
});



//============ FULLSCREEN ===============

function switchFullscreen(todo = "switch") {
  if ((document.fullscreenElement || document.webkitFullscreenElement ||
    document.mozFullScreenElement) && todo != "open")  {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
  }
  else if (todo != "exit")  {
    elem = document.body;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  }
}
