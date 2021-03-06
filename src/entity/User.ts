import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
  ManyToMany,
  // JoinColumn,
} from "typeorm";
import { ObjectType, Field, Int } from "type-graphql";
import { Message } from "./Message";
import { Channel } from "./Channel";
import { Linker } from "./Linker";

@ObjectType()
@Entity("users")
export class User extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("text", { nullable: false, unique: true })
  email: string;

  @Field()
  @Column("text", { nullable: false, unique: true })
  username: string;

  @Column("text", { nullable: false })
  password: string;

  @Column("bool", { default: false })
  confirmed: boolean;

  @Column("int", { default: 0 })
  tokenVersion: number;

  @Field()
  @Column("text", { default: "https://i.imgur.com/7lIcAP5.gif" })
  image: string;

  @Field(() => [Linker], { nullable: true })
  @OneToMany(() => Linker, (linker) => linker.user, { onDelete: "CASCADE" })
  linkers: Linker[];

  @Field(() => [Message], { nullable: true })
  @OneToMany(() => Message, (message) => message.user)
  messages: Message[];

  @Field(() => [Channel], { nullable: true })
  @ManyToMany(() => Channel, (channel: Channel) => channel.users)
  channels: Channel[];
}
