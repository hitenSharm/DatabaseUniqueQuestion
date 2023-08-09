// contact.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('contact') // Specify the table name
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'phone_number', nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ name: 'linked_id', nullable: true })
  linkedId: number;

  @Column({ name: 'link_precedence' })
  linkPrecedence: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt: Date;
}
