import { Account } from "src/accounts/entities/account.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    type: 'deposit'| 'withdraw' | 'transfer';

    @Column('decimal', { precision: 12, scale: 2 })
    amount: string;

    @ManyToOne(() => Account, (account) => account.transactions)
    account: Account;

    @Column({ nullable: true })
    targetAccountId?: string;

    @Column({ default: 'completed' })
    status: string;

    @CreateDateColumn()
    createdAt: Date;
}
