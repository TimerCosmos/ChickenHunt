import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
@Component({
  selector: 'app-game',
  standalone: false,
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss'
})
export class GameComponent implements OnInit {
  @ViewChild('canvasContainer', { static: true }) containerRef!: ElementRef;
  degToRad = (degrees: number) => degrees * (Math.PI / 180);
  scene: THREE.Scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  textureLoader = new THREE.TextureLoader()
  ngOnInit(): void {
    this.startAnimation();
    this.sceneSettings();
  }
  sceneSettings() {
    this.containerRef.nativeElement.appendChild(this.renderer.domElement);
    this.camera.position.set(0, 0, 0);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.enabled = true;
  }
  startAnimation() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.renderer.render(this.scene, this.camera);
    }
    animate();
  }
}
