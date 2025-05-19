import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, DeleteDateColumn } from "typeorm";
import { ActivityLogs, LogAction, LogStatus } from "./ActivityLogs";
import { Profiles } from "./Profiles";

export interface BotSettings {
    enableAutoReply: boolean;
    replyDelay: number;
    customReply: string;
    enableNotifications: boolean;
    notifyOnMessage: boolean;
    notifyOnConnect: boolean;
}

const defaultSettings: BotSettings = {
    enableAutoReply: false,
    replyDelay: 0,
    customReply: "",
    enableNotifications: true,
    notifyOnMessage: true,
    notifyOnConnect: true
};

@Entity()
export class Bots extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    number!: string;

    @Column({ type: "boolean", default: false })
    isConnected!: boolean;

    @Column()
    description?: string;

    @Column({
        type: "json",
        nullable: true,
        default: defaultSettings
    })
    settings!: BotSettings;

    @Column({ nullable: true })
    userId?: string;

    @ManyToOne(() => Profiles, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: "userId" })
    user?: Profiles;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;

    @DeleteDateColumn({ type: "timestamp", nullable: true })
    deleted_at!: Date;

    @UpdateDateColumn({ type: "timestamp", nullable: true })
    updated_at!: Date;

    @OneToMany(() => ActivityLogs, log => log.botRelation)
    logs?: ActivityLogs[];

    constructor(partial: Partial<Bots> = {}) {
        super();
        Object.assign(this, {
            isConnected: false,
            settings: defaultSettings,
            ...partial
        });
    }

    // Helper methods
    async updateSettings(newSettings: Partial<BotSettings>): Promise<void> {
        this.settings = {
            ...this.settings,
            ...newSettings
        };
        await this.save();
    }

    async connect(): Promise<void> {
        this.isConnected = true;
        await this.save();
        if (this.userId) {
            await this.logActivity('connect', 'Bot connected');
        }
    }

    async disconnect(): Promise<void> {
        this.isConnected = false;
        await this.save();
        if (this.userId) {
            await this.logActivity('disconnect', 'Bot disconnected');
        }
    }

    async logActivity(action: LogAction, details?: string, status: LogStatus = 'success'): Promise<ActivityLogs | undefined> {
        if (!this.userId) return;
        return await ActivityLogs.createLog(
            action,
            this.userId,
            this.id,
            details,
            status
        );
    }

    // Static helper methods
    static async findByUserId(userId: string): Promise<Bots[]> {
        return await Bots.find({
            where: { userId },
            relations: ['user']
        });
    }

    static async findByIdWithLogs(id: number): Promise<Bots | null> {
        return await Bots.findOne({
            where: { id },
            relations: ['logs', 'user']
        });
    }

    static async findByIdWithUser(id: number): Promise<Bots | null> {
        return await Bots.findOne({
            where: { id },
            relations: ['user']
        });
    }

    static async findByIdWithAll(id: number): Promise<Bots | null> {
        return await Bots.findOne({
            where: { id },
            relations: ['user', 'logs']
        });
    }
}
