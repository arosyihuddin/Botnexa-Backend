import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Profiles } from "./Profiles";
import { Bots } from "./Bots";

// Export types for other files to use
export type LogAction = 'create' | 'update' | 'delete' | 'connect' | 'disconnect' | 'update_settings' | 'message' | 'login';
export type LogStatus = 'success' | 'error' | 'pending';

@Entity()
export class ActivityLogs extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: "varchar",
        nullable: true,
        length: 50
    })
    action!: LogAction;

    @Column({ nullable: true })
    user_id!: string;

    @ManyToOne(() => Profiles)
    @JoinColumn({ name: "profile" })
    profileRelation?: Profiles;

    @Column({ nullable: true })
    bot?: number;

    @ManyToOne(() => Bots)
    @JoinColumn({ name: "bot" })
    botRelation?: Bots;

    @Column({ type: "text", nullable: true })
    details?: string;

    @Column({
        type: "varchar",
        length: 20,
        default: 'success'
    })
    status!: LogStatus;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;

    constructor(partial: Partial<ActivityLogs> = {}) {
        super();
        Object.assign(this, {
            status: 'success' as LogStatus,
            ...partial
        });
    }

    static async createLog(
        action: LogAction,
        userId: string,
        botId?: number,
        details?: string,
        status: LogStatus = 'success'
    ): Promise<ActivityLogs> {
        const log = new ActivityLogs({
            action,
            user_id: userId,
            bot: botId,
            details,
            status
        });
        return await log.save();
    }

    // Helper methods
    static async findByUser(userId: string): Promise<ActivityLogs[]> {
        return await ActivityLogs.find({
            where: { user_id: userId },
            relations: ['userRelation', 'botRelation'],
            order: { created_at: 'DESC' }
        });
    }

    static async findByBot(botId: number): Promise<ActivityLogs[]> {
        return await ActivityLogs.find({
            where: { bot: botId },
            relations: ['userRelation', 'botRelation'],
            order: { created_at: 'DESC' }
        });
    }

    static async findByAction(action: LogAction): Promise<ActivityLogs[]> {
        return await ActivityLogs.find({
            where: { action },
            relations: ['userRelation', 'botRelation'],
            order: { created_at: 'DESC' }
        });
    }

    static async findByStatus(status: LogStatus): Promise<ActivityLogs[]> {
        return await ActivityLogs.find({
            where: { status },
            relations: ['userRelation', 'botRelation'],
            order: { created_at: 'DESC' }
        });
    }
}
