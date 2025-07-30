import { Account } from "src/accounts/entities/account.entity";
import { Session } from "src/sessions/entity/session.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Account, (account) => account.owner)
    accounts: Account[];

    @OneToMany(() => Session, (session) => session.user)
    sessions: Session[];

    @Column({ default: false })
    changePassword: boolean;
}
