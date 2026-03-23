import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;
  
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  pwd: string;

  @Column({ name: 'foto_perfil', type: 'text', nullable: true })
  fotoPerfil: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ name: 'birth_day', type: 'date', nullable: true })
  birthDay: string;

  @Column({ length: 10, default: 'user' })
  role: string;

  @Column({ name: 'selfie_real_time', type: 'text', nullable: true })
  selfieRealTime: string;

  @Column({ name: 'status_verif', length: 20, default: 'pending' })
  statusVerif: string;

  @Column({ type: 'double precision', nullable: true })
  lat: number;

  @Column({ type: 'double precision', nullable: true })
  lng: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'google_id', nullable: true })
  googleId: string;
}