import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Profiles } from "./Profiles";

export type CardType = 'visa' | 'mastercard' | 'amex';
export type PaymentMethodStatus = 'active' | 'expired' | 'deleted';

@Entity()
export class PaymentMethods extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    user_id!: string;

    @ManyToOne(() => Profiles)
    @JoinColumn({ name: "user_id" })
    user!: Profiles;

    @Column({ type: 'varchar', length: 20 })
    card_type!: CardType;

    @Column({ type: 'varchar', length: 4 })
    last_four!: string;

    @Column({ type: 'varchar', length: 10 })
    expiry_date!: string;

    @Column({ type: 'boolean', default: false })
    is_default!: boolean;

    @Column({ type: 'varchar', length: 20, default: 'active' })
    status!: PaymentMethodStatus;

    @Column({ type: 'text', nullable: true })
    token?: string;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updated_at!: Date;

    constructor(partial: Partial<PaymentMethods> = {}) {
        super();
        Object.assign(this, partial);
    }

    // Helper methods
    static async findByUserId(userId: string): Promise<PaymentMethods[]> {
        return await PaymentMethods.find({
            where: {
                user_id: userId,
                status: 'active'
            }
        });
    }

    static async findDefault(userId: string): Promise<PaymentMethods | null> {
        return await PaymentMethods.findOne({
            where: {
                user_id: userId,
                is_default: true,
                status: 'active'
            }
        });
    }

    async setAsDefault(): Promise<void> {
        // Remove default from other payment methods
        await PaymentMethods.update(
            { user_id: this.user_id },
            { is_default: false }
        );

        // Set this as default
        this.is_default = true;
        await this.save();
    }

    async softDelete(): Promise<void> {
        this.status = 'deleted';
        await this.save();
    }
}
