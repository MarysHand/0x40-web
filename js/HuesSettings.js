/* Copyright (c) 2015 William Toohey <will@mon.im>
 * Portions Copyright (c) 2015 Calvin Walton <calvin.walton@kepstin.ca>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

HuesSettings.prototype.defaultSettings = {
    // Debugging var, for loading zips or not
    load : true,
    // Debug, play first song automatically?
    autoplay : true,
    // If true, defaults passed in initialiser override locally saved
    overwriteLocal : false,
    // If set, will attempt to play the named song first
    firstSong: null,
    // If set, will attempt to set the named image first
    firstImage: null,
    // If set, will disable the remote resources menu. For custom pages.
    disableRemoteResources: false,
    // You will rarely want this. Disables the generated UI elements in the tab box
    noUI: false,
    // Whether to show the info window on page load
    showInfo: false,
    // Preloader customisation
    preloadPrefix: "0x",
    preloadBase: 16,
    preloadMax: 0x40,

    // UI accessible config
    smartAlign: "on",
    blurAmount: "medium",
    blurDecay: "fast",
    blurQuality: "medium",
    currentUI: "modern",
    colourSet: "normal",
    blackoutUI: "off",
    playBuildups: "on",
    visualiser: "off",
    shuffleImages: "on",
    autoSong: "off",
    autoSongDelay: 5, // loops or minutes depending on autoSong value
    autoSongShuffle: "on",
    autoSongFadeout: "on",
    trippyMode: "off",
    volume: 0.7
};

// Don't get saved to localStorage
HuesSettings.prototype.ephemeralSettings = [
    "load",
    "autoplay",
    "overwriteLocal",
    "respacks",
    "firstSong",
    "firstImage",
    "disableRemoteResources",
    "preloadPrefix",
    "preloadBase",
    "preloadMax",
    "noUI",
    "showInfo"
];

// To dynamically build the UI like the cool guy I am
HuesSettings.prototype.settingsCategories = {
    "Functionality" : [
        "autoSong",
        "autoSongShuffle",
        "autoSongFadeout",
        "playBuildups"
    ],
    "Graphics" : [
        "blurAmount",
        "blurDecay",
        "blurQuality",
        "trippyMode"
    ],
    "Visuals" : [
        "smartAlign",
        "shuffleImages",
        "colourSet",
        "visualiser"
    ],
    "Interface" : [
        "currentUI",
        "blackoutUI"
    ]
};

HuesSettings.prototype.settingsOptions = {
    smartAlign : {
        name : "Smart Align images",
        options : ["off", "on"]
    },
    blurAmount : {
        name : "Blur amount",
        options : ["low", "medium", "high"]
    },
    blurDecay : {
        name : "Blur decay",
        options : ["slow", "medium", "fast", "faster!"]
    },
    blurQuality : {
        name : "Blur quality",
        options : ["low", "medium", "high", "extreme"]
    },
    visualiser : {
        name : "Spectrum analyser",
        options : ["off", "on"]
    },
    currentUI : {
        name : "UI style",
        options : ["retro", "v4.20", "modern", "xmas", "hlwn"]
    },
    colourSet : {
        name : "Colour set",
        options : ["normal", "pastel", "v4.20"]
    },
    blackoutUI : {
        name : "Blackout affects UI",
        options : ["off", "on"]
    },
    playBuildups : {
        name : "Play buildups",
        options : ["off", "once", "on"]
    },
    autoSong : {
        name : "AutoSong",
        options : ["off", "loop", "time", 
            {type:"varText", text:function() {
                // only display if autosong is on
                return localStorage["autoSong"] == "off" ? "" : "after";
            }}, 
            {type:"input", variable:"autoSongDelay", inputType:"int",
                visiblity:function() {
                    return localStorage["autoSong"] != "off";
                }
            },
            {type:"varText", text:function() {
                var ret = "";
                switch(localStorage["autoSong"]) {
                    case "loop":
                        ret = "loop";
                        break;
                    case "time":
                        ret = "min";
                        break;
                    case "off":
                    default:
                        return "";
                }
                if(localStorage["autoSongDelay"] > 1) {
                    ret += "s";
                }
                return ret;
            }}
        ]
    },
    autoSongShuffle : {
        name : "AutoSong shuffle",
        options : ["off", "on"]
    },
    autoSongFadeout : {
        name : "AutoSong fade out",
        options : ["off", "on"]
    },
    trippyMode : {
        name : "Trippy Mode",
        options : ["off", "on"]
    },
    shuffleImages : {
        name : "Shuffle images",
        options : ["off", "on"]
    }
};

function HuesSettings(defaults) {
    this.core = null;
    this.hasUI = false;
    this.root = document.getElementById("huesSettings");
    this.window = document.getElementById("settingsHelper");
    
    this.textCallbacks = [];
    this.visCallbacks = [];

    for(var attr in this.defaultSettings) {
      if(this.defaultSettings.hasOwnProperty(attr)) {
          if(defaults[attr] === undefined) {
              defaults[attr] = this.defaultSettings[attr];
          }
          // don't write to local if it's a temp settings
          if(this.ephemeralSettings.indexOf(attr) != -1) {
              continue;
          }
          if(defaults.overwriteLocal) {
              localStorage[attr] = defaults[attr];
          }
          // populate defaults, ignoring current
          if(localStorage[attr] === undefined) {
              localStorage[attr] = defaults[attr];
          }
      }
    }

    this.defaults = defaults;
    
    if(this.defaults.showInfo) {
        this.show();
    } else {
        this.hide();
    }

    // because we still care about the main window
    document.getElementById("closeButton").onclick = function() {
        this.hide();
    }.bind(this);
    if(!this.defaults.noUI) {
        this.initUI();
    }
}

HuesSettings.prototype.connectCore = function(core) {
    this.core = core;
    core.settingsUpdated();
};

HuesSettings.prototype.show = function() {
    if(this.core)
        this.core.hideLists();
    this.window.style.display = "block";
};

HuesSettings.prototype.hide = function() {
    this.window.style.display = "none";
};

HuesSettings.prototype.toggle = function() {
    if(this.window.style.display == "none") {
        this.window.style.display = "block";
        if(this.core)
            this.core.hideLists();
    } else {
        this.window.style.display = "none";
    }
};

HuesSettings.prototype.showRespacks = function() {
    this.show();
    document.getElementById("tab1").checked = true;
};

HuesSettings.prototype.showOptions = function() {
    this.show();
    document.getElementById("tab2").checked = true;
};

HuesSettings.prototype.showInfo = function() {
    this.show();
    document.getElementById("tab3").checked = true;
};

HuesSettings.prototype.initUI = function() {
    var doc = this.root.ownerDocument;

    // To order things nicely
    for(var cat in this.settingsCategories) {
            if(this.settingsCategories.hasOwnProperty(cat)) {
            var catContainer = doc.createElement("div");
            catContainer.textContent = cat;
            catContainer.className = "settings-category";
            var cats = this.settingsCategories[cat];
            for(var i = 0; i < cats.length; i++) {
                var setName = cats[i];
                var setContainer = doc.createElement("div");
                var setting = this.settingsOptions[setName];
                setContainer.textContent = setting.name;
                setContainer.className = "settings-individual";
                var buttonContainer = doc.createElement("div");
                buttonContainer.className = "settings-buttons";
                for(var j = 0; j < setting.options.length; j++) {
                    var option = setting.options[j];
                    if(typeof option === "string") {
                        var checkbox = doc.createElement("input");
                        checkbox.className = "settings-checkbox";
                        checkbox.type = "radio";
                        checkbox.name = setName;
                        checkbox.value = option;
                        checkbox.id = setName + "-" + option;
                        if(localStorage[setName] == option) {
                            checkbox.checked = true;
                        }
                        checkbox.onclick = function(self) {
                            self.set(this.name, this.value);
                        }.bind(checkbox, this);
                        buttonContainer.appendChild(checkbox);
                        // So we can style this nicely
                        var label = doc.createElement("label");
                        label.className = "settings-label";
                        label.htmlFor = checkbox.id;
                        label.textContent = option.toUpperCase();
                        buttonContainer.appendChild(label);
                    } else { // special option
                        if(option.type == "varText") {
                            var text = doc.createElement("span");
                            text.textContent = option.text();
                            buttonContainer.appendChild(text);
                            this.textCallbacks.push({func:option.text, element:text});
                        } else if(option.type == "input") {
                            var input = doc.createElement("input");
                            input.setAttribute("type", "text");
                            input.className = "settings-input";
                            input.value = localStorage[option.variable];
                            // TODO: support more than just positive ints when the need arises
                            if(option.inputType == "int") {
                                input.oninput = (function(self, variable) {
                                    this.value = this.value.replace(/\D/g,'');
                                    if(this.value == "" || this.value < 1) {
                                        this.value = "";
                                        return;
                                    }
                                    localStorage[variable] = this.value;
                                    self.updateConditionals();
                                    self.core.settingsUpdated();
                                }.bind(input, this, option.variable));
                            }
                            input.autofocus = false;
                            buttonContainer.appendChild(input);
                            if(option.visiblity) {
                                this.visCallbacks.push({func:option.visiblity, element:input});
                                input.style.visibility = option.visiblity() ? "visible" : "hidden";
                            }
                        }
                    }

                }
                setContainer.appendChild(buttonContainer);
                catContainer.appendChild(setContainer);
            }
            this.root.appendChild(catContainer);
        }
    }
    this.hasUI = true;
};

// Set a named index to its named value, returns false if name doesn't exist
HuesSettings.prototype.set = function(setting, value) {
    value = value.toLowerCase();
    var opt = this.settingsOptions[setting];
    if(!opt || opt.options.indexOf(value) == -1) {
        console.log(value, "is not a valid value for", setting);
        return false;
    }
    // for updating the UI selection
    try {
        document.getElementById(setting + "-" + value).checked = true;
    } catch(e) {}
    localStorage[setting] = value;
    this.updateConditionals();
    this.core.settingsUpdated();
    return true;
};

HuesSettings.prototype.updateConditionals = function() {
    // update any conditionally formatted settings text
    for(var i = 0; i < this.textCallbacks.length; i++) {
        var text = this.textCallbacks[i];
        text.element.textContent = text.func();
    }
    for(var i = 0; i < this.visCallbacks.length; i++) {
        var callback = this.visCallbacks[i];
        callback.element.style.visibility = callback.func() ? "visible" : "hidden";
    }
}

// Note: This is not defaults as per defaultSettings, but those merged with
// the defaults given in the initialiser
HuesSettings.prototype.setDefaults = function() {
    for(var attr in this.defaults) {
        if(this.defaults.hasOwnProperty(attr)) {
            if(this.ephemeralSettings.indexOf(attr) != -1) {
                continue;
            }
            localStorage[attr] = this.defaults[attr];
        }
    }
};