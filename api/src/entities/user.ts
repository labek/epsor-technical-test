import { Field, ID, ObjectType } from 'type-graphql';
import {
    Entity,
    BaseEntity,
    Column,
    PrimaryColumn,
    ObjectIdColumn,
} from 'typeorm';

@Entity('users')
@ObjectType()
class User extends BaseEntity {
    @Field()
    @ObjectIdColumn()
    _id: string;

    @Field(() => ID)
    @PrimaryColumn()
    uuid: string;

    @Field()
    @Column()
    firstName: string;

    @Field()
    @Column()
    lastName: string;

    @Field()
    @Column()
    emailAddress: string;

    @Field()
    @Column()
    phoneNumber: string;

    @Field()
    @Column()
    role: string;
}

export default User;
