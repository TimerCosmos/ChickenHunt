import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Chicken } from '../models/chicken';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  public hubConnection!: signalR.HubConnection;

  constructor() { }

  async startConnection(): Promise<void> {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5042/gamehub')
      .withAutomaticReconnect()
      .build();
    return this.hubConnection
      .start()
      .then(() => console.log('✅ SignalR Connected'))
      .catch(err => {
        console.error('❌ SignalR connection failed:', err);
        throw err;
      });
  }
  async reconnectToRoom(roomCode: string, role: string): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== signalR.HubConnectionState.Connected) {
      await this.startConnection();
    } 
    try {
      await this.hubConnection.invoke('ReconnectRoom', roomCode, role);
    } catch (err) {
    }
  }

  onStartGame(callback: (roomCode: string, players: any) => void) {
    this.hubConnection.on('StartGame', callback);
  }

  startGame(roomCode: string) {
    return this.hubConnection.invoke('StartGame', roomCode);
  }

  playerExited(roomCode : string){
    return this.hubConnection.invoke('PlayerExitedRoom', roomCode)
  }

  spawnChickens(callback: (chicken: Chicken) => void) {
    this.hubConnection.on('SpawnChicken', callback);
  }

  testConnection(){
    return this.hubConnection.invoke('TestChicken')
  }
  createRoom(role: string, roomCode: string) {
    return this.hubConnection.invoke('CreateRoom', role, roomCode);
  }

  joinRoom(code: string) {
    return this.hubConnection.invoke('JoinRoom', code);
  }

  getRoomCode() {
    return this.hubConnection.invoke('GenerateRoomCode')
  }

  // signal-r.service.ts

  // Chicken & Meat update listeners
  onUpdateKills(callback: (kills: number, id: string, score: number, levelIncrease: boolean) => void) {
    this.hubConnection.on('UpdateKills', callback);
  }

  onUpdateMeatGathered(callback: (meat: number, id: string, score: number) => void) {
    this.hubConnection.on('UpdateMeatGathered', callback);
  }

  onUpdateMeatMissed(callback: (missedMeat: number, id: string) => void) {
    this.hubConnection.on('UpdateMeatMissed', callback);
  }

  onUpdateMissedChickens(callback: (missed: number, id: string) => void) {
    this.hubConnection.on('UpdateMissedChickens', callback);
  }

  onUpdateCartPosition(callback: (direction : string, keyAction : boolean) => void) {
    this.hubConnection.on('UpdateCartPos', callback)
  }

  onGameOver(callback: () => void) {
    this.hubConnection.on('GameOver', callback);
  }
  onPlayerDisconnected(callback: (role: string) => void) {
    this.hubConnection.on("PlayerDisconnected", callback);
  }

  onPlayerExit(callback : (role : string) => void){
    this.hubConnection.on("PlayerExited", callback)
  }

  // Send events
  chickenKilled(roomCode: string, id: string) {
    return this.hubConnection.invoke('ChickenKilled', roomCode, id);
  }

  chickenMissed(roomCode: string, id: string) {
    return this.hubConnection.invoke('ChickensMissed', roomCode, id);
  }

  meatGathered(roomCode: string, id: string) {
    return this.hubConnection.invoke('MeatGathered', roomCode, id);
  }

  meatMissed(roomCode: string, id: string) {
    return this.hubConnection.invoke('MeatMissed', roomCode, id);
  }

  moveCart(roomCode: string, direction: string, keyAction: boolean) {
    return this.hubConnection.invoke('MoveCart', roomCode, direction, keyAction)
  }
}
