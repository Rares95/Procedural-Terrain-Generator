class MainApp
{
    constructor()
    {
        let width = window.innerWidth;
        let height = window.innerHeight;
        let pixelRatio = window.devicePixelRatio;
        let aspect = width / height;
        this.moveX = 0;
        this.moveZ = 0;
        this.updateWait = -1;

        this.clock = new THREE.Clock(true);
        this.camera = new THREE.PerspectiveCamera(64, aspect, 0.5, 1000);
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.setSize(width, height);
        this.terrain;
        this.water;
        this.sunAngle = 0;
        this.currentResolution = 1;
        document.body.appendChild(this.renderer.domElement);

        window.onresize = (evt) =>
        {
            this.resize(window.innerWidth, window.innerHeight);
        };
    }

    resize(width, height)
    {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    start()
    {
        this.animate();
    }

    animate()
    {
        requestAnimationFrame(() => this.animate());
        this.update();
        this.render();
    }

    update()
    {
        let deltaTime = this.clock.getDelta();
        let elapsedTime = this.clock.getElapsedTime();

        if (this.moveX != 0 || this.moveZ != 0)
        {
            this.updateWait = 1;
            if (this.terrain.resolution != config.movingResolution)
            {
                this.currentResolution = config.movingResolution;
                this.scene.add(this.terrain.rebuild(this.currentResolution));
            }
        }

        if (this.updateWait < 0)
        {
            if (this.currentResolution != config.maxResolution)
            {
                this.currentResolution = config.maxResolution;
                this.scene.add(this.terrain.rebuild(this.currentResolution));
                this.terrain.simplexTerrainHeight(deltaTime);
            }
        }
        else
        {
            this.updateWait -= deltaTime;
        }

        this.terrain.simplexTerrainHeight(deltaTime);

        this.sunAngle += (deltaTime * config.sunSpeed * 360) / 180 * Math.PI;
        let lightX = this.terrain.length / 2 * Math.sin(this.sunAngle);
        let lightY = 32 + this.terrain.width / 2 * (Math.cos(this.sunAngle) > 0 ? Math.cos(this.sunAngle) * 4 : Math.cos(this.sunAngle));
        this.scene.children[0].position.set(lightX, lightY, -this.terrain.width / 2);
        this.scene.children[0].color.setHex(stringToHexColor(config.lightColor));

        this.camera.position.set(config.cameraX, config.cameraY, config.cameraZ);
        this.water.material.opacity = config.waterOpacity;
        this.water.material.color.setHex(stringToHexColor(config.waterColor));

        this.updateTerrainUniforms();
    }

    updateTerrainUniforms()
    {
        this.terrain.material.uniforms.seaSandColor = { type: "v4", value: rgba255ToVec4(config.seaSandColor) };
        this.terrain.material.uniforms.beachSandColor = { type: "v4", value: rgba255ToVec4(config.beachSandColor) };
        this.terrain.material.uniforms.grassColor = { type: "v4", value: rgba255ToVec4(config.grassColor) };
        this.terrain.material.uniforms.forestColor = { type: "v4", value: rgba255ToVec4(config.forestColor) };
        this.terrain.material.uniforms.rockColor = { type: "v4", value: rgba255ToVec4(config.rockColor) };
        this.terrain.material.uniforms.snowColor = { type: "v4", value: rgba255ToVec4(config.snowColor) };

        this.terrain.material.uniforms.seaSandHeight = { type: "f", value: config.seaSandHeight * config.biomeScale };
        this.terrain.material.uniforms.beachSandHeight = { type: "f", value: config.beachSandHeight * config.biomeScale };
        this.terrain.material.uniforms.grassHeight = { type: "f", value: config.grassHeight * config.biomeScale };
        this.terrain.material.uniforms.forestHeight = { type: "f", value: config.forestHeight * config.biomeScale };
        this.terrain.material.uniforms.rockHeight = { type: "f", value: config.rockHeight * config.biomeScale };
        this.terrain.material.uniforms.snowHeight = { type: "f", value: config.snowHeight * config.biomeScale };
    }

    render()
    {
        this.renderer.setClearColor(stringToHexColor(config.backgroundColor), 1);
        let scene = this.scene;
        let camera = this.camera;
        let renderer = this.renderer;
        renderer.render(scene, camera);
    }
}

var app;

document.onkeydown = function (e)
{
    if (e.keyCode == 37)
    {
        app.moveX = -1;
    }
    else if (e.keyCode == 39)
    {
        app.moveX = 1;
    }
    if (e.keyCode == 38)
    {
        app.moveZ = -1;
    }
    else if (e.keyCode == 40)
    {
        app.moveZ = 1;
    }
}

document.onkeyup = function (e)
{
    if (e.keyCode == 37 || e.keyCode == 39)
    {
        app.moveX = 0;
    }
    if (e.keyCode == 38 || e.keyCode == 40)
    {
        app.moveZ = 0;
    }
}

var rgba255ToVec4 = function (RGBA)
{
    return new THREE.Vector4(RGBA[0] / 255, RGBA[1] / 255, RGBA[2] / 255, RGBA[3] / 255);
}

var stringToHexColor = function (stringHex)
{
    return parseInt(stringHex.replace(/^#/, ''), 16);
}

var setup = function ()
{
    let light = new THREE.DirectionalLight(stringToHexColor(config.lightColor));
    light.position.set(1, 0.5, 0);
    app.scene.add(light);

    var uniforms =
        {
            terrainScale: { type: "f", value: config.terrainScale },
            lightPosition: { type: 'v3', value: light.position },
            seaSandColor: { type: 'v4', value: rgba255ToVec4(config.seaSandColor) },
            grassColor: { type: 'v4', value: rgba255ToVec4(config.grassColor) },
            forestColor: { type: 'v4', value: rgba255ToVec4(config.forestColor) },
            rockColor: { type: 'v4', value: rgba255ToVec4(config.rockColor) },
            seaSandHeight: { type: 'f', value: config.seaSandHeight },
            beachSandHeight: { type: 'f', value: config.beachSandHeight },
            grassHeight: { type: 'f', value: config.grassHeight },
            forestHeight: { type: 'f', value: config.forestHeight },
            rockHeight: { type: 'f', value: config.rockHeight },
            snowHeight: { type: 'f', value: config.snowHeight }
        };

    var terrainMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        wireframe: false,
        vertexShader: document.getElementById('terrain-vertexShader').textContent,
        fragmentShader: document.getElementById('terrain-fragmentShader').textContent
    });
    app.terrain = new Terrain(config.length, config.width, app.currentResolution, terrainMaterial, config.updateInterval);

    var waterMaterial = new THREE.MeshPhongMaterial({
        color: config.waterColor,
        wireframe: false,
        specular: 0xffffff,
        shininess: 4096,
        transparent: true,
        opacity: config.waterOpacity
    });
    app.water = new Terrain(config.length, config.width, 0, waterMaterial, 0);

    app.scene.add(app.water.build());
    app.scene.add(app.terrain.build());

    let camera = app.camera;
    camera.position.y = 20;
    camera.position.z = config.terrainWidth;

    var pivot = new THREE.Object3D();
    pivot.name = "pivot";
    app.scene.add(pivot);
    pivot.add(camera);
    window.onmousemove = mouseMove;
    window.onmousedown = mouseDown;
    window.onmouseup = mouseUp;
}

var mouseDragging = false;
var mouseX = false;
var mouseY = false;
var rotX = 0;
var rotY = 0;

function mouseDown(event)
{
    event = event || window.event;
    mouseDragging = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
}

function mouseUp()
{
    mouseDragging = false;
}

function mouseMove(event)
{
    if (mouseDragging)
    {
        event = event || window.event;

        var rotationSpeed = 0.003;
        rotX += (-mouseY + event.clientY) * rotationSpeed;
        rotY += (-mouseX + event.clientX) * rotationSpeed;
        app.camera.rotation.x = rotX;
        app.scene.getObjectByName("pivot").rotation.y = rotY;
        mouseX = event.clientX;
        mouseY = event.clientY;
    }
}

var Config = function ()
{
    this.cameraX = 0;
    this.cameraY = 20;
    this.cameraZ = 32;

    this.noiseLevels = 4;
    this.movingResolution = 1;
    this.maxResolution = 5;
    this.terrainScale = 10;
    this.seed = Math.floor(Math.random() * 10000000) + "abc";
    this.length = 64;
    this.width = 64;
    this.rebuild = function ()
    {
        app.terrain.length = this.length;
        app.terrain.width = this.width;
        app.scene.add(app.terrain.rebuild(this.maxResolution));
        app.terrain.simplexTerrainHeight(app.clock.getDelta());

        app.water.length = this.length;
        app.water.width = this.width;
        app.scene.add(app.water.rebuild());
    };

    this.easeIn = false;
    this.easeInOutQuad = false;
    this.easeInOutCubic = false;
    this.logaritmic = false;
    this.isqrt = false;
    this.sqrt = false;
    this.floor = false;
    this.longerBeaches = false;
    this.dampenUnderwaterHeight = true;
    this.moreWater = false;

    this.biomeScale = 1.2;
    this.seaSandHeight = -0.5;
    this.beachSandHeight = 0.1;
    this.grassHeight = 0.25;
    this.forestHeight = 0.5;
    this.rockHeight = 0.8;
    this.snowHeight = 1.0;

    this.backgroundColor = "#7ec0ee";
    this.waterColor = "#2244ff";
    this.waterOpacity = 0.33;
    this.lightColor = "#ffffdd";
    this.seaSandColor = [100, 100, 75, 255];
    this.beachSandColor = [200, 200, 160, 255];
    this.grassColor = [25, 150, 25, 255];
    this.forestColor = [25, 100, 25, 255];
    this.rockColor = [32, 32, 40, 255];
    this.snowColor = [225, 225, 225, 255];

    this.movementSpeed = 20;
    this.updateInterval = 30;
    this.sunSpeed = 0.33;
}
var config = new Config();

var getUpdateInterval = function ()
{
    return 1 / config.updateInterval;
}

window.onload = function ()
{

    let gui = new dat.GUI();
    config.instruction = "Mouse drag to rotate";

    let cameraFolder = gui.addFolder("Camera");
    cameraFolder.add(config, 'cameraX').name("Camera X");
    cameraFolder.add(config, 'cameraY').name("Camera Y");
    cameraFolder.add(config, 'cameraZ').name("Camera Z");

    let terrainFolder = gui.addFolder("Terrain Geometry");
    terrainFolder.open();
    terrainFolder.add(config, 'length', 1, 1028).name("Terrain Length");
    terrainFolder.add(config, 'width', 1, 1028).name("Terrain Width");
    terrainFolder.add(config, 'rebuild').name("Rebuild Terrain");
    terrainFolder.add(config, 'noiseLevels', 1, 32).name("Noise Levels");
    terrainFolder.add(config, 'movingResolution', 0, 7).name("Moving Resolution");
    terrainFolder.add(config, 'maxResolution', 0, 15).name("Max Resolution");
    terrainFolder.add(config, 'terrainScale').name("Terrain Scale");
    terrainFolder.add(config, 'seed').name("Simplex Seed");

    let terrainBiomeLevels = gui.addFolder("Terrain Biome Levels");
    terrainBiomeLevels.open();
    terrainBiomeLevels.add(config, 'biomeScale').name("Biome Scale");
    terrainBiomeLevels.add(config, 'seaSandHeight', -1, 0).name("Sea Sand Height");
    terrainBiomeLevels.add(config, 'beachSandHeight', 0, 1).name("Beach Height");
    terrainBiomeLevels.add(config, 'grassHeight', 0, 1).name("Grass Height");
    terrainBiomeLevels.add(config, 'forestHeight', 0, 1).name("Forest Height");
    terrainBiomeLevels.add(config, 'rockHeight', 0, 1).name("Rock Height");
    terrainBiomeLevels.add(config, 'snowHeight', 0, 1).name("Snow Height");

    let terrainModifiers = gui.addFolder("Terrain Modifiers");
    terrainModifiers.add(config, 'easeIn').name("Ease In");
    terrainModifiers.add(config, 'easeInOutQuad').name("Ease InOut Quad");
    terrainModifiers.add(config, 'easeInOutCubic').name("Ease InOut Cubic");
    terrainModifiers.add(config, 'logaritmic').name("Logarithmic");
    terrainModifiers.add(config, 'isqrt').name("Inverse Sqrt");
    terrainModifiers.add(config, 'sqrt').name("Square Root");
    terrainModifiers.add(config, 'floor').name("Floor");
    terrainModifiers.add(config, 'longerBeaches').name("Longer Beaches");
    terrainModifiers.add(config, 'dampenUnderwaterHeight').name("Dampen Water Height");
    terrainModifiers.add(config, 'moreWater').name("More Water");

    let colors = gui.addFolder("Colors");
    colors.open();
    colors.addColor(config, 'backgroundColor').name("Background Color");
    colors.addColor(config, 'waterColor').name("Water Color");
    colors.add(config, 'waterOpacity', 0, 1).name("Water Opacity");
    colors.addColor(config, 'lightColor').name("Light Color");
    colors.addColor(config, 'seaSandColor').name("Sea Sand Color");
    colors.addColor(config, 'beachSandColor').name("Beach Color");
    colors.addColor(config, 'grassColor').name("Grass Color");
    colors.addColor(config, 'forestColor').name("Forest Color");
    colors.addColor(config, 'rockColor').name("Rock Color");
    colors.addColor(config, 'snowColor').name("Snow Color");

    gui.add(config, 'movementSpeed', 0.1, 256).name("Move Speed");
    gui.add(config, 'sunSpeed', -5, 5).name("Sun Speed");
    gui.add(config, 'updateInterval', 0, 60).name("Updates/second");

    app = new MainApp();
    setup();
    app.start();
}