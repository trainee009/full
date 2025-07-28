import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Session {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
    user: User;

    @Column({ nullable: true })
    ipAddress: string;

    @Column({ nullable: true })
    userAgent: string;

    @Column({ nullable: true })
    device: string;

    @Column({ unique: true })
    refreshTokenHash: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ type: 'timestamp' })
    expiresAt: Date

    @Column({ type: 'timestamp', nullable: true })
    lastUsedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    loggedInAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    loggedOutAt: Date;

    
    @Column({ type: 'boolean', default: false })
    revoked: boolean;
}