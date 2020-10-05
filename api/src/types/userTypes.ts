import { Max, MaxLength, Min, MinLength } from 'class-validator';
import 'reflect-metadata';
import { ArgsType, Field, InputType, Int, ObjectType } from 'type-graphql';

@InputType({ description: 'Create user input' })
class CreateUserInput {
    @Field({ description: 'UUID of user' })
    @MinLength(1)
    uuid: string;

    @Field()
    @MaxLength(30)
    firstName: string;

    @Field()
    @MaxLength(30)
    lastName: string;

    @Field()
    emailAddress: string;

    @Field()
    phoneNumber: string;

    @Field()
    role: string;
}

@ArgsType()
class GetUsersArgs {
    @Field(() => Int)
    @Min(0)
    skip? = 0;

    @Field(() => Int)
    @Min(1)
    @Max(50)
    take? = 25;
}

@ObjectType()
class CreateUserMutationResponse {
    @Field()
    code: string;

    @Field()
    success: boolean;

    @Field()
    message: string;

    @Field()
    uuid: string;
}

export { CreateUserInput, GetUsersArgs, CreateUserMutationResponse };
