import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import * as THREE from 'three';
import { Chicken } from '../models/chicken';
import { SignalRService } from '../services/signal-r.service';
@Component({
  selector: 'app-game',
  standalone: false,
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements OnInit {
  @ViewChild('canvasContainer', { static: true }) containerRef!: ElementRef;
  degToRad = (degrees: number) => degrees * (Math.PI / 180);
  chickens: { wingOne: THREE.Group, wingTwo: THREE.Group, chicken: THREE.Group, wingFlap: string, SpawnedOn: number, chickenPath: string, missed: boolean, hunted: boolean, id: string }[] = []
  meat: { meat: THREE.Group, caught: boolean, missed: boolean, id: string }[] = []
  feathers: THREE.Mesh[] = [];
  cart: THREE.Group = new THREE.Group()
  scene: THREE.Scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  textureLoader = new THREE.TextureLoader()
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  Score: number = 0;
  chickenSpawner!: Subscription;
  chickensHunted: number = 0;
  chickensMissed: number = 0;
  meatMissed: number = 0;
  meatGathered: number = 0;
  chickenFlightSpeed: number = 1;
  clock = new THREE.Clock();
  pause: boolean = false;
  gameOver: boolean = false;
  roomCode!: string;
  pressedKeys: Set<string> = new Set<string>()
  role!: string;
  otherPlayerDisconnected: boolean = false;
  playerExited : boolean = false;
  constructor(private router: Router, private signalRService: SignalRService) {
    const role = sessionStorage.getItem('Role')
    if (role != null) {
      this.role = role;
    }
    const roomCode = sessionStorage.getItem('RoomCode')
    if (roomCode != null) {
      this.roomCode = roomCode
    }
  }
  boundMouseClick!: (event: MouseEvent) => void;
  boundKeydown!: (event: KeyboardEvent) => void;
  boundKeyUp!: (event: KeyboardEvent) => void;
  //Initialized various receive methods from backend
  backEndRequests() {

    this.signalRService.hubConnection.on("SpawnChicken", (chicken:any) => {
      this.createChicken(chicken.xPos, chicken.yPos, chicken.zPos, chicken.id)
    })

    this.signalRService.onUpdateKills((kills, id, score, levelIncrease) => {
      this.chickensHunted = kills;
      this.Score = score;
      const chicken = this.chickens.filter(c => c.id == id)[0].chicken
      const pos = new THREE.Vector3();
      chicken.getWorldPosition(pos);
      this.createFeatherExplosion(pos);
      this.createMeat(pos, id)
      this.scene.remove(chicken)
      if (levelIncrease) {
        this.chickenFlightSpeed *= 1.2;
      }
    });

    this.signalRService.onUpdateMissedChickens((missed, id) => {
      const chicken = this.chickens.filter(c => c.id == id)[0]
      chicken.missed = true
      this.scene.remove(chicken.chicken)
      this.chickensMissed = missed;
    });

    this.signalRService.onUpdateMeatGathered((meat, id, score) => {
      this.Score = score;
      const meats = this.meat.filter(m => m.id == id)[0]
      this.scene.remove(meats.meat)
      meats.caught = true;
      this.meatGathered = meat;
    });

    this.signalRService.onUpdateMeatMissed((missedMeat, id) => {
      const meats = this.meat.filter(m => m.id == id)[0]
      this.scene.remove(meats.meat)
      meats.missed = true;
      this.meatMissed = missedMeat;
    });

    this.signalRService.onUpdateCartPosition((direction, action) => {
      if (action == true) {
        this.pressedKeys.add(direction)
      } else {
        this.pressedKeys.delete(direction)
      }
    })

    this.signalRService.onGameOver(() => {
      this.gameOver = true;
    })

    this.signalRService.onPlayerDisconnected((role: string) => {
      this.otherPlayerDisconnected = true;
    });

    this.signalRService.onPlayerExit((role : string) => {
      this.playerExited = true;
    })
  }
  async ngOnInit() {
    await this.signalRService.reconnectToRoom(this.roomCode, this.role)
    if(this.role == "Hunter"){
      await this.signalRService.startGame(this.roomCode)
    }
    this.startAnimation();
    this.sceneSettings();
    this.roleBasedEventListenersActivation();
    this.addKeyBoardEventListeners();
    this.createCart();
    this.backEndRequests();
  }
  //Activates controls based on the role
  roleBasedEventListenersActivation() {
    if (this.role == "Hunter") {
      this.boundMouseClick = this.onMouseClick.bind(this);
      window.addEventListener('click', this.boundMouseClick, false);
    } else {
      this.boundKeydown = this.onKeyDown.bind(this);
      window.addEventListener('keydown', this.boundKeydown);
      this.boundKeyUp = this.onKeyUp.bind(this)
      window.addEventListener('keyup', this.boundKeyUp)
    }
  }
  //KeyBoard events, up and down
  onKeyUp(event: KeyboardEvent) {
    if (event.code == "ArrowLeft" || event.code == "KeyA") {
      this.signalRService.moveCart(this.roomCode, "Left", false)
    } else if (event.code == "ArrowRight" || event.code == "KeyD") {
      this.signalRService.moveCart(this.roomCode, "Right", false)
    }
  }
  onKeyDown(event: KeyboardEvent) {
    if (event.code == "ArrowLeft" || event.code == "KeyA") {
      this.signalRService.moveCart(this.roomCode, "Left", true)
    } else if (event.code == "ArrowRight" || event.code == "KeyD") {
      this.signalRService.moveCart(this.roomCode, "Right", true)
    }
  }
  //Creates feather explosion beside a hunted chicken
  createFeatherExplosion(position: THREE.Vector3, count: number = 5) {
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.PlaneGeometry(0.5, 0.5);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.9, });
      const feather = new THREE.Mesh(geometry, material);
      feather.position.copy(position);
      const velocity = new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2);
      feather.userData = {
        velocity,
        life: 1.5,
      };
      this.scene.add(feather);
      this.feathers.push(feather);
    }
  }
  //Activates esc for pause
  addKeyBoardEventListeners() {
    window.addEventListener('keydown', (event) => {
      if (event.code == 'Escape')
        this.pause = !this.pause
    })
  }
  //Control for hunter
  onMouseClick(event: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const unHuntedChickenGroups = this.chickens.filter(c => !c.hunted).map(c => c.chicken);
    const intersects = this.raycaster.intersectObjects(unHuntedChickenGroups, true);
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
        clickedChicken.hunted = true;
        this.signalRService.chickenKilled(this.roomCode, clickedChicken.id);
      }
    }
  }
  //Basic scene settings
  sceneSettings() {
    this.containerRef.nativeElement.appendChild(this.renderer.domElement);
    this.camera.position.set(0, 0, 50);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.enabled = true;
  }
  //Starts animation - cart position, chicken and meat position, feather explosion handles meat gathered, chicken missed and meat missed
  startAnimation() {
    const animate = () => {
      requestAnimationFrame(animate);
      if (this.pressedKeys.has("Left")) {
        this.cart.position.x -= 0.5
      }
      if (this.pressedKeys.has("Right")) {
        this.cart.position.x += 0.5
      }
      this.cart.position.x = THREE.MathUtils.clamp(this.cart.position.x, -43, 43);
      this.chickens.forEach((chicken: { wingOne: THREE.Group, wingTwo: THREE.Group, chicken: THREE.Group, wingFlap: string, SpawnedOn: number, chickenPath: string, missed: boolean, hunted: boolean, id: string }) => {
        if (chicken.missed || chicken.hunted) return;
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
        if (Date.now() - chicken.SpawnedOn > 10000) {
          this.signalRService.chickenMissed(this.roomCode, chicken.id)
        }

      })
      const delta = this.clock.getDelta();
      for (let i = this.feathers.length - 1; i >= 0; i--) {
        const feather = this.feathers[i];
        feather.position.addScaledVector(feather.userData['velocity'], delta);
        feather.userData['velocity'].y -= delta * 2; // gravity
        feather.userData['life'] -= delta;
        if (feather.userData['life'] <= 0) {
          this.scene.remove(feather);
          this.feathers.splice(i, 1);
        }
      }
      this.meat.forEach((meat) => {
        if (meat.caught || meat.missed) return;
        const meatPos = meat.meat.position
        const cartPos = this.cart.position
        if (meatPos.distanceTo(cartPos) < 2) {
          this.signalRService.meatGathered(this.roomCode, meat.id)
          return;
        }
        if (meat.meat.position.y >= -15) {
          meat.meat.position.y -= 0.1;
          meat.meat.rotation.z += 0.05;
        } else {
          this.signalRService.meatMissed(this.roomCode, meat.id)
        }
      });

      this.renderer.render(this.scene, this.camera);
    }
    animate();
  }
  //Creates chicken at certain pos and id
  createChicken(x: number, y: number, z: number, id: string) {
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
    this.chickens.push({ wingOne: wingOne, wingTwo: wingTwo, chicken: chicken, wingFlap: "Up", SpawnedOn: Date.now(), chickenPath: "Up", missed: false, hunted: false, id: id })
    this.scene.add(chicken)
    chicken.position.set(x, y, z);
  }
  //creates meat id at certain pos
  createMeat(pos: THREE.Vector3, id: string) {
    const meat = new THREE.Group()
    const meatSmallTopPart = this.createBox(0.5, 0.3, 0.1, new THREE.Color('#954C2E'))
    const meatMiddlePart = this.createBox(0.75, 0.75, 0.1, new THREE.Color('#954C2E'))
    const meatDownPart = meatSmallTopPart.clone()
    const meatBone = this.createBox(0.2, 0.5, 0.1, new THREE.Color('#FFFFFF'))
    const boneBox = this.createBox(0.25, 0.25, 0.1, new THREE.Color('#FFFFFF'))
    const boneTwoBox = boneBox.clone();
    meat.add(meatSmallTopPart)
    meat.add(meatMiddlePart)
    meat.add(meatDownPart)
    const bone = new THREE.Group()
    bone.add(meatBone)
    bone.add(boneBox)
    bone.add(boneTwoBox)
    boneBox.position.set(-0.2, 0.35, 0)
    boneTwoBox.position.set(0.2, 0.35, 0)
    meat.add(bone)
    bone.position.set(0, 0.9, 0)
    meatSmallTopPart.position.set(0, 0.5, 0)
    meatDownPart.position.set(0, -0.5, 0)
    this.scene.add(meat)
    meat.position.copy(pos);
    this.meat.push({ meat: meat, missed: false, caught: false, id: id })
  }
  //Creates a random box with specifications
  createBox(width: number, height: number, depth: number, color: THREE.Color) {
    const box = new THREE.BoxGeometry(width, height, depth);
    const boxMaterial = new THREE.MeshBasicMaterial({ color: color });
    const boxMesh = new THREE.Mesh(box, boxMaterial);
    return boxMesh;
  }
  //Creates cart to gather meat
  createCart() {
    const texture = this.textureLoader.load('assets/GathererIcon.png');
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide, });
    const geometry = new THREE.PlaneGeometry(10, 10);
    const mesh = new THREE.Mesh(geometry, material);
    this.cart.add(mesh)
    this.scene.add(this.cart)
    this.cart.position.set(0, -11, 0)
  }
  //Exits game
  exitGame() {
    this.signalRService.playerExited(this.roomCode);
    this.router.navigate(['/MainMenu'])
  }

}