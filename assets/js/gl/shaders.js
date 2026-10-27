/* Shaders GLSL : médias synchronisés au DOM, fond liquide des univers, dissolution en grain. */

const noise = /* glsl */ `
  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec2 mod289(vec2 x){return x-floor(x*(1./289.))*289.;}
  vec3 permute(vec3 x){return mod289(((x*34.)+1.)*x);}
  float snoise(vec2 v){
    const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
    vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
    vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
    vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod289(i);
    vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
    vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.); m=m*m; m=m*m;
    vec3 x=2.*fract(p*C.www)-1.; vec3 h=abs(x)-.5; vec3 ox=floor(x+.5); vec3 a0=x-ox;
    m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
    vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;
    return 130.*dot(m,g);
  }
  float fbm(vec2 p){ float f=0.; float a=.5; for(int i=0;i<4;i++){ f+=a*snoise(p); p*=2.03; a*=.5; } return f; }
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
`;

const cover = /* glsl */ `
  vec2 coverUv(vec2 uv, vec2 plane, vec2 img){
    float rp = plane.x/plane.y; float ri = img.x/img.y;
    vec2 s = rp < ri ? vec2(rp/ri, 1.) : vec2(1., ri/rp);
    return (uv - .5) * s + .5;
  }
`;

/* ─── Médias (triptyque) : cadrage, ombrage du repli, apparition. Aucun effet de couleur. ─── */
export const mediaVert = /* glsl */ `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
  }
`;

export const mediaFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex;
  uniform vec2 uPlane;
  uniform vec2 uImg;
  uniform float uZoom;
  uniform float uAlpha;
  uniform float uShade;
  varying vec2 vUv;
  ${cover}
  void main(){
    vec2 uv = (vUv - .5) / uZoom + .5;
    vec3 col = texture2D(uTex, coverUv(uv, uPlane, uImg)).rgb;
    // le volet qui se replie s'assombrit vers son arête extérieure, comme une vraie lumière rasante
    col *= 1. - uShade;
    gl_FragColor = vec4(col, uAlpha);
  }
`;

/* ─── Fond liquide de la liste des univers ─── */
export const liquidVert = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }
`;

export const liquidFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uA;
  uniform sampler2D uB;
  uniform vec2 uImgA;
  uniform vec2 uImgB;
  uniform vec2 uPlane;
  uniform vec2 uMouse;     // 0..1, origine en bas à gauche
  uniform float uMix;      // A → B
  uniform float uFull;
  uniform float uShow;     // apparition globale
  uniform float uTime;
  uniform float uDim;
  uniform float uZoom;
  uniform vec2 uClip;      // haut / bas visibles en px (repère écran)
  uniform float uDpr;
  uniform vec2 uView;
  varying vec2 vUv;
  ${noise}
  ${cover}
  float front(vec2 uv, float p, float seed){
    vec2 asp = vec2(uPlane.x / uPlane.y, 1.);
    float d = distance(uv * asp, uMouse * asp);
    float n = fbm(uv * 1.6 + vec2(seed, uTime * .05)) * .06;
    float r = p * 2.7 - .35;
    return 1. - smoothstep(-.14, .14, d + n - r);
  }
  void main(){
    float y = uView.y - gl_FragCoord.y / uDpr;
    if (y < uClip.x || y > uClip.y) discard;
    vec2 uv = vUv;
    float mB = front(uv, uMix, 3.1);
    float mS = front(uv, uShow, 7.7);
    // léger parallaxe avec le curseur, neutralisé pendant la transition
    vec2 drift = (uMouse - .5) * .02 * (1. - uFull);
    vec2 wob = vec2(0.);
    vec2 ua = coverUv((uv - .5) * uZoom + .5 - drift + wob, uPlane, uImgA);
    vec2 ub = coverUv((uv - .5) * (uZoom + .06 * (1. - uMix)) + .5 - drift + wob, uPlane, uImgB);
    vec3 a = texture2D(uA, ua).rgb;
    vec3 b = texture2D(uB, ub).rgb;
    vec3 col = mix(a, b, mB);
    col *= 1. - uDim;
    gl_FragColor = vec4(col, mS);
  }
`;
