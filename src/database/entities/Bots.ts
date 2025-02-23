import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, Index, ManyToOne, Join, BeforeInsert, BeforeUpdate } from "typeorm";
import { Users } from "./Users";

@Entity()
@Index("idx_user_id", ["user"])
export class Bots extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ nullable: true })
    description?: string;

    @Column()
    number!: string;

    @Column({ nullable: true, default: false })
    isConnected!: boolean;

    @Column("jsonb", { nullable: true })
    auth!: object;

    @Column({ type: "timestamp" })
    created_at!: Date;

    @Column({ type: "timestamp", nullable: true })
    updated_at!: Date;

    @ManyToOne(() => Users, (users) => users.bots)
    user!: number;

    @BeforeInsert()
    updateTimestamps() {
        this.created_at = new Date();
    }

    @BeforeUpdate()
    updateTimestampsOnUpdate() {
        this.updated_at = new Date();
    }
}