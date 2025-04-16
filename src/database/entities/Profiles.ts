import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    BaseEntity,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    OneToOne,
    PrimaryColumn,
} from "typeorm";
import { Bots } from "./Bots";
import { ActivityLogs, LogAction, LogStatus } from "./ActivityLogs";
import { ProfileSettings } from "./ProfileSettings";
import { PaymentMethods } from "./PaymentMethods";
import { BillingHistory } from "./Billing";

@Entity()
export class Profiles extends BaseEntity {
    @PrimaryColumn({
        name: 'supabase_uid',
        type: 'uuid' // UUID format dari Supabase
    })
    supabase_uid!: string;

    @Column({ nullable: true })
    name?: string;

    @Column({ unique: true })
    email!: string;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;

    @UpdateDateColumn({ type: "timestamp", nullable: true })
    updated_at?: Date;

    @OneToMany(() => Bots, (bot) => bot.user)
    bots?: Bots[];

    @OneToMany(() => ActivityLogs, (log) => log.profileRelation)
    logs?: ActivityLogs[];

    @OneToOne(() => ProfileSettings, (settings) => settings.user)
    settings?: ProfileSettings;

    @OneToMany(() => PaymentMethods, (payment) => payment.user)
    payment_methods?: PaymentMethods[];

    @OneToMany(() => BillingHistory, (billing) => billing.user)
    billing_history?: BillingHistory[];

    constructor(partial: Partial<Profiles> = {}) {
        super();
        Object.assign(this, partial);
    }

    // Helper methods
    async logActivity(
        action: LogAction,
        details?: string,
        status: LogStatus = "success"
    ): Promise<ActivityLogs> {
        return await ActivityLogs.createLog(
            action,
            this.supabase_uid,
            undefined,
            details,
            status
        );
    }

    // toJSON(): Partial<Users> {
    //     const { password, ...userWithoutPassword } = this;
    //     return userWithoutPassword;
    // }

    // Static helper methods
    // static async findByEmail(
    //     email: string,
    //     includePassword: boolean = false
    // ): Promise<Users | null> {
    //     return await Users.findOne({
    //         where: { email },
    //         select: includePassword
    //             ? ["id", "name", "email", "password", "created_at"]
    //             : ["id", "name", "email", "created_at"],
    //     });
    // }

    static async findByIdWithBots(supabase_uid: string): Promise<Profiles | null> {
        return await Profiles.findOne({
            where: { supabase_uid },
            relations: ["bots"],
            select: ["supabase_uid", "name", "email", "created_at"],
        });
    }

    static async findBysupabase_uidWithLogs(supabase_uid: string): Promise<Profiles | null> {
        return await Profiles.findOne({
            where: { supabase_uid },
            relations: ["logs"],
            select: ["supabase_uid", "name", "email", "created_at"],
        });
    }

    static async findBysupabase_uidWithAll(supabase_uid: string): Promise<Profiles | null> {
        return await Profiles.findOne({
            where: { supabase_uid },
            relations: [
                "bots",
                "logs",
                "settings",
                "payment_methods",
                "billing_history",
            ],
            select: ["supabase_uid", "name", "email", "created_at"],
        });
    }

    static async findBysupabase_uidWithSettings(supabase_uid: string): Promise<Profiles | null> {
        return await Profiles.findOne({
            where: { supabase_uid },
            relations: ["settings"],
            select: ["supabase_uid", "name", "email", "created_at"],
        });
    }

    static async findBysupabase_uidWithPayments(supabase_uid: string): Promise<Profiles | null> {
        return await Profiles.findOne({
            where: { supabase_uid },
            relations: ["payment_methods", "billing_history"],
            select: ["supabase_uid", "name", "email", "created_at"],
        });
    }

    // Password methods
    // async verifyPassword(password: string): Promise<boolean> {
    //     const userWithPassword = await Users.findOne({
    //         where: { id: this.id },
    //         select: ["password"],
    //     });
    //     if (!userWithPassword?.password) return false;
    //     return await bcrypt.compare(password, userWithPassword.password);
    // }

    // async setPassword(password: string): Promise<void> {
    //     this.password = await bcrypt.hash(password, 10);
    //     await this.save();
    // }

    // Settings methods
    async getSettings(): Promise<ProfileSettings> {
        let settings = await ProfileSettings.findByUserId(this.supabase_uid);
        if (!settings) {
            settings = await ProfileSettings.createForUser(this.supabase_uid);
        }
        return settings;
    }

    // Payment methods
    async getActivePaymentMethods(): Promise<PaymentMethods[]> {
        return await PaymentMethods.findByUserId(this.supabase_uid);
    }

    async getDefaultPaymentMethod(): Promise<PaymentMethods | null> {
        return await PaymentMethods.findDefault(this.supabase_uid);
    }

    // Billing methods
    async getBillingHistory(limit: number = 10): Promise<BillingHistory[]> {
        return await BillingHistory.findByUserId(this.supabase_uid, limit);
    }

    async getTotalSpent(): Promise<number> {
        return await BillingHistory.getTotalSpent(this.supabase_uid);
    }
}
