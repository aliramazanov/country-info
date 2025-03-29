import { IsMongoId } from 'class-validator';

export class UserIdParam {
  @IsMongoId({ message: 'Invalid user ID format' })
  userId: string;
}
