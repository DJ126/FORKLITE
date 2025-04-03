let camera, scene, renderer, controls, minimapCamera;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = false;
let objects = [];
let raycaster;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const npcs = [];
let prevTime = performance.now();
let bullets = [];
let currentWeapon = 'AR'; // Default weapon

document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('how-to-play-button').addEventListener('click', showHowToPlay);
document.getElementById('back-button').addEventListener('click', showStartScreen);

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('how-to-play-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    init();
    animate();
}

function showHowToPlay() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('how-to-play-screen').style.display = 'block';
}

function showStartScreen() {
    document.getElementById('how-to-play-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'block';
}

function init() {
    // Scene and Camera
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Controls
    controls = new THREE.PointerLockControls(camera, document.body);
    document.addEventListener('click', () => controls.lock(), false);
    controls.addEventListener('lock', () => console.log('Pointer locked'));
    controls.addEventListener('unlock', () => console.log('Pointer unlocked'));
    scene.add(controls.getObject());

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(200, 200, 10, 10);
    const floorMaterial = new THREE.MeshBasicMaterial({color: 0xADD8E6, wireframe: true});
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Walls
    createWall(0, 5, -50, 100, 10, 10);
    createWall(-50, 5, 0, 10, 10, 100);
    createWall(50, 5, 0, 10, 10, 100);

    // NPCs
    loadNPCModel(0, 1, -30);
    loadNPCModel(20, 1, -40);

    // Lighting
    const light = new THREE.HemisphereLight(0xffffff, 0x444444);
    light.position.set(0, 20, 0);
    scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(0, 20, 10);
    scene.add(directionalLight);

    // Minimap
    minimapCamera = new THREE.PerspectiveCamera(75, 1, 1, 1000);
    minimapCamera.position.set(0, 200, 0);
    minimapCamera.lookAt(new THREE.Vector3(0, 0, 0));

    // Event Listeners
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    document.addEventListener('click', onMouseClick, false);

    // Raycaster
    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);

    // Crosshair
    const crosshair = document.createElement('div');
    crosshair.className = 'crosshair';
    document.body.appendChild(crosshair);

    window.addEventListener('resize', onWindowResize, false);
}

function createWall(x, y, z, width, height, depth) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({color: 0x888888, wireframe: true});
    const wall = new THREE.Mesh(geometry, material);
    wall.position.set(x, y, z);
    scene.add(wall);
    objects.push(wall);
}

function loadNPCModel(x, y, z) {
    const loader = new THREE.GLTFLoader();
    loader.load('path/to/3d/model.glb', function(gltf) {
        const npc = gltf.scene;
        npc.position.set(x, y, z);
        scene.add(npc);
        npcs.push(npc);
    });
}

function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveRight = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveLeft = true;
            break;
        case 'Space':
            if (canJump === true) velocity.y += 350;
            canJump = false;
            break;
        case 'Digit1':
            currentWeapon = 'AR';
            break;
        case 'Digit2':
            currentWeapon = 'Shotgun';
            break;
        case 'Digit3':
            currentWeapon = 'Sniper';
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveRight = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveLeft = false;
            break;
    }
}

function onMouseClick(event) {
    if (event.button === 0) { // Left click
        switch (currentWeapon) {
            case 'AR':
                shootAR();
                break;
            case 'Shotgun':
                shootShotgun();
                break;
            case 'Sniper':
                shootSniper();
                break;
        }
    }
}

function shootAR() {
    const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    bullet.position.copy(controls.getObject().position);
    bullet.position.y -= 1;
    bullet.velocity = new THREE.Vector3();
    bullet.velocity.x = -Math.sin(controls.getObject().rotation.y);
    bullet.velocity.z = -Math.cos(controls.getObject().rotation.y);
    bullet.velocity.y = 0;
    bullets.push(bullet);
    scene.add(bullet);
}

function shootShotgun() {
    for (let i = 0; i < 5; i++) {
        const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        bullet.position.copy(controls.getObject().position);
        bullet.position.y -= 1;
        bullet.velocity = new THREE.Vector3();
        bullet.velocity.x = -Math.sin(controls.getObject().rotation.y + (Math.random() - 0.5) * 0.1);
        bullet.velocity.z = -Math.cos(controls.getObject().rotation.y + (Math.random() - 0.5) * 0.1);
        bullet.velocity.y = 0;
        bullets.push(bullet);
        scene.add(bullet);
    }
}

function shootSniper() {
    const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    bullet.position.copy(controls.getObject().position);
    bullet.position.y -= 1;
    bullet.velocity = new THREE.Vector3();
    bullet.velocity.x = -Math.sin(controls.getObject().rotation.y);
    bullet.velocity.z = -Math.cos(controls.getObject().rotation.y);
    bullet.velocity.y = 0;
    bullets.push(bullet);
    scene.add(bullet);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta; // gravity

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveLeft) - Number(moveRight);
    direction.normalize(); // this ensures consistent movements in all directions

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);

    controls.getObject().position.y += (velocity.y * delta); // new behavior

    if (controls.getObject().position.y < 10) {
        velocity.y = 0;
        controls.getObject().position.y = 10;
        canJump = true;
    }

    raycaster.ray.origin.copy(controls.getObject().position);
    raycaster.ray.origin.y -= 10;

    const intersections = raycaster.intersectObjects(objects);

    const onObject = intersections.length > 0;

    if (onObject === true) {
        velocity.y = Math.max(0, velocity.y);
        canJump = true;
    }

    // Update bullets
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        bullet.position.add(bullet.velocity.clone().multiplyScalar(delta * 50));
        if (bullet.position.length() > 1000) {
            scene.remove(bullet);
            bullets.splice(i, 1);
            i--;
        }
    }

    // Update minimap camera
    minimapCamera.position.set(controls.getObject().position.x, 200, controls.getObject().position.z);
    minimapCamera.lookAt(controls.getObject().position);

    renderer.render(scene, camera);
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.setViewport(0, window.innerHeight - 150, 150, 150);
    renderer.render(scene, minimapCamera);
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);

    prevTime = time;
}