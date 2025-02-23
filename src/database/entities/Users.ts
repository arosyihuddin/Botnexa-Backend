import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, OneToMany, BeforeInsert, BeforeUpdate } from "typeorm";
import { Bots } from "./Bots";
import { ActivityLogs } from "./ActivityLogs";

@Entity()
export class Users extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    email!: string;

    @Column()
    password!: string;

    @Column({ type: "timestamp" })
    created_at!: Date;

    @Column({ type: "timestamp", nullable: true })
    updated_at!: Date;

    @OneToMany(() => Bots, (bot) => bot.user, { nullable: true })
    bots!: Bots[];

    @OneToMany(() => ActivityLogs, (activityLog) => activityLog.user)
    activityLogs!: ActivityLogs[];

    @BeforeInsert()
    updateTimestamps() {
        this.created_at = new Date();
    }

    @BeforeUpdate()
    updateTimestampsOnUpdate() {
        this.updated_at = new Date();
    }

}