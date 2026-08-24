import {
  Application,
  Assets,
  Circle,
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Sprite,
  Texture,
} from 'pixi.js';
import {
  AmbientLight,
  DirectionalLight,
  Group as ThreeGroup,
  Mesh,
  MeshPhongMaterial,
  OrthographicCamera,
  Scene as ThreeScene,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer,
} from 'three';
import { EARTH_ORBIT_ASSETS } from './assets';
import {
  AXIAL_TILT_RADIANS,
  earthRotationDeltaForOrbit,
  localSolarTimeFromRotation,
  LUNAR_SIDEREAL_ORBITS_PER_EARTH_ORBIT,
  normalizeAngle,
  orbitPosition,
  pointerToOrbitAngle,
  radiansToDegrees,
  shortestAngleDelta,
  SIDEREAL_ROTATIONS_PER_ORBIT,
  SOLAR_DAYS_PER_ORBIT,
  type OrbitGeometry,
} from './orbitMath';

const DESIGN_WIDTH = 1200;
const DESIGN_HEIGHT = 675;
const START_ANGLE = 0;
const ORBIT_SPEED = 0.01;
const KEYBOARD_ORBIT_STEP = 2 * Math.PI / 180;
const MOON_ORBIT_RADIUS_X = 94;
const MOON_ORBIT_RADIUS_Y = 42;

interface EarthOrbitState {
  orbitAngle: number;
  earthRotation: number;
  isPlaying: boolean;
  isDragging: boolean;
  orbitAngularSpeed: number;
  accumulatedEarthTurns: number;
  moonOrbitAngle: number;
  accumulatedMoonOrbits: number;
}

interface LoadedTextures {
  background: Texture;
  sun: Texture;
  orbit: Texture;
  overlay: Texture;
}

export class EarthOrbitModule {
  readonly state: EarthOrbitState = {
    orbitAngle: START_ANGLE,
    earthRotation: 0,
    isPlaying: true,
    isDragging: false,
    orbitAngularSpeed: ORBIT_SPEED,
    accumulatedEarthTurns: 0,
    moonOrbitAngle: 0,
    accumulatedMoonOrbits: 0,
  };

  private readonly app = new Application();
  private readonly scene = new Container();
  private readonly backgroundLayer = new Container();
  private readonly worldLayer = new Container();
  private readonly overlayLayer = new Container();
  private readonly earthOrbitContainer = new Container();
  private threeRenderer: WebGLRenderer | null = null;
  private threeCamera: OrthographicCamera | null = null;
  private readonly threeScene = new ThreeScene();
  private earth3D: Mesh<SphereGeometry, MeshPhongMaterial> | null = null;
  private readonly earth3DGroup = new ThreeGroup();
  private moon3D: Mesh<SphereGeometry, MeshPhongMaterial> | null = null;
  private readonly moon3DGroup = new ThreeGroup();
  private sunlight: DirectionalLight | null = null;
  private readonly orbit: OrbitGeometry = {
    centerX: DESIGN_WIDTH / 2,
    centerY: DESIGN_HEIGHT / 2,
    radiusX: 430,
    radiusY: 218,
  };
  private activePointerId: number | null = null;
  private previousPointerTime = 0;
  private destroyed = false;
  private readonly stageElement: HTMLElement;

  constructor(private readonly host: HTMLElement) {
    const stageElement = host.querySelector<HTMLElement>('.earth-orbit-v01-stage');
    if (!stageElement) throw new Error('Earth Orbit stage element is missing.');
    this.stageElement = stageElement;
  }

  async init(): Promise<void> {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.state.isPlaying = false;
      this.state.orbitAngularSpeed = 0;
    }
    await this.app.init({
      resizeTo: this.stageElement,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      backgroundAlpha: 0,
    });

    if (this.destroyed) return;
    this.app.canvas.className = 'earth-orbit-v01-canvas';
    this.app.canvas.setAttribute('aria-label', '可拖曳的地球公轉動畫');
    this.app.canvas.setAttribute('aria-description', '左右方向鍵移動地球，空白鍵播放或暫停，Home 鍵重設。');
    this.app.canvas.tabIndex = 0;
    this.app.canvas.addEventListener('keydown', this.handleKeyDown);
    this.stageElement.prepend(this.app.canvas);

    const textures = await this.loadTextures();
    if (this.destroyed) return;
    this.buildScene(textures);
    await this.buildThreeScene();
    if (this.destroyed) return;
    this.bindControls();
    this.resizeScene();
    this.renderState();
    const loading = this.host.querySelector<HTMLElement>('[data-orbit-loading]');
    if (loading) loading.hidden = true;
    this.host.dataset.orbitReady = 'true';

