define(function(require, exports, module) {
	var ExtensionManager = require('code/extensionManager');
	
	var Code = require('code/code');
	var Workspace = require('code/workspace');
	var Fn = require('code/fn');
	
	var Editor = require('modules/editor/editor');
	
	var EditorEditors = require('modules/editor/ext/editors');
	var EditorSession = require('modules/editor/ext/session');
	var EditorSplit = require('modules/editor/ext/split');
	
	var SyntaxDetector = require('libs/syntax_detector');

	var Range = require("ace/range").Range;
	
	var ColorHelper = {
		HSBToHex: function(hsb) {
			return this.RGBToHex(this.HSBToRGB(hsb));
		},
		hexToHSB: function(hex) {
			return this.RGBToHSB(this.hexToRGB(hex));
		},
		RGBToHSB: function(rgb) {
			var hsb = {
				h: 0,
				s: 0,
				b: 0
			}, min = Math.min(rgb.r, rgb.g, rgb.b),
				max = Math.max(rgb.r, rgb.g, rgb.b),
				delta = max - min
			return hsb.b = max, hsb.s = 0 != max ? 255 * delta / max : 0, hsb.h = 0 != hsb.s ? rgb.r == max ? (rgb.g - rgb.b) / delta : rgb.g == max ? 2 + (rgb.b - rgb.r) / delta : 4 + (rgb.r - rgb.g) / delta : -1, hsb.h *= 60, hsb.h < 0 && (hsb.h += 360), hsb.s *= 100 / 255, hsb.b *= 100 / 255, hsb;
		},
		hexToRGB: function(hex) {
			return hex = parseInt(hex.indexOf("#") > -1 ? hex.substring(1) : hex, 16), {
				r: hex >> 16,
				g: (65280 & hex) >> 8,
				b: 255 & hex
			};
		},
		RGBToHex: function(rgb) {
			return ("00000" + (rgb.r << 16 | rgb.g << 8 | rgb.b).toString(16)).slice(-6);
		},
		fixHex: function(hex, asBrowser) {
			hex = hex.toLowerCase().replace(/[^a-f0-9]/g, "");
			var len = 6 - hex.length;
			if (len > 0) {
				var ch = "0",
					o = [],
					i = 0;
				for (asBrowser && (ch = hex.charAt(hex.length - 1), o.push(hex)); len > i; i++) {
					o.push(ch);
					asBrowser || o.push(hex), hex = o.join("");
				}
			}

			return hex;
		},
		fixHSB: function(hsb) {
			return {
				h: Math.min(360, Math.max(0, hsb.h)),
				s: Math.min(100, Math.max(0, hsb.s)),
				b: Math.min(100, Math.max(0, hsb.b))
			};

		},
		fixRGB: function(rgb) {
			return {
				r: Math.min(255, Math.max(0, rgb.r)),
				g: Math.min(255, Math.max(0, rgb.g)),
				b: Math.min(255, Math.max(0, rgb.b))
			};
		}
	};

	var namedColors = {"aliceblue":15792383,"antiquewhite":16444375,"aqua":65535,"aquamarine":8388564,"azure":15794175,"beige":16119260,"bisque":16770244,"black":0,"blanchedalmond":16772045,"blue":255,"blueviolet":9055202,"brown":10824234,"burlywood":14596231,"cadetblue":6266528,"chartreuse":8388352,"chocolate":13789470,"coral":16744272,"cornflowerblue":6591981,"cornsilk":16775388,"crimson":14423100,"cyan":65535,"darkblue":139,"darkcyan":35723,"darkgoldenrod":12092939,"darkgray":11119017,"darkgrey":11119017,"darkgreen":25600,"darkkhaki":12433259,"darkmagenta":9109643,"darkolivegreen":5597999,"darkorange":16747520,"darkorchid":10040012,"darkred":9109504,"darksalmon":15308410,"darkseagreen":9419919,"darkslateblue":4734347,"darkslategray":3100495,"darkslategrey":3100495,"darkturquoise":52945,"darkviolet":9699539,"deeppink":16716947,"deepskyblue":49151,"dimgray":6908265,"dimgrey":6908265,"dodgerblue":2003199,"firebrick":11674146,"floralwhite":16775920,"forestgreen":2263842,"fuchsia":16711935,"gainsboro":14474460,"ghostwhite":16316671,"gold":16766720,"goldenrod":14329120,"gray":8421504,"grey":8421504,"green":32768,"greenyellow":11403055,"honeydew":15794160,"hotpink":16738740,"indianred":13458524,"indigo":4915330,"ivory":16777200,"khaki":15787660,"lavender":15132410,"lavenderblush":16773365,"lawngreen":8190976,"lemonchiffon":16775885,"lightblue":11393254,"lightcoral":15761536,"lightcyan":14745599,"lightgoldenrodyellow":16448210,"lightgray":13882323,"lightgrey":13882323,"lightgreen":9498256,"lightpink":16758465,"lightsalmon":16752762,"lightseagreen":2142890,"lightskyblue":8900346,"lightslategray":7833753,"lightslategrey":7833753,"lightsteelblue":11584734,"lightyellow":16777184,"lime":65280,"limegreen":3329330,"linen":16445670,"magenta":16711935,"maroon":8388608,"mediumaquamarine":6737322,"mediumblue":205,"mediumorchid":12211667,"mediumpurple":9662680,"mediumseagreen":3978097,"mediumslateblue":8087790,"mediumspringgreen":64154,"mediumturquoise":4772300,"mediumvioletred":13047173,"midnightblue":1644912,"mintcream":16121850,"mistyrose":16770273,"moccasin":16770229,"navajowhite":16768685,"navy":128,"oldlace":16643558,"olive":8421376,"olivedrab":7048739,"orange":16753920,"orangered":16729344,"orchid":14315734,"palegoldenrod":15657130,"palegreen":10025880,"paleturquoise":11529966,"palevioletred":14184595,"papayawhip":16773077,"peachpuff":16767673,"peru":13468991,"pink":16761035,"plum":14524637,"powderblue":11591910,"purple":8388736,"red":16711680,"rosybrown":12357519,"royalblue":4286945,"saddlebrown":9127187,"salmon":16416882,"sandybrown":16032864,"seagreen":3050327,"seashell":16774638,"sienna":10506797,"silver":12632256,"skyblue":8900331,"slateblue":6970061,"slategray":7372944,"slategrey":7372944,"snow":16775930,"springgreen":65407,"steelblue":4620980,"tan":13808780,"teal":32896,"thistle":14204888,"tomato":16737095,"turquoise":4251856,"violet":15631086,"wheat":16113331,"white":16777215,"whitesmoke":16119285,"yellow":16776960,"yellowgreen":10145074};
	
	var namedPart = Object.keys(namedColors).join("|");
	
	var patterns = {
		rgb: "rgba?\\(\\s*\\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\b\\s*,\\s*\\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\b\\s*,\\s*\\b([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\\b\\s*(:?\\s*,\\s*(?:1|0|0?\\.[0-9]{1,2})\\s*)?\\)",
		rgb_alt: "rgba?\\(\\s*\\b(\\d{1,2}|100)%\\s*,\\s*\\b(\\d{1,2}|100)%\\s*,\\s*\\b(\\d{1,2}|100)%\\s*(:?\\s*,\\s*(?:1|0|0?\\.[0-9]{1,2})\\s*)?\\)",    
		hsl: "hsla?\\(\\s*\\b([1-2][0-9][0-9]|360|3[0-5][0-9]|[1-9][0-9]|[0-9])\\b\\s*,\\s*\\b(\\d{1,2}|100)%\\s*,\\s*\\b(\\d{1,2}|100)%\\s*(:?\\s*,\\s*(?:1|0|0?\\.[0-9]{1,2})\\s*)?\\)"
	};
	
	var Regexes = {
		isColor: new RegExp("(#([0-9A-Fa-f]{3,6})\\b)"
		+ "|\\b(" + namedPart + ")\\b"
		+ "|(" + patterns.rgb + ")"
		+ "|(" + patterns.rgb_alt + ")"
		+ "|(" + patterns.hsl + ")", "gi"),
		isRgb: new RegExp("(?:" + patterns.rgb + ")"
		+ "|(?:" + patterns.rgb_alt + ")"),
		isHsl: new RegExp(patterns.hsl)
	};
	
	var Spectrum = require('./spectrum');

	var Extension = ExtensionManager.register({
		name: 'colorpicker',
		css: [
			'extension'
		]
	}, {
		nodes: [],
		elem: null,
		picker: null,
		lastActive: null,
		activeColor: null,
		colorpickerChange: false,
		settingsChanged: function(data) {
			
		},
		init: function() {
			var colorpicker = $(Fn.template.parse('<div class="editor-colorpicker">\
			<div class="arrow"></div>\
			<div class="colorpicker-holder"></div>\
			<div class="color-list"></div>\
			</div>'));
			
			$(Editor.elem).find('.editor-container-inner').append(colorpicker);
			this.elem = $(colorpicker);
			
			var self = this;
			this.picker = $(colorpicker).find('.colorpicker-holder').spectrum({
				flat: true,
				showInput: false,
				showInitial: true,
				showAlpha: true,
				move: function(tinycolor) {
					var rgba = tinycolor.toRgb();
					if (rgba.a !== 1) {
						self.onColorPicked('', 'rgba(' + rgba.r + ', ' + rgba.g + ', ' + rgba.b + ', ' + rgba.a + ')');
					} else {
						self.onColorPicked('', '#' + tinycolor.toHex());
					}
				},
			});

			$(this.elem).find('.color-list').on("click", function(e) {
				var el = e.srcElement || e.target || e.element;
				if (el.nodeType != 1 || $(el).parent()[0].className.indexOf("color") == -1)
					return;
				
				var c = $(el).parent()[0].getAttribute("data-color");
				
				if (!c) {
					return false;
				}

				$(self.elem).find('.colorpicker-holder').spectrum("set", c);
				self.onColorPicked('', c);
			});
			
			
			var columnChangeTimer;
			
			EditorEditors.on('codetools.beforechange', function(e) {
				if (!Extension.colorpickerChange && $(Extension.elem).is(':visible')) {
					Extension.hideColorPicker();
				}
			});

			EditorEditors.on("codetools.columnchange", function(e) {
				clearTimeout(columnChangeTimer);
				
				var sess = EditorSession.sessions[EditorSession.getActive()];

				if (!sess) {
					return;
				}

				var doc = e.doc;
				var pos = e.pos;
				var editor = e.editor;

				var line = doc.getLine(1);
				if (["css", "svg", "less", "stylus"].indexOf(sess.mode) === -1 &&
					SyntaxDetector.getContextSyntax(doc, pos, sess.mode) !== "css" &&
					(!line || line.indexOf("<a:skin") === -1)) {
					if (sess.mode == 'php' || sess.mode == 'html') {
						self.hideColorTooltips(editor);
					}
					return;
				}

				line = doc.getLine(pos.row);
				var range = editor.selection.getRange();
				var colors = self._detectColors(pos, line);
				if (colors[0] && colors[0].length && !(range.start.row !== range.end.row || range.start.column !== range.end.column)) {
					self.showColorTooltip(pos, editor, line, colors[0]);
				} else {
					columnChangeTimer = setTimeout(function() {
						self.hideColorTooltips(editor);
					}, 100);
				}
			});

			EditorEditors.on("codetools.codeclick", function(e) {
				var sess = EditorSession.sessions[EditorSession.getActive()];
				
				if (!sess) {
					return;
				}

				var doc = e.doc;
				var pos = e.pos;
				var editor = e.editor;
				var line = doc.getLine(1);

				if (["css", "svg", "less", "stylus"].indexOf(sess.mode) === -1 &&
					SyntaxDetector.getContextSyntax(doc, pos, sess.mode) !== "css" &&
					(!line || line.indexOf("<a:skin") === -1)) {
					return;
				}
				//do not show anything when a selection is made...
				var range = editor.selection.getRange();
				if (range.start.row !== range.end.row || range.start.column !== range.end.column) {
					return;
				}

				line = doc.getLine(pos.row);
				var colors = self._detectColors(pos, line);
				if (colors[1]) {
					self.activeColor = self.lastActive;
					self.hideColorTooltips(editor);
					self.toggleColorPicker(pos, editor, line, colors[1]);
				} else if (self.elem && self.elem.visible) {
					self.hideColorPicker(editor);
				}
			});

			EditorEditors.on("codetools.codedblclick", function(e) {
				self.hideColorTooltips(e.editor);
			});
		},
		_detectColors: function(pos, line) {
			var colors = line.match(Regexes.isColor);
			if (!colors || !colors.length)
				return [];
			var start, end;
			var col = pos.column;
			for (var i = 0, l = colors.length; i < l; ++i) {
				start = line.indexOf(colors[i]);
				end = start + colors[i].length;
				if (col >= start && col <= end)
					return [colors, colors[i]];
			}
			return [colors];
		},
		_createColorRange: function(row, col, line, color) {
			if (col) {
				var str = line;
				var colorLen = color.length;
				var lastIdx;
				var atPos = false;
				while ((lastIdx = str.indexOf(color)) != -1) {
					str = str.substr(lastIdx + colorLen);
					if (lastIdx <= col && lastIdx + colorLen >= col) {
						atPos = true;
						col = lastIdx;
					}
				}
				if (!atPos)
					return null;
			}
			col = line.indexOf(color);
			return Range.fromPoints({
				row: row,
				column: col
			}, {
				row: row,
				column: col + color.length
			});
		},
		_makeUnique: function(arr){
			var i, length, newArr = [];
			for (i = 0, length = arr.length; i < length; i++) {
				if (newArr.indexOf(arr[i]) == -1)
					newArr.push(arr[i]);
			}
			
			arr.length = 0;
			for (i = 0, length = newArr.length; i < length; i++)
				arr.push(newArr[i]);
	
			return arr;
		},
		_colors: {},
		showColorTooltip: function(pos, editor, line, colors, markerId) {
			var self = this;
			var markers = [];
			colors.forEach(function(color) {
				var id = markerId || color.replace(/[\(\)\,\.]/gi, '-').replace(/\s+/gi, '') + (pos.row + "") + pos.column;
				var marker = self._colors[id];
				// the tooltip DOM node is stored in the third element of the selection array
				if (!marker) {
					var range = self._createColorRange(pos.row, pos.column, line, color);
					if (!range) {
						return;
					}
					
					var found = false;
					for (var i in this._colors) {
						if (self.activeColor == i && self._colors[i][0].start.column == range.start.column && self._colors[i][0].start.row == range.start.row) {
							found = true;
						}
					}
					
					if (found) {
						return;
					}
					
					marker = editor.session.addMarker(range, "codetools_colorpicker", function(stringBuilder, range, left, top, viewport) {
						stringBuilder.push(
							"<span class='codetools_colorpicker' id='colorpicker" + id.replace(/^\#/, '') + "' style='",
							"left:", left - 3, "px;",
							"top:", top - 1, "px;",
							"height:", viewport.lineHeight, "px;'", (markerId ? " id='" + markerId + "'" : ""), ">", color, "</span>"
						);
					}, true);
					self._colors[id] = [range, marker, editor.session];
					self.lastActive = id;
				}
				markers.push(marker);
			});

			this.hideColorTooltips(editor, markers);
		},
		hideColorTooltips: function(editor, exceptions) {
			if (!exceptions && this.elem && this.elem.visible) {
				this.hideColorPicker(editor);
			}
			if (exceptions && typeof exceptions != 'object') {
				exceptions = [exceptions];
			}
			var marker, session;
			for (var mid in this._colors) {
				marker = this._colors[mid][1];
				session = this._colors[mid][2];
				if (exceptions && exceptions.indexOf(marker) > -1 || mid == this.activeColor) {
					continue;
				}
				session.removeMarker(marker);
				delete this._colors[mid];
			}
		},
		parseColorString: function(col) {
			var ret = {
				orig: col
			};

			if (typeof namedColors[col] != "undefined") {
				col = ColorHelper.fixHex(namedColors[col].toString(16));
			}
			var rgb = col.match(Regexes.isRgb);
			var hsb = col.match(Regexes.isHsl);
			if (rgb && rgb.length >= 3) {
				ret.rgb = ColorHelper.fixRGB({
					r: rgb[1],
					g: rgb[2],
					b: rgb[3]
				});
				ret.hex = ColorHelper.RGBToHex(rgb);
				ret.type = "rgb";
			} else if (hsb && hsb.length >= 3) {
				ret.hsb = ColorHelper.fixHSB({
					h: hsb[1],
					s: hsb[2],
					b: hsb[3]
				});
				ret.hex = ColorHelper.HSBToHex(hsb);
				ret.type = "hsb";
			} else {
				ret.hex = ColorHelper.fixHex(col.replace("#", ""), true);
				ret.type = "hex";
			}

			return ret;
		},
		toggleColorPicker: function(pos, editor, line, color) {
			var elem = this.elem;
			var self = this;
			
			if (!this.activeColor) {
				return false;
			}

			var parsed = this.parseColorString(color);

			if ($(elem).is(':visible') && this.$activeColor && parsed.hex == this.$activeColor.color.orig && pos.row == this.$activeColor.row) {
				return this.hideColorPicker(editor);
			}

			// set appropriate event listeners, that will be removed when the colorpicker
			// hides.
			var onKeyDown, onScroll, onCursorChange;
			var self = this;
			$(document).on("keydown", onKeyDown = function(e) {
				var a = self.$activeColor;

				if (!a || !$(elem).is(':visible')) {
					return;
				}

				// when ESC is pressed, undo all changes made by the colorpicker
				if (e.keyCode === 27) {
					self.hideColorPicker(editor);
					clearTimeout(self.$colorPickTimer);
					var at = editor.session.$undoManager;
					if (at.$undoStack.length > a.start)
						at.undo(at.$undoStack.length - a.start);
				}
			});

			EditorEditors.on("codetools.cursorchange", onCursorChange = function(e) {
				var a = self.$activeColor;

				if (!a || !a.marker || !$(elem).is(':visible')) {
					return;
				}

				var pos = e.pos.start;
				var range = a.marker[0];
				if (!range.contains(pos)) {
					self.hideColorPicker(editor);
				}
			});

			editor.addEventListener("mousewheel", onScroll = function(e) {
				var a = self.$activeColor;

				if (!$(elem).is(':visible') || !a) {
					return;
				}

				self.hideColorPicker(editor);
			});

			editor.addEventListener("mousedown", onScroll);
			
			// editor.blur();

			var id = this.activeColor.replace(/^\#?/, 'colorpicker');
			delete this.$activeColor;
			this.hideColorTooltips(editor);
			this.showColorTooltip(pos, editor, line, [parsed.orig], id);
			$(elem).show();
			
			this.$activeColor = {
				color: parsed,
				hex: parsed.hex,
				markerNode: id,
				line: line,
				current: parsed.orig,
				pos: pos,
				marker: this._colors[this.activeColor],
				editor: editor,
				ignore: 0,
				start: editor.session.$undoManager.$undoStack.length,
				listeners: {
					onKeyDown: onKeyDown,
					onScroll: onScroll,
					onCursorChange: onCursorChange
				}
			};
			
			$(this.elem).find('.colorpicker-holder').spectrum("set", color);
			$(this.elem).find('.colorpicker-holder').spectrum("show");

			this.updateColorTools(editor);

			this.resize();
		},
		hideColorPicker: function(editor) {
			var a = this.$activeColor;
			this.elem.hide();
			
			if (a) {
				$(document).unbind("keydown", a.listeners.onKeyDown);
				a.editor.removeEventListener("mousewheel", a.listeners.onScroll);
				a.editor.removeEventListener("mousedown", a.listeners.onScroll);
				EditorEditors.off("codetools.cursorchange", a.listeners.onCursorChange);
				var exceptions = [];
				for (var i in this._colors) {
					if (i != this.activeColor) {
						exceptions = this._colors[i][1];
					}
				}
				
				this.activeColor = null;
				this.$activeColor = null;
				
				this.hideColorTooltips(a.editor, exceptions);
				a.editor.focus();
			}
			// this.hideColorTooltips(editor);
			
		},
		updateColorTools: function(editor) {
			var lines = editor.session.getLines(0, 2000);
			var m;
			var colors = [];
			for (var i = 0, l = lines.length; i < l; ++i) {
				if (!(m = lines[i].match(Regexes.isColor)))
					continue;
				colors = colors.concat(m);
			}
			colors = this._makeUnique(colors);

			var out = [];
			var parsed;
			for (i = 0, l = Math.min(colors.length, 11); i < l; ++i) {
				out.push('<span class="color" data-color="', colors[i], '" title="', colors[i], '"><span style="background-color: ', colors[i], '"></span></span>');
			}
			$(this.elem).find('.color-list').html(out.join(""));
		},
		onColorPicked: function(old, color) {
			var self = this;
			var a = this.$activeColor;
			if (!a)
				return;
			if (a.ignore) {
				--a.ignore;
				return;
			}

			clearTimeout(this.$colorPickTimer);
			var doc = a.editor.session.doc;
			var line = doc.getLine(a.pos.row);
			if (typeof a.markerNode == "string") {
				var node = document.getElementById(a.markerNode);
				if (node)
					a.markerNode = node;
				else
					return;
			}
			
			// var newLine, newColor;
			// if (a.color.type == "hex") {
			// 	newColor = color;
			// } else if (a.color.type == "rgb") {
			// 	var m = a.current.match(Regexes.isRgb);
			// 	var regex = new RegExp("(rgba?)\\(\\s*" + m[1] + "\\s*,\\s*" + m[2] + "\\s*,\\s*" + m[3] + "(\\s*,\\s*(?:1|0|0?\\.[0-9]{1,2})\\s*)?\\)", "i");
			// 	if (!line.match(regex))
			// 		return;
			// 	var rgb = ColorHelper.hexToRGB(color);
			// 	newLine = line.replace(regex, function(m, prefix, suffix) {
			// 		return (newColor = prefix + "(" + rgb.r + ", " + rgb.g + ", " + rgb.b + (suffix || "") + ")");
			// 	});
			// } else if (a.color.type == "hsb") {
			// 	var m = a.current.match(Regexes.isHsl);
			// 	var regex = new RegExp("hsl\\(\\s*" + m[1] + "\\s*,\\s*" + m[2] + "\\s*,\\s*" + m[3] + "\\s*\\)", "i");
			// 	if (!line.match(regex))
			// 		return;
			// 	var hsb = ColorHelper.hexToHSB(color);
			// 	newLine = line.replace(regex, function() {
			// 		return (newColor = "hsl(" + parseInt(hsb.h, 10) + ", " + parseInt(hsb.s, 10) + "%, " + parseInt(hsb.b, 10) + "%)");
			// 	});
			// }

			a.markerNode.innerHTML = color;

			this.$colorPickTimer = setTimeout(function() {
				var range = self._createColorRange(a.pos.row, a.pos.column, line, a.current);
				if (!range)
					return;
				a.marker[0] = range;
				Extension.colorpickerChange = true;
				range.end = doc.replace(range, color);
				Extension.colorpickerChange = false;
				a.current = color;
			}, 200);
		},
		resize: function(color) {
			if (!$(this.elem).is(':visible')) {
				return;
			}

			var a = color || this.$activeColor;
			var pos = a.pos;
			var orig = a.color.orig;
			var line = a.line;
			var renderer = EditorEditors.getEditor(EditorSplit.active).renderer;
			var cp = this.colorpicker;
			var elem = this.elem;
			

			// calculate the x and y (top and left) position of the colorpicker
			var coordsStart = renderer.textToScreenCoordinates(pos.row, line.indexOf(orig) - 1);
			var coordsEnd = renderer.textToScreenCoordinates(pos.row, line.indexOf(orig) + orig.length);
			var origX, origY;
			var y = origY = coordsEnd.pageY - $('.statusbar').height() - $(this.elem).height()/2 + 30;
			var x = origX = coordsEnd.pageX - $(Editor.elem).find('.editor-explorer').width() + 15;
			var pOverflow = 0;
			
			y = y < 5 ? 5 : y;
			y = y > (window.innerHeight - $('.statusbar').height() - $(this.elem).height() - 5) ? (window.innerHeight - $('.statusbar').height() - $(this.elem).height() - 5) : y;
			
			$(elem).css({top: y});
			$(elem).css({left: x});
			$(elem).find('.arrow').css({top: coordsEnd.pageY-y-48});
		},
		destroy: function() {
			this.hideColorPicker();
		}
	});

	module.exports = Extension;
});