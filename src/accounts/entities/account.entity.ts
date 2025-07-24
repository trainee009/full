import { Transaction } from "src/transactions/entities/transaction.entity";
import { User } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Account {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    accountNumber: number;

    @ManyToOne(() => User, (user) => user.accounts)
    owner: User;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    balance: string;

    @Column({ default: 'checking' })
    accountType: 'checking' | 'saving';

    @Column({ default: 'active' })
    status: string;

    @OneToMany(() => Transaction, (transaction) => transaction.account)
    transactions: Transaction[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
