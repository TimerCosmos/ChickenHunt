import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import * as THREE from 'three';
@Component({
  selector: 'app-game',
  standalone: false,
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements OnInit, AfterViewInit {
  @ViewChild('canvasContainer', { static: true }) containerRef!: ElementRef;
  degToRad = (degrees: number) => degrees * (Math.PI / 180);
  chickens: { wingOne: THREE.Group, wingTwo: THREE.Group, chicken: THREE.Group, wingFlap: string, SpawnedOn: number, chickenPath: string, missed: boolean, hunted: boolean }[] = []
  scene: THREE.Scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  textureLoader = new THREE.TextureLoader()
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  chickenSpawner!: Subscription;
  chickensHunted: number = 0;
  chickensMissed: number = 0;
  chickenFlightSpeed: number = 1;
  chickenSpawnInterval: number = 2000;
  ngOnInit(): void {
    this.startAnimation();
    this.sceneSettings();
    window.addEventListener('click', this.onMouseClick.bind(this), false);
    this.updateChickenSpawner(this.chickenSpawnInterval);
  }
  ngAfterViewInit(): void {

  }
  onMouseClick(event: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.chickens.map(c => c.chicken),true);
    if (intersects.length > 0) {
      const clickedObj = intersects[0].object;
      const clickedChickenIndex = this.chickens.findIndex(chicken => {
        let match = false;
        chicken.chicken.traverse(obj => {
          if (obj === clickedObj) match = true;
        });
        return match;
      });
      if (clickedChickenIndex !== -1) {
        const clickedChicken = this.chickens[clickedChickenIndex];
        this.scene.remove(clickedChicken.chicken);
        clickedChicken.hunted = true;
        this.chickensHunted += 1; 
      }
    }
  }



  sceneSettings() {
    this.containerRef.nativeElement.appendChild(this.renderer.domElement);
    this.camera.position.set(0, 0, 50);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.enabled = true;
  }
  startAnimation() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.chickens.forEach((chicken: { wingOne: THREE.Group, wingTwo: THREE.Group, chicken: THREE.Group, wingFlap: string, SpawnedOn: number, chickenPath: string, missed: boolean, hunted: boolean }) => {
        if (chicken.wingOne.rotation.x >= -3 && chicken.wingFlap == "Up") {
          chicken.wingOne.rotation.x -= 0.1
          chicken.wingTwo.rotation.x += 0.1
        } else
          chicken.wingFlap = "Down"
        if (chicken.wingOne.rotation.x <= 0 && chicken.wingFlap == "Down") {
          chicken.wingOne.rotation.x += 0.1
          chicken.wingTwo.rotation.x -= 0.1
        } else
          chicken.wingFlap = "Up"
        if (chicken.chickenPath == "Up") {
          chicken.chicken.position.y += 0.1 * this.chickenFlightSpeed
          if (chicken.chicken.position.y >= 20) {
            chicken.chickenPath = "Down"
          }
        } else {
          chicken.chicken.position.y -= 0.1 * this.chickenFlightSpeed
          if (chicken.chicken.position.y <= -10) {
            chicken.chickenPath = "Up"
          }
        }
        if (Date.now() - chicken.SpawnedOn > 10000 && !chicken.missed && !chicken.hunted) {
          this.scene.remove(chicken.chicken)
          this.chickensMissed += 1;
          chicken.missed = true;
        }

      })
      this.renderer.render(this.scene, this.camera);
    }
    animate();
  }
  spawnChickens() {
    this.chickenSpawner = interval(this.chickenSpawnInterval).subscribe(() => {
      const xPos = Math.floor(Math.random() * (43 - (-43) + 1)) + (-43)
      this.createChicken(xPos, -10, 0);
    })
  }
  updateChickenSpawner(newInterval: number) {
    if (this.chickenSpawner) {
      this.chickenSpawner.unsubscribe();
    }
    this.chickenSpawnInterval = newInterval;
    this.spawnChickens();
  }

  createChicken(x: number, y: number, z: number) {
    const chicken = new THREE.Group();
    const head = this.createBox(1, 1, 0.1, new THREE.Color('#FFFFFF'))
    const body = this.createBox(4, 1.5, 0.1, new THREE.Color('#FFFFFF'))
    const bodyDown = this.createBox(3, 0.75, 0.1, new THREE.Color('#FFFFFF'))
    const chickenBody = new THREE.Group()
    chickenBody.add(head)
    chickenBody.add(body)
    chickenBody.add(bodyDown)
    chicken.add(chickenBody);
    head.position.set(-1.5, 1.25, 0)
    bodyDown.position.set(0, -1, 0)
    const chickenBeak = this.createBox(0.75, 0.3, 0.1, new THREE.Color('#F68537'))
    chicken.add(chickenBeak);
    chickenBeak.position.set(-2, 1, 0)
    const eye = this.createBox(0.1, 0.3, 0.1, new THREE.Color('#000000'))
    eye.position.set(-1.75, 1.5, 0.15)
    const eyeTwo = eye.clone()
    eyeTwo.position.set(-1.25, 1.5, 0.15)
    chicken.add(eye);
    chicken.add(eyeTwo)
    const comb = new THREE.Group()
    const topComb = this.createBox(0.75, 0.3, 0.1, new THREE.Color('#ED3500'))
    comb.add(topComb)
    const bottomComb = topComb.clone()
    comb.add(bottomComb)
    topComb.position.set(0.3, 0.15, 0)
    chicken.add(comb)
    comb.position.set(-1.5, 1.9, 0)
    const legPart = new THREE.Group()
    const kneeOne = this.createBox(0.3, 0.6, 0.1, new THREE.Color('#F68537'))
    legPart.add(kneeOne)
    const kneeTwo = kneeOne.clone()
    legPart.add(kneeTwo)
    kneeTwo.position.set(1, 0, 0)
    const combinedLeg = this.createBox(2, 0.25, 0.1, new THREE.Color('#F68537'))
    combinedLeg.position.set(0.5, -0.4, 0.1)
    legPart.add(combinedLeg)
    chicken.add(legPart)
    legPart.position.set(-0.5, -1.5, 0)
    const wings = new THREE.Group()
    const wingOne = new THREE.Group()
    for (let i = 0; i < 5; i++) {
      const wingPart = this.createBox(2.5 - i * 0.25, 0.25, 0.1, new THREE.Color('#EAEBD0'))
      wingOne.add(wingPart)
      wingPart.position.set(-i * 0.125, -i * 0.25, 0)
    }
    wings.add(wingOne)
    wingOne.position.set(0, 0.3, 0.1)
    const wingTwo = wingOne.clone()
    wings.add(wingTwo)
    wingTwo.position.set(0, 0.3, -0.1)
    chicken.add(wings)
    this.chickens.push({ wingOne: wingOne, wingTwo: wingTwo, chicken: chicken, wingFlap: "Up", SpawnedOn: Date.now(), chickenPath: "Up", missed: false, hunted: false })
    this.scene.add(chicken)
    chicken.position.set(x, y, z);
  }

  createBox(width: number, height: number, depth: number, color: THREE.Color) {
    const box = new THREE.BoxGeometry(width, height, depth);
    const boxMaterial = new THREE.MeshBasicMaterial({ color: color });
    const boxMesh = new THREE.Mesh(box, boxMaterial);
    return boxMesh;
  }

}