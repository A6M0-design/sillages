/*
 * Le film du monogramme a un fond noir, sans transparence. Ici on le dessine dans un canvas WebGL où le noir devient
 * transparent (la luminosité sert d'opacité, comme un mode « screen » qui marcherait sur n'importe quel fond) :
 * le film peut alors voyager au-dessus des films du hero sans montrer son cadre noir.
 * Le reflet au sol peut être effacé seul (`cut`, `refl`).
 */

const VS = `attribute vec2 p; varying vec2 s;
void main(){ s = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const FS = `precision mediump float;
uniform sampler2D t; uniform vec2 k; uniform float cut, refl, soft; varying vec2 s;
void main(){
  vec2 uv = 0.5 + (s - 0.5) * k;                 // cadrage « cover »
  vec3 c = texture2D(t, vec2(uv.x, 1.0 - uv.y)).rgb;
  float a = max(c.r, max(c.g, c.b));             // noir = transparent
  float y = 1.0 - s.y;                           // 0 en haut de l'écran
  float m = mix(1.0, refl, smoothstep(cut, cut + soft, y));
  gl_FragColor = vec4(c, a) * m;                 // couleurs prémultipliées
}`;

/** Renvoie { el, setCut(px, r), destroy } ou `null` sans WebGL. `vw`/`vh` : taille du film en px. */
export function createFilmGL(video, host, vw, vh) {
  const el = document.createElement("canvas");
  el.className = "loader__film-gl";
  const gl = el.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;
  host.appendChild(el);

  const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { el.remove(); return null; }
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const ap = gl.getAttribLocation(pr, "p");
  gl.enableVertexAttribArray(ap);
  gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const u = (n) => gl.getUniformLocation(pr, n);
  const uK = u("k"), uCut = u("cut"), uRefl = u("refl"), uSoft = u("soft");
  let cut = 2, refl = 1, H = 1;

  function size() {
    const W = host.clientWidth; H = host.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    el.width = Math.round(W * dpr); el.height = Math.round(H * dpr);
    gl.viewport(0, 0, el.width, el.height);
    const c = Math.max(W / vw, H / vh);
    gl.uniform2f(uK, W / (vw * c), H / (vh * c));
    gl.uniform1f(uSoft, 6 / H);
  }
  size();

  let raf = 0, alive = true;
  function frame() {
    if (!alive) return;
    if (video.readyState >= 2) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
      gl.uniform1f(uCut, cut); gl.uniform1f(uRefl, refl);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    raf = requestAnimationFrame(frame);
  }
  frame();

  return {
    el,
    /** Efface le reflet sous `px` (bas du monogramme, en px depuis le haut) : `r` de 1 (entier) à 0 (effacé). */
    setCut(px, r) { cut = px / H; refl = r; },
    destroy() { alive = false; cancelAnimationFrame(raf); gl.getExtension("WEBGL_lose_context")?.loseContext(); el.remove(); },
  };
}
