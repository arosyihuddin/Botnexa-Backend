import { BaseEntity, BeforeInsert, Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Users } from "./Users";

@Entity()
export class ActivityLogs extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    action!: string;

    @Column({ type: "timestamp" })
    created_at!: Date;

    @ManyToOne(() => Users, (users) => users.activityLogs)
    user!: number;

    @BeforeInsert()
    updateTimestamps() {
        this.created_at = new Date();
    }
}