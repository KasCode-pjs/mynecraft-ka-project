/*

Link to this program on KA: https://www.khanacademy.org/computer-programming/minecraft-demo/6296110573961216

*/
var SENSITIVITY = 0.8;
var raytraceLighting = false;
var isSprinting = false;
var bccol = [62, 172, 212];
var externals;
// https://www.khanacademy.org/computer-programming/3d-minecraft-tunnel/1193254153
var allTextures = (function() {
	var texmaps = [];
	var i, x, y, z, xd, yd, zd;
	for (i = 1; i < 10; i++) {
		texmaps.push([]);
		var br = 255 - ((random(1) * 96) | 0);
		for (y = 0; y < 16 * 3; y++) {
			for (x = 0; x < 16; x++) {
				var color = 0x966C4A;
				if (i === 4) {
					color = 0x7F7F7F;
				}
				if (i !== 4 || ((random(1) * 3) | 0) === 0) {
					br = 255 - ((random(1) * 96) | 0);
				}
				if ((i === 1 && y < (((x * x * 3 + x * 81) >> 2) & 3) + 18)) {
					color = 0x6AAA40;
				} else if ((i === 1 && y < (((x * x * 3 + x * 81) >> 2) & 3) + 19)) {
					br = br * 2 / 3;
				}
				if (i === 7) {
					color = 0x675231;
					if (x > 0 && x < 15 && ((y > 0 && y < 15) || (y > 32 && y < 47))) {
						color = 0xBC9862;
						xd = (x - 7);
						yd = ((y & 15) - 7);
						if (xd < 0) {
							xd = 1 - xd;
						}
						if (yd < 0) {
							yd = 1 - yd;
						}
						if (yd > xd) {
							xd = yd;
						}
						br = 196 - ((random(1) * 32) | 0) + xd % 3 * 32;
					} else if (((random(1) * 2) | 0) === 0) {
						br = br * (150 - (x & 1) * 100) / 100;
					}
				}
				if (i === 5) {
					color = 0xB53A15;
					if ((x + (y >> 2) * 4) % 8 === 0 || y % 4 === 0) {
						color = 0xBCAFA5;
					}
				}
				if (i === 9) {
					color = 0x4040ff;
				}
				var brr = br;
				if (y >= 32) {
					brr /= 2;
				}
				if (i === 8) {
					color = 0x50D937;
					if (((random(1) * 2) | 0) === 0) {
						color = 0;
						brr = 255;
					}
				}
				var col = (((color >> 16) & 0xff) * brr / 255) << 16 | (((color >> 8) & 0xff) * brr / 255) << 8 | (((color) & 0xff) * brr / 255);
				col = col ? col | 0xff000000 : 256;
				texmaps[i - 1][x + y * 16] = col;
			}
		}
	}
	texmaps.splice(1, 1);
	texmaps.splice(4, 1);
	return texmaps;
})();
// Each texture has 3 parts: top, sides, bottom
var res = 100;
var viewDistance = 10;
var N = 30;
var lightPos = [1 + 0.5, 1 + 0.5, 10 + 0.5];
var sprites = [];
var keys = {};
keyPressed = function() {
	keys[key.toString()] = true;
};
keyReleased = function() {
	keys[key.toString()] = false;
};
var cam = {
	x: 15,
	y: 15,
	z: 5,
	rotXY: 45,
	rotZ: 0
};
var zvel = 0;
var world = [];
for (var x = 0; x < N; x++) {
	world[x] = [];
	for (var y = 0; y < N; y++) {
		world[x][y] = [];
		for (var z = 0; z < N; z++) {
			world[x][y][z] = {
				value: 0,
				brightness: 0.0
			};
		}
	}
}
var addTree = function (tx, ty, tz) {
	for (var z = tz - 4; z < tz; z ++) {
		world[tx][ty][z].value = 5;
	}
	
	for (var rx = -1; rx <= 1; rx ++) {
		if (tx + rx < 0 || tx + rx > N - 1) {
			continue;
		}
		for (var ry = -1; ry <= 1; ry ++) {
			if (ty + ry < 0 || ty + ry > N - 1) {
				continue;
			}
			for (var rz = -1; rz <= 1; rz ++) {
				if (rz+tz-4 < 0 || rz+tz-4 > N-1) {
					continue;
				}
				var ev = world[tx+rx][ty+ry][rz+tz-4].value;
				if (ev !== 5) {
					world[tx+rx][ty+ry][rz+tz-4].value = 6;
				}
				
			}
		}
	}
};
var loadLayer = function (z) {
	for (var x = 0; x < N; x++) {
		for (var y = 0; y < N; y++) {
			var dx = x - N / 2;
			var dy = z - N / 2 + 5;
			var dt = dx * dx + dy * dy;
			if (y > N / 2 - 2 && y < N / 2 + 2 && dt > 12 * 12 && dt < 15 * 15) {
				world[x][y][z].value = 0;
			} else if (z > N - 5 && (x === 0 || y === 0 || x === N - 1 || y === N - 1)) {
				world[x][y][z].value = 2;
			} else {
				if (z === N - 2) {
					world[x][y][z].value = Math.floor(Math.random() * 5) + 1;
				} else {
					if (z > N - 20) {
						var prop = (z - N + 20) / 20 / 2 + 0.25;
						var nois = noise(x / N * 2, y / N * 2);
						if (nois < prop) {
							if (world[x][y][z - 1].value === 0) {
								world[x][y][z].value = 1 + Math.floor(Math.random() * 1.2);
								if (Math.random() < 0.01) {
									addTree(x, y, z);
								}
							} else {
								if (world[x][y][z - 1].value === 2) {
									world[x][y][z].value = 3;
								}
								else if (world[x][y][z - 1].value === 1) {
									world[x][y][z].value = 1;
								}
								else {
									world[x][y][z].value = 3;
								}
							}
						}
					}
				}
			}
		}
	}
};
var loadZ = 0;
/*
for (var x = 0; x < N; x++) {
	for (var y = 0; y < N; y++) {
		for (var z = 0; z < N; z++) {
			var dx = x - N / 2;
			var dy = z - N / 2 + 5;
			var dt = dx * dx + dy * dy;
			if (y > N / 2 - 2 && y < N / 2 + 2 && dt > 12 * 12 && dt < 15 * 15) {
				world[x][y][z].value = 0;
			} else if (z > N - 5 && (x === 0 || y === 0 || x === N - 1 || y === N - 1)) {
				world[x][y][z].value = 2;
			} else {
				if (z === N - 2) {
					world[x][y][z].value = Math.floor(Math.random() * 5) + 1;
				} else {
					if (z > N - 20) {
						var prop = (z - N + 20) / 20 / 2 + 0.25;
						var nois = noise(x / N * 2, y / N * 2);
						if (nois < prop) {
							world[x][y][z].value = 1 + Math.floor(Math.random() * 1.2);
							if (Math.random() < 0.01 && world[x][y][z-1].value===0) {
								addTree(x, y, z);
							}
							if (z < N - 1 && world[x][y][z + 1].value !== 0) {
								world[x][y][z + 1].value = 3;
							}
						}
					}
				}
			}
		}
	}
}
*/
for (var i = 0; i < 20; i++) {
	world[N - 5][N - 5][N - i - 1].value = 4;
}
world.inside = function(x, y, z) {
	if (x < 0 || y < 0 || z < 0 || x > N - 1 || y > N - 1 || z > N - 1) {
		return 0;
	}
	return 1;
};
world.getValueAt = function(x, y, z) {
	if (this.inside(x, y, z)) {
		return this[x][y][z].value;
	}
	return 0;
};
world.getLightAt = function(x, y, z) {
	if (world.inside(x, y, z)) {
		return this[x][y][z].brightness;
	}
	return 0;
};
world.destroyBlock = function(x, y, z) {
	if (this.inside(x, y, z)) {
		this[x][y][z].value = 0;
		this[x][y][z].brightness = 0;
		if (x > 0) {
			if (this[x - 1][y][z].brightness - 1 > this[x][y][z].brightness) {
				this[x][y][z].brightness = this[x - 1][y][z].brightness - 1;
			}
		}
		if (x < N - 1) {
			if (this[x + 1][y][z].brightness - 1 > this[x][y][z].brightness) {
				this[x][y][z].brightness = this[x + 1][y][z].brightness - 1;
			}
		}
		if (y > 0) {
			if (this[x][y - 1][z].brightness - 1 > this[x][y][z].brightness) {
				this[x][y][z].brightness = this[x][y - 1][z].brightness - 1;
			}
		}
		if (y < N - 1) {
			if (this[x][y + 1][z].brightness - 1 > this[x][y][z].brightness) {
				this[x][y][z].brightness = this[x][y + 1][z].brightness - 1;
			}
		}
		if (z > 0) {
			if (this[x][y][z - 1].brightness - 1 > this[x][y][z].brightness) {
				this[x][y][z].brightness = this[x][y][z - 1].brightness - 1;
			}
		}
		if (z < N - 1) {
			if (this[x][y][z + 1].brightness - 1 > this[x][y][z].brightness) {
				this[x][y][z].brightness = this[x][y][z + 1].brightness - 1;
			}
		}
	}
};
var PointerLockStart = false;
var PointerLockAPI = function(f) {
	var Document = (function() {
		return this[["document"]];
	})();
	var outputCanvas = Document.getElementById("output-canvas");
	var Supported = false;
	var PointerTypes = ["", "webkit", "moz"];
	var PointerType;
	for (var x = 0; x < PointerTypes.length; x++) {
		if (outputCanvas[[PointerTypes[x] + (PointerTypes[x] === "" ? "requestPointerLock" : "RequestPointerLock")]] !== undefined) {
			Supported = true;
			PointerType = PointerTypes[x];
			break;
		} else {
			Supported = false;
		}
	}
	this.Supported = Supported;
	this.Lock = function() {
		outputCanvas[(PointerType === "" ? "requestPointerLock" : PointerType + "RequestPointerLock")]();
		PointerLockStart = true;
	};
	this.Unlock = function() {
		outputCanvas[(PointerType === "" ? "exitPointerLock" : PointerType + "ExitPointerLock")]();
		PointerLockStart = false;
	};
	f(this);
	Document.addEventListener("mousemove", function(ev) {
		mouseX = pmouseX + ev.movementX;
		mouseY = pmouseY + ev.movementY;
	});
};
var floodFill = [];
var addNeighbor = function(x, y, z, br) {
	if (!world.inside(x, y, z)) {
		return;
	}
	var wv = world.getValueAt(x, y, z);
	if (wv !== 0 && wv !== 6) {
		return;
	}
	var nbr = world.getLightAt(x, y, z);
	if (nbr > br - 1) {
		return;
	}
	if (wv === 6) {
		br --;
	}
	floodFill.push([x, y, z, br]);
};
var calculateFloodFill = function(lx, ly, lz, intensity) {
	lx = Math.floor(lx);
	ly = Math.floor(ly);
	lz = Math.floor(lz);
	floodFill.length = 0;
	floodFill.push([lx, ly, lz, intensity]);
	while (floodFill.length) {
		var element = floodFill.pop();
		var ex = element[0],
			ey = element[1],
			ez = element[2];
		world[element[0]][element[1]][element[2]].brightness = element[3];
		addNeighbor(ex + 1, ey, ez, element[3] - 1);
		addNeighbor(ex - 1, ey, ez, element[3] - 1);
		addNeighbor(ex, ey + 1, ez, element[3] - 1);
		addNeighbor(ex, ey - 1, ez, element[3] - 1);
		addNeighbor(ex, ey, ez + 1, element[3] - 1);
		addNeighbor(ex, ey, ez - 1, element[3] - 1);
	}
};
var calculateSunFloodFill = function(intensity) {
	floodFill.length = 0;
	for (var x = 0; x < N; x++) {
		for (var y = 0; y < N; y++) {
			floodFill.push([x, y, 0, intensity]);
		}
	}
	while (floodFill.length) {
		var element = floodFill.pop();
		var ex = element[0],
			ey = element[1],
			ez = element[2];
		world[element[0]][element[1]][element[2]].brightness = element[3];
		addNeighbor(ex + 1, ey, ez, element[3] - 1);
		addNeighbor(ex - 1, ey, ez, element[3] - 1);
		addNeighbor(ex, ey + 1, ez, element[3] - 1);
		addNeighbor(ex, ey - 1, ez, element[3] - 1);
		addNeighbor(ex, ey, ez + 1, element[3]);
		addNeighbor(ex, ey, ez - 1, element[3] - 1);
	}
};
calculateSunFloodFill(8);
calculateFloodFill(N / 2, N / 2, 10, 20);
var castRay2 = function(x1, y1, z1, x2, y2, z2, side1, side2) {
	var px = x1;
	var py = y1;
	var pz = z1;
	var rdx = x2 - x1;
	var rdy = y2 - y1;
	var rdz = z2 - z1;
	if (side1 === 0) {
		if (side2 && rdx > 0) {
			return 0.1;
		}
		if (!side2 && rdx < 0) {
			return 0.1;
		}
	} else if (side1 === 1) {
		if (side2 && rdy > 0) {
			return 0.1;
		}
		if (!side2 && rdy < 0) {
			return 0.1;
		}
	} else {
		if (side2 && rdz > 0) {
			return 0.1;
		}
		if (!side2 && rdz < 0) {
			return 0.1;
		}
	}
	var di = Math.sqrt(rdx * rdx + rdy * rdy + rdz * rdz);
	if (di === 0) {
		return 1.0;
	}
	rdx /= di;
	rdy /= di;
	rdz /= di;
	var sideDistX, sideDistY, sideDistZ;
	var deltaDistX = Math.abs(1 / rdx);
	var deltaDistY = Math.abs(1 / rdy);
	var deltaDistZ = Math.abs(1 / rdz);
	var targetX = Math.floor(x2);
	var targetY = Math.floor(y2);
	var targetZ = Math.floor(z2);
	var mapX = Math.floor(x1);
	var mapY = Math.floor(y1);
	var mapZ = Math.floor(z1);
	var stepX, stepY, stepZ;
	if (rdx < 0) {
		stepX = -1;
		sideDistX = (px - mapX) * deltaDistX;
	} else {
		stepX = 1;
		sideDistX = (mapX + 1.0 - px) * deltaDistX;
	}
	if (rdy < 0) {
		stepY = -1;
		sideDistY = (py - mapY) * deltaDistY;
	} else {
		stepY = 1;
		sideDistY = (mapY + 1.0 - py) * deltaDistY;
	}
	if (rdz < 0) {
		stepZ = -1;
		sideDistZ = (pz - mapZ) * deltaDistZ;
	} else {
		stepZ = 1;
		sideDistZ = (mapZ + 1.0 - pz) * deltaDistZ;
	}
	while (true) {
		if (sideDistY < sideDistX) {
			if (sideDistZ < sideDistY) {
				mapZ += stepZ;
				sideDistZ += deltaDistZ;
			} else {
				mapY += stepY;
				sideDistY += deltaDistY;
			}
		} else {
			if (sideDistZ < sideDistX) {
				mapZ += stepZ;
				sideDistZ += deltaDistZ;
			} else {
				mapX += stepX;
				sideDistX += deltaDistX;
			}
		}
		if (mapX < 0 || mapY < 0 || mapZ < 0 || mapX > N - 1 || mapY > N - 1 || mapZ > N - 1) {
			break;
		}
		if (mapX === targetX || mapY === targetY || mapZ === targetZ) {
			break;
		}
		if (world[mapX][mapY][mapZ].value !== 0) {
			return 0.1;
		}
	}
	/*
	var nx, ny, nz;
	var interp = 0;
	if (side1 === 0) {
		return Math.abs(rdx);
	} else if (side1 === 1) {
		return Math.abs(rdy);
	} else {
		return Math.abs(rdz);
	}
	interp = nx * rdx + ny * rdy + nz * rdz;
	return Math.abs(interp);*/
	return 1.0;
};
var renderRay = function(rayDirX, rayDirY, rayDirZ) {
	var mapX = Math.floor(cam.x);
	var mapY = Math.floor(cam.y);
	var mapZ = Math.floor(cam.z);
	var sideDistX, sideDistY, sideDistZ;
	var deltaDistX = Math.abs(1 / rayDirX);
	var deltaDistY = Math.abs(1 / rayDirY);
	var deltaDistZ = Math.abs(1 / rayDirZ);
	var stepX, stepY, stepZ;
	if (rayDirX < 0) {
		stepX = -1;
		sideDistX = (cam.x - mapX) * deltaDistX;
	} else {
		stepX = +1;
		sideDistX = (mapX + 1.0 - cam.x) * deltaDistX;
	}
	if (rayDirY < 0) {
		stepY = -1;
		sideDistY = (cam.y - mapY) * deltaDistY;
	} else {
		stepY = +1;
		sideDistY = (mapY + 1.0 - cam.y) * deltaDistY;
	}
	if (rayDirZ < 0) {
		stepZ = -1;
		sideDistZ = (cam.z - mapZ) * deltaDistZ;
	} else {
		stepZ = +1;
		sideDistZ = (mapZ + 1.0 - cam.z) * deltaDistZ;
	}
	var hit = false;
	var iters = 0;
	var abort = false;
	var side = 0;
	while (!hit) {
		if (sideDistY < sideDistX) {
			if (sideDistZ < sideDistY) {
				mapZ += stepZ;
				sideDistZ += deltaDistZ;
				side = 2;
			} else {
				mapY += stepY;
				sideDistY += deltaDistY;
				side = 1;
			}
		} else {
			if (sideDistZ < sideDistX) {
				mapZ += stepZ;
				sideDistZ += deltaDistZ;
				side = 2;
			} else {
				mapX += stepX;
				sideDistX += deltaDistX;
				side = 0;
			}
		}
		if (mapX < 0 || mapY < 0 || mapZ < 0 || mapX > N - 1 || mapY > N - 1 || mapZ > N - 1) {
			if (mapX < 0 && rayDirX < 0) {
				return [bccol[0], bccol[1], bccol[2], 100];
			}
			if (mapY < 0 && rayDirY < 0) {
				return [bccol[0], bccol[1], bccol[2], 100];
			}
			if (mapZ < 0 && rayDirZ < 0) {
				return [bccol[0], bccol[1], bccol[2], 100];
			}
			if (mapX > N - 1 && rayDirX > 0) {
				return [bccol[0], bccol[1], bccol[2], 100];
			}
			if (mapY > N - 1 && rayDirY > 0) {
				return [bccol[0], bccol[1], bccol[2], 100];
			}
			if (mapZ > N - 1 && rayDirZ > 0) {
				return [bccol[0], bccol[1], bccol[2], 100];
			}
			if (++iters > 50) {
				return [bccol[0], bccol[1], bccol[2], 100];
			}
			continue;
		}
		if (world[mapX][mapY][mapZ].value > 0) {
			var perpWallDist;
			var whichFace;
			var wallX, wallY;
			
			var dx = mapX - cam.x + (1 - stepX) / 2;
			var dy = mapY - cam.y + (1 - stepY) / 2;
			var dz = mapZ - cam.z + (1 - stepZ) / 2;
			
			var dside2 = +1;
			
			if (side === 0) {
				perpWallDist = dx / rayDirX;
				dside2 = rayDirX > 0;
			} else if (side === 1) {
				perpWallDist = dy / rayDirY;
				dside2 = rayDirY > 0;
			} else {
				perpWallDist = dz / rayDirZ;
				dside2 = rayDirZ > 0;
			}
			
			var hitX = cam.x + perpWallDist * rayDirX;
			var hitY = cam.y + perpWallDist * rayDirY;
			var hitZ = cam.z + perpWallDist * rayDirZ;
			
			var lightX = mapX;
			var lightY = mapY;
			var lightZ = mapZ;
			if (side === 0) {
				if (rayDirX > 0) {
					lightX -= 1;
				} else {
					lightX += 1;
				}
			} else if (side === 1) {
				if (rayDirY > 0) {
					lightY -= 1;
				} else {
					lightY += 1;
				}
			} else {
				if (rayDirZ > 0) {
					lightZ -= 1;
				} else {
					lightZ += 1;
				}
			}
			var shade = world.getLightAt(lightX, lightY, lightZ) / 15;
			if (shade === 0) {
				shade = 1 / 30;
			}
			var wallX = 0, wallY = 0;
			
			var wh = 1;
			
			if (side === 0) {
				wallX = hitY - Math.floor(hitY);
				wallY = hitZ - Math.floor(hitZ);
				wh = 1;
			} else if (side === 1) {
				wallX = hitX - Math.floor(hitX);
				wallY = hitZ - Math.floor(hitZ);
				wh = 1;
			} else if (side === 2) {
				wallX = hitY - Math.floor(hitY);
				wallY = hitX - Math.floor(hitX);
				if (rayDirZ > 0) {
					wh = 0;
				} else {
					wh = 2;
				}
			}
			
			var whichTex = allTextures[world[mapX][mapY][mapZ].value - 1];
			
			var texX = Math.floor(wallX * 16);
			var texY = Math.floor(wallY * 16);
			
			var texL = texX + texY * 16 + wh * 256;
			
			var co = whichTex[texL];
			if (alpha(co)!==255) {
				continue;
			}
			var sh = side===0?0.75:side===1?0.90:1;
			sh *= shade;
			
			return [red(co) * sh, green(co) * sh, blue(co) * sh, perpWallDist];
		}
		if (++iters > 50) {
			return [bccol[0], bccol[1], bccol[2], 100];
		}
	}
};
loadPixels();
var pixels = imageData.data;
var runMouse = true;
var dBuffer = [];
var isMouseClicked = false;
var hasSetLoopTimeout = false;
draw = function() {
	if (!hasSetLoopTimeout) {
		this[["KAInfiniteLoopSetTimeout"]](40000);
		hasSetLoopTimeout = true;
	}
	if (loadZ < N) {
		background(255);
		textAlign(3, 3);
		fill(0);
		text("loading world", 200, 200);
		loadLayer(loadZ);
		loadZ ++;
		return;
	}
	if (keys.q && keys.w) {
		isSprinting = true;
	} else {
		isSprinting = false;
	}
	var whichOne = frameCount % 2;
	var xyCt = Math.cos(cam.rotXY);
	var xySt = Math.sin(cam.rotXY);
	var zCt = Math.cos(cam.rotZ);
	var zSt = Math.sin(cam.rotZ);
	for (var x = 0; x < res; x++) {
		for (var y = whichOne; y < res; y += 2) {
			var ax = x / res - 0.5;
			var ay = y / res - 0.5;
			if (isSprinting) {
				ax -= ax / 10;
				ay -= ay / 10;
			}
			var baseRayX = 1;
			var baseRayY = ax;
			var baseRayZ = ay;
			// rotate Z
			var ox = baseRayX,
				oz = baseRayZ;
			baseRayX = zCt * ox - zSt * oz;
			baseRayZ = zCt * oz + zSt * ox;
			// rotate XY
			var ox = baseRayX,
				oy = baseRayY;
			baseRayX = xyCt * ox - xySt * oy;
			baseRayY = xyCt * oy + xySt * ox;
			var rdx = baseRayX;
			var rdy = baseRayY;
			var rdz = baseRayZ;
			var c = renderRay(rdx, rdy, rdz);
			var l = x + y * width << 2;
			dBuffer[x + y * res] = c[3];
			if (c[3] < viewDistance) {
				pixels[l + 0] = c[0];
				pixels[l + 1] = c[1];
				pixels[l + 2] = c[2];
			} else if (c[3] < viewDistance + 20) {
				var amt = (c[3] - viewDistance) / 20;
				pixels[l + 0] = c[0] * (1 - amt) + bccol[0] * amt;
				pixels[l + 1] = c[1] * (1 - amt) + bccol[1] * amt;
				pixels[l + 2] = c[2] * (1 - amt) + bccol[2] * amt;
			} else {
				pixels[l + 0] = bccol[0];
				pixels[l + 1] = bccol[1];
				pixels[l + 2] = bccol[2];
			}
			if (x > res / 2 - 1 && x < res / 2 + 1 && y > res / 2 - 6 && y < res / 2 + 6) {
				pixels[l + 0] = 255 - pixels[l + 0];
				pixels[l + 1] = 255 - pixels[l + 1];
				pixels[l + 2] = 255 - pixels[l + 2];
			}
			if (y > res / 2 - 1 && y < res / 2 + 1 && x > res / 2 - 6 && x < res / 2 + 6) {
				pixels[l + 0] = 255 - pixels[l + 0];
				pixels[l + 1] = 255 - pixels[l + 1];
				pixels[l + 2] = 255 - pixels[l + 2];
			}
		}
	}
	if (whichOne === 1) {
		updatePixels();
		image(get(0, 0, res, res), 0, 0, 400, 400);
	}
	if (isMouseClicked) {
		var rayDirX = 1,
			rayDirY = 0,
			rayDirZ = 0;
		// rotate Z
		var ox = rayDirX,
			oz = rayDirY;
		rayDirX = zCt * ox - zSt * oz;
		rayDirZ = zCt * oz + zSt * ox;
		// rotate XY
		var ox = rayDirX,
			oy = rayDirY;
		rayDirX = xyCt * ox - xySt * oy;
		rayDirY = xyCt * oy + xySt * ox;
		var mapX = Math.floor(cam.x);
		var mapY = Math.floor(cam.y);
		var mapZ = Math.floor(cam.z);
		var sideDistX, sideDistY, sideDistZ;
		var deltaDistX = Math.abs(1 / rayDirX);
		var deltaDistY = Math.abs(1 / rayDirY);
		var deltaDistZ = Math.abs(1 / rayDirZ);
		var stepX, stepY, stepZ;
		if (rayDirX < 0) {
			stepX = -1;
			sideDistX = (cam.x - mapX) * deltaDistX;
		} else {
			stepX = +1;
			sideDistX = (mapX + 1.0 - cam.x) * deltaDistX;
		}
		if (rayDirY < 0) {
			stepY = -1;
			sideDistY = (cam.y - mapY) * deltaDistY;
		} else {
			stepY = +1;
			sideDistY = (mapY + 1.0 - cam.y) * deltaDistY;
		}
		if (rayDirZ < 0) {
			stepZ = -1;
			sideDistZ = (cam.z - mapZ) * deltaDistZ;
		} else {
			stepZ = +1;
			sideDistZ = (mapZ + 1.0 - cam.z) * deltaDistZ;
		}
		var hit = false;
		var iters = 0;
		var abort = false;
		var side = 0;
		while (!hit) {
			if (sideDistY < sideDistX) {
				if (sideDistZ < sideDistY) {
					mapZ += stepZ;
					sideDistZ += deltaDistZ;
					side = 2;
				} else {
					mapY += stepY;
					sideDistY += deltaDistY;
					side = 1;
				}
			} else {
				if (sideDistZ < sideDistX) {
					mapZ += stepZ;
					sideDistZ += deltaDistZ;
					side = 2;
				} else {
					mapX += stepX;
					sideDistX += deltaDistX;
					side = 0;
				}
			}
			if (++iters > 4 || (mapZ > N - 1) || (mapY > N - 1) || (mapX > N - 1) || (mapZ < 0) || (mapX < 0) || (mapY < 0)) {
				hit = true;
				abort = true;
				break;
			}
			if (world[mapX][mapY][mapZ].value > 0) {
				hit = true;
				break;
			}
		}
		if (!abort) {
			var perpWallDist;
			var dx = mapX - cam.x + (1 - stepX) / 2;
			var dy = mapY - cam.y + (1 - stepY) / 2;
			var dz = mapZ - cam.z + (1 - stepZ) / 2;
			var dside2 = +1;
			if (side === 0) {
				perpWallDist = dx / rayDirX;
				dside2 = rayDirX > 0;
			} else if (side === 1) {
				perpWallDist = dy / rayDirY;
				dside2 = rayDirY > 0;
			} else {
				perpWallDist = dz / rayDirZ;
				dside2 = rayDirZ > 0;
			}
			if (perpWallDist < 4) {
				if (mouseButton === LEFT) {
					world.destroyBlock(mapX, mapY, mapZ);
				} else {
					if (side === 0) {
						mapX += rayDirX > 0 ? -1 : 1;
					} else if (side === 1) {
						mapY += rayDirY > 0 ? -1 : 1;
					} else {
						mapZ += rayDirZ > 0 ? -1 : 1;
					}
					if (mapX !== Math.floor(cam.x) || mapY !== Math.floor(cam.y) || (mapZ !== Math.floor(cam.z) && mapZ !== Math.floor(cam.z + 1))) {
						world[mapX][mapY][mapZ].value = 1;
					}
				}
			}
		}
	}
	var newx = cam.x,
		newy = cam.y,
		newz = cam.z;
	newz += zvel;
	var spd = 0.1;
	if (isSprinting) {
		spd = 0.15;
	}
	if (keys.f) {
		zvel = -0.5;
	}
	if (keys.w) {
		newx += xyCt * spd;
		newy += xySt * spd;
	}
	if (keys.s) {
		newx -= xyCt * spd;
		newy -= xySt * spd;
	}
	if (keys.d) {
		newx -= xySt * spd;
		newy += xyCt * spd;
	}
	if (keys.a) {
		newx += xySt * spd;
		newy -= xyCt * spd;
	}
	if (keys.i) {
		raytraceLighting = !raytraceLighting;
	}
	//newz = constrain(newz, 0.01, N - 0.01 + 10);
	var testx = newx + (newx - cam.x) * 2;
	var testy = newy + (newy - cam.y) * 2;
	var tx = Math.floor(testx),
		ty = Math.floor(testy),
		tz = Math.floor(newz);
	var rx = Math.floor(cam.x),
		ry = Math.floor(cam.y),
		rz = Math.floor(cam.z);
	tz = constrain(tz, 0, N - 1);
	if (world.getValueAt(rx, ry, tz + 1) === 0) {
		cam.z = newz;
		rz = tz;
		zvel += 0.005;
	} else {
		zvel = 0;
		if (keys[" "]) {
			zvel = -0.12;
		}
	}
	if (world.getValueAt(rx, ty, rz) === 0 && world.getValueAt(rx, ty, rz + 1) === 0) {
		cam.y = newy;
		ry = ty;
	}
	if (world.getValueAt(tx, ry, rz) === 0 && world.getValueAt(tx, ry, rz + 1) === 0) {
		cam.x = newx;
		rx = tx;
	}
	cam.rotXY += (mouseX - pmouseX) / 40 * SENSITIVITY;
	cam.rotZ += (mouseY - pmouseY) / 40 * SENSITIVITY;
	cam.rotZ = constrain(cam.rotZ, -Math.PI * 5.8 / 12, Math.PI * 5.8 / 12);
	fill(255);
	text(this.__frameRate, 40, 20);
	isMouseClicked = false;
	if (cam.z > N + 20) {
		cam.z = 15;
		cam.x = 15;
		cam.y = 15;
	}
};
mouseClicked = function() {
	isMouseClicked = true;
	PointerLockAPI(function(Pointer) {
		if (Pointer.Supported) {
			Pointer.Lock();
		}
	});
};