    this.app.renderer.on('resize', this.resizeScene, this);
    this.app.ticker.add((ticker) => {
      const deltaSeconds = Math.min(ticker.deltaMS / 1000, 0.05);
      if (this.state.isPlaying && !this.state.isDragging) {
        this.advanceOrbit(ORBIT_SPEED * deltaSeconds, ORBIT_SPEED);
      } else if (!this.state.isDragging) {
        this.state.orbitAngularSpeed = 0;
      }
      this.renderState();
    });
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.earth3D?.geometry.dispose();
    this.earth3D?.material.map?.dispose();
    this.earth3D?.material.dispose();
    this.moon3D?.geometry.dispose();
    this.moon3D?.material.dispose();
    this.threeRenderer?.dispose();
    this.threeRenderer?.domElement.remove();
    this.app.destroy({ removeView: true }, { children: true });
  }

  private async loadTextures(): Promise<LoadedTextures> {
    const [background, sun, orbit, overlay] = await Promise.all([
      Assets.load<Texture>(EARTH_ORBIT_ASSETS.background),
      Assets.load<Texture>(EARTH_ORBIT_ASSETS.sun),
      Assets.load<Texture>(EARTH_ORBIT_ASSETS.orbit),
      Assets.load<Texture>(EARTH_ORBIT_ASSETS.overlay),
    ]);
    return { background, sun, orbit, overlay };
  }

  private buildScene(textures: LoadedTextures): void {
    this.app.stage.addChild(this.scene);
    this.scene.addChild(this.backgroundLayer, this.worldLayer, this.overlayLayer);

    const background = new Sprite(textures.background);
    background.width = DESIGN_WIDTH;
    background.height = DESIGN_HEIGHT;
    this.backgroundLayer.addChild(background);

    const orbitGuide = new Sprite(textures.orbit);
    orbitGuide.anchor.set(0.5);
    orbitGuide.position.set(this.orbit.centerX, this.orbit.centerY);
    orbitGuide.width = this.orbit.radiusX * 2 + 8;
    orbitGuide.height = this.orbit.radiusY * 2 + 8;

    const sun = new Sprite(textures.sun);
    sun.anchor.set(0.5);
    sun.position.set(this.orbit.centerX, this.orbit.centerY);
    sun.width = 178;
    sun.height = 178;

    const axis = new Graphics()
      .moveTo(0, -72).lineTo(0, 72).stroke({ color: 0xc7efff, width: 2.5, alpha: 0.92 })
      .circle(0, -72, 4).fill({ color: 0xe4f8ff })
      .circle(0, 72, 4).fill({ color: 0xe4f8ff });
    axis.rotation = AXIAL_TILT_RADIANS;

    axis.zIndex = 2;

    const moonOrbitGuide = new Graphics()
      .ellipse(0, 0, MOON_ORBIT_RADIUS_X, MOON_ORBIT_RADIUS_Y)
      .stroke({ color: 0xdbe7ff, width: 2.25, alpha: 0.78 });
    moonOrbitGuide.zIndex = 1;

    this.earthOrbitContainer.sortableChildren = true;
    this.earthOrbitContainer.addChild(moonOrbitGuide, axis);
    this.earthOrbitContainer.eventMode = 'static';
    this.earthOrbitContainer.cursor = 'grab';
    this.earthOrbitContainer.hitArea = new Circle(0, 0, 68);
    this.earthOrbitContainer.on('pointerdown', this.handlePointerDown, this);

    this.worldLayer.addChild(orbitGuide, sun, this.earthOrbitContainer);

    const overlay = new Sprite(textures.overlay);
    overlay.width = DESIGN_WIDTH;
    overlay.height = DESIGN_HEIGHT;
    overlay.eventMode = 'none';
    this.overlayLayer.addChild(overlay);

    this.app.stage.eventMode = 'static';
    this.app.stage.on('pointermove', this.handlePointerMove, this);
    this.app.stage.on('pointerup', this.handlePointerUp, this);
    this.app.stage.on('pointerupoutside', this.handlePointerUp, this);
  }

  private async buildThreeScene(): Promise<void> {
    const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = 'earth-orbit-v01-three-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    this.stageElement.append(renderer.domElement);
    this.threeRenderer = renderer;

    const camera = new OrthographicCamera(
      -DESIGN_WIDTH / 2,
      DESIGN_WIDTH / 2,
      DESIGN_HEIGHT / 2,
      -DESIGN_HEIGHT / 2,
      0.1,
      2000,
    );
    camera.position.set(0, 0, 1000);
    camera.lookAt(0, 0, 0);
    this.threeCamera = camera;

    const earthMap = await new TextureLoader().loadAsync(EARTH_ORBIT_ASSETS.earthSurface);
    earthMap.colorSpace = SRGBColorSpace;
    earthMap.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

    const earth = new Mesh(
      new SphereGeometry(50, 64, 40),
      new MeshPhongMaterial({
        map: earthMap,
        color: 0xffffff,
        emissive: 0x02060d,
        shininess: 8,
        specular: 0x183754,
      }),
    );
    this.earth3D = earth;
    this.earth3DGroup.rotation.z = -AXIAL_TILT_RADIANS;
    this.earth3DGroup.add(earth);
    this.threeScene.add(this.earth3DGroup);

    const moon = new Mesh(
      new SphereGeometry(15.5, 40, 28),
      new MeshPhongMaterial({ color: 0xc8cbd0, emissive: 0x050608, shininess: 2, specular: 0x25282d }),
    );
    this.moon3D = moon;
    this.moon3DGroup.add(moon);
    this.threeScene.add(this.moon3DGroup);

    const ambient = new AmbientLight(0x52709a, 0.16);
    const sunlight = new DirectionalLight(0xffffff, 2.7);
    sunlight.position.set(0, 0, 0);
    sunlight.target = this.earth3DGroup;
    this.sunlight = sunlight;
    this.threeScene.add(ambient, sunlight);
    this.resizeThreeScene();
  }

  private readonly resizeScene = (): void => {
    const screen = this.app.screen;
    const scale = Math.min(screen.width / DESIGN_WIDTH, screen.height / DESIGN_HEIGHT);
    this.scene.scale.set(scale);
    this.scene.position.set(
      (screen.width - DESIGN_WIDTH * scale) / 2,
      (screen.height - DESIGN_HEIGHT * scale) / 2,
    );
    this.app.stage.hitArea = new Rectangle(0, 0, screen.width, screen.height);
    this.resizeThreeScene();
  };

  private resizeThreeScene(): void {
    if (!this.threeRenderer || !this.threeCamera) return;
    const width = this.stageElement.clientWidth;
    const height = this.stageElement.clientHeight;
    if (!width || !height) return;
    this.threeRenderer.setSize(width, height, false);
    const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
    const viewportWidth = DESIGN_WIDTH * scale;
    const viewportHeight = DESIGN_HEIGHT * scale;
    const offsetX = (width - viewportWidth) / 2;
    const offsetY = (height - viewportHeight) / 2;
    this.threeRenderer.setViewport(offsetX, offsetY, viewportWidth, viewportHeight);
    this.threeRenderer.setScissor(offsetX, offsetY, viewportWidth, viewportHeight);
    this.threeRenderer.setScissorTest(true);
  }

  private readonly handlePointerDown = (event: FederatedPointerEvent): void => {
    event.stopPropagation();
    this.activePointerId = event.pointerId;
    this.state.isDragging = true;
    this.state.isPlaying = false;
    this.previousPointerTime = event.timeStamp;
    this.earthOrbitContainer.cursor = 'grabbing';
    this.updateAngleFromPointer(event);
  };

  private readonly handlePointerMove = (event: FederatedPointerEvent): void => {
    if (!this.state.isDragging || event.pointerId !== this.activePointerId) return;
    this.updateAngleFromPointer(event);
  };

  private readonly handlePointerUp = (event: FederatedPointerEvent): void => {
    if (!this.state.isDragging || event.pointerId !== this.activePointerId) return;
    this.updateAngleFromPointer(event);
    this.activePointerId = null;
    this.state.isDragging = false;
    this.state.orbitAngularSpeed = 0;
    this.earthOrbitContainer.cursor = 'grab';
    this.renderState();
  };

  private updateAngleFromPointer(event: FederatedPointerEvent): void {
    const point = this.worldLayer.toLocal(event.global);
    const nextAngle = pointerToOrbitAngle(point, this.orbit);
    const delta = shortestAngleDelta(nextAngle, this.state.orbitAngle);
    const deltaSeconds = Math.max((event.timeStamp - this.previousPointerTime) / 1000, 1 / 120);
    this.previousPointerTime = event.timeStamp;
    // Dragging is a position scrubber, not elapsed simulated time. Moving Earth
    // around the orbit must not make the globe spin hundreds of turns or make
    // the Moon jump through many months in a single pointer movement.
    this.state.orbitAngle = normalizeAngle(this.state.orbitAngle + delta);
    this.state.orbitAngularSpeed = delta / deltaSeconds;
    this.renderState();
  }

  private advanceOrbit(delta: number, angularSpeed: number): void {
    this.state.orbitAngle = normalizeAngle(this.state.orbitAngle + delta);
    this.state.earthRotation = normalizeAngle(this.state.earthRotation + earthRotationDeltaForOrbit(delta));
    this.state.accumulatedEarthTurns += (delta / (Math.PI * 2)) * SIDEREAL_ROTATIONS_PER_ORBIT;
    this.state.moonOrbitAngle = normalizeAngle(this.state.moonOrbitAngle + delta * LUNAR_SIDEREAL_ORBITS_PER_EARTH_ORBIT);
    this.state.accumulatedMoonOrbits += (delta / (Math.PI * 2)) * LUNAR_SIDEREAL_ORBITS_PER_EARTH_ORBIT;
    this.state.orbitAngularSpeed = angularSpeed;
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.state.isPlaying = false;
      const delta = event.key === 'ArrowRight' ? KEYBOARD_ORBIT_STEP : -KEYBOARD_ORBIT_STEP;
      this.advanceOrbit(delta, 0);
      this.renderState();
      return;
    }
    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      this.state.isPlaying = !this.state.isPlaying;
      this.state.orbitAngularSpeed = this.state.isPlaying ? ORBIT_SPEED : 0;
      this.renderState();
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      this.resetState();
    }
  };

  private resetState(): void {
    this.state.orbitAngle = START_ANGLE;
    this.state.earthRotation = 0;
    this.state.isPlaying = false;
    this.state.isDragging = false;
    this.state.orbitAngularSpeed = 0;
    this.state.accumulatedEarthTurns = 0;
    this.state.moonOrbitAngle = 0;
    this.state.accumulatedMoonOrbits = 0;
    this.activePointerId = null;
    this.renderState();
  }

  private bindControls(): void {
    this.host.querySelector<HTMLElement>('[data-orbit-action="toggle"]')?.addEventListener('click', () => {
      this.state.isPlaying = !this.state.isPlaying;
      this.state.orbitAngularSpeed = this.state.isPlaying ? ORBIT_SPEED : 0;
      this.renderState();
    });
    this.host.querySelector<HTMLElement>('[data-orbit-action="play"]')?.addEventListener('click', () => {
      this.state.isPlaying = true;
      this.state.orbitAngularSpeed = ORBIT_SPEED;
      this.renderState();
    });
    this.host.querySelector<HTMLElement>('[data-orbit-action="pause"]')?.addEventListener('click', () => {
      this.state.isPlaying = false;
      this.state.orbitAngularSpeed = 0;
      this.renderState();
    });
    this.host.querySelector<HTMLElement>('[data-orbit-action="reset"]')?.addEventListener('click', () => {
      this.resetState();
    });
    const tips = this.host.querySelector<HTMLElement>('[data-orbit-tips]');
    const tipsToggle = this.host.querySelector<HTMLElement>('[data-orbit-action="tips"]');
    const setTipsVisibility = (visible: boolean): void => {
      if (tips) tips.hidden = !visible;
      if (tipsToggle) tipsToggle.hidden = visible;
    };
    this.host.querySelector<HTMLElement>('[data-orbit-action="tips"]')?.addEventListener('click', () => {
      setTipsVisibility(true);
    });
    this.host.querySelector<HTMLElement>('[data-orbit-action="close-tips"]')?.addEventListener('click', () => {
      setTipsVisibility(false);
    });
    setTipsVisibility(!tips?.hidden);
  }

  private renderState(): void {
    const position = orbitPosition(this.state.orbitAngle, this.orbit);
    this.earthOrbitContainer.position.set(position.x, position.y);
    const earthX = position.x - DESIGN_WIDTH / 2;
    const earthY = DESIGN_HEIGHT / 2 - position.y;
    const moonX = Math.cos(this.state.moonOrbitAngle) * MOON_ORBIT_RADIUS_X;
    const moonY = Math.sin(this.state.moonOrbitAngle) * MOON_ORBIT_RADIUS_Y;
    this.earth3DGroup.position.set(earthX, earthY, 0);
    this.moon3DGroup.position.set(
      earthX + moonX,
      earthY - moonY,
      Math.sin(this.state.moonOrbitAngle) * 28,
    );
    if (this.earth3D) {
      // A real 3D rotation of the sphere; no 2D tile offset or wrap-around is used.
      this.earth3D.rotation.y = -this.state.earthRotation;
    }
    if (this.moon3D) {
      this.moon3D.rotation.y = -this.state.moonOrbitAngle;
    }
    if (this.sunlight) {
      this.sunlight.target = this.earth3DGroup;
    }
    if (this.threeRenderer && this.threeCamera) {
      this.threeRenderer.render(this.threeScene, this.threeCamera);
    }

    const angleOutput = this.host.querySelector<HTMLOutputElement>('[data-orbit-angle]');
    const rotationOutput = this.host.querySelector<HTMLOutputElement>('[data-earth-rotation]');
    const statusOutput = this.host.querySelector<HTMLOutputElement>('[data-orbit-status]');
    const orbitSpeedOutput = this.host.querySelector<HTMLOutputElement>('[data-orbit-speed]');
    const earthSpeedOutput = this.host.querySelector<HTMLOutputElement>('[data-earth-speed]');
    const earthTurnsOutput = this.host.querySelector<HTMLOutputElement>('[data-earth-turns]');
    const orbitDaysOutput = this.host.querySelector<HTMLOutputElement>('[data-orbit-days]');
    const speedRatioOutput = this.host.querySelector<HTMLOutputElement>('[data-speed-ratio]');
    const moonAngleOutput = this.host.querySelector<HTMLOutputElement>('[data-moon-angle]');
    const moonOrbitsOutput = this.host.querySelector<HTMLOutputElement>('[data-moon-orbits]');
    const localTimeOutput = this.host.querySelector<HTMLOutputElement>('[data-local-time]');
    const playButton = this.host.querySelector<HTMLButtonElement>('[data-orbit-action="play"]');
    const pauseButton = this.host.querySelector<HTMLButtonElement>('[data-orbit-action="pause"]');
    const toggleButton = this.host.querySelector<HTMLButtonElement>('[data-orbit-action="toggle"]');
    if (angleOutput) angleOutput.value = `${radiansToDegrees(this.state.orbitAngle)}°`;
    if (rotationOutput) rotationOutput.value = `${radiansToDegrees(this.state.earthRotation)}°`;
    if (statusOutput) statusOutput.value = this.state.isDragging ? '拖曳中' : this.state.isPlaying ? '自動公轉中' : '停在目前位置';
    if (orbitSpeedOutput) orbitSpeedOutput.value = `${(this.state.orbitAngularSpeed * 180 / Math.PI).toFixed(1)}°/秒`;
    if (earthSpeedOutput) earthSpeedOutput.value = `${(this.state.orbitAngularSpeed * SIDEREAL_ROTATIONS_PER_ORBIT * 180 / Math.PI).toFixed(1)}°/秒`;
    if (earthTurnsOutput) earthTurnsOutput.value = `${this.state.accumulatedEarthTurns.toFixed(2)} 圈`;
    if (orbitDaysOutput) {
      const orbitDays = (this.state.accumulatedEarthTurns / SIDEREAL_ROTATIONS_PER_ORBIT) * SOLAR_DAYS_PER_ORBIT;
      orbitDaysOutput.value = `${Math.floor(orbitDays)} 天`;
    }
    if (speedRatioOutput) speedRatioOutput.value = `${SIDEREAL_ROTATIONS_PER_ORBIT.toFixed(2)} : 1（${SOLAR_DAYS_PER_ORBIT.toFixed(2)} 日/年）`;
    if (moonAngleOutput) moonAngleOutput.value = `${radiansToDegrees(this.state.moonOrbitAngle)}°`;
    if (moonOrbitsOutput) moonOrbitsOutput.value = `${this.state.accumulatedMoonOrbits.toFixed(2)} 圈`;
    if (localTimeOutput) {
      const localTime = localSolarTimeFromRotation(this.state.earthRotation);
      const timeText = `${String(localTime.hour).padStart(2, '0')}:${String(localTime.minute).padStart(2, '0')}`;
      localTimeOutput.value = `${localTime.isDaytime ? '☀️' : '🌙'} ${timeText}`;
    }
    if (playButton) playButton.disabled = this.state.isPlaying;
    if (pauseButton) pauseButton.disabled = !this.state.isPlaying;
    if (toggleButton) {
      toggleButton.textContent = this.state.isPlaying ? 'Ⅱ 暫停' : '▶ 繼續播放';
      toggleButton.setAttribute('aria-pressed', String(this.state.isPlaying));
    }
  }
}
