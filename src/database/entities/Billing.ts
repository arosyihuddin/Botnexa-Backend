import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, ManyToOne, JoinColumn, Between } from "typeorm";
import { Profiles } from "./Profiles";
import { PaymentMethods } from "./PaymentMethods";

export type BillingStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type BillingType = 'subscription' | 'one_time' | 'refund';

@Entity()
export class BillingHistory extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    user_id!: string;

    @ManyToOne(() => Profiles)
    @JoinColumn({ name: "user_id" })
    user!: Profiles;

    @Column({ nullable: true })
    payment_method_id?: number;

    @ManyToOne(() => PaymentMethods)
    @JoinColumn({ name: "payment_method_id" })
    payment_method?: PaymentMethods;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount!: number;

    @Column({ type: 'varchar', length: 20 })
    status!: BillingStatus;

    @Column({ type: 'varchar', length: 20 })
    type!: BillingType;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    invoice_url?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    transaction_id?: string;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;

    constructor(partial: Partial<BillingHistory> = {}) {
        super();
        Object.assign(this, partial);
    }

    // Helper methods
    static async findByUserId(userId: string, limit: number = 10): Promise<BillingHistory[]> {
        return await BillingHistory.find({
            where: { user_id: userId },
            relations: ['payment_method'],
            order: { created_at: 'DESC' },
            take: limit
        });
    }

    static async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<BillingHistory[]> {
        return await BillingHistory.find({
            where: {
                user_id: userId,
                created_at: Between(startDate, endDate)
            },
            relations: ['payment_method'],
            order: { created_at: 'DESC' }
        });
    }

    static async getTotalSpent(userId: string): Promise<number> {
        const result = await BillingHistory
            .createQueryBuilder('billing')
            .select('SUM(billing.amount)', 'total')
            .where('billing.user_id = :userId', { userId })
            .andWhere('billing.status = :status', { status: 'paid' })
            .andWhere('billing.type != :type', { type: 'refund' })
            .getRawOne();

        return result?.total || 0;
    }

    // Generate invoice number
    getInvoiceNumber(): string {
        const date = this.created_at;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const id = String(this.id).padStart(6, '0');
        return `INV-${year}${month}-${id}`;
    }
}
