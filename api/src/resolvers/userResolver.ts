import 'reflect-metadata';
import { Arg, Args, Mutation, Query, Resolver } from 'type-graphql';
import { MongoRepository } from 'typeorm';
import User from '../entities/user';
import {
    CreateUserInput,
    CreateUserMutationResponse,
    GetUsersArgs,
} from '../types/userTypes';
import KafkaProducer from '../utils/kafkaProducer';

@Resolver(User)
class UserResolver {
    constructor(
        private readonly userRepository: MongoRepository<User>,
        private readonly producer: KafkaProducer,
    ) {}

    @Query(() => [User])
    async users(@Args() { skip, take }: GetUsersArgs): Promise<User[]> {
        const users = await this.userRepository.find({ skip, take });

        return users;
    }

    @Mutation(() => CreateUserMutationResponse)
    createUser(
        @Arg('newUserData') newUserData: CreateUserInput,
    ): CreateUserMutationResponse {
        this.producer.sendMessage(newUserData);

        return {
            code: '201',
            success: true,
            message: 'Created',
            uuid: newUserData.uuid,
        };
    }
}

export default UserResolver;
