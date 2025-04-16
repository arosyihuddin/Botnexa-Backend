import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from "typeorm";
import { Profiles } from './Profiles';

export type NotificationPreference = {
    email: {
        botStatus: boolean;
        security: boolean;
        billing: boolean;
    };
    push: {
        botConnection: boolean;
        newMessages: boolean;
    };
};

export type ThemePreference = 'light' | 'dark' | 'system';
export type LanguagePreference = 'en' | 'id';

@Entity()
export class ProfileSettings extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    user_id!: string;

    @OneToOne(() => Profiles)
    @JoinColumn({ name: "user_id" })
    user!: Profiles;

    @Column({ type: 'simple-json', nullable: true })
    notification_preferences?: NotificationPreference;

    @Column({ type: 'varchar', length: 10, default: 'system' })
    theme!: ThemePreference;

    @Column({ type: 'varchar', length: 5, default: 'en' })
    language!: LanguagePreference;

    @Column({ type: 'boolean', default: true })
    two_factor_enabled!: boolean;

    @Column({ type: 'varchar', length: 32, nullable: true })
    two_factor_secret?: string;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updated_at!: Date;

    constructor(partial: Partial<ProfileSettings> = {}) {
        super();
        Object.assign(this, {
            notification_preferences: {
                email: {
                    botStatus: true,
                    security: true,
                    billing: true
                },
                push: {
                    botConnection: true,
                    newMessages: true
                }
            },
            ...partial
        });
    }

    // Helper methods
    static async findByUserId(userId: string): Promise<ProfileSettings | null> {
        return await ProfileSettings.findOne({
            where: { user_id: userId }
        });
    }

    static async createForUser(userId: string): Promise<ProfileSettings> {
        const settings = new ProfileSettings({ user_id: userId });
        return await settings.save();
    }
}
